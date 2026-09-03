package com.oblms.backend.model;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "notifications")
public class AppNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String recipientId;
    private String recipientName;
    private String recipientRole;
    private String title;

    @Column(length = 1000)
    private String message;

    private String type; // success, warning, info, error, approval
    private String actionUrl;
    private boolean isRead = false;

    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt = new Date();

    public AppNotification() {}

    public AppNotification(Long id, String recipientId, String recipientName, String recipientRole, String title, String message, String type, String actionUrl) {
        this.id = id;
        this.recipientId = recipientId;
        this.recipientName = recipientName;
        this.recipientRole = recipientRole;
        this.title = title;
        this.message = message;
        this.type = type;
        this.actionUrl = actionUrl;
        this.isRead = false;
        this.createdAt = new Date();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRecipientId() { return recipientId; }
    public void setRecipientId(String recipientId) { this.recipientId = recipientId; }

    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }

    public String getRecipientRole() { return recipientRole; }
    public void setRecipientRole(String recipientRole) { this.recipientRole = recipientRole; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getActionUrl() { return actionUrl; }
    public void setActionUrl(String actionUrl) { this.actionUrl = actionUrl; }

    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
}
