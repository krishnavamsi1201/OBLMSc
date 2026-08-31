package com.oblms.backend.repository;

import com.oblms.backend.model.CourseOutcome;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseOutcomeRepository extends JpaRepository<CourseOutcome, Long> {
    List<CourseOutcome> findByCourse(String course);
    List<CourseOutcome> findByCourseIgnoreCase(String course);
}
