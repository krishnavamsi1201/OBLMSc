package com.oblms.backend.repository;

import com.oblms.backend.model.AppNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<AppNotification, Long> {
    List<AppNotification> findByRecipientIdIgnoreCaseOrderByCreatedAtDesc(String recipientId);
    List<AppNotification> findByRecipientRoleIgnoreCaseOrderByCreatedAtDesc(String recipientRole);
}
