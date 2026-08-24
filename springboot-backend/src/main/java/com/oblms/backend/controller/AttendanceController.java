package com.oblms.backend.controller;

import com.oblms.backend.model.AttendanceRecord;
import com.oblms.backend.repository.AttendanceRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "*")
public class AttendanceController {

    @Autowired
    private AttendanceRecordRepository attendanceRepository;

    @GetMapping
    public List<AttendanceRecord> getAllAttendance() {
        return attendanceRepository.findAll();
    }

    @PostMapping
    public AttendanceRecord saveAttendance(@RequestBody AttendanceRecord record) {
        return attendanceRepository.save(record);
    }

    @PostMapping("/bulk")
    public List<AttendanceRecord> saveAllAttendance(@RequestBody List<AttendanceRecord> records) {
        return attendanceRepository.saveAll(records);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAttendance(@PathVariable Long id) {
        attendanceRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
