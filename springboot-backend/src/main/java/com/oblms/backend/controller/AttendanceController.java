package com.oblms.backend.controller;

import com.oblms.backend.model.AttendanceRecord;
import com.oblms.backend.model.User;
import com.oblms.backend.repository.AttendanceRecordRepository;
import com.oblms.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "*")
public class AttendanceController {

    @Autowired
    private AttendanceRecordRepository attendanceRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<AttendanceRecord> getAllAttendance(
            @RequestParam(required = false) String course, 
            @RequestParam(required = false) String student,
            @RequestParam(required = false) String faculty) {
        
        List<AttendanceRecord> all = attendanceRepository.findAll();
        if (course != null && !course.trim().isEmpty()) {
            String c = course.trim().toLowerCase();
            all = all.stream().filter(a -> a.getCourseCode() != null && (a.getCourseCode().toLowerCase().contains(c) || c.contains(a.getCourseCode().toLowerCase()))).toList();
        }
        if (student != null && !student.trim().isEmpty()) {
            String s = student.trim().toLowerCase();
            all = all.stream().filter(a -> a.getStudent() != null && a.getStudent().toLowerCase().contains(s)).toList();
        }
        return all;
    }

    @GetMapping("/enrolled-students")
    public List<Map<String, Object>> getEnrolledStudents(@RequestParam(required = false) String courseCode) {
        if (courseCode == null || courseCode.trim().isEmpty()) {
            return Collections.emptyList();
        }
        String target = courseCode.trim().toLowerCase();
        List<User> students = userRepository.findAll().stream()
            .filter(u -> "STUDENT".equalsIgnoreCase(u.getRole()))
            .filter(u -> {
                if (u.getEnrolledCourses() == null || u.getEnrolledCourses().isEmpty()) return false;
                List<String> list = Arrays.stream(u.getEnrolledCourses().split(","))
                    .map(String::trim)
                    .map(String::toLowerCase)
                    .toList();
                return list.contains(target) || list.stream().anyMatch(c -> target.contains(c) || c.contains(target));
            })
            .toList();

        List<AttendanceRecord> allLogs = attendanceRepository.findAll();

        return students.stream().map(s -> {
            List<AttendanceRecord> studentCourseLogs = allLogs.stream()
                .filter(l -> l.getStudent() != null && l.getStudent().equalsIgnoreCase(s.getName()))
                .filter(l -> l.getCourseCode() != null && (l.getCourseCode().equalsIgnoreCase(target) || l.getCourseCode().toLowerCase().contains(target)))
                .toList();

            long presentCount = studentCourseLogs.stream().filter(l -> "Present".equalsIgnoreCase(l.getStatus())).count();
            int total = studentCourseLogs.size();
            int pct = total > 0 ? (int) Math.round(((double) presentCount / total) * 100) : 0;

            Map<String, Object> map = new HashMap<>();
            map.put("id", s.getId());
            map.put("regNo", s.getId());
            map.put("name", s.getName());
            map.put("email", s.getEmail());
            map.put("department", s.getDepartment());
            map.put("semester", "Semester 6");
            map.put("totalLectures", total);
            map.put("totalPresent", presentCount);
            map.put("attendancePercentage", pct);
            map.put("status", "Unmarked");
            return map;
        }).collect(Collectors.toList());
    }

    @PostMapping
    public AttendanceRecord saveAttendance(@RequestBody AttendanceRecord record) {
        return attendanceRepository.save(record);
    }

    @PostMapping("/bulk")
    @Transactional
    public List<AttendanceRecord> saveAllAttendance(@RequestBody List<AttendanceRecord> records) {
        return attendanceRepository.saveAll(records);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAttendance(@PathVariable Long id) {
        attendanceRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
