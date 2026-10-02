import { Component, inject, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../shared/services/toast.service';
import { CourseService } from '../../shared/services/course.service';
import { SyncService } from '../../shared/services/sync.service';
import { Subscription } from 'rxjs';

export interface ExamQuestion {
  id: number;
  questionText: string;
  options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[];
  correctOption: 'A' | 'B' | 'C' | 'D';
  marks: number;
  mappedCO: string;
  explanation?: string;
}

export interface ExamSubmission {
  id: string;
  studentName: string;
  studentRoll: string;
  studentDept: string;
  examId: string;
  answers: { [questionId: number]: 'A' | 'B' | 'C' | 'D' };
  scoreObtained: number;
  maxMarks: number;
  percentage: number;
  status: 'Pass' | 'Fail';
  submittedAt: string;
  timeTakenSeconds: number;
}

export interface OnlineExam {
  id: string;
  title: string;
  courseCode: string;
  courseTitle: string;
  department: string;
  semester: string;
  facultyName: string;
  facultyEmail: string;
  durationMinutes: number;
  totalMarks: number;
  passMarks: number;
  dueDate: string;
  status: 'Published' | 'Draft' | 'Closed';
  questions: ExamQuestion[];
  createdAt: string;
}

export interface Assessment {
  id: number;
  course: string;
  type: string;
  questions: number;
  maxMarks: number;
  dueDate: string;
  status: string;
}

export interface MarkEntry {
  id: number;
  student: string;
  course?: string;
  coMapped?: string;
  assessment: string;
  obtained: number;
  maxMarks: number;
}

@Component({
  selector: 'app-assessments',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  templateUrl: './assessments.html',
  styleUrls: ['./assessments.css'],
})
export class Assessments implements OnInit, OnDestroy {
  Math = Math;
  Object = Object;
  activeTab: 'online-exams' | 'schedule-table' | 'take-exam' | 'exam-analytics' = 'online-exams';

  role: string | null = null;
  userName = 'Student';
  userRoll = 'CUTM2026CSE042';
  userDept = 'Computer Science & Engineering';

  assessmentTypes = ['Assignment', 'Quiz', 'Mid Exam', 'Final Exam', 'Lab Exam'];

  // Data Stores
  assessments: Assessment[] = [];
  markEntries: MarkEntry[] = [];
  coursesList: any[] = [];
  studentsList: any[] = [];
  onlineExams: OnlineExam[] = [];
  examSubmissions: ExamSubmission[] = [];

  // Filter & Search
  searchOnlineExams = '';
  filterCourse = '';
  searchAssessment = '';
  typeFilter = '';
  searchMarks = '';

  // Online Exam Creation Form State
  showCreateExamModal = false;
  newExam: OnlineExam = this.getEmptyExam();
  currentQuestion: ExamQuestion = this.getEmptyQuestion(1);

  // Live Exam Taking State (Student Mode)
  activeExamToTake: OnlineExam | null = null;
  currentQuestionIndex: number = 0;
  studentAnswers: { [qId: number]: 'A' | 'B' | 'C' | 'D' } = {};
  examTimeRemainingSeconds: number = 0;
  examTimerInterval: any = null;
  examStartedTime: number = 0;
  examCompletedResult: ExamSubmission | null = null;
  showExamResultModal = false;

  // Faculty Live Analytics Modal State
  selectedExamForAnalytics: OnlineExam | null = null;
  showAnalyticsModal = false;

  // Traditional assessment form states
  currentAssessment: Assessment = { id: 0, course: '', type: 'Assignment', questions: 5, maxMarks: 50, dueDate: '2026-11-15', status: 'Planned' };
  currentMark: MarkEntry = { id: 0, student: '', course: '', coMapped: 'CO1', assessment: 'Assignment', obtained: 42, maxMarks: 50 };
  editAssessmentIndex = -1;

  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private courseService = inject(CourseService);
  private syncService = inject(SyncService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private syncSub?: Subscription;

  constructor() {
    try {
      this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
      this.userName = localStorage.getItem('userName') || 'Student';
      this.userRoll = localStorage.getItem('userRoll') || localStorage.getItem('userId') || 'CUTM2026CSE042';
      this.userDept = localStorage.getItem('userDept') || localStorage.getItem('userDepartment') || 'Computer Science & Engineering';
    } catch {
      this.role = null;
    }
  }

  ngOnInit(): void {
    this.loadCourses();
    this.loadStudents();
    this.loadAssessments();
    this.loadMarks();
    this.loadOnlineExams();
    this.loadSubmissions();

    // Check for direct exam take parameter via query params (e.g. /assessments?takeExam=EXAM_ID)
    this.route.queryParams.subscribe(params => {
      if (params['takeExam']) {
        const examId = params['takeExam'];
        this.openExamForTaking(examId);
      }
    });

    this.syncSub = this.syncService.events$.subscribe((e) => {
      if (e.type === 'MARKS_CHANGED' || e.type === 'ASSESSMENTS_CHANGED') {
        this.loadMarks();
        this.loadAssessments();
        this.loadOnlineExams();
        this.loadSubmissions();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.examTimerInterval) {
      clearInterval(this.examTimerInterval);
    }
    this.syncSub?.unsubscribe();
  }

  // ==========================================================================
  // ONLINE EXAMS SYSTEM LOGIC
  // ==========================================================================

  private getEmptyExam(): OnlineExam {
    return {
      id: 'EXAM_' + Date.now().toString().slice(-6),
      title: '',
      courseCode: 'CS101',
      courseTitle: 'Database Management Systems',
      department: 'Computer Science & Engineering',
      semester: 'Semester 3',
      facultyName: this.role === 'faculty' ? this.userName : 'Dr. Ramesh Babu',
      facultyEmail: localStorage.getItem('userEmail') || 'faculty@oblms.edu',
      durationMinutes: 15,
      totalMarks: 20,
      passMarks: 10,
      dueDate: '2026-11-25',
      status: 'Published',
      questions: [],
      createdAt: new Date().toISOString()
    };
  }

  private getEmptyQuestion(num: number): ExamQuestion {
    return {
      id: num,
      questionText: '',
      options: [
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' }
      ],
      correctOption: 'A',
      marks: 4,
      mappedCO: 'CO1',
      explanation: ''
    };
  }

  private getDefaultExams(): OnlineExam[] {
    return [
      {
        id: 'EXAM_101',
        title: 'Midterm MCQ Quiz: SQL & Relational Normalization',
        courseCode: 'CS101',
        courseTitle: 'Database Management Systems',
        department: 'Computer Science & Engineering',
        semester: 'Semester 3',
        facultyName: 'Dr. Ramesh Babu',
        facultyEmail: 'ramesh.babu@oblms.edu',
        durationMinutes: 15,
        totalMarks: 20,
        passMarks: 10,
        dueDate: '2026-11-20',
        status: 'Published',
        createdAt: '2026-10-01T10:00:00Z',
        questions: [
          {
            id: 1,
            questionText: 'Which of the following SQL clauses is used to filter group results after aggregation in relational databases?',
            options: [
              { key: 'A', text: 'WHERE' },
              { key: 'B', text: 'HAVING' },
              { key: 'C', text: 'GROUP BY' },
              { key: 'D', text: 'ORDER BY' }
            ],
            correctOption: 'B',
            marks: 5,
            mappedCO: 'CO1',
            explanation: 'The HAVING clause filters aggregated groups resulting from GROUP BY, whereas WHERE filters individual rows before grouping.'
          },
          {
            id: 2,
            questionText: 'Which Normal Form eliminates Transitive Functional Dependencies (X → Y, Y → Z where Y is not a candidate key)?',
            options: [
              { key: 'A', text: 'First Normal Form (1NF)' },
              { key: 'B', text: 'Second Normal Form (2NF)' },
              { key: 'C', text: 'Third Normal Form (3NF)' },
              { key: 'D', text: 'Boyce-Codd Normal Form (BCNF)' }
            ],
            correctOption: 'C',
            marks: 5,
            mappedCO: 'CO2',
            explanation: '3NF strictly disallows non-prime attributes from being transitively dependent on candidate keys.'
          },
          {
            id: 3,
            questionText: 'In ACID transaction management, which property guarantees that partial transactions are rolled back in event of a crash?',
            options: [
              { key: 'A', text: 'Atomicity' },
              { key: 'B', text: 'Consistency' },
              { key: 'C', text: 'Isolation' },
              { key: 'D', text: 'Durability' }
            ],
            correctOption: 'A',
            marks: 5,
            mappedCO: 'CO3',
            explanation: 'Atomicity follows the All-or-Nothing rule: either all operations succeed or all changes are aborted.'
          },
          {
            id: 4,
            questionText: 'Which relational algebra operation combines matching tuples from two relations based on a common join predicate?',
            options: [
              { key: 'A', text: 'Cartesian Product (×)' },
              { key: 'B', text: 'Natural Join (⋈)' },
              { key: 'C', text: 'Projection (π)' },
              { key: 'D', text: 'Selection (σ)' }
            ],
            correctOption: 'B',
            marks: 5,
            mappedCO: 'CO1',
            explanation: 'Natural Join equates attributes with matching names and schemes across both tables.'
          }
        ]
      },
      {
        id: 'EXAM_102',
        title: 'Continuous Assessment: Trees, Graphs & Algorithm Complexity',
        courseCode: 'CS102',
        courseTitle: 'Data Structures & Algorithms',
        department: 'Computer Science & Engineering',
        semester: 'Semester 2',
        facultyName: 'Prof. Sunita Sharma',
        facultyEmail: 'sunita.sharma@oblms.edu',
        durationMinutes: 15,
        totalMarks: 15,
        passMarks: 8,
        dueDate: '2026-11-28',
        status: 'Published',
        createdAt: '2026-10-01T12:00:00Z',
        questions: [
          {
            id: 1,
            questionText: 'What is the worst-case time complexity of searching an element in an unbalanced Binary Search Tree (BST)?',
            options: [
              { key: 'A', text: 'O(1)' },
              { key: 'B', text: 'O(log N)' },
              { key: 'C', text: 'O(N)' },
              { key: 'D', text: 'O(N log N)' }
            ],
            correctOption: 'C',
            marks: 5,
            mappedCO: 'CO1',
            explanation: 'When BST becomes skewed (degenerate), search degrades to linear time O(N).'
          },
          {
            id: 2,
            questionText: 'Which graph traversal algorithm uses a Queue (FIFO) and explores neighbors layer by layer?',
            options: [
              { key: 'A', text: 'Depth First Search (DFS)' },
              { key: 'B', text: 'Breadth First Search (BFS)' },
              { key: 'C', text: 'Dijkstra Algorithm' },
              { key: 'D', text: 'Kruskal Algorithm' }
            ],
            correctOption: 'B',
            marks: 5,
            mappedCO: 'CO2',
            explanation: 'BFS explores vertices in order of distance from source using a First-In-First-Out Queue.'
          },
          {
            id: 3,
            questionText: 'Which algorithmic paradigm does the Merge Sort algorithm employ?',
            options: [
              { key: 'A', text: 'Greedy Approach' },
              { key: 'B', text: 'Dynamic Programming' },
              { key: 'C', text: 'Divide and Conquer' },
              { key: 'D', text: 'Backtracking' }
            ],
            correctOption: 'C',
            marks: 5,
            mappedCO: 'CO3',
            explanation: 'Merge Sort splits array into halves, recursively sorts them, and merges sorted subarrays.'
          }
        ]
      }
    ];
  }

  loadOnlineExams(): void {
    try {
      const stored = localStorage.getItem('obslmsOnlineExams');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.onlineExams = parsed;
          this.cdr.detectChanges();
          return;
        }
      }
    } catch {}

    this.onlineExams = this.getDefaultExams();
    this.saveOnlineExams();
  }

  saveOnlineExams(): void {
    try {
      localStorage.setItem('obslmsOnlineExams', JSON.stringify(this.onlineExams));
    } catch {}
  }

  loadSubmissions(): void {
    try {
      const stored = localStorage.getItem('obslmsExamSubmissions');
      if (stored) {
        this.examSubmissions = JSON.parse(stored) || [];
      } else {
        // Pre-fill initial sample submissions
        this.examSubmissions = [
          {
            id: 'SUB_01',
            studentName: 'Raj Kumar',
            studentRoll: 'STU001',
            studentDept: 'Computer Science & Engineering',
            examId: 'EXAM_101',
            answers: { 1: 'B', 2: 'C', 3: 'A', 4: 'B' },
            scoreObtained: 20,
            maxMarks: 20,
            percentage: 100,
            status: 'Pass',
            submittedAt: new Date(Date.now() - 3600000).toISOString(),
            timeTakenSeconds: 420
          },
          {
            id: 'SUB_02',
            studentName: 'Priya Sharma',
            studentRoll: 'STU002',
            studentDept: 'Computer Science & Engineering',
            examId: 'EXAM_101',
            answers: { 1: 'B', 2: 'B', 3: 'A', 4: 'B' },
            scoreObtained: 15,
            maxMarks: 20,
            percentage: 75,
            status: 'Pass',
            submittedAt: new Date(Date.now() - 7200000).toISOString(),
            timeTakenSeconds: 580
          }
        ];
        this.saveSubmissions();
      }
    } catch {
      this.examSubmissions = [];
    }
  }

  saveSubmissions(): void {
    try {
      localStorage.setItem('obslmsExamSubmissions', JSON.stringify(this.examSubmissions));
    } catch {}
  }

  // Filtered Online Exams List
  get filteredOnlineExams(): OnlineExam[] {
    let list = this.onlineExams;
    
    // If faculty, show exams created by or assigned to faculty
    if (this.role === 'faculty') {
      const myCourses = this.getFacultyAssignedCourses();
      list = list.filter(e => 
        myCourses.some(mc => e.courseCode.toLowerCase().includes(mc.toLowerCase()) || e.courseTitle.toLowerCase().includes(mc.toLowerCase())) ||
        (e.facultyName && e.facultyName.toLowerCase().includes(this.userName.toLowerCase()))
      );
    }

    // If student, filter by student's department or enrolled courses
    if (this.role === 'student') {
      const studentDept = this.userDept.toLowerCase();
      list = list.filter(e => 
        e.department.toLowerCase().includes(studentDept) || studentDept.includes(e.department.toLowerCase()) ||
        e.courseCode.toLowerCase().startsWith(this.getShortDept(this.userDept).toLowerCase())
      );
    }

    if (this.filterCourse) {
      list = list.filter(e => e.courseCode === this.filterCourse || e.courseTitle === this.filterCourse);
    }

    if (this.searchOnlineExams.trim()) {
      const q = this.searchOnlineExams.toLowerCase();
      list = list.filter(e => 
        e.title.toLowerCase().includes(q) ||
        e.courseCode.toLowerCase().includes(q) ||
        e.courseTitle.toLowerCase().includes(q) ||
        e.facultyName.toLowerCase().includes(q)
      );
    }

    return list;
  }

  getShortDept(dept: string): string {
    const d = (dept || '').toLowerCase();
    if (d.includes('civil') || d === 'ce') return 'CE';
    if (d.includes('mechanical') || d.includes('mech') || d === 'me') return 'ME';
    if (d.includes('electrical & electronics') || d.includes('eee')) return 'EEE';
    if (d.includes('electronic') || d.includes('ece')) return 'ECE';
    if (d.includes('information') || d.includes('it')) return 'IT';
    return 'CSE';
  }

  // Exam Creator Modal Handlers
  openCreateExamModal(): void {
    if (this.role !== 'faculty' && this.role !== 'admin') {
      this.toast.error('Only faculty and administrators can create online assessments.');
      return;
    }
    this.newExam = this.getEmptyExam();
    if (this.coursesList.length > 0) {
      this.newExam.courseCode = this.coursesList[0].code || 'CS101';
      this.newExam.courseTitle = this.coursesList[0].title || 'Database Management Systems';
    }
    this.currentQuestion = this.getEmptyQuestion(1);
    this.showCreateExamModal = true;
  }

  closeCreateExamModal(): void {
    this.showCreateExamModal = false;
  }

  onNewExamCourseChange(courseTitleOrCode: string): void {
    const match = this.coursesList.find(c => c.title === courseTitleOrCode || c.code === courseTitleOrCode);
    if (match) {
      this.newExam.courseCode = match.code;
      this.newExam.courseTitle = match.title;
      this.newExam.department = match.department || 'Computer Science & Engineering';
      this.newExam.semester = match.semester || 'Semester 3';
    }
  }

  addQuestionToNewExam(): void {
    if (!this.currentQuestion.questionText.trim()) {
      this.toast.warning('Please enter the question text.');
      return;
    }
    if (this.currentQuestion.options.some(o => !o.text.trim())) {
      this.toast.warning('Please fill all 4 options (A, B, C, D).');
      return;
    }

    this.newExam.questions.push({ ...this.currentQuestion });
    
    // Recalculate total marks
    this.newExam.totalMarks = this.newExam.questions.reduce((sum, q) => sum + Number(q.marks), 0);
    this.newExam.passMarks = Math.ceil(this.newExam.totalMarks * 0.4);

    this.toast.info(`Question #${this.currentQuestion.id} added! Add more or publish exam.`);
    
    // Prepare next question
    this.currentQuestion = this.getEmptyQuestion(this.newExam.questions.length + 1);
  }

  removeQuestionFromNewExam(index: number): void {
    this.newExam.questions.splice(index, 1);
    // Re-index questions
    this.newExam.questions.forEach((q, idx) => q.id = idx + 1);
    this.newExam.totalMarks = this.newExam.questions.reduce((sum, q) => sum + Number(q.marks), 0);
    this.newExam.passMarks = Math.ceil(this.newExam.totalMarks * 0.4);
    this.currentQuestion.id = this.newExam.questions.length + 1;
  }

  publishNewExam(): void {
    if (!this.newExam.title.trim()) {
      this.toast.warning('Please enter the exam title.');
      return;
    }
    if (this.newExam.questions.length === 0) {
      this.toast.warning('Please add at least one question before publishing.');
      return;
    }

    this.newExam.id = 'EXAM_' + Date.now().toString().slice(-6);
    this.newExam.createdAt = new Date().toISOString();
    this.newExam.status = 'Published';

    this.onlineExams.unshift({ ...this.newExam });
    this.saveOnlineExams();

    // Persist assessment into Spring Boot Database
    const assessmentPayload = {
      id: null,
      assessmentName: `Online Exam: ${this.newExam.title} (${this.newExam.courseCode})`,
      assessmentType: 'Quiz',
      courseId: this.newExam.courseCode,
      courseName: this.newExam.courseTitle,
      courseOutcomes: 'CO1',
      maxMarks: this.newExam.totalMarks
    };
    this.http.post('http://localhost:8080/api/obe/assessments', assessmentPayload).subscribe({
      next: () => {
        this.loadAssessments();
      },
      error: () => {}
    });

    // Broadcast exam notification to enrolled students
    this.broadcastExamAlert(this.newExam);

    this.toast.success(`Online Exam "${this.newExam.title}" published & shared with enrolled students! 🚀`);
    this.showCreateExamModal = false;
    this.syncService.emit('ASSESSMENTS_CHANGED');
    this.cdr.detectChanges();
  }

  // Link Sharing & Student Notifications
  getShareableExamLink(exam: OnlineExam): string {
    const base = window.location.origin;
    return `${base}/assessments?takeExam=${exam.id}`;
  }

  copyExamLink(exam: OnlineExam): void {
    const link = this.getShareableExamLink(exam);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        this.toast.success(`Exam link copied to clipboard! 📋`);
      });
    } else {
      this.toast.info(`Share Link: ${link}`);
    }
  }

  broadcastExamAlert(exam: OnlineExam): void {
    try {
      const stored = localStorage.getItem('obslmsNotifications');
      const notifs = stored ? JSON.parse(stored) : [];
      notifs.unshift({
        id: 'NOTIF_' + Date.now(),
        title: `📝 New Online Exam Scheduled: ${exam.title}`,
        message: `Faculty ${exam.facultyName} has scheduled a ${exam.durationMinutes}-minute online quiz for ${exam.courseCode} (${exam.courseTitle}). Due: ${exam.dueDate}.`,
        targetDept: exam.department,
        targetSem: exam.semester,
        targetCourse: exam.courseCode,
        timestamp: new Date().toISOString(),
        read: false
      });
      localStorage.setItem('obslmsNotifications', JSON.stringify(notifs));
      this.syncService.emit('NOTIFICATIONS_CHANGED');
    } catch {}
  }

  // ==========================================================================
  // STUDENT LIVE EXAM TAKING & AUTO-GRADING ENGINE
  // ==========================================================================

  hasStudentAttempted(examId: string): boolean {
    const sName = this.userName.toLowerCase();
    const sRoll = this.userRoll.toLowerCase();
    return this.examSubmissions.some(sub => 
      sub.examId === examId && 
      (sub.studentName.toLowerCase() === sName || sub.studentRoll.toLowerCase() === sRoll)
    );
  }

  getStudentExamSubmission(examId: string): ExamSubmission | undefined {
    const sName = this.userName.toLowerCase();
    const sRoll = this.userRoll.toLowerCase();
    return this.examSubmissions.find(sub => 
      sub.examId === examId && 
      (sub.studentName.toLowerCase() === sName || sub.studentRoll.toLowerCase() === sRoll)
    );
  }

  openExamForTaking(examId: string): void {
    const exam = this.onlineExams.find(e => e.id === examId);
    if (!exam) {
      this.toast.error('Exam not found or link has expired.');
      return;
    }

    // Check student subject eligibility
    if (this.role === 'student') {
      const studentShortDept = this.getShortDept(this.userDept);
      const examShortDept = this.getShortDept(exam.department);
      if (studentShortDept !== examShortDept && !exam.department.includes(this.userDept)) {
        this.toast.warning(`Access Restricted: This exam is only for ${exam.department} (${examShortDept}) students.`);
        return;
      }
    }

    // Check if student already submitted
    const existing = this.getStudentExamSubmission(exam.id);
    if (existing) {
      this.examCompletedResult = existing;
      this.activeExamToTake = exam;
      this.showExamResultModal = true;
      this.activeTab = 'take-exam';
      this.cdr.detectChanges();
      return;
    }

    // Start Live Exam
    this.activeExamToTake = exam;
    this.currentQuestionIndex = 0;
    this.studentAnswers = {};
    this.examTimeRemainingSeconds = exam.durationMinutes * 60;
    this.examStartedTime = Date.now();
    this.examCompletedResult = null;
    this.showExamResultModal = false;
    this.activeTab = 'take-exam';

    this.startExamTimer();
    this.toast.info(`Exam started! Time remaining: ${exam.durationMinutes} minutes. Best of luck! ⏱️`);
    this.cdr.detectChanges();
  }

  startExamTimer(): void {
    if (this.examTimerInterval) clearInterval(this.examTimerInterval);

    this.examTimerInterval = setInterval(() => {
      if (this.examTimeRemainingSeconds > 0) {
        this.examTimeRemainingSeconds--;
      } else {
        clearInterval(this.examTimerInterval);
        this.toast.warning('Time is up! Auto-submitting your examination answers... ⌛');
        this.submitExamAnswers(true);
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  get formattedTimer(): string {
    const mins = Math.floor(this.examTimeRemainingSeconds / 60);
    const secs = this.examTimeRemainingSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  selectAnswerOption(optionKey: 'A' | 'B' | 'C' | 'D'): void {
    if (!this.activeExamToTake) return;
    const q = this.activeExamToTake.questions[this.currentQuestionIndex];
    if (q) {
      this.studentAnswers[q.id] = optionKey;
    }
  }

  nextQuestion(): void {
    if (!this.activeExamToTake) return;
    if (this.currentQuestionIndex < this.activeExamToTake.questions.length - 1) {
      this.currentQuestionIndex++;
    }
  }

  prevQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  jumpToQuestion(index: number): void {
    this.currentQuestionIndex = index;
  }

  // Automatic Tally & Instant Auto-Grading
  submitExamAnswers(autoSubmit: boolean = false): void {
    if (!this.activeExamToTake) return;

    if (!autoSubmit) {
      const answeredCount = Object.keys(this.studentAnswers).length;
      const totalCount = this.activeExamToTake.questions.length;
      if (answeredCount < totalCount) {
        const proceed = confirm(`You have answered ${answeredCount} of ${totalCount} questions. Are you sure you want to submit?`);
        if (!proceed) return;
      }
    }

    if (this.examTimerInterval) {
      clearInterval(this.examTimerInterval);
    }

    const timeTaken = Math.max(1, Math.round((Date.now() - this.examStartedTime) / 1000));
    const exam = this.activeExamToTake;

    // Tally answers against answer key
    let obtainedMarks = 0;
    exam.questions.forEach(q => {
      const chosen = this.studentAnswers[q.id];
      if (chosen && chosen === q.correctOption) {
        obtainedMarks += Number(q.marks);
      }
    });

    const percentage = Math.round((obtainedMarks / exam.totalMarks) * 100);
    const status: 'Pass' | 'Fail' = obtainedMarks >= exam.passMarks ? 'Pass' : 'Fail';

    const submission: ExamSubmission = {
      id: 'SUB_' + Date.now().toString().slice(-6),
      studentName: this.userName || 'Krishna Vamsi',
      studentRoll: this.userRoll || 'CUTM2026CSE042',
      studentDept: this.userDept || 'Computer Science & Engineering',
      examId: exam.id,
      answers: { ...this.studentAnswers },
      scoreObtained: obtainedMarks,
      maxMarks: exam.totalMarks,
      percentage,
      status,
      submittedAt: new Date().toISOString(),
      timeTakenSeconds: timeTaken
    };

    // Save to submissions
    this.examSubmissions.unshift(submission);
    this.saveSubmissions();

    // Automatically sync score into OBE Mark Entries & Results
    this.recordExamMarkIntoObeSystem(exam, submission);

    this.examCompletedResult = submission;
    this.showExamResultModal = true;
    this.toast.success(`Exam submitted successfully! Score: ${obtainedMarks}/${exam.totalMarks} (${percentage}%). 🎉`);
    this.syncService.emit('MARKS_CHANGED');
    this.cdr.detectChanges();
  }

  private recordExamMarkIntoObeSystem(exam: OnlineExam, sub: ExamSubmission): void {
    const markEntry = {
      id: null,
      student: sub.studentName,
      assessment: `Online Exam - ${exam.title} (${exam.courseCode})`,
      obtained: sub.scoreObtained,
      maxMarks: sub.maxMarks
    };

    try {
      const stored = localStorage.getItem('obslmsMarkEntries');
      const marks = stored ? JSON.parse(stored) : [];
      marks.unshift({
        id: Date.now(),
        student: sub.studentName,
        assessment: markEntry.assessment,
        obtained: sub.scoreObtained,
        maxMarks: sub.maxMarks
      });
      localStorage.setItem('obslmsMarkEntries', JSON.stringify(marks));
      this.loadMarks();
    } catch {}

    // Persist to Spring Boot Database
    this.http.post('http://localhost:8080/api/obe/marks', markEntry).subscribe({
      next: () => {
        this.loadMarks();
      },
      error: () => {}
    });
  }

  exitExamView(): void {
    this.activeExamToTake = null;
    this.showExamResultModal = false;
    this.activeTab = 'online-exams';
    this.router.navigate([], { queryParams: {} });
  }

  // ==========================================================================
  // FACULTY LIVE SUBMISSIONS ROSTER & ANALYTICS
  // ==========================================================================

  openExamAnalytics(exam: OnlineExam): void {
    this.selectedExamForAnalytics = exam;
    this.showAnalyticsModal = true;
  }

  closeAnalyticsModal(): void {
    this.showAnalyticsModal = false;
    this.selectedExamForAnalytics = null;
  }

  getAttemptedSubmissions(examId: string): ExamSubmission[] {
    return this.examSubmissions.filter(s => s.examId === examId);
  }

  getEnrolledStudentsForExam(exam: OnlineExam): any[] {
    const examShortDept = this.getShortDept(exam.department).toLowerCase();
    return this.studentsList.filter(s => {
      const sDept = (s.department || s.dept || '').toLowerCase();
      return sDept.includes(examShortDept) || sDept.includes(exam.department.toLowerCase());
    });
  }

  getPendingStudentsForExam(exam: OnlineExam): any[] {
    const attempted = this.getAttemptedSubmissions(exam.id).map(s => s.studentName.toLowerCase());
    const allEnrolled = this.getEnrolledStudentsForExam(exam);
    return allEnrolled.filter(s => !attempted.includes(s.name.toLowerCase()));
  }

  getOverallPassRate(): number {
    if (!this.examSubmissions || this.examSubmissions.length === 0) return 100;
    const passed = this.examSubmissions.filter(s => s.status === 'Pass').length;
    return Math.round((passed / this.examSubmissions.length) * 100);
  }

  getExamAverageScore(examId: string): number {
    const subs = this.getAttemptedSubmissions(examId);
    if (!subs.length) return 0;
    const sum = subs.reduce((acc, s) => acc + s.scoreObtained, 0);
    return Number((sum / subs.length).toFixed(1));
  }

  getExamHighestScore(examId: string): number {
    const subs = this.getAttemptedSubmissions(examId);
    if (!subs.length) return 0;
    return Math.max(...subs.map(s => s.scoreObtained));
  }

  getExamPassRate(examId: string): number {
    const subs = this.getAttemptedSubmissions(examId);
    if (!subs.length) return 0;
    const passed = subs.filter(s => s.status === 'Pass').length;
    return Math.round((passed / subs.length) * 100);
  }

  sendReminderToStudent(student: any): void {
    this.toast.info(`Reminder alert dispatched to ${student.name} (${student.email || 'student@oblms.edu'}) 📩`);
  }

  // ==========================================================================
  // TRADITIONAL ASSESSMENTS METHODS
  // ==========================================================================

  normalizeType(rawType?: string, name?: string): string {
    const combined = ((rawType || '') + ' ' + (name || '')).toLowerCase();
    if (combined.includes('mid')) return 'Mid Exam';
    if (combined.includes('quiz')) return 'Quiz';
    if (combined.includes('assign')) return 'Assignment';
    if (combined.includes('final') || combined.includes('sem') || combined.includes('end')) return 'Final Exam';
    if (combined.includes('lab') || combined.includes('practic')) return 'Lab Exam';
    return rawType || 'Assignment';
  }

  countByType(type: string): number {
    return this.assessments.filter(a => this.normalizeType(a.type) === type).length;
  }

  getFacultyAssignedCourses(): string[] {
    let assigned: string[] = [];
    try {
      const stored = localStorage.getItem('userAssignedCourses');
      if (stored) assigned = JSON.parse(stored);
    } catch {}
    if (assigned.length === 0 && this.role === 'faculty') {
      const uName = (this.userName || '').toLowerCase();
      if (uName.includes('ramesh')) assigned = ['CS101', 'CS102', 'CS103'];
      else if (uName.includes('sunita')) assigned = ['CS201', 'CS202', 'CS205'];
      else if (uName.includes('amit')) assigned = ['EC201', 'EC202', 'EC203'];
      else if (uName.includes('priya')) assigned = ['IT201', 'IT202', 'IT301'];
      else if (uName.includes('rajesh')) assigned = ['CS301', 'CS302', 'CS303'];
      else if (uName.includes('suresh')) assigned = ['CE201', 'CE202', 'CE203'];
      else if (uName.includes('ananya')) assigned = ['ME201', 'ME202', 'ME203'];
      else assigned = ['CS101', 'CS102', 'CS103'];
    }
    return assigned;
  }

  get filteredAssessments(): Assessment[] {
    let list = this.assessments;
    if (this.role === 'faculty') {
      const myCourses = this.getFacultyAssignedCourses();
      list = list.filter(a =>
        myCourses.some(mc => (a.course || '').toLowerCase().includes(mc.toLowerCase()) || mc.toLowerCase().includes((a.course || '').toLowerCase()))
      );
    }
    if (this.typeFilter) {
      list = list.filter(a => this.normalizeType(a.type) === this.typeFilter);
    }
    if (this.searchAssessment.trim()) {
      const q = this.searchAssessment.toLowerCase();
      list = list.filter(a => 
        (a.course || '').toLowerCase().includes(q) ||
        (a.type || '').toLowerCase().includes(q) ||
        (a.status || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  get filteredMarkEntries(): MarkEntry[] {
    let list = this.markEntries;
    if (this.role === 'faculty') {
      const myCourses = this.getFacultyAssignedCourses();
      list = list.filter(m =>
        myCourses.some(mc => (m.assessment || '').toLowerCase().includes(mc.toLowerCase()) || mc.toLowerCase().includes((m.assessment || '').toLowerCase()))
      );
    }
    if (this.role === 'student') {
      const uname = (this.userName || localStorage.getItem('userName') || 'Student').toLowerCase();
      list = list.filter(m => 
        m.student.toLowerCase() === uname ||
        m.student.toLowerCase().includes(uname) ||
        uname.includes(m.student.toLowerCase())
      );
    }
    if (!this.searchMarks.trim()) return list;
    const q = this.searchMarks.toLowerCase();
    return list.filter(m => 
      m.student.toLowerCase().includes(q) ||
      m.assessment.toLowerCase().includes(q)
    );
  }

  loadCourses(): void {
    let local = this.courseService.getCoursesSync();
    if (this.role === 'faculty') {
      const myCourses = this.getFacultyAssignedCourses();
      local = local.filter(c => 
        myCourses.some(mc => mc.toLowerCase() === (c.code || '').toLowerCase() || mc.toLowerCase() === (c.title || '').toLowerCase() || (c.title && c.title.toLowerCase().includes(mc.toLowerCase())))
      );
    }
    this.coursesList = local;
    if (!this.currentAssessment.course && this.coursesList.length > 0) {
      this.currentAssessment.course = this.coursesList[0].title;
    }
    this.cdr.detectChanges();

    this.http.get<any[]>('http://localhost:8080/api/courses').subscribe({
      next: (courses) => {
        if (Array.isArray(courses) && courses.length > 0) {
          let list = courses;
          if (this.role === 'faculty') {
            const myCourses = this.getFacultyAssignedCourses();
            list = list.filter(c => 
              myCourses.some(mc => mc.toLowerCase() === (c.code || '').toLowerCase() || mc.toLowerCase() === (c.title || '').toLowerCase() || (c.title && c.title.toLowerCase().includes(mc.toLowerCase())))
            );
          }
          this.coursesList = list;
          if (!this.currentAssessment.course && this.coursesList.length > 0) {
            this.currentAssessment.course = this.coursesList[0].title;
          }
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  loadStudents(): void {
    this.http.get<any[]>('http://localhost:8080/api/users').subscribe({
      next: (users) => {
        if (Array.isArray(users) && users.length > 0) {
          this.studentsList = users.filter(u => u.role?.toUpperCase() === 'STUDENT');
          if (!this.currentMark.student && this.studentsList.length > 0) {
            this.currentMark.student = this.studentsList[0].name;
          }
          this.cdr.detectChanges();
        }
      },
      error: () => {
        try {
          const stored = localStorage.getItem('obslmsStudents');
          this.studentsList = stored ? JSON.parse(stored) : [];
          if (!this.currentMark.student && this.studentsList.length > 0) {
            this.currentMark.student = this.studentsList[0].name;
          }
        } catch {}
      }
    });
  }

  loadAssessments(): void {
    this.http.get<any[]>('http://localhost:8080/api/obe/assessments').subscribe({
      next: (data) => {
        let list: Assessment[] = [];
        if (Array.isArray(data) && data.length > 0) {
          list = data.map(item => ({
            id: item.id,
            course: item.courseName || item.courseId || item.assessmentName || 'Accredited Course',
            type: this.normalizeType(item.assessmentType || item.type, item.assessmentName),
            questions: item.questions || 5,
            maxMarks: item.maxMarks || 100,
            dueDate: item.dueDate || '2026-11-20',
            status: item.status || 'Active'
          }));
        }
        this.assessments = list;
        this.cdr.detectChanges();
      },
      error: () => {
        this.assessments = [];
        this.cdr.detectChanges();
      }
    });
  }

  loadMarks(): void {
    try {
      const stored = localStorage.getItem('obslmsMarkEntries');
      if (stored) {
        this.markEntries = JSON.parse(stored) || [];
        this.cdr.detectChanges();
      }
    } catch {}

    this.http.get<MarkEntry[]>('http://localhost:8080/api/obe/marks').subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          this.markEntries = data;
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  saveAssessment(): void {
    if (!this.currentAssessment.course || !this.currentAssessment.type || this.currentAssessment.questions <= 0 || this.currentAssessment.maxMarks <= 0 || !this.currentAssessment.dueDate) {
      return;
    }

    if (this.role !== 'faculty' && this.role !== 'admin') {
      this.toast.error('Only course faculty members and administrators can create or schedule assessments.');
      return;
    }

    const payload = {
      id: this.currentAssessment.id > 0 ? this.currentAssessment.id : null,
      assessmentName: `${this.currentAssessment.type} - ${this.currentAssessment.course}`,
      assessmentType: this.currentAssessment.type,
      courseId: this.currentAssessment.course,
      courseName: this.currentAssessment.course,
      courseOutcomes: 'CO1',
      maxMarks: this.currentAssessment.maxMarks
    };

    this.http.post('http://localhost:8080/api/obe/assessments', payload).subscribe({
      next: () => {
        this.toast.success(`Assessment for ${this.currentAssessment.course} scheduled successfully! 🎉`);
        this.loadAssessments();
        this.resetAssessmentForm();
      },
      error: () => {
        this.toast.error('Failed to save assessment.');
      }
    });
  }

  editAssessment(index: number): void {
    this.editAssessmentIndex = index;
    this.currentAssessment = { ...this.assessments[index] };
  }

  deleteAssessment(index: number): void {
    if (this.role !== 'faculty' && this.role !== 'admin') {
      this.toast.error('Only course faculty members and administrators can delete assessments.');
      return;
    }
    const target = this.assessments[index];
    this.http.delete('http://localhost:8080/api/obe/assessments/' + target.id).subscribe({
      next: () => {
        this.toast.info(`Assessment for ${target.course} removed.`);
        this.loadAssessments();
        this.resetAssessmentForm();
      },
      error: () => {
        this.toast.error('Failed to delete assessment.');
      }
    });
  }

  resetAssessmentForm(): void {
    this.editAssessmentIndex = -1;
    this.currentAssessment = { id: 0, course: '', type: 'Assignment', questions: 0, maxMarks: 0, dueDate: '', status: 'Planned' };
  }

  saveMarks(): void {
    if (this.role !== 'faculty' && this.role !== 'admin') {
      this.toast.error('Only course faculty members and administrators can enter student marks.');
      return;
    }

    if (!this.currentMark.student || !this.currentMark.assessment || this.currentMark.obtained < 0 || this.currentMark.maxMarks <= 0) {
      this.toast.warning('Please select student, assessment, and valid marks.');
      return;
    }

    const payload: MarkEntry = {
      id: Date.now(),
      student: this.currentMark.student,
      course: this.currentMark.course || (this.coursesList.length > 0 ? this.coursesList[0].name : 'General Course'),
      coMapped: this.currentMark.coMapped || 'CO1',
      assessment: this.currentMark.assessment,
      obtained: Number(this.currentMark.obtained),
      maxMarks: Number(this.currentMark.maxMarks)
    };

    try {
      const stored = localStorage.getItem('obslmsMarkEntries');
      const localMarks = stored ? JSON.parse(stored) : [];
      localMarks.unshift(payload);
      localStorage.setItem('obslmsMarkEntries', JSON.stringify(localMarks));
    } catch {}

    this.http.post('http://localhost:8080/api/obe/marks', payload).subscribe({
      next: () => {
        this.toast.success(`Marks recorded for ${this.currentMark.student}! 🎉`);
        this.loadMarks();
        this.resetMarksForm();
        this.syncService.emit('MARKS_CHANGED');
      },
      error: () => {
        this.toast.success(`Marks recorded locally for ${this.currentMark.student}! 🎉`);
        this.loadMarks();
        this.resetMarksForm();
        this.syncService.emit('MARKS_CHANGED');
      }
    });
  }

  resetMarksForm(): void {
    this.currentMark = { id: 0, student: '', course: '', coMapped: 'CO1', assessment: 'Assignment', obtained: 0, maxMarks: 100 };
  }
}
