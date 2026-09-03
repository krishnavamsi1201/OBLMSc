package com.oblms.backend.controller;

import com.oblms.backend.model.Course;
import com.oblms.backend.model.User;
import com.oblms.backend.repository.CourseRepository;
import com.oblms.backend.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

import org.springframework.context.annotation.DependsOn;

@RestController
@RequestMapping("/api/courses")
@CrossOrigin(origins = "*")
@DependsOn("CSVSeederService")
public class CourseController {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    @PostConstruct
    public void seedCourses() {
        if (courseRepository.count() == 0) {
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
            courseRepository.saveAll(defaultCourses);
        }
    }

    @GetMapping("/count")
    public long getCount() {
        return courseRepository.count();
    }

    @GetMapping
    public List<Course> getAllCourses(@RequestParam(required = false) String faculty) {
        if (faculty != null && !faculty.trim().isEmpty()) {
            String q = faculty.trim();
            Optional<User> uOpt = userRepository.findById(q);
            if (uOpt.isEmpty()) {
                uOpt = userRepository.findByEmailIgnoreCase(q);
            }
            if (uOpt.isEmpty()) {
                uOpt = userRepository.findAll().stream()
                    .filter(u -> u.getName().equalsIgnoreCase(q))
                    .findFirst();
            }

            if (uOpt.isPresent() && uOpt.get().getEnrolledCourses() != null && !uOpt.get().getEnrolledCourses().isEmpty()) {
                List<String> codes = Arrays.stream(uOpt.get().getEnrolledCourses().split(","))
                    .map(String::trim)
                    .map(String::toLowerCase)
                    .toList();
                return courseRepository.findAll().stream()
                    .filter(c -> codes.contains(c.getCode().toLowerCase()) || codes.contains(c.getTitle().toLowerCase()))
                    .toList();
            }
            return courseRepository.findByFacultyContainingIgnoreCase(q);
        }
        return courseRepository.findAll();
    }

    @PostMapping
    @Transactional
    public Course saveCourse(@RequestBody Course course) {
        Course saved = courseRepository.save(course);

        // If faculty name is assigned, update that faculty user's enrolledCourses in MySQL
        String facName = course.getFaculty();
        if (facName != null && !facName.trim().isEmpty() && !"Faculty Board".equalsIgnoreCase(facName.trim())) {
            Optional<User> facUserOpt = userRepository.findAll().stream()
                .filter(u -> "FACULTY".equalsIgnoreCase(u.getRole()) && (
                    (u.getName() != null && u.getName().equalsIgnoreCase(facName.trim())) ||
                    (u.getEmail() != null && u.getEmail().equalsIgnoreCase(facName.trim()))
                ))
                .findFirst();

            if (facUserOpt.isPresent()) {
                User fac = facUserOpt.get();
                String existing = fac.getEnrolledCourses() != null ? fac.getEnrolledCourses().trim() : "";
                Set<String> set = new LinkedHashSet<>();
                if (!existing.isEmpty()) {
                    for (String s : existing.split(",")) {
                        if (!s.trim().isEmpty()) set.add(s.trim());
                    }
                }
                set.add(course.getCode());
                fac.setEnrolledCourses(String.join(",", set));
                userRepository.save(fac);
            }
        }
        return saved;
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id) {
        courseRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
