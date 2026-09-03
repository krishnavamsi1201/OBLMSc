package com.oblms.backend.controller;

import com.oblms.backend.model.AppNotification;
import com.oblms.backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping
    public List<AppNotification> getNotifications(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String role) {

        List<AppNotification> all = notificationRepository.findAll();
        all.sort((a, b) -> {
            Date d1 = a.getCreatedAt() != null ? a.getCreatedAt() : new Date(0);
            Date d2 = b.getCreatedAt() != null ? b.getCreatedAt() : new Date(0);
            return d2.compareTo(d1);
        });

        if ((userId == null || userId.trim().isEmpty()) && (role == null || role.trim().isEmpty())) {
            return all;
        }

        final String uId = userId != null ? userId.trim().toLowerCase() : "";
        final String r = role != null ? role.trim().toUpperCase() : "";

        return all.stream().filter(n -> {
            String recipId = n.getRecipientId() != null ? n.getRecipientId().trim().toLowerCase() : "";
            String recipRole = n.getRecipientRole() != null ? n.getRecipientRole().trim().toUpperCase() : "";

            // 1. Broadcast notifications for all users or role
            if ("ALL".equalsIgnoreCase(recipId)) {
                return true;
            }
            if ("ALL".equalsIgnoreCase(recipRole) && (recipId.isEmpty() || recipId.equals(uId))) {
                return true;
            }

            // 2. Strict User ID / Email matching
            if (!uId.isEmpty()) {
                return recipId.equals(uId) || recipId.equalsIgnoreCase(uId);
            }

            // 3. Fallback to Role matching if no userId specified
            if (!r.isEmpty()) {
                return recipRole.equals(r) && (recipId.isEmpty() || "ALL".equalsIgnoreCase(recipId));
            }

            return false;
        }).toList();
    }

    @PostMapping
    public AppNotification createNotification(@RequestBody AppNotification notif) {
        if (notif.getCreatedAt() == null) {
            notif.setCreatedAt(new Date());
        }
        return notificationRepository.save(notif);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        Optional<AppNotification> opt = notificationRepository.findById(id);
        if (opt.isPresent()) {
            AppNotification n = opt.get();
            n.setRead(true);
            notificationRepository.save(n);
            return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/read-all")
    @Transactional
    public ResponseEntity<?> markAllAsRead(@RequestParam(required = false) String userId) {
        List<AppNotification> all = notificationRepository.findAll();
        final String uId = userId != null ? userId.trim().toLowerCase() : "";

        for (AppNotification n : all) {
            String recipId = n.getRecipientId() != null ? n.getRecipientId().toLowerCase() : "";
            if (uId.isEmpty() || recipId.equals(uId) || "ALL".equalsIgnoreCase(recipId)) {
                n.setRead(true);
            }
        }
        notificationRepository.saveAll(all);
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id) {
        notificationRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Notification deleted"));
    }
}
