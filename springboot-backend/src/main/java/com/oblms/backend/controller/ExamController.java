package com.oblms.backend.controller;

import com.oblms.backend.model.Exam;
import com.oblms.backend.repository.ExamRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exams")
@CrossOrigin(origins = "*")
public class ExamController {

    @Autowired
    private ExamRepository examRepository;

    @PostConstruct
    public void seedExams() {
        if (examRepository.count() == 0) {
            examRepository.save(new Exam(null, "Database Management Systems Midterm", "CS101", "2026-09-10T10:00", "LH-302", "Scheduled", 100));
            examRepository.save(new Exam(null, "Machine Learning Practical Exam", "CS202", "2026-09-12T13:00", "Lab-4", "Scheduled", 50));
            examRepository.save(new Exam(null, "Cloud Computing Final Assessment", "CS303", "2026-08-20T09:00", "LH-101", "Completed", 100));
        }
    }

    @GetMapping
    public List<Exam> getAllExams() {
        return examRepository.findAll();
    }

    @PostMapping
    public Exam saveExam(@RequestBody Exam exam) {
        return examRepository.save(exam);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExam(@PathVariable Long id) {
        examRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
