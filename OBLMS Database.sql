-- =============================================================================
-- DATABASE SCRIPT FOR OUTCOME-BASED LEARNING MANAGEMENT SYSTEM (OBLMS)
-- Database Name: oblms
-- DBMS: MySQL 8.0+
-- Compatible with Spring Boot Backend & Angular Frontend
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `oblms`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `oblms`;

-- Disable foreign key checks during schema creation
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. USERS TABLE
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `id` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) NOT NULL COMMENT 'STUDENT, FACULTY, ADMIN',
    `department` VARCHAR(255) DEFAULT NULL,
    `enrolled_courses` VARCHAR(1000) DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. ACADEMIC STREAMS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `academic_streams`;
CREATE TABLE `academic_streams` (
    `course_id` BIGINT NOT NULL,
    `course_name` VARCHAR(100) DEFAULT NULL,
    `course_type` VARCHAR(50) DEFAULT NULL,
    `duration` INT DEFAULT 4,
    `status` INT DEFAULT 1,
    PRIMARY KEY (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. ACADEMIC PROGRAMS (BRANCHES / DEPARTMENTS)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `academic_programs`;
CREATE TABLE `academic_programs` (
    `branch_id` BIGINT NOT NULL,
    `branch_name` VARCHAR(255) DEFAULT NULL,
    `course_id` BIGINT DEFAULT NULL,
    `branch_status` INT DEFAULT 1,
    `dept_code` VARCHAR(50) DEFAULT NULL,
    `short_code` VARCHAR(50) DEFAULT NULL,
    PRIMARY KEY (`branch_id`),
    KEY `idx_prog_course_id` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. CURRICULUM SUBJECTS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `curriculum_subjects`;
CREATE TABLE `curriculum_subjects` (
    `sub_id` BIGINT NOT NULL,
    `subject_name` VARCHAR(255) DEFAULT NULL,
    `subject_type` VARCHAR(100) DEFAULT NULL,
    `sub_code` VARCHAR(100) DEFAULT NULL,
    PRIMARY KEY (`sub_id`),
    KEY `idx_sub_code` (`sub_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. COURSES
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `courses`;
CREATE TABLE `courses` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(100) NOT NULL UNIQUE,
    `title` VARCHAR(255) NOT NULL,
    `faculty` VARCHAR(255) DEFAULT NULL,
    `semester` VARCHAR(50) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_course_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. PROGRAM OUTCOMES (POs)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `program_outcomes`;
CREATE TABLE `program_outcomes` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `pgmid` BIGINT DEFAULT NULL,
    `po_number` VARCHAR(50) DEFAULT NULL,
    `po` VARCHAR(50) DEFAULT NULL,
    `program` VARCHAR(100) DEFAULT NULL,
    `description` VARCHAR(2048) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_po_num` (`po_number`),
    KEY `idx_po_prog` (`program`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. COURSE OUTCOMES (COs)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `course_outcomes`;
CREATE TABLE `course_outcomes` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `comid` BIGINT DEFAULT NULL,
    `sem_sub_id` BIGINT DEFAULT NULL,
    `course` VARCHAR(100) DEFAULT NULL,
    `co` VARCHAR(50) DEFAULT NULL,
    `description` VARCHAR(2048) DEFAULT NULL,
    `approval_status` VARCHAR(50) DEFAULT 'Approved',
    `blooms_level` VARCHAR(50) DEFAULT 'Apply',
    `faculty` VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_co_course` (`course`),
    KEY `idx_co_co` (`co`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. CO-PO MAPPINGS (CORRELATION MATRIX)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `copo_mappings`;
CREATE TABLE `copo_mappings` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `cpid` BIGINT DEFAULT NULL,
    `comid` BIGINT DEFAULT NULL,
    `pgmid` BIGINT DEFAULT NULL,
    `course` VARCHAR(100) NOT NULL,
    `co` VARCHAR(50) NOT NULL,
    `po` VARCHAR(50) NOT NULL,
    `contribution` INT DEFAULT 0,
    `mapping_level` INT DEFAULT 1 COMMENT '1 = Low, 2 = Medium, 3 = High',
    `status` VARCHAR(50) DEFAULT 'Approved',
    PRIMARY KEY (`id`),
    KEY `idx_copo_course` (`course`),
    KEY `idx_copo_po` (`po`),
    KEY `idx_copo_co` (`co`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. ASSESSMENT CO MAPPINGS (SCHEDULED ASSESSMENTS)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `assessment_co_mappings`;
CREATE TABLE `assessment_co_mappings` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `assessment_name` VARCHAR(255) NOT NULL,
    `assessment_type` VARCHAR(100) DEFAULT NULL COMMENT 'Assignment, Quiz, Mid Exam, Final Exam, Lab Exam',
    `course_id` VARCHAR(100) DEFAULT NULL,
    `course_name` VARCHAR(255) DEFAULT NULL,
    `course_outcomes` VARCHAR(500) DEFAULT NULL COMMENT 'e.g. CO1, CO2, CO3',
    `max_marks` INT DEFAULT 100,
    PRIMARY KEY (`id`),
    KEY `idx_asm_course` (`course_id`),
    KEY `idx_asm_type` (`assessment_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. STUDENT MARKS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `student_marks`;
CREATE TABLE `student_marks` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `student` VARCHAR(255) NOT NULL,
    `assessment` VARCHAR(255) NOT NULL,
    `obtained` DOUBLE DEFAULT 0,
    `max_marks` DOUBLE DEFAULT 100,
    PRIMARY KEY (`id`),
    KEY `idx_sm_student` (`student`),
    KEY `idx_sm_assessment` (`assessment`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. TIMETABLE SLOTS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `timetable_slots`;
CREATE TABLE `timetable_slots` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `day` VARCHAR(50) NOT NULL COMMENT 'Monday, Tuesday, Wednesday, Thursday, Friday, Saturday',
    `period` VARCHAR(100) NOT NULL COMMENT 'e.g. 09:00 AM - 10:00 AM',
    `subject` VARCHAR(255) NOT NULL,
    `room` VARCHAR(100) NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_tt_day` (`day`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 12. CLASS ADJUSTMENTS (FACULTY SUBSTITUTE REQUESTS)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `class_adjustments`;
CREATE TABLE `class_adjustments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `requester_id` VARCHAR(100) NOT NULL,
    `requester_name` VARCHAR(255) NOT NULL,
    `substitute_id` VARCHAR(100) NOT NULL,
    `substitute_name` VARCHAR(255) NOT NULL,
    `course_name` VARCHAR(255) NOT NULL,
    `adjustment_date` VARCHAR(50) NOT NULL,
    `period` VARCHAR(100) NOT NULL,
    `room` VARCHAR(100) NOT NULL,
    `topic_instructions` TEXT DEFAULT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING, APPROVED, REJECTED',
    `rejection_reason` TEXT DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_ca_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 13. ATTENDANCE RECORDS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `attendance_records`;
CREATE TABLE `attendance_records` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `student` VARCHAR(255) NOT NULL,
    `course_code` VARCHAR(100) NOT NULL,
    `date` VARCHAR(50) NOT NULL,
    `status` VARCHAR(50) NOT NULL COMMENT 'Present, Absent, Late',
    PRIMARY KEY (`id`),
    KEY `idx_att_student` (`student`),
    KEY `idx_att_course` (`course_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 14. EXAMS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `exams`;
CREATE TABLE `exams` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `course` VARCHAR(255) NOT NULL,
    `date` VARCHAR(50) NOT NULL,
    `room` VARCHAR(100) NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'Scheduled' COMMENT 'Scheduled, Ongoing, Completed',
    `marks` INT DEFAULT 100,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 15. QUESTION BANK
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `question_bank`;
CREATE TABLE `question_bank` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `question_text` VARCHAR(1000) NOT NULL,
    `type` VARCHAR(100) DEFAULT NULL COMMENT 'MCQ, Short Answer, Essay',
    `difficulty` VARCHAR(50) DEFAULT NULL COMMENT 'Easy, Medium, Hard',
    `blooms_level` VARCHAR(100) DEFAULT NULL COMMENT 'L1: Remember, L2: Understand, L3: Apply, L4: Analyze, L5: Evaluate, L6: Create',
    `marks` INT DEFAULT 5,
    `subject` VARCHAR(255) DEFAULT NULL,
    `co_mapped` VARCHAR(50) DEFAULT NULL COMMENT 'CO1, CO2, CO3...',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 16. GRIEVANCES
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `grievances`;
CREATE TABLE `grievances` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` VARCHAR(2000) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `student_name` VARCHAR(255) NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'Open' COMMENT 'Open, In Review, Resolved',
    `date` VARCHAR(50) NOT NULL,
    `resolution` VARCHAR(2000) DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 17. GRIEVANCE COMMENTS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `grievance_comments`;
CREATE TABLE `grievance_comments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `grievance_id` BIGINT NOT NULL,
    `sender` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) NOT NULL,
    `text` VARCHAR(1000) NOT NULL,
    `timestamp` VARCHAR(100) NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_gc_grievance` (`grievance_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 18. COURSE REQUESTS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `course_requests`;
CREATE TABLE `course_requests` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `student_id` VARCHAR(100) DEFAULT NULL,
    `student_name` VARCHAR(255) DEFAULT NULL,
    `student_email` VARCHAR(255) DEFAULT NULL,
    `reg_no` VARCHAR(100) DEFAULT NULL,
    `department` VARCHAR(255) DEFAULT NULL,
    `course_code` VARCHAR(100) DEFAULT NULL,
    `course_title` VARCHAR(255) DEFAULT NULL,
    `semester` VARCHAR(50) DEFAULT NULL,
    `status` VARCHAR(50) DEFAULT 'Pending' COMMENT 'Pending, Approved, Rejected',
    `remarks` VARCHAR(500) DEFAULT NULL,
    `requested_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `action_date` DATETIME DEFAULT NULL,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 19. NOTIFICATIONS
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `recipient_id` VARCHAR(100) DEFAULT NULL,
    `recipient_name` VARCHAR(255) DEFAULT NULL,
    `recipient_role` VARCHAR(50) DEFAULT NULL,
    `title` VARCHAR(255) DEFAULT NULL,
    `message` VARCHAR(1000) DEFAULT NULL,
    `type` VARCHAR(50) DEFAULT 'info',
    `action_url` VARCHAR(255) DEFAULT NULL,
    `is_read` TINYINT(1) DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- SAMPLE DATA INSERTS
-- =============================================================================

-- 1. Insert Initial Users
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `department`, `enrolled_courses`) VALUES
('ADM001', 'System Administrator', 'admin@gmail.com', 'admin123', 'ADMIN', 'Computer Science & Engineering', 'CS101,CS102,CS103,CS301,CS302'),
('FAC001', 'Dr. Ramesh Kumar', 'ramesh@gmail.com', 'faculty123', 'FACULTY', 'Computer Science & Engineering', 'CS101,CS103'),
('FAC002', 'Prof. Priya Sharma', 'priya@gmail.com', 'faculty123', 'FACULTY', 'Computer Science & Engineering', 'CS102,CS301'),
('FAC003', 'Dr. Suresh Verma', 'suresh@gmail.com', 'faculty123', 'FACULTY', 'Civil Engineering', 'FMHM,SMSE,CE234'),
('STU001', 'Krishnavamsi', 'krishnavamsi@gmail.com', 'student123', 'STUDENT', 'Computer Science & Engineering', 'CS101,CS102,CS103,CS301,CS302,DS Lab'),
('STU002', 'Raj Kumar', 'raj@gmail.com', 'student123', 'STUDENT', 'Computer Science & Engineering', 'CS101,CS102,CS103,CS301,CS302'),
('STU003', 'Ananya Patel', 'ananya@gmail.com', 'student123', 'STUDENT', 'Civil Engineering', 'FMHM,SMSE,CE234,EMII');

-- 2. Insert Academic Streams
INSERT INTO `academic_streams` (`course_id`, `course_name`, `course_type`, `duration`, `status`) VALUES
(1001, 'Bachelor of Technology (B.Tech)', 'UG', 4, 1),
(1002, 'Master of Technology (M.Tech)', 'PG', 2, 1),
(1003, 'Master of Computer Applications (MCA)', 'PG', 2, 1);

-- 3. Insert Academic Programs
INSERT INTO `academic_programs` (`branch_id`, `branch_name`, `course_id`, `branch_status`, `dept_code`, `short_code`) VALUES
(1, 'Computer Science & Engineering', 1001, 1, 'CSE', 'CSE'),
(2, 'Information Technology', 1001, 1, 'IT', 'IT'),
(3, 'Electronics & Communication Engineering', 1001, 1, 'ECE', 'ECE'),
(4, 'Mechanical Engineering', 1001, 1, 'ME', 'ME'),
(5, 'Civil Engineering', 1001, 1, 'CE', 'Civil');

-- 4. Insert Core Courses
INSERT INTO `courses` (`code`, `title`, `faculty`, `semester`) VALUES
('CS101', 'Database Management Systems', 'Dr. Ramesh Kumar', 'Semester 6'),
('CS102', 'Java & OOPs Programming', 'Prof. Priya Sharma', 'Semester 6'),
('CS103', 'Data Structures & Algorithms', 'Dr. Ramesh Kumar', 'Semester 6'),
('CS301', 'Operating Systems', 'Prof. Priya Sharma', 'Semester 6'),
('CS302', 'Computer Networks', 'Dr. Ramesh Kumar', 'Semester 6'),
('FMHM', 'Fluid Mechanics & Hydraulic Machinery', 'Dr. Suresh Verma', 'Semester 6'),
('SMSE', 'Structural Mechanics & Materials', 'Dr. Suresh Verma', 'Semester 6');

-- 5. Insert Program Outcomes (POs for NBA Accreditation)
INSERT INTO `program_outcomes` (`pgmid`, `po_number`, `po`, `program`, `description`) VALUES
(1, 'PO1', 'PO1', 'B.Tech CSE', 'Engineering Knowledge: Apply mathematics, science, and engineering fundamentals to complex computer engineering problems.'),
(2, 'PO2', 'PO2', 'B.Tech CSE', 'Problem Analysis: Identify, formulate, review research literature, and analyze complex engineering problems.'),
(3, 'PO3', 'PO3', 'B.Tech CSE', 'Design/Development of Solutions: Design solutions for complex computer engineering problems.'),
(4, 'PO4', 'PO4', 'B.Tech CSE', 'Conduct Investigations: Use research-based knowledge and research methods to provide valid conclusions.'),
(5, 'PO5', 'PO5', 'B.Tech CSE', 'Modern Tool Usage: Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools.'),
(6, 'PO6', 'PO6', 'B.Tech CSE', 'The Engineer and Society: Apply reasoning informed by contextual knowledge to assess societal, health, and legal issues.'),
(7, 'PO7', 'PO7', 'B.Tech CSE', 'Environment and Sustainability: Understand the impact of professional engineering solutions in societal contexts.'),
(8, 'PO8', 'PO8', 'B.Tech CSE', 'Ethics: Apply ethical principles and commit to professional ethics and responsibilities of engineering practice.'),
(9, 'PO9', 'PO9', 'B.Tech CSE', 'Individual and Team Work: Function effectively as an individual, and as a member or leader in diverse teams.'),
(10, 'PO10', 'PO10', 'B.Tech CSE', 'Communication: Communicate effectively on complex engineering activities with the engineering community.'),
(11, 'PO11', 'PO11', 'B.Tech CSE', 'Project Management and Finance: Demonstrate knowledge and understanding of engineering and management principles.'),
(12, 'PO12', 'PO12', 'B.Tech CSE', 'Life-long Learning: Recognize the need for, and have the preparation to engage in independent life-long learning.');

-- 6. Insert Course Outcomes (COs)
INSERT INTO `course_outcomes` (`comid`, `sem_sub_id`, `course`, `co`, `description`, `approval_status`, `blooms_level`, `faculty`) VALUES
(1, 101, 'CS101', 'CO1', 'Understand relational database concepts, ER modeling, and relational algebra operations.', 'Approved', 'Understand', 'Dr. Ramesh Kumar'),
(2, 101, 'CS101', 'CO2', 'Construct complex SQL queries, views, constraints, and triggers for relational databases.', 'Approved', 'Apply', 'Dr. Ramesh Kumar'),
(3, 101, 'CS101', 'CO3', 'Apply database normalization techniques (1NF, 2NF, 3NF, BCNF) to eliminate anomalies.', 'Approved', 'Analyze', 'Dr. Ramesh Kumar'),
(4, 101, 'CS101', 'CO4', 'Evaluate transaction processing, ACID properties, concurrency control, and crash recovery.', 'Approved', 'Evaluate', 'Dr. Ramesh Kumar'),
(5, 102, 'CS102', 'CO1', 'Apply object-oriented programming paradigms, abstraction, and encapsulation in Java.', 'Approved', 'Apply', 'Prof. Priya Sharma'),
(6, 102, 'CS102', 'CO2', 'Develop multi-threaded, robust Java applications with comprehensive exception handling.', 'Approved', 'Create', 'Prof. Priya Sharma'),
(7, 103, 'CS103', 'CO1', 'Analyze time and space complexity of algorithms using asymptotic notations.', 'Approved', 'Analyze', 'Dr. Ramesh Kumar'),
(8, 103, 'CS103', 'CO2', 'Implement non-linear data structures like binary search trees, AVL trees, and graphs.', 'Approved', 'Apply', 'Dr. Ramesh Kumar'),
(9, 301, 'CS301', 'CO1', 'Explain CPU scheduling algorithms, process synchronization primitives, and deadlock prevention.', 'Approved', 'Understand', 'Prof. Priya Sharma'),
(10, 302, 'CS302', 'CO1', 'Analyze OSI and TCP/IP protocol stack layers, IP addressing, and routing algorithms.', 'Approved', 'Analyze', 'Dr. Ramesh Kumar');

-- 7. Insert CO-PO Correlation Mappings (Scale: 1 = Low, 2 = Medium, 3 = High)
INSERT INTO `copo_mappings` (`cpid`, `comid`, `pgmid`, `course`, `co`, `po`, `contribution`, `mapping_level`, `status`) VALUES
(1, 1, 1, 'CS101', 'CO1', 'PO1', 99, 3, 'Approved'),
(2, 1, 2, 'CS101', 'CO1', 'PO2', 66, 2, 'Approved'),
(3, 2, 3, 'CS101', 'CO2', 'PO3', 99, 3, 'Approved'),
(4, 2, 5, 'CS101', 'CO2', 'PO5', 99, 3, 'Approved'),
(5, 3, 2, 'CS101', 'CO3', 'PO2', 99, 3, 'Approved'),
(6, 4, 3, 'CS101', 'CO4', 'PO3', 66, 2, 'Approved'),
(7, 5, 1, 'CS102', 'CO1', 'PO1', 99, 3, 'Approved'),
(8, 5, 3, 'CS102', 'CO1', 'PO3', 99, 3, 'Approved'),
(9, 6, 3, 'CS102', 'CO2', 'PO3', 99, 3, 'Approved'),
(10, 6, 5, 'CS102', 'CO2', 'PO5', 66, 2, 'Approved'),
(11, 7, 1, 'CS103', 'CO1', 'PO1', 99, 3, 'Approved'),
(12, 7, 2, 'CS103', 'CO1', 'PO2', 99, 3, 'Approved'),
(13, 8, 3, 'CS103', 'CO2', 'PO3', 99, 3, 'Approved'),
(14, 9, 1, 'CS301', 'CO1', 'PO1', 99, 3, 'Approved'),
(15, 9, 2, 'CS301', 'CO1', 'PO2', 66, 2, 'Approved'),
(16, 10, 1, 'CS302', 'CO1', 'PO1', 99, 3, 'Approved'),
(17, 10, 4, 'CS302', 'CO1', 'PO4', 99, 3, 'Approved');

-- 8. Insert Scheduled Assessments
INSERT INTO `assessment_co_mappings` (`assessment_name`, `assessment_type`, `course_id`, `course_name`, `course_outcomes`, `max_marks`) VALUES
('DBMS Assignment 1 (SQL Queries & Relational Algebra)', 'Assignment', 'CS101', 'CS101 - Database Management Systems', 'CO1, CO2', 25),
('DBMS Objective Quiz 1', 'Quiz', 'CS101', 'CS101 - Database Management Systems', 'CO1, CO2, CO3', 20),
('DBMS Mid-Semester Examination', 'Mid Exam', 'CS101', 'CS101 - Database Management Systems', 'CO1, CO2, CO3', 50),
('DBMS End-Semester Final Examination', 'Final Exam', 'CS101', 'CS101 - Database Management Systems', 'CO1, CO2, CO3, CO4', 100),
('Java OOPs Assignment 1', 'Assignment', 'CS102', 'CS102 - Java & OOPs Programming', 'CO1', 25),
('Java OOPs Mid Exam', 'Mid Exam', 'CS102', 'CS102 - Java & OOPs Programming', 'CO1, CO2', 50),
('Data Structures Mid Exam', 'Mid Exam', 'CS103', 'CS103 - Data Structures & Algorithms', 'CO1, CO2', 50),
('Data Structures Practical Lab Exam', 'Lab Exam', 'DS Lab', 'DS Lab - Data Structures Laboratory', 'CO1, CO2', 50),
('Computer Networks Quiz 1', 'Quiz', 'CS302', 'CS302 - Computer Networks', 'CO1', 20);

-- 9. Insert Student Marks
INSERT INTO `student_marks` (`student`, `assessment`, `obtained`, `max_marks`) VALUES
('Krishnavamsi', 'DBMS Assignment 1 (SQL Queries & Relational Algebra)', 24, 25),
('Krishnavamsi', 'DBMS Objective Quiz 1', 19, 20),
('Krishnavamsi', 'DBMS Mid-Semester Examination', 47, 50),
('Krishnavamsi', 'Java OOPs Assignment 1', 23, 25),
('Krishnavamsi', 'Java OOPs Mid Exam', 46, 50),
('Krishnavamsi', 'Data Structures Mid Exam', 48, 50),
('Krishnavamsi', 'Data Structures Practical Lab Exam', 49, 50),
('Krishnavamsi', 'Computer Networks Quiz 1', 18, 20),
('Raj Kumar', 'DBMS Assignment 1 (SQL Queries & Relational Algebra)', 21, 25),
('Raj Kumar', 'DBMS Mid-Semester Examination', 42, 50);

-- 10. Insert Full Weekly Timetable
INSERT INTO `timetable_slots` (`day`, `period`, `subject`, `room`) VALUES
('Monday', '09:00 AM - 10:00 AM', 'Database Management Systems (CS101)', 'LH-101'),
('Monday', '10:15 AM - 11:15 AM', '☕ Leisure & Self-Study', 'Reading Hall'),
('Monday', '11:30 AM - 12:30 PM', 'Java & OOPs Programming (CS102)', 'LH-204'),
('Monday', '02:00 PM - 03:00 PM', '📚 Library & Research Hours', 'Central Library'),
('Monday', '03:15 PM - 04:15 PM', 'Operating Systems (CS301)', 'LH-305'),

('Tuesday', '09:00 AM - 10:00 AM', 'Data Structures & Algorithms (CS103)', 'LH-101'),
('Tuesday', '10:15 AM - 11:15 AM', '☕ Leisure & Competitive Coding', 'Coding Cell'),
('Tuesday', '11:30 AM - 12:30 PM', 'Computer Networks (CS302)', 'LH-305'),
('Tuesday', '02:00 PM - 03:00 PM', 'Database & SQL Lab Session', 'Lab-4A'),
('Tuesday', '03:15 PM - 04:15 PM', '☕ Leisure & Peer Mentoring', 'Student Lounge'),

('Wednesday', '09:00 AM - 10:00 AM', 'Java & OOPs Programming (CS102)', 'LH-204'),
('Wednesday', '10:15 AM - 11:15 AM', '☕ Leisure & Recess', 'Campus Zone'),
('Wednesday', '11:30 AM - 12:30 PM', 'Database Management Systems (CS101)', 'LH-101'),
('Wednesday', '02:00 PM - 03:00 PM', '📚 Library & Self-Study', 'Central Library'),
('Wednesday', '03:15 PM - 04:15 PM', 'Java & OOPs Practical Lab', 'Lab-2B'),

('Thursday', '09:00 AM - 10:00 AM', 'Operating Systems (CS301)', 'LH-305'),
('Thursday', '10:15 AM - 11:15 AM', '☕ Leisure & Self-Study', 'Reading Hall'),
('Thursday', '11:30 AM - 12:30 PM', 'Data Structures & Algorithms (CS103)', 'LH-101'),
('Thursday', '02:00 PM - 03:00 PM', 'Data Structures & Algorithms Lab', 'Lab-1A'),
('Thursday', '03:15 PM - 04:15 PM', '📚 Library & Digital Lab', 'Central Library'),

('Friday', '09:00 AM - 10:00 AM', 'Computer Networks (CS302)', 'LH-305'),
('Friday', '10:15 AM - 11:15 AM', '☕ Leisure & Faculty Consultation', 'Faculty Lounge'),
('Friday', '11:30 AM - 12:30 PM', 'Software Engineering & OBE (CS201)', 'LH-204'),
('Friday', '02:00 PM - 03:00 PM', '⚽ Sports & Physical Fitness', 'Sports Ground'),
('Friday', '03:15 PM - 04:15 PM', 'Cloud Computing & DevOps Workshop', 'LH-101'),

('Saturday', '09:00 AM - 10:00 AM', 'Software Engineering & Agile Methodologies', 'LH-204'),
('Saturday', '10:15 AM - 11:15 AM', '☕ Leisure & Tech Club', 'Innovation Cell'),
('Saturday', '11:30 AM - 12:30 PM', 'Mini-Project Review & Viva Preparation', 'Lab-4A'),
('Saturday', '02:00 PM - 03:00 PM', '📚 Library & Hackathon Prep', 'Central Library'),
('Saturday', '03:15 PM - 04:15 PM', '☕ Leisure & Weekend Review', 'Student Lounge');
