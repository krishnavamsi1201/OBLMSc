package com.oblms.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "academic_programs")
public class AcademicProgram {

    @Id
    private Long branchId; // e.g. 35

    private String branchName; // e.g. Computer Science & Engineering
    private Long courseId;     // e.g. 1001 (Stream)
    private int branchStatus;
    private String deptCode;   // e.g. 24
    private String shortCode;  // e.g. CSE, IT, ECE

    public AcademicProgram() {}

    public AcademicProgram(Long branchId, String branchName, Long courseId, int branchStatus, String deptCode, String shortCode) {
        this.branchId = branchId;
        this.branchName = branchName;
        this.courseId = courseId;
        this.branchStatus = branchStatus;
        this.deptCode = deptCode;
        this.shortCode = shortCode;
    }

    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }

    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }

    public int getBranchStatus() { return branchStatus; }
    public void setBranchStatus(int branchStatus) { this.branchStatus = branchStatus; }

    public String getDeptCode() { return deptCode; }
    public void setDeptCode(String deptCode) { this.deptCode = deptCode; }

    public String getShortCode() { return shortCode; }
    public void setShortCode(String shortCode) { this.shortCode = shortCode; }
}
