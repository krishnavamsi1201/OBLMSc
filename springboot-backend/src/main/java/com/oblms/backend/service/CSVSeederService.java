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
import java.util.stream.Collectors;

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
        try {
            seedUsersFromDatasetCSV();
        } catch (Exception e) {
            System.err.println("[WARN] Admin check: " + e.getMessage());
        }
        try {
            seedCoursesFromDatasetCSV();
        } catch (Exception e) {}
        try {
            seedCourseOutcomesForActiveCourses();
        } catch (Exception e) {}
        try {
            seedStudentMarksAndAttendance();
        } catch (Exception e) {}
        try {
            seedExamsAndTimetable();
        } catch (Exception e) {}
    }

    public void seedUsersFromDatasetCSV() {
        // 1. Ensure default Admin user exists
        Optional<User> adminOpt = userRepository.findAll().stream()
                .filter(u -> "ADMIN".equalsIgnoreCase(u.getRole()))
                .findFirst();

        if (adminOpt.isEmpty()) {
            User admin = new User("ADM001", "System Administrator", "admin@gmail.com", "admin123", "ADMIN", "Computer Science & Engineering");
            admin.setEnrolledCourses("CS101,CS102,CS103,CS301,CS302");
            admin.setSemester("All Semesters");
            userRepository.save(admin);
            System.out.println("[INFO] Seeded default Administrator account (admin@gmail.com / admin123).");
        }

        // 2. Ensure Faculty members exist across departments
        List<User> defaultFaculty = List.of(
            new User("FAC001", "Dr. Ramesh Babu", "ramesh.babu@oblms.edu", "password", "FACULTY", "Computer Science & Engineering", "All", "CS101,CS103,CS113,CS304,CS307,CS401"),
            new User("FAC002", "Prof. Sunita Sharma", "sunita.sharma@oblms.edu", "password", "FACULTY", "Computer Science & Engineering", "All", "CS102,CS123,CS202,CS205,CS308,CS405"),
            new User("FAC003", "Dr. Amit Patel", "amit.patel@oblms.edu", "password", "FACULTY", "Information Technology", "All", "IT113,IT211,IT302,IT311,IT401,CS201,CS303"),
            new User("FAC004", "Dr. Priya Nair", "priya.nair@oblms.edu", "password", "FACULTY", "Electronics & Communication Engineering", "All", "EC114,EC124,EC202,EC212,EC301,EC312,EC402,EC411"),
            new User("FAC005", "Dr. V. C. Reddy", "vc.reddy@oblms.edu", "password", "FACULTY", "Electronics & Communication Engineering", "All", "EC201,EC211,EC302,EC311,EC403,EC412"),
            new User("FAC006", "Dr. K. Srinivas", "k.srinivas@oblms.edu", "password", "FACULTY", "Mechanical Engineering", "All", "ME113,ME122,ME201,ME204,ME211,ME301,ME401"),
            new User("FAC007", "Prof. Manoj Kumar", "manoj.kumar@oblms.edu", "password", "FACULTY", "Mechanical Engineering", "All", "ME203,ME205,ME212,ME302,ME311,ME402"),
            new User("FAC008", "Dr. Suresh Varma", "suresh.civil@oblms.edu", "password", "FACULTY", "Civil Engineering", "All", "CE113,CE122,CE201,CE204,CE211,CE301,CE401"),
            new User("FAC009", "Prof. Ananya Sen", "ananya.sen@oblms.edu", "password", "FACULTY", "Civil Engineering", "All", "CE202,CE203,CE212,CE302,CE311,CE402"),
            new User("FAC010", "Dr. Satish Sharma", "satish.eee@oblms.edu", "password", "FACULTY", "Electrical & Electronics Engineering", "All", "EE113,EE123,EE201,EE204,EE211,EE301,EE401"),
            new User("FAC011", "Prof. Rajesh Verma", "rajesh.verma@oblms.edu", "password", "FACULTY", "Electrical & Electronics Engineering", "All", "EE202,EE203,EE212,EE302,EE311,EE402")
        );

        for (User f : defaultFaculty) {
            if (userRepository.findById(f.getId()).isEmpty() && userRepository.findByEmailIgnoreCase(f.getEmail()).isEmpty()) {
                userRepository.save(f);
            }
        }

        // 3. Seed 5 Students per Semester (Sem 1 to Sem 8) across all 6 departments
        seedStudentsAllBranchesAndSemesters();
    }

    private void seedStudentsAllBranchesAndSemesters() {
        String[][] branches = {
            {"CSE", "Computer Science & Engineering"},
            {"IT", "Information Technology"},
            {"ECE", "Electronics & Communication Engineering"},
            {"ME", "Mechanical Engineering"},
            {"CE", "Civil Engineering"},
            {"EEE", "Electrical & Electronics Engineering"}
        };

        // Course code matrices per department & semester (7 subjects each)
        Map<String, Map<Integer, String>> deptCourses = Map.of(
            "CSE", Map.of(
                1, "CS111,CS112,CS113,CS114,CS115,CS111L,CS112L",
                2, "CS121,CS122,CS123,CS124,CS125,CS121L,CS122L",
                3, "CS101,CS102,CS103,CS203,CS204,CS101L,CS102L",
                4, "CS201,CS205,CS206,CS207,CS208,CS201L,CS205L",
                5, "CS301,CS202,CS304,CS305,CS306,CS301L,CS202L",
                6, "CS302,CS303,CS307,CS308,CS309,CS302L,CS303L",
                7, "CS401,CS402,CS403,CS404,CS405,CS401L,CS402L",
                8, "CS411,CS412,CS413,CS414,CS415,CS498,CS499"
            ),
            "IT", Map.of(
                1, "IT111,IT112,IT113,IT114,IT115,IT111L,IT112L",
                2, "IT121,IT122,IT123,IT124,IT125,IT121L,IT122L",
                3, "IT201,IT202,IT203,IT204,IT205,IT201L,IT202L",
                4, "IT211,IT212,IT213,IT214,IT215,IT211L,IT212L",
                5, "IT301,IT302,IT303,IT304,IT305,IT301L,IT303L",
                6, "IT311,IT312,IT313,IT314,IT315,IT311L,IT315L",
                7, "IT401,IT402,IT403,IT404,IT405,IT401L,IT402L",
                8, "IT411,IT412,IT413,IT414,IT415,IT498,IT499"
            ),
            "ECE", Map.of(
                1, "EC111,EC112,EC113,EC114,EC115,EC111L,EC112L",
                2, "EC121,EC122,EC123,EC124,EC125,EC121L,EC122L",
                3, "EC201,EC202,EC203,EC204,EC205,EC201L,EC202L",
                4, "EC211,EC212,EC213,EC214,EC215,EC211L,EC212L",
                5, "EC301,EC302,EC303,EC304,EC305,EC301L,EC303L",
                6, "EC311,EC312,EC313,EC314,EC315,EC311L,EC314L",
                7, "EC401,EC402,EC403,EC404,EC405,EC401L,EC403L",
                8, "EC411,EC412,EC413,EC414,EC415,EC498,EC499"
            ),
            "ME", Map.of(
                1, "ME111,ME112,ME113,ME114,ME115,ME111L,ME112L",
                2, "ME121,ME122,ME123,ME124,ME125,ME121L,ME122L",
                3, "ME201,ME202,ME203,ME204,ME205,ME202L,ME204L",
                4, "ME211,ME212,ME213,ME214,ME215,ME211L,ME212L",
                5, "ME301,ME302,ME303,ME304,ME305,ME301L,ME302L",
                6, "ME311,ME312,ME313,ME314,ME315,ME311L,ME312L",
                7, "ME401,ME402,ME403,ME404,ME405,ME401L,ME402L",
                8, "ME411,ME412,ME413,ME414,ME415,ME498,ME499"
            ),
            "CE", Map.of(
                1, "CE111,CE112,CE113,CE114,CE115,CE111L,CE112L",
                2, "CE121,CE122,CE123,CE124,CE125,CE121L,CE122L",
                3, "CE201,CE202,CE203,CE204,CE205,CE201L,CE202L",
                4, "CE211,CE212,CE213,CE214,CE215,CE211L,CE212L",
                5, "CE301,CE302,CE303,CE304,CE305,CE301L,CE302L",
                6, "CE311,CE312,CE313,CE314,CE315,CE311L,CE312L",
                7, "CE401,CE402,CE403,CE404,CE405,CE401L,CE402L",
                8, "CE411,CE412,CE413,CE414,CE415,CE498,CE499"
            ),
            "EEE", Map.of(
                1, "EE111,EE112,EE113,EE114,EE115,EE111L,EE112L",
                2, "EE121,EE122,EE123,EE124,EE125,EE121L,EE122L",
                3, "EE201,EE202,EE203,EE204,EE205,EE201L,EE202L",
                4, "EE211,EE212,EE213,EE214,EE215,EE211L,EE212L",
                5, "EE301,EE302,EE303,EE304,EE305,EE301L,EE302L",
                6, "EE311,EE312,EE313,EE314,EE315,EE311L,EE312L",
                7, "EE401,EE402,EE403,EE404,EE405,EE401L,EE402L",
                8, "EE411,EE412,EE413,EE414,EE415,EE498,EE499"
            )
        );

        String[] firstNames = {
            "Rahul", "Priya", "Amit", "Sneha", "Vikram", "Ananya", "Rohan", "Divya", 
            "Aditya", "Meera", "Karthik", "Pooja", "Suresh", "Harish", "Aarav", "Bhavya", 
            "Chaitanya", "Deepak", "Gautam", "Ishaan", "Kalyan", "Kavya", "Keerthi", "Madhuri", 
            "Manoj", "Naveen", "Neha", "Nikhil", "Pranav", "Prashanth", "Rajesh", "Rakesh", 
            "Riya", "Rohit", "Sai", "Sameer", "Sanjay", "Santosh", "Shreya", "Sowmya", 
            "Srikanth", "Surya", "Swathi", "Tarun", "Varun", "Venkatesh", "Vikas", "Vinay"
        };

        String[] lastNames = {
            "Sharma", "Patel", "Reddy", "Nair", "Singh", "Roy", "Gupta", "Sri",
            "Verma", "Hegde", "Rao", "Kalyan", "Pillai", "Mishra", "Joshi", "Bhat",
            "Choudhury", "Das", "Menon", "Prasad", "Naidu", "Babu", "Sundaram", "Sen"
        };

        int nameIndex = 0;
        int globalCounter = 1;
        int savedCount = 0;

        for (String[] b : branches) {
            String deptCode = b[0];
            String deptName = b[1];

            for (int sem = 1; sem <= 8; sem++) {
                String semName = "Semester " + sem;
                String enrolled = deptCourses.getOrDefault(deptCode, Map.of()).getOrDefault(sem, "");

                for (int stuNum = 1; stuNum <= 5; stuNum++) {
                    String stuId;
                    String fullName;
                    String email;

                    // Special case for Krishna Vamsi in CSE Sem 3
                    if ("CSE".equals(deptCode) && sem == 3 && stuNum == 1) {
                        stuId = "STU004";
                        fullName = "Krishna Vamsi";
                        email = "krishnavamsi1201@gmail.com";
                    } else {
                        if (globalCounter == 4) {
                            globalCounter++; // Reserve STU004 for Krishna Vamsi
                        }
                        stuId = String.format("STU%03d", globalCounter);
                        globalCounter++;

                        String fName = firstNames[nameIndex % firstNames.length];
                        String lName = lastNames[(nameIndex / firstNames.length) % lastNames.length];
                        nameIndex++;

                        fullName = fName + " " + lName;
                        email = String.format("%s.%s.%s.s%d@oblms.edu", fName.toLowerCase(), lName.toLowerCase(), deptCode.toLowerCase(), sem);
                    }

                    Optional<User> existing = userRepository.findById(stuId);
                    if (existing.isEmpty()) {
                        User u = new User(stuId, fullName, email, "password", "STUDENT", deptName, semName, enrolled);
                        userRepository.save(u);
                        savedCount++;
                    } else {
                        User u = existing.get();
                        u.setName(fullName);
                        u.setEmail(email);
                        u.setEnrolledCourses(enrolled);
                        u.setSemester(semName);
                        u.setDepartment(deptName);
                        userRepository.save(u);
                    }
                }
            }
        }

        System.out.println("[INFO] Successfully seeded " + savedCount + " branch students (5 students per semester for all 6 departments) in MySQL database.");
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

        // Always ensure official Computer Science & Engineering core courses exist in MySQL
        List<Course> cseCourses = List.of(
            new Course(null, "CS101", "Database Management Systems", "Dr. Ramesh Babu", "Semester 3"),
            new Course(null, "CS102", "Data Structures & Algorithms", "Prof. Sunita Sharma", "Semester 3"),
            new Course(null, "CS103", "Object-Oriented Programming with Java", "Dr. Ramesh Babu", "Semester 3"),
            new Course(null, "CS201", "Operating Systems", "Dr. Amit Patel", "Semester 4"),
            new Course(null, "CS202", "Machine Learning & Data Science", "Prof. Sunita Sharma", "Semester 5"),
            new Course(null, "CS301", "Computer Networks", "Dr. Priya Nair", "Semester 5"),
            new Course(null, "CS302", "Software Engineering & Agile Methodologies", "Prof. Rajesh Verma", "Semester 6"),
            new Course(null, "CS303", "Cloud Computing & DevOps", "Dr. Amit Patel", "Semester 6"),
            new Course(null, "CS401", "Artificial Intelligence & Neural Networks", "Dr. Ramesh Babu", "Semester 7"),
            new Course(null, "CS402", "Cyber Security & Cryptography", "Prof. Rajesh Verma", "Semester 7")
        );
        for (Course c : cseCourses) {
            Optional<Course> existing = courseRepository.findByCodeIgnoreCase(c.getCode());
            if (existing.isEmpty()) {
                courseRepository.save(c);
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
            }
        }

        if (marksRepository.count() == 0) {
            marksRepository.saveAll(marksList);
            System.out.println("[INFO] Seeded " + marksList.size() + " student marks records in MySQL database.");
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
                                Course course = new Course(null, subCode, subjectName, "Faculty Board", "Semester 3");
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

                List<ProgramOutcome> existingPOs = poRepository.findAll();
                Set<String> existingNumbers = existingPOs.stream()
                        .map(p -> p.getPoNumber() != null ? p.getPoNumber().toUpperCase() : "")
                        .collect(Collectors.toSet());

                List<ProgramOutcome> toSavePOs = new ArrayList<>();
                for (ProgramOutcome po : uniquePOByNum.values()) {
                    if (po.getPoNumber() != null && !existingNumbers.contains(po.getPoNumber().toUpperCase())) {
                        toSavePOs.add(po);
                    }
                }
                if (!toSavePOs.isEmpty()) {
                    poRepository.saveAll(toSavePOs);
                }
                poCount = poRepository.count() > 0 ? (int) poRepository.count() : uniquePOByNum.size();
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
