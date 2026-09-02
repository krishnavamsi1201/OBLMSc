package com.oblms.backend.controller;

import com.oblms.backend.model.*;
import com.oblms.backend.repository.*;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/copo")
@CrossOrigin(origins = "*")
public class CopoMappingController {

    @Autowired
    private ProgramOutcomeRepository programOutcomeRepository;

    @Autowired
    private CourseOutcomeRepository courseOutcomeRepository;

    @Autowired
    private CoPoMappingRepository coPoMappingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    // Defined branch course catalogs
    public static final Map<String, List<String>> BRANCH_COURSES = new LinkedHashMap<>();
    static {
        BRANCH_COURSES.put("CSE", List.of("CS101", "CS102", "CS103", "CS301", "CS302", "CS102L", "RLMCA205", "CC", "OOP"));
        BRANCH_COURSES.put("IT", List.of("IT305", "CS303", "Linux", "WT", "CS361", "Linux Lab", "Open Lab"));
        BRANCH_COURSES.put("ECE", List.of("MES", "DSLD", "EC206", "EE407", "CS203", "CS207", "AMP", "LD LAB"));
        BRANCH_COURSES.put("ME", List.of("ME210", "KM", "SMSE", "04ME6512", "IC", "AU203", "EM IV"));
        BRANCH_COURSES.put("Civil", List.of("FMHM", "SMSE", "HS300", "CE234", "EMII", "ECS"));
    }

    public List<String> getFacultyCourseCodes(String facultyParam) {
        if (facultyParam == null || facultyParam.trim().isEmpty()) {
            return Collections.emptyList();
        }
        String q = facultyParam.trim();
        List<String> codes = new ArrayList<>();

        Optional<User> uOpt = userRepository.findById(q);
        if (uOpt.isEmpty()) {
            uOpt = userRepository.findByEmailIgnoreCase(q);
        }
        if (uOpt.isEmpty()) {
            uOpt = userRepository.findAll().stream()
                .filter(u -> u.getName() != null && u.getName().equalsIgnoreCase(q))
                .findFirst();
        }

        if (uOpt.isPresent() && uOpt.get().getEnrolledCourses() != null && !uOpt.get().getEnrolledCourses().isEmpty()) {
            codes.addAll(Arrays.stream(uOpt.get().getEnrolledCourses().split(","))
                .map(String::trim)
                .map(String::toUpperCase)
                .toList());
        }

        List<Course> matchingCourses = courseRepository.findByFacultyContainingIgnoreCase(q);
        for (Course c : matchingCourses) {
            if (c.getCode() != null && !codes.contains(c.getCode().toUpperCase())) {
                codes.add(c.getCode().toUpperCase());
            }
        }
        return codes;
    }

    @PostConstruct
    public void seedOutcomes() {
        seedProgramOutcomes();
        seedCourseOutcomes();
        seedBranchSpecificMappings();
    }

