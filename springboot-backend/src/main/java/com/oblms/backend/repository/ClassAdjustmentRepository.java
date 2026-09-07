package com.oblms.backend.repository;

import com.oblms.backend.model.ClassAdjustment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClassAdjustmentRepository extends JpaRepository<ClassAdjustment, Long> {
    List<ClassAdjustment> findBySubstituteIdIgnoreCaseOrSubstituteNameContainingIgnoreCase(String substituteId, String substituteName);
    List<ClassAdjustment> findByRequesterIdIgnoreCaseOrRequesterNameContainingIgnoreCase(String requesterId, String requesterName);
    List<ClassAdjustment> findByStatusIgnoreCase(String status);
}
