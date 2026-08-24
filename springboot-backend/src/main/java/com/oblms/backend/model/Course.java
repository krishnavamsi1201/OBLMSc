package com.oblms.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "courses")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String title;

    private String faculty;
    
    private String semester;

    // Constructors
    public Course() {}

    public Course(Long id, String code, String title, String faculty, String semester) {
        this.id = id;
        this.code = code;
        this.title = title;
        this.faculty = faculty;
        this.semester = semester;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getFaculty() { return faculty; }
    public void setFaculty(String faculty) { this.faculty = faculty; }

    public String getSemester() { return semester; }
    public void setSemester(String semester) { this.semester = semester; }
}
