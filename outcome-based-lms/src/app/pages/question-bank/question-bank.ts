import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';

export interface QuestionItem {
  id: number;
  questionText: string;
  type: 'MCQ' | 'Short Answer' | 'Essay';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  bloomsLevel: 'L1: Remember' | 'L2: Understand' | 'L3: Apply' | 'L4: Analyze' | 'L5: Evaluate' | 'L6: Create';
  marks: number;
  subject: string;
  coMapped: string;
}

export const INITIAL_QUESTION_BANK: QuestionItem[] = [
  {
    id: 1,
    questionText: 'Define primary key, foreign key, and unique key constraints with relational schema examples.',
    type: 'Short Answer',
    difficulty: 'Easy',
    bloomsLevel: 'L1: Remember',
    marks: 5,
    subject: 'Database Management Systems',
    coMapped: 'CO1'
  },
  {
    id: 2,
    questionText: 'Explain the ACID properties of transactions and illustrate how write-ahead logging ensures durability.',
    type: 'Short Answer',
    difficulty: 'Medium',
    bloomsLevel: 'L2: Understand',
    marks: 5,
    subject: 'Database Management Systems',
    coMapped: 'CO1'
  },
  {
    id: 3,
    questionText: 'Write SQL queries using GROUP BY, HAVING, and INNER JOIN to find employees earning more than the department average.',
    type: 'Short Answer',
    difficulty: 'Medium',
    bloomsLevel: 'L3: Apply',
    marks: 8,
    subject: 'Database Management Systems',
    coMapped: 'CO2'
  },
  {
    id: 4,
    questionText: 'Given an unnormalized relation R(A,B,C,D,E) with functional dependencies {A->BC, CD->E, B->D}, analyze functional dependencies and decompose into BCNF.',
    type: 'Essay',
    difficulty: 'Hard',
    bloomsLevel: 'L4: Analyze',
    marks: 12,
    subject: 'Database Management Systems',
    coMapped: 'CO3'
  },
  {
    id: 5,
    questionText: 'Design and draw a complete Entity-Relationship (ER) diagram for a Hospital Management System including cardinalities and generalization hierarchies.',
    type: 'Essay',
    difficulty: 'Hard',
    bloomsLevel: 'L6: Create',
    marks: 15,
    subject: 'Database Management Systems',
    coMapped: 'CO5'
  },
  {
    id: 6,
    questionText: 'What is the time complexity of QuickSort in the worst-case scenario and how does Randomized QuickSort mitigate it?',
    type: 'Short Answer',
    difficulty: 'Easy',
    bloomsLevel: 'L2: Understand',
    marks: 5,
    subject: 'Data Structures & Algorithms',
    coMapped: 'CO1'
  },
  {
    id: 7,
    questionText: 'Implement an algorithm in Java/C++ to detect a cycle in a directed graph using Depth First Search (DFS).',
    type: 'Short Answer',
    difficulty: 'Medium',
    bloomsLevel: 'L3: Apply',
    marks: 10,
    subject: 'Data Structures & Algorithms',
    coMapped: 'CO2'
  },
  {
    id: 8,
    questionText: 'Compare and contrast Dijkstra algorithm and Bellman-Ford algorithm for single-source shortest paths in weighted graphs with negative edges.',
    type: 'Essay',
    difficulty: 'Hard',
    bloomsLevel: 'L4: Analyze',
    marks: 12,
    subject: 'Data Structures & Algorithms',
    coMapped: 'CO3'
  },
  {
    id: 9,
    questionText: 'Evaluate the performance trade-offs between AVL Trees and Red-Black Trees in terms of lookup, insertion, and memory overhead.',
    type: 'Essay',
    difficulty: 'Hard',
    bloomsLevel: 'L5: Evaluate',
    marks: 10,
    subject: 'Data Structures & Algorithms',
    coMapped: 'CO4'
  },
  {
    id: 10,
    questionText: 'Design a LRU (Least Recently Used) Cache data structure supporting get and put operations in O(1) time complexity.',
    type: 'Essay',
    difficulty: 'Hard',
    bloomsLevel: 'L6: Create',
    marks: 15,
    subject: 'Data Structures & Algorithms',
    coMapped: 'CO5'
  },
  {
    id: 11,
    questionText: 'Explain the difference between process and thread with state transition diagrams and PCB contents.',
    type: 'Short Answer',
    difficulty: 'Easy',
    bloomsLevel: 'L2: Understand',
    marks: 5,
    subject: 'Operating Systems',
    coMapped: 'CO1'
  },
  {
    id: 12,
    questionText: 'Calculate average waiting time and turnaround time for processes using Round Robin (quantum=2ms) and Shortest Job First (SJF).',
    type: 'Short Answer',
    difficulty: 'Medium',
    bloomsLevel: 'L3: Apply',
    marks: 10,
    subject: 'Operating Systems',
    coMapped: 'CO2'
  },
  {
    id: 13,
    questionText: 'Analyze the four necessary conditions for Deadlock and apply Banker algorithm to determine if the system is in a safe state.',
    type: 'Essay',
    difficulty: 'Hard',
    bloomsLevel: 'L4: Analyze',
    marks: 12,
    subject: 'Operating Systems',
    coMapped: 'CO3'
  },
  {
    id: 14,
    questionText: 'Design a multi-threaded reader-writer synchronization solution using mutex semaphores to prevent writer starvation.',
    type: 'Essay',
    difficulty: 'Hard',
    bloomsLevel: 'L6: Create',
    marks: 15,
    subject: 'Operating Systems',
    coMapped: 'CO5'
  },
  {
    id: 15,
    questionText: 'Describe the 7 layers of the OSI model and their corresponding protocols in TCP/IP suite.',
    type: 'Short Answer',
    difficulty: 'Easy',
    bloomsLevel: 'L2: Understand',
    marks: 5,
    subject: 'Computer Networks',
    coMapped: 'CO1'
  },
  {
    id: 16,
    questionText: 'Apply subnet masking on IP address 192.168.10.0/24 to create 4 subnets with valid host ranges and broadcast addresses.',
    type: 'Short Answer',
    difficulty: 'Medium',
    bloomsLevel: 'L3: Apply',
    marks: 8,
    subject: 'Computer Networks',
    coMapped: 'CO2'
  },
  {
    id: 17,
    questionText: 'Compare Distance Vector routing with Link State routing protocol regarding convergence time and routing loop vulnerabilities.',
    type: 'Essay',
    difficulty: 'Hard',
    bloomsLevel: 'L4: Analyze',
    marks: 12,
    subject: 'Computer Networks',
    coMapped: 'CO3'
  }
];

