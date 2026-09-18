package com.oblms.backend.controller;

import com.oblms.backend.model.AppNotification;
import com.oblms.backend.model.CourseRequest;
import com.oblms.backend.model.User;
import com.oblms.backend.repository.CourseRequestRepository;
import com.oblms.backend.repository.NotificationRepository;
import com.oblms.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/courses/requests")
@CrossOrigin(origins = "*")
public class CourseRequestController {

    @Autowired
    private CourseRequestRepository courseRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping
    public List<CourseRequest> getAllRequests() {
        return courseRequestRepository.findAll();
    }

    @GetMapping("/student/{studentId}")
    public List<CourseRequest> getStudentRequests(@PathVariable String studentId) {
        List<CourseRequest> list = courseRequestRepository.findByStudentId(studentId);
        if (list.isEmpty()) {
            list = courseRequestRepository.findByStudentEmailIgnoreCase(studentId);
        }
        return list;
    }

    @PostMapping
    public ResponseEntity<?> createRequest(@RequestBody CourseRequest request) {
        try {
            if (request.getStatus() == null || request.getStatus().trim().isEmpty()) {
                request.setStatus("Pending");
            }
            if (request.getRequestedAt() == null) {
                request.setRequestedAt(new Date());
            }

            // Check if identical request is already pending to avoid duplicates
            if (request.getStudentId() != null && request.getCourseCode() != null) {
                List<CourseRequest> existing = courseRequestRepository.findByStudentId(request.getStudentId());
                boolean alreadyPending = existing.stream().anyMatch(r -> 
                    "Pending".equalsIgnoreCase(r.getStatus()) && 
                    request.getCourseCode().equalsIgnoreCase(r.getCourseCode())
                );
                if (alreadyPending) {
                    return ResponseEntity.ok(Map.of("message", "Enrollment request already pending", "status", "Pending"));
                }
            }

            CourseRequest saved = courseRequestRepository.save(request);

            try {
                // Notify Admin of new request
                String sName = saved.getStudentName() != null ? saved.getStudentName() : "Student";
                String sDept = saved.getDepartment() != null ? saved.getDepartment() : "General";
                String cTitle = saved.getCourseTitle() != null ? saved.getCourseTitle() : (saved.getCourseCode() != null ? saved.getCourseCode() : "Course");
                String cCode = saved.getCourseCode() != null ? saved.getCourseCode() : "";

                AppNotification adminNotif = new AppNotification(
                    null,
                    "ADMIN",
                    "Administrator",
                    "ADMIN",
                    "📥 New Course Enrollment Request",
                    "Student " + sName + " (" + sDept + ") has requested enrollment in " + cTitle + " [" + cCode + "].",
                    "approval",
                    "/admin/approval-management"
                );
                notificationRepository.save(adminNotif);
            } catch (Exception notifEx) {
                System.err.println("Notification save error: " + notifEx.getMessage());
            }

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(Map.of("message", "Request received", "status", "Pending"));
        }
    }

    @PutMapping("/{id}/approve")
    @Transactional
    public ResponseEntity<?> approveRequest(@PathVariable Long id) {
        Optional<CourseRequest> reqOpt = courseRequestRepository.findById(id);
        if (reqOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        CourseRequest req = reqOpt.get();
        req.setStatus("Approved");
        req.setActionDate(new Date());
        courseRequestRepository.save(req);

        // Update student enrolled courses in MySQL users table
        String targetStudentId = req.getStudentId() != null ? req.getStudentId() : req.getStudentEmail();
        if (targetStudentId != null && !targetStudentId.isEmpty()) {
            Optional<User> uOpt = userRepository.findById(targetStudentId);
            if (uOpt.isEmpty()) {
                uOpt = userRepository.findByEmailIgnoreCase(req.getStudentEmail());
            }
            if (uOpt.isEmpty() && req.getStudentName() != null) {
                uOpt = userRepository.findAll().stream()
                    .filter(u -> u.getName() != null && u.getName().equalsIgnoreCase(req.getStudentName()))
                    .findFirst();
            }

            if (uOpt.isPresent()) {
                User user = uOpt.get();
                String existing = user.getEnrolledCourses();
                Set<String> courses = new LinkedHashSet<>();
                if (existing != null && !existing.trim().isEmpty()) {
                    Arrays.stream(existing.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .forEach(courses::add);
                }
                courses.add(req.getCourseCode());
                user.setEnrolledCourses(String.join(",", courses));
                userRepository.save(user);
            }
        }

        // Send Real-Time Notification to Student
        String studentIdentifier = req.getStudentEmail() != null ? req.getStudentEmail() : req.getStudentId();
        AppNotification studentNotif = new AppNotification(
            null,
            studentIdentifier,
            req.getStudentName(),
            "STUDENT",
            "🎉 Course Enrollment Approved!",
            "Great news! Your enrollment request for \"" + req.getCourseTitle() + " (" + req.getCourseCode() + ")\" has been APPROVED by the Administrator. You can now access syllabus, lessons, and track attendance.",
            "success",
            "/courses"
        );
        notificationRepository.save(studentNotif);

        return ResponseEntity.ok(Map.of("message", "Enrollment approved, student updated, and notification delivered!", "request", req));
    }

    @PutMapping("/{id}/reject")
    @Transactional
    public ResponseEntity<?> rejectRequest(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        Optional<CourseRequest> reqOpt = courseRequestRepository.findById(id);
        if (reqOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        CourseRequest req = reqOpt.get();
        req.setStatus("Rejected");
        req.setActionDate(new Date());
        String reason = "Capacity full or prerequisites not met";
        if (body != null && body.containsKey("remarks") && !body.get("remarks").trim().isEmpty()) {
            reason = body.get("remarks").trim();
            req.setRemarks(reason);
        }
        courseRequestRepository.save(req);

        // Remove from student enrolled courses in MySQL if already present
        String targetStudentId = req.getStudentId() != null ? req.getStudentId() : req.getStudentEmail();
        if (targetStudentId != null) {
            Optional<User> uOpt = userRepository.findById(targetStudentId);
            if (uOpt.isEmpty()) {
                uOpt = userRepository.findByEmailIgnoreCase(req.getStudentEmail());
            }
            if (uOpt.isPresent()) {
                User user = uOpt.get();
                String existing = user.getEnrolledCourses();
                if (existing != null && !existing.trim().isEmpty()) {
                    Set<String> courses = new LinkedHashSet<>();
                    Arrays.stream(existing.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty() && !s.equalsIgnoreCase(req.getCourseCode()))
                        .forEach(courses::add);
                    user.setEnrolledCourses(String.join(",", courses));
                    userRepository.save(user);
                }
            }
        }

        // Send Real-Time Notification to Student
        String studentIdentifier = req.getStudentEmail() != null ? req.getStudentEmail() : req.getStudentId();
        AppNotification studentNotif = new AppNotification(
            null,
            studentIdentifier,
            req.getStudentName(),
            "STUDENT",
            "⚠️ Course Enrollment Request Rejected",
            "Your enrollment request for \"" + req.getCourseTitle() + " (" + req.getCourseCode() + ")\" was rejected by the Administrator. Reason: " + reason + ".",
            "warning",
            "/subjects"
        );
        notificationRepository.save(studentNotif);

        return ResponseEntity.ok(Map.of("message", "Enrollment request rejected and notification delivered", "request", req));
    }
}
