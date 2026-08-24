package com.oblms.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "student_marks")
public class StudentMark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String student;

    @Column(nullable = false)
    private String assessment;

    private double obtained;

    private double maxMarks;

    // Constructors
    public StudentMark() {}

    public StudentMark(Long id, String student, String assessment, double obtained, double maxMarks) {
        this.id = id;
        this.student = student;
        this.assessment = assessment;
        this.obtained = obtained;
        this.maxMarks = maxMarks;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getStudent() { return student; }
    public void setStudent(String student) { this.student = student; }

    public String getAssessment() { return assessment; }
    public void setAssessment(String assessment) { this.assessment = assessment; }

    public double getObtained() { return obtained; }
    public void setObtained(double obtained) { this.obtained = obtained; }

    public double getMaxMarks() { return maxMarks; }
    public void setMaxMarks(double maxMarks) { this.maxMarks = maxMarks; }
}
