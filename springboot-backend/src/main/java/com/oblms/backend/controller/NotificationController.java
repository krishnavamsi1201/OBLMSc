package com.oblms.backend.controller;

import com.oblms.backend.model.AppNotification;
import com.oblms.backend.repository.NotificationRepository;
import com.oblms.backend.repository.UserRepository;
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

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<AppNotification> getNotifications(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String role) {

        List<AppNotification> all = notificationRepository.findAll();
        all.sort((a, b) -> {
            Date d1 = a.getCreatedAt() != null ? a.getCreatedAt() : new Date(0);
            Date d2 = b.getCreatedAt() != null ? b.getCreatedAt() : new Date(0);
            return d2.compareTo(d1);
        });

        Set<String> searchTokens = new HashSet<>();
        if (userId != null && !userId.trim().isEmpty()) searchTokens.add(userId.trim().toLowerCase());
        if (email != null && !email.trim().isEmpty()) searchTokens.add(email.trim().toLowerCase());
        if (name != null && !name.trim().isEmpty()) searchTokens.add(name.trim().toLowerCase());

        if (userId != null && !userId.trim().isEmpty()) {
            userRepository.findById(userId.trim()).ifPresent(u -> {
                if (u.getEmail() != null) searchTokens.add(u.getEmail().toLowerCase());
                if (u.getName() != null) searchTokens.add(u.getName().toLowerCase());
            });
            userRepository.findByEmailIgnoreCase(userId.trim()).ifPresent(u -> {
                if (u.getId() != null) searchTokens.add(u.getId().toLowerCase());
                if (u.getName() != null) searchTokens.add(u.getName().toLowerCase());
            });
        }
        if (email != null && !email.trim().isEmpty()) {
            userRepository.findByEmailIgnoreCase(email.trim()).ifPresent(u -> {
                if (u.getId() != null) searchTokens.add(u.getId().toLowerCase());
                if (u.getName() != null) searchTokens.add(u.getName().toLowerCase());
            });
        }

        final String r = role != null ? role.trim().toUpperCase() : "";

        return all.stream().filter(n -> {
            String recipId = n.getRecipientId() != null ? n.getRecipientId().trim().toLowerCase() : "";
            String recipName = n.getRecipientName() != null ? n.getRecipientName().trim().toLowerCase() : "";
            String recipRole = n.getRecipientRole() != null ? n.getRecipientRole().trim().toUpperCase() : "";

            // 1. Broadcast notifications for all users or role
            if ("ALL".equalsIgnoreCase(recipId) || "ALL".equalsIgnoreCase(recipRole)) {
                return true;
            }

            // 2. Multi-token match across ID, Email, and Name
            if (!searchTokens.isEmpty()) {
                if (searchTokens.contains(recipId) || searchTokens.contains(recipName)) {
                    return true;
                }
                for (String t : searchTokens) {
                    if (t.length() >= 3 && (recipId.contains(t) || t.contains(recipId) || recipName.contains(t) || t.contains(recipName))) {
                        return true;
                    }
                }
            }

            // 3. Fallback to Role matching if no search tokens specified
            if (searchTokens.isEmpty() && !r.isEmpty()) {
                return recipRole.equals(r);
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
