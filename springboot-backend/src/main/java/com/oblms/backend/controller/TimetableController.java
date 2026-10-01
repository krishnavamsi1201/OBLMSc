package com.oblms.backend.controller;

import com.oblms.backend.model.TimetableSlot;
import com.oblms.backend.repository.TimetableSlotRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/timetable")
@CrossOrigin(origins = "*")
public class TimetableController {

    @Autowired
    private TimetableSlotRepository slotRepository;

    @PostConstruct
    public void seedTimetable() {
        slotRepository.deleteAll();
        List<TimetableSlot> slots = new ArrayList<>();

        // =========================================================================
        // 1. COMPUTER SCIENCE & ENGINEERING (CSE) - ALL CSE FACULTIES
        // (Dr. Ramesh Babu, Prof. Sunita Sharma, Dr. Amit Patel, Dr. Priya Nair, Prof. Rajesh Verma, Dr. Manoj Joshi, Dr. Kavita Menon, Dr. Prasanth Kumar, Prof. Meenakshi Iyer)
        // =========================================================================
        // Monday
        slots.add(new TimetableSlot(null, "Monday", "09:00 AM - 10:00 AM", "Database Management Systems (CS101)", "LH-101", "Dr. Ramesh Babu", "CSE", "CSE Sem 3"));
        slots.add(new TimetableSlot(null, "Monday", "10:15 AM - 11:15 AM", "Data Structures & Algorithms (CS102)", "LH-204", "Prof. Sunita Sharma", "CSE", "CSE Sem 3"));
        slots.add(new TimetableSlot(null, "Monday", "11:30 AM - 12:30 PM", "☕ Leisure & Self-Study", "Reading Hall", null, "CSE", "CSE Sem 3"));
        slots.add(new TimetableSlot(null, "Monday", "02:00 PM - 03:00 PM", "Operating Systems (CS201)", "LH-101", "Dr. Amit Patel", "CSE", "CSE Sem 3"));
        slots.add(new TimetableSlot(null, "Monday", "03:15 PM - 04:15 PM", "📚 Central Library & Digital Research", "Central Library", null, "CSE", "CSE Sem 3"));

        // Tuesday
        slots.add(new TimetableSlot(null, "Tuesday", "09:00 AM - 10:00 AM", "Object-Oriented Programming (CS103)", "LH-204", "Dr. Ramesh Babu", "CSE", "CSE Sem 3"));
        slots.add(new TimetableSlot(null, "Tuesday", "10:15 AM - 11:15 AM", "Database Management Systems (CS101)", "LH-101", "Dr. Ramesh Babu", "CSE", "CSE Sem 3"));
        slots.add(new TimetableSlot(null, "Tuesday", "11:30 AM - 12:30 PM", "☕ Leisure & Coding Club", "Innovation Hub", null, "CSE", "CSE Sem 3"));
        slots.add(new TimetableSlot(null, "Tuesday", "02:00 PM - 03:00 PM", "Database Management Systems Lab", "Lab-4A", "Dr. Ramesh Babu", "CSE", "CSE Sem 3"));
        slots.add(new TimetableSlot(null, "Tuesday", "03:15 PM - 04:15 PM", "Database Management Systems Lab", "Lab-4A", "Dr. Ramesh Babu", "CSE", "CSE Sem 3"));

        // Wednesday
        slots.add(new TimetableSlot(null, "Wednesday", "09:00 AM - 10:00 AM", "☕ Leisure & Peer Mentoring", "Campus Zone", null, "CSE", "CSE Sem 3"));
        slots.add(new TimetableSlot(null, "Wednesday", "10:15 AM - 11:15 AM", "Operating Systems (CS201)", "LH-101", "Dr. Amit Patel", "CSE", "CSE Sem 3"));
        slots.add(new TimetableSlot(null, "Wednesday", "11:30 AM - 12:30 PM", "Database Management Systems (CS101)", "LH-305", "Dr. Ramesh Babu", "CSE", "CSE Sem 3"));
        slots.add(new TimetableSlot(null, "Wednesday", "02:00 PM - 03:00 PM", "Data Structures Laboratory", "Lab-2B", "Prof. Sunita Sharma", "CSE", "CSE Sem 3"));
        slots.add(new TimetableSlot(null, "Wednesday", "03:15 PM - 04:15 PM", "Data Structures Laboratory", "Lab-2B", "Prof. Sunita Sharma", "CSE", "CSE Sem 3"));

        // Thursday
        slots.add(new TimetableSlot(null, "Thursday", "09:00 AM - 10:00 AM", "Data Structures & Algorithms (CS102)", "LH-305", "Prof. Sunita Sharma", "CSE", "CSE Sem 3"));
        slots.add(new TimetableSlot(null, "Thursday", "10:15 AM - 11:15 AM", "Computer Networks (CS301)", "LH-101", "Dr. Priya Nair", "CSE", "CSE Sem 3"));
        slots.add(new TimetableSlot(null, "Thursday", "11:30 AM - 12:30 PM", "Object-Oriented Programming (CS103)", "LH-204", "Dr. Ramesh Babu", "CSE", "CSE Sem 3"));
        slots.add(new TimetableSlot(null, "Thursday", "02:00 PM - 03:00 PM", "☕ Leisure & Project Brainstorming", "Student Lounge", null, "CSE", "CSE Sem 3"));
        slots.add(new TimetableSlot(null, "Thursday", "03:15 PM - 04:15 PM", "📚 Library & Technical Journals", "Central Library", null, "CSE", "CSE Sem 3"));

        // Friday
        slots.add(new TimetableSlot(null, "Friday", "09:00 AM - 10:00 AM", "Computer Networks (CS301)", "LH-305", "Dr. Priya Nair", "CSE", "CSE Sem 3"));
        slots.add(new TimetableSlot(null, "Friday", "10:15 AM - 11:15 AM", "☕ Leisure & Faculty Consultation", "Faculty Lounge", null, "CSE", "CSE Sem 3"));
        slots.add(new TimetableSlot(null, "Friday", "11:30 AM - 12:30 PM", "Software Engineering (CS302)", "LH-101", "Prof. Rajesh Verma", "CSE", "CSE Sem 3"));
        slots.add(new TimetableSlot(null, "Friday", "02:00 PM - 03:00 PM", "Operating Systems Lab", "OS Lab-1", "Dr. Amit Patel", "CSE", "CSE Sem 3"));
        slots.add(new TimetableSlot(null, "Friday", "03:15 PM - 04:15 PM", "⚽ Sports & Physical Fitness", "Sports Ground", null, "CSE", "CSE Sem 3"));

        // Saturday
        slots.add(new TimetableSlot(null, "Saturday", "09:00 AM - 10:00 AM", "Software Engineering (CS302)", "LH-204", "Prof. Rajesh Verma", "CSE", "CSE Sem 3"));
        slots.add(new TimetableSlot(null, "Saturday", "10:15 AM - 11:15 AM", "Object-Oriented Programming (CS103)", "LH-204", "Dr. Ramesh Babu", "CSE", "CSE Sem 3"));
        slots.add(new TimetableSlot(null, "Saturday", "11:30 AM - 12:30 PM", "☕ Leisure & Hackathon Preparation", "Innovation Hub", null, "CSE", "CSE Sem 3"));
        slots.add(new TimetableSlot(null, "Saturday", "02:00 PM - 03:00 PM", "Industry Expert Webinar / Seminar", "Seminar Hall", "Dr. Ramesh Babu", "CSE", "CSE All"));
        slots.add(new TimetableSlot(null, "Saturday", "03:15 PM - 04:15 PM", "☕ Leisure & Weekend Review", "Student Lounge", null, "CSE", "CSE Sem 3"));

        // =========================================================================
        // 2. INFORMATION TECHNOLOGY (IT) - ALL IT FACULTIES
        // (Dr. V. C. Reddy, Dr. Priya Nair, Dr. Manoj Joshi, Prof. Meenakshi Iyer)
        // =========================================================================
        // Monday
        slots.add(new TimetableSlot(null, "Monday", "09:00 AM - 10:00 AM", "Calculus & Linear Algebra (IT111)", "IT-LH-101", "Dr. Priya Nair", "IT", "IT Sem 3"));
        slots.add(new TimetableSlot(null, "Monday", "10:15 AM - 11:15 AM", "Data Structures & Algorithms (IT201)", "IT-LH-102", "Dr. V. C. Reddy", "IT", "IT Sem 3"));
        slots.add(new TimetableSlot(null, "Monday", "11:30 AM - 12:30 PM", "☕ Leisure & Self-Study", "Reading Hall", null, "IT", "IT Sem 3"));
        slots.add(new TimetableSlot(null, "Monday", "02:00 PM - 03:00 PM", "Database Management Systems (IT301)", "IT-LH-204", "Dr. Priya Nair", "IT", "IT Sem 3"));
        slots.add(new TimetableSlot(null, "Monday", "03:15 PM - 04:15 PM", "📚 Open Source Research & Library", "Central Library", null, "IT", "IT Sem 3"));

        // Tuesday
        slots.add(new TimetableSlot(null, "Tuesday", "09:00 AM - 10:00 AM", "Cloud Infrastructure & DevOps (IT401)", "IT-LH-101", "Dr. V. C. Reddy", "IT", "IT Sem 3"));
        slots.add(new TimetableSlot(null, "Tuesday", "10:15 AM - 11:15 AM", "☕ Leisure & Web Dev Club", "Innovation Hub", null, "IT", "IT Sem 3"));
        slots.add(new TimetableSlot(null, "Tuesday", "11:30 AM - 12:30 PM", "Database Management Systems (IT301)", "IT-LH-204", "Dr. Priya Nair", "IT", "IT Sem 3"));
        slots.add(new TimetableSlot(null, "Tuesday", "02:00 PM - 03:00 PM", "Database & SQL Practicum Lab", "DB Lab", "Dr. Priya Nair", "IT", "IT Sem 3"));
        slots.add(new TimetableSlot(null, "Tuesday", "03:15 PM - 04:15 PM", "Database & SQL Practicum Lab", "DB Lab", "Dr. Priya Nair", "IT", "IT Sem 3"));

        // Wednesday
        slots.add(new TimetableSlot(null, "Wednesday", "09:00 AM - 10:00 AM", "☕ Leisure & Peer Mentoring", "Student Lounge", null, "IT", "IT Sem 3"));
        slots.add(new TimetableSlot(null, "Wednesday", "10:15 AM - 11:15 AM", "Calculus & Linear Algebra (IT111)", "IT-LH-101", "Dr. Priya Nair", "IT", "IT Sem 3"));
        slots.add(new TimetableSlot(null, "Wednesday", "11:30 AM - 12:30 PM", "Data Structures & Algorithms (IT201)", "IT-LH-204", "Dr. V. C. Reddy", "IT", "IT Sem 3"));
        slots.add(new TimetableSlot(null, "Wednesday", "02:00 PM - 03:00 PM", "Data Structures Practical Lab", "IT Lab-2", "Dr. V. C. Reddy", "IT", "IT Sem 3"));
        slots.add(new TimetableSlot(null, "Wednesday", "03:15 PM - 04:15 PM", "⚽ Sports & Physical Fitness", "Campus Ground", null, "IT", "IT Sem 3"));

        // Thursday
        slots.add(new TimetableSlot(null, "Thursday", "09:00 AM - 10:00 AM", "Cloud Infrastructure & DevOps (IT401)", "IT-LH-102", "Dr. V. C. Reddy", "IT", "IT Sem 3"));
        slots.add(new TimetableSlot(null, "Thursday", "10:15 AM - 11:15 AM", "Database Management Systems (IT301)", "IT-LH-101", "Dr. Priya Nair", "IT", "IT Sem 3"));
        slots.add(new TimetableSlot(null, "Thursday", "11:30 AM - 12:30 PM", "☕ Leisure & Self-Study", "Reading Hall", null, "IT", "IT Sem 3"));
        slots.add(new TimetableSlot(null, "Thursday", "02:00 PM - 03:00 PM", "Cloud & DevOps Practical Lab", "Cloud Lab", "Dr. V. C. Reddy", "IT", "IT Sem 3"));
        slots.add(new TimetableSlot(null, "Thursday", "03:15 PM - 04:15 PM", "📚 Library & Technical Research", "Central Library", null, "IT", "IT Sem 3"));

        // Friday
        slots.add(new TimetableSlot(null, "Friday", "09:00 AM - 10:00 AM", "Data Structures & Algorithms (IT201)", "IT-LH-204", "Dr. V. C. Reddy", "IT", "IT Sem 3"));
        slots.add(new TimetableSlot(null, "Friday", "10:15 AM - 11:15 AM", "☕ Leisure & Faculty Consultation", "Faculty Lounge", null, "IT", "IT Sem 3"));
        slots.add(new TimetableSlot(null, "Friday", "11:30 AM - 12:30 PM", "Cloud Infrastructure & DevOps (IT401)", "IT-LH-102", "Dr. V. C. Reddy", "IT", "IT Sem 3"));
        slots.add(new TimetableSlot(null, "Friday", "02:00 PM - 03:00 PM", "Outcome-Based Remedial & Mentoring", "IT-LH-101", "Dr. Priya Nair", "IT", "IT Sem 3"));
        slots.add(new TimetableSlot(null, "Friday", "03:15 PM - 04:15 PM", "⚽ Sports & Recreation", "Campus Ground", null, "IT", "IT Sem 3"));

        // Saturday
        slots.add(new TimetableSlot(null, "Saturday", "09:00 AM - 10:00 AM", "Calculus & Linear Algebra (IT111)", "IT-LH-101", "Dr. Priya Nair", "IT", "IT Sem 3"));
        slots.add(new TimetableSlot(null, "Saturday", "10:15 AM - 11:15 AM", "Industry Expert Guest Lecture", "Seminar Hall", "Dr. V. C. Reddy", "IT", "IT All"));
        slots.add(new TimetableSlot(null, "Saturday", "11:30 AM - 12:30 PM", "☕ Leisure & Hackathon Brainstorming", "Innovation Hub", null, "IT", "IT Sem 3"));
        slots.add(new TimetableSlot(null, "Saturday", "02:00 PM - 03:00 PM", "📚 Library & Certification Prep", "Central Library", null, "IT", "IT Sem 3"));
        slots.add(new TimetableSlot(null, "Saturday", "03:15 PM - 04:15 PM", "☕ Leisure & Weekend Review", "Student Lounge", null, "IT", "IT Sem 3"));

        // =========================================================================
        // 3. ELECTRONICS & COMMUNICATION (ECE) - ALL ECE FACULTIES
        // (Dr. Amit Patel, Prof. Deepa Reddy, Prof. Snehalata Das)
        // =========================================================================
        // Monday
        slots.add(new TimetableSlot(null, "Monday", "09:00 AM - 10:00 AM", "Linear Algebra & Transform Calculus (EC111)", "EC-LH-101", "Dr. Amit Patel", "ECE", "ECE Sem 3"));
        slots.add(new TimetableSlot(null, "Monday", "10:15 AM - 11:15 AM", "Electronic Devices and Circuits (EC201)", "EC-LH-102", "Prof. Deepa Reddy", "ECE", "ECE Sem 3"));
        slots.add(new TimetableSlot(null, "Monday", "11:30 AM - 12:30 PM", "☕ Leisure & Self-Study", "Reading Hall", null, "ECE", "ECE Sem 3"));
        slots.add(new TimetableSlot(null, "Monday", "02:00 PM - 03:00 PM", "Digital Communication Systems (EC301)", "EC-LH-101", "Prof. Snehalata Das", "ECE", "ECE Sem 3"));
        slots.add(new TimetableSlot(null, "Monday", "03:15 PM - 04:15 PM", "📚 Central Library & Hardware Documentation", "Central Library", null, "ECE", "ECE Sem 3"));

        // Tuesday
        slots.add(new TimetableSlot(null, "Tuesday", "09:00 AM - 10:00 AM", "VLSI Design and Embedded Systems (EC401)", "EC-LH-102", "Dr. Amit Patel", "ECE", "ECE Sem 3"));
        slots.add(new TimetableSlot(null, "Tuesday", "10:15 AM - 11:15 AM", "☕ Leisure & Robotics Club", "Activity Center", null, "ECE", "ECE Sem 3"));
        slots.add(new TimetableSlot(null, "Tuesday", "11:30 AM - 12:30 PM", "Electronic Devices and Circuits (EC201)", "EC-LH-204", "Prof. Deepa Reddy", "ECE", "ECE Sem 3"));
        slots.add(new TimetableSlot(null, "Tuesday", "02:00 PM - 03:00 PM", "Electronic Devices & Circuits Lab", "Hardware Lab", "Prof. Deepa Reddy", "ECE", "ECE Sem 3"));
        slots.add(new TimetableSlot(null, "Tuesday", "03:15 PM - 04:15 PM", "Electronic Devices & Circuits Lab", "Hardware Lab", "Prof. Deepa Reddy", "ECE", "ECE Sem 3"));

        // Wednesday
        slots.add(new TimetableSlot(null, "Wednesday", "09:00 AM - 10:00 AM", "☕ Leisure & Peer Mentoring", "Student Lounge", null, "ECE", "ECE Sem 3"));
        slots.add(new TimetableSlot(null, "Wednesday", "10:15 AM - 11:15 AM", "Digital Communication Systems (EC301)", "EC-LH-101", "Prof. Snehalata Das", "ECE", "ECE Sem 3"));
        slots.add(new TimetableSlot(null, "Wednesday", "11:30 AM - 12:30 PM", "Linear Algebra & Transform Calculus (EC111)", "EC-LH-101", "Dr. Amit Patel", "ECE", "ECE Sem 3"));
        slots.add(new TimetableSlot(null, "Wednesday", "02:00 PM - 03:00 PM", "Digital Communication Laboratory", "Comm Lab", "Prof. Snehalata Das", "ECE", "ECE Sem 3"));
        slots.add(new TimetableSlot(null, "Wednesday", "03:15 PM - 04:15 PM", "⚽ Sports & Physical Activity", "Campus Ground", null, "ECE", "ECE Sem 3"));

        // Thursday
        slots.add(new TimetableSlot(null, "Thursday", "09:00 AM - 10:00 AM", "VLSI Design and Embedded Systems (EC401)", "EC-LH-204", "Dr. Amit Patel", "ECE", "ECE Sem 3"));
        slots.add(new TimetableSlot(null, "Thursday", "10:15 AM - 11:15 AM", "Electronic Devices and Circuits (EC201)", "EC-LH-204", "Prof. Deepa Reddy", "ECE", "ECE Sem 3"));
        slots.add(new TimetableSlot(null, "Thursday", "11:30 AM - 12:30 PM", "☕ Leisure & Self-Study", "Reading Hall", null, "ECE", "ECE Sem 3"));
        slots.add(new TimetableSlot(null, "Thursday", "02:00 PM - 03:00 PM", "VLSI Design & Simulation Lab", "VLSI Lab", "Dr. Amit Patel", "ECE", "ECE Sem 3"));
        slots.add(new TimetableSlot(null, "Thursday", "03:15 PM - 04:15 PM", "📚 Library & Circuit Design Cases", "Central Library", null, "ECE", "ECE Sem 3"));

        // Friday
        slots.add(new TimetableSlot(null, "Friday", "09:00 AM - 10:00 AM", "Digital Communication Systems (EC301)", "EC-LH-204", "Prof. Snehalata Das", "ECE", "ECE Sem 3"));
        slots.add(new TimetableSlot(null, "Friday", "10:15 AM - 11:15 AM", "☕ Leisure & Faculty Consultation", "Faculty Lounge", null, "ECE", "ECE Sem 3"));
        slots.add(new TimetableSlot(null, "Friday", "11:30 AM - 12:30 PM", "VLSI Design and Embedded Systems (EC401)", "EC-LH-102", "Dr. Amit Patel", "ECE", "ECE Sem 3"));
        slots.add(new TimetableSlot(null, "Friday", "02:00 PM - 03:00 PM", "Outcome-Based Remedial & Mentoring", "EC-LH-101", "Dr. Amit Patel", "ECE", "ECE Sem 3"));
        slots.add(new TimetableSlot(null, "Friday", "03:15 PM - 04:15 PM", "⚽ Sports & Fitness Hours", "Campus Ground", null, "ECE", "ECE Sem 3"));

        // Saturday
        slots.add(new TimetableSlot(null, "Saturday", "09:00 AM - 10:00 AM", "Linear Algebra & Transform Calculus (EC111)", "EC-LH-101", "Dr. Amit Patel", "ECE", "ECE Sem 3"));
        slots.add(new TimetableSlot(null, "Saturday", "10:15 AM - 11:15 AM", "Expert Guest Lecture / Webinar", "Seminar Hall", "Prof. Snehalata Das", "ECE", "ECE All"));
        slots.add(new TimetableSlot(null, "Saturday", "11:30 AM - 12:30 PM", "☕ Leisure & Project Brainstorming", "Activity Center", null, "ECE", "ECE Sem 3"));
        slots.add(new TimetableSlot(null, "Saturday", "02:00 PM - 03:00 PM", "📚 Library & GATE Prep Session", "Central Library", null, "ECE", "ECE Sem 3"));
        slots.add(new TimetableSlot(null, "Saturday", "03:15 PM - 04:15 PM", "☕ Leisure & Weekend Review", "Student Lounge", null, "ECE", "ECE Sem 3"));

        // =========================================================================
        // 4. MECHANICAL ENGINEERING (MECH) - ALL MECH FACULTIES
        // (Dr. Ananya Mishra, Prof. Arun Roy)
        // =========================================================================
        // Monday
        slots.add(new TimetableSlot(null, "Monday", "09:00 AM - 10:00 AM", "Calculus & Linear Algebra (ME111)", "ME-LH-101", "Dr. Ananya Mishra", "MECH", "Mech Sem 3"));
        slots.add(new TimetableSlot(null, "Monday", "10:15 AM - 11:15 AM", "Engineering Thermodynamics (ME201)", "ME-LH-102", "Prof. Arun Roy", "MECH", "Mech Sem 3"));
        slots.add(new TimetableSlot(null, "Monday", "11:30 AM - 12:30 PM", "☕ Leisure & Self-Study", "Reading Hall", null, "MECH", "Mech Sem 3"));
        slots.add(new TimetableSlot(null, "Monday", "02:00 PM - 03:00 PM", "Heat and Mass Transfer (ME301)", "ME-LH-204", "Dr. Ananya Mishra", "MECH", "Mech Sem 3"));
        slots.add(new TimetableSlot(null, "Monday", "03:15 PM - 04:15 PM", "📚 Central Library & Research Hours", "Central Library", null, "MECH", "Mech Sem 3"));

        // Tuesday
        slots.add(new TimetableSlot(null, "Tuesday", "09:00 AM - 10:00 AM", "Mechatronics & Automation (ME401)", "ME-LH-101", "Prof. Arun Roy", "MECH", "Mech Sem 3"));
        slots.add(new TimetableSlot(null, "Tuesday", "10:15 AM - 11:15 AM", "☕ Leisure & Innovation Club", "Activity Center", null, "MECH", "Mech Sem 3"));
        slots.add(new TimetableSlot(null, "Tuesday", "11:30 AM - 12:30 PM", "Engineering Thermodynamics (ME201)", "ME-LH-204", "Prof. Arun Roy", "MECH", "Mech Sem 3"));
        slots.add(new TimetableSlot(null, "Tuesday", "02:00 PM - 03:00 PM", "CAD/CAM Simulation & Modeling Lab", "CAD Lab", "Dr. Ananya Mishra", "MECH", "Mech Sem 3"));
        slots.add(new TimetableSlot(null, "Tuesday", "03:15 PM - 04:15 PM", "CAD/CAM Simulation & Modeling Lab", "CAD Lab", "Dr. Ananya Mishra", "MECH", "Mech Sem 3"));

        // Wednesday
        slots.add(new TimetableSlot(null, "Wednesday", "09:00 AM - 10:00 AM", "☕ Leisure & Peer Mentoring", "Campus Zone", null, "MECH", "Mech Sem 3"));
        slots.add(new TimetableSlot(null, "Wednesday", "10:15 AM - 11:15 AM", "Heat and Mass Transfer (ME301)", "ME-LH-102", "Dr. Ananya Mishra", "MECH", "Mech Sem 3"));
        slots.add(new TimetableSlot(null, "Wednesday", "11:30 AM - 12:30 PM", "Calculus & Linear Algebra (ME111)", "ME-LH-101", "Dr. Ananya Mishra", "MECH", "Mech Sem 3"));
        slots.add(new TimetableSlot(null, "Wednesday", "02:00 PM - 03:00 PM", "Thermal Engineering Laboratory", "Thermal Lab", "Prof. Arun Roy", "MECH", "Mech Sem 3"));
        slots.add(new TimetableSlot(null, "Wednesday", "03:15 PM - 04:15 PM", "⚽ Sports & Physical Fitness", "Sports Ground", null, "MECH", "Mech Sem 3"));

        // Thursday
        slots.add(new TimetableSlot(null, "Thursday", "09:00 AM - 10:00 AM", "Mechatronics & Automation (ME401)", "ME-LH-204", "Prof. Arun Roy", "MECH", "Mech Sem 3"));
        slots.add(new TimetableSlot(null, "Thursday", "10:15 AM - 11:15 AM", "Engineering Thermodynamics (ME201)", "ME-LH-101", "Prof. Arun Roy", "MECH", "Mech Sem 3"));
        slots.add(new TimetableSlot(null, "Thursday", "11:30 AM - 12:30 PM", "☕ Leisure & Self-Study", "Reading Hall", null, "MECH", "Mech Sem 3"));
        slots.add(new TimetableSlot(null, "Thursday", "02:00 PM - 03:00 PM", "Mechatronics & Robotics Lab", "Robotics Lab", "Prof. Arun Roy", "MECH", "Mech Sem 3"));
        slots.add(new TimetableSlot(null, "Thursday", "03:15 PM - 04:15 PM", "📚 Library & Design Cases", "Central Library", null, "MECH", "Mech Sem 3"));

        // Friday
        slots.add(new TimetableSlot(null, "Friday", "09:00 AM - 10:00 AM", "Calculus & Linear Algebra (ME111)", "ME-LH-204", "Dr. Ananya Mishra", "MECH", "Mech Sem 3"));
        slots.add(new TimetableSlot(null, "Friday", "10:15 AM - 11:15 AM", "☕ Leisure & Faculty Consultation", "Faculty Lounge", null, "MECH", "Mech Sem 3"));
        slots.add(new TimetableSlot(null, "Friday", "11:30 AM - 12:30 PM", "Heat and Mass Transfer (ME301)", "ME-LH-102", "Dr. Ananya Mishra", "MECH", "Mech Sem 3"));
        slots.add(new TimetableSlot(null, "Friday", "02:00 PM - 03:00 PM", "Manufacturing Workshop Practice", "Machine Shop", "Prof. Arun Roy", "MECH", "Mech Sem 3"));
        slots.add(new TimetableSlot(null, "Friday", "03:15 PM - 04:15 PM", "⚽ Sports & Physical Fitness", "Sports Ground", null, "MECH", "Mech Sem 3"));

        // Saturday
        slots.add(new TimetableSlot(null, "Saturday", "09:00 AM - 10:00 AM", "Mechatronics & Automation (ME401)", "ME-LH-101", "Prof. Arun Roy", "MECH", "Mech Sem 3"));
        slots.add(new TimetableSlot(null, "Saturday", "10:15 AM - 11:15 AM", "Mini-Project Review & Technical Viva", "CAD Lab", "Dr. Ananya Mishra", "MECH", "Mech Sem 3"));
        slots.add(new TimetableSlot(null, "Saturday", "11:30 AM - 12:30 PM", "☕ Leisure & Project Brainstorming", "Activity Center", null, "MECH", "Mech Sem 3"));
        slots.add(new TimetableSlot(null, "Saturday", "02:00 PM - 03:00 PM", "📚 Library & CAD Modeling", "Central Library", null, "MECH", "Mech Sem 3"));
        slots.add(new TimetableSlot(null, "Saturday", "03:15 PM - 04:15 PM", "☕ Leisure & Weekend Review", "Student Lounge", null, "MECH", "Mech Sem 3"));

        // =========================================================================
        // 5. CIVIL ENGINEERING (CIVIL) - ALL CIVIL FACULTIES
        // (Dr. Suresh Kumar HOD, Dr. Alok Nath)
        // =========================================================================
        // Monday
        slots.add(new TimetableSlot(null, "Monday", "09:00 AM - 10:00 AM", "Calculus & Linear Algebra (CE111)", "CE-LH-101", "Dr. Suresh Kumar", "CIVIL", "Civil Sem 3"));
        slots.add(new TimetableSlot(null, "Monday", "10:15 AM - 11:15 AM", "Strength of Materials I (CE201)", "CE-LH-102", "Dr. Alok Nath", "CIVIL", "Civil Sem 3"));
        slots.add(new TimetableSlot(null, "Monday", "11:30 AM - 12:30 PM", "☕ Leisure & Self-Study", "Reading Hall", null, "CIVIL", "Civil Sem 3"));
        slots.add(new TimetableSlot(null, "Monday", "02:00 PM - 03:00 PM", "Structural Analysis II (CE301)", "CE-LH-204", "Dr. Suresh Kumar", "CIVIL", "Civil Sem 3"));
        slots.add(new TimetableSlot(null, "Monday", "03:15 PM - 04:15 PM", "📚 Central Library & Digital Research", "Central Library", null, "CIVIL", "Civil Sem 3"));

        // Tuesday
        slots.add(new TimetableSlot(null, "Tuesday", "09:00 AM - 10:00 AM", "Estimation & Costing (CE401)", "CE-LH-101", "Dr. Alok Nath", "CIVIL", "Civil Sem 3"));
        slots.add(new TimetableSlot(null, "Tuesday", "10:15 AM - 11:15 AM", "☕ Leisure & Innovation Cell", "Campus Zone", null, "CIVIL", "Civil Sem 3"));
        slots.add(new TimetableSlot(null, "Tuesday", "11:30 AM - 12:30 PM", "Concrete Technology & Testing", "CE-LH-204", "Dr. Suresh Kumar", "CIVIL", "Civil Sem 3"));
        slots.add(new TimetableSlot(null, "Tuesday", "02:00 PM - 03:00 PM", "Civil Engineering Workshop Lab", "Survey Field", "Dr. Suresh Kumar", "CIVIL", "Civil Sem 3"));
        slots.add(new TimetableSlot(null, "Tuesday", "03:15 PM - 04:15 PM", "Civil Engineering Workshop Lab", "Survey Field", "Dr. Suresh Kumar", "CIVIL", "Civil Sem 3"));

        // Wednesday
        slots.add(new TimetableSlot(null, "Wednesday", "09:00 AM - 10:00 AM", "☕ Leisure & Recess / Hobbies", "Campus Zone", null, "CIVIL", "Civil Sem 3"));
        slots.add(new TimetableSlot(null, "Wednesday", "10:15 AM - 11:15 AM", "Strength of Materials I (CE201)", "CE-LH-102", "Dr. Alok Nath", "CIVIL", "Civil Sem 3"));
        slots.add(new TimetableSlot(null, "Wednesday", "11:30 AM - 12:30 PM", "Calculus & Linear Algebra (CE111)", "CE-LH-101", "Dr. Suresh Kumar", "CIVIL", "Civil Sem 3"));
        slots.add(new TimetableSlot(null, "Wednesday", "02:00 PM - 03:00 PM", "Strength of Materials Laboratory", "Mechanics Lab", "Dr. Alok Nath", "CIVIL", "Civil Sem 3"));
        slots.add(new TimetableSlot(null, "Wednesday", "03:15 PM - 04:15 PM", "⚽ Sports & Physical Fitness", "Sports Ground", null, "CIVIL", "Civil Sem 3"));

        // Thursday
        slots.add(new TimetableSlot(null, "Thursday", "09:00 AM - 10:00 AM", "Structural Analysis II (CE301)", "CE-LH-101", "Dr. Suresh Kumar", "CIVIL", "Civil Sem 3"));
        slots.add(new TimetableSlot(null, "Thursday", "10:15 AM - 11:15 AM", "Estimation & Costing (CE401)", "CE-LH-102", "Dr. Alok Nath", "CIVIL", "Civil Sem 3"));
        slots.add(new TimetableSlot(null, "Thursday", "11:30 AM - 12:30 PM", "☕ Leisure & Self-Study", "Reading Hall", null, "CIVIL", "Civil Sem 3"));
        slots.add(new TimetableSlot(null, "Thursday", "02:00 PM - 03:00 PM", "Building CAD Laboratory", "CE-CAD Lab", "Dr. Suresh Kumar", "CIVIL", "Civil Sem 3"));
        slots.add(new TimetableSlot(null, "Thursday", "03:15 PM - 04:15 PM", "📚 Library & Case Studies", "Central Library", null, "CIVIL", "Civil Sem 3"));

        // Friday
        slots.add(new TimetableSlot(null, "Friday", "09:00 AM - 10:00 AM", "Strength of Materials I (CE201)", "CE-LH-101", "Dr. Alok Nath", "CIVIL", "Civil Sem 3"));
        slots.add(new TimetableSlot(null, "Friday", "10:15 AM - 11:15 AM", "☕ Leisure & Faculty Consultation", "Faculty Lounge", null, "CIVIL", "Civil Sem 3"));
        slots.add(new TimetableSlot(null, "Friday", "11:30 AM - 12:30 PM", "Structural Analysis II (CE301)", "CE-LH-102", "Dr. Suresh Kumar", "CIVIL", "Civil Sem 3"));
        slots.add(new TimetableSlot(null, "Friday", "02:00 PM - 03:00 PM", "Geotechnical Material Testing Lab", "Geo Lab", "Dr. Alok Nath", "CIVIL", "Civil Sem 3"));
        slots.add(new TimetableSlot(null, "Friday", "03:15 PM - 04:15 PM", "⚽ Sports & Physical Fitness", "Sports Ground", null, "CIVIL", "Civil Sem 3"));

        // Saturday
        slots.add(new TimetableSlot(null, "Saturday", "09:00 AM - 10:00 AM", "Calculus & Linear Algebra (CE111)", "CE-LH-102", "Dr. Suresh Kumar", "CIVIL", "Civil Sem 3"));
        slots.add(new TimetableSlot(null, "Saturday", "10:15 AM - 11:15 AM", "Technical Seminar & Capstone Mentoring", "Seminar Hall", "Dr. Suresh Kumar", "CIVIL", "Civil Sem 3"));
        slots.add(new TimetableSlot(null, "Saturday", "11:30 AM - 12:30 PM", "☕ Leisure & Project Brainstorming", "Activity Center", null, "CIVIL", "Civil Sem 3"));
        slots.add(new TimetableSlot(null, "Saturday", "02:00 PM - 03:00 PM", "📚 Library & Exam Prep", "Central Library", null, "CIVIL", "Civil Sem 3"));
        slots.add(new TimetableSlot(null, "Saturday", "03:15 PM - 04:15 PM", "☕ Leisure & Weekend Review", "Student Lounge", null, "CIVIL", "Civil Sem 3"));

        slotRepository.saveAll(slots);
    }

    @GetMapping
    public List<TimetableSlot> getAllSlots() {
        return slotRepository.findAll();
    }

    @GetMapping("/department/{dept}")
    public List<TimetableSlot> getSlotsByDepartment(@PathVariable String dept) {
        return slotRepository.findAll().stream()
            .filter(s -> s.getDepartment() != null && s.getDepartment().equalsIgnoreCase(dept))
            .toList();
    }

    @GetMapping("/faculty/{facultyName}")
    public List<TimetableSlot> getSlotsByFaculty(@PathVariable String facultyName) {
        return slotRepository.findAll().stream()
            .filter(s -> s.getFacultyName() != null && s.getFacultyName().toLowerCase().contains(facultyName.toLowerCase()))
            .toList();
    }

    @PostMapping
    public TimetableSlot saveSlot(@RequestBody TimetableSlot slot) {
        return slotRepository.save(slot);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSlot(@PathVariable Long id) {
        slotRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
