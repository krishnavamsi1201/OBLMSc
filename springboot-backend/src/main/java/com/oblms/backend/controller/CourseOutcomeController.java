package com.oblms.backend.controller;

import com.oblms.backend.model.CourseOutcome;
import com.oblms.backend.repository.CourseOutcomeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/course-outcomes")
@CrossOrigin(origins = "*")
public class CourseOutcomeController {

    @Autowired
    private CourseOutcomeRepository coRepository;

    @GetMapping
    public List<CourseOutcome> getAllOutcomes(
            @RequestParam(required = false) String course,
            @RequestParam(required = false) String status) {
        if (course != null && !course.trim().isEmpty() && status != null && !status.trim().isEmpty()) {
            return coRepository.findByCourseIgnoreCaseAndApprovalStatusIgnoreCase(course.trim(), status.trim());
        } else if (course != null && !course.trim().isEmpty()) {
            return coRepository.findByCourseIgnoreCase(course.trim());
        } else if (status != null && !status.trim().isEmpty()) {
            return coRepository.findByApprovalStatusIgnoreCase(status.trim());
        }
        return coRepository.findAll();
    }

    @GetMapping("/pending")
    public List<CourseOutcome> getPendingOutcomes() {
        return coRepository.findByApprovalStatusIgnoreCase("Pending Approval");
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseOutcome> getOutcomeById(@PathVariable Long id) {
        return coRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<CourseOutcome> createOutcome(@RequestBody Map<String, Object> payload) {
        String course = (String) payload.getOrDefault("course", "");
        String co = (String) payload.getOrDefault("co", "");
        String description = (String) payload.getOrDefault("description", "");
        String bloomsLevel = (String) payload.getOrDefault("bloomsLevel", "Apply");
        String faculty = (String) payload.getOrDefault("faculty", "");
        String role = (String) payload.getOrDefault("role", "faculty");

        CourseOutcome outcome = new CourseOutcome();
        outcome.setCourse(course);
        outcome.setCo(co);
        outcome.setDescription(description);
        outcome.setBloomsLevel(bloomsLevel);
        outcome.setFaculty(faculty);

        if ("admin".equalsIgnoreCase(role)) {
            outcome.setApprovalStatus("Approved");
        } else {
            // Faculty created CO requires admin approval
            outcome.setApprovalStatus("Pending Approval");
        }

        CourseOutcome saved = coRepository.save(outcome);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateOutcome(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Optional<CourseOutcome> opt = coRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        CourseOutcome existing = opt.get();
        if (payload.containsKey("course")) existing.setCourse((String) payload.get("course"));
        if (payload.containsKey("co")) existing.setCo((String) payload.get("co"));
        if (payload.containsKey("description")) existing.setDescription((String) payload.get("description"));
        if (payload.containsKey("bloomsLevel")) existing.setBloomsLevel((String) payload.get("bloomsLevel"));
        if (payload.containsKey("approvalStatus")) existing.setApprovalStatus((String) payload.get("approvalStatus"));
        if (payload.containsKey("faculty")) existing.setFaculty((String) payload.get("faculty"));

        CourseOutcome saved = coRepository.save(existing);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveOutcome(@PathVariable Long id) {
        Optional<CourseOutcome> opt = coRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        CourseOutcome outcome = opt.get();
        outcome.setApprovalStatus("Approved");
        CourseOutcome saved = coRepository.save(outcome);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectOutcome(@PathVariable Long id) {
        Optional<CourseOutcome> opt = coRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        CourseOutcome outcome = opt.get();
        outcome.setApprovalStatus("Rejected");
        CourseOutcome saved = coRepository.save(outcome);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteOutcome(@PathVariable Long id) {
        if (!coRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        coRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Outcome deleted successfully"));
    }
}
