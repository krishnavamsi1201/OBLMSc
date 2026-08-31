import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { SyncService } from '../../shared/services/sync.service';
import { ToastService } from '../../shared/services/toast.service';
import { Subscription } from 'rxjs';
import {
  FacultyDataService,
  Course,
  Assessment,
  StudentProgress,
  AtRiskStudent,
  CourseCOAttainmentSummary,
  GradeDistribution,
  Notification,
  SyllabusUnit,
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

interface AttendanceStudentRow {
  studentName: string;
  status: 'Present' | 'Absent';
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
  groupedCOAttainments: Array<{ courseName: string; cos: CourseCOAttainmentSummary[] }> = [];
  collapsedCoGroups: { [courseName: string]: boolean } = {};
  gradeDistribution: GradeDistribution = { distinction: 0, firstClass: 0, pass: 0, fail: 0, totalEvaluated: 0 };
  notifications: Notification[] = [];
  syllabusUnits: SyllabusUnit[] = [];
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
  selectedSubjectFilter = '';
  rawDashboardData: any = null;

  // Faculty task widgets
  examinationItems: ExaminationItem[] = [];
  grievanceItems: GrievanceItem[] = [];
  questionBankItems: QuestionBankItem[] = [];

  // Loading state
  isLoading = true;
  error: string | null = null;

  // ==========================================
  // MODAL 1: Quick Mark Entry Sheet & CSV Import/Export
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
  qpDifficulty = 'Balanced';
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

  // ==========================================
  // MODAL 5: One-Click Quick Attendance Sheet
  // ==========================================
  showQuickAttendanceModal = false;
  attendanceCourse = '';
  attendanceDate = '';
  attendanceStudentList: AttendanceStudentRow[] = [];

  // ==========================================
  // MODAL 6: Syllabus & Lecture Log
  // ==========================================
  showAddLectureModal = false;
  lectureCourse = '';
  lectureUnit = 1;
  lectureTopic = '';
  lectureCO = 'CO1';
  lectureDate = '';

  // ==========================================
  // MODAL 7: NBA / NAAC Course File Dossier Exporter
  // ==========================================
  showCourseFileModal = false;
  selectedDossierCourse = '';
  dossierCourseData: Course | null = null;
  dossierCOs: CourseCOAttainmentSummary[] = [];
  dossierAssessments: Assessment[] = [];
  dossierStudents: StudentProgress[] = [];
  private syncService = inject(SyncService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private syncSub?: Subscription;

  constructor(
    private facultyDataService: FacultyDataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.facultyName = this.facultyDataService.getCurrentFacultyName() || 'Faculty Member';
    this.attendanceDate = new Date().toISOString().split('T')[0];
    this.lectureDate = new Date().toISOString().split('T')[0];
    this.loadDashboardData();

    this.syncSub = this.syncService.events$.subscribe(() => {
      this.loadDashboardData();
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.syncSub?.unsubscribe();
  }

  /**
   * Load real-time faculty dashboard data
   */
  loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;

    this.facultyDataService.getFacultyDashboardData().subscribe({
      next: (data) => {
        this.rawDashboardData = data;
        
        // Load workbench widget data directly from storage
        this.loadWorkbenchData();

        // Load CQI actions
        this.cqiActionsList = this.facultyDataService.getCqiActions();

        // Apply selected subject filter on the dataset
        this.applySubjectFilter();

        // Update subjects list for question paper generator
        const storedQB = this.getSafeJson('obslmsQuestionBank') as QuestionBankItem[];
        const subs = storedQB.map(q => q.subject).filter(Boolean);
        this.allSubjectsList = Array.from(new Set([...subs, ...data.courses.map((c: any) => c.name)]));

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading real-time dashboard data:', err);
        this.error = 'Failed to load real-time analytics. Please try again.';
        this.isLoading = false;
      }
    });
  }

  applySubjectFilter(): void {
    if (!this.rawDashboardData) return;

    const data = this.rawDashboardData;
    const filter = this.selectedSubjectFilter;

    if (!filter) {
      // Show all data combined
      this.courses = data.courses;
      this.activeAssessments = data.activeAssessments;
      this.studentProgressList = data.studentProgressSummary;
      this.filteredProgressList = [...this.studentProgressList];
      this.atRiskStudents = data.atRiskStudents;
      this.courseCOAttainments = data.courseCOAttainments;
      this.gradeDistribution = data.gradeDistribution;
      this.notifications = data.notifications;
      this.syllabusUnits = data.syllabusUnits;

      this.totalCourses = data.totalCourses;
      this.totalStudents = data.totalStudents;
      this.overallAttainment = data.overallAttainment;
      this.averageAttendance = data.averageAttendance;
      this.activeAssessmentsCount = data.activeAssessmentsCount;
      this.atRiskCount = data.atRiskCount;
      this.pendingNotificationsCount = this.notifications.filter(n => !n.read).length;
    } else {
      // Filter dashboard contents strictly by selected subject
      this.courses = data.courses.filter((c: any) => c.name === filter || c.code === filter);
      this.activeAssessments = data.activeAssessments.filter((a: any) => a.courseName === filter);
      this.studentProgressList = data.studentProgressSummary.filter((sp: any) => sp.courseName.toLowerCase().includes(filter.toLowerCase()));
      this.filteredProgressList = [...this.studentProgressList];
      this.atRiskStudents = data.atRiskStudents.filter((ar: any) => ar.courseName.toLowerCase().includes(filter.toLowerCase()));
      this.courseCOAttainments = data.courseCOAttainments.filter((co: any) => co.courseName === filter);
      
      // Recalculate syllabus units dynamically
      this.syllabusUnits = this.getDynamicSyllabusUnits(filter);

      // Recalculate statistics for selected subject
      this.totalCourses = this.courses.length;
      
      const uniqueStudents = new Set<string>();
      this.studentProgressList.forEach(sp => uniqueStudents.add(sp.studentName.toLowerCase()));
      this.totalStudents = uniqueStudents.size;

      const validCOs = this.courseCOAttainments.filter(co => co.attainmentPercentage > 0);
      this.overallAttainment = validCOs.length > 0
        ? Math.round(validCOs.reduce((sum, co) => sum + co.attainmentPercentage, 0) / validCOs.length)
        : 0;

      const validProgress = this.studentProgressList.filter(sp => sp.attendance > 0);
      this.averageAttendance = validProgress.length > 0
        ? Math.round(validProgress.reduce((sum, sp) => sum + sp.attendance, 0) / validProgress.length)
        : 0;

      this.activeAssessmentsCount = this.activeAssessments.filter((a: any) => a.status === 'ongoing' || a.status === 'pending').length;
      this.atRiskCount = this.atRiskStudents.length;
      this.pendingNotificationsCount = data.notifications.filter((n: any) => !n.read).length;

      // Recalculate Grade Distribution for selected subject
      this.recalculateGradeDistributionForSubject(filter);
    }

    // Regroup Course Outcomes by Course Name
    const groups = new Map<string, CourseCOAttainmentSummary[]>();
    this.courseCOAttainments.forEach(co => {
      const cName = co.courseName || 'General Course';
      if (!groups.has(cName)) {
        groups.set(cName, []);
      }
      groups.get(cName)!.push(co);
    });
    this.groupedCOAttainments = Array.from(groups.keys()).map(cName => ({
      courseName: cName,
      cos: groups.get(cName)!
    }));
  }

  toggleCoGroup(courseName: string): void {
    this.collapsedCoGroups[courseName] = !this.collapsedCoGroups[courseName];
  }

  private getDynamicSyllabusUnits(courseName: string): any[] {
    const storedLogs = this.getSafeJson('obslmsLectureLogs');
    const isJava = courseName.toLowerCase().includes('java') || courseName.toLowerCase().includes('oop');
    
    const units = isJava ? [
      { unitNumber: 1, title: 'Unit 1: Java basics, JVM, Classes & Objects', mappedCO: 'CO1', plannedLectures: 9, completedLectures: 0, status: 'Planned' },
      { unitNumber: 2, title: 'Unit 2: Inheritance, Polymorphism & Interfaces', mappedCO: 'CO2', plannedLectures: 10, completedLectures: 0, status: 'Planned' },
      { unitNumber: 3, title: 'Unit 3: Exception Handling & Multithreading', mappedCO: 'CO3', plannedLectures: 10, completedLectures: 0, status: 'Planned' },
      { unitNumber: 4, title: 'Unit 4: I/O Streams, Collections & Generics', mappedCO: 'CO4', plannedLectures: 8, completedLectures: 0, status: 'Planned' },
      { unitNumber: 5, title: 'Unit 5: GUI Programming using Swing/JavaFX', mappedCO: 'CO5', plannedLectures: 8, completedLectures: 0, status: 'Planned' },
    ] : [
      { unitNumber: 1, title: 'Unit 1: Foundations & Architecture', mappedCO: 'CO1', plannedLectures: 9, completedLectures: 0, status: 'Planned' },
      { unitNumber: 2, title: 'Unit 2: Relational Model & SQL Queries', mappedCO: 'CO2', plannedLectures: 10, completedLectures: 0, status: 'Planned' },
      { unitNumber: 3, title: 'Unit 3: Normalization & Indexing', mappedCO: 'CO3', plannedLectures: 10, completedLectures: 0, status: 'Planned' },
      { unitNumber: 4, title: 'Unit 4: Transaction & Concurrency Control', mappedCO: 'CO4', plannedLectures: 8, completedLectures: 0, status: 'Planned' },
      { unitNumber: 5, title: 'Unit 5: Advanced & Distributed Systems', mappedCO: 'CO5', plannedLectures: 8, completedLectures: 0, status: 'Planned' },
    ];

    return units.map(unit => {
      const logsForUnit = storedLogs.filter((l: any) => 
        Number(l.unitNumber) === unit.unitNumber && 
        (l.courseName || '').toLowerCase().includes(courseName.toLowerCase())
      );
      const completed = logsForUnit.length;
      let status: 'Completed' | 'In Progress' | 'Planned' = 'Planned';
      if (completed >= unit.plannedLectures) {
        status = 'Completed';
      } else if (completed > 0) {
        status = 'In Progress';
      }
      return { ...unit, completedLectures: completed, status };
    });
  }

  private recalculateGradeDistributionForSubject(courseName: string): void {
    const marks = this.getSafeJson('obslmsMarkEntries');
    let distinction = 0;
    let firstClass = 0;
    let pass = 0;
    let fail = 0;
    let totalEvaluated = 0;

    marks.forEach((m: any) => {
      if (m.obtained !== undefined && m.maxMarks && m.assessment && m.assessment.toLowerCase().includes(courseName.toLowerCase())) {
        const pct = (Number(m.obtained) / Number(m.maxMarks)) * 100;
        totalEvaluated++;
        if (pct >= 75) distinction++;
        else if (pct >= 60) firstClass++;
        else if (pct >= 40) pass++;
        else fail++;
      }
    });

    this.gradeDistribution = { distinction, firstClass, pass, fail, totalEvaluated };
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
  // 1. QUICK MARKS ENTRY & CSV BATCH ACTIONS
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

  downloadCsvTemplate(): void {
    let csvContent = 'Student Name,Marks Obtained,Max Marks\n';
    if (this.markEntryRows.length > 0) {
      this.markEntryRows.forEach(r => {
        csvContent += `"${r.studentName}",${r.obtained || 0},${this.markEntryMaxMarks}\n`;
      });
    } else {
      csvContent += '"Student A",80,100\n"Student B",75,100\n"Student C",60,100\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${this.markEntryAssessmentTitle.replace(/\s+/g, '_')}_Marks_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  onCsvFileSelected(event: any): void {
    const file = event.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length <= 1) {
        alert('CSV file is empty or missing data rows.');
        return;
      }

      // Skip header line
      const parsedRows: MarkEntryRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.replace(/^"|"$/g, '').trim());
        if (parts[0]) {
          parsedRows.push({
            studentName: parts[0],
            obtained: Number(parts[1]) || 0
          });
        }
      }

      if (parsedRows.length > 0) {
        this.markEntryRows = parsedRows;
        alert(`Successfully imported ${parsedRows.length} student scores from CSV!`);
      }
    };
    reader.readAsText(file);
  }

  exportGradebookCsv(): void {
    let csvContent = 'Student Name,Course,CO Attainment %,Attendance %,Assessments\n';
    this.filteredProgressList.forEach(sp => {
      csvContent += `"${sp.studentName}","${sp.courseName}",${sp.coAttainment}%,${sp.attendance}%,${sp.totalAssessments}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `OBE_Gradebook_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ==========================================
  // 2. ONE-CLICK QUICK ATTENDANCE SHEET
  // ==========================================
  openQuickAttendanceModal(courseName?: string): void {
    this.attendanceCourse = courseName || this.courses[0]?.name || 'Database Management Systems';
    this.attendanceDate = new Date().toISOString().split('T')[0];

    const allStudents = this.getSafeJson('obslmsStudents');
    const existingAttendance = this.getSafeJson('obslmsAttendance');
    const allCourses = this.getSafeJson('obslmsCourses');

    const matchedCourse = allCourses.find((c: any) => 
      c.title === this.attendanceCourse || 
      c.code === this.attendanceCourse || 
      c.name === this.attendanceCourse
    );
    const courseCode = matchedCourse ? matchedCourse.code : this.attendanceCourse;
    const courseTitle = matchedCourse ? matchedCourse.title : this.attendanceCourse;

    // Get unique student names enrolled in the course
    const studentsSet = new Set<string>();
    allStudents.forEach((s: any) => {
      if (this.isStudentEnrolledInCourse(s.enrolledCourses || '', this.attendanceCourse) && (s.name || s.studentName)) {
        studentsSet.add(s.name || s.studentName);
      }
    });

    if (studentsSet.size === 0) {
      studentsSet.add('Raj Kumar');
      studentsSet.add('Aarav Mehta');
      studentsSet.add('Aditya Sen');
    }

    // Check if attendance already recorded today for this course
    this.attendanceStudentList = Array.from(studentsSet).map(sName => {
      const existing = existingAttendance.find(
        (a: any) => a.student && a.student.toLowerCase() === sName.toLowerCase() && a.course && a.course.toLowerCase().includes(this.attendanceCourse.toLowerCase()) && a.date === this.attendanceDate
      );
      return {
        studentName: sName,
        status: existing ? (existing.status as 'Present' | 'Absent') : 'Present'
      };
    });

    this.showQuickAttendanceModal = true;
  }

  closeQuickAttendanceModal(): void {
    this.showQuickAttendanceModal = false;
    this.attendanceStudentList = [];
  }

  markAllAttendance(status: 'Present' | 'Absent'): void {
    this.attendanceStudentList.forEach(s => s.status = status);
  }

  onQuickAttendanceCourseChanged(): void {
    const allStudents = this.getSafeJson('obslmsStudents');
    const existingAttendance = this.getSafeJson('obslmsAttendance');
    const allCourses = this.getSafeJson('obslmsCourses');

    const matchedCourse = allCourses.find((c: any) => 
      c.title === this.attendanceCourse || 
      c.code === this.attendanceCourse || 
      c.name === this.attendanceCourse
    );
    const courseCode = matchedCourse ? matchedCourse.code : this.attendanceCourse;
    const courseTitle = matchedCourse ? matchedCourse.title : this.attendanceCourse;

    const studentsSet = new Set<string>();
    allStudents.forEach((s: any) => {
      if (this.isStudentEnrolledInCourse(s.enrolledCourses || '', this.attendanceCourse) && (s.name || s.studentName)) {
        studentsSet.add(s.name || s.studentName);
      }
    });

    if (studentsSet.size === 0) {
      studentsSet.add('Raj Kumar');
      studentsSet.add('Aarav Mehta');
      studentsSet.add('Aditya Sen');
    }

    this.attendanceStudentList = Array.from(studentsSet).map(sName => {
      const existing = existingAttendance.find(
        (a: any) => a.student && a.student.toLowerCase() === sName.toLowerCase() && 
                    a.course && a.course.toLowerCase().includes(this.attendanceCourse.toLowerCase()) && 
                    a.date === this.attendanceDate
      );
      return {
        studentName: sName,
        status: existing ? (existing.status as 'Present' | 'Absent') : 'Present'
      };
    });
  }

  setStudentStatus(index: number, status: 'Present' | 'Absent'): void {
    if (this.attendanceStudentList[index]) {
      this.attendanceStudentList[index].status = status;
    }
  }

  toggleAttendance(index: number): void {
    if (this.attendanceStudentList[index]) {
      this.attendanceStudentList[index].status = this.attendanceStudentList[index].status === 'Present' ? 'Absent' : 'Present';
    }
  }

  saveQuickAttendance(): void {
    if (!this.attendanceCourse || this.attendanceStudentList.length === 0) {
      this.toast.warning('No attendance records to save.');
      return;
    }

    const records = this.attendanceStudentList.map(s => ({
      student: s.studentName,
      course: this.attendanceCourse,
      date: this.attendanceDate,
      status: s.status
    }));

    this.facultyDataService.saveBulkAttendance(records);
    this.syncService.emit('ATTENDANCE_CHANGED');
    this.closeQuickAttendanceModal();
    this.toast.success(`Attendance for ${records.length} students recorded for ${this.attendanceDate}! 🎉`);
    this.loadDashboardData();
  }

  // ==========================================
  // 3. SYLLABUS & LESSON PLAN LOGGER
  // ==========================================
  openAddLectureModal(unit?: SyllabusUnit): void {
    this.lectureCourse = this.courses[0]?.name || 'Database Management Systems';
    this.lectureUnit = unit ? unit.unitNumber : 1;
    this.lectureCO = unit ? unit.mappedCO : 'CO1';
    this.lectureTopic = '';
    this.lectureDate = new Date().toISOString().split('T')[0];
    this.showAddLectureModal = true;
  }

  closeAddLectureModal(): void {
    this.showAddLectureModal = false;
  }

  saveLecture(): void {
    if (!this.lectureTopic.trim()) {
      alert('Please enter a lecture topic.');
      return;
    }

    this.facultyDataService.saveLectureLog({
      courseName: this.lectureCourse,
      unitNumber: this.lectureUnit,
      topic: this.lectureTopic.trim(),
      mappedCO: this.lectureCO,
      date: this.lectureDate,
      durationMinutes: 50
    });

    this.closeAddLectureModal();
    alert('Lecture delivery logged successfully! Updating syllabus coverage...');
    this.loadDashboardData();
  }

  // ==========================================
  // 4. QUESTION PAPER GENERATOR ACTIONS
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

    const selectedCOs = Object.keys(this.qpCOs).filter(k => this.qpCOs[k]);
    if (selectedCOs.length === 0) {
      alert('Please select at least one Course Outcome (CO).');
      return;
    }

    let pool = storedQB.filter(q => {
      const matchSubject = !this.qpSubject || q.subject.toLowerCase().includes(this.qpSubject.toLowerCase()) || this.qpSubject.toLowerCase().includes(q.subject.toLowerCase());
      const matchCO = selectedCOs.includes(q.coMapped);
      return matchSubject && matchCO;
    });

    if (pool.length === 0) {
      pool = storedQB.filter(q => selectedCOs.includes(q.coMapped));
    }

    if (pool.length === 0) {
      pool = storedQB;
    }

    let accumulatedMarks = 0;
    const selected: QuestionBankItem[] = [];
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
  // 5. NBA / NAAC COURSE FILE DOSSIER EXPORTER
  // ==========================================
  openCourseFileModal(courseName?: string): void {
    const targetCourse = courseName || this.courses[0]?.name || '';
    this.selectedDossierCourse = targetCourse;
    this.dossierCourseData = this.courses.find(c => c.name === targetCourse) || this.courses[0] || null;
    this.dossierCOs = this.courseCOAttainments.filter(co => !targetCourse || co.courseName.toLowerCase().includes(targetCourse.toLowerCase()));
    this.dossierAssessments = this.activeAssessments.filter(a => !targetCourse || a.courseName.toLowerCase().includes(targetCourse.toLowerCase()));
    this.dossierStudents = this.studentProgressList.filter(sp => !targetCourse || sp.courseName.toLowerCase().includes(targetCourse.toLowerCase()));
    this.showCourseFileModal = true;
  }

  closeCourseFileModal(): void {
    this.showCourseFileModal = false;
  }

  printCourseFile(): void {
    window.print();
  }

  // ==========================================
  // 6. CQI ACTIONS
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
  // 7. AT-RISK STUDENT MODAL
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
  // ROUTING & HELPERS
  // ==========================================
  goToCourses(): void { this.router.navigate(['/courses']); }
  goToStudentProgress(): void { this.router.navigate(['/performance']); }
  goToAssessments(): void { this.router.navigate(['/assessments']); }
  goToAttendance(): void { this.router.navigate(['/attendance']); }
  goToQuestionBank(): void { this.router.navigate(['/question-bank']); }
  goToExamination(): void { this.router.navigate(['/examination']); }
  goToGrievance(): void { this.router.navigate(['/grievance']); }
  goToCOAttainment(): void { this.router.navigate(['/co-attainment']); }
  goToNotifications(): void { this.router.navigate(['/notifications']); }

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

  isStudentEnrolledInCourse(enrolledString: string, courseNameOrCode: string): boolean {
    if (!enrolledString || !courseNameOrCode) return false;

    const enrolled = enrolledString.split(',').map(s => s.trim().toLowerCase());
    const target = courseNameOrCode.toLowerCase();

    // Direct match
    if (enrolled.includes(target)) return true;

    // Check mapping abbreviations
    return enrolled.some(c => {
      if (c === 'inmca202' && (target.includes('database') || target.includes('cs101'))) return true;
      if (c === 'ds' && (target.includes('structures') || target.includes('algorithms') || target.includes('cs102'))) return true;
      if (c === 'oop' && (target.includes('programming') || target.includes('java') || target.includes('cs103'))) return true;
      if (c === 'mes' && (target.includes('microprocessors') || target.includes('cs104') || target.includes('embedded'))) return true;
      if (c === 'it305' && (target.includes('operating') || target.includes('cs201') || target.includes('systems'))) return true;
      
      // General substring checks
      return target.includes(c) || c.includes(target);
    });
  }
}




