package com.oblms.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "course_outcomes")
public class CourseOutcome {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long comid; // ID from dataset 9.CourseOutcome.csv

    private Long semSubId;

    private String course; // Course / Subject code (e.g. INMCA202, DS, MES)

    private String co; // CO1, CO2, CO3, CO4, CO5, CO6

    @Column(length = 2048)
    private String description;

    public CourseOutcome() {}

    public CourseOutcome(Long id, String course, String co, String description) {
        this.id = id;
        this.course = course;
        this.co = co;
        this.description = description;
    }

    public CourseOutcome(Long comid, Long semSubId, String course, String co, String description) {
        this.comid = comid;
        this.semSubId = semSubId;
        this.course = course;
        this.co = co;
        this.description = description;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getComid() { return comid; }
    public void setComid(Long comid) { this.comid = comid; }

    public Long getSemSubId() { return semSubId; }
    public void setSemSubId(Long semSubId) { this.semSubId = semSubId; }

    public String getCourse() { return course; }
    public void setCourse(String course) { this.course = course; }

    public String getCo() { return co; }
    public void setCo(String co) { this.co = co; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
