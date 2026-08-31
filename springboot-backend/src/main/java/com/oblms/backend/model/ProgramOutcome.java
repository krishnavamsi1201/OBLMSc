package com.oblms.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "program_outcomes")
public class ProgramOutcome {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long pgmid; // ID from dataset 10.ProgramOutcome.csv

    @Column(name = "po", nullable = false)
    private String poNumber; // PO1, PO2, PO3... PO12

    private String program; // MCA, B.Tech, etc.

    @Column(length = 2048)
    private String description;

    public ProgramOutcome() {}

    public ProgramOutcome(Long id, String poNumber, String description) {
        this.id = id;
        this.poNumber = poNumber;
        this.program = "Engineering";
        this.description = description;
    }

    public ProgramOutcome(Long id, String poNumber, String program, String description) {
        this.id = id;
        this.poNumber = poNumber;
        this.program = program;
        this.description = description;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPgmid() { return pgmid; }
    public void setPgmid(Long pgmid) { this.pgmid = pgmid; }

    public String getPo() { return poNumber; }
    public void setPo(String po) { this.poNumber = po; }

    public String getPoNumber() { return poNumber; }
    public void setPoNumber(String poNumber) { this.poNumber = poNumber; }

    public String getProgram() { return program; }
    public void setProgram(String program) { this.program = program; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
