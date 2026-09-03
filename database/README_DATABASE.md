# 🗄️ OBLMS MySQL Database & Relational Architecture Documentation

## 📌 Database Overview
- **Database Name**: oblms
- **RDBMS Engine**: MySQL 8.0+ (InnoDB, UTF-8 Unicode)
- **Backend Framework**: Spring Boot 3.2+ (Spring Data JPA / Hibernate)
- **Frontend Framework**: Angular 19+ (Standalone Components, RxJS)

---

## 📊 Summary of Database Tables & Record Counts

| Table Name | Description | Live Record Count |
| :--- | :--- | :--- |
| users | Master Users (Admin, Faculty across departments, Students with RegNos) | **51 Records** |
| courses | Multi-Semester Engineering Courses with Faculty Mappings | **56 Courses** |
| course_requests | Student Branch Course Enrollment Lifecycle (Pending/Approved/Rejected) | **5 Records** |
| 
otifications | Live Notification Delivery Records for Students & Faculty | **6 Records** |
| ttendance_records | Granular Attendance Tracking Logs (Present/Absent/Late) | **2,251 Logs** |
| course_outcomes | Accredited Course Outcomes (CO1 to CO6) with NBA Targets | **349 Outcomes** |
| copo_mappings | CO-to-PO Articulation Matrix with Correlation Strengths (1, 2, 3) | **768 Mappings** |
| program_outcomes | NBA Program Outcomes (PO1–PO12) & Program Specific Outcomes (PSOs) | **70 Outcomes** |
| student_marks | Direct Evaluation Scores, CIE / Term Assessments | **10 Records** |
| ssessment_co_mappings | Direct Assessment to CO Mapping Weightages | **5 Mappings** |
| curriculum_subjects | Master Curriculum Subject & Syllabus Definitions | **50 Subjects** |
| cademic_programs | Degree Programs (B.Tech, M.Tech, MCA) | **24 Programs** |
| cademic_streams | Engineering Streams (CSE, IT, ECE, MECH, CIVIL) | **5 Streams** |
| question_bank | Question Bank Classified by Bloom's Taxonomy (BT1–BT6) & COs | **17 Questions** |
| 	imetable_slots | Master Academic Timetable & Classroom Allocations | **28 Slots** |
| grievances | Continuous Quality Improvement (CQI) Grievance Tracking | **2 Grievances** |

---

## 🚀 Quick Execution Guide for Faculty Demonstration / Viva

### Step 1: Open MySQL Workbench or Command Prompt
`ash
mysql -u root -p
# Enter password (e.g. Loukika@123)
`

### Step 2: Use the OBLMS Database
`sql
USE oblms;
`

### Step 3: Run Any Section from database/oblms_faculty_viva_queries.sql
- **All Users**: SELECT id, name, role, department, enrolled_courses FROM users;
- **Faculty Allocations**: SELECT id, name, enrolled_courses FROM users WHERE role = 'FACULTY';
- **Course Catalog**: SELECT code, title, faculty, semester FROM courses;
- **Enrollment Requests**: SELECT student_name, course_code, course_title, status FROM course_requests;
- **Notifications**: SELECT recipient_name, title, message, created_at FROM notifications;
- **NBA CO-PO Matrix**: SELECT course_code, co_code, po_code, correlation_level FROM copo_mappings LIMIT 20;
- **Attendance Percentage**: SELECT student, course_code, COUNT(*) AS total, SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) AS attended FROM attendance_records GROUP BY student, course_code;

---

## 📦 Database Files Included in database/
1. oblms_full_database_dump.sql — Standalone full database backup (Schema + Tables + Constraints + Seed Data).
2. oblms_faculty_viva_queries.sql — Organized viva queries suite ready to run in MySQL Workbench.
3. README_DATABASE.md — This documentation guide.
