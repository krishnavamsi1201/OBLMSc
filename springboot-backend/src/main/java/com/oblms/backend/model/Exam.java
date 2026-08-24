package com.oblms.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "exams")
public class Exam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String course;

    @Column(nullable = false)
    private String date;

    @Column(nullable = false)
    private String room;

    @Column(nullable = false)
    private String status; // Scheduled, Ongoing, Completed

    private int marks;

    // Constructors
    public Exam() {}

    public Exam(Long id, String title, String course, String date, String room, String status, int marks) {
        this.id = id;
        this.title = title;
        this.course = course;
        this.date = date;
        this.room = room;
        this.status = status;
        this.marks = marks;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCourse() { return course; }
    public void setCourse(String course) { this.course = course; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getRoom() { return room; }
    public void setRoom(String room) { this.room = room; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getMarks() { return marks; }
    public void setMarks(int marks) { this.marks = marks; }
}
