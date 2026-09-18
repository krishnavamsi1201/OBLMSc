package com.oblms.backend.controller;

import com.oblms.backend.model.Course;
import com.oblms.backend.model.User;
import com.oblms.backend.repository.CourseRepository;
import com.oblms.backend.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

import org.springframework.context.annotation.DependsOn;

@RestController
@RequestMapping("/api/courses")
@CrossOrigin(origins = "*")
@DependsOn("CSVSeederService")
public class CourseController {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    @PostConstruct
    public void seedCourses() {
        List<Course> defaultCourses = getAllDefaultAccreditedCourses();
        for (Course c : defaultCourses) {
            Optional<Course> existing = courseRepository.findByCodeIgnoreCase(c.getCode());
            if (existing.isEmpty()) {
                courseRepository.save(c);
            }
        }
    }

    private List<Course> getAllDefaultAccreditedCourses() {
        List<Course> list = new ArrayList<>();

        // ==========================================
        // 1. COMPUTER SCIENCE & ENGINEERING (CSE) - 8 SEMESTERS x 7 SUBJECTS = 56
        // ==========================================
        // Sem 1
        list.add(new Course(null, "CS111", "Calculus & Linear Algebra", "Dr. Satish Sharma", "Semester 1"));
        list.add(new Course(null, "CS112", "Applied Engineering Physics", "Prof. Ananya Sen", "Semester 1"));
        list.add(new Course(null, "CS113", "Problem Solving and Programming in C", "Dr. Ramesh Babu", "Semester 1"));
        list.add(new Course(null, "CS114", "Basic Electrical & Electronics Engineering", "Dr. Priya Nair", "Semester 1"));
        list.add(new Course(null, "CS115", "Engineering Graphics & Design", "Prof. Rajesh Verma", "Semester 1"));
        list.add(new Course(null, "CS111L", "C Programming Laboratory", "Dr. Ramesh Babu", "Semester 1"));
        list.add(new Course(null, "CS112L", "Applied Physics Laboratory", "Prof. Ananya Sen", "Semester 1"));

        // Sem 2
        list.add(new Course(null, "CS121", "Advanced Differential Equations & Transforms", "Dr. Satish Sharma", "Semester 2"));
        list.add(new Course(null, "CS122", "Engineering Chemistry & Materials Science", "Prof. Meenakshi Sundaram", "Semester 2"));
        list.add(new Course(null, "CS123", "Python Programming for Problem Solving", "Prof. Sunita Sharma", "Semester 2"));
        list.add(new Course(null, "CS124", "Basic Mechanical & Civil Engineering", "Dr. K. Srinivas", "Semester 2"));
        list.add(new Course(null, "CS125", "Technical English & Communication Skills", "Prof. Sarah Johnson", "Semester 2"));
        list.add(new Course(null, "CS121L", "Python Programming Laboratory", "Prof. Sunita Sharma", "Semester 2"));
        list.add(new Course(null, "CS122L", "Engineering Chemistry Laboratory", "Prof. Meenakshi Sundaram", "Semester 2"));

        // Sem 3
        list.add(new Course(null, "CS101", "Database Management Systems", "Dr. Ramesh Babu", "Semester 3"));
        list.add(new Course(null, "CS102", "Data Structures & Algorithms", "Prof. Sunita Sharma", "Semester 3"));
        list.add(new Course(null, "CS103", "Object-Oriented Programming with Java", "Dr. Ramesh Babu", "Semester 3"));
        list.add(new Course(null, "CS203", "Discrete Mathematical Structures", "Dr. Satish Sharma", "Semester 3"));
        list.add(new Course(null, "CS204", "Digital Logic & Computer Organization", "Dr. Priya Nair", "Semester 3"));
        list.add(new Course(null, "CS101L", "DBMS & SQL Practical Laboratory", "Dr. Ramesh Babu", "Semester 3"));
        list.add(new Course(null, "CS102L", "Data Structures Practical Laboratory", "Prof. Sunita Sharma", "Semester 3"));

        // Sem 4
        list.add(new Course(null, "CS201", "Operating Systems & Kernel Architecture", "Dr. Amit Patel", "Semester 4"));
        list.add(new Course(null, "CS205", "Design and Analysis of Algorithms", "Prof. Sunita Sharma", "Semester 4"));
        list.add(new Course(null, "CS206", "Formal Languages & Automata Theory", "Prof. Rajesh Verma", "Semester 4"));
        list.add(new Course(null, "CS207", "Computer Organization & Architecture", "Dr. Priya Nair", "Semester 4"));
        list.add(new Course(null, "CS208", "Probability, Statistics & Queueing Theory", "Dr. Satish Sharma", "Semester 4"));
        list.add(new Course(null, "CS201L", "Operating Systems Laboratory", "Dr. Amit Patel", "Semester 4"));
        list.add(new Course(null, "CS205L", "Algorithm Design Laboratory", "Prof. Sunita Sharma", "Semester 4"));

        // Sem 5
        list.add(new Course(null, "CS301", "Computer Networks & Protocols", "Dr. Priya Nair", "Semester 5"));
        list.add(new Course(null, "CS202", "Machine Learning & Data Science", "Prof. Sunita Sharma", "Semester 5"));
        list.add(new Course(null, "CS304", "Database System Implementation & Tuning", "Dr. Ramesh Babu", "Semester 5"));
        list.add(new Course(null, "CS305", "Microprocessors & Microcontrollers", "Dr. V. C. Reddy", "Semester 5"));
        list.add(new Course(null, "CS306", "Web Technologies & Modern Frameworks", "Dr. Amit Patel", "Semester 5"));
        list.add(new Course(null, "CS301L", "Computer Networks Laboratory", "Dr. Priya Nair", "Semester 5"));
        list.add(new Course(null, "CS202L", "Machine Learning Practical Laboratory", "Prof. Sunita Sharma", "Semester 5"));

        // Sem 6
        list.add(new Course(null, "CS302", "Software Engineering & Agile Methodologies", "Prof. Rajesh Verma", "Semester 6"));
        list.add(new Course(null, "CS303", "Cloud Computing & DevOps Architecture", "Dr. Amit Patel", "Semester 6"));
        list.add(new Course(null, "CS307", "Compiler Design & Program Analysis", "Dr. Ramesh Babu", "Semester 6"));
        list.add(new Course(null, "CS308", "Artificial Intelligence Principles", "Prof. Sunita Sharma", "Semester 6"));
        list.add(new Course(null, "CS309", "Cryptography & Network Security", "Dr. Priya Nair", "Semester 6"));
        list.add(new Course(null, "CS302L", "Software Engineering & CASE Tools Lab", "Prof. Rajesh Verma", "Semester 6"));
        list.add(new Course(null, "CS303L", "Cloud Computing & DevOps Laboratory", "Dr. Amit Patel", "Semester 6"));

        // Sem 7
        list.add(new Course(null, "CS401", "Deep Learning & Neural Networks", "Dr. Ramesh Babu", "Semester 7"));
        list.add(new Course(null, "CS402", "Cyber Security & Digital Forensics", "Prof. Rajesh Verma", "Semester 7"));
        list.add(new Course(null, "CS403", "Big Data Analytics & Distributed Systems", "Dr. Amit Patel", "Semester 7"));
        list.add(new Course(null, "CS404", "Distributed Systems & Middleware", "Dr. Priya Nair", "Semester 7"));
        list.add(new Course(null, "CS405", "Natural Language Processing", "Prof. Sunita Sharma", "Semester 7"));
        list.add(new Course(null, "CS401L", "Deep Learning & AI Research Laboratory", "Dr. Ramesh Babu", "Semester 7"));
        list.add(new Course(null, "CS402L", "Cyber Security & Vulnerability Assessment Lab", "Prof. Rajesh Verma", "Semester 7"));

        // Sem 8
        list.add(new Course(null, "CS411", "Internet of Things (IoT) & Edge Computing", "Dr. Priya Nair", "Semester 8"));
        list.add(new Course(null, "CS412", "Quantum Computing & Information Theory", "Dr. Ramesh Babu", "Semester 8"));
        list.add(new Course(null, "CS413", "Blockchain Technology & Smart Contracts", "Dr. Amit Patel", "Semester 8"));
        list.add(new Course(null, "CS414", "Autonomous Agents & Reinforcement Learning", "Prof. Sunita Sharma", "Semester 8"));
        list.add(new Course(null, "CS415", "High Performance Computing", "Prof. Rajesh Verma", "Semester 8"));
        list.add(new Course(null, "CS498", "Major Capstone Project Phase II", "Faculty Board", "Semester 8"));
        list.add(new Course(null, "CS499", "Comprehensive Curriculum Viva Voce", "Faculty Board", "Semester 8"));

        // ==========================================
        // 2. INFORMATION TECHNOLOGY (IT) - 8 SEMESTERS x 7 SUBJECTS = 56
        // ==========================================
        // Sem 1
        list.add(new Course(null, "IT111", "Calculus for Computing Sciences", "Dr. Satish Sharma", "Semester 1"));
        list.add(new Course(null, "IT112", "Applied Physics for Information Science", "Prof. Ananya Sen", "Semester 1"));
        list.add(new Course(null, "IT113", "Problem Solving with C", "Dr. Amit Patel", "Semester 1"));
        list.add(new Course(null, "IT114", "Introduction to Information Technology", "Prof. Rajesh Verma", "Semester 1"));
        list.add(new Course(null, "IT115", "Digital Workshop & Prototyping", "Dr. Priya Nair", "Semester 1"));
        list.add(new Course(null, "IT111L", "C Programming Laboratory", "Dr. Amit Patel", "Semester 1"));
        list.add(new Course(null, "IT112L", "Physics Laboratory", "Prof. Ananya Sen", "Semester 1"));

        // Sem 2
        list.add(new Course(null, "IT121", "Differential Equations & Numerical Methods", "Dr. Satish Sharma", "Semester 2"));
        list.add(new Course(null, "IT122", "Chemistry of Electronic Materials", "Prof. Meenakshi Sundaram", "Semester 2"));
        list.add(new Course(null, "IT123", "Python Programming for IT", "Prof. Sunita Sharma", "Semester 2"));
        list.add(new Course(null, "IT124", "Basics of Electrical & Electronics Engineering", "Dr. Priya Nair", "Semester 2"));
        list.add(new Course(null, "IT125", "Professional Communication & Ethics", "Prof. Sarah Johnson", "Semester 2"));
        list.add(new Course(null, "IT121L", "Python Laboratory", "Prof. Sunita Sharma", "Semester 2"));
        list.add(new Course(null, "IT122L", "IT Hardware & Electronic Lab", "Dr. Priya Nair", "Semester 2"));

        // Sem 3
        list.add(new Course(null, "IT201", "Data Structures using C++", "Prof. Sunita Sharma", "Semester 3"));
        list.add(new Course(null, "IT202", "Object-Oriented Programming with Java", "Dr. Ramesh Babu", "Semester 3"));
        list.add(new Course(null, "IT203", "Discrete Mathematics for IT", "Dr. Satish Sharma", "Semester 3"));
        list.add(new Course(null, "IT204", "Digital Electronics and Logic Design", "Dr. Priya Nair", "Semester 3"));
        list.add(new Course(null, "IT205", "Computer Systems Architecture", "Dr. Amit Patel", "Semester 3"));
        list.add(new Course(null, "IT201L", "Data Structures Laboratory", "Prof. Sunita Sharma", "Semester 3"));
        list.add(new Course(null, "IT202L", "Java Application Development Lab", "Dr. Ramesh Babu", "Semester 3"));

        // Sem 4
        list.add(new Course(null, "IT211", "Operating Systems Administration", "Dr. Amit Patel", "Semester 4"));
        list.add(new Course(null, "IT212", "Relational Database Management Systems", "Dr. Ramesh Babu", "Semester 4"));
        list.add(new Course(null, "IT213", "Design & Analysis of IT Algorithms", "Prof. Sunita Sharma", "Semester 4"));
        list.add(new Course(null, "IT214", "Theory of Computation & Automata", "Prof. Rajesh Verma", "Semester 4"));
        list.add(new Course(null, "IT215", "Environmental Studies & Disaster Management", "Prof. Meenakshi Sundaram", "Semester 4"));
        list.add(new Course(null, "IT211L", "Linux OS Administration Lab", "Dr. Amit Patel", "Semester 4"));
        list.add(new Course(null, "IT212L", "Database & SQL Laboratory", "Dr. Ramesh Babu", "Semester 4"));

        // Sem 5
        list.add(new Course(null, "IT301", "Computer Communication Networks", "Dr. Priya Nair", "Semester 5"));
        list.add(new Course(null, "IT302", "Web Architecture & Full Stack API Design", "Dr. Amit Patel", "Semester 5"));
        list.add(new Course(null, "IT303", "Linux System Administration & Shell Scripting", "Prof. Rajesh Verma", "Semester 5"));
        list.add(new Course(null, "IT304", "Information Theory and Coding", "Dr. Satish Sharma", "Semester 5"));
        list.add(new Course(null, "IT305", "Open Source Software Technologies", "Prof. Sunita Sharma", "Semester 5"));
        list.add(new Course(null, "IT301L", "Network Configuration & Socket Lab", "Dr. Priya Nair", "Semester 5"));
        list.add(new Course(null, "IT303L", "Linux & Shell Scripting Lab", "Prof. Rajesh Verma", "Semester 5"));

        // Sem 6
        list.add(new Course(null, "IT311", "Cloud Infrastructure & Virtualization", "Dr. Amit Patel", "Semester 6"));
        list.add(new Course(null, "IT312", "Software Quality Assurance & Automation Testing", "Prof. Rajesh Verma", "Semester 6"));
        list.add(new Course(null, "IT313", "Information Security & Applied Cryptography", "Dr. Priya Nair", "Semester 6"));
        list.add(new Course(null, "IT314", "Data Warehousing & Business Data Mining", "Prof. Sunita Sharma", "Semester 6"));
        list.add(new Course(null, "IT315", "Mobile Application Development (Flutter/Android)", "Dr. Ramesh Babu", "Semester 6"));
        list.add(new Course(null, "IT311L", "Cloud Microservices & Containers Lab", "Dr. Amit Patel", "Semester 6"));
        list.add(new Course(null, "IT315L", "Mobile App Development Laboratory", "Dr. Ramesh Babu", "Semester 6"));

        // Sem 7
        list.add(new Course(null, "IT401", "DevOps & CI/CD Pipeline Automation", "Dr. Amit Patel", "Semester 7"));
        list.add(new Course(null, "IT402", "Big Data Analytics & Hadoop Ecosystem", "Prof. Sunita Sharma", "Semester 7"));
        list.add(new Course(null, "IT403", "Enterprise Web Applications Engineering", "Dr. Ramesh Babu", "Semester 7"));
        list.add(new Course(null, "IT404", "Artificial Intelligence for IT Operations", "Prof. Rajesh Verma", "Semester 7"));
        list.add(new Course(null, "IT405", "Information Storage & Management", "Dr. Priya Nair", "Semester 7"));
        list.add(new Course(null, "IT401L", "DevOps & Containerization Lab", "Dr. Amit Patel", "Semester 7"));
        list.add(new Course(null, "IT402L", "Big Data Processing Laboratory", "Prof. Sunita Sharma", "Semester 7"));

        // Sem 8
        list.add(new Course(null, "IT411", "Cloud Security, Governance & Compliance", "Dr. Amit Patel", "Semester 8"));
        list.add(new Course(null, "IT412", "IT Service Management & ITIL Standards", "Prof. Rajesh Verma", "Semester 8"));
        list.add(new Course(null, "IT413", "Virtual Reality & Augmented Reality Systems", "Dr. Ramesh Babu", "Semester 8"));
        list.add(new Course(null, "IT414", "Full Stack MEAN/MERN Web Engineering", "Prof. Sunita Sharma", "Semester 8"));
        list.add(new Course(null, "IT415", "Cyber Laws, Intellectual Property & Ethics", "Dr. Priya Nair", "Semester 8"));
        list.add(new Course(null, "IT498", "IT Industry Capstone Project", "Faculty Board", "Semester 8"));
        list.add(new Course(null, "IT499", "Comprehensive Technical Seminar & Viva", "Faculty Board", "Semester 8"));

        // ==========================================
        // 3. ELECTRONICS & COMMUNICATION (ECE) - 8 SEMESTERS x 7 SUBJECTS = 56
        // ==========================================
        // Sem 1
        list.add(new Course(null, "EC111", "Calculus and Complex Variables", "Dr. Satish Sharma", "Semester 1"));
        list.add(new Course(null, "EC112", "Engineering Physics for Electronics", "Prof. Ananya Sen", "Semester 1"));
        list.add(new Course(null, "EC113", "C Programming for Engineers", "Dr. Amit Patel", "Semester 1"));
        list.add(new Course(null, "EC114", "Basics of Electrical & Electronics Engineering", "Dr. V. C. Reddy", "Semester 1"));
        list.add(new Course(null, "EC115", "Engineering Graphics & Circuit Drawing", "Prof. Rajesh Verma", "Semester 1"));
        list.add(new Course(null, "EC111L", "C Programming Laboratory", "Dr. Amit Patel", "Semester 1"));
        list.add(new Course(null, "EC112L", "Applied Physics Laboratory", "Prof. Ananya Sen", "Semester 1"));

        // Sem 2
        list.add(new Course(null, "EC121", "Linear Algebra & Numerical Transforms", "Dr. Satish Sharma", "Semester 2"));
        list.add(new Course(null, "EC122", "Solid State Chemistry & Materials", "Prof. Meenakshi Sundaram", "Semester 2"));
        list.add(new Course(null, "EC123", "Electric Circuit Theory & Network Analysis", "Dr. V. C. Reddy", "Semester 2"));
        list.add(new Course(null, "EC124", "Electrical Machines & Power Systems", "Dr. Priya Nair", "Semester 2"));
        list.add(new Course(null, "EC125", "Professional Communication & English", "Prof. Sarah Johnson", "Semester 2"));
        list.add(new Course(null, "EC121L", "Electric Circuits & Simulation Lab", "Dr. V. C. Reddy", "Semester 2"));
        list.add(new Course(null, "EC122L", "Chemistry & Materials Laboratory", "Prof. Meenakshi Sundaram", "Semester 2"));

        // Sem 3
        list.add(new Course(null, "EC201", "Electronic Devices & Semiconductor Physics", "Dr. V. C. Reddy", "Semester 3"));
        list.add(new Course(null, "EC202", "Digital Electronics & Logic Design", "Dr. Priya Nair", "Semester 3"));
        list.add(new Course(null, "EC203", "Signals, Systems and Transforms", "Dr. Satish Sharma", "Semester 3"));
        list.add(new Course(null, "EC204", "Electromagnetic Fields & Waves", "Prof. Ananya Sen", "Semester 3"));
        list.add(new Course(null, "EC205", "Probability and Random Processes", "Dr. Satish Sharma", "Semester 3"));
        list.add(new Course(null, "EC201L", "Electronic Devices & Circuits Lab", "Dr. V. C. Reddy", "Semester 3"));
        list.add(new Course(null, "EC202L", "Digital Logic Design Laboratory", "Dr. Priya Nair", "Semester 3"));

        // Sem 4
        list.add(new Course(null, "EC211", "Analog Circuits & Linear Amplifiers", "Dr. V. C. Reddy", "Semester 4"));
        list.add(new Course(null, "EC212", "Microprocessors & Microcontroller Interfacing", "Dr. Priya Nair", "Semester 4"));
        list.add(new Course(null, "EC213", "Analog Communication Systems", "Prof. Ananya Sen", "Semester 4"));
        list.add(new Course(null, "EC214", "Linear Integrated Circuits & OP-AMPs", "Dr. V. C. Reddy", "Semester 4"));
        list.add(new Course(null, "EC215", "Control Systems Engineering", "Dr. Satish Sharma", "Semester 4"));
        list.add(new Course(null, "EC211L", "Analog Integrated Circuits Lab", "Dr. V. C. Reddy", "Semester 4"));
        list.add(new Course(null, "EC212L", "Microprocessor & Embedded Systems Lab", "Dr. Priya Nair", "Semester 4"));

        // Sem 5
        list.add(new Course(null, "EC301", "Digital Communication & Modulation", "Dr. Priya Nair", "Semester 5"));
        list.add(new Course(null, "EC302", "Microcontrollers & ARM Architecture", "Dr. V. C. Reddy", "Semester 5"));
        list.add(new Course(null, "EC303", "Digital Signal Processing (DSP)", "Dr. Satish Sharma", "Semester 5"));
        list.add(new Course(null, "EC304", "Antennas and Radio Wave Propagation", "Prof. Ananya Sen", "Semester 5"));
        list.add(new Course(null, "EC305", "Transmission Lines and Waveguides", "Dr. Priya Nair", "Semester 5"));
        list.add(new Course(null, "EC301L", "Digital Communication Laboratory", "Dr. Priya Nair", "Semester 5"));
        list.add(new Course(null, "EC303L", "DSP MATLAB Simulation Laboratory", "Dr. Satish Sharma", "Semester 5"));

        // Sem 6
        list.add(new Course(null, "EC311", "VLSI Circuit Design & CMOS Technology", "Dr. V. C. Reddy", "Semester 6"));
        list.add(new Course(null, "EC312", "Wireless & Cellular Communications", "Dr. Priya Nair", "Semester 6"));
        list.add(new Course(null, "EC313", "Microwave and Radar Engineering", "Prof. Ananya Sen", "Semester 6"));
        list.add(new Course(null, "EC314", "Embedded Real-Time Operating Systems (RTOS)", "Dr. Amit Patel", "Semester 6"));
        list.add(new Course(null, "EC315", "Optical Fiber Communications", "Dr. V. C. Reddy", "Semester 6"));
        list.add(new Course(null, "EC311L", "VLSI Design & Cadence EDA Lab", "Dr. V. C. Reddy", "Semester 6"));
        list.add(new Course(null, "EC314L", "Embedded RTOS & Hardware Lab", "Dr. Amit Patel", "Semester 6"));

        // Sem 7
        list.add(new Course(null, "EC401", "RF and Microwave Circuit Design", "Prof. Ananya Sen", "Semester 7"));
        list.add(new Course(null, "EC402", "Satellite and Space Communications", "Dr. Priya Nair", "Semester 7"));
        list.add(new Course(null, "EC403", "IoT Architecture, Sensors & Actuators", "Dr. V. C. Reddy", "Semester 7"));
        list.add(new Course(null, "EC404", "Biomedical Signal Processing & Instrumentation", "Dr. Satish Sharma", "Semester 7"));
        list.add(new Course(null, "EC405", "Digital Image & Video Processing", "Prof. Sunita Sharma", "Semester 7"));
        list.add(new Course(null, "EC401L", "RF Microwave Measurement Lab", "Prof. Ananya Sen", "Semester 7"));
        list.add(new Course(null, "EC403L", "IoT & Smart Sensor Laboratory", "Dr. V. C. Reddy", "Semester 7"));

        // Sem 8
        list.add(new Course(null, "EC411", "Next-Gen 5G/6G Wireless Networks", "Dr. Priya Nair", "Semester 8"));
        list.add(new Course(null, "EC412", "Mixed Signal CMOS Integrated Circuits", "Dr. V. C. Reddy", "Semester 8"));
        list.add(new Course(null, "EC413", "Robotics, Automation & Machine Vision", "Dr. Amit Patel", "Semester 8"));
        list.add(new Course(null, "EC414", "MEMS and Nanoelectronics Technology", "Prof. Ananya Sen", "Semester 8"));
        list.add(new Course(null, "EC415", "Optoelectronic Devices and Photonics", "Dr. V. C. Reddy", "Semester 8"));
        list.add(new Course(null, "EC498", "Major Capstone Project Phase II", "Faculty Board", "Semester 8"));
        list.add(new Course(null, "EC499", "Comprehensive Technical Viva Voce", "Faculty Board", "Semester 8"));

        // ==========================================
        // 4. MECHANICAL ENGINEERING (ME) - 8 SEMESTERS x 7 SUBJECTS = 56
        // ==========================================
        // Sem 1
        list.add(new Course(null, "ME111", "Calculus & Analytical Geometry", "Dr. Satish Sharma", "Semester 1"));
        list.add(new Course(null, "ME112", "Engineering Physics for Mechanics", "Prof. Ananya Sen", "Semester 1"));
        list.add(new Course(null, "ME113", "Engineering Mechanics (Statics & Dynamics)", "Dr. K. Srinivas", "Semester 1"));
        list.add(new Course(null, "ME114", "Basic Electrical & Electronics", "Dr. Priya Nair", "Semester 1"));
        list.add(new Course(null, "ME115", "Engineering Graphics & Computer Drafting", "Prof. Rajesh Verma", "Semester 1"));
        list.add(new Course(null, "ME111L", "Workshop & Manufacturing Practice Lab", "Dr. K. Srinivas", "Semester 1"));
        list.add(new Course(null, "ME112L", "Physics Laboratory", "Prof. Ananya Sen", "Semester 1"));

        // Sem 2
        list.add(new Course(null, "ME121", "Differential Equations & Laplace Transforms", "Dr. Satish Sharma", "Semester 2"));
        list.add(new Course(null, "ME122", "Materials Science and Engineering Metallurgy", "Dr. K. Srinivas", "Semester 2"));
        list.add(new Course(null, "ME123", "Computer Programming in C", "Dr. Amit Patel", "Semester 2"));
        list.add(new Course(null, "ME124", "Basic Electronics & Instrumentation", "Dr. V. C. Reddy", "Semester 2"));
        list.add(new Course(null, "ME125", "Professional Communication & Ethics", "Prof. Sarah Johnson", "Semester 2"));
        list.add(new Course(null, "ME121L", "C Programming Laboratory", "Dr. Amit Patel", "Semester 2"));
        list.add(new Course(null, "ME122L", "Materials Testing & Metallurgy Lab", "Dr. K. Srinivas", "Semester 2"));

        // Sem 3
        list.add(new Course(null, "ME201", "Engineering Thermodynamics", "Dr. K. Srinivas", "Semester 3"));
        list.add(new Course(null, "ME202", "Strength of Materials & Mechanics of Solids", "Dr. Rajesh Gupta", "Semester 3"));
        list.add(new Course(null, "ME203", "Manufacturing Technology I (Casting & Welding)", "Prof. Manoj Kumar", "Semester 3"));
        list.add(new Course(null, "ME204", "Fluid Mechanics and Hydraulic Machinery", "Dr. K. Srinivas", "Semester 3"));
        list.add(new Course(null, "ME205", "Kinematics of Machinery & Linkages", "Prof. Manoj Kumar", "Semester 3"));
        list.add(new Course(null, "ME202L", "Strength of Materials Laboratory", "Dr. Rajesh Gupta", "Semester 3"));
        list.add(new Course(null, "ME204L", "Fluid Mechanics & Machines Lab", "Dr. K. Srinivas", "Semester 3"));

        // Sem 4
        list.add(new Course(null, "ME211", "Applied Thermodynamics & Steam Power", "Dr. K. Srinivas", "Semester 4"));
        list.add(new Course(null, "ME212", "Dynamics of Machinery & Vibrations", "Prof. Manoj Kumar", "Semester 4"));
        list.add(new Course(null, "ME213", "Manufacturing Technology II (Machining & Forming)", "Prof. Manoj Kumar", "Semester 4"));
        list.add(new Course(null, "ME214", "Mechanical Measurements and Metrology", "Dr. Rajesh Gupta", "Semester 4"));
        list.add(new Course(null, "ME215", "Fluid Power Systems & Hydraulics", "Dr. K. Srinivas", "Semester 4"));
        list.add(new Course(null, "ME211L", "Thermal Engineering Laboratory I", "Dr. K. Srinivas", "Semester 4"));
        list.add(new Course(null, "ME213L", "Machine Shop & Metrology Lab", "Prof. Manoj Kumar", "Semester 4"));

        // Sem 5
        list.add(new Course(null, "ME301", "Heat and Mass Transfer", "Dr. K. Srinivas", "Semester 5"));
        list.add(new Course(null, "ME302", "Design of Machine Elements I", "Prof. Manoj Kumar", "Semester 5"));
        list.add(new Course(null, "ME303", "Internal Combustion Engines & Gas Turbines", "Dr. K. Srinivas", "Semester 5"));
        list.add(new Course(null, "ME304", "Automobile Chassis & Powertrain Engineering", "Prof. Manoj Kumar", "Semester 5"));
        list.add(new Course(null, "ME305", "Operations Research & Optimization", "Dr. Satish Sharma", "Semester 5"));
        list.add(new Course(null, "ME301L", "Heat Transfer Laboratory", "Dr. K. Srinivas", "Semester 5"));
        list.add(new Course(null, "ME303L", "IC Engines & Automobiles Lab", "Dr. K. Srinivas", "Semester 5"));

        // Sem 6
        list.add(new Course(null, "ME311", "Computer Aided Design & Manufacturing (CAD/CAM)", "Prof. Manoj Kumar", "Semester 6"));
        list.add(new Course(null, "ME312", "Design of Transmission Systems & Gears", "Prof. Manoj Kumar", "Semester 6"));
        list.add(new Course(null, "ME313", "Finite Element Analysis (FEA)", "Dr. Rajesh Gupta", "Semester 6"));
        list.add(new Course(null, "ME314", "Refrigeration and Air Conditioning", "Dr. K. Srinivas", "Semester 6"));
        list.add(new Course(null, "ME315", "Industrial Engineering and Production Management", "Prof. Rajesh Verma", "Semester 6"));
        list.add(new Course(null, "ME311L", "CAD/CAM & CNC Machining Lab", "Prof. Manoj Kumar", "Semester 6"));
        list.add(new Course(null, "ME313L", "FEA Simulation Laboratory (ANSYS)", "Dr. Rajesh Gupta", "Semester 6"));

        // Sem 7
        list.add(new Course(null, "ME401", "Mechatronics and Industrial Automation", "Dr. Amit Patel", "Semester 7"));
        list.add(new Course(null, "ME402", "Power Plant Engineering & Energy Systems", "Dr. K. Srinivas", "Semester 7"));
        list.add(new Course(null, "ME403", "Robotics and Flexible Manufacturing Systems", "Prof. Manoj Kumar", "Semester 7"));
        list.add(new Course(null, "ME404", "Computational Fluid Dynamics (CFD)", "Dr. K. Srinivas", "Semester 7"));
        list.add(new Course(null, "ME405", "Additive Manufacturing and 3D Printing", "Prof. Manoj Kumar", "Semester 7"));
        list.add(new Course(null, "ME401L", "Mechatronics and Robotics Lab", "Dr. Amit Patel", "Semester 7"));
        list.add(new Course(null, "ME404L", "CFD & Thermal Simulation Lab", "Dr. K. Srinivas", "Semester 7"));

        // Sem 8
        list.add(new Course(null, "ME411", "Renewable Energy Technologies & Solar Thermal", "Dr. K. Srinivas", "Semester 8"));
        list.add(new Course(null, "ME412", "Total Quality Management (TQM) & Six Sigma", "Prof. Rajesh Verma", "Semester 8"));
        list.add(new Course(null, "ME413", "Advanced Tribology & Bearing Design", "Dr. Rajesh Gupta", "Semester 8"));
        list.add(new Course(null, "ME414", "Electric & Hybrid Vehicle Engineering", "Prof. Manoj Kumar", "Semester 8"));
        list.add(new Course(null, "ME415", "Advanced Composite Materials", "Dr. K. Srinivas", "Semester 8"));
        list.add(new Course(null, "ME498", "Major Capstone Project Phase II", "Faculty Board", "Semester 8"));
        list.add(new Course(null, "ME499", "Comprehensive Technical Viva Voce", "Faculty Board", "Semester 8"));

        // ==========================================
        // 5. CIVIL ENGINEERING (CIVIL) - 8 SEMESTERS x 7 SUBJECTS = 56
        // ==========================================
        // Sem 1
        list.add(new Course(null, "CE111", "Calculus & Linear Algebra", "Dr. Satish Sharma", "Semester 1"));
        list.add(new Course(null, "CE112", "Engineering Physics for Civil Engineering", "Prof. Ananya Sen", "Semester 1"));
        list.add(new Course(null, "CE113", "Engineering Mechanics & Structural Statics", "Dr. Rajesh Gupta", "Semester 1"));
        list.add(new Course(null, "CE114", "Basic Electrical & Mechanical Engineering", "Dr. K. Srinivas", "Semester 1"));
        list.add(new Course(null, "CE115", "Engineering Graphics & Building Drawing", "Prof. Suresh Reddy", "Semester 1"));
        list.add(new Course(null, "CE111L", "Civil Workshop Practice Lab", "Prof. Suresh Reddy", "Semester 1"));
        list.add(new Course(null, "CE112L", "Physics Laboratory", "Prof. Ananya Sen", "Semester 1"));

        // Sem 2
        list.add(new Course(null, "CE121", "Differential Equations & Numerical Methods", "Dr. Satish Sharma", "Semester 2"));
        list.add(new Course(null, "CE122", "Engineering Chemistry & Environmental Materials", "Prof. Meenakshi Sundaram", "Semester 2"));
        list.add(new Course(null, "CE123", "Problem Solving and Programming in C", "Dr. Amit Patel", "Semester 2"));
        list.add(new Course(null, "CE124", "Building Materials and Construction Practices", "Prof. Suresh Reddy", "Semester 2"));
        list.add(new Course(null, "CE125", "Professional Communication & Ethics", "Prof. Sarah Johnson", "Semester 2"));
        list.add(new Course(null, "CE121L", "C Programming Laboratory", "Dr. Amit Patel", "Semester 2"));
        list.add(new Course(null, "CE122L", "Building Materials Testing Lab", "Prof. Suresh Reddy", "Semester 2"));

        // Sem 3
        list.add(new Course(null, "CE201", "Strength of Materials I", "Dr. Rajesh Gupta", "Semester 3"));
        list.add(new Course(null, "CE202", "Surveying and Geomatics I", "Prof. Suresh Reddy", "Semester 3"));
        list.add(new Course(null, "CE203", "Fluid Mechanics & Open Channel Flow", "Dr. K. Srinivas", "Semester 3"));
        list.add(new Course(null, "CE204", "Engineering Geology and Rock Mechanics", "Prof. Suresh Reddy", "Semester 3"));
        list.add(new Course(null, "CE205", "Building Planning & Computer Aided Drafting (AutoCAD)", "Prof. Suresh Reddy", "Semester 3"));
        list.add(new Course(null, "CE201L", "Strength of Materials Laboratory", "Dr. Rajesh Gupta", "Semester 3"));
        list.add(new Course(null, "CE202L", "Surveying Field Practice Lab I", "Prof. Suresh Reddy", "Semester 3"));

        // Sem 4
        list.add(new Course(null, "CE211", "Strength of Materials II & Structural Mechanics", "Dr. Rajesh Gupta", "Semester 4"));
        list.add(new Course(null, "CE212", "Hydraulics and Hydraulic Machinery", "Dr. K. Srinivas", "Semester 4"));
        list.add(new Course(null, "CE213", "Structural Analysis I", "Dr. Rajesh Gupta", "Semester 4"));
        list.add(new Course(null, "CE214", "Concrete Technology & Mix Design", "Prof. Suresh Reddy", "Semester 4"));
        list.add(new Course(null, "CE215", "Water Resources Engineering & Irrigation", "Dr. K. Srinivas", "Semester 4"));
        list.add(new Course(null, "CE212L", "Fluid Mechanics & Hydraulics Lab", "Dr. K. Srinivas", "Semester 4"));
        list.add(new Course(null, "CE214L", "Concrete & Structure Testing Lab", "Prof. Suresh Reddy", "Semester 4"));

        // Sem 5
        list.add(new Course(null, "CE301", "Structural Analysis II (Matrix Methods)", "Dr. Rajesh Gupta", "Semester 5"));
        list.add(new Course(null, "CE302", "Design of Reinforced Concrete Structures (RCC)", "Prof. Suresh Reddy", "Semester 5"));
        list.add(new Course(null, "CE303", "Geotechnical Engineering I (Soil Mechanics)", "Dr. Rajesh Gupta", "Semester 5"));
        list.add(new Course(null, "CE304", "Environmental Engineering I (Water Supply)", "Prof. Meenakshi Sundaram", "Semester 5"));
        list.add(new Course(null, "CE305", "Transportation Engineering I (Highways)", "Prof. Suresh Reddy", "Semester 5"));
        list.add(new Course(null, "CE303L", "Soil Mechanics & Geotechnical Lab", "Dr. Rajesh Gupta", "Semester 5"));
        list.add(new Course(null, "CE304L", "Environmental Engineering Laboratory", "Prof. Meenakshi Sundaram", "Semester 5"));

        // Sem 6
        list.add(new Course(null, "CE311", "Design of Steel Structures (IS 800)", "Dr. Rajesh Gupta", "Semester 6"));
        list.add(new Course(null, "CE312", "Geotechnical Engineering II (Foundation Engineering)", "Dr. Rajesh Gupta", "Semester 6"));
        list.add(new Course(null, "CE313", "Environmental Engineering II (Wastewater Treatment)", "Prof. Meenakshi Sundaram", "Semester 6"));
        list.add(new Course(null, "CE314", "Highway, Railway & Airport Engineering", "Prof. Suresh Reddy", "Semester 6"));
        list.add(new Course(null, "CE315", "Hydrology, Flood Routing & Water Resources", "Dr. K. Srinivas", "Semester 6"));
        list.add(new Course(null, "CE311L", "Structural Steel Detailing & STAAD.Pro Lab", "Dr. Rajesh Gupta", "Semester 6"));
        list.add(new Course(null, "CE314L", "Highway Materials & Transportation Lab", "Prof. Suresh Reddy", "Semester 6"));

        // Sem 7
        list.add(new Course(null, "CE401", "Estimation, Costing, Valuation & Specifications", "Prof. Suresh Reddy", "Semester 7"));
        list.add(new Course(null, "CE402", "Design of Prestressed Concrete Structures", "Dr. Rajesh Gupta", "Semester 7"));
        list.add(new Course(null, "CE403", "Construction Planning, Scheduling & Management", "Prof. Rajesh Verma", "Semester 7"));
        list.add(new Course(null, "CE404", "Earthquake Resistant Design of Structures", "Dr. Rajesh Gupta", "Semester 7"));
        list.add(new Course(null, "CE405", "Remote Sensing, Photogrammetry & GIS Applications", "Prof. Suresh Reddy", "Semester 7"));
        list.add(new Course(null, "CE401L", "GIS & Quantity Surveying Software Lab", "Prof. Suresh Reddy", "Semester 7"));
        list.add(new Course(null, "CE403L", "Project Management & Primavera Lab", "Prof. Rajesh Verma", "Semester 7"));

        // Sem 8
        list.add(new Course(null, "CE411", "Bridge Engineering & Structural Design", "Dr. Rajesh Gupta", "Semester 8"));
        list.add(new Course(null, "CE412", "Ground Improvement Techniques & Geosynthetics", "Dr. Rajesh Gupta", "Semester 8"));
        list.add(new Course(null, "CE413", "Urban Transportation Planning & Traffic Engineering", "Prof. Suresh Reddy", "Semester 8"));
        list.add(new Course(null, "CE414", "Disaster Management & Structural Health Monitoring", "Prof. Meenakshi Sundaram", "Semester 8"));
        list.add(new Course(null, "CE415", "Sustainable Construction Materials & Green Buildings", "Prof. Suresh Reddy", "Semester 8"));
        list.add(new Course(null, "CE498", "Civil Engineering Capstone Project Phase II", "Faculty Board", "Semester 8"));
        list.add(new Course(null, "CE499", "Comprehensive Technical Seminar & Viva Voce", "Faculty Board", "Semester 8"));

        return list;
    }

