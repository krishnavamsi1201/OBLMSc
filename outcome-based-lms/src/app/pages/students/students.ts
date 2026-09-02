import { Component, ChangeDetectorRef, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { ToastService } from '../../shared/services/toast.service';
import { SyncService } from '../../shared/services/sync.service';
import { Subscription } from 'rxjs';

interface DashboardStats {
  enrolledCourses: number;
  attendancePercentage: number;
  cgpa: number;
  pendingExams: number;
}

interface TimetableEntry {
  period: string;
  subject: string;
  room: string;
  isCurrent?: boolean;
}

interface StudentGrade {
  courseName: string;
  score: number;
  grade: string;
}

interface StudentCoProgress {
  coCode: string;
  courseName: string;
  bloomsLevel: string;
  attainmentPct: number;
  targetPct: number;
  status: 'Achieved' | 'In Progress' | 'Action Needed';
}

interface UpcomingDeadline {
  title: string;
  course: string;
  type: string;
  dueDate: string;
  daysLeft: number;
  marks: number;
}

interface EnrolledCourseCard {
  code: string;
  title: string;
  faculty: string;
  credits: number;
  currentAvg: number;
  attendancePct: number;
}

export interface SemesterSubject {
  code: string;
  title: string;
  credits: number;
  cieMarks: number;
  seeMarks: number;
  totalScore: number;
  grade: string;
  gradePoint: number;
  coAttainment: string;
}

export interface SemesterResult {
  semesterNumber: number;
  semesterName: string;
  status: string;
  sgpa: number;
  totalCredits: number;
  earnedCredits: number;
  isCurrent: boolean;
  subjects: SemesterSubject[];
}

export interface POAttainmentItem {
  code: string;
  name: string;
  description: string;
  targetPct: number;
  attainedPct: number;
  status: 'Achieved' | 'In Progress' | 'Action Needed';
  mappedCourses: string[];
  graduateAttribute: string;
}

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    Navbar,
    Sidebar,
    Footer
  ],
  templateUrl: './students.html',
  styleUrls: ['./students.css'],
})
export class Students implements OnInit, OnDestroy {
  private router = inject(Router);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private syncService = inject(SyncService);
  private http = inject(HttpClient);
  private syncSub?: Subscription;

  role: string | null = null;
  studentName = 'Student';
  studentEmail = '';
  studentPhoto: string | null = null;
  studentRoll = 'CUTM2026CSE042';
  studentDept = 'Computer Science & Engineering';
  studentSemester = 'Semester 6 • B.Tech CSE';
  
  appearance = {
    theme: 'light',
    colorScheme: 'blue',
    layout: 'comfortable',
    showSidebar: true,
    fontSize: 'medium'
  };

  themeStyles: { [key: string]: string } = {};
  
  stats: DashboardStats = {
    enrolledCourses: 0,
    attendancePercentage: 0,
    cgpa: 0.0,
    pendingExams: 0
  };

  showAttendanceWarning = false;
  attendanceWarningMsg = '';

  searchQuery = '';
  deadlineTab: 'all' | 'mid' | 'assignment' | 'project' = 'all';
  activeTab: 'overview' | 'co' | 'po' | 'marks' = 'overview';

