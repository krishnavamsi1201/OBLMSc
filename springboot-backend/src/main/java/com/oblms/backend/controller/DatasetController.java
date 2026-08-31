package com.oblms.backend.controller;

import com.oblms.backend.model.*;
import com.oblms.backend.repository.*;
import com.oblms.backend.service.CSVSeederService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dataset")
@CrossOrigin(origins = "*")
public class DatasetController {

    @Autowired
    private AcademicStreamRepository streamRepository;

    @Autowired
    private AcademicProgramRepository programRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private CourseOutcomeRepository coRepository;

    @Autowired
    private ProgramOutcomeRepository poRepository;

    @Autowired
    private CoPoMappingRepository copoMappingRepository;

    @Autowired
    private CSVSeederService seederService;

    @GetMapping("/summary")
    public ResponseEntity<?> getDatasetSummary() {
        Map<String, Object> summary = new HashMap<>();
        summary.put("streamsCount", streamRepository.count());
        summary.put("programsCount", programRepository.count());
        summary.put("subjectsCount", subjectRepository.count());
        summary.put("courseOutcomesCount", coRepository.count());
        summary.put("programOutcomesCount", poRepository.count());
        summary.put("copoMappingsCount", copoMappingRepository.count());
        summary.put("datasetPath", "D:\\OBLMSc\\OBLMS Data Set\\Program & Course Data");
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/streams")
    public List<AcademicStream> getStreams() {
        return streamRepository.findAll();
    }

    @GetMapping("/programs")
    public List<AcademicProgram> getPrograms() {
        return programRepository.findAll();
    }

    @GetMapping("/subjects")
    public List<SubjectEntity> getSubjects(@RequestParam(required = false) String type) {
        if (type != null && !type.trim().isEmpty()) {
            return subjectRepository.findBySubjectTypeIgnoreCase(type.trim());
        }
        return subjectRepository.findAll();
    }

    @GetMapping("/cos")
    public List<CourseOutcome> getCourseOutcomes(@RequestParam(required = false) String course) {
        if (course != null && !course.trim().isEmpty()) {
            return coRepository.findByCourseIgnoreCase(course.trim());
        }
        return coRepository.findAll();
    }

    @GetMapping("/pos")
    public List<ProgramOutcome> getProgramOutcomes() {
        return poRepository.findAll();
    }

    @GetMapping("/copo-matrix")
    public List<CoPoMapping> getCopoMatrix(@RequestParam(required = false) String course) {
        if (course != null && !course.trim().isEmpty()) {
            return copoMappingRepository.findByCourseIgnoreCase(course.trim());
        }
        return copoMappingRepository.findAll();
    }

    @PostMapping("/reseed")
    public ResponseEntity<?> reseedDataset() {
        Map<String, Object> res = seederService.importAllDataset();
        return ResponseEntity.ok(res);
    }
}