@Component({
  selector: 'app-question-bank',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, Navbar, Sidebar, Footer],
  templateUrl: './question-bank.html',
  styleUrls: ['./question-bank.css'],
})
export class QuestionBank implements OnInit {
  role: string | null = null;
  questions: QuestionItem[] = [];
  filteredQuestions: QuestionItem[] = [];
  isLoading = true;

  // Form bindings
  currentQuestion: QuestionItem = this.createEmptyQuestion();
  editIndex = -1;
  showQuestionForm = false;
  aiSuggestedBlooms = '';
  aiSuggestedCO = '';

  // Filters
  searchTerm = '';
  difficultyFilter = '';
  typeFilter = '';
  bloomsFilter = '';
  subjectFilter = '';
  subjectsList: string[] = [];

  // AI Exam Generator Modal
  showExamGeneratorModal = false;
  examCourse = 'Database Management Systems';
  examType = 'Midterm Exam';
  examTotalMarks = 50;
  examDuration = '2 Hours';
  generatedPaperQuestions: QuestionItem[] = [];
  showGeneratedPaperView = false;

  constructor() {
    try {
      this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
    } catch {
      this.role = null;
    }
  }

  ngOnInit(): void {
    this.loadData();
    this.applyFilters();
  }

  createEmptyQuestion(): QuestionItem {
    return {
      id: 0,
      questionText: '',
      type: 'Short Answer',
      difficulty: 'Medium',
      bloomsLevel: 'L3: Apply',
      marks: 5,
      subject: 'Database Management Systems',
      coMapped: 'CO2'
    };
  }