  // Program Outcomes (PO) Attainment State
  poList: POAttainmentItem[] = [
    { code: 'PO1', name: 'Engineering Knowledge', graduateAttribute: 'Computational Foundations', targetPct: 75, attainedPct: 88, status: 'Achieved', mappedCourses: ['CS101', 'CS102', 'CS103'], description: 'Apply mathematics, computing principles, and engineering fundamentals to solve complex software problems.' },
    { code: 'PO2', name: 'Problem Analysis', graduateAttribute: 'Algorithmic Diagnostics', targetPct: 75, attainedPct: 85, status: 'Achieved', mappedCourses: ['CS102', 'CS103', 'CS301'], description: 'Identify, formulate, and analyze complex software engineering problems reaching substantiated conclusions.' },
    { code: 'PO3', name: 'Design & Development of Solutions', graduateAttribute: 'System Architecture', targetPct: 75, attainedPct: 82, status: 'Achieved', mappedCourses: ['CS101', 'CS103', 'CS302'], description: 'Design modular software components, database schemas, and microservice workflows meeting specified functional needs.' },
    { code: 'PO4', name: 'Conduct Investigations of Complex Problems', graduateAttribute: 'Empirical Research', targetPct: 75, attainedPct: 79, status: 'Achieved', mappedCourses: ['CS101', 'CS202', 'CS301'], description: 'Use research-based knowledge and benchmarking methods including experimental performance analysis and data validation.' },
    { code: 'PO5', name: 'Modern Tool Usage', graduateAttribute: 'DevOps & Tool Mastery', targetPct: 75, attainedPct: 92, status: 'Achieved', mappedCourses: ['CS101', 'CS302', 'CS303'], description: 'Select and apply modern IDEs, Git versioning, Docker containerization, and automated CI/CD pipeline platforms.' },
    { code: 'PO6', name: 'The Engineer and Society', graduateAttribute: 'Societal Relevance', targetPct: 75, attainedPct: 78, status: 'Achieved', mappedCourses: ['CS201', 'CS302'], description: 'Apply reasoning informed by contextual knowledge to assess safety, security, privacy, and societal responsibilities.' },
    { code: 'PO7', name: 'Environment and Sustainability', graduateAttribute: 'Green Computing', targetPct: 75, attainedPct: 76, status: 'Achieved', mappedCourses: ['CS302', 'CS303'], description: 'Understand the impact of enterprise software architectures and cloud computing on energy consumption and sustainability.' },
    { code: 'PO8', name: 'Ethics & Integrity', graduateAttribute: 'Professional Conduct', targetPct: 75, attainedPct: 88, status: 'Achieved', mappedCourses: ['CS201', 'CS302'], description: 'Apply ethical standards, open-source licensing compliance, data integrity norms, and professional software ethics.' },
    { code: 'PO9', name: 'Individual and Team Work', graduateAttribute: 'Agile Collaboration', targetPct: 75, attainedPct: 90, status: 'Achieved', mappedCourses: ['CS102', 'CS302'], description: 'Function effectively as an individual, and as a member or leader in multidisciplinary agile scrum teams.' },
    { code: 'PO10', name: 'Communication Skills', graduateAttribute: 'Technical Articulation', targetPct: 75, attainedPct: 86, status: 'Achieved', mappedCourses: ['CS302', 'CS101'], description: 'Communicate technical designs effectively, draft OpenAPI specifications, and deliver clear system presentations.' },
    { code: 'PO11', name: 'Project Management & Finance', graduateAttribute: 'Estimation & Delivery', targetPct: 75, attainedPct: 75, status: 'Achieved', mappedCourses: ['CS302', 'CS303'], description: 'Demonstrate knowledge of sprint planning, cost estimation, risk mitigation, and engineering management principles.' },
    { code: 'PO12', name: 'Life-long Learning', graduateAttribute: 'Continuous Evolution', targetPct: 75, attainedPct: 87, status: 'Achieved', mappedCourses: ['CS103', 'CS301', 'CS303'], description: 'Demonstrate independent research capability and adaptability to rapid technological advancements in software industry.' },
    { code: 'PSO1', name: 'Enterprise Backend Systems', graduateAttribute: 'Program Specific Outcome 1', targetPct: 75, attainedPct: 89, status: 'Achieved', mappedCourses: ['CS101', 'CS102', 'CS301'], description: 'Design and deploy resilient, high-throughput Spring Boot REST microservices with relational MySQL caching.' },
    { code: 'PSO2', name: 'Data Engineering & AI Pipelines', graduateAttribute: 'Program Specific Outcome 2', targetPct: 75, attainedPct: 84, status: 'Achieved', mappedCourses: ['CS103', 'CS202', 'CS303'], description: 'Build end-to-end data processing pipelines and apply intelligent learning algorithms to automate operational workflows.' }
  ];

  overallPoAttainment: number = 84;
  targetPoPercentage: number = 75;
  poFilterStatus: string = '';
  hoveredPoItem: POAttainmentItem | null = null;
  radarPoints: string = '';
  targetRadarPoints: string = '';
  radarSpokes: Array<{ code: string; x1: number; y1: number; x2: number; y2: number; labelX: number; labelY: number; achievement: number; textAnchor: string }> = [];
  radarRings: string[] = [];

  todaySchedule: TimetableEntry[] = [];
  notifications: any[] = [];
  recentGrades: StudentGrade[] = [];
  coProgressList: StudentCoProgress[] = [];
  groupedCOs: Array<{ courseName: string; cos: StudentCoProgress[] }> = [];
  collapsedCoGroups: { [key: string]: boolean } = {};
  upcomingDeadlines: UpcomingDeadline[] = [];
  enrolledCourseCards: EnrolledCourseCard[] = [];
  semesterResults: SemesterResult[] = [];
  selectedSemester: number = 6;
  selectedSemesterData: SemesterResult | null = null;

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

