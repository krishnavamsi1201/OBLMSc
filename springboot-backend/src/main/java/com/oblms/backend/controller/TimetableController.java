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
        if (slotRepository.count() < 10) {
            slotRepository.deleteAll();
            List<TimetableSlot> slots = List.of(
                // Monday (3 classes, 2 leisure - alternating)
                new TimetableSlot(null, "Monday", "09:00 AM - 10:00 AM", "Database Management Systems (CS101)", "LH-101", "Dr. Biswaranjan"),
                new TimetableSlot(null, "Monday", "10:15 AM - 11:15 AM", "☕ Leisure & Self-Study", "Reading Hall", null),
                new TimetableSlot(null, "Monday", "11:30 AM - 12:30 PM", "Data Structures & Algorithms (CS103)", "LH-204", "Prof. Priya Sharma"),
                new TimetableSlot(null, "Monday", "02:00 PM - 03:00 PM", "📚 Library & Digital Research", "Central Library", null),
                new TimetableSlot(null, "Monday", "03:15 PM - 04:15 PM", "Operating Systems (CS301)", "LH-101", "Dr. Rajesh Sen"),

                // Tuesday (3 classes, 2 leisure - alternating)
                new TimetableSlot(null, "Tuesday", "09:00 AM - 10:00 AM", "Java & OOPs Programming (CS102)", "LH-204", "Dr. Ramesh"),
                new TimetableSlot(null, "Tuesday", "10:15 AM - 11:15 AM", "☕ Leisure & Coding Club", "Innovation Hub", null),
                new TimetableSlot(null, "Tuesday", "11:30 AM - 12:30 PM", "Computer Networks (CS302)", "LH-101", "Dr. Ananya Ray"),
                new TimetableSlot(null, "Tuesday", "02:00 PM - 03:00 PM", "Database & SQL Practical Lab", "Lab-4A", "Dr. Biswaranjan"),
                new TimetableSlot(null, "Tuesday", "03:15 PM - 04:15 PM", "☕ Leisure & Peer Mentoring", "Student Lounge", null),

                // Wednesday (2 classes, 3 leisure - alternating)
                new TimetableSlot(null, "Wednesday", "09:00 AM - 10:00 AM", "Operating Systems (CS301)", "LH-101", "Dr. Rajesh Sen"),
                new TimetableSlot(null, "Wednesday", "10:15 AM - 11:15 AM", "☕ Leisure & Recess / Hobbies", "Campus Zone", null),
                new TimetableSlot(null, "Wednesday", "11:30 AM - 12:30 PM", "Database Management Systems (CS101)", "LH-305", "Dr. Biswaranjan"),
                new TimetableSlot(null, "Wednesday", "02:00 PM - 03:00 PM", "📚 Library & Technical Research", "Central Library", null),
                new TimetableSlot(null, "Wednesday", "03:15 PM - 04:15 PM", "⚽ Sports & Physical Fitness", "Sports Ground", null),

                // Thursday (3 classes, 2 leisure - alternating)
                new TimetableSlot(null, "Thursday", "09:00 AM - 10:00 AM", "Data Structures & Algorithms (CS103)", "LH-305", "Prof. Priya Sharma"),
                new TimetableSlot(null, "Thursday", "10:15 AM - 11:15 AM", "☕ Leisure & Self-Study", "Reading Hall", null),
                new TimetableSlot(null, "Thursday", "11:30 AM - 12:30 PM", "Java & OOPs Programming (CS102)", "LH-204", "Dr. Ramesh"),
                new TimetableSlot(null, "Thursday", "02:00 PM - 03:00 PM", "Java & OOPs Practical Lab", "Lab-2B", "Dr. Ramesh"),
                new TimetableSlot(null, "Thursday", "03:15 PM - 04:15 PM", "📚 Library & Project Discussion", "Central Library", null),

                // Friday (3 classes, 2 leisure - alternating)
                new TimetableSlot(null, "Friday", "09:00 AM - 10:00 AM", "Computer Networks (CS302)", "LH-305", "Dr. Ananya Ray"),
                new TimetableSlot(null, "Friday", "10:15 AM - 11:15 AM", "☕ Leisure & Faculty Consultation", "Faculty Lounge", null),
                new TimetableSlot(null, "Friday", "11:30 AM - 12:30 PM", "Cloud Computing & DevOps (CS303)", "LH-101", "Dr. Biswaranjan"),
                new TimetableSlot(null, "Friday", "02:00 PM - 03:00 PM", "⚽ Sports & Student Activity Club", "Campus Ground", null),
                new TimetableSlot(null, "Friday", "03:15 PM - 04:15 PM", "Outcome-Based Remedial & Mentoring", "LH-204", "Dr. Rajesh Sen"),

                // Saturday (2 classes, 3 leisure - alternating)
                new TimetableSlot(null, "Saturday", "09:00 AM - 10:00 AM", "Software Engineering & Agile (CS302)", "LH-204", "Prof. Priya Sharma"),
                new TimetableSlot(null, "Saturday", "10:15 AM - 11:15 AM", "☕ Leisure & Hackathon Brainstorming", "Innovation Hub", null),
                new TimetableSlot(null, "Saturday", "11:30 AM - 12:30 PM", "Industry Expert Webinar / Seminar", "Seminar Hall", "Dr. Biswaranjan"),
                new TimetableSlot(null, "Saturday", "02:00 PM - 03:00 PM", "📚 Library & Competitive Coding", "Central Library", null),
                new TimetableSlot(null, "Saturday", "03:15 PM - 04:15 PM", "☕ Leisure & Weekend Review", "Student Lounge", null)
            );
            slotRepository.saveAll(slots);
        }
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
