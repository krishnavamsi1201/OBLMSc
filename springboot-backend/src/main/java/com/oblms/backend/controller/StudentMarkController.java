package com.oblms.backend.controller;

import com.oblms.backend.model.StudentMark;
import com.oblms.backend.repository.StudentMarkRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/marks")
@CrossOrigin(origins = "*")
public class StudentMarkController {

    @Autowired
    private StudentMarkRepository markRepository;

    @GetMapping
    public List<StudentMark> getAllMarks(@RequestParam(required = false) String student) {
        if (student != null && !student.trim().isEmpty()) {
            return markRepository.findByStudentIgnoreCase(student.trim());
        }
        return markRepository.findAll();
    }

    @PostMapping
    public StudentMark saveMark(@RequestBody StudentMark mark) {
        return markRepository.save(mark);
    }

    @PostMapping("/batch")
    public List<StudentMark> saveAllMarks(@RequestBody List<StudentMark> marks) {
        return markRepository.saveAll(marks);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMark(@PathVariable Long id) {
        if (markRepository.existsById(id)) {
            markRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
