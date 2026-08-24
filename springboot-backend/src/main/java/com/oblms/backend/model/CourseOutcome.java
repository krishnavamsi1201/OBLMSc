package com.oblms.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "course_outcomes")
public class CourseOutcome {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String course;

    @Column(nullable = false)
    private String co;

    @Column(length = 1000)
    private String description;

    // Constructors
    public CourseOutcome() {}

    public CourseOutcome(Long id, String course, String co, String description) {
        this.id = id;
        this.course = course;
        this.co = co;
        this.description = description;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCourse() { return course; }
    public void setCourse(String course) { this.course = course; }

    public String getCo() { return co; }
    public void setCo(String co) { this.co = co; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
