package com.oblms.backend.repository;

import com.oblms.backend.model.QuestionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<QuestionItem, Long> {
    List<QuestionItem> findBySubjectIgnoreCase(String subject);
    List<QuestionItem> findByBloomsLevelIgnoreCase(String bloomsLevel);
    List<QuestionItem> findByCoMappedIgnoreCase(String coMapped);
}
