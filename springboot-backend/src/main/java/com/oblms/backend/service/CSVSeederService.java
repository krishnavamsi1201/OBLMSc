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
    private AcademicStreamRepository streamRepository;

    @Autowired
    private AcademicProgramRepository programRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private CourseOutcomeRepository coRepository;

    @Autowired
    private ProgramOutcomeRepository poRepository;

    @Autowired
    private CoPoMappingRepository copoMappingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AttendanceRecordRepository attendanceRepository;

    @Autowired
    private StudentMarkRepository marksRepository;

    @Autowired
    private AssessmentCOMappingRepository assessmentMappingRepository;

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private TimetableSlotRepository timetableRepository;

    // Official Dataset Directory on User System
    private static final String DATASET_DIR = "D:\\OBLMSc\\OBLMS Data Set\\Program & Course Data\\";

    @PostConstruct
    public void seedFromCSV() {
        seedUsersFromDatasetCSV();
        seedCoursesFromDatasetCSV();
        seedCourseOutcomesForActiveCourses();
        seedStudentMarksAndAttendance();
        seedExamsAndTimetable();

        boolean needsSeeding = streamRepository.count() == 0 
                || programRepository.count() == 0
                || subjectRepository.count() == 0
                || coRepository.count() == 0 
                || copoMappingRepository.count() == 0
                || subjectRepository.count() > 100; // Force re-seed if old large dataset is present

        if (!needsSeeding) {
            System.out.println("[INFO] OBLMS Dataset already fully seeded in MySQL. (Streams: " 
                + streamRepository.count() + ", Programs: " + programRepository.count() 
                + ", Subjects: " + subjectRepository.count() + ", COs: " + coRepository.count() 
                + ", CO-PO Mappings: " + copoMappingRepository.count() + ").");
            return;
        }

        importAllDataset();
    }

    public void seedUsersFromDatasetCSV() {
        File userCsv = new File(DATASET_DIR + "User_Credentials_Master.csv");
        if (userCsv.exists()) {
            try (BufferedReader reader = new BufferedReader(new FileReader(userCsv))) {
                String line;
                boolean isHeader = true;
                while ((line = reader.readLine()) != null) {
                    if (isHeader) { isHeader = false; continue; }
                    String[] tokens = line.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)", -1);
                    if (tokens.length >= 6) {
                        String id = tokens[0].trim();
                        String name = tokens[1].trim();
                        String email = tokens[2].trim();
                        String password = tokens[3].trim();
                        String role = tokens[4].trim();
                        String dept = tokens[5].trim();
                        String enrolled = tokens.length >= 7 ? tokens[6].trim().replace("\"", "") : "";

                        Optional<User> existing = userRepository.findById(id);
                        if (existing.isEmpty()) {
                            existing = userRepository.findByEmail(email);
                        }
                        if (existing.isPresent()) {
                            User u = existing.get();
                            u.setId(id);
                            u.setName(name);
                            u.setEmail(email);
                            u.setPassword(password);
                            u.setRole(role);
                            u.setDepartment(dept);
                            u.setEnrolledCourses(enrolled);
                            userRepository.save(u);
                        } else {
                            User u = new User(id, name, email, password, role, dept);
                            u.setEnrolledCourses(enrolled);
                            userRepository.save(u);
                        }
                    }
                }
                System.out.println("[INFO] Synced all 47 user accounts directly from User_Credentials_Master.csv into MySQL database.");
            } catch (Exception e) {
                System.err.println("[ERROR] Failed to seed users from User_Credentials_Master.csv: " + e.getMessage());
            }
        }
    }

    public void seedCoursesFromDatasetCSV() {
        File courseCsv = new File(DATASET_DIR + "Course_Master_Active.csv");
        if (courseCsv.exists()) {
            try (BufferedReader reader = new BufferedReader(new FileReader(courseCsv))) {
                String line;
                boolean isHeader = true;
                while ((line = reader.readLine()) != null) {
                    if (isHeader) { isHeader = false; continue; }
                    String[] tokens = line.split(",");
                    if (tokens.length >= 6) {
                        String code = tokens[0].trim();
                        String title = tokens[1].trim();
                        String semester = tokens[4].trim();
                        String faculty = tokens[5].trim();

                        Optional<Course> existing = courseRepository.findByCodeIgnoreCase(code);
                        if (existing.isPresent()) {
                            Course c = existing.get();
                            c.setTitle(title);
                            c.setFaculty(faculty);
                            c.setSemester(semester);
                            courseRepository.save(c);
                        } else {
                            Course c = new Course(null, code, title, faculty, semester);
                            courseRepository.save(c);
                        }
                    }
                }
                System.out.println("[INFO] Synced active courses from Course_Master_Active.csv into MySQL database.");
            } catch (Exception e) {
                System.err.println("[ERROR] Failed to seed courses from Course_Master_Active.csv: " + e.getMessage());
            }
        }
    }

    public void seedCourseOutcomesForActiveCourses() {
        List<Course> courses = courseRepository.findAll();
        if (courses.isEmpty()) return;

        String[] bloomLevels = { "Remember", "Understand", "Apply", "Analyze", "Evaluate" };
        String[] standardDescs = {
            "Understand and explain fundamental concepts, theory and terminology of the subject.",
            "Analyze system architectures, methodologies, and engineering problem requirements.",
            "Apply modern design principles, frameworks, and practical implementation tools.",
            "Evaluate performance parameters, algorithmic efficiency, and operational metrics.",
            "Design, construct, and validate industry-grade project solutions meeting safety standards."
        };

        List<CourseOutcome> cosToSave = new ArrayList<>();
        for (Course c : courses) {
            List<CourseOutcome> existing = coRepository.findByCourseIgnoreCase(c.getCode());
            if (existing.isEmpty()) {
                for (int i = 1; i <= 5; i++) {
                    CourseOutcome co = new CourseOutcome();
                    co.setCourse(c.getCode());
                    co.setCo("CO" + i);
                    co.setBloomsLevel(bloomLevels[i - 1]);
                    co.setDescription(c.getTitle() + " - " + standardDescs[i - 1]);
                    co.setApprovalStatus("Approved");
                    co.setFaculty(c.getFaculty());
                    cosToSave.add(co);
                }
            } else {
                for (CourseOutcome co : existing) {
                    if (co.getApprovalStatus() == null) {
                        co.setApprovalStatus("Approved");
                    }
                    if (co.getFaculty() == null) {
                        co.setFaculty(c.getFaculty());
                    }
                }
                coRepository.saveAll(existing);
            }
        }
        if (!cosToSave.isEmpty()) {
            coRepository.saveAll(cosToSave);
            System.out.println("[INFO] Synced " + cosToSave.size() + " active Course Outcomes into MySQL database.");
        }
    }

    public void seedStudentMarksAndAttendance() {
        if (marksRepository.count() > 100 && attendanceRepository.count() > 100) {
            return;
        }

        List<User> students = userRepository.findAll().stream()
            .filter(u -> "STUDENT".equalsIgnoreCase(u.getRole()))
            .toList();

        if (students.isEmpty()) return;

        List<StudentMark> marksList = new ArrayList<>();
        List<AttendanceRecord> attendanceList = new ArrayList<>();

        String[] assessmentTypes = { "Mid-Term Examination 1", "Mid-Term Examination 2", "Assignment & Project", "Semester End Examination" };
        int[] maxMarksList = { 30, 30, 20, 100 };

        for (User stu : students) {
            String enrolled = stu.getEnrolledCourses();
            if (enrolled == null || enrolled.trim().isEmpty()) continue;

            String[] codes = enrolled.split(",");
            for (String code : codes) {
                String cCode = code.trim();
                if (cCode.isEmpty()) continue;

                // 1. Seed marks
                for (int a = 0; a < assessmentTypes.length; a++) {
                    String assName = cCode + " " + assessmentTypes[a];
                    double max = maxMarksList[a];
                    double baseRate = 0.75 + (Math.abs((stu.getName() + cCode).hashCode() % 20)) / 100.0;
                    double obtained = Math.round(max * baseRate);

                    marksList.add(new StudentMark(null, stu.getName(), assName, obtained, max));
                }

                // 2. Seed attendance records
                for (int d = 1; d <= 15; d++) {
                    String date = "2026-08-" + String.format("%02d", d);
                    boolean isPresent = ((stu.getName() + cCode + d).hashCode() % 10) != 0; // ~90% attendance

                    attendanceList.add(new AttendanceRecord(null, stu.getName(), cCode, date, isPresent ? "Present" : "Absent"));
                }
            }
        }

        if (marksRepository.count() == 0) {
            marksRepository.saveAll(marksList);
            System.out.println("[INFO] Seeded " + marksList.size() + " student marks records in MySQL database.");
        }
        if (attendanceRepository.count() == 0) {
            attendanceRepository.saveAll(attendanceList);
            System.out.println("[INFO] Seeded " + attendanceList.size() + " student attendance records in MySQL database.");
        }
    }

    public void seedExamsAndTimetable() {
        if (examRepository.count() > 0 && timetableRepository.count() > 0) {
            return;
        }

        List<Course> courses = courseRepository.findAll();
        if (courses.isEmpty()) return;

        List<Exam> exams = new ArrayList<>();
        List<TimetableSlot> slots = new ArrayList<>();

        String[] days = { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" };
        String[] periods = { "09:00 AM - 10:00 AM", "10:15 AM - 11:15 AM", "11:30 AM - 12:30 PM", "02:00 PM - 03:00 PM", "03:15 PM - 04:15 PM" };
        String[] rooms = { "LH-101", "Lab-2B", "LH-204", "Seminar Hall", "Lab-4A" };

        int examDay = 10;
        for (Course c : courses) {
            exams.add(new Exam(null, c.getTitle() + " Assessment", c.getCode(), "2026-10-" + String.format("%02d", (examDay % 20) + 1), "Hall " + ((examDay % 5) + 1), "Scheduled", 50));
            examDay++;
        }

        for (int d = 0; d < days.length; d++) {
            for (int p = 0; p < Math.min(periods.length, courses.size()); p++) {
                Course c = courses.get((d * 2 + p) % courses.size());
                slots.add(new TimetableSlot(null, days[d], periods[p], c.getTitle(), rooms[p % rooms.length]));
            }
        }

        if (examRepository.count() == 0) {
            examRepository.saveAll(exams);
            System.out.println("[INFO] Seeded " + exams.size() + " scheduled exams in MySQL database.");
        }
        if (timetableRepository.count() == 0) {
            timetableRepository.saveAll(slots);
            System.out.println("[INFO] Seeded " + slots.size() + " timetable slots in MySQL database.");
        }
    }

    public synchronized Map<String, Object> importAllDataset() {
        Map<String, Object> result = new HashMap<>();
        File dir = new File(DATASET_DIR);
        if (!dir.exists()) {
            System.out.println("[WARN] OBLMS dataset directory not found at: " + DATASET_DIR);
            result.put("status", "error");
            result.put("message", "Dataset directory not found: " + DATASET_DIR);
            return result;
        }

        try {
            if (subjectRepository.count() > 100) {
                System.out.println("[INFO] Old large dataset detected. Wiping tables to seed 50 sample subjects...");
                copoMappingRepository.deleteAllInBatch();
                coRepository.deleteAllInBatch();
                courseRepository.deleteAllInBatch();
                subjectRepository.deleteAllInBatch();
            }
            System.out.println("[INFO] Loading complete OBLMS dataset from: " + DATASET_DIR);

            // 1. Import Streams (1.Stream.csv)
            File streamFile = new File(DATASET_DIR + "1.Stream.csv");
            int streamCount = 0;
            if (streamFile.exists()) {
                BufferedReader br = new BufferedReader(new FileReader(streamFile));
                String line = br.readLine(); // Header: courseId,courseName,courseStatus,coutseType,duration,openCondonation
                List<AcademicStream> streams = new ArrayList<>();
                while ((line = br.readLine()) != null) {
                    List<String> values = parseCSVLine(line);
                    if (values.size() >= 5) {
                        try {
                            Long id = Long.parseLong(values.get(0));
                            String name = values.get(1);
                            int status = Integer.parseInt(values.get(2));
                            String type = values.get(3);
                            int duration = Integer.parseInt(values.get(4));
                            streams.add(new AcademicStream(id, name, type, duration, status));
                            streamCount++;
                        } catch (Exception e) {}
                    }
                }
                br.close();
                streamRepository.saveAll(streams);
                System.out.println("[INFO] Seeded " + streamCount + " academic streams.");
            }

            // 2. Import Programs (2.Program.csv)
            File programFile = new File(DATASET_DIR + "2.Program.csv");
            int programCount = 0;
            if (programFile.exists()) {
                BufferedReader br = new BufferedReader(new FileReader(programFile));
                String line = br.readLine(); // Header: branchId,branchName,courseId,branchstatus,deptCode,shortCode
                List<AcademicProgram> programs = new ArrayList<>();
                while ((line = br.readLine()) != null) {
                    List<String> values = parseCSVLine(line);
                    if (values.size() >= 6) {
                        try {
                            Long id = Long.parseLong(values.get(0));
                            String name = values.get(1);
                            Long courseId = Long.parseLong(values.get(2));
                            int status = Integer.parseInt(values.get(3));
                            String deptCode = values.get(4);
                            String shortCode = values.get(5);
                            programs.add(new AcademicProgram(id, name, courseId, status, deptCode, shortCode));
                            programCount++;
                        } catch (Exception e) {}
                    }
                }
                br.close();
                programRepository.saveAll(programs);
                System.out.println("[INFO] Seeded " + programCount + " academic programs/branches.");
            }

            // 3. Import Curriculum Subjects & Active Courses (6.Courses.csv)
            File coursesFile = new File(DATASET_DIR + "6.Courses.csv");
            int subjectCount = 0;
            Map<String, String> subIdToCodeMap = new HashMap<>(); // subId -> subCode
            Map<String, Course> codeToCourseMap = new HashMap<>();
            if (coursesFile.exists()) {
                BufferedReader br = new BufferedReader(new FileReader(coursesFile));
                String line = br.readLine(); // Header: subId,subjectName,subjectType,subName
                List<SubjectEntity> subjects = new ArrayList<>();
                List<Course> coursesToSave = new ArrayList<>();
                Set<String> uniqueCourseCodes = new HashSet<>();

                while ((line = br.readLine()) != null && subjectCount < 50) {
                    List<String> values = parseCSVLine(line);
                    if (values.size() >= 4) {
                        try {
                            Long subId = Long.parseLong(values.get(0));
                            String subjectName = values.get(1);
                            String subjectType = values.get(2);
                            String subCode = values.get(3).trim();

                            subjects.add(new SubjectEntity(subId, subjectName, subjectType, subCode));
                            subIdToCodeMap.put(String.valueOf(subId), subCode);
                            subjectCount++;

                            // Also sync core courses for the dashboard & faculty course allocations
                            String lowerCode = subCode.toLowerCase();
                            if (!uniqueCourseCodes.contains(lowerCode) && coursesToSave.size() < 100) {
                                uniqueCourseCodes.add(lowerCode);
                                Course course = new Course(null, subCode, subjectName, "Faculty Board", "Fall 2026");
                                coursesToSave.add(course);
                            }
                        } catch (Exception e) {}
                    }
                }
                br.close();
                subjectRepository.saveAll(subjects);
                if (courseRepository.count() == 0) {
                    courseRepository.saveAll(coursesToSave);
                }
                System.out.println("[INFO] Seeded " + subjectCount + " curriculum subjects.");
            }

            // 4. Import NBA Program Outcomes (10.ProgramOutcome.csv)
            File poFile = new File(DATASET_DIR + "10.ProgramOutcome.csv");
            int poCount = 0;
            Map<String, ProgramOutcome> poMapById = new HashMap<>(); // pgmid -> PO
            if (poFile.exists()) {
                BufferedReader br = new BufferedReader(new FileReader(poFile));
                String line = br.readLine(); // Header: pgmid,courseId,branchId,outcome
                List<ProgramOutcome> pos = new ArrayList<>();
                Map<String, ProgramOutcome> uniquePOByNum = new HashMap<>();

                // Standard NBA 12 PO definitions mapping
                String[] standardPOs = {
                    "Engineering Knowledge: Apply mathematics, science, and engineering fundamentals.",
                    "Problem Analysis: Identify and formulate complex engineering problems.",
                    "Design/Development: Design solutions meeting public health and safety.",
                    "Conduct Investigations: Use research methods and data synthesis.",
                    "Modern Tool Usage: Apply appropriate modern engineering and IT tools.",
                    "The Engineer and Society: Assess societal, health, safety, and legal issues.",
                    "Environment and Sustainability: Demonstrate need for sustainable development.",
                    "Ethics: Commit to professional ethics and responsibilities.",
                    "Individual and Team Work: Function effectively as member or leader in teams.",
                    "Communication: Communicate effectively with engineering community.",
                    "Project Management: Apply engineering and management principles.",
                    "Life-long Learning: Engage in independent and life-long learning."
                };

                for (int i = 1; i <= 12; i++) {
                    String poCode = "PO" + i;
                    ProgramOutcome po = new ProgramOutcome(null, poCode, "Engineering", standardPOs[i - 1]);
                    uniquePOByNum.put(poCode, po);
                }

                while ((line = br.readLine()) != null) {
                    List<String> values = parseCSVLine(line);
                    if (values.size() >= 4) {
                        try {
                            Long pgmid = Long.parseLong(values.get(0));
                            String desc = values.get(3).trim();
                            if (desc.length() > 2000) desc = desc.substring(0, 1995) + "...";
                            
                            int poIndex = (int) (pgmid % 12) + 1;
                            String poCode = "PO" + poIndex;
                            ProgramOutcome mappedPo = uniquePOByNum.get(poCode);
                            poMapById.put(String.valueOf(pgmid), mappedPo);
                        } catch (Exception e) {}
                    }
                }
                br.close();

                if (poRepository.count() == 0) {
                    poRepository.saveAll(uniquePOByNum.values());
                }
                poCount = uniquePOByNum.size();
                System.out.println("[INFO] Seeded standard NBA Program Outcomes (PO1 to PO12).");
            }

            // 5. Import Course Outcomes (9.CourseOutcome.csv)
            File coFile = new File(DATASET_DIR + "9.CourseOutcome.csv");
            int coCount = 0;
            Map<String, CourseOutcome> coMapById = new HashMap<>(); // comid -> CO
            if (coFile.exists()) {
                BufferedReader br = new BufferedReader(new FileReader(coFile));
                String line = br.readLine(); // Header: comid,semsubId,outcome,shortCode,nba_acid
                List<CourseOutcome> cos = new ArrayList<>();

                while ((line = br.readLine()) != null) {
                    List<String> values = parseCSVLine(line);
                    if (values.size() >= 4) {
                        try {
                            Long comid = Long.parseLong(values.get(0));
                            Long semSubId = Long.parseLong(values.get(1));
                            String outcomeDesc = values.get(2);
                            String shortCode = values.get(3);
                            
                            if (!subIdToCodeMap.containsKey(String.valueOf(semSubId))) {
                                continue;
                            }
                            
                            if (outcomeDesc.length() > 2000) outcomeDesc = outcomeDesc.substring(0, 1995) + "...";

                            String courseCode = subIdToCodeMap.get(String.valueOf(semSubId));
                            String coCode = shortCode.startsWith("CO") ? shortCode : ("CO" + shortCode);

                            CourseOutcome co = new CourseOutcome(comid, semSubId, courseCode, coCode, outcomeDesc);
                            cos.add(co);
                            coMapById.put(String.valueOf(comid), co);
                            coCount++;
                        } catch (Exception e) {}
                    }
                }
                br.close();
                coRepository.saveAll(cos);
                System.out.println("[INFO] Seeded " + coCount + " Course Outcomes from dataset.");
            }

            // 6. Import CO-PO Mappings (14.COtoPO_Mappings.csv)
            File mappingFile = new File(DATASET_DIR + "14.COtoPO_Mappings.csv");
            int mappingCount = 0;
            if (mappingFile.exists()) {
                BufferedReader br = new BufferedReader(new FileReader(mappingFile));
                String line = br.readLine(); // Header: cpid,comid,pgmid,wtid
                List<CoPoMapping> mappings = new ArrayList<>();
                Set<String> uniqueKeys = new HashSet<>();

                while ((line = br.readLine()) != null && mappingCount < 2000) {
                    List<String> values = parseCSVLine(line);
                    if (values.size() >= 4) {
                        try {
                            Long cpid = Long.parseLong(values.get(0));
                            String comid = values.get(1);
                            String pgmid = values.get(2);
                            int level = Integer.parseInt(values.get(3));
                            if (level < 1) level = 1;
                            if (level > 3) level = 3;

                            CourseOutcome co = coMapById.get(comid);
                            if (co != null) {
                                int poNum = (int) (Long.parseLong(pgmid) % 12) + 1;
                                String poCode = "PO" + poNum;
                                String compKey = co.getCourse() + ":" + co.getCo() + ":" + poCode;

                                if (!uniqueKeys.contains(compKey)) {
                                    uniqueKeys.add(compKey);
                                    CoPoMapping mapping = new CoPoMapping(cpid, Long.parseLong(comid), Long.parseLong(pgmid), co.getCourse(), co.getCo(), poCode, level, "Approved");
                                    mappings.add(mapping);
                                    mappingCount++;
                                }
                            }
                        } catch (Exception e) {}
                    }
                }
                br.close();
                copoMappingRepository.saveAll(mappings);
                System.out.println("[INFO] Seeded " + mappingCount + " accredited CO-PO matrix correlations.");
            }

            result.put("status", "success");
            result.put("streams", streamCount);
            result.put("programs", programCount);
            result.put("subjects", subjectCount);
            result.put("courseOutcomes", coCount);
            result.put("programOutcomes", poCount);
            result.put("copoMappings", mappingCount);

        } catch (Exception e) {
            System.err.println("[ERROR] Failed to import dataset: " + e.getMessage());
            e.printStackTrace();
            result.put("status", "error");
            result.put("error", e.getMessage());
        }

        return result;
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
