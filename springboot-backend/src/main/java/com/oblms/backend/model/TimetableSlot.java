package com.oblms.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "timetable_slots")
public class TimetableSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String day;

    @Column(nullable = false)
    private String period;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false)
    private String room;

    @Column(nullable = true)
    private String facultyName;

    @Column(nullable = true)
    private String department;

    @Column(nullable = true)
    private String batch;

    // Constructors
    public TimetableSlot() {}

    public TimetableSlot(Long id, String day, String period, String subject, String room) {
        this.id = id;
        this.day = day;
        this.period = period;
        this.subject = subject;
        this.room = room;
    }

    public TimetableSlot(Long id, String day, String period, String subject, String room, String facultyName) {
        this.id = id;
        this.day = day;
        this.period = period;
        this.subject = subject;
        this.room = room;
        this.facultyName = facultyName;
    }

    public TimetableSlot(Long id, String day, String period, String subject, String room, String facultyName, String department, String batch) {
        this.id = id;
        this.day = day;
        this.period = period;
        this.subject = subject;
        this.room = room;
        this.facultyName = facultyName;
        this.department = department;
        this.batch = batch;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDay() { return day; }
    public void setDay(String day) { this.day = day; }

    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getRoom() { return room; }
    public void setRoom(String room) { this.room = room; }

    public String getFacultyName() { return facultyName; }
    public void setFacultyName(String facultyName) { this.facultyName = facultyName; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getBatch() { return batch; }
    public void setBatch(String batch) { this.batch = batch; }
}
