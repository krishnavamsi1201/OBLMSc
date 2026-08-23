import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import {
  FacultyDataService,
  Course,
  Assessment,
  StudentProgress,
  AtRiskStudent,
  CourseCOAttainmentSummary,
  GradeDistribution,
  Notification,
  CqiAction
} from '../../shared/services/faculty-data.service';

interface ExaminationItem {
  id: number;
  title: string;
  course: string;
  date: string;
  room: string;
  status: 'Scheduled' | 'Ongoing' | 'Completed';
  marks: number;
}

interface GrievanceItem {
  id: number;
  title: string;
  description: string;
  category: string;
  studentName: string;
  status: 'Open' | 'In Review' | 'Resolved';
  date: string;
  resolution?: string;
}

interface QuestionBankItem {
  id: number;
  questionText: string;
  type: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  marks: number;
  subject: string;
  coMapped: string;
}

interface MarkEntryRow {
  studentName: string;
  obtained: number;
}

@Component({
  selector: 'app-faculty',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, Navbar, Sidebar, Footer],
  templateUrl: './faculty.html',
  styleUrls: ['./faculty.css'],
})
export class Faculty implements OnInit {
  facultyName = 'Faculty';

  // Dashboard Data
  courses: Course[] = [];
  activeAssessments: Assessment[] = [];
  studentProgressList: StudentProgress[] = [];
  filteredProgressList: StudentProgress[] = [];
  atRiskStudents: AtRiskStudent[] = [];
  courseCOAttainments: CourseCOAttainmentSummary[] = [];
  gradeDistribution: GradeDistribution = { distinction: 0, firstClass: 0, pass: 0, fail: 0, totalEvaluated: 0 };
  notifications: Notification[] = [];
  cqiActionsList: CqiAction[] = [];

  // Summary statistics
  totalCourses = 0;
  totalStudents = 0;
  overallAttainment = 0;
  averageAttendance = 0;
  activeAssessmentsCount = 0;
  atRiskCount = 0;
  pendingNotificationsCount = 0;

  // Filter
  selectedCourseFilter = '';

  // Faculty task widgets
  examinationItems: ExaminationItem[] = [];
  grievanceItems: GrievanceItem[] = [];
  questionBankItems: QuestionBankItem[] = [];

  // Loading state
  isLoading = true;
  error: string | null = null;

  // ==========================================
  // MODAL 1: Quick Mark Entry Sheet
  // ==========================================
  showMarkEntryModal = false;
  markEntryCourse = '';
  markEntryAssessmentTitle = '';
  markEntryMaxMarks = 100;
  markEntryRows: MarkEntryRow[] = [];
  storedAssessmentsList: any[] = [];

  // ==========================================
  // MODAL 2: Question Paper Generator
  // ==========================================
  showQuestionPaperModal = false;
  qpSubject = '';
  qpCOs: { [key: string]: boolean } = { CO1: true, CO2: true, CO3: true, CO4: false, CO5: false };
  qpTotalMarks = 50;
  qpDifficulty = 'Balanced'; // 'Easy', 'Balanced', 'Challenging'
  generatedPaperQuestions: QuestionBankItem[] = [];
  isPaperGenerated = false;
  allSubjectsList: string[] = [];

  // ==========================================
  // MODAL 3: Continuous Quality Improvement (CQI)
  // ==========================================
  showCqiModal = false;
  cqiCourse = '';
  cqiCoCode = 'CO1';
  cqiIssueDescription = '';
  cqiActionPlan = '';
  cqiTargetDate = '';

  // ==========================================
  // MODAL 4: At-Risk Student Details
  // ==========================================
  showAtRiskModal = false;
  selectedAtRiskStudent: AtRiskStudent | null = null;

  constructor(
    private facultyDataService: FacultyDataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.facultyName = this.facultyDataService.getCurrentFacultyName() || 'Faculty Member';
    this.loadDashboardData();
  }

  /**
   * Load real-time faculty dashboard data
   */
  loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;

