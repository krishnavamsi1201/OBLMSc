-- ============================================================================
-- OUTCOME-BASED LEARNING MANAGEMENT SYSTEM (OBLMS)
-- COMPREHENSIVE MYSQL DATABASE QUERIES & OBE ANALYTICS SUITE
-- Database: oblms
-- Engine: MySQL 8.0+ / InnoDB
-- ============================================================================

USE oblms;

-- ----------------------------------------------------------------------------
-- SECTION 1: MASTER USER REPOSITORY (ADMIN, FACULTY, MULTI-BRANCH STUDENTS)
-- ----------------------------------------------------------------------------

-- 1.1 View all active system accounts with roles and departments
SELECT id, name, email, role, department, enrolled_courses 
FROM users 
ORDER BY role ASC, department ASC, name ASC;

-- 1.2 View all Faculty members and their multi-semester assigned courses
SELECT id AS faculty_id, name AS faculty_name, email, department, enrolled_courses AS assigned_subjects
FROM users 
WHERE UPPER(role) = 'FACULTY'
ORDER BY department, name;

-- 1.3 View all Students across all 5 Engineering Branches (CSE, IT, ECE, MECH, CIVIL)
SELECT id AS student_id, name AS student_name, email, department, enrolled_courses
FROM users 
WHERE UPPER(role) = 'STUDENT'
ORDER BY department, name;

-- 1.4 Count of registered users by Department & Role
SELECT department, role, COUNT(*) AS total_users
FROM users 
GROUP BY department, role
ORDER BY department, role;


-- ----------------------------------------------------------------------------
-- SECTION 2: COURSE CATALOG & FACULTY WORKLOAD ALLOCATIONS
-- ----------------------------------------------------------------------------

-- 2.1 Complete Course Catalog across all semesters and departments
SELECT id, code, title, faculty, semester 
FROM courses 
ORDER BY semester, code;

-- 2.2 Courses allocated to a specific Faculty (e.g. Dr. Ramesh Babu or Dr.Prasanth Kumar)
SELECT code, title, faculty, semester 
FROM courses 
WHERE faculty LIKE '%Ramesh%' OR faculty LIKE '%Prasanth%' OR faculty LIKE '%Sunita%';

-- 2.3 Course workload count per Faculty member
SELECT faculty, COUNT(*) AS total_courses_taught
FROM courses 
WHERE faculty IS NOT NULL AND faculty != 'Faculty Board' AND faculty != 'Unassigned'
GROUP BY faculty
ORDER BY total_courses_taught DESC;


-- ----------------------------------------------------------------------------
-- SECTION 3: STUDENT COURSE ENROLLMENT REQUESTS & ADMIN APPROVALS
-- ----------------------------------------------------------------------------

-- 3.1 All enrollment requests submitted by students
SELECT id, student_name, reg_no, department, course_code, course_title, semester, status, request_date
FROM course_requests 
ORDER BY request_date DESC;

-- 3.2 Approved student enrollment requests
SELECT student_name, reg_no, department, course_code, course_title, status 
FROM course_requests 
WHERE status = 'Approved';

-- 3.3 Pending enrollment requests waiting for Admin approval
SELECT student_name, department, course_code, course_title, status 
FROM course_requests 
WHERE status = 'Pending';


-- ----------------------------------------------------------------------------
-- SECTION 4: REAL-TIME NOTIFICATIONS & SYSTEM ACTIVITY LOG
-- ----------------------------------------------------------------------------

-- 4.1 All system notifications across students and faculty
SELECT id, recipient_name, recipient_role, title, message, type, is_read, created_at
FROM notifications 
ORDER BY created_at DESC;

-- 4.2 Notifications delivered specifically to a Student (e.g. Kaushik Ghattamaneni / B.Hasini)
SELECT recipient_name, title, message, type, created_at 
FROM notifications 
WHERE recipient_name LIKE '%Kaushik%' OR recipient_name LIKE '%Hasini%'
ORDER BY created_at DESC;


-- ----------------------------------------------------------------------------
-- SECTION 5: OUTCOME-BASED EDUCATION (OBE) & NBA ACCREDITATION MATRICES
-- ----------------------------------------------------------------------------

-- 5.1 Program Outcomes (PO1 to PO12) NBA Tier-1 Standard
SELECT code, title, description 
FROM program_outcomes 
ORDER BY id ASC 
LIMIT 12;

-- 5.2 Course Outcomes (CO1 to CO6) for all active courses
SELECT id, course AS course_code, co AS co_code, description, target_percentage, approval_status
FROM course_outcomes 
ORDER BY course, co;

-- 5.3 Accredited CO-PO Mapping Matrix with correlation levels (1=Low, 2=Medium, 3=High)
SELECT course_code, co_code, po_code, correlation_level, rationale
FROM copo_mappings 
ORDER BY course_code, co_code, po_code
LIMIT 50;

-- 5.4 Count of mapped CO-PO correlations per course
SELECT course_code, COUNT(*) AS total_mappings, ROUND(AVG(correlation_level), 2) AS avg_mapping_strength
FROM copo_mappings 
GROUP BY course_code
ORDER BY total_mappings DESC;


-- ----------------------------------------------------------------------------
-- SECTION 6: DIRECT EVALUATION, MARKS & ASSESSMENT ATTAINMENT
-- ----------------------------------------------------------------------------

-- 6.1 Direct Continuous Internal Evaluation (CIE) Marks & Scores
SELECT id, student, assessment, obtained, max_marks, ROUND((obtained/max_marks)*100, 1) AS score_percentage
FROM student_marks 
ORDER BY assessment, student;

-- 6.2 Assessment to Course Outcome (CO) Alignment
SELECT course_id, course_name, assessment_name, assessment_type, course_outcomes, max_marks, weightage
FROM assessment_co_mappings 
ORDER BY course_id;


-- ----------------------------------------------------------------------------
-- SECTION 7: STUDENT ATTENDANCE & BIOMETRIC/SESSION LOGS
-- ----------------------------------------------------------------------------

-- 7.1 Sample attendance tracking records
SELECT id, student, course_code, date, session_type, status, time_slot
FROM attendance_records 
ORDER BY date DESC 
LIMIT 30;

-- 7.2 Student attendance percentage summary per course
SELECT student, course_code,
       COUNT(*) AS total_classes,
       SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS attended_classes,
       ROUND((SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) AS attendance_pct
FROM attendance_records 
GROUP BY student, course_code
ORDER BY student, course_code;


-- ----------------------------------------------------------------------------
-- SECTION 8: QUESTION BANK, BLOOM'S TAXONOMY & ACADEMIC TIMETABLE
-- ----------------------------------------------------------------------------

-- 8.1 Question bank items with Bloom's Taxonomy & mapped Course Outcomes
SELECT id, course_id, question_text, blooms_level, mapped_co, marks, difficulty
FROM question_bank 
ORDER BY course_id, mapped_co;

-- 8.2 Institutional weekly timetable matrix
SELECT day_of_week, period_number, time_interval, course_code, course_name, faculty_name, room_number
FROM timetable_slots 
ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'), period_number;

-- 8.3 Student grievances and continuous improvement resolution logs
SELECT id, student_name, category, subject, description, status, priority, created_at
FROM grievances 
ORDER BY created_at DESC;

-- ============================================================================
-- END OF OBLMS DATABASE QUERIES SUITE
-- ============================================================================