  private loadData(): void {
    try {
      const stored = localStorage.getItem('obslmsQuestionBank');
      if (stored) {
        this.questions = JSON.parse(stored) as QuestionItem[];
      } else {
        this.questions = [...INITIAL_QUESTION_BANK];
        this.saveQuestions();
      }

      // Gather unique subjects
      const subjects = this.questions.map(q => q.subject);
      this.subjectsList = Array.from(new Set(subjects));
    } catch {
      this.questions = [...INITIAL_QUESTION_BANK];
    }
    this.isLoading = false;
  }

  private saveQuestions(): void {
    try {
      localStorage.setItem('obslmsQuestionBank', JSON.stringify(this.questions));
    } catch {}
  }

  applyFilters(): void {
    let results = this.questions;

    if (this.difficultyFilter) {
      results = results.filter(q => q.difficulty === this.difficultyFilter);
    }

    if (this.typeFilter) {
      results = results.filter(q => q.type === this.typeFilter);
    }

    if (this.bloomsFilter) {
      results = results.filter(q => q.bloomsLevel === this.bloomsFilter);
    }

    if (this.subjectFilter) {
      results = results.filter(q => q.subject === this.subjectFilter);
    }

    if (this.searchTerm.trim()) {
      const query = this.searchTerm.toLowerCase();
      results = results.filter(q => 
        q.questionText.toLowerCase().includes(query) ||
        q.subject.toLowerCase().includes(query) ||
        q.coMapped.toLowerCase().includes(query) ||
        q.bloomsLevel.toLowerCase().includes(query)
      );
    }

    this.filteredQuestions = results;
  }

  openQuestionForm(): void {
    this.editIndex = -1;
    this.currentQuestion = this.createEmptyQuestion();
    this.aiSuggestedBlooms = '';
    this.aiSuggestedCO = '';
    this.showQuestionForm = true;
  }

  editQuestion(q: QuestionItem): void {
    this.editIndex = this.questions.findIndex(item => item.id === q.id);
    this.currentQuestion = { ...q };
    this.analyzeBloomsTaxonomy();
    this.showQuestionForm = true;
  }

  closeQuestionForm(): void {
    this.showQuestionForm = false;
    this.currentQuestion = this.createEmptyQuestion();
  }

  /**
   * Real-time AI Cognitive Level Classifier (Bloom's Taxonomy)
   */
  analyzeBloomsTaxonomy(): void {
    const text = this.currentQuestion.questionText.toLowerCase().trim();
    if (!text) {
      this.aiSuggestedBlooms = '';
      this.aiSuggestedCO = '';
      return;
    }

    if (/\b(design|formulate|construct|create|compose|synthesize|build|develop)\b/.test(text)) {
      this.currentQuestion.bloomsLevel = 'L6: Create';
      this.currentQuestion.coMapped = 'CO5';
      this.aiSuggestedBlooms = 'L6: Create (Higher Order Synthesis)';
      this.aiSuggestedCO = 'CO5';
    } else if (/\b(evaluate|judge|assess|critique|justify|defend|appraise|validate)\b/.test(text)) {
      this.currentQuestion.bloomsLevel = 'L5: Evaluate';
      this.currentQuestion.coMapped = 'CO4';
      this.aiSuggestedBlooms = 'L5: Evaluate (Critical Assessment)';
      this.aiSuggestedCO = 'CO4';
    } else if (/\b(analyze|compare|contrast|differentiate|distinguish|examine|investigate|decompose)\b/.test(text)) {
      this.currentQuestion.bloomsLevel = 'L4: Analyze';
      this.currentQuestion.coMapped = 'CO3';
      this.aiSuggestedBlooms = 'L4: Analyze (Analytical Decomposition)';
      this.aiSuggestedCO = 'CO3';
    } else if (/\b(apply|calculate|compute|solve|implement|execute|demonstrate|derive|show)\b/.test(text)) {
      this.currentQuestion.bloomsLevel = 'L3: Apply';
      this.currentQuestion.coMapped = 'CO2';
      this.aiSuggestedBlooms = 'L3: Apply (Procedural Application)';
      this.aiSuggestedCO = 'CO2';
    } else if (/\b(explain|describe|summarize|interpret|classify|discuss|outline|illustrate)\b/.test(text)) {
      this.currentQuestion.bloomsLevel = 'L2: Understand';
      this.currentQuestion.coMapped = 'CO1';
      this.aiSuggestedBlooms = 'L2: Understand (Conceptual Comprehension)';
      this.aiSuggestedCO = 'CO1';
    } else if (/\b(define|list|state|recall|name|identify|what is|mention)\b/.test(text)) {
      this.currentQuestion.bloomsLevel = 'L1: Remember';
      this.currentQuestion.coMapped = 'CO1';
      this.aiSuggestedBlooms = 'L1: Remember (Foundational Recall)';
      this.aiSuggestedCO = 'CO1';
    }
  }

