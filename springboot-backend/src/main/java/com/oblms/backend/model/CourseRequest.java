package com.oblms.backend.model;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "course_requests")
public class CourseRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String studentId;
    private String studentName;
    private String studentEmail;
    private String regNo;
    private String department;
    private String courseCode;
    private String courseTitle;
    private String semester;
    private String status; // Pending, Approved, Rejected
    private String remarks;

    @Temporal(TemporalType.TIMESTAMP)
    private Date requestedAt = new Date();

    @Temporal(TemporalType.TIMESTAMP)
    private Date actionDate;

    public CourseRequest() {}

    public CourseRequest(Long id, String studentId, String studentName, String studentEmail, String regNo, String department, String courseCode, String courseTitle, String semester, String status) {
        this.id = id;
        this.studentId = studentId;
        this.studentName = studentName;
        this.studentEmail = studentEmail;
        this.regNo = regNo;
        this.department = department;
        this.courseCode = courseCode;
        this.courseTitle = courseTitle;
        this.semester = semester;
        this.status = status != null ? status : "Pending";
        this.requestedAt = new Date();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }

    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }

    public String getStudentEmail() { return studentEmail; }
    public void setStudentEmail(String studentEmail) { this.studentEmail = studentEmail; }

    public String getRegNo() { return regNo; }
    public void setRegNo(String regNo) { this.regNo = regNo; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }

    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }

    public String getSemester() { return semester; }
    public void setSemester(String semester) { this.semester = semester; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public Date getRequestedAt() { return requestedAt; }
    public void setRequestedAt(Date requestedAt) { this.requestedAt = requestedAt; }

    public Date getActionDate() { return actionDate; }
    public void setActionDate(Date actionDate) { this.actionDate = actionDate; }
}
