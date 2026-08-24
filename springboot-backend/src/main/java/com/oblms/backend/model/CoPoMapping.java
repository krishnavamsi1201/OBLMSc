package com.oblms.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "copo_mappings")
public class CoPoMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String course;

    @Column(nullable = false)
    private String co;

    @Column(nullable = false)
    private String po;

    private int contribution;

    private int mappingLevel; // 1, 2, or 3

    private String status; // Pending, Approved

    // Constructors
    public CoPoMapping() {}

    public CoPoMapping(Long id, String course, String co, String po, int contribution, int mappingLevel, String status) {
        this.id = id;
        this.course = course;
        this.co = co;
        this.po = po;
        this.contribution = contribution;
        this.mappingLevel = mappingLevel;
        this.status = status;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCourse() { return course; }
    public void setCourse(String course) { this.course = course; }

    public String getCo() { return co; }
    public void setCo(String co) { this.co = co; }

    public String getPo() { return po; }
    public void setPo(String po) { this.po = po; }

    public int getContribution() { return contribution; }
    public void setContribution(int contribution) { this.contribution = contribution; }

    public int getMappingLevel() { return mappingLevel; }
    public void setMappingLevel(int mappingLevel) { this.mappingLevel = mappingLevel; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
