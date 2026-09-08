package com.oblms.backend.controller;

import com.oblms.backend.model.AppNotification;
import com.oblms.backend.model.ClassAdjustment;
import com.oblms.backend.model.User;
import com.oblms.backend.repository.ClassAdjustmentRepository;
import com.oblms.backend.repository.NotificationRepository;
import com.oblms.backend.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/class-adjustments")
@CrossOrigin(origins = "*")
public class ClassAdjustmentController {

    @Autowired
    private ClassAdjustmentRepository adjustmentRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @PostConstruct
    public void seedInitialAdjustments() {
        if (adjustmentRepository.count() == 0) {
            List<ClassAdjustment> sample = List.of(
                new ClassAdjustment(
                    null,
                    "FAC001",
                    "Prof. Ramesh Babu",
                    "FAC002",
                    "Prof. Sunita Sharma",
                    "Fluid Mechanics & Hydraulic Machinery (FMHM)",
                    "2026-09-10",
                    "09:00 AM - 10:00 AM",
                    "CE-LH-101",
                    "Please cover Reynolds Number & Boundary Layer laminar equations with numerical problem #4.",
                    "PENDING",
                    null
                ),
                new ClassAdjustment(
                    null,
                    "FAC003",
                    "Prof. Amit Patel",
                    "FAC001",
                    "Prof. Ramesh Babu",
                    "Structural Mechanics & Materials (SMSE)",
                    "2026-09-08",
                    "11:30 AM - 12:30 PM",
                    "CE-LH-102",
                    "Explain Mohr's Circle derivation and principal shear stress calculations.",
                    "PENDING",
                    null
                )
            );
            adjustmentRepository.saveAll(sample);
        }
    }

    // Get all adjustments (or filter by faculty query)
    @GetMapping
    public List<ClassAdjustment> getAllAdjustments(
            @RequestParam(required = false) String faculty,
            @RequestParam(required = false) String type) {

        List<ClassAdjustment> all = adjustmentRepository.findAll();
        if (faculty == null || faculty.trim().isEmpty()) {
            return all;
        }

        String q = faculty.trim();
        if ("incoming".equalsIgnoreCase(type)) {
            return all.stream()
                .filter(a -> (a.getSubstituteId() != null && a.getSubstituteId().equalsIgnoreCase(q)) ||
                             (a.getSubstituteName() != null && a.getSubstituteName().toLowerCase().contains(q.toLowerCase())))
                .toList();
        } else if ("outgoing".equalsIgnoreCase(type)) {
            return all.stream()
                .filter(a -> (a.getRequesterId() != null && a.getRequesterId().equalsIgnoreCase(q)) ||
                             (a.getRequesterName() != null && a.getRequesterName().toLowerCase().contains(q.toLowerCase())))
                .toList();
        }

        // Return all where faculty is either requester or substitute
        return all.stream()
            .filter(a -> (a.getSubstituteId() != null && a.getSubstituteId().equalsIgnoreCase(q)) ||
                         (a.getSubstituteName() != null && a.getSubstituteName().toLowerCase().contains(q.toLowerCase())) ||
                         (a.getRequesterId() != null && a.getRequesterId().equalsIgnoreCase(q)) ||
                         (a.getRequesterName() != null && a.getRequesterName().toLowerCase().contains(q.toLowerCase())))
            .toList();
    }

    // Create a new adjustment request
    @PostMapping
    public ResponseEntity<ClassAdjustment> createAdjustment(@RequestBody ClassAdjustment adjustment) {
        if (adjustment.getRequesterName() == null || adjustment.getSubstituteName() == null ||
            adjustment.getCourseName() == null || adjustment.getAdjustmentDate() == null ||
            adjustment.getPeriod() == null) {
            return ResponseEntity.badRequest().build();
        }

        adjustment.setStatus("PENDING");
        adjustment.setCreatedAt(LocalDateTime.now());
        ClassAdjustment saved = adjustmentRepository.save(adjustment);
        return ResponseEntity.ok(saved);
    }

