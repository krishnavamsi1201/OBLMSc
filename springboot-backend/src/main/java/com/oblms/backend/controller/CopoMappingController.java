package com.oblms.backend.controller;

import com.oblms.backend.model.*;
import com.oblms.backend.repository.*;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/copo")
@CrossOrigin(origins = "*")
public class CopoMappingController {

    @Autowired
    private ProgramOutcomeRepository programOutcomeRepository;

    @Autowired
    private CourseOutcomeRepository courseOutcomeRepository;

    @Autowired
    private CoPoMappingRepository coPoMappingRepository;

    @PostConstruct
    public void seedOutcomes() {
        if (programOutcomeRepository.count() == 0) {
            programOutcomeRepository.save(new ProgramOutcome(null, "PO1", "Apply knowledge of mathematics, science, engineering fundamentals, and computer science specialization to solve complex engineering problems."));
            programOutcomeRepository.save(new ProgramOutcome(null, "PO2", "Identify, formulate, and analyze complex problems reaching substantiated conclusions using computational concepts."));
            programOutcomeRepository.save(new ProgramOutcome(null, "PO3", "Design solutions for complex engineering problems and design system components or processes that meet specific needs."));
            programOutcomeRepository.save(new ProgramOutcome(null, "PO4", "Conduct investigations of complex problems using research-based knowledge and methods including design of experiments."));
        }

        if (courseOutcomeRepository.count() == 0) {
            courseOutcomeRepository.save(new CourseOutcome(null, "CS101", "CO1", "Recall and outline fundamental relational database structures and entity definitions."));
            courseOutcomeRepository.save(new CourseOutcome(null, "CS101", "CO2", "Demonstrate schema mapping models, foreign key relationships, and integrity rules."));
            courseOutcomeRepository.save(new CourseOutcome(null, "CS202", "CO1", "Analyze and compute performance algorithms, regression metrics, and statistics."));
            courseOutcomeRepository.save(new CourseOutcome(null, "CS303", "CO1", "Evaluate virtualization containers, VM platform deployments, and availability metrics."));
        }
    }

    // Program Outcomes
    @GetMapping("/po")
    public List<ProgramOutcome> getAllPOs() {
        return programOutcomeRepository.findAll();
    }

    @PostMapping("/po")
    public ProgramOutcome savePO(@RequestBody ProgramOutcome po) {
        return programOutcomeRepository.save(po);
    }

    @DeleteMapping("/po/{id}")
    public ResponseEntity<?> deletePO(@PathVariable Long id) {
        programOutcomeRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // Course Outcomes
    @GetMapping("/co")
    public List<CourseOutcome> getAllCOs() {
        return courseOutcomeRepository.findAll();
    }

    @PostMapping("/co")
    public CourseOutcome saveCO(@RequestBody CourseOutcome co) {
        return courseOutcomeRepository.save(co);
    }

    // Mappings
    @GetMapping("/mappings")
    public List<CoPoMapping> getAllMappings() {
        return coPoMappingRepository.findAll();
    }

    @PostMapping("/mappings")
    public CoPoMapping saveMapping(@RequestBody CoPoMapping mapping) {
        return coPoMappingRepository.save(mapping);
    }

    @DeleteMapping("/mappings/{id}")
    public ResponseEntity<?> deleteMapping(@PathVariable Long id) {
        coPoMappingRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