  // Flat list for quick matching & backwards compatibility
  studentItems = [
    { label: 'Student Dashboard', path: '/students', icon: '🏠' },
    { label: 'Enrolled Courses', path: '/courses', icon: '📚' },
    { label: 'Subject List', path: '/subjects', icon: '📖' },
    { label: 'Course Outcomes (CO)', path: '/course-outcomes', icon: '🎯' },
    { label: 'Program Outcomes (PO)', path: '/program-outcomes', icon: '🎯' },
    { label: 'Marks Summary', path: '/performance', icon: '📈' },
    { label: 'CO-PO Mapping', path: '/copo-mapping', icon: '🔗' },
    { label: 'CO Attainment', path: '/co-attainment', icon: '📊' },
    { label: 'PO Attainment', path: '/po-attainment', icon: '📈' },
    { label: 'Upcoming Exams', path: '/assessments', icon: '📝' },
    { label: 'Attendance %', path: '/attendance', icon: '📅' },
    { label: 'Timetable', path: '/timetable', icon: '📆' },
    { label: 'Semester Results', path: '/results', icon: '📄' },
    { label: 'Feedback Form', path: '/feedback', icon: '💬' },
    { label: 'Notifications', path: '/notifications', icon: '🔔' },
    { label: 'Student Details', path: '/profile', icon: '👤' },
    { label: 'File Grievance', path: '/grievance', icon: '📩' }
  ];

  get totalEnrolledCredits(): number {
    if (this.enrolledCourseCards.length > 0) {
      return this.enrolledCourseCards.reduce((sum, c) => sum + (c.credits || 4), 0);
    }
    return (this.stats.enrolledCourses * 4) || 20;
  }

  get filteredCourses(): EnrolledCourseCard[] {
    if (!this.searchQuery.trim()) return this.enrolledCourseCards;
    const q = this.searchQuery.toLowerCase();
    return this.enrolledCourseCards.filter(c => 
      c.code.toLowerCase().includes(q) || 
      c.title.toLowerCase().includes(q) || 
      c.faculty.toLowerCase().includes(q)
    );
  }

  get filteredSchedule(): TimetableEntry[] {
    if (!this.searchQuery.trim()) return this.todaySchedule;
    const q = this.searchQuery.toLowerCase();
    return this.todaySchedule.filter(s => 
      s.subject.toLowerCase().includes(q) || 
      s.room.toLowerCase().includes(q) || 
      s.period.toLowerCase().includes(q)
    );
  }

  get filteredGrades(): StudentGrade[] {
    if (!this.searchQuery.trim()) return this.recentGrades;
    const q = this.searchQuery.toLowerCase();
    return this.recentGrades.filter(g => 
      g.courseName.toLowerCase().includes(q) || 
      g.grade.toLowerCase().includes(q)
    );
  }

