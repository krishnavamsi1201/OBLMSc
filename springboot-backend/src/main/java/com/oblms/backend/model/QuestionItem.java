package com.oblms.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "question_bank")
public class QuestionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 1000, nullable = false)
    private String questionText;

    private String type; // MCQ, Short Answer, Essay

    private String difficulty; // Easy, Medium, Hard

    private String bloomsLevel; // L1: Remember, L2: Understand, L3: Apply, L4: Analyze, L5: Evaluate, L6: Create

    private int marks;

    private String subject;

    private String coMapped; // CO1, CO2, CO3, CO4, CO5

    public QuestionItem() {}

    public QuestionItem(Long id, String questionText, String type, String difficulty, String bloomsLevel, int marks, String subject, String coMapped) {
        this.id = id;
        this.questionText = questionText;
        this.type = type;
        this.difficulty = difficulty;
        this.bloomsLevel = bloomsLevel;
        this.marks = marks;
        this.subject = subject;
        this.coMapped = coMapped;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }

    public String getBloomsLevel() { return bloomsLevel; }
    public void setBloomsLevel(String bloomsLevel) { this.bloomsLevel = bloomsLevel; }

    public int getMarks() { return marks; }
    public void setMarks(int marks) { this.marks = marks; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getCoMapped() { return coMapped; }
    public void setCoMapped(String coMapped) { this.coMapped = coMapped; }
}
