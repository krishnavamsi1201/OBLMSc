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
        List<Course> defaultCourses = List.of(
            new Course(null, "CS101", "Database Management Systems", "Dr. Ramesh Babu", "Semester 3"),
            new Course(null, "CS102", "Data Structures & Algorithms", "Prof. Sunita Sharma", "Semester 3"),
            new Course(null, "CS103", "Object-Oriented Programming", "Dr. Ramesh Babu", "Semester 3"),
            new Course(null, "CS201", "Operating Systems", "Dr. Amit Patel", "Semester 4"),
            new Course(null, "CS202", "Machine Learning & Data Science", "Prof. Sunita Sharma", "Semester 5"),
            new Course(null, "CS301", "Computer Networks", "Dr. Priya Nair", "Semester 5"),
            new Course(null, "CS302", "Software Engineering", "Prof. Rajesh Verma", "Semester 6"),
            new Course(null, "CS303", "Cloud Computing & DevOps", "Dr. Amit Patel", "Semester 6"),
            new Course(null, "CS401", "Artificial Intelligence", "Dr. Ramesh Babu", "Semester 7"),
            new Course(null, "CS402", "Cyber Security & Cryptography", "Prof. Rajesh Verma", "Semester 7")
        );

        for (Course c : defaultCourses) {
            Optional<Course> existing = courseRepository.findByCode(c.getCode());
            if (existing.isPresent()) {
                Course dbCourse = existing.get();
                dbCourse.setTitle(c.getTitle());
                dbCourse.setFaculty(c.getFaculty());
                dbCourse.setSemester(c.getSemester());
                courseRepository.save(dbCourse);
            } else {
                courseRepository.save(c);
            }
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
