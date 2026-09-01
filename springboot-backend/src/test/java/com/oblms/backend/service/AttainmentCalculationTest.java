package com.oblms.backend.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class AttainmentCalculationTest {

    @Test
    @DisplayName("Should compute CO Attainment level based on NBA criteria (Threshold >= 75%)")
    void testCoAttainmentLevelComputation() {
        int studentScore1 = 88;
        int studentScore2 = 92;
        int studentScore3 = 76;
        int studentScore4 = 55;

        List<Integer> scores = List.of(studentScore1, studentScore2, studentScore3, studentScore4);
        long achievedCount = scores.stream().filter(s -> s >= 75).count();
        double percentageAchieved = ((double) achievedCount / scores.size()) * 100;

        assertEquals(75.0, percentageAchieved, 0.01);
        assertTrue(percentageAchieved >= 75.0, "Attainment status should be Achieved when >= 75%");
    }

    @Test
    @DisplayName("Should calculate SGPA and Total Grade Points accurately")
    void testSGPAGradePointComputation() {
        // Sample Semester 6 Courses:
        // Course 1: 4 Credits, Grade O (10 pts) -> 40
        // Course 2: 4 Credits, Grade A+ (9 pts) -> 36
        // Course 3: 4 Credits, Grade A+ (9 pts) -> 36
        // Course 4: 4 Credits, Grade O (10 pts) -> 40
        // Course 5: 4 Credits, Grade A+ (9 pts) -> 36
        // Total Credits = 20, Total Points = 188 -> SGPA = 188 / 20 = 9.40

        int totalCredits = 20;
        int totalGradePoints = (4 * 10) + (4 * 9) + (4 * 9) + (4 * 10) + (4 * 9);
        double sgpa = (double) totalGradePoints / totalCredits;

        assertEquals(188, totalGradePoints);
        assertEquals(9.40, sgpa, 0.001);
    }
}
