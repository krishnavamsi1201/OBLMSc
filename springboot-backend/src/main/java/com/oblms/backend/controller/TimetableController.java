package com.oblms.backend.controller;

import com.oblms.backend.model.TimetableSlot;
import com.oblms.backend.repository.TimetableSlotRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
        List<TimetableSlot> slots = List.of(
            // Monday: 3 classes, 2 leisure (Leisure at P3, Library at P5)
            new TimetableSlot(null, "Monday", "09:00 AM - 10:00 AM", "Database Management Systems (CS101)", "LH-101", "Dr. Ramesh Babu"),
            new TimetableSlot(null, "Monday", "10:15 AM - 11:15 AM", "Data Structures & Algorithms (CS102)", "LH-204", "Prof. Sunita Sharma"),
            new TimetableSlot(null, "Monday", "11:30 AM - 12:30 PM", "☕ Leisure & Self-Study", "Reading Hall", null),
            new TimetableSlot(null, "Monday", "02:00 PM - 03:00 PM", "Operating Systems (CS201)", "LH-101", "Dr. Amit Patel"),
            new TimetableSlot(null, "Monday", "03:15 PM - 04:15 PM", "📚 Central Library & Digital Research", "Central Library", null),

            // Tuesday: 3 classes, 2 leisure (Leisure at P3, Lab at P4 & P5)
            new TimetableSlot(null, "Tuesday", "09:00 AM - 10:00 AM", "Object-Oriented Programming (CS103)", "LH-204", "Dr. Ramesh Babu"),
            new TimetableSlot(null, "Tuesday", "10:15 AM - 11:15 AM", "Database Management Systems (CS101)", "LH-101", "Dr. Ramesh Babu"),
            new TimetableSlot(null, "Tuesday", "11:30 AM - 12:30 PM", "☕ Leisure & Coding Club", "Innovation Hub", null),
            new TimetableSlot(null, "Tuesday", "02:00 PM - 03:00 PM", "Database Management Systems Lab", "Lab-4A", "Dr. Ramesh Babu"),
            new TimetableSlot(null, "Tuesday", "03:15 PM - 04:15 PM", "Database Management Systems Lab", "Lab-4A", "Dr. Ramesh Babu"),

            // Wednesday: 2 classes, 3 leisure (Leisure at P1, Lab at P4 & P5)
            new TimetableSlot(null, "Wednesday", "09:00 AM - 10:00 AM", "☕ Leisure & Peer Mentoring", "Campus Zone", null),
            new TimetableSlot(null, "Wednesday", "10:15 AM - 11:15 AM", "Operating Systems (CS201)", "LH-101", "Dr. Amit Patel"),
            new TimetableSlot(null, "Wednesday", "11:30 AM - 12:30 PM", "Database Management Systems (CS101)", "LH-305", "Dr. Ramesh Babu"),
            new TimetableSlot(null, "Wednesday", "02:00 PM - 03:00 PM", "Data Structures Laboratory", "Lab-2B", "Prof. Sunita Sharma"),
            new TimetableSlot(null, "Wednesday", "03:15 PM - 04:15 PM", "Data Structures Laboratory", "Lab-2B", "Prof. Sunita Sharma"),

            // Thursday: 3 classes, 2 leisure (Leisure at P4, Library at P5)
            new TimetableSlot(null, "Thursday", "09:00 AM - 10:00 AM", "Data Structures & Algorithms (CS102)", "LH-305", "Prof. Sunita Sharma"),
            new TimetableSlot(null, "Thursday", "10:15 AM - 11:15 AM", "Computer Networks (CS301)", "LH-101", "Dr. Priya Nair"),
            new TimetableSlot(null, "Thursday", "11:30 AM - 12:30 PM", "Object-Oriented Programming (CS103)", "LH-204", "Dr. Ramesh Babu"),
            new TimetableSlot(null, "Thursday", "02:00 PM - 03:00 PM", "☕ Leisure & Project Brainstorming", "Student Lounge", null),
            new TimetableSlot(null, "Thursday", "03:15 PM - 04:15 PM", "📚 Library & Technical Journals", "Central Library", null),

            // Friday: 3 classes, 2 leisure (Leisure at P2, Sports at P5)
            new TimetableSlot(null, "Friday", "09:00 AM - 10:00 AM", "Computer Networks (CS301)", "LH-305", "Dr. Priya Nair"),
            new TimetableSlot(null, "Friday", "10:15 AM - 11:15 AM", "☕ Leisure & Faculty Consultation", "Faculty Lounge", null),
            new TimetableSlot(null, "Friday", "11:30 AM - 12:30 PM", "Software Engineering (CS302)", "LH-101", "Prof. Rajesh Verma"),
            new TimetableSlot(null, "Friday", "02:00 PM - 03:00 PM", "Operating Systems Lab", "OS Lab-1", "Dr. Amit Patel"),
            new TimetableSlot(null, "Friday", "03:15 PM - 04:15 PM", "⚽ Sports & Physical Fitness", "Sports Ground", null),

            // Saturday: 2 classes, 3 leisure (Leisure at P3, Leisure at P5)
            new TimetableSlot(null, "Saturday", "09:00 AM - 10:00 AM", "Software Engineering (CS302)", "LH-204", "Prof. Rajesh Verma"),
            new TimetableSlot(null, "Saturday", "10:15 AM - 11:15 AM", "Object-Oriented Programming (CS103)", "LH-204", "Dr. Ramesh Babu"),
            new TimetableSlot(null, "Saturday", "11:30 AM - 12:30 PM", "☕ Leisure & Hackathon Preparation", "Innovation Hub", null),
            new TimetableSlot(null, "Saturday", "02:00 PM - 03:00 PM", "Industry Expert Webinar / Seminar", "Seminar Hall", "Dr. Ramesh Babu"),
            new TimetableSlot(null, "Saturday", "03:15 PM - 04:15 PM", "☕ Leisure & Weekend Review", "Student Lounge", null)
        );
        slotRepository.saveAll(slots);
    }

    @GetMapping
    public List<TimetableSlot> getAllSlots() {
        return slotRepository.findAll();
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
