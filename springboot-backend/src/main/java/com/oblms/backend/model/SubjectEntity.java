package com.oblms.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "curriculum_subjects")
public class SubjectEntity {

    @Id
    private Long subId; // 1, 2, 3...

    private String subjectName; // Probability and Statistics
    private String subjectType; // Theory, Lab, Elective
    private String subCode;     // INMCA202, DS, MES, IT305, OOP

    public SubjectEntity() {}

    public SubjectEntity(Long subId, String subjectName, String subjectType, String subCode) {
        this.subId = subId;
        this.subjectName = subjectName;
        this.subjectType = subjectType;
        this.subCode = subCode;
    }

    public Long getSubId() { return subId; }
    public void setSubId(Long subId) { this.subId = subId; }

    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }

    public String getSubjectType() { return subjectType; }
    public void setSubjectType(String subjectType) { this.subjectType = subjectType; }

    public String getSubCode() { return subCode; }
    public void setSubCode(String subCode) { this.subCode = subCode; }
}
