package com.oblms.backend.repository;

import com.oblms.backend.model.AcademicProgram;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AcademicProgramRepository extends JpaRepository<AcademicProgram, Long> {
    List<AcademicProgram> findByCourseId(Long courseId);
}