    private void seedProgramOutcomes() {
        if (programOutcomeRepository.count() < 14) {
            programOutcomeRepository.deleteAll();
            List<ProgramOutcome> pos = List.of(
                new ProgramOutcome(null, "PO1", "Computer Science & Engineering", "Engineering Knowledge: Apply mathematics, science, and engineering fundamentals to solve complex computing problems."),
                new ProgramOutcome(null, "PO2", "Computer Science & Engineering", "Problem Analysis: Identify, formulate, review research literature, and analyze complex engineering problems."),
                new ProgramOutcome(null, "PO3", "Computer Science & Engineering", "Design & Development of Solutions: Design system components, databases, and algorithms meeting specified needs."),
                new ProgramOutcome(null, "PO4", "Computer Science & Engineering", "Conduct Investigations of Complex Problems: Use research-based knowledge and methods including design of experiments."),
                new ProgramOutcome(null, "PO5", "Computer Science & Engineering", "Modern Tool Usage: Create, select, and apply appropriate techniques, resources, and modern IT and engineering tools."),
                new ProgramOutcome(null, "PO6", "Computer Science & Engineering", "The Engineer and Society: Apply reasoning informed by contextual knowledge to assess societal and safety issues."),
                new ProgramOutcome(null, "PO7", "Computer Science & Engineering", "Environment and Sustainability: Understand the impact of professional engineering solutions in environmental contexts."),
                new ProgramOutcome(null, "PO8", "Computer Science & Engineering", "Ethics & Integrity: Apply ethical principles and commit to professional ethics and responsibilities."),
                new ProgramOutcome(null, "PO9", "Computer Science & Engineering", "Individual and Team Work: Function effectively as an individual, and as a member or leader in diverse teams."),
                new ProgramOutcome(null, "PO10", "Computer Science & Engineering", "Communication: Communicate effectively on complex engineering activities with technical and public audiences."),
                new ProgramOutcome(null, "PO11", "Computer Science & Engineering", "Project Management and Finance: Demonstrate knowledge and understanding of engineering and management principles."),
                new ProgramOutcome(null, "PO12", "Computer Science & Engineering", "Life-long Learning: Recognize the need for, and have the preparation to engage in independent life-long learning."),
                new ProgramOutcome(null, "PSO1", "Computer Science & Engineering", "Professional Software Systems: Design and implement reliable, scalable enterprise backend architectures and data pipelines."),
                new ProgramOutcome(null, "PSO2", "Computer Science & Engineering", "Intelligent Computing & AI: Apply machine learning, data engineering, and intelligent algorithmic workflows.")
            );
            programOutcomeRepository.saveAll(pos);
        }
    }

