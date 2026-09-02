package com.oblms.backend.model;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

@Entity
@Table(name = "program_outcomes")
public class ProgramOutcome {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long pgmid; // ID from dataset 10.ProgramOutcome.csv

    @JsonProperty("poNumber")
    @JsonAlias({"po", "po_number", "ponumber"})
    @Column(name = "po_number", nullable = true)
    private String poNumber; // PO1, PO2, PO3... PO12

    @Column(name = "po", nullable = true)
    private String po;

    private String program; // MCA, B.Tech, etc.

    @Column(length = 2048)
    private String description;

    public ProgramOutcome() {}

    public ProgramOutcome(Long id, String poNumber, String description) {
        this.id = id;
        this.poNumber = poNumber;
        this.po = poNumber;
        this.program = "Engineering";
        this.description = description;
    }

    public ProgramOutcome(Long id, String poNumber, String program, String description) {
        this.id = id;
        this.poNumber = poNumber;
        this.po = poNumber;
        this.program = program;
        this.description = description;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPgmid() { return pgmid; }
    public void setPgmid(Long pgmid) { this.pgmid = pgmid; }

    public String getPo() { return poNumber != null ? poNumber : po; }
    public void setPo(String po) { 
        this.po = po; 
        if (this.poNumber == null) this.poNumber = po;
    }

    public String getPoNumber() { return poNumber != null ? poNumber : po; }
    public void setPoNumber(String poNumber) { 
        this.poNumber = poNumber; 
        this.po = poNumber;
    }

    public String getProgram() { return program; }
    public void setProgram(String program) { this.program = program; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