  saveQuestion(): void {
    if (!this.currentQuestion.questionText.trim() || !this.currentQuestion.subject.trim()) {
      return;
    }

    if (this.editIndex >= 0) {
      this.questions[this.editIndex] = { ...this.currentQuestion };
    } else {
      const newQuestion: QuestionItem = {
        ...this.currentQuestion,
        id: Date.now()
      };
      this.questions.unshift(newQuestion);
    }

    this.saveQuestions();
    this.closeQuestionForm();
    this.applyFilters();
  }

  deleteQuestion(q: QuestionItem): void {
    if (confirm(`Delete this question from ${q.subject}?`)) {
      this.questions = this.questions.filter(item => item.id !== q.id);
      this.saveQuestions();
      this.applyFilters();
    }
  }

  // ==========================================
  // AI Balanced Exam Question Paper Generator
  // ==========================================

  openExamGenerator(): void {
    this.showExamGeneratorModal = true;
    this.showGeneratedPaperView = false;
  }

  closeExamGenerator(): void {
    this.showExamGeneratorModal = false;
    this.showGeneratedPaperView = false;
  }

  generateBalancedExamPaper(): void {
    const courseQuestions = this.questions.filter(q =>
      q.subject.toLowerCase().includes(this.examCourse.toLowerCase()) ||
      this.examCourse.toLowerCase().includes(q.subject.toLowerCase())
    );

    const pool = courseQuestions.length >= 4 ? courseQuestions : this.questions;

    // Filter by cognitive tiers
    const lowerOrder = pool.filter(q => q.bloomsLevel.startsWith('L1') || q.bloomsLevel.startsWith('L2'));
    const middleOrder = pool.filter(q => q.bloomsLevel.startsWith('L3') || q.bloomsLevel.startsWith('L4'));
    const higherOrder = pool.filter(q => q.bloomsLevel.startsWith('L5') || q.bloomsLevel.startsWith('L6'));

    const paper: QuestionItem[] = [];
    
    // Pick balanced mix
    if (lowerOrder.length > 0) paper.push(lowerOrder[0]);
    if (lowerOrder.length > 1) paper.push(lowerOrder[1]);
    if (middleOrder.length > 0) paper.push(middleOrder[0]);
    if (middleOrder.length > 1) paper.push(middleOrder[1]);
    if (higherOrder.length > 0) paper.push(higherOrder[0]);
    if (this.examTotalMarks > 50 && higherOrder.length > 1) paper.push(higherOrder[1]);

    this.generatedPaperQuestions = paper;
    this.showGeneratedPaperView = true;
  }

  printExamPaper(): void {
    window.print();
  }

  getBloomsColor(level: string): string {
    if (level.startsWith('L1')) return '#64748b'; // Gray
    if (level.startsWith('L2')) return '#0284c7'; // Blue
    if (level.startsWith('L3')) return '#059669'; // Green
    if (level.startsWith('L4')) return '#d97706'; // Amber
    if (level.startsWith('L5')) return '#dc2626'; // Red
    return '#7c3aed'; // Purple (Create)
  }
}
