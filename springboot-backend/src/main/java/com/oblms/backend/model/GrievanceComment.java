package com.oblms.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "grievance_comments")
public class GrievanceComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long grievanceId;

    @Column(nullable = false)
    private String sender;

    @Column(nullable = false)
    private String role;

    @Column(length = 1000, nullable = false)
    private String text;

    @Column(nullable = false)
    private String timestamp;

    // Constructors
    public GrievanceComment() {}

    public GrievanceComment(Long id, Long grievanceId, String sender, String role, String text, String timestamp) {
        this.id = id;
        this.grievanceId = grievanceId;
        this.sender = sender;
        this.role = role;
        this.text = text;
        this.timestamp = timestamp;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getGrievanceId() { return grievanceId; }
    public void setGrievanceId(Long grievanceId) { this.grievanceId = grievanceId; }

    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
}
