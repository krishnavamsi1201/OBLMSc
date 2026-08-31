package com.oblms.backend.repository;

import com.oblms.backend.model.CoPoMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CoPoMappingRepository extends JpaRepository<CoPoMapping, Long> {
    List<CoPoMapping> findByCourse(String course);
    List<CoPoMapping> findByCourseIgnoreCase(String course);
}
