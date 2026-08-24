package com.oblms.backend.repository;

import com.oblms.backend.model.ProgramOutcome;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProgramOutcomeRepository extends JpaRepository<ProgramOutcome, Long> {
    Optional<ProgramOutcome> findByPoNumber(String poNumber);
}
