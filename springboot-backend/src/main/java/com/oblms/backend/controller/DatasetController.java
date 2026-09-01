package com.oblms.backend.controller;

import com.oblms.backend.model.*;
import com.oblms.backend.repository.*;
import com.oblms.backend.service.CSVSeederService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

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
    public List<SubjectEntity> getSubjects(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String student,
            @RequestParam(required = false) String department) {

        List<SubjectEntity> all = subjectRepository.findAll();

        // 1. Filter by student registered / enrolled subjects
        if (student != null && !student.trim().isEmpty()) {
            String q = student.trim();
            Optional<User> uOpt = userRepository.findById(q);
            if (uOpt.isEmpty()) {
                uOpt = userRepository.findByEmailIgnoreCase(q);
            }
            if (uOpt.isEmpty()) {
                uOpt = userRepository.findAll().stream()
                    .filter(u -> u.getName().equalsIgnoreCase(q))
                    .findFirst();
            }

            if (uOpt.isPresent()) {
                User user = uOpt.get();
                String enrolled = user.getEnrolledCourses();
                String dept = user.getDepartment();

                if (enrolled != null && !enrolled.isEmpty()) {
                    List<String> codes = java.util.Arrays.stream(enrolled.split(","))
                        .map(String::trim)
                        .map(String::toLowerCase)
                        .toList();

                    List<SubjectEntity> studentSubjects = all.stream()
                        .filter(s -> codes.contains(s.getSubCode().toLowerCase()) || 
                                     codes.contains(s.getSubjectName().toLowerCase()) ||
                                     codes.stream().anyMatch(c -> s.getSubCode().toLowerCase().contains(c) || s.getSubjectName().toLowerCase().contains(c)))
                        .toList();

                    if (!studentSubjects.isEmpty()) {
                        if (type != null && !type.trim().isEmpty()) {
                            return studentSubjects.stream()
                                .filter(s -> s.getSubjectType() != null && s.getSubjectType().equalsIgnoreCase(type.trim()))
                                .toList();
                        }
                        return studentSubjects;
                    }
                }

                // If specific enrolled courses didn't match directly, filter by student's branch/department
                if (dept != null && !dept.isEmpty()) {
                    return filterSubjectsByDepartment(all, dept, type);
                }
            }
        }

        // 2. Filter by department
        if (department != null && !department.trim().isEmpty()) {
            return filterSubjectsByDepartment(all, department.trim(), type);
        }

        // 3. Filter by type only
        if (type != null && !type.trim().isEmpty()) {
            return subjectRepository.findBySubjectTypeIgnoreCase(type.trim());
        }

        return all;
    }

    private List<SubjectEntity> filterSubjectsByDepartment(List<SubjectEntity> all, String dept, String type) {
        String d = dept.toLowerCase();
        List<SubjectEntity> filtered;

        if (d.contains("computer") || d.contains("cse")) {
            filtered = all.stream().filter(s -> {
                String c = s.getSubCode().toUpperCase();
                String n = s.getSubjectName().toLowerCase();
                return c.startsWith("CS") || c.startsWith("IT") || n.contains("database") || n.contains("java") || n.contains("algorithm") || n.contains("network") || n.contains("operating") || n.contains("software") || n.contains("python") || n.contains("structure") || n.contains("compiler") || n.contains("cloud");
            }).toList();
        } else if (d.contains("information") || d.contains("it")) {
            filtered = all.stream().filter(s -> {
                String c = s.getSubCode().toUpperCase();
                String n = s.getSubjectName().toLowerCase();
                return c.startsWith("IT") || c.startsWith("CS") || n.contains("web") || n.contains("linux") || n.contains("cloud") || n.contains("security") || n.contains("information") || n.contains("data");
            }).toList();
        } else if (d.contains("electronic") || d.contains("ece")) {
            filtered = all.stream().filter(s -> {
                String c = s.getSubCode().toUpperCase();
                String n = s.getSubjectName().toLowerCase();
                return c.startsWith("EC") || c.startsWith("EE") || c.equals("MES") || c.equals("DSLD") || n.contains("micro") || n.contains("signal") || n.contains("circuit") || n.contains("analog") || n.contains("digital") || n.contains("communication");
            }).toList();
        } else if (d.contains("mechanical") || d.contains("me")) {
            filtered = all.stream().filter(s -> {
                String c = s.getSubCode().toUpperCase();
                String n = s.getSubjectName().toLowerCase();
                return c.startsWith("ME") || c.equals("KM") || c.equals("SMSE") || c.equals("IC") || n.contains("thermo") || n.contains("fluid") || n.contains("kinematic") || n.contains("mechanic") || n.contains("manufacturing") || n.contains("cad");
            }).toList();
        } else if (d.contains("civil") || d.contains("ce")) {
            filtered = all.stream().filter(s -> {
                String c = s.getSubCode().toUpperCase();
                String n = s.getSubjectName().toLowerCase();
                return c.startsWith("CE") || c.equals("FMHM") || c.equals("EMII") || n.contains("structural") || n.contains("survey") || n.contains("concrete") || n.contains("geotechnical") || n.contains("transportation") || n.contains("hydraulic");
            }).toList();
        } else {
            filtered = all;
        }

        if (type != null && !type.trim().isEmpty()) {
            return filtered.stream()
                .filter(s -> s.getSubjectType() != null && s.getSubjectType().equalsIgnoreCase(type.trim()))
                .toList();
        }
        return filtered.isEmpty() ? all : filtered;
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
