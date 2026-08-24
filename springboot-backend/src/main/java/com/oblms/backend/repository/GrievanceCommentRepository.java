package com.oblms.backend.repository;

import com.oblms.backend.model.GrievanceComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GrievanceCommentRepository extends JpaRepository<GrievanceComment, Long> {
    List<GrievanceComment> findByGrievanceIdOrderByTimestampAsc(Long grievanceId);
}