    // Approve adjustment
    @PutMapping("/{id}/approve")
    public ResponseEntity<ClassAdjustment> approveAdjustment(@PathVariable Long id) {
        Optional<ClassAdjustment> opt = adjustmentRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ClassAdjustment adj = opt.get();
        adj.setStatus("APPROVED");
        adj.setRejectionReason(null);
        adj.setUpdatedAt(LocalDateTime.now());
        ClassAdjustment saved = adjustmentRepository.save(adj);

        // 1. Notify the requester faculty
        try {
            AppNotification facultyNotif = new AppNotification(
                    null,
                    adj.getRequesterId() != null ? adj.getRequesterId() : "FACULTY",
                    adj.getRequesterName(),
                    "FACULTY",
                    "✅ Class Adjustment Accepted: " + adj.getCourseName(),
                    "Prof. " + adj.getSubstituteName() + " has ACCEPTED your substitute lecture request for " + adj.getCourseName() + " on " + adj.getAdjustmentDate() + " (" + adj.getPeriod() + ").",
                    "success",
                    "/class-adjustments"
            );
            notificationRepository.save(facultyNotif);

            // 2. Notify Admin about the substitute allocation
            AppNotification adminNotif = new AppNotification(
                    null,
                    "ADMIN",
                    "Institutional Administration",
                    "ADMIN",
                    "🔄 Substitute Faculty Allocated: " + adj.getCourseName(),
                    "[Admin Notice] Prof. " + adj.getSubstituteName() + " has accepted substitute lecture coverage for " + adj.getCourseName() + " on " + adj.getAdjustmentDate() + " (" + adj.getPeriod() + ") in Room " + adj.getRoom() + " requested by Prof. " + adj.getRequesterName() + ".",
                    "info",
                    "/timetable"
            );
            notificationRepository.save(adminNotif);
        } catch (Exception e) {
            System.err.println("Failed to send approval notifications: " + e.getMessage());
        }

        return ResponseEntity.ok(saved);
    }

    // Reject adjustment (with reason)
    @PutMapping("/{id}/reject")
    public ResponseEntity<ClassAdjustment> rejectAdjustment(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        Optional<ClassAdjustment> opt = adjustmentRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ClassAdjustment adj = opt.get();
        String reason = body.getOrDefault("reason", "Unavailable due to prior academic commitment.");
        adj.setStatus("REJECTED");
        adj.setRejectionReason(reason);
        adj.setUpdatedAt(LocalDateTime.now());
        ClassAdjustment saved = adjustmentRepository.save(adj);

        // Notify requester faculty about rejection
        try {
            AppNotification facultyNotif = new AppNotification(
                    null,
                    adj.getRequesterId() != null ? adj.getRequesterId() : "FACULTY",
                    adj.getRequesterName(),
                    "FACULTY",
                    "❌ Class Adjustment Declined: " + adj.getCourseName(),
                    "Prof. " + adj.getSubstituteName() + " was unable to accept your substitute request for " + adj.getCourseName() + " on " + adj.getAdjustmentDate() + ". Reason: \"" + reason + "\"",
                    "warning",
                    "/class-adjustments"
            );
            notificationRepository.save(facultyNotif);
        } catch (Exception e) {
            System.err.println("Failed to send rejection notification: " + e.getMessage());
        }

        return ResponseEntity.ok(saved);
    }

