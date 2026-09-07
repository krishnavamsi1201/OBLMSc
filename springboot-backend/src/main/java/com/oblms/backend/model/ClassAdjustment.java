package com.oblms.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "class_adjustments")
public class ClassAdjustment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String requesterId;

    @Column(nullable = false)
    private String requesterName;

    @Column(nullable = false)
    private String substituteId;

    @Column(nullable = false)
    private String substituteName;

    @Column(nullable = false)
    private String courseName;

    @Column(nullable = false)
    private String adjustmentDate;

    @Column(nullable = false)
    private String period;

    @Column(nullable = false)
    private String room;

    @Column(columnDefinition = "TEXT")
    private String topicInstructions;

    @Column(nullable = false)
    private String status; // PENDING, APPROVED, REJECTED

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt;

    public ClassAdjustment() {}

    public ClassAdjustment(Long id, String requesterId, String requesterName, String substituteId, String substituteName,
                           String courseName, String adjustmentDate, String period, String room, String topicInstructions,
                           String status, String rejectionReason) {
        this.id = id;
        this.requesterId = requesterId;
        this.requesterName = requesterName;
        this.substituteId = substituteId;
        this.substituteName = substituteName;
        this.courseName = courseName;
        this.adjustmentDate = adjustmentDate;
        this.period = period;
        this.room = room;
        this.topicInstructions = topicInstructions;
        this.status = status != null ? status : "PENDING";
        this.rejectionReason = rejectionReason;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRequesterId() { return requesterId; }
    public void setRequesterId(String requesterId) { this.requesterId = requesterId; }

    public String getRequesterName() { return requesterName; }
    public void setRequesterName(String requesterName) { this.requesterName = requesterName; }

    public String getSubstituteId() { return substituteId; }
    public void setSubstituteId(String substituteId) { this.substituteId = substituteId; }

    public String getSubstituteName() { return substituteName; }
    public void setSubstituteName(String substituteName) { this.substituteName = substituteName; }

    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }

    public String getAdjustmentDate() { return adjustmentDate; }
    public void setAdjustmentDate(String adjustmentDate) { this.adjustmentDate = adjustmentDate; }

    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }

    public String getRoom() { return room; }
    public void setRoom(String room) { this.room = room; }

    public String getTopicInstructions() { return topicInstructions; }
    public void setTopicInstructions(String topicInstructions) { this.topicInstructions = topicInstructions; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