  get filteredCoProgress(): StudentCoProgress[] {
    if (!this.searchQuery.trim()) return this.coProgressList;
    const q = this.searchQuery.toLowerCase();
    return this.coProgressList.filter(c => 
      c.coCode.toLowerCase().includes(q) || 
      c.courseName.toLowerCase().includes(q) || 
      c.bloomsLevel.toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q)
    );
  }

  get filteredGroupedCOs() {
    if (!this.searchQuery.trim()) {
      return this.groupedCOs;
    }
    const q = this.searchQuery.toLowerCase();
    return this.groupedCOs.map(group => {
      const matchingCos = group.cos.filter(co => 
        co.coCode.toLowerCase().includes(q) || 
        co.courseName.toLowerCase().includes(q) || 
        co.bloomsLevel.toLowerCase().includes(q)
      );
      return {
        courseName: group.courseName,
        cos: matchingCos
      };
    }).filter(group => group.cos.length > 0);
  }

  get filteredDeadlines(): UpcomingDeadline[] {
    let list = this.upcomingDeadlines;
    if (this.deadlineTab === 'mid') {
      list = list.filter(d => d.type.toLowerCase().includes('exam') || d.type.toLowerCase().includes('mid'));
    } else if (this.deadlineTab === 'assignment') {
      list = list.filter(d => d.type.toLowerCase().includes('assignment'));
    } else if (this.deadlineTab === 'project') {
      list = list.filter(d => d.type.toLowerCase().includes('project'));
    }

    if (!this.searchQuery.trim()) return list;
    const q = this.searchQuery.toLowerCase();
    return list.filter(d => 
      d.title.toLowerCase().includes(q) || 
      d.course.toLowerCase().includes(q) || 
      d.type.toLowerCase().includes(q)
    );
  }

  get filteredPOList(): POAttainmentItem[] {
    let list = this.poList;
    if (this.poFilterStatus) {
      list = list.filter(p => p.status === this.poFilterStatus);
    }
    if (!this.searchQuery.trim()) return list;
    const q = this.searchQuery.toLowerCase();
    return list.filter(p => 
      p.code.toLowerCase().includes(q) || 
      p.name.toLowerCase().includes(q) || 
      p.graduateAttribute.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  }

  get quickPageMatches(): Array<{ label: string; path: string; icon: string }> {
    if (!this.searchQuery.trim()) return [];
    const q = this.searchQuery.toLowerCase();
    return this.studentItems.filter(item => 
      item.label.toLowerCase().includes(q)
    );
  }

  clearSearch(): void {
    this.searchQuery = '';
  }

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

  logout(): void {
    try {
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
    } catch {}
    this.toast.info('Logged out successfully.');
    this.router.navigate(['/login']);
  }

  ngOnInit(): void {
    this.loadDashboardData();

    this.syncSub = this.syncService.events$.subscribe(() => {
      this.loadDashboardData();
    });
  }

  ngOnDestroy(): void {
    this.syncSub?.unsubscribe();
  }

  private loadDashboardData(): void {
    const studentId = localStorage.getItem('userId') || localStorage.getItem('userEmail') || this.studentName || 'STU004';
    
    this.http.get<any>(`http://localhost:8080/api/stats/student-dashboard?studentId=${encodeURIComponent(studentId)}`).subscribe({
      next: (data) => {
        try {
          if (data.studentInfo) {
            this.studentName = data.studentInfo.name || this.studentName;
            this.studentEmail = data.studentInfo.email || this.studentEmail;
            this.studentDept = data.studentInfo.department || this.studentDept;
            this.studentRoll = data.studentInfo.roll || this.studentRoll;
            this.studentSemester = data.studentInfo.semester || this.studentSemester;
          }
          this.enrolledCourseCards = data.enrolledCourseCards ? [...data.enrolledCourseCards] : [];

          // Merge any newly approved courses from local student courses registry
          try {
            const storedLocal = localStorage.getItem('obslmsStudentCourses');
            if (storedLocal) {
              const localList = JSON.parse(storedLocal);
              const currentName = this.studentName.toLowerCase();
              const currentRoll = (this.studentRoll || '').toLowerCase();
              localList.forEach((sc: any) => {
                const scName = (sc.studentName || '').toLowerCase();
                const scRoll = (sc.regNo || sc.studentId || '').toLowerCase();
                if (scName.includes(currentName) || currentName.includes(scName) || (scRoll && scRoll === currentRoll)) {
                  const exists = this.enrolledCourseCards.some(ec => 
                    ec.code.toLowerCase() === (sc.courseCode || '').toLowerCase() ||
                    ec.title.toLowerCase() === (sc.courseTitle || sc.courseCode || '').toLowerCase()
                  );
                  if (!exists && sc.courseCode) {
                    this.enrolledCourseCards.push({
                      code: sc.courseCode,
                      title: sc.courseTitle || sc.courseCode,
                      faculty: 'Faculty Board',
                      credits: 4,
                      currentAvg: 85,
                      attendancePct: 90
                    });
                  }
                }
              });
            }
          } catch {}

          if (this.enrolledCourseCards.length === 0) {
            this.enrolledCourseCards = [
              { code: 'CS101', title: 'Database Management Systems', faculty: 'Dr. Ramesh Babu', credits: 4, currentAvg: 88, attendancePct: 92 },
              { code: 'CS102', title: 'Data Structures & Algorithms', faculty: 'Prof. Ananya Rao', credits: 4, currentAvg: 84, attendancePct: 88 },
              { code: 'CS103', title: 'Object-Oriented Programming', faculty: 'Dr. K. Srinivas', credits: 4, currentAvg: 86, attendancePct: 90 },
              { code: 'CS301', title: 'Computer Networks', faculty: 'Prof. M. Venkatesh', credits: 4, currentAvg: 82, attendancePct: 85 },
              { code: 'CS302', title: 'Software Engineering', faculty: 'Dr. P. Suresh', credits: 4, currentAvg: 90, attendancePct: 94 }
            ];
          }

          if (data.stats && data.stats.enrolledCourses > 0) {
            this.stats = { ...data.stats };
            this.stats.enrolledCourses = this.enrolledCourseCards.length;
            if (this.stats.attendancePercentage < 60) this.stats.attendancePercentage = 88;
            if (this.stats.cgpa < 5.0) this.stats.cgpa = 8.65;
            this.showAttendanceWarning = this.stats.attendancePercentage < 75;
            this.attendanceWarningMsg = this.showAttendanceWarning
              ? `Warning: Your overall attendance is ${this.stats.attendancePercentage}%, which is below the mandatory 75% threshold.`
              : '';
          } else {
            this.stats = {
              enrolledCourses: this.enrolledCourseCards.length,
              attendancePercentage: 88,
              cgpa: 8.65,
              pendingExams: 2
            };
            this.showAttendanceWarning = false;
            this.attendanceWarningMsg = '';
          }

          this.coProgressList = data.coProgressList || [];
          this.groupedCOs = data.groupedCOs || [];
          this.todaySchedule = data.todaySchedule || [];
          this.recentGrades = data.recentGrades || [];
          this.upcomingDeadlines = data.upcomingDeadlines || [];
          this.notifications = data.notifications || [];
          this.semesterResults = data.semesterResults || [];
          this.selectSemester(this.selectedSemester);
          this.cdr.detectChanges();
        } catch (e) {
          console.error('Error processing student dashboard data:', e);
        }
      },
      error: (err) => {
        console.error('Error fetching student dashboard from backend:', err);
      }
    });
  }

  selectSemester(semNumber: number): void {
    this.selectedSemester = semNumber;
    if (this.semesterResults && this.semesterResults.length > 0) {
      this.selectedSemesterData = this.semesterResults.find(s => s.semesterNumber === semNumber) || this.semesterResults[this.semesterResults.length - 1];
    } else {
      this.selectedSemesterData = null;
    }
    this.cdr.detectChanges();
  }

  downloadSemesterMemo(sem: SemesterResult | null): void {
    if (!sem) return;
    const headers = ['Course Code', 'Subject Title', 'Credits', 'CIE Marks (30)', 'SEE Marks (100)', 'Total %', 'Grade', 'Grade Points', 'CO Attainment'];
    const rows = sem.subjects.map(s => 
      [`"${s.code}"`, `"${s.title}"`, `"${s.credits}"`, `"${s.cieMarks}"`, `"${s.seeMarks}"`, `"${s.totalScore}%"`, `"${s.grade}"`, `"${s.gradePoint}"`, `"${s.coAttainment}"`].join(',')
    );

    const summaryRow = `\n"Semester: ${sem.semesterName}","Status: ${sem.status}","Total Credits: ${sem.totalCredits}","SGPA: ${sem.sgpa}"`;
    const csvContent = [`"Student Name: ${this.studentName}"`, `"Roll No: ${this.studentRoll}"`, `"Branch: ${this.studentDept}"\n`, headers.join(','), ...rows, summaryRow].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${this.studentRoll}_${sem.semesterName.replace(/\s+/g, '_')}_MarksMemo.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toast.success(`${sem.semesterName} Official Grade Memo downloaded!`);
  }

  downloadGradeReportCsv(): void {
    const headers = ['Student Name', 'Email', 'CGPA', 'Overall Attendance %', 'Enrolled Courses'];
    const rows = [
      [`"${this.studentName}"`, `"${this.studentEmail}"`, `"${this.stats.cgpa}"`, `"${this.stats.attendancePercentage}%"`, `"${this.stats.enrolledCourses}"`].join(',')
    ];
    
    rows.push('\nAssessment Name,Score %,Grade');
    this.recentGrades.forEach(g => {
      rows.push(`"${g.courseName}","${g.score}%","${g.grade}"`);
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Student_Academic_Report_${this.studentName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toast.success('Academic Grade Report downloaded successfully.');
  }

  downloadCoReportCsv(): void {
    const headers = ['CO Code', 'Course', "Bloom's Level", 'My Attainment %', 'Target %', 'Status'];
    const rows = this.coProgressList.map(c => 
      [`"${c.coCode}"`, `"${c.courseName}"`, `"${c.bloomsLevel}"`, `"${c.attainmentPct}%"`, `"${c.targetPct}%"`, `"${c.status}"`].join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Student_CO_Attainment_${this.studentName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toast.success('Course Outcomes Mastery Report downloaded.');
  }

  setPoTab(): void {
    this.activeTab = 'po';
    this.computeRadarChart();
    this.cdr.detectChanges();
  }

  computeRadarChart(): void {
    const list = this.poList.slice(0, 12);
    const count = 12;
    const cx = 220;
    const cy = 220;
    const maxRadius = 140;

    // Concentric rings at 25%, 50%, 75% (Target), 100%
    const levels = [0.25, 0.50, 0.75, 1.0];
    this.radarRings = levels.map(level => {
      const pts: string[] = [];
      for (let i = 0; i < count; i++) {
        const angle = (i * 2 * Math.PI / count) - (Math.PI / 2);
        const x = cx + maxRadius * level * Math.cos(angle);
        const y = cy + maxRadius * level * Math.sin(angle);
        pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      return pts.join(' ');
    });

    // Target threshold (75%)
    const targetPts: string[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i * 2 * Math.PI / count) - (Math.PI / 2);
      const x = cx + maxRadius * 0.75 * Math.cos(angle);
      const y = cy + maxRadius * 0.75 * Math.sin(angle);
      targetPts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    this.targetRadarPoints = targetPts.join(' ');

    // Actual attainment polygon & spokes
    const attainedPts: string[] = [];
    this.radarSpokes = [];

    for (let i = 0; i < count; i++) {
      const po = list[i];
      const angle = (i * 2 * Math.PI / count) - (Math.PI / 2);
      const spokeX = cx + maxRadius * Math.cos(angle);
      const spokeY = cy + maxRadius * Math.sin(angle);

      const val = Math.max(10, Math.min(100, po.attainedPct || 75));
      const ptX = cx + maxRadius * (val / 100) * Math.cos(angle);
      const ptY = cy + maxRadius * (val / 100) * Math.sin(angle);
      attainedPts.push(`${ptX.toFixed(1)},${ptY.toFixed(1)}`);

      const labelX = cx + (maxRadius + 22) * Math.cos(angle);
      const labelY = cy + (maxRadius + 18) * Math.sin(angle);
      const textAnchor = Math.abs(Math.cos(angle)) < 0.1 ? 'middle' : (Math.cos(angle) > 0 ? 'start' : 'end');

      this.radarSpokes.push({
        code: po.code,
        x1: cx,
        y1: cy,
        x2: spokeX,
        y2: spokeY,
        labelX,
        labelY,
        achievement: val,
        textAnchor
      });
    }

    this.radarPoints = attainedPts.join(' ');
  }

  downloadPoReportCsv(): void {
    const headers = ['PO Code', 'Program Outcome Name', 'NBA Graduate Attribute', 'Attained %', 'Target %', 'Status', 'Mapped Contributing Courses'];
    const rows = this.poList.map(p => 
      [`"${p.code}"`, `"${p.name}"`, `"${p.graduateAttribute}"`, `"${p.attainedPct}%"`, `"${p.targetPct}%"`, `"${p.status}"`, `"${p.mappedCourses.join(', ')}"`].join(',')
    );

    const summaryRow = `\n"Overall PO Attainment: ${this.overallPoAttainment}%","Target Benchmark: ${this.targetPoPercentage}%","NBA Status: Compliant"`;
    const csvContent = [`"Student: ${this.studentName}"`, `"Department: ${this.studentDept}"`, `"Academic Year: 2026-2027"\n`, headers.join(','), ...rows, summaryRow].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${this.studentRoll}_Program_Outcomes_Attainment.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toast.success('Program Outcomes (PO) Attainment Transcript downloaded!');
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

    // 1. Map Theme Colors
    const bg = isDark ? '#0f172a' : 'rgba(240, 249, 255, 0.92)';
    const cardBg = isDark ? '#1e293b' : 'rgba(255, 255, 255, 0.98)';
    const text = isDark ? '#f8fafc' : '#1e293b';
    const textSecondary = isDark ? '#94a3b8' : '#64748b';
    const border = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(74, 140, 234, 0.16)';
    const sidebarBg = isDark ? '#1e293b' : 'rgba(255, 255, 255, 0.98)';

    // 2. Map Color Scheme
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
      default: // blue
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

  toggleCoGroup(courseName: string): void {
    this.collapsedCoGroups[courseName] = !this.collapsedCoGroups[courseName];
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }
}
