package com.oblms.backend.controller;

import com.oblms.backend.model.QuestionItem;
import com.oblms.backend.repository.QuestionRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
@CrossOrigin(origins = "*")
public class QuestionController {

    @Autowired
    private QuestionRepository questionRepository;

    @PostConstruct
    public void seedDefaultQuestions() {
        if (questionRepository.count() == 0) {
            questionRepository.save(new QuestionItem(null, "Define primary key, foreign key, and unique key constraints with relational schema examples.", "Short Answer", "Easy", "L1: Remember", 5, "Database Management Systems", "CO1"));
            questionRepository.save(new QuestionItem(null, "Explain the ACID properties of transactions and illustrate how write-ahead logging ensures durability.", "Short Answer", "Medium", "L2: Understand", 5, "Database Management Systems", "CO1"));
            questionRepository.save(new QuestionItem(null, "Write SQL queries using GROUP BY, HAVING, and INNER JOIN to find employees earning more than the department average.", "Short Answer", "Medium", "L3: Apply", 8, "Database Management Systems", "CO2"));
            questionRepository.save(new QuestionItem(null, "Given an unnormalized relation R(A,B,C,D,E) with functional dependencies, analyze dependencies and decompose into BCNF.", "Essay", "Hard", "L4: Analyze", 12, "Database Management Systems", "CO3"));
            questionRepository.save(new QuestionItem(null, "Design and draw a complete Entity-Relationship (ER) diagram for a Hospital Management System with cardinalities.", "Essay", "Hard", "L6: Create", 15, "Database Management Systems", "CO5"));

            questionRepository.save(new QuestionItem(null, "What is the time complexity of QuickSort in the worst-case scenario and how does Randomized QuickSort mitigate it?", "Short Answer", "Easy", "L2: Understand", 5, "Data Structures & Algorithms", "CO1"));
            questionRepository.save(new QuestionItem(null, "Implement an algorithm in Java/C++ to detect a cycle in a directed graph using Depth First Search (DFS).", "Short Answer", "Medium", "L3: Apply", 10, "Data Structures & Algorithms", "CO2"));
            questionRepository.save(new QuestionItem(null, "Compare and contrast Dijkstra algorithm and Bellman-Ford algorithm for single-source shortest paths in weighted graphs.", "Essay", "Hard", "L4: Analyze", 12, "Data Structures & Algorithms", "CO3"));
            questionRepository.save(new QuestionItem(null, "Evaluate the performance trade-offs between AVL Trees and Red-Black Trees in terms of lookup and memory overhead.", "Essay", "Hard", "L5: Evaluate", 10, "Data Structures & Algorithms", "CO4"));
            questionRepository.save(new QuestionItem(null, "Design a LRU (Least Recently Used) Cache data structure supporting get and put operations in O(1) time complexity.", "Essay", "Hard", "L6: Create", 15, "Data Structures & Algorithms", "CO5"));

            questionRepository.save(new QuestionItem(null, "Explain the difference between process and thread with state transition diagrams and PCB contents.", "Short Answer", "Easy", "L2: Understand", 5, "Operating Systems", "CO1"));
            questionRepository.save(new QuestionItem(null, "Calculate average waiting time and turnaround time for processes using Round Robin and Shortest Job First (SJF).", "Short Answer", "Medium", "L3: Apply", 10, "Operating Systems", "CO2"));
            questionRepository.save(new QuestionItem(null, "Analyze the four necessary conditions for Deadlock and apply Banker algorithm to determine if the system is in safe state.", "Essay", "Hard", "L4: Analyze", 12, "Operating Systems", "CO3"));
            questionRepository.save(new QuestionItem(null, "Design a multi-threaded reader-writer synchronization solution using mutex semaphores to prevent writer starvation.", "Essay", "Hard", "L6: Create", 15, "Operating Systems", "CO5"));

            questionRepository.save(new QuestionItem(null, "Describe the 7 layers of the OSI model and their corresponding protocols in TCP/IP suite.", "Short Answer", "Easy", "L2: Understand", 5, "Computer Networks", "CO1"));
            questionRepository.save(new QuestionItem(null, "Apply subnet masking on IP address 192.168.10.0/24 to create 4 subnets with valid host ranges.", "Short Answer", "Medium", "L3: Apply", 8, "Computer Networks", "CO2"));
            questionRepository.save(new QuestionItem(null, "Compare Distance Vector routing with Link State routing protocol regarding convergence time and routing loops.", "Essay", "Hard", "L4: Analyze", 12, "Computer Networks", "CO3"));
            System.out.println("[INFO] Seeded Question Bank records into MySQL database.");
        }
    }

    @GetMapping
    public List<QuestionItem> getAllQuestions() {
        return questionRepository.findAll();
    }

    @GetMapping("/subject/{subject}")
    public List<QuestionItem> getQuestionsBySubject(@PathVariable String subject) {
        return questionRepository.findBySubjectIgnoreCase(subject);
    }

    @GetMapping("/blooms/{level}")
    public List<QuestionItem> getQuestionsByBloomsLevel(@PathVariable String level) {
        return questionRepository.findByBloomsLevelIgnoreCase(level);
    }

    @PostMapping
    public QuestionItem createQuestion(@RequestBody QuestionItem question) {
        return questionRepository.save(question);
    }

    @PutMapping("/{id}")
    public ResponseEntity<QuestionItem> updateQuestion(@PathVariable Long id, @RequestBody QuestionItem updated) {
        return questionRepository.findById(id)
                .map(q -> {
                    q.setQuestionText(updated.getQuestionText());
                    q.setType(updated.getType());
                    q.setDifficulty(updated.getDifficulty());
                    q.setBloomsLevel(updated.getBloomsLevel());
                    q.setMarks(updated.getMarks());
                    q.setSubject(updated.getSubject());
                    q.setCoMapped(updated.getCoMapped());
                    return ResponseEntity.ok(questionRepository.save(q));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteQuestion(@PathVariable Long id) {
        if (questionRepository.existsById(id)) {
            questionRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