    private void seedCourseOutcomes() {
        if (courseOutcomeRepository.count() < 20) {
            List<CourseOutcome> cos = new ArrayList<>();
            // CSE
            cos.add(new CourseOutcome(null, "CS101", "CO1", "Explain relational schema architecture, ER modeling, and keys."));
            cos.add(new CourseOutcome(null, "CS101", "CO2", "Construct complex SQL queries with joins, aggregate functions, and nested subqueries."));
            cos.add(new CourseOutcome(null, "CS101", "CO3", "Apply normalization rules (1NF, 2NF, 3NF, BCNF) to reduce redundancy."));
            cos.add(new CourseOutcome(null, "CS101", "CO4", "Manage ACID transactions, concurrency locking, and crash recovery."));
            cos.add(new CourseOutcome(null, "CS101", "CO5", "Design scalable relational database models and indexing strategies."));

            cos.add(new CourseOutcome(null, "CS102", "CO1", "Analyze asymptotic time and space complexities for dynamic algorithms."));
            cos.add(new CourseOutcome(null, "CS102", "CO2", "Implement linear data structures (Stacks, Queues, Linked Lists)."));
            cos.add(new CourseOutcome(null, "CS102", "CO3", "Construct and traverse trees (BST, AVL) and graph BFS/DFS paths."));
            cos.add(new CourseOutcome(null, "CS102", "CO4", "Apply greedy and dynamic programming paradigms to optimization problems."));
            cos.add(new CourseOutcome(null, "CS102", "CO5", "Design hash tables and collision resolution indexing techniques."));

            cos.add(new CourseOutcome(null, "CS103", "CO1", "Explain OS dual-mode execution, system calls, and kernel architecture."));
            cos.add(new CourseOutcome(null, "CS103", "CO2", "Analyze CPU scheduling algorithms and thread synchronization."));
            cos.add(new CourseOutcome(null, "CS103", "CO3", "Resolve deadlock conditions using Banker's Algorithm and Semaphores."));
            cos.add(new CourseOutcome(null, "CS103", "CO4", "Evaluate virtual memory paging, segmentation, and replacement algorithms."));
            cos.add(new CourseOutcome(null, "CS103", "CO5", "Design secure file system structures and disk scheduling policies."));

            cos.add(new CourseOutcome(null, "CS301", "CO1", "Contrast traditional SDLC models with Agile Scrum sprint workflows."));
            cos.add(new CourseOutcome(null, "CS301", "CO2", "Draft Software Requirement Specifications (SRS) and UML system models."));
            cos.add(new CourseOutcome(null, "CS301", "CO3", "Apply architectural design patterns and microservice modularization."));
            cos.add(new CourseOutcome(null, "CS301", "CO4", "Execute automated test suites, integration tests, and code coverage."));
            cos.add(new CourseOutcome(null, "CS301", "CO5", "Estimate software project metrics, COCOMO cost models, and risk management."));

            cos.add(new CourseOutcome(null, "CS302", "CO1", "Explain OSI 7-layer and TCP/IP protocol architectures."));
            cos.add(new CourseOutcome(null, "CS302", "CO2", "Calculate IP addressing, CIDR subnetting, and configure routing protocols."));
            cos.add(new CourseOutcome(null, "CS302", "CO3", "Analyze transport layer flow control (TCP sliding window) and congestion."));
            cos.add(new CourseOutcome(null, "CS302", "CO4", "Examine application layer protocols (HTTP, DNS, SMTP) and socket APIs."));
            cos.add(new CourseOutcome(null, "CS302", "CO5", "Implement network security, TLS encryption, and firewall protections."));

            // IT
            cos.add(new CourseOutcome(null, "CS303", "CO1", "Explain cloud service models (IaaS, PaaS, SaaS) and hypervisors."));
            cos.add(new CourseOutcome(null, "CS303", "CO2", "Deploy scalable cloud compute instances and serverless functions."));
            cos.add(new CourseOutcome(null, "CS303", "CO3", "Build containerized applications using Docker and Kubernetes clusters."));
            cos.add(new CourseOutcome(null, "CS303", "CO4", "Construct CI/CD automation pipelines using GitHub Actions and Terraform."));
            cos.add(new CourseOutcome(null, "CS303", "CO5", "Manage cloud IAM security, encryption, and disaster recovery."));

            cos.add(new CourseOutcome(null, "WT", "CO1", "Understand HTML5, CSS3 grid layouts, and asynchronous JavaScript."));
            cos.add(new CourseOutcome(null, "WT", "CO2", "Develop Single Page Applications using Angular component frameworks."));
            cos.add(new CourseOutcome(null, "WT", "CO3", "Design RESTful microservices using Spring Boot and JWT security."));
            cos.add(new CourseOutcome(null, "WT", "CO4", "Integrate client interfaces with ORM database persistence layers."));
            cos.add(new CourseOutcome(null, "WT", "CO5", "Secure web applications against OWASP Top-10 vulnerabilities."));

            // ECE
            cos.add(new CourseOutcome(null, "MES", "CO1", "Explain 8086 and ARM microcontroller internal register architectures."));
            cos.add(new CourseOutcome(null, "MES", "CO2", "Write Assembly and Embedded-C programs for hardware interrupt routines."));
            cos.add(new CourseOutcome(null, "MES", "CO3", "Design peripheral interfacing (8255 PPI, Timers, ADC/DAC) with buses."));
            cos.add(new CourseOutcome(null, "MES", "CO4", "Interface real-world sensors, actuators, and LCDs with microcontrollers."));
            cos.add(new CourseOutcome(null, "MES", "CO5", "Develop real-time embedded firmware running under RTOS scheduling."));

            cos.add(new CourseOutcome(null, "DSLD", "CO1", "Apply Boolean algebra and K-Maps to minimize combinational logic circuits."));
            cos.add(new CourseOutcome(null, "DSLD", "CO2", "Design modular arithmetic logic units (ALU), Multiplexers, and Decoders."));
            cos.add(new CourseOutcome(null, "DSLD", "CO3", "Analyze synchronous sequential circuits, flip-flops, and counters."));
            cos.add(new CourseOutcome(null, "DSLD", "CO4", "Synthesize Finite State Machines (Mealy and Moore models)."));
            cos.add(new CourseOutcome(null, "DSLD", "CO5", "Implement digital systems using Verilog/VHDL on FPGA targets."));

            // ME
            cos.add(new CourseOutcome(null, "KM", "CO1", "Explain degrees of freedom and kinematic inversions of 4-bar chains."));
            cos.add(new CourseOutcome(null, "KM", "CO2", "Calculate velocity and acceleration vectors in planar machine linkages."));
            cos.add(new CourseOutcome(null, "KM", "CO3", "Synthesize cam-follower profiles for specified motion curves."));
            cos.add(new CourseOutcome(null, "KM", "CO4", "Analyze epicyclic and compound gear trains for power transmission."));
            cos.add(new CourseOutcome(null, "KM", "CO5", "Evaluate belt and rope drives under centrifugal tension."));

            cos.add(new CourseOutcome(null, "IC", "CO1", "Compare Otto, Diesel, and Dual thermodynamic combustion cycles."));
            cos.add(new CourseOutcome(null, "IC", "CO2", "Calculate fuel-air mixture requirements and CRDI injection parameters."));
            cos.add(new CourseOutcome(null, "IC", "CO3", "Analyze engine brake thermal efficiency and specific fuel consumption."));
            cos.add(new CourseOutcome(null, "IC", "CO4", "Evaluate emission standards and catalytic converter exhaust controls."));
            cos.add(new CourseOutcome(null, "IC", "CO5", "Investigate alternate biofuels and hybrid electric powertrain systems."));

            // Civil
            cos.add(new CourseOutcome(null, "FMHM", "CO1", "Explain fluid pressure properties, Pascal's law, and buoyancy stability."));
            cos.add(new CourseOutcome(null, "FMHM", "CO2", "Apply Bernoulli's energy equation to fluid measurement venturimeters."));
            cos.add(new CourseOutcome(null, "FMHM", "CO3", "Analyze pipe friction losses and hydraulic gradient lines."));
            cos.add(new CourseOutcome(null, "FMHM", "CO4", "Calculate hydrodynamic boundary layer forces on submerged bodies."));
            cos.add(new CourseOutcome(null, "FMHM", "CO5", "Evaluate performance characteristics of Pelton, Francis, and Kaplan turbines."));

            cos.add(new CourseOutcome(null, "SMSE", "CO1", "Calculate stress-strain relationships and thermal elastic stresses."));
            cos.add(new CourseOutcome(null, "SMSE", "CO2", "Construct Shear Force (SFD) and Bending Moment Diagrams (BMD)."));
            cos.add(new CourseOutcome(null, "SMSE", "CO3", "Analyze flexural and shear stress distributions across structural beams."));
            cos.add(new CourseOutcome(null, "SMSE", "CO4", "Evaluate structural beam deflections under transverse loadings."));
            cos.add(new CourseOutcome(null, "SMSE", "CO5", "Design structural columns resisting Euler and Rankine buckling."));

            courseOutcomeRepository.saveAll(cos);
        }
    }