    this.facultyDataService.getFacultyDashboardData().subscribe({
      next: (data) => {
        this.courses = data.courses;
        this.activeAssessments = data.activeAssessments;
        this.studentProgressList = data.studentProgressSummary;
        this.filteredProgressList = [...this.studentProgressList];
        this.atRiskStudents = data.atRiskStudents;
        this.courseCOAttainments = data.courseCOAttainments;
        this.gradeDistribution = data.gradeDistribution;
        this.notifications = data.notifications;

        // Statistics
        this.totalCourses = data.totalCourses;
        this.totalStudents = data.totalStudents;
        this.overallAttainment = data.overallAttainment;
        this.averageAttendance = data.averageAttendance;
        this.activeAssessmentsCount = data.activeAssessmentsCount;
        this.atRiskCount = data.atRiskCount;
        this.pendingNotificationsCount = this.notifications.filter(n => !n.read).length;

        // Load workbench widget data directly from storage
        this.loadWorkbenchData();

        // Load CQI actions
        this.cqiActionsList = this.facultyDataService.getCqiActions();

        // Update subjects list for question paper generator
        const storedQB = this.getSafeJson('obslmsQuestionBank') as QuestionBankItem[];
        const subs = storedQB.map(q => q.subject).filter(Boolean);
        this.allSubjectsList = Array.from(new Set([...subs, ...this.courses.map(c => c.name)]));

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading real-time dashboard data:', err);
        this.error = 'Failed to load real-time analytics. Please try again.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Load workbench widgets from localStorage
   */
  private loadWorkbenchData(): void {
    try {
      this.examinationItems = this.getSafeJson('obslmsExams');
      this.grievanceItems = this.getSafeJson('obslmsGrievances');
      this.questionBankItems = this.getSafeJson('obslmsQuestionBank');
    } catch (e) {
      console.error('Error loading workbench data:', e);
    }
  }

  /**
   * Filter student progress table by selected course
   */
  onCourseFilterChange(): void {
    if (!this.selectedCourseFilter) {
      this.filteredProgressList = [...this.studentProgressList];
    } else {
      this.filteredProgressList = this.studentProgressList.filter(sp =>
        sp.courseName.toLowerCase().includes(this.selectedCourseFilter.toLowerCase())
      );
    }
  }

  // ==========================================
  // QUICK MARKS ENTRY ACTIONS
  // ==========================================
  openMarkEntryModal(assessment?: Assessment): void {
    this.storedAssessmentsList = this.getSafeJson('obslmsAssessments');
    const allStudents = this.getSafeJson('obslmsStudents');
    const existingMarks = this.getSafeJson('obslmsMarkEntries');

    if (assessment) {
      this.markEntryCourse = assessment.courseName;
      this.markEntryAssessmentTitle = assessment.title;
      this.markEntryMaxMarks = assessment.maxMarks || 100;
    } else if (this.activeAssessments.length > 0) {
      this.markEntryCourse = this.activeAssessments[0].courseName;
      this.markEntryAssessmentTitle = this.activeAssessments[0].title;
      this.markEntryMaxMarks = this.activeAssessments[0].maxMarks || 100;
    } else {
      this.markEntryCourse = this.courses[0]?.name || '';
      this.markEntryAssessmentTitle = 'Midterm Assessment 1';
      this.markEntryMaxMarks = 100;
    }

    // Populate existing marks for this assessment or list of known students
    const assessmentMarks = existingMarks.filter((m: any) =>
      m.assessment && m.assessment.toLowerCase() === this.markEntryAssessmentTitle.toLowerCase()
    );

    if (assessmentMarks.length > 0) {
      this.markEntryRows = assessmentMarks.map((m: any) => ({
        studentName: m.student,
        obtained: Number(m.obtained) || 0
      }));
    } else if (allStudents.length > 0) {
      this.markEntryRows = allStudents.map((s: any) => ({
        studentName: s.name || s.studentName || 'Student',
        obtained: 0
      }));
    } else if (this.studentProgressList.length > 0) {
      this.markEntryRows = this.studentProgressList.map(s => ({
        studentName: s.studentName,
        obtained: 0
      }));
    } else {
      // Default 3 rows for entry
      this.markEntryRows = [
        { studentName: 'Aditya Sharma', obtained: 85 },
        { studentName: 'Pooja Reddy', obtained: 78 },
        { studentName: 'Rahul Verma', obtained: 62 }
      ];
    }

    this.showMarkEntryModal = true;
  }

  closeMarkEntryModal(): void {
    this.showMarkEntryModal = false;
    this.markEntryRows = [];
  }

  addMarkRow(): void {
    this.markEntryRows.push({ studentName: '', obtained: 0 });
  }

  removeMarkRow(index: number): void {
    this.markEntryRows.splice(index, 1);
  }

  saveAllMarks(): void {
    const validRows = this.markEntryRows.filter(r => r.studentName.trim().length > 0);
    if (validRows.length === 0) {
      alert('Please enter at least one student mark.');
      return;
    }

    if (!this.markEntryAssessmentTitle.trim()) {
      alert('Please enter an Assessment Title.');
      return;
    }

    const marksToSave = validRows.map(r => ({
      student: r.studentName.trim(),
      assessment: this.markEntryAssessmentTitle.trim(),
      obtained: Number(r.obtained) || 0,
      maxMarks: Number(this.markEntryMaxMarks) || 100
    }));

    this.facultyDataService.bulkSaveMarks(marksToSave);
    this.closeMarkEntryModal();
    alert(`Successfully saved ${marksToSave.length} mark entries! Recalculating real-time attainment...`);
    this.loadDashboardData();
  }

  // ==========================================
  // QUESTION PAPER GENERATOR ACTIONS
  // ==========================================
  openQuestionPaperModal(): void {
    if (this.courses.length > 0) {
      this.qpSubject = this.courses[0].name;
    }
    this.isPaperGenerated = false;
    this.generatedPaperQuestions = [];
    this.showQuestionPaperModal = true;
  }

  closeQuestionPaperModal(): void {
    this.showQuestionPaperModal = false;
    this.isPaperGenerated = false;
  }

  generateQuestionPaper(): void {
    const storedQB = this.getSafeJson('obslmsQuestionBank') as QuestionBankItem[];
    if (storedQB.length === 0) {
      alert('Question Bank is currently empty. Please add questions in Question Bank first.');
      return;
    }

    // Selected CO codes
    const selectedCOs = Object.keys(this.qpCOs).filter(k => this.qpCOs[k]);
    if (selectedCOs.length === 0) {
      alert('Please select at least one Course Outcome (CO).');
      return;
    }

    // Filter questions matching subject and COs
    let pool = storedQB.filter(q => {
      const matchSubject = !this.qpSubject || q.subject.toLowerCase().includes(this.qpSubject.toLowerCase()) || this.qpSubject.toLowerCase().includes(q.subject.toLowerCase());
      const matchCO = selectedCOs.includes(q.coMapped);
      return matchSubject && matchCO;
    });

    // If pool is too small, fallback to matching COs across subjects
    if (pool.length === 0) {
      pool = storedQB.filter(q => selectedCOs.includes(q.coMapped));
    }

    if (pool.length === 0) {
      pool = storedQB; // Use all available questions
    }

    // Pick questions to reach target marks
    let accumulatedMarks = 0;
    const selected: QuestionBankItem[] = [];

    // Shuffle pool
    const shuffled = [...pool].sort(() => 0.5 - Math.random());

    for (const q of shuffled) {
      if (accumulatedMarks + q.marks <= this.qpTotalMarks + 5) {
        selected.push(q);
        accumulatedMarks += q.marks;
        if (accumulatedMarks >= this.qpTotalMarks) break;
      }
    }

    if (selected.length === 0 && pool.length > 0) {
      selected.push(pool[0]);
    }

    this.generatedPaperQuestions = selected;
    this.isPaperGenerated = true;
  }

  printQuestionPaper(): void {
    window.print();
  }

  // ==========================================
  // CQI (CONTINUOUS QUALITY IMPROVEMENT) ACTIONS
  // ==========================================
  openCqiModal(co?: CourseCOAttainmentSummary): void {
    if (co) {
      this.cqiCourse = co.courseName;
      this.cqiCoCode = co.coCode;
      this.cqiIssueDescription = `${co.coCode} attainment achieved is ${co.attainmentPercentage}%, which is below target ${co.targetPercentage}%.`;
    } else {
      this.cqiCourse = this.courses[0]?.name || '';
      this.cqiCoCode = 'CO1';
      this.cqiIssueDescription = 'Attainment threshold not met for analytical problems.';
    }
    this.cqiActionPlan = 'Conduct 2 remedial tutorial sessions and provide supplementary problem sheets.';
    this.cqiTargetDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
    this.showCqiModal = true;
  }

  closeCqiModal(): void {
    this.showCqiModal = false;
  }

  saveCqiAction(): void {
    if (!this.cqiCourse || !this.cqiIssueDescription || !this.cqiActionPlan) {
      alert('Please fill all required CQI fields.');
      return;
    }

    this.facultyDataService.saveCqiAction({
      courseName: this.cqiCourse,
      coCode: this.cqiCoCode,
      issueDescription: this.cqiIssueDescription,
      actionPlan: this.cqiActionPlan,
      targetDate: this.cqiTargetDate,
      status: 'Planned'
    });

    this.cqiActionsList = this.facultyDataService.getCqiActions();
    this.closeCqiModal();
    alert('CQI Action Plan recorded successfully.');
  }

  // ==========================================
  // AT-RISK STUDENT MODAL
  // ==========================================
  openAtRiskModal(student?: AtRiskStudent): void {
    if (student) {
      this.selectedAtRiskStudent = student;
      this.showAtRiskModal = true;
    }
  }

  closeAtRiskModal(): void {
    this.showAtRiskModal = false;
    this.selectedAtRiskStudent = null;
  }

  // ==========================================
  // NAVIGATION ROUTING
  // ==========================================
  goToCourses(): void {
    this.router.navigate(['/courses']);
  }

  goToStudentProgress(): void {
    this.router.navigate(['/performance']);
  }

  goToAssessments(): void {
    this.router.navigate(['/assessments']);
  }

  goToAttendance(): void {
    this.router.navigate(['/attendance']);
  }

  goToQuestionBank(): void {
    this.router.navigate(['/question-bank']);
  }

  goToExamination(): void {
    this.router.navigate(['/examination']);
  }

  goToGrievance(): void {
    this.router.navigate(['/grievance']);
  }

  goToCOAttainment(): void {
    this.router.navigate(['/co-attainment']);
  }

  goToNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  getSubmissionPercentage(assessment: Assessment): number {
    if (!assessment.totalCount || assessment.totalCount === 0) return 0;
    return Math.min(100, Math.round((assessment.submittedCount / assessment.totalCount) * 100));
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return '#10b981';
      case 'ongoing': return '#3b82f6';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  }

  private getSafeJson(key: string): any[] {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}




