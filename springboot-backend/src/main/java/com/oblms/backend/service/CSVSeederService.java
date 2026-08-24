package com.oblms.backend.service;

import com.oblms.backend.model.*;
import com.oblms.backend.repository.*;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.util.*;

@Service
public class CSVSeederService {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private CourseOutcomeRepository coRepository;

    @Autowired
    private ProgramOutcomeRepository poRepository;

    @Autowired
    private CoPoMappingRepository copoMappingRepository;

    private static final String DATASET_DIR = "K:\\OBLMS\\OBLMS Data Set\\Program & Course Data\\";

    @PostConstruct
    public void seedFromCSV() {
        boolean needsSeeding = courseRepository.count() == 0 
                || poRepository.count() <= 4 
                || coRepository.count() == 0 
                || copoMappingRepository.count() == 0;

        if (!needsSeeding) {
            System.out.println("[INFO] Database already seeded. Skipping CSV seeding.");
            return;
        }

        File dir = new File(DATASET_DIR);
        if (!dir.exists()) {
            System.out.println("[WARN] OBLMS dataset directory not found at: " + DATASET_DIR + ". Using default database seeds.");
            return;
        }

        try {
            System.out.println("[INFO] OBLMS dataset found! Beginning CSV seeding...");

            // Clean slate to avoid constraint mismatches and populate all datasets in sync
            copoMappingRepository.deleteAll();
            coRepository.deleteAll();
            poRepository.deleteAll();
            courseRepository.deleteAll();

            // 1. Seed Courses (Read 6.Courses.csv)
            Map<String, Course> courseMapById = new HashMap<>(); // subId -> Course
            Map<String, Course> codeToCourseMap = new HashMap<>(); // subName -> Course
            Set<String> seededCodes = new HashSet<>();
            File coursesFile = new File(DATASET_DIR + "6.Courses.csv");
            if (coursesFile.exists()) {
                BufferedReader br = new BufferedReader(new FileReader(coursesFile));
                String line = br.readLine(); // Header: subId,subjectName,subjectType,subName
                int count = 0;
                while ((line = br.readLine()) != null && count < 30) {
                    List<String> values = parseCSVLine(line);
                    if (values.size() >= 4) {
                        String subId = values.get(0);
                        String subjectName = values.get(1);
                        String type = values.get(2);
                        String subName = values.get(3);

                        // If this code was already seeded, map this subId to the already saved course
                        if (seededCodes.contains(subName.toLowerCase())) {
                            Course existingCourse = codeToCourseMap.get(subName.toLowerCase());
                            if (existingCourse != null) {
                                courseMapById.put(subId, existingCourse);
                            }
                            continue;
                        }
                        seededCodes.add(subName.toLowerCase());

                        Course course = new Course(null, subName, subjectName, "Faculty Board", "Fall 2026");
                        Course saved = courseRepository.save(course);
                        courseMapById.put(subId, saved);
                        codeToCourseMap.put(subName.toLowerCase(), saved);
                        count++;
                    }
                }
                br.close();
                System.out.println("[INFO] Seeded " + count + " courses from CSV.");
            }

            // 2. Seed Program Outcomes (Read 10.ProgramOutcome.csv)
            Map<String, ProgramOutcome> poMapById = new HashMap<>(); // pgmid -> PO
            Map<String, ProgramOutcome> textToPOMap = new HashMap<>(); // outcome text -> PO
            File poFile = new File(DATASET_DIR + "10.ProgramOutcome.csv");
            if (poFile.exists()) {
                BufferedReader br = new BufferedReader(new FileReader(poFile));
                String line = br.readLine(); // pgmid,courseId,branchId,outcome
                int count = 0;
                while ((line = br.readLine()) != null) {
                    List<String> values = parseCSVLine(line);
                    if (values.size() >= 4) {
                        String pgmid = values.get(0);
                        String outcome = values.get(3).trim();
                        if (outcome.isEmpty()) continue;

                        // Clean up description length if needed
                        String shortOutcome = outcome;
                        if (shortOutcome.length() > 200) {
                            shortOutcome = shortOutcome.substring(0, 197) + "...";
                        }

                        String cleanOutcome = shortOutcome.toLowerCase();

                        if (textToPOMap.containsKey(cleanOutcome)) {
                            poMapById.put(pgmid, textToPOMap.get(cleanOutcome));
                        } else {
                            if (count < 12) {
                                String poNumber = "PO" + (count + 1);
                                ProgramOutcome po = new ProgramOutcome(null, poNumber, shortOutcome);
                                ProgramOutcome saved = poRepository.save(po);
                                poMapById.put(pgmid, saved);
                                textToPOMap.put(cleanOutcome, saved);
                                count++;
                            } else {
                                // Default back to the first seeded PO if we exceed standard NBA list size
                                poMapById.put(pgmid, textToPOMap.values().iterator().next());
                            }
                        }
                    }
                }
                br.close();
                System.out.println("[INFO] Seeded " + count + " program outcomes from CSV.");
            }

            // 3. Seed Course Outcomes (Read 9.CourseOutcome.csv)
            Map<String, CourseOutcome> coMapById = new HashMap<>(); // comid -> CO
            Set<String> seededCOs = new HashSet<>();
            File coFile = new File(DATASET_DIR + "9.CourseOutcome.csv");
            if (coFile.exists()) {
                BufferedReader br = new BufferedReader(new FileReader(coFile));
                String line = br.readLine(); // comid,semsubId,outcome,shortCode,nba_acid
                int count = 0;
                while ((line = br.readLine()) != null && count < 100) {
                    List<String> values = parseCSVLine(line);
                    if (values.size() >= 4) {
                        String comid = values.get(0);
                        String semsubId = values.get(1);
                        String outcome = values.get(2);
                        String shortCode = values.get(3);

                        Course associatedCourse = courseMapById.get(semsubId);
                        if (associatedCourse != null) {
                            String coCode = "CO" + shortCode;
                            String compKey = associatedCourse.getCode().toLowerCase() + ":" + coCode.toLowerCase();

                            if (seededCOs.contains(compKey)) {
                                continue;
                            }
                            seededCOs.add(compKey);

                            CourseOutcome co = new CourseOutcome(null, associatedCourse.getCode(), coCode, outcome);
                            CourseOutcome saved = coRepository.save(co);
                            coMapById.put(comid, saved);
                            count++;
                        }
                    }
                }
                br.close();
                System.out.println("[INFO] Seeded " + count + " course outcomes from CSV.");
            }

            // 4. Seed CO-PO Mappings (Read 14.COtoPO_Mappings.csv)
            Set<String> seededMappings = new HashSet<>();
            File mappingFile = new File(DATASET_DIR + "14.COtoPO_Mappings.csv");
            if (mappingFile.exists()) {
                BufferedReader br = new BufferedReader(new FileReader(mappingFile));
                String line = br.readLine(); // cpid,comid,pgmid,wtid
                int count = 0;
                while ((line = br.readLine()) != null && count < 150) {
                    List<String> values = parseCSVLine(line);
                    if (values.size() >= 4) {
                        String comid = values.get(1);
                        String pgmid = values.get(2);
                        String wtid = values.get(3);

                        CourseOutcome co = coMapById.get(comid);
                        ProgramOutcome po = poMapById.get(pgmid);

                        if (co != null && po != null) {
                            String compKey = co.getCourse().toLowerCase() + ":" + co.getCo().toLowerCase() + ":" + po.getPoNumber().toLowerCase();
                            if (seededMappings.contains(compKey)) {
                                continue;
                            }
                            seededMappings.add(compKey);

                            int level = 1;
                            try {
                                level = Integer.parseInt(wtid);
                            } catch (NumberFormatException e) {
                                // Fallback
                            }

                            CoPoMapping mapping = new CoPoMapping(null, co.getCourse(), co.getCo(), po.getPoNumber(), level, level, "Approved");
                            copoMappingRepository.save(mapping);
                            count++;
                        }
                    }
                }
                br.close();
                System.out.println("[INFO] Seeded " + count + " CO-PO mappings from CSV.");
            }

            System.out.println("[INFO] CSV Seeding completed successfully!");

        } catch (Exception e) {
            System.err.println("[ERROR] Failed to seed database from CSV files: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private List<String> parseCSVLine(String line) {
        List<String> values = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder sb = new StringBuilder();
        for (char c : line.toCharArray()) {
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                values.add(sb.toString().trim());
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        values.add(sb.toString().trim());
        return values;
    }
}
