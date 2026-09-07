package com.oblms.backend.controller;

import com.oblms.backend.model.ClassAdjustment;
import com.oblms.backend.repository.ClassAdjustmentRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/class-adjustments")
@CrossOrigin(origins = "*")
public class ClassAdjustmentController {

    @Autowired
    private ClassAdjustmentRepository adjustmentRepository;

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
        return ResponseEntity.ok(saved);
    }

    // Delete adjustment
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAdjustment(@PathVariable Long id) {
        adjustmentRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
