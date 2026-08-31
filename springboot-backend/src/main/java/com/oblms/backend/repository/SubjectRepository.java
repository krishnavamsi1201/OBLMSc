package com.oblms.backend.repository;

import com.oblms.backend.model.SubjectEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubjectRepository extends JpaRepository<SubjectEntity, Long> {
    Optional<SubjectEntity> findBySubCodeIgnoreCase(String subCode);
    List<SubjectEntity> findBySubjectTypeIgnoreCase(String subjectType);
}
