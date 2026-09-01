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
        if (programOutcomeRepository.count() < 12) {
            programOutcomeRepository.deleteAll();
            List<ProgramOutcome> pos = List.of(
                new ProgramOutcome(null, "PO1", "Computer Science & Engineering", "Engineering Knowledge: Apply the knowledge of mathematics, science, engineering fundamentals, and software engineering to solve complex computational problems."),
                new ProgramOutcome(null, "PO2", "Computer Science & Engineering", "Problem Analysis: Identify, formulate, review research literature, and analyze complex engineering and computing problems reaching substantiated conclusions."),
                new ProgramOutcome(null, "PO3", "Computer Science & Engineering", "Design & Development of Solutions: Design modular system components, database schemas, and algorithms that meet specified needs with public health, safety, and cultural considerations."),
                new ProgramOutcome(null, "PO4", "Computer Science & Engineering", "Conduct Investigations of Complex Problems: Use research-based knowledge and research methods including design of experiments, analysis, and interpretation of data."),
                new ProgramOutcome(null, "PO5", "Computer Science & Engineering", "Modern Tool Usage: Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools including modeling and simulation."),
                new ProgramOutcome(null, "PO6", "Computer Science & Engineering", "The Engineer and Society: Apply reasoning informed by contextual knowledge to assess societal, health, safety, legal, and cultural responsibilities."),
                new ProgramOutcome(null, "PO7", "Computer Science & Engineering", "Environment and Sustainability: Understand the impact of professional engineering solutions in societal and environmental contexts, and demonstrate knowledge of sustainable development."),
                new ProgramOutcome(null, "PO8", "Computer Science & Engineering", "Ethics & Integrity: Apply ethical principles and commit to professional ethics and responsibilities and norms of the engineering and computing practice."),
                new ProgramOutcome(null, "PO9", "Computer Science & Engineering", "Individual and Team Work: Function effectively as an individual, and as a member or leader in diverse teams, and in multidisciplinary settings."),
                new ProgramOutcome(null, "PO10", "Computer Science & Engineering", "Communication: Communicate effectively on complex engineering activities with the engineering community and with society at large."),
                new ProgramOutcome(null, "PO11", "Computer Science & Engineering", "Project Management and Finance: Demonstrate knowledge and understanding of engineering and management principles and apply these to manage projects."),
                new ProgramOutcome(null, "PO12", "Computer Science & Engineering", "Life-long Learning: Recognize the need for, and have the preparation and ability to engage in independent and life-long learning in the broadest context of technological change."),
                new ProgramOutcome(null, "PSO1", "Computer Science & Engineering", "Professional Software Systems: Design and implement reliable, scalable enterprise backend architectures, microservices, and secure data pipelines."),
                new ProgramOutcome(null, "PSO2", "Computer Science & Engineering", "Intelligent Computing & Data Science: Apply machine learning, data engineering, and intelligent algorithmic workflows to solve real-world problems.")
            );
            programOutcomeRepository.saveAll(pos);
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
