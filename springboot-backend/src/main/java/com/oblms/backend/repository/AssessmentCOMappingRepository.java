package com.oblms.backend.repository;

import com.oblms.backend.model.AssessmentCOMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssessmentCOMappingRepository extends JpaRepository<AssessmentCOMapping, Long> {
    List<AssessmentCOMapping> findByCourseId(String courseId);
}