    private void seedBranchSpecificMappings() {
        if (coPoMappingRepository.count() < 50) {
            coPoMappingRepository.deleteAll();
            List<CoPoMapping> mappings = new ArrayList<>();

            // 1. CSE Mappings
            addMapping(mappings, "CS101", "CO1", "PO1", 3);
            addMapping(mappings, "CS101", "CO2", "PO2", 3);
            addMapping(mappings, "CS101", "CO3", "PO3", 3);
            addMapping(mappings, "CS101", "CO4", "PO8", 2);
            addMapping(mappings, "CS101", "CO5", "PO5", 3);
            addMapping(mappings, "CS101", "CO5", "PSO1", 3);

            addMapping(mappings, "CS102", "CO1", "PO1", 3);
            addMapping(mappings, "CS102", "CO2", "PO2", 3);
            addMapping(mappings, "CS102", "CO3", "PO3", 3);
            addMapping(mappings, "CS102", "CO4", "PO4", 2);
            addMapping(mappings, "CS102", "CO5", "PO5", 3);
            addMapping(mappings, "CS102", "CO5", "PSO2", 3);

            addMapping(mappings, "CS103", "CO1", "PO1", 3);
            addMapping(mappings, "CS103", "CO2", "PO2", 3);
            addMapping(mappings, "CS103", "CO3", "PO3", 3);
            addMapping(mappings, "CS103", "CO4", "PO4", 2);
            addMapping(mappings, "CS103", "CO5", "PO5", 3);
            addMapping(mappings, "CS103", "CO5", "PSO1", 3);

            addMapping(mappings, "CS301", "CO1", "PO1", 2);
            addMapping(mappings, "CS301", "CO2", "PO2", 3);
            addMapping(mappings, "CS301", "CO3", "PO3", 3);
            addMapping(mappings, "CS301", "CO4", "PO9", 3);
            addMapping(mappings, "CS301", "CO5", "PO10", 3);
            addMapping(mappings, "CS301", "CO5", "PO11", 3);
            addMapping(mappings, "CS301", "CO5", "PSO1", 3);

            addMapping(mappings, "CS302", "CO1", "PO1", 3);
            addMapping(mappings, "CS302", "CO2", "PO2", 3);
            addMapping(mappings, "CS302", "CO3", "PO3", 3);
            addMapping(mappings, "CS302", "CO4", "PO5", 3);
            addMapping(mappings, "CS302", "CO5", "PO8", 3);
            addMapping(mappings, "CS302", "CO5", "PO12", 2);

            addMapping(mappings, "CS102L", "CO1", "PO1", 3);
            addMapping(mappings, "CS102L", "CO2", "PO3", 3);
            addMapping(mappings, "CS102L", "CO3", "PO5", 3);

            addMapping(mappings, "CC", "CO1", "PO1", 3);
            addMapping(mappings, "CC", "CO2", "PO2", 3);
            addMapping(mappings, "CC", "CO3", "PO3", 3);

            addMapping(mappings, "OOP", "CO1", "PO1", 3);
            addMapping(mappings, "OOP", "CO2", "PO2", 3);
            addMapping(mappings, "OOP", "CO3", "PO3", 3);

            // 2. IT Mappings
            addMapping(mappings, "CS303", "CO1", "PO1", 3);
            addMapping(mappings, "CS303", "CO2", "PO3", 3);
            addMapping(mappings, "CS303", "CO3", "PO5", 3);
            addMapping(mappings, "CS303", "CO4", "PO7", 2);
            addMapping(mappings, "CS303", "CO5", "PO11", 3);
            addMapping(mappings, "CS303", "CO5", "PSO1", 3);

            addMapping(mappings, "WT", "CO1", "PO1", 3);
            addMapping(mappings, "WT", "CO2", "PO2", 3);
            addMapping(mappings, "WT", "CO3", "PO3", 3);
            addMapping(mappings, "WT", "CO4", "PO5", 3);
            addMapping(mappings, "WT", "CO5", "PO8", 3);
            addMapping(mappings, "WT", "CO5", "PSO1", 3);

            addMapping(mappings, "Linux", "CO1", "PO1", 3);
            addMapping(mappings, "Linux", "CO2", "PO5", 3);
            addMapping(mappings, "Linux", "CO3", "PO12", 3);

            addMapping(mappings, "CS361", "CO1", "PO1", 3);
            addMapping(mappings, "CS361", "CO2", "PO2", 3);
            addMapping(mappings, "CS361", "CO3", "PO3", 3);
            addMapping(mappings, "CS361", "CO4", "PSO2", 3);

            // 3. ECE Mappings
            addMapping(mappings, "MES", "CO1", "PO1", 3);
            addMapping(mappings, "MES", "CO2", "PO2", 3);
            addMapping(mappings, "MES", "CO3", "PO3", 3);
            addMapping(mappings, "MES", "CO4", "PO5", 3);
            addMapping(mappings, "MES", "CO5", "PO12", 3);

            addMapping(mappings, "DSLD", "CO1", "PO1", 3);
            addMapping(mappings, "DSLD", "CO2", "PO2", 3);
            addMapping(mappings, "DSLD", "CO3", "PO3", 3);
            addMapping(mappings, "DSLD", "CO4", "PO5", 3);

            addMapping(mappings, "EC206", "CO1", "PO1", 3);
            addMapping(mappings, "EC206", "CO2", "PO2", 3);
            addMapping(mappings, "EC206", "CO3", "PO3", 3);

            addMapping(mappings, "EE407", "CO1", "PO1", 3);
            addMapping(mappings, "EE407", "CO2", "PO2", 3);
            addMapping(mappings, "EE407", "CO3", "PO3", 3);
            addMapping(mappings, "EE407", "CO4", "PO5", 3);

            addMapping(mappings, "CS203", "CO1", "PO1", 3);
            addMapping(mappings, "CS203", "CO2", "PO2", 3);
            addMapping(mappings, "CS203", "CO3", "PO3", 3);

            // 4. ME Mappings
            addMapping(mappings, "KM", "CO1", "PO1", 3);
            addMapping(mappings, "KM", "CO2", "PO2", 3);
            addMapping(mappings, "KM", "CO3", "PO3", 3);
            addMapping(mappings, "KM", "CO4", "PO5", 2);

            addMapping(mappings, "IC", "CO1", "PO1", 3);
            addMapping(mappings, "IC", "CO2", "PO2", 3);
            addMapping(mappings, "IC", "CO3", "PO6", 3);
            addMapping(mappings, "IC", "CO4", "PO7", 3);

            addMapping(mappings, "04ME6512", "CO1", "PO1", 3);
            addMapping(mappings, "04ME6512", "CO2", "PO3", 3);
            addMapping(mappings, "04ME6512", "CO3", "PO5", 3);
            addMapping(mappings, "04ME6512", "CO4", "PO11", 3);

            addMapping(mappings, "ME210", "CO1", "PO1", 3);
            addMapping(mappings, "ME210", "CO2", "PO2", 3);

            // 5. Civil Mappings
            addMapping(mappings, "FMHM", "CO1", "PO1", 3);
            addMapping(mappings, "FMHM", "CO2", "PO2", 3);
            addMapping(mappings, "FMHM", "CO3", "PO3", 3);
            addMapping(mappings, "FMHM", "CO4", "PO7", 3);

            addMapping(mappings, "SMSE", "CO1", "PO1", 3);
            addMapping(mappings, "SMSE", "CO2", "PO2", 3);
            addMapping(mappings, "SMSE", "CO3", "PO3", 3);
            addMapping(mappings, "SMSE", "CO4", "PO6", 3);

            addMapping(mappings, "HS300", "CO1", "PO8", 3);
            addMapping(mappings, "HS300", "CO2", "PO9", 3);
            addMapping(mappings, "HS300", "CO3", "PO10", 3);
            addMapping(mappings, "HS300", "CO4", "PO11", 3);

            coPoMappingRepository.saveAll(mappings);
        }
    }

