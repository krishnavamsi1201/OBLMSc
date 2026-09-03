package com.oblms.backend.repository;

import com.oblms.backend.model.CourseRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRequestRepository extends JpaRepository<CourseRequest, Long> {
    List<CourseRequest> findByStudentId(String studentId);
    List<CourseRequest> findByStudentEmailIgnoreCase(String studentEmail);
    List<CourseRequest> findByStatusIgnoreCase(String status);
}
