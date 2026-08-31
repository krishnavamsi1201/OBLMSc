package com.oblms.backend.repository;

import com.oblms.backend.model.AcademicStream;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AcademicStreamRepository extends JpaRepository<AcademicStream, Long> {
}
