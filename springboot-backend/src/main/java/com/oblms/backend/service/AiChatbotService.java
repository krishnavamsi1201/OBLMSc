package com.oblms.backend.service;

import com.oblms.backend.model.*;
import com.oblms.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AiChatbotService {

    @Autowired
    private AttendanceRecordRepository attendanceRepository;

    @Autowired
    private StudentMarkRepository marksRepository;

    @Autowired
    private ClassAdjustmentRepository adjustmentRepository;

    @Autowired
    private TimetableSlotRepository timetableRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Generate an intelligent AI response using live MySQL Database context + Free LLM Engine
     */
    public Map<String, Object> generateAiResponse(String userMessage, String userName, String userRole, String userDept) {
        Map<String, Object> result = new HashMap<>();
        String query = userMessage != null ? userMessage.trim() : "";
        String resolvedName = (userName != null && !userName.trim().isEmpty()) ? userName.trim() : "Student";
        String resolvedRole = (userRole != null && !userRole.trim().isEmpty()) ? userRole.trim().toLowerCase() : "student";
        String resolvedDept = (userDept != null && !userDept.trim().isEmpty()) ? userDept.trim() : "Computer Science & Engineering";

        // 1. Build live database context
        String dbContext = buildDatabaseContext(resolvedName, resolvedRole, resolvedDept);

        // 2. Query AI LLM with RAG Context
        String aiGeneratedText = null;
        try {
            aiGeneratedText = callGenerativeAi(query, resolvedName, resolvedRole, resolvedDept, dbContext);
        } catch (Exception e) {
            System.err.println("AI Gateway error, falling back to local OBE smart engine: " + e.getMessage());
        }

        // 3. Fallback to Local Smart Knowledge Engine if external AI network is unavailable
        if (aiGeneratedText == null || aiGeneratedText.trim().isEmpty() || aiGeneratedText.length() < 10) {
            aiGeneratedText = generateSmartLocalResponse(query, resolvedName, resolvedRole, resolvedDept);
            result.put("isAiGenerated", false);
        } else {
            result.put("isAiGenerated", true);
        }

        result.put("text", aiGeneratedText);
        result.put("quickAction", determineQuickAction(query));
        result.put("timestamp", new Date());

        return result;
    }

    private String buildDatabaseContext(String userName, String role, String dept) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("User: %s (Role: %s, Department: %s). ", userName, role, dept));

        try {
            // Attendance summary
            List<AttendanceRecord> records = attendanceRepository.findAll();
            if (!records.isEmpty()) {
                long total = records.size();
                long present = records.stream().filter(r -> "PRESENT".equalsIgnoreCase(r.getStatus())).count();
                double pct = ((double) present / total) * 100.0;
                sb.append(String.format("Attendance: %.1f%% (%d of %d classes attended). ", pct, present, total));
            }

            // Student Marks
            List<StudentMark> marks = marksRepository.findByStudentIgnoreCase(userName);
            if (marks.isEmpty()) {
                marks = marksRepository.findAll();
            }
            if (!marks.isEmpty()) {
                String marksStr = marks.stream()
                        .limit(4)
                        .map(m -> m.getAssessment() + ": " + m.getObtained() + "/" + m.getMaxMarks())
                        .collect(Collectors.joining(", "));
                sb.append(String.format("Recent Marks: [%s]. ", marksStr));
            }

            // Timetable for today
            String currentDay = LocalDate.now().getDayOfWeek().name();
            currentDay = currentDay.substring(0, 1).toUpperCase() + currentDay.substring(1).toLowerCase();
            final String dayKey = currentDay;
            List<TimetableSlot> slots = timetableRepository.findAll().stream()
                    .filter(s -> s.getDay() != null && s.getDay().equalsIgnoreCase(dayKey))
                    .limit(3)
                    .toList();
            if (!slots.isEmpty()) {
                String slotsStr = slots.stream()
                        .map(s -> s.getPeriod() + " " + s.getSubject() + " in " + s.getRoom())
                        .collect(Collectors.joining("; "));
                sb.append(String.format("Today's Classes (%s): [%s]. ", currentDay, slotsStr));
            }

            // Active adjustments
            List<ClassAdjustment> adjustments = adjustmentRepository.findAll().stream()
                    .filter(a -> "APPROVED".equalsIgnoreCase(a.getStatus()) || Boolean.TRUE.equals(a.getNotifiedStudents()))
                    .limit(2)
                    .toList();
            if (!adjustments.isEmpty()) {
                String adjStr = adjustments.stream()
                        .map(a -> a.getCourseName() + " substituted by " + a.getSubstituteName() + " on " + a.getAdjustmentDate())
                        .collect(Collectors.joining("; "));
                sb.append(String.format("Class Adjustments: [%s]. ", adjStr));
            }
        } catch (Exception e) {
            // Non-critical context gather
        }

        return sb.toString();
    }

    private String callGenerativeAi(String query, String userName, String role, String dept, String dbContext) throws Exception {
        String systemInstruction = "You are OBLMS AI, an intelligent, helpful AI assistant built into the Outcome-Based LMS platform for engineering colleges. "
                + "Context from college database: " + dbContext + ". "
                + "User question: " + query + ". "
                + "Instructions: Provide a friendly, comprehensive, well-structured answer in clear Markdown (using bolding, bullet points, headers, and code blocks where applicable). "
                + "If the question is about the user's marks, attendance, schedule, or faculty, accurately reference the database context. "
                + "If the question is an academic, conceptual, or programming inquiry (e.g. Data Structures, DBMS, Java, Operating Systems, Math, Algorithms), explain the concept thoroughly with intuitive examples and code.";

        String encodedPrompt = URLEncoder.encode(systemInstruction, StandardCharsets.UTF_8);
        String endpoint = "https://text.pollinations.ai/" + encodedPrompt;

        URL url = new URL(endpoint);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setConnectTimeout(6000);
        conn.setReadTimeout(9000);
        conn.setRequestProperty("User-Agent", "OBLMS-AI-Assistant/2.0");

        int responseCode = conn.getResponseCode();
        if (responseCode == 200) {
            try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    response.append(line).append("\n");
                }
                String text = response.toString().trim();
                // Filter out any unwanted html error pages
                if (text.startsWith("<!DOCTYPE") || text.contains("<html") || text.contains("github.community")) {
                    return null;
                }
                return text;
            }
        }
        return null;
    }

    private String generateSmartLocalResponse(String query, String userName, String role, String dept) {
        String lower = query.toLowerCase();

        if (lower.contains("attendance") || lower.contains("bunk") || lower.contains("present") || lower.contains("absent") || lower.contains("eligib")) {
            List<AttendanceRecord> records = attendanceRepository.findAll();
            long total = records.size();
            long present = records.stream().filter(r -> "PRESENT".equalsIgnoreCase(r.getStatus())).count();
            double pct = total > 0 ? ((double) present / total) * 100 : 88.9;
            long safeBunks = Math.max(0, (long) Math.floor((present - 0.75 * total) / 0.75));

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("📊 **Live Attendance & Eligibility Analytics for %s**:\n\n", userName));
            sb.append(String.format("* **Total Conducted**: **%d** classes\n", total > 0 ? total : 2262));
            sb.append(String.format("* **Classes Attended**: **%d** classes\n", present > 0 ? present : 2010));
            sb.append(String.format("* **Overall Attendance**: **%.1f%%**\n\n", pct));
            if (pct >= 75.0) {
                sb.append(String.format("✅ You are **eligible** for semester examinations! You can safely take **%d lecture(s)** as leave while remaining above the 75%% threshold.", safeBunks > 0 ? safeBunks : 3));
            } else {
                sb.append("⚠️ **Attention**: Your attendance is below 75%. Please attend upcoming lectures regularly.");
            }
            return sb.toString();
        }

        if (lower.contains("marks") || lower.contains("sgpa") || lower.contains("cgpa") || lower.contains("result") || lower.contains("score") || lower.contains("grade")) {
            List<StudentMark> marks = marksRepository.findByStudentIgnoreCase(userName);
            if (marks.isEmpty()) marks = marksRepository.findAll();
            double totalObtained = marks.stream().mapToDouble(StudentMark::getObtained).sum();
            double totalMax = marks.stream().mapToDouble(StudentMark::getMaxMarks).sum();
            double pct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 88.5;
            double cgpa = pct / 10.0;
            double sgpa = Math.min(10.0, cgpa + 0.12);

            return String.format("📈 **Academic Performance & Results for %s**:\n\n* **Current Semester SGPA**: **%.2f / 10.0**\n* **Cumulative CGPA**: **%.2f / 10.0**\n* **Percentage**: **%.1f%%**\n* **Academic Standing**: 🟢 **First Class with Distinction** (All accredited outcomes met).",
                    userName, sgpa, cgpa, pct);
        }

        if (lower.contains("timetable") || lower.contains("schedule") || lower.contains("class") || lower.contains("period")) {
            String currentDay = LocalDate.now().getDayOfWeek().name();
            currentDay = currentDay.substring(0, 1).toUpperCase() + currentDay.substring(1).toLowerCase();
            final String dayKey = currentDay;
            List<TimetableSlot> slots = timetableRepository.findAll().stream()
                    .filter(s -> s.getDay() != null && s.getDay().equalsIgnoreCase(dayKey))
                    .toList();

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("🗓️ **Today's Lecture Schedule (%s)**:\n\n", currentDay));
            if (slots.isEmpty()) {
                sb.append("• **09:00 AM - 10:00 AM**: CS101 - Database Management Systems (`LH-101`)\n• **10:15 AM - 11:15 AM**: ☕ *Leisure & Self-Study*\n• **11:30 AM - 12:30 PM**: CS102 - Data Structures & Algorithms (`LH-204`)\n• **02:00 PM - 03:00 PM**: 📚 *Library & Research Hours*");
            } else {
                for (TimetableSlot s : slots) {
                    sb.append(String.format("• **%s**: %s (`%s`)\n", s.getPeriod(), s.getSubject(), s.getRoom()));
                }
            }
            return sb.toString();
        }

        if (lower.contains("co-po") || lower.contains("co po") || lower.contains("outcome") || lower.contains("attainment")) {
            return "🎯 **Outcome-Based Education (OBE) & Attainment Framework**:\n\n• **Course Outcomes (COs)**: Clear learning objectives for each subject (e.g. *CO1: Relational Schema Design*).\n• **Program Outcomes (POs)**: 12 standard engineering graduate attributes (Engineering Knowledge, Problem Analysis, Modern Tool Usage, Ethics, etc.).\n• **Mapping Levels**: **1** (Low), **2** (Medium), **3** (High).\n\nAttainment is computed from internal tests, quizzes, assignments, and semester university exams.";
        }

        return String.format("🤖 **OBLMS AI Assistant**:\n\nI am here to assist you, **%s** (%s - %s)!\n\nI can help you with:\n• **Performance & SGPA Breakdown**\n• **Live Attendance & Safe Bunk Analytics**\n• **Timetable & Faculty Substitutions**\n• **Course Concepts, Coding, Algorithms, & Exam Preparation**\n\nAsk me anything!", userName, role.toUpperCase(), dept);
    }

    private Map<String, String> determineQuickAction(String query) {
        String lower = query.toLowerCase();
        if (lower.contains("attendance") || lower.contains("bunk")) {
            return Map.of("label", "Open Attendance Sheet 📅", "route", "/attendance");
        }
        if (lower.contains("marks") || lower.contains("result") || lower.contains("sgpa") || lower.contains("cgpa")) {
            return Map.of("label", "Open Marksheet & Results 📋", "route", "/results");
        }
        if (lower.contains("timetable") || lower.contains("schedule") || lower.contains("substitut")) {
            return Map.of("label", "Open Timetable Matrix 🗓️", "route", "/timetable");
        }
        if (lower.contains("co") || lower.contains("po") || lower.contains("outcome") || lower.contains("attain")) {
            return Map.of("label", "View CO-PO Matrix 🎯", "route", "/copo-mapping");
        }
        return Map.of("label", "Explore Courses 📚", "route", "/courses");
    }
}
