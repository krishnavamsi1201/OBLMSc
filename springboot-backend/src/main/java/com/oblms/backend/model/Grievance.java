package com.oblms.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "grievances")
public class Grievance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000, nullable = false)
    private String description;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String studentName;

    @Column(nullable = false)
    private String status; // Open, In Review, Resolved

    @Column(nullable = false)
    private String date;

    private String resolution;

    // Constructors
    public Grievance() {}

    public Grievance(Long id, String title, String description, String category, String studentName, String status, String date, String resolution) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.category = category;
        this.studentName = studentName;
        this.status = status;
        this.date = date;
        this.resolution = resolution;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getResolution() { return resolution; }
    public void setResolution(String resolution) { this.resolution = resolution; }
}
