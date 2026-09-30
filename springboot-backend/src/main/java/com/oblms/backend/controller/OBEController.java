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
        if (assessmentMappingRepository.count() == 0) {
            // 1. Seed Assessments mapped to accredited Course Codes
            assessmentMappingRepository.save(new AssessmentCOMapping(null, "CS101 - Midterm 1", "Midterm", "CS101", "Database Management Systems", "CO1,CO2", 50));
            assessmentMappingRepository.save(new AssessmentCOMapping(null, "CS102 - Practical Lab Exam", "Practical", "CS102", "Data Structures & Algorithms", "CO1,CO2", 100));
            assessmentMappingRepository.save(new AssessmentCOMapping(null, "CS103 - Java & OOP Quiz 1", "Quiz", "CS103", "Object-Oriented Programming", "CO1", 20));
            assessmentMappingRepository.save(new AssessmentCOMapping(null, "CS201 - Operating Systems Assignment 1", "Assignment", "CS201", "Operating Systems", "CO1,CO2,CO3", 25));
            assessmentMappingRepository.save(new AssessmentCOMapping(null, "CS301 - Computer Networks Practical Exam", "Practical", "CS301", "Computer Networks", "CO1,CO2", 100));
        }

        if (marksRepository.count() == 0) {
            // 2. Seed Marks for student "Krishna Vamsi"
            marksRepository.save(new StudentMark(null, "Krishna Vamsi", "CS101 - Midterm 1", 42, 50));
            marksRepository.save(new StudentMark(null, "Krishna Vamsi", "CS102 - Practical Lab Exam", 88, 100));
            marksRepository.save(new StudentMark(null, "Krishna Vamsi", "CS103 - Java & OOP Quiz 1", 17, 20));
            marksRepository.save(new StudentMark(null, "Krishna Vamsi", "CS201 - Operating Systems Assignment 1", 22, 25));
            marksRepository.save(new StudentMark(null, "Krishna Vamsi", "CS301 - Computer Networks Practical Exam", 91, 100));

            // 3. Seed Marks for student "Aditya Sharma"
            marksRepository.save(new StudentMark(null, "Aditya Sharma", "CS101 - Midterm 1", 38, 50));
            marksRepository.save(new StudentMark(null, "Aditya Sharma", "CS102 - Practical Lab Exam", 75, 100));
            marksRepository.save(new StudentMark(null, "Aditya Sharma", "CS103 - Java & OOP Quiz 1", 14, 20));
            marksRepository.save(new StudentMark(null, "Aditya Sharma", "CS201 - Operating Systems Assignment 1", 19, 25));
            marksRepository.save(new StudentMark(null, "Aditya Sharma", "CS301 - Computer Networks Practical Exam", 82, 100));
        }
    }

    @GetMapping("/co-attainment")
    public ResponseEntity<?> getCOAttainment(
            @RequestParam(defaultValue = "75") double target,
            @RequestParam(required = false) String faculty) {
        return ResponseEntity.ok(obeService.calculateCOAttainment(target, faculty));
    }

    @GetMapping("/po-attainment")
    public ResponseEntity<?> getPOAttainment(
            @RequestParam(defaultValue = "75") double target,
            @RequestParam(required = false) String faculty) {
        return ResponseEntity.ok(obeService.calculatePOAttainment(target, faculty));
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