    private void addMapping(List<CoPoMapping> list, String course, String co, String po, int level) {
        list.add(new CoPoMapping(null, course, co, po, level * 33, level, "Approved"));
    }

    // Program Outcomes
    @GetMapping("/po")
    public List<ProgramOutcome> getAllPOs(
            @RequestParam(required = false) String department, 
            @RequestParam(required = false) String branch,
            @RequestParam(required = false) String faculty) {

        List<ProgramOutcome> allPos = programOutcomeRepository.findAll();

        if (faculty != null && !faculty.trim().isEmpty()) {
            List<String> allowedCourses = getFacultyCourseCodes(faculty);
            if (!allowedCourses.isEmpty()) {
                List<CoPoMapping> facultyMappings = coPoMappingRepository.findAll().stream()
                    .filter(m -> m.getCourse() != null && allowedCourses.stream().anyMatch(c -> c.equalsIgnoreCase(m.getCourse())))
                    .toList();
                Set<String> mappedPoCodes = facultyMappings.stream().map(CoPoMapping::getPo).collect(Collectors.toSet());
                if (!mappedPoCodes.isEmpty()) {
                    return allPos.stream()
                        .filter(po -> mappedPoCodes.contains(po.getPoNumber()) || mappedPoCodes.contains(po.getPo()))
                        .collect(Collectors.toList());
                }
            }
        }

        return allPos;
    }

