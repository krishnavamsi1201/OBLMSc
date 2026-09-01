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
  activeTab: 'overview' | 'co' | 'marks' = 'overview';

  todaySchedule: TimetableEntry[] = [];
  notifications: any[] = [];
  recentGrades: StudentGrade[] = [];
  coProgressList: StudentCoProgress[] = [];
  groupedCOs: Array<{ courseName: string; cos: StudentCoProgress[] }> = [];
  collapsedCoGroups: { [key: string]: boolean } = {};
  upcomingDeadlines: UpcomingDeadline[] = [];
  enrolledCourseCards: EnrolledCourseCard[] = [];

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
          if (data.stats) {
            this.stats = data.stats;
            this.showAttendanceWarning = this.stats.attendancePercentage < 75;
            this.attendanceWarningMsg = this.showAttendanceWarning
              ? `Warning: Your overall attendance is ${this.stats.attendancePercentage}%, which is below the mandatory 75% threshold.`
              : '';
          }
          this.enrolledCourseCards = data.enrolledCourseCards || [];
          this.coProgressList = data.coProgressList || [];
          this.groupedCOs = data.groupedCOs || [];
          this.todaySchedule = data.todaySchedule || [];
          this.recentGrades = data.recentGrades || [];
          this.upcomingDeadlines = data.upcomingDeadlines || [];
          this.notifications = data.notifications || [];
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
