package com.oblms.backend.controller;

import com.oblms.backend.model.User;
import com.oblms.backend.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Allow any frontend client
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.oblms.backend.security.JwtTokenProvider jwtTokenProvider;

    @PostConstruct
    public void seedUsers() {
        // Only ensure the master Administrator account exists in MySQL
        Optional<User> adminOpt = userRepository.findAll().stream()
                .filter(u -> "ADMIN".equalsIgnoreCase(u.getRole()))
                .findFirst();

        if (adminOpt.isEmpty()) {
            User admin = new User("ADM001", "Chief Academic Administrator & Dean", "admin@gmail.com", "root", "Admin", "System Administration & Dean Office");
            admin.setEnrolledCourses("CS101,CS102,CS103,CS301,CS302");
            userRepository.save(admin);
            System.out.println("[INFO] Seeded default Administrator account (admin@gmail.com / root).");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String identifier = credentials.get("email") != null ? credentials.get("email").trim() : 
                           (credentials.get("identifier") != null ? credentials.get("identifier").trim() : "");
        String password = credentials.get("password") != null ? credentials.get("password").trim() : "";
        String requestedRole = credentials.get("role") != null ? credentials.get("role").trim() : "";

        if (identifier.isEmpty() || password.isEmpty() || requestedRole.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email/User ID, password and role are required."));
        }

        // Search by email or ID (case-insensitive)
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(identifier);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByIdIgnoreCase(identifier);
        }
        // Alias check for Ramesh Babu
        if (userOpt.isEmpty() && (identifier.equalsIgnoreCase("ramesh.babu@oblms.edu") || identifier.equalsIgnoreCase("ramesh@oblms.edu") || identifier.equalsIgnoreCase("ramesh"))) {
            userOpt = userRepository.findById("FAC001");
        }
        // Alias check for Krishnavamsi / Vamsi
        if (userOpt.isEmpty() && (identifier.equalsIgnoreCase("krishnavamsi1201@gmail.com") || identifier.equalsIgnoreCase("krishnavamsi@gmail.com") || identifier.equalsIgnoreCase("krishnavamsi") || identifier.equalsIgnoreCase("vamsi1201@gmail.com") || identifier.equalsIgnoreCase("vamsi") || identifier.equalsIgnoreCase("STU004"))) {
            userOpt = userRepository.findById("646456455");
        }

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of(
                "message", "No registered account found with Email/ID: '" + identifier + "'. Please check your credentials."
            ));
        }

        User user = userOpt.get();
        if (!user.getPassword().equals(password)) {
            return ResponseEntity.status(401).body(Map.of(
                "message", "Incorrect password. Please verify and try again."
            ));
        }

        // Strict Role Validation: Registered Role MUST match the Requested Role!
        if (!user.getRole().equalsIgnoreCase(requestedRole)) {
            return ResponseEntity.status(403).body(Map.of(
                "message", "Access Denied: This account ('" + user.getName() + "') is registered as '" + user.getRole() + "'. You cannot log in under the '" + requestedRole + "' role."
            ));
        }

        List<String> assigned = new ArrayList<>();
        if (user.getEnrolledCourses() != null && !user.getEnrolledCourses().isEmpty()) {
            for (String code : user.getEnrolledCourses().split(",")) {
                assigned.add(code.trim());
            }
        }

        // Generate HMAC-SHA256 signed JWT Bearer Token
        String token = jwtTokenProvider.generateToken(user);

        return ResponseEntity.ok(Map.of(
            "token", token,
            "tokenType", "Bearer",
            "expiresIn", 86400,
            "id", user.getId(),
            "name", user.getName(),
            "email", user.getEmail(),
            "role", user.getRole(),
            "department", user.getDepartment() != null ? user.getDepartment() : "General",
            "assignedCourses", assigned
        ));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> payload) {
        String identifier = payload.get("userId") != null ? payload.get("userId").trim() :
                           (payload.get("email") != null ? payload.get("email").trim() : 
                           (payload.get("name") != null ? payload.get("name").trim() : ""));
        String currentPassword = payload.get("currentPassword") != null ? payload.get("currentPassword").trim() : "";
        String newPassword = payload.get("newPassword") != null ? payload.get("newPassword").trim() : "";

        if (currentPassword.isEmpty() || newPassword.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Current password and new password are required."));
        }

        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "New password must be at least 6 characters long."));
        }

        Optional<User> userOpt = Optional.empty();
        if (!identifier.isEmpty()) {
            userOpt = userRepository.findByIdIgnoreCase(identifier);
            if (userOpt.isEmpty()) {
                userOpt = userRepository.findByEmailIgnoreCase(identifier);
            }
            if (userOpt.isEmpty()) {
                userOpt = userRepository.findAll().stream()
                    .filter(u -> u.getName().equalsIgnoreCase(identifier) || u.getName().toLowerCase().contains(identifier.toLowerCase()))
                    .findFirst();
            }
        }

        // If identifier wasn't found or was empty, check if only one user is matching or fallback to finding by current password
        if (userOpt.isEmpty() && !identifier.isEmpty()) {
            if (identifier.equalsIgnoreCase("vamsi") || identifier.equalsIgnoreCase("krishnavamsi") || identifier.equalsIgnoreCase("vamsi1201@gmail.com")) {
                userOpt = userRepository.findById("646456455");
            }
        }

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "User account not found."));
        }

        User user = userOpt.get();
        if (!user.getPassword().equals(currentPassword)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Current password is incorrect."));
        }

        user.setPassword(newPassword);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Password updated successfully in database! 🔒",
            "userId", user.getId(),
            "name", user.getName()
        ));
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader(value = "Authorization", required = false) String bearerToken) {
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            String token = bearerToken.substring(7);
            if (jwtTokenProvider.validateToken(token)) {
                String userId = jwtTokenProvider.getUserIdFromToken(token);
                String role = jwtTokenProvider.getRoleFromToken(token);
                return ResponseEntity.ok(Map.of("valid", true, "userId", userId, "role", role));
            }
        }
        return ResponseEntity.status(401).body(Map.of("valid", false, "message", "Invalid or expired token"));
    }
}