    @PostMapping("/po")
    public ProgramOutcome savePO(@RequestBody ProgramOutcome po) {
        return programOutcomeRepository.save(po);
    }

    @DeleteMapping("/po/{id}")
    public ResponseEntity<?> deletePO(@PathVariable Long id) {
        programOutcomeRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // Course Outcomes
    @GetMapping("/co")
    public List<CourseOutcome> getAllCOs(
            @RequestParam(required = false) String branch, 
            @RequestParam(required = false) String course,
            @RequestParam(required = false) String faculty) {

        List<CourseOutcome> all = courseOutcomeRepository.findAll();

        // 1. Faculty specific filter
        if (faculty != null && !faculty.trim().isEmpty()) {
            List<String> allowed = getFacultyCourseCodes(faculty);
            if (!allowed.isEmpty()) {
                return all.stream()
                    .filter(c -> c.getCourse() != null && allowed.stream().anyMatch(ac -> ac.equalsIgnoreCase(c.getCourse())))
                    .collect(Collectors.toList());
            }
        }

        // 2. Course specific filter
        if (course != null && !course.trim().isEmpty()) {
            return all.stream().filter(c -> c.getCourse() != null && c.getCourse().equalsIgnoreCase(course.trim())).collect(Collectors.toList());
        }

        // 3. Branch specific filter
        if (branch != null && !branch.trim().isEmpty()) {
            String b = branch.toUpperCase().trim();
            if (BRANCH_COURSES.containsKey(b)) {
                List<String> allowed = BRANCH_COURSES.get(b);
                return all.stream().filter(c -> allowed.contains(c.getCourse())).collect(Collectors.toList());
            }
        }
        return all;
    }

    @PostMapping("/co")
    public CourseOutcome saveCO(@RequestBody CourseOutcome co) {
        return courseOutcomeRepository.save(co);
    }

    // Mappings strictly filtered by Faculty / Branch / Course / Department
    @GetMapping("/mappings")
    public List<CoPoMapping> getAllMappings(
            @RequestParam(required = false) String branch,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String course,
            @RequestParam(required = false) String faculty) {

        List<CoPoMapping> all = coPoMappingRepository.findAll();

        // 1. Faculty specific filter
        if (faculty != null && !faculty.trim().isEmpty()) {
            List<String> allowedCourses = getFacultyCourseCodes(faculty);
            if (!allowedCourses.isEmpty()) {
                return all.stream()
                        .filter(m -> m.getCourse() != null && allowedCourses.stream().anyMatch(c -> c.equalsIgnoreCase(m.getCourse())))
                        .collect(Collectors.toList());
            }
        }

        // 2. Course specific filter
        if (course != null && !course.trim().isEmpty()) {
            return all.stream()
                    .filter(m -> m.getCourse() != null && m.getCourse().equalsIgnoreCase(course.trim()))
                    .collect(Collectors.toList());
        }

        // 3. Branch specific filter (CSE, IT, ECE, ME, Civil)
        String targetBranch = branch;
        if (targetBranch == null && department != null) {
            String d = department.toLowerCase();
            if (d.contains("computer") || d.contains("cse")) targetBranch = "CSE";
            else if (d.contains("information") || d.contains("it")) targetBranch = "IT";
            else if (d.contains("electronic") || d.contains("ece")) targetBranch = "ECE";
            else if (d.contains("mechanical") || d.contains("me")) targetBranch = "ME";
            else if (d.contains("civil") || d.contains("ce")) targetBranch = "Civil";
        }

        if (targetBranch != null && !targetBranch.trim().isEmpty()) {
            String bKey = targetBranch.toUpperCase().trim();
            if (BRANCH_COURSES.containsKey(bKey)) {
                List<String> allowedCourses = BRANCH_COURSES.get(bKey);
                return all.stream()
                        .filter(m -> allowedCourses.stream().anyMatch(c -> c.equalsIgnoreCase(m.getCourse())))
                        .collect(Collectors.toList());
            }
        }

        return all;
    }

    @PostMapping("/mappings")
    public CoPoMapping saveMapping(@RequestBody CoPoMapping mapping) {
        return coPoMappingRepository.save(mapping);
    }

    @DeleteMapping("/mappings/{id}")
    public ResponseEntity<?> deleteMapping(@PathVariable Long id) {
        coPoMappingRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
