package com.oblms.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "academic_streams")
public class AcademicStream {

    @Id
    private Long courseId; // 1001, 1002, 1003, etc.

    private String courseName; // B.Tech, M.Tech, MCA, PhD
    private String courseType; // UG, PG, PhD
    private int duration;      // 4, 2, 3, etc.
    private int status;

    public AcademicStream() {}

    public AcademicStream(Long courseId, String courseName, String courseType, int duration, int status) {
        this.courseId = courseId;
        this.courseName = courseName;
        this.courseType = courseType;
        this.duration = duration;
        this.status = status;
    }

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }

    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }

    public String getCourseType() { return courseType; }
    public void setCourseType(String courseType) { this.courseType = courseType; }

    public int getDuration() { return duration; }
    public void setDuration(int duration) { this.duration = duration; }

    public int getStatus() { return status; }
    public void setStatus(int status) { this.status = status; }
}