    // Delete adjustment
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAdjustment(@PathVariable Long id) {
        adjustmentRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // Broadcast Class Adjustment Notification to Registered Students AND Admin
    @PostMapping("/{id}/notify-students")
    public ResponseEntity<?> notifyStudents(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> payload) {
        try {
            Optional<ClassAdjustment> opt = adjustmentRepository.findById(id);
            if (opt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            ClassAdjustment adj = opt.get();
            adj.setNotifiedStudents(true);
            adj.setNotifiedAt(LocalDateTime.now());
            ClassAdjustment saved = adjustmentRepository.save(adj);

            String customNote = payload != null && payload.containsKey("customNote") ? payload.get("customNote") : "";
            String courseName = adj.getCourseName();
            String title = "🔄 Class Adjustment Notice: " + courseName;

            String subFaculty = adj.getSubstituteName() != null ? adj.getSubstituteName().trim() : "Substitute Faculty";
            if (!subFaculty.toLowerCase().startsWith("prof.") && !subFaculty.toLowerCase().startsWith("dr.")) {
                subFaculty = "Prof. " + subFaculty;
            }

            StringBuilder sb = new StringBuilder();
            sb.append("Attention: Your lecture for ").append(courseName)
              .append(" on ").append(adj.getAdjustmentDate())
              .append(" (").append(adj.getPeriod()).append(")")
              .append(" in Classroom ").append(adj.getRoom())
              .append(" will be conducted by substitute faculty ").append(subFaculty).append(".");
            
            if (customNote != null && !customNote.trim().isEmpty()) {
                sb.append(" Note from Faculty: \"").append(customNote.trim()).append("\".");
            } else if (adj.getTopicInstructions() != null && !adj.getTopicInstructions().trim().isEmpty()) {
                sb.append(" Topics/Instructions: ").append(adj.getTopicInstructions().trim());
            }

            String fullMessage = sb.toString();

            // 1. Send individualized notification to all active students
            List<User> students = userRepository.findAll().stream()
                    .filter(u -> u.getRole() != null && "STUDENT".equalsIgnoreCase(u.getRole().trim()))
                    .toList();

            int deliveredCount = 0;
            for (User student : students) {
                AppNotification notif = new AppNotification(
                        null,
                        student.getId() != null ? student.getId() : student.getEmail(),
                        student.getName(),
                        "STUDENT",
                        title,
                        fullMessage,
                        "warning",
                        "/timetable"
                );
                notificationRepository.save(notif);
                deliveredCount++;
            }

            // 2. Also send broadcast notification for role STUDENT
            AppNotification broadcastStudent = new AppNotification(
                    null,
                    "ALL",
                    "All Registered Students",
                    "STUDENT",
                    title,
                    fullMessage,
                    "warning",
                    "/timetable"
            );
            notificationRepository.save(broadcastStudent);

            // 3. Send Notification to Institutional Admin
            List<User> admins = userRepository.findAll().stream()
                    .filter(u -> u.getRole() != null && "ADMIN".equalsIgnoreCase(u.getRole().trim()))
                    .toList();
            
            String adminMsg = "[Admin Notice] Faculty substitution confirmed & broadcasted: " + subFaculty + " is allocated to conduct " + courseName + " on " + adj.getAdjustmentDate() + " (" + adj.getPeriod() + ") in Room " + adj.getRoom() + " requested by " + adj.getRequesterName() + ".";
            for (User admin : admins) {
                AppNotification adminNotif = new AppNotification(
                        null,
                        admin.getId() != null ? admin.getId() : "ADMIN",
                        admin.getName(),
                        "ADMIN",
                        "🔄 Class Adjustment Confirmed: " + courseName,
                        adminMsg,
                        "info",
                        "/timetable"
                );
                notificationRepository.save(adminNotif);
            }

            AppNotification broadcastAdmin = new AppNotification(
                    null,
                    "ADMIN",
                    "Admin Office",
                    "ADMIN",
                    "🔄 Class Adjustment Confirmed: " + courseName,
                    adminMsg,
                    "info",
                    "/timetable"
            );
            notificationRepository.save(broadcastAdmin);

            return ResponseEntity.ok(Map.of(
                    "message", "Class adjustment notification sent to registered students & Admin successfully!",
                    "adjustment", saved,
                    "deliveredCount", deliveredCount
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // Schedule Extra Class / Remedial Lecture with integrated notifications & timetable sync
    @PostMapping("/extra-class")
    public ResponseEntity<?> scheduleExtraClass(@RequestBody Map<String, String> payload) {
        try {
            String facultyId = payload.getOrDefault("facultyId", "FAC001");
            String facultyName = payload.getOrDefault("facultyName", "Faculty");
            String courseName = payload.getOrDefault("courseName", "Extra Lecture");
            String date = payload.getOrDefault("date", "");
            String day = payload.getOrDefault("day", "Monday");
            String period = payload.getOrDefault("period", "09:00 AM - 10:00 AM");
            String room = payload.getOrDefault("room", "LH-101");
            String topic = payload.getOrDefault("topic", "Remedial & Extra Practice Session");

            String studentTitle = "📅 Extra Class Scheduled: " + courseName;
            String studentMsg = "Attention: An extra remedial lecture for " + courseName + " has been scheduled by " + facultyName + " on " + date + " (" + day + ", " + period + ") in Room " + room + ". Topic/Agenda: \"" + topic + "\".";

            // 1. Notify all students
            List<User> students = userRepository.findAll().stream()
                    .filter(u -> u.getRole() != null && "STUDENT".equalsIgnoreCase(u.getRole().trim()))
                    .toList();

            for (User student : students) {
                AppNotification notif = new AppNotification(
                        null,
                        student.getId() != null ? student.getId() : student.getEmail(),
                        student.getName(),
                        "STUDENT",
                        studentTitle,
                        studentMsg,
                        "warning",
                        "/timetable"
                );
                notificationRepository.save(notif);
            }

            AppNotification broadcastStudent = new AppNotification(
                    null,
                    "ALL",
                    "All Registered Students",
                    "STUDENT",
                    studentTitle,
                    studentMsg,
                    "warning",
                    "/timetable"
            );
            notificationRepository.save(broadcastStudent);

            // 2. Notify Admin
            String adminTitle = "📅 Extra Lecture Booked: " + courseName;
            String adminMsg = "[Admin Notice] " + facultyName + " has booked an extra lecture for " + courseName + " on " + date + " (" + day + ", " + period + ") in Room " + room + ". Topic: \"" + topic + "\".";

            AppNotification adminNotif = new AppNotification(
                    null,
                    "ADMIN",
                    "Academic Admin",
                    "ADMIN",
                    adminTitle,
                    adminMsg,
                    "info",
                    "/timetable"
            );
            notificationRepository.save(adminNotif);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Extra lecture scheduled and dual notifications broadcasted to Students and Admin!",
                    "details", Map.of(
                            "courseName", courseName,
                            "facultyName", facultyName,
                            "date", date,
                            "day", day,
                            "period", period,
                            "room", room,
                            "topic", topic
                    )
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