    @GetMapping("/count")
    public long getCount() {
        return courseRepository.count();
    }

    @GetMapping
    public List<Course> getAllCourses(@RequestParam(required = false) String faculty) {
        if (faculty != null && !faculty.trim().isEmpty()) {
            String q = faculty.trim();
            Optional<User> uOpt = userRepository.findById(q);
            if (uOpt.isEmpty()) {
                uOpt = userRepository.findByEmailIgnoreCase(q);
            }
            if (uOpt.isEmpty()) {
                uOpt = userRepository.findAll().stream()
                    .filter(u -> u.getName().equalsIgnoreCase(q))
                    .findFirst();
            }

            if (uOpt.isPresent() && uOpt.get().getEnrolledCourses() != null && !uOpt.get().getEnrolledCourses().isEmpty()) {
                List<String> codes = Arrays.stream(uOpt.get().getEnrolledCourses().split(","))
                    .map(String::trim)
                    .map(String::toLowerCase)
                    .toList();
                return courseRepository.findAll().stream()
                    .filter(c -> codes.contains(c.getCode().toLowerCase()) || codes.contains(c.getTitle().toLowerCase()))
                    .toList();
            }
            return courseRepository.findByFacultyContainingIgnoreCase(q);
        }
        return courseRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Course> getCourseById(@PathVariable Long id) {
        return courseRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @Transactional
    public Course saveCourse(@RequestBody Course course) {
        Course target = course;
        if (course.getId() != null && course.getId() > 0) {
            Optional<Course> existingById = courseRepository.findById(course.getId());
            if (existingById.isPresent()) {
                Course ex = existingById.get();
                ex.setCode(course.getCode());
                ex.setTitle(course.getTitle());
                ex.setFaculty(course.getFaculty());
                ex.setSemester(course.getSemester());
                target = ex;
            }
        } else if (course.getCode() != null) {
            Optional<Course> existingByCode = courseRepository.findByCodeIgnoreCase(course.getCode().trim());
            if (existingByCode.isPresent()) {
                Course ex = existingByCode.get();
                ex.setTitle(course.getTitle());
                ex.setFaculty(course.getFaculty());
                ex.setSemester(course.getSemester());
                target = ex;
            }
        }
        Course saved = courseRepository.save(target);

        // If faculty name is assigned, update that faculty user's enrolledCourses in MySQL
        String facName = course.getFaculty();
        if (facName != null && !facName.trim().isEmpty() && !"Faculty Board".equalsIgnoreCase(facName.trim())) {
            Optional<User> facUserOpt = userRepository.findAll().stream()
                .filter(u -> "FACULTY".equalsIgnoreCase(u.getRole()) && (
                    (u.getName() != null && u.getName().equalsIgnoreCase(facName.trim())) ||
                    (u.getEmail() != null && u.getEmail().equalsIgnoreCase(facName.trim()))
                ))
                .findFirst();

            if (facUserOpt.isPresent()) {
                User fac = facUserOpt.get();
                String existing = fac.getEnrolledCourses() != null ? fac.getEnrolledCourses().trim() : "";
                Set<String> set = new LinkedHashSet<>();
                if (!existing.isEmpty()) {
                    for (String s : existing.split(",")) {
                        if (!s.trim().isEmpty()) set.add(s.trim());
                    }
                }
                set.add(saved.getCode());
                fac.setEnrolledCourses(String.join(",", set));
                userRepository.save(fac);
            }
        }
        return saved;
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<Course> updateCourse(@PathVariable Long id, @RequestBody Course course) {
        return courseRepository.findById(id)
                .map(existing -> {
                    existing.setCode(course.getCode());
                    existing.setTitle(course.getTitle());
                    existing.setFaculty(course.getFaculty());
                    existing.setSemester(course.getSemester());
                    Course saved = courseRepository.save(existing);
                    return ResponseEntity.ok(saved);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id) {
        if (courseRepository.existsById(id)) {
            courseRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
