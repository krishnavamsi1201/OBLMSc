package com.oblms.backend.controller;

import com.oblms.backend.service.AiChatbotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chatbot")
@CrossOrigin(origins = "*")
public class ChatbotController {

    @Autowired
    private AiChatbotService aiChatbotService;

    @PostMapping("/query")
    public ResponseEntity<Map<String, Object>> queryChatbot(@RequestBody Map<String, Object> payload) {
        String message = payload.getOrDefault("message", "").toString();
        String userName = payload.getOrDefault("userName", "Student").toString();
        String userRole = payload.getOrDefault("userRole", "student").toString();
        String userDept = payload.getOrDefault("userDept", "Computer Science & Engineering").toString();

        Map<String, Object> response = aiChatbotService.generateAiResponse(message, userName, userRole, userDept);
        return ResponseEntity.ok(response);
    }
}
