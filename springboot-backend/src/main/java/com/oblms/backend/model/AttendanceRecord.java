package com.oblms.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "attendance_records")
public class AttendanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String student;

    @Column(nullable = false)
    private String courseCode;

    @Column(nullable = false)
    private String date;

    @Column(nullable = false)
    private String status;

    // Constructors
    public AttendanceRecord() {}

    public AttendanceRecord(Long id, String student, String courseCode, String date, String status) {
        this.id = id;
        this.student = student;
        this.courseCode = courseCode;
        this.date = date;
        this.status = status;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getStudent() { return student; }
    public void setStudent(String student) { this.student = student; }

    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
