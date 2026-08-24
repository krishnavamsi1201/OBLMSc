package com.oblms.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "assessment_co_mappings")
public class AssessmentCOMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String assessmentName;

    private String assessmentType;

    private String courseId;

    private String courseName;

    @Column(length = 500)
    private String courseOutcomes; // Comma separated, e.g. "CO1,CO2"

    private int maxMarks;

    // Constructors
    public AssessmentCOMapping() {}

    public AssessmentCOMapping(Long id, String assessmentName, String assessmentType, String courseId, String courseName, String courseOutcomes, int maxMarks) {
        this.id = id;
        this.assessmentName = assessmentName;
        this.assessmentType = assessmentType;
        this.courseId = courseId;
        this.courseName = courseName;
        this.courseOutcomes = courseOutcomes;
        this.maxMarks = maxMarks;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getAssessmentName() { return assessmentName; }
    public void setAssessmentName(String assessmentName) { this.assessmentName = assessmentName; }

    public String getAssessmentType() { return assessmentType; }
    public void setAssessmentType(String assessmentType) { this.assessmentType = assessmentType; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }

    public String getCourseOutcomes() { return courseOutcomes; }
    public void setCourseOutcomes(String courseOutcomes) { this.courseOutcomes = courseOutcomes; }

    public int getMaxMarks() { return maxMarks; }
    public void setMaxMarks(int maxMarks) { this.maxMarks = maxMarks; }
}
