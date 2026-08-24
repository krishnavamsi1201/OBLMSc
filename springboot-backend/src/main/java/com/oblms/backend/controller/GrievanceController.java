package com.oblms.backend.controller;

import com.oblms.backend.model.*;
import com.oblms.backend.repository.*;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/grievances")
@CrossOrigin(origins = "*")
public class GrievanceController {

    @Autowired
    private GrievanceRepository grievanceRepository;

    @Autowired
    private GrievanceCommentRepository commentRepository;

    @PostConstruct
    public void seedGrievances() {
        if (grievanceRepository.count() == 0) {
            Grievance g1 = grievanceRepository.save(new Grievance(null, "Discrepancy in Midterm attendance record", "I was marked absent on August 10th despite presenting my medical certificate.", "Attendance", "Raj Kumar", "Open", "2026-08-11T10:00", null));
            commentRepository.save(new GrievanceComment(null, g1.getId(), "System", "System", "Ticket submitted successfully.", "2026-08-11T10:00:00Z"));

            Grievance g2 = grievanceRepository.save(new Grievance(null, "LMS file upload error", "When trying to submit the machine learning assignment, the upload button throws a 500 error.", "Technical Support", "Sneha Patel", "In Review", "2026-08-12T14:30", null));
            commentRepository.save(new GrievanceComment(null, g2.getId(), "Sneha Patel", "student", "Please resolve soon as deadline is tomorrow.", "2026-08-12T14:32:00Z"));
            commentRepository.save(new GrievanceComment(null, g2.getId(), "System Administrator", "admin", "Taking a look at the server log. It seems like a file size restriction.", "2026-08-12T16:00:00Z"));
        }
    }

    @GetMapping
    public List<Grievance> getAllGrievances() {
        return grievanceRepository.findAll();
    }

    @PostMapping
    public Grievance submitGrievance(@RequestBody Grievance grievance) {
        return grievanceRepository.save(grievance);
    }

    @GetMapping("/{id}/comments")
    public List<GrievanceComment> getComments(@PathVariable Long id) {
        return commentRepository.findByGrievanceIdOrderByTimestampAsc(id);
    }

    @PostMapping("/{id}/comments")
    public GrievanceComment addComment(@PathVariable Long id, @RequestBody GrievanceComment comment) {
        comment.setGrievanceId(id);
        return commentRepository.save(comment);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Optional<Grievance> grievanceOpt = grievanceRepository.findById(id);
        if (grievanceOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Grievance grievance = grievanceOpt.get();
        grievance.setStatus(body.get("status"));
        if (body.containsKey("resolution")) {
            grievance.setResolution(body.get("resolution"));
        }
        grievanceRepository.save(grievance);

        return ResponseEntity.ok(grievance);
    }
}
