package com.oblms.backend.controller;

import com.oblms.backend.model.CourseRequest;
import com.oblms.backend.model.User;
import com.oblms.backend.repository.CourseRequestRepository;
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
    public CourseRequest createRequest(@RequestBody CourseRequest request) {
        request.setStatus("Pending");
        request.setRequestedAt(new Date());
        return courseRequestRepository.save(request);
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

        return ResponseEntity.ok(Map.of("message", "Enrollment approved and updated in database", "request", req));
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
        if (body != null && body.containsKey("remarks")) {
            req.setRemarks(body.get("remarks"));
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

        return ResponseEntity.ok(Map.of("message", "Enrollment request rejected", "request", req));
    }
}
