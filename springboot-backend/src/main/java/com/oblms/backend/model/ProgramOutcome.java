package com.oblms.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "program_outcomes")
public class ProgramOutcome {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String poNumber;

    @Column(length = 1000, nullable = false)
    private String description;

    // Constructors
    public ProgramOutcome() {}

    public ProgramOutcome(Long id, String poNumber, String description) {
        this.id = id;
        this.poNumber = poNumber;
        this.description = description;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPoNumber() { return poNumber; }
    public void setPoNumber(String poNumber) { this.poNumber = poNumber; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
