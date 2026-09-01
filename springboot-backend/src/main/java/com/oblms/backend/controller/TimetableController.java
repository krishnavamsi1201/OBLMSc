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
                // Monday
                new TimetableSlot(null, "Monday", "09:00 AM - 10:00 AM", "Database Management Systems (CS101)", "LH-101"),
                new TimetableSlot(null, "Monday", "10:15 AM - 11:15 AM", "Java & OOPs Programming (CS102)", "LH-204"),
                new TimetableSlot(null, "Monday", "11:30 AM - 12:30 PM", "Data Structures & Algorithms (CS103)", "LH-101"),
                new TimetableSlot(null, "Monday", "02:00 PM - 03:00 PM", "Operating Systems (CS301)", "LH-305"),
                new TimetableSlot(null, "Monday", "03:15 PM - 04:15 PM", "Computer Networks (CS302)", "Lab-2B"),

                // Tuesday
                new TimetableSlot(null, "Tuesday", "09:00 AM - 10:00 AM", "Java & OOPs Programming (CS102)", "LH-204"),
                new TimetableSlot(null, "Tuesday", "10:15 AM - 11:15 AM", "Database Management Systems (CS101)", "LH-101"),
                new TimetableSlot(null, "Tuesday", "11:30 AM - 12:30 PM", "Operating Systems (CS301)", "LH-305"),
                new TimetableSlot(null, "Tuesday", "02:00 PM - 03:00 PM", "Database & SQL Lab Session", "Lab-4A"),
                new TimetableSlot(null, "Tuesday", "03:15 PM - 04:15 PM", "Database & SQL Lab Session", "Lab-4A"),

                // Wednesday
                new TimetableSlot(null, "Wednesday", "09:00 AM - 10:00 AM", "Data Structures & Algorithms (CS103)", "LH-101"),
                new TimetableSlot(null, "Wednesday", "10:15 AM - 11:15 AM", "Computer Networks (CS302)", "LH-305"),
                new TimetableSlot(null, "Wednesday", "11:30 AM - 12:30 PM", "Software Engineering & OBE (CS201)", "LH-204"),
                new TimetableSlot(null, "Wednesday", "02:00 PM - 03:00 PM", "Discrete Mathematics & Graph Theory", "LH-101"),
                new TimetableSlot(null, "Wednesday", "03:15 PM - 04:15 PM", "Technical Seminar & Project Mentoring", "Seminar Hall"),

                // Thursday
                new TimetableSlot(null, "Thursday", "09:00 AM - 10:00 AM", "Operating Systems (CS301)", "LH-305"),
                new TimetableSlot(null, "Thursday", "10:15 AM - 11:15 AM", "Database Management Systems (CS101)", "LH-101"),
                new TimetableSlot(null, "Thursday", "11:30 AM - 12:30 PM", "Java & OOPs Programming (CS102)", "LH-204"),
                new TimetableSlot(null, "Thursday", "02:00 PM - 03:00 PM", "Java & OOPs Practical Lab", "Lab-2B"),
                new TimetableSlot(null, "Thursday", "03:15 PM - 04:15 PM", "Java & OOPs Practical Lab", "Lab-2B"),

                // Friday
                new TimetableSlot(null, "Friday", "09:00 AM - 10:00 AM", "Computer Networks (CS302)", "LH-305"),
                new TimetableSlot(null, "Friday", "10:15 AM - 11:15 AM", "Data Structures & Algorithms (CS103)", "LH-101"),
                new TimetableSlot(null, "Friday", "11:30 AM - 12:30 PM", "Discrete Mathematics & Graph Theory", "LH-204"),
                new TimetableSlot(null, "Friday", "02:00 PM - 03:00 PM", "Cloud Computing & DevOps Workshop", "LH-101"),
                new TimetableSlot(null, "Friday", "03:15 PM - 04:15 PM", "Outcome-Based Assessment / Remedial", "LH-204"),

                // Saturday
                new TimetableSlot(null, "Saturday", "09:00 AM - 10:00 AM", "Software Engineering & Agile Methodologies", "LH-204"),
                new TimetableSlot(null, "Saturday", "10:15 AM - 11:15 AM", "Mini-Project Review & Viva Preparation", "Lab-4A"),
                new TimetableSlot(null, "Saturday", "11:30 AM - 12:30 PM", "Industry Expert Guest Lecture / Webinar", "Seminar Hall")
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
