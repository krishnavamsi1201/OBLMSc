package com.oblms.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "copo_mappings")
public class CoPoMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long cpid;  // ID from dataset 14.COtoPO_Mappings.csv
    private Long comid; // Reference to CourseOutcome
    private Long pgmid; // Reference to ProgramOutcome

    @Column(nullable = false)
    private String course; // Course / Subject Code (e.g. INMCA202, DS, MES)

    @Column(nullable = false)
    private String co; // CO1, CO2, CO3...

    @Column(nullable = false)
    private String po; // PO1, PO2, PO3...

    private int contribution;

    private int mappingLevel; // 1 (Low), 2 (Medium), 3 (High)

    private String status; // Pending, Approved

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

    public CoPoMapping(Long cpid, Long comid, Long pgmid, String course, String co, String po, int mappingLevel, String status) {
        this.cpid = cpid;
        this.comid = comid;
        this.pgmid = pgmid;
        this.course = course;
        this.co = co;
        this.po = po;
        this.contribution = mappingLevel * 33;
        this.mappingLevel = mappingLevel;
        this.status = status;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getCpid() { return cpid; }
    public void setCpid(Long cpid) { this.cpid = cpid; }

    public Long getComid() { return comid; }
    public void setComid(Long comid) { this.comid = comid; }

    public Long getPgmid() { return pgmid; }
    public void setPgmid(Long pgmid) { this.pgmid = pgmid; }

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
