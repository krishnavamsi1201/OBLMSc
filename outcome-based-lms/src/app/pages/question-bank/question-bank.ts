import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { ToastService } from '../../shared/services/toast.service';

export interface QuestionItem {
  id?: number;
  questionText: string;
  type: 'MCQ' | 'Short Answer' | 'Essay';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  bloomsLevel: 'L1: Remember' | 'L2: Understand' | 'L3: Apply' | 'L4: Analyze' | 'L5: Evaluate' | 'L6: Create';
  marks: number;
  subject: string;
  coMapped: string;
}

@Component({
  selector: 'app-question-bank',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, Navbar, Sidebar, Footer],
  templateUrl: './question-bank.html',
  styleUrls: ['./question-bank.css'],
})
export class QuestionBank implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  role: string | null = null;
  questions: QuestionItem[] = [];
  filteredQuestions: QuestionItem[] = [];
  isLoading = true;

  studentName = 'Student';
  studentEmail = '';
  studentPhoto: string | null = null;
  studentRoll = 'CUTM2026CSE042';
  studentDept = 'Computer Science & Engineering';

  appearance = {
    theme: 'light',
    colorScheme: 'blue',
    layout: 'comfortable',
    showSidebar: true,
    fontSize: 'medium'
  };

  themeStyles: { [key: string]: string } = {};

  studentNavGroups = [
    {
      title: 'ACADEMICS',
      items: [
        { label: 'Student Dashboard', path: '/students', icon: '🏠' },
        { label: 'Enrolled Courses', path: '/courses', icon: '📚' },
        { label: 'Subject List', path: '/subjects', icon: '📖' },
        { label: 'Weekly Timetable', path: '/timetable', icon: '📆' }
      ]
    },
    {
      title: 'OBE & OUTCOMES',
      items: [
        { label: 'Course Outcomes (CO)', path: '/course-outcomes', icon: '🎯' },
        { label: 'Program Outcomes (PO)', path: '/program-outcomes', icon: '🎯' },
        { label: 'CO-PO Mapping', path: '/copo-mapping', icon: '🔗' },
        { label: 'CO Attainment', path: '/co-attainment', icon: '📊' },
        { label: 'PO Attainment', path: '/po-attainment', icon: '📈' }
      ]
    },
    {
      title: 'EXAMINATIONS & MARKS',
      items: [
        { label: 'Upcoming Exams', path: '/assessments', icon: '📝' },
        { label: 'Attendance %', path: '/attendance', icon: '📅' },
        { label: 'Marks Summary', path: '/performance', icon: '📈' },
        { label: 'Semester Results', path: '/results', icon: '📄' }
      ]
    },
    {
      title: 'STUDENT SERVICES',
      items: [
        { label: 'Feedback Form', path: '/feedback', icon: '💬' },
        { label: 'File Grievance', path: '/grievance', icon: '📩' },
        { label: 'Notifications', path: '/notifications', icon: '🔔' },
        { label: 'Student Details', path: '/profile', icon: '👤' }
      ]
    }
  ];

  groupedSubjectQuestions: Array<{ subject: string; questions: QuestionItem[] }> = [];
  collapsedSubjectGroups: { [subject: string]: boolean } = {};

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
  examType = 'Semester End Examination';
  examTotalMarks = 50;
  examDuration = '3 Hours';
  generatedPaperQuestions: QuestionItem[] = [];
  showGeneratedPaperView = false;

  constructor() {
    try {
      this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
      this.studentName = localStorage.getItem('userName') || 'Student';
      this.studentEmail = localStorage.getItem('userEmail') || 'student@centurionuniv.edu.in';
      this.studentPhoto = localStorage.getItem('userProfilePicture') || null;
      this.studentDept = localStorage.getItem('userDepartment') || 'Computer Science & Engineering';
      this.studentRoll = localStorage.getItem('userRoll') || 'CUTM2026CSE042';
    } catch {
      this.role = null;
    }
    this.loadAppearance();
  }

  ngOnInit(): void {
    this.loadData();
  }

  createEmptyQuestion(): QuestionItem {
    return {
      questionText: '',
      type: 'Short Answer',
      difficulty: 'Medium',
      bloomsLevel: 'L3: Apply',
      marks: 5,
      subject: 'Database Management Systems',
      coMapped: 'CO2'
    };
  }

  loadData(): void {
    this.isLoading = true;
    this.http.get<QuestionItem[]>('http://localhost:8080/api/questions').subscribe({
      next: (data) => {
        let list = data;
        if (this.role === 'faculty') {
          let assigned: string[] = [];
          try {
            const stored = localStorage.getItem('userAssignedCourses');
            if (stored) assigned = JSON.parse(stored);
          } catch {}
          if (assigned.length > 0) {
            list = data.filter(q => 
              assigned.includes(q.subject) || 
              assigned.some(a => q.subject && q.subject.toLowerCase().includes(a.toLowerCase()))
            );
          }
        }
        this.questions = list;
        const subjects = list.map(q => q.subject);
        this.subjectsList = Array.from(new Set(subjects));
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.error('Failed to load questions from database.');
        this.isLoading = false;
      }
    });
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
    this.groupQuestionsBySubject();
  }

  openQuestionForm(): void {
    this.editIndex = -1;
    this.currentQuestion = this.createEmptyQuestion();
    this.aiSuggestedBlooms = '';
    this.aiSuggestedCO = '';
    this.showQuestionForm = true;
  }

  editQuestion(q: QuestionItem): void {
    this.currentQuestion = { ...q };
    this.analyzeBloomsTaxonomy();
    this.showQuestionForm = true;
  }

  closeQuestionForm(): void {
    this.showQuestionForm = false;
    this.currentQuestion = this.createEmptyQuestion();
  }

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

    if (this.currentQuestion.id) {
      // Update existing
      this.http.put<QuestionItem>(`http://localhost:8080/api/questions/${this.currentQuestion.id}`, this.currentQuestion).subscribe({
        next: () => {
          this.toast.success('Question updated in database successfully.');
          this.loadData();
          this.closeQuestionForm();
        },
        error: () => {
          this.toast.error('Failed to update question in database.');
        }
      });
    } else {
      // Create new
      this.http.post<QuestionItem>('http://localhost:8080/api/questions', this.currentQuestion).subscribe({
        next: () => {
          this.toast.success('New question saved to MySQL database.');
          this.loadData();
          this.closeQuestionForm();
        },
        error: () => {
          this.toast.error('Failed to save question.');
        }
      });
    }
  }

  deleteQuestion(q: QuestionItem): void {
    if (confirm(`Delete this question from ${q.subject} permanently from MySQL?`)) {
      this.http.delete(`http://localhost:8080/api/questions/${q.id}`).subscribe({
        next: () => {
          this.toast.info('Question removed from database.');
          this.loadData();
        },
        error: () => {
          this.toast.error('Failed to delete question.');
        }
      });
    }
  }

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

  loadAppearance(): void {
    try {
      const stored = localStorage.getItem('oblmsAppearance');
      if (stored) {
        this.appearance = JSON.parse(stored);
      }
    } catch {}
    this.applyThemeStyleMapping();
  }

  private applyThemeStyleMapping(): void {
    const isDark = this.appearance.theme === 'dark' || 
      (this.appearance.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const bg = isDark ? '#0f172a' : 'rgba(240, 249, 255, 0.92)';
    const cardBg = isDark ? '#1e293b' : 'rgba(255, 255, 255, 0.98)';
    const text = isDark ? '#f8fafc' : '#1e293b';
    const textSecondary = isDark ? '#94a3b8' : '#64748b';
    const border = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(74, 140, 234, 0.16)';
    const sidebarBg = isDark ? '#1e293b' : 'rgba(255, 255, 255, 0.98)';

    let primary = '#1976d2';
    let primaryRgb = '25, 118, 210';
    let heroBg = 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)';

    switch (this.appearance.colorScheme) {
      case 'purple':
        primary = '#8b5cf6';
        primaryRgb = '139, 92, 246';
        heroBg = 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 50%, #7c3aed 100%)';
        break;
      case 'green':
        primary = '#10b981';
        primaryRgb = '16, 185, 129';
        heroBg = 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #10b981 100%)';
        break;
      case 'red':
        primary = '#ef4444';
        primaryRgb = '239, 68, 68';
        heroBg = 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #ef4444 100%)';
        break;
      case 'orange':
        primary = '#f97316';
        primaryRgb = '249, 115, 22';
        heroBg = 'linear-gradient(135deg, #7c2d12 0%, #9a3412 50%, #f97316 100%)';
        break;
      default:
        primary = '#1976d2';
        primaryRgb = '25, 118, 210';
        heroBg = 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)';
    }

    this.themeStyles = {
      '--student-primary': primary,
      '--student-primary-rgb': primaryRgb,
      '--student-hero-bg': heroBg,
      '--student-bg': bg,
      '--student-card-bg': cardBg,
      '--student-text': text,
      '--student-text-secondary': textSecondary,
      '--student-border': border,
      '--student-sidebar-bg': sidebarBg
    };
  }

  logout(): void {
    try {
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
    } catch {}
    this.router.navigate(['/login']);
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  groupQuestionsBySubject(): void {
    const groups = new Map<string, QuestionItem[]>();
    this.filteredQuestions.forEach(q => {
      const sub = q.subject || 'General';
      if (!groups.has(sub)) {
        groups.set(sub, []);
      }
      groups.get(sub)!.push(q);
    });
    this.groupedSubjectQuestions = Array.from(groups.entries()).map(([sub, questions]) => ({
      subject: sub,
      questions: questions
    }));
  }

  toggleSubjectGroup(subject: string): void {
    this.collapsedSubjectGroups[subject] = !this.collapsedSubjectGroups[subject];
  }
}
