package com.oblms.backend.repository;

import com.oblms.backend.model.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    List<AttendanceRecord> findByStudent(String student);
    List<AttendanceRecord> findByCourseCode(String courseCode);
}
