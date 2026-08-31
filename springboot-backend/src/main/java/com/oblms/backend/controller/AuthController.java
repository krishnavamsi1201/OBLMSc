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

    @PostConstruct
    public void seedUsers() {
        List<User> standardUsers = new ArrayList<>();

        // 1. Dedicated Admin Account
        standardUsers.add(new User("ADM001", "Dr. K. S. Rao (Chief Academic Administrator & Dean)", "admin@oblms.edu", "root", "Admin", "System Administration & Dean Office"));

        // 2. 15 Dedicated Faculty Accounts (FAC001 to FAC015)
        User fac1 = new User("FAC001", "Dr. Ramesh Babu", "Loukika310306@gmail.com", "password", "Faculty", "Computer Science & Engineering");
        fac1.setEnrolledCourses("Database Management Systems,Object Oriented Programming with Java");
        standardUsers.add(fac1);

        User fac2 = new User("FAC002", "Prof. Sunita Sharma", "sunita.sharma@oblms.edu", "password", "Faculty", "Computer Science & Engineering");
        fac2.setEnrolledCourses("Data Structures & Algorithms,Operating Systems");
        standardUsers.add(fac2);

        User fac3 = new User("FAC003", "Dr. Amit Patel", "amit.patel@oblms.edu", "password", "Faculty", "Electronics & Communication Engineering");
        fac3.setEnrolledCourses("Microprocessors and Embedded Systems,Logic Design Lab");
        standardUsers.add(fac3);

        User fac4 = new User("FAC004", "Dr. Priya Nair", "priya.nair@oblms.edu", "password", "Faculty", "Civil Engineering");
        fac4.setEnrolledCourses("Fluid Mechanics,Structural Engineering & Construction Management");
        standardUsers.add(fac4);

        User fac5 = new User("FAC005", "Prof. Rajesh Verma", "rajesh.verma@oblms.edu", "password", "Faculty", "Mechanical Engineering");
        fac5.setEnrolledCourses("Machine Design,Kinematics of Machinery,Auto Chassis");
        standardUsers.add(fac5);

        User fac6 = new User("FAC006", "Dr. S. K. Gupta", "sk.gupta@oblms.edu", "password", "Faculty", "Civil Engineering");
        fac6.setEnrolledCourses("Strength of Materials & Structural Engg,CAD/CAM");
        standardUsers.add(fac6);

        User fac7 = new User("FAC007", "Prof. Anjali Deshmukh", "anjali.deshmukh@oblms.edu", "password", "Faculty", "Computer Science & Engineering");
        fac7.setEnrolledCourses("Compiler Construction,Software Engineering & Agile Methodologies");
        standardUsers.add(fac7);

        User fac8 = new User("FAC008", "Dr. K. V. Prasad", "kv.prasad@oblms.edu", "password", "Faculty", "Electrical & Electronics Engineering");
        fac8.setEnrolledCourses("Power Electronics & Power Systems,Digital Signal Processing");
        standardUsers.add(fac8);

        User fac9 = new User("FAC009", "Prof. Meera Rao", "meera.rao@oblms.edu", "password", "Faculty", "Computer Science & Engineering");
        fac9.setEnrolledCourses("Object Oriented Modeling & Design,Database Lab");
        standardUsers.add(fac9);

        User fac10 = new User("FAC010", "Dr. V. C. Reddy", "vc.reddy@oblms.edu", "password", "Faculty", "Information Technology");
        fac10.setEnrolledCourses("Cloud Computing & DevOps,Linux and Shell Programming");
        standardUsers.add(fac10);

        User fac11 = new User("FAC011", "Prof. Sandeep Kumar", "sandeep.kumar@oblms.edu", "password", "Faculty", "Electronics & Communication Engineering");
        fac11.setEnrolledCourses("Switching Theory and Logic Design,Digital Systems & Logic Designs");
        standardUsers.add(fac11);

        User fac12 = new User("FAC012", "Dr. Neha Agarwal", "neha.agarwal@oblms.edu", "password", "Faculty", "Mathematics & Computing");
        fac12.setEnrolledCourses("Probability and Statistics,Engineering Mathematics II,Engineering Mathematics IV,INMCA202");
        standardUsers.add(fac12);

        User fac13 = new User("FAC013", "Prof. Deepak Joshi", "deepak.joshi@oblms.edu", "password", "Faculty", "Computer Science & Engineering");
        fac13.setEnrolledCourses("Computer Networks,High Performance Computing");
        standardUsers.add(fac13);

        User fac14 = new User("FAC014", "Dr. Kavita Menon", "kavita.menon@oblms.edu", "password", "Faculty", "Artificial Intelligence & Data Science");
        fac14.setEnrolledCourses("Artificial Intelligence,Machine Learning & Data Science,Soft Computing");
        standardUsers.add(fac14);

        User fac15 = new User("FAC015", "Prof. Arun Roy", "arun.roy@oblms.edu", "password", "Faculty", "Mechanical Engineering");
        fac15.setEnrolledCourses("Metallurgy & Materials Engineering,Strength of Materials");
        standardUsers.add(fac15);

        // 3. 30 Dedicated Student Accounts (STU001 to STU030)
        String standardCourses = "INMCA202,DS,MES,IT305,OOP";
        String[] studentNames = {
            "Raj Kumar", "Aarav Mehta", "Aditya Sen", "Krishnavamsi", "Ananya Iyer",
            "Rahul Dravid", "Sneha Reddy", "Vikram Malhotra", "Divya Joshi", "Siddharth Roy",
            "Pooja Hegde", "Nikhil Sharma", "Kavita Nair", "Manish Pandey", "Rohan Joshi",
            "Megha Sundaram", "Harish Chandra", "Swati Deshpande", "Varun Dhawan", "Shruti Hassan",
            "Karthik Aryan", "Bhavna Patel", "Tanmay Bhatt", "Ishita Dutta", "Gaurav Taneja",
            "Ritika Sen", "Abhishek Verma", "Prerna Sharma", "Sameer Khan", "Priya Prakash"
        };

        String[] departments = {
            "Computer Science & Engineering", "Information Technology", "Electronics & Communication",
            "Mechanical Engineering", "Civil Engineering"
        };

        for (int i = 1; i <= 30; i++) {
            String stuId = String.format("STU%03d", i);
            String name = studentNames[i - 1];
            String email = (i == 4) ? "krishnavamsi1201@gmail.com" : (name.toLowerCase().replace(" ", ".") + "@oblms.edu");
            String dept = departments[(i - 1) % departments.length];

            User stu = new User(stuId, name, email, "password", "Student", dept);
            stu.setEnrolledCourses(standardCourses);
            standardUsers.add(stu);
        }

        // Upsert all standard users safely and overwrite assigned courses to keep databases synced
        for (User u : standardUsers) {
            Optional<User> existing = userRepository.findById(u.getId());
            if (existing.isPresent()) {
                User dbUser = existing.get();
                dbUser.setEnrolledCourses(u.getEnrolledCourses());
                dbUser.setDepartment(u.getDepartment());
                dbUser.setName(u.getName());
                userRepository.save(dbUser);
            } else {
                userRepository.save(u);
            }
        }
        System.out.println("[INFO] Verified and seeded 1 Admin, 15 Faculty, and 30 Student accounts in MySQL database (Total users: " + userRepository.count() + ").");
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

        return ResponseEntity.ok(Map.of(
            "id", user.getId(),
            "name", user.getName(),
            "email", user.getEmail(),
            "role", user.getRole(),
            "department", user.getDepartment() != null ? user.getDepartment() : "General",
            "assignedCourses", assigned
        ));
    }
}
