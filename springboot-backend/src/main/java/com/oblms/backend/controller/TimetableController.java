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
        if (slotRepository.count() == 0) {
            slotRepository.save(new TimetableSlot(null, "Monday", "09:00 AM - 10:00 AM", "Outcome-Based Education", "LH-301"));
            slotRepository.save(new TimetableSlot(null, "Monday", "11:30 AM - 12:30 PM", "Database Management Systems", "LH-302"));
            slotRepository.save(new TimetableSlot(null, "Tuesday", "10:15 AM - 11:15 AM", "Machine Learning", "Lab-4"));
            slotRepository.save(new TimetableSlot(null, "Wednesday", "09:00 AM - 10:00 AM", "Outcome-Based Education", "LH-301"));
            slotRepository.save(new TimetableSlot(null, "Thursday", "02:00 PM - 03:00 PM", "Cloud Computing", "LH-101"));
            slotRepository.save(new TimetableSlot(null, "Friday", "11:30 AM - 12:30 PM", "Database Management Systems", "LH-302"));
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
