package com.oblms.backend.controller;

import com.oblms.backend.model.Course;
import com.oblms.backend.repository.CourseRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

import org.springframework.context.annotation.DependsOn;

@RestController
@RequestMapping("/api/courses")
@CrossOrigin(origins = "*")
@DependsOn("CSVSeederService")
public class CourseController {

    @Autowired
    private CourseRepository courseRepository;

    @PostConstruct
    public void seedCourses() {
        if (courseRepository.count() == 0) {
            courseRepository.save(new Course(null, "CS101", "Database Management Systems", "Dr. Ramesh Babu", "Fall 2026"));
            courseRepository.save(new Course(null, "CS202", "Machine Learning", "Prof. Anitha Sen", "Fall 2026"));
            courseRepository.save(new Course(null, "CS303", "Cloud Computing", "Dr. Vikram Seth", "Fall 2026"));
        }
    }

    @GetMapping("/count")
    public long getCount() {
        return courseRepository.count();
    }

    @GetMapping
    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    @PostMapping
    public Course saveCourse(@RequestBody Course course) {
        return courseRepository.save(course);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id) {
        courseRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
