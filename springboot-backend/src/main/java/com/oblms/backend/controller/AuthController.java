package com.oblms.backend.controller;

import com.oblms.backend.model.User;
import com.oblms.backend.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Allow any frontend client
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostConstruct
    public void seedUsers() {
        if (userRepository.count() == 0) {
            userRepository.save(new User("ADM001", "Administrator", "admin@oblms.edu", "root", "Admin", "System Administration"));
            
            userRepository.save(new User("FAC001", "Dr. Ramesh Babu", "Loukika310306@gmail.com", "password", "Faculty", "Computer Science"));
            userRepository.save(new User("FAC002", "Prof. Sunita Sharma", "sunita.sharma@oblms.edu", "password", "Faculty", "Information Technology"));
            userRepository.save(new User("FAC003", "Dr. Amit Patel", "amit.patel@oblms.edu", "password", "Faculty", "Electronics & Communication Engineering"));
            userRepository.save(new User("FAC004", "Dr. Priya Nair", "priya.nair@oblms.edu", "password", "Faculty", "Civil Engineering"));
            userRepository.save(new User("FAC005", "Prof. Rajesh Verma", "rajesh.verma@oblms.edu", "password", "Faculty", "Mechanical Engineering"));
            
            User stu1 = new User("STU001", "Raj Kumar", "raj.kumar@oblms.edu", "password", "Student", "Computer Science");
            stu1.setEnrolledCourses("INMCA202,DS,MES,IT305,OOP");
            userRepository.save(stu1);
            
            userRepository.save(new User("STU002", "Aarav Mehta", "aarav.mehta@oblms.edu", "password", "Student", "Computer Science & Engineering"));
            userRepository.save(new User("STU003", "Aditya Sen", "aditya.sen@oblms.edu", "password", "Student", "Information Technology"));
            
            User stu4 = new User("STU004", "Krishnavamsi", "krishnavamsi1201@gmail.com", "password", "Student", "Computer Science & Engineering");
            stu4.setEnrolledCourses("INMCA202,DS,MES,IT305,OOP");
            userRepository.save(stu4);
            userRepository.save(new User("STU005", "Ananya Iyer", "ananya.iyer@oblms.edu", "password", "Student", "Electronics & Communication Engineering"));
            userRepository.save(new User("STU006", "Rahul Dravid", "rahul.dravid@oblms.edu", "password", "Student", "Mechanical Engineering"));
            userRepository.save(new User("STU007", "Sneha Reddy", "sneha.reddy@oblms.edu", "password", "Student", "Civil Engineering"));
            userRepository.save(new User("STU008", "Vikram Malhotra", "vikram.malhotra@oblms.edu", "password", "Student", "Electrical & Electronics Engineering"));
            userRepository.save(new User("STU009", "Divya Joshi", "divya.joshi@oblms.edu", "password", "Student", "Computer Science & Engineering"));
            userRepository.save(new User("STU010", "Siddharth Roy", "siddharth.roy@oblms.edu", "password", "Student", "Information Technology"));
            System.out.println("[INFO] Seeded default OBLMS users into MySQL database.");
        } else {
            System.out.println("[INFO] Users already exist in database (" + userRepository.count() + " users). Skipping seeding to preserve custom records.");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email");
        String password = credentials.get("password");
        String requestedRole = credentials.get("role");

        if (email == null || password == null || requestedRole == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email, password and role are required."));
        }

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid email credentials."));
        }

        User user = userOpt.get();
        if (!user.getPassword().equals(password)) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid password credentials."));
        }

        if (!user.getRole().equalsIgnoreCase(requestedRole)) {
            return ResponseEntity.status(403).body(Map.of("message", "Access denied. Requested role does not match user account profile."));
        }

        return ResponseEntity.ok(Map.of(
            "id", user.getId(),
            "name", user.getName(),
            "email", user.getEmail(),
            "role", user.getRole(),
            "department", user.getDepartment() != null ? user.getDepartment() : "General"
        ));
    }
}
