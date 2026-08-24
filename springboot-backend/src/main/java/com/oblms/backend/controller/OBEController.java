package com.oblms.backend.controller;

import com.oblms.backend.model.*;
import com.oblms.backend.repository.*;
import com.oblms.backend.service.OBEService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import org.springframework.context.annotation.DependsOn;

@RestController
@RequestMapping("/api/obe")
@CrossOrigin(origins = "*")
@DependsOn("CSVSeederService")
public class OBEController {

    @Autowired
    private AssessmentCOMappingRepository assessmentMappingRepository;

    @Autowired
    private StudentMarkRepository marksRepository;

    @Autowired
    private CoPoMappingRepository copoMappingRepository;

    @Autowired
    private OBEService obeService;

    @PostConstruct
    public void seedOBEData() {
        assessmentMappingRepository.deleteAll();
        marksRepository.deleteAll();
        copoMappingRepository.deleteAll();

        // 1. Seed Assessments mapped to CSV Course Codes
        assessmentMappingRepository.save(new AssessmentCOMapping(null, "INMCA202 - Midterm 1", "Midterm", "INMCA202", "Probability and Statistics", "CO1,CO2", 50));
        assessmentMappingRepository.save(new AssessmentCOMapping(null, "DS - Practical Lab", "Practical", "DS", "Data Structures and Analysys of Computer Algorithms", "CO1", 100));
        assessmentMappingRepository.save(new AssessmentCOMapping(null, "MES - Quiz 1", "Quiz", "MES", "Microprocessors and Embedded Systems", "CO1", 20));
        assessmentMappingRepository.save(new AssessmentCOMapping(null, "IT305 - Assignment 1", "Assignment", "IT305", "Operating Systems", "CO1,CO2,CO3", 25));
        assessmentMappingRepository.save(new AssessmentCOMapping(null, "OOP - Practical Exam", "Practical", "OOP", "Object Oriented Programming with C++", "CO1", 100));

        // 2. Seed Marks for student "Krishnavamsi"
        marksRepository.save(new StudentMark(null, "Krishnavamsi", "INMCA202 - Midterm 1", 42, 50));
        marksRepository.save(new StudentMark(null, "Krishnavamsi", "DS - Practical Lab", 88, 100));
        marksRepository.save(new StudentMark(null, "Krishnavamsi", "MES - Quiz 1", 17, 20));
        marksRepository.save(new StudentMark(null, "Krishnavamsi", "IT305 - Assignment 1", 22, 25));
        marksRepository.save(new StudentMark(null, "Krishnavamsi", "OOP - Practical Exam", 91, 100));

        // 3. Seed Marks for student "Raj Kumar"
        marksRepository.save(new StudentMark(null, "Raj Kumar", "INMCA202 - Midterm 1", 38, 50));
        marksRepository.save(new StudentMark(null, "Raj Kumar", "DS - Practical Lab", 75, 100));
        marksRepository.save(new StudentMark(null, "Raj Kumar", "MES - Quiz 1", 14, 20));
        marksRepository.save(new StudentMark(null, "Raj Kumar", "IT305 - Assignment 1", 19, 25));
        marksRepository.save(new StudentMark(null, "Raj Kumar", "OOP - Practical Exam", 82, 100));

        // 4. Seed Mappings
        copoMappingRepository.save(new CoPoMapping(null, "INMCA202", "CO1", "PO1", 3, 3, "Approved"));
        copoMappingRepository.save(new CoPoMapping(null, "INMCA202", "CO2", "PO2", 2, 2, "Approved"));
        copoMappingRepository.save(new CoPoMapping(null, "DS", "CO1", "PO1", 3, 3, "Approved"));
        copoMappingRepository.save(new CoPoMapping(null, "MES", "CO1", "PO3", 2, 2, "Approved"));
    }

    @GetMapping("/co-attainment")
    public ResponseEntity<?> getCOAttainment(@RequestParam(defaultValue = "75") double target) {
        return ResponseEntity.ok(obeService.calculateCOAttainment(target));
    }

    @GetMapping("/po-attainment")
    public ResponseEntity<?> getPOAttainment(@RequestParam(defaultValue = "75") double target) {
        return ResponseEntity.ok(obeService.calculatePOAttainment(target));
    }

    // Assessment-CO Mappings REST APIs
    @GetMapping("/assessments")
    public List<AssessmentCOMapping> getAllAssessments() {
        return assessmentMappingRepository.findAll();
    }

    @PostMapping("/assessments")
    public AssessmentCOMapping saveAssessment(@RequestBody AssessmentCOMapping mapping) {
        return assessmentMappingRepository.save(mapping);
    }

    @DeleteMapping("/assessments/{id}")
    public ResponseEntity<?> deleteAssessment(@PathVariable Long id) {
        assessmentMappingRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // Student Marks REST APIs
    @GetMapping("/marks")
    public List<StudentMark> getAllMarks() {
        return marksRepository.findAll();
    }

    @PostMapping("/marks")
    public StudentMark saveMark(@RequestBody StudentMark mark) {
        return marksRepository.save(mark);
    }

    @DeleteMapping("/marks/{id}")
    public ResponseEntity<?> deleteMark(@PathVariable Long id) {
        marksRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
