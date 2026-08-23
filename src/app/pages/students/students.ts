import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { ToastService } from '../../shared/services/toast.service';

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
export class Students implements OnInit {
  private router = inject(Router);
  private toast = inject(ToastService);

  role: string | null = null;
  studentName = 'Student';
  studentEmail = '';
  studentPhoto: string | null = null;
  studentRoll = 'CUTM2026CSE042';
  studentDept = 'Computer Science & Engineering';
  studentSemester = 'Semester 6 • B.Tech CSE';
  
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

  todaySchedule: TimetableEntry[] = [];
  notifications: any[] = [];
  recentGrades: StudentGrade[] = [];
  coProgressList: StudentCoProgress[] = [];
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
  }

  private loadDashboardData(): void {
    try {
      // 1. Courses
      const storedCourses = localStorage.getItem('obslmsCourses');
      const courses = storedCourses ? JSON.parse(storedCourses) : [];
      this.stats.enrolledCourses = courses.length;

      // 2. Attendance & Marks for computing per-course metrics
      const storedAttendance = localStorage.getItem('obslmsAttendance');
      const attendance = storedAttendance ? JSON.parse(storedAttendance) : [];
      const myAttendance = attendance.filter((a: any) => 
        a.student && a.student.toLowerCase() === this.studentName.toLowerCase()
      );

      const storedMarks = localStorage.getItem('obslmsMarkEntries');
      const marks = storedMarks ? JSON.parse(storedMarks) : [];
      const myMarks = marks.filter((m: any) => 
        m.student && m.student.toLowerCase() === this.studentName.toLowerCase()
      );

      // Build Enrolled Course Cards dynamically
      this.enrolledCourseCards = courses.map((c: any) => {
        const courseAttendance = myAttendance.filter((a: any) => 
          a.course && a.course.toLowerCase().includes(c.title?.toLowerCase() || c.code?.toLowerCase())
        );
        const attPct = courseAttendance.length > 0
          ? Math.round((courseAttendance.filter((a: any) => a.status === 'Present').length / courseAttendance.length) * 100)
          : (myAttendance.length > 0 ? this.stats.attendancePercentage : 0);

        const courseMarks = myMarks.filter((m: any) =>
          m.assessment && m.assessment.toLowerCase().includes(c.title?.toLowerCase() || c.code?.toLowerCase())
        );
        let currentAvg = 0;
        if (courseMarks.length > 0) {
          const obt = courseMarks.reduce((sum: number, m: any) => sum + (Number(m.obtained) || 0), 0);
          const max = courseMarks.reduce((sum: number, m: any) => sum + (Number(m.maxMarks) || 100), 0);
          currentAvg = max > 0 ? Math.round((obt / max) * 100) : 0;
        }

        return {
          code: c.code || 'COURSE',
          title: c.title || 'Course Title',
          faculty: c.faculty || 'Assigned Faculty',
          credits: c.credits || 3,
          currentAvg: currentAvg,
          attendancePct: attPct
        };
      });

      // Compute overall attendance
      if (myAttendance.length > 0) {
        const present = myAttendance.filter((a: any) => a.status === 'Present').length;
        this.stats.attendancePercentage = Math.round((present / myAttendance.length) * 100);
      } else {
        this.stats.attendancePercentage = 72; // Fallback for low attendance warning demo
      }

      // Check attendance warning
      if (myAttendance.length > 0 && this.stats.attendancePercentage < 75) {
        this.showAttendanceWarning = true;
        this.attendanceWarningMsg = `Overall attendance is at ${this.stats.attendancePercentage}%. University OBE regulations require minimum 75% for exam eligibility.`;
      } else {
        const lowCourse = this.enrolledCourseCards.find(c => c.attendancePct < 75 && c.attendancePct > 0);
        if (lowCourse) {
          this.showAttendanceWarning = true;
          this.attendanceWarningMsg = `Attendance in ${lowCourse.title} is at ${lowCourse.attendancePct}%. Attend next 2 lectures to cross the 75% threshold.`;
        } else {
          this.showAttendanceWarning = false;
        }
      }

      // 3. Performance / CGPA & Recent Grades
      if (myMarks.length > 0) {
        const totalObtained = myMarks.reduce((sum: number, m: any) => sum + (Number(m.obtained) || 0), 0);
        const totalMax = myMarks.reduce((sum: number, m: any) => sum + (Number(m.maxMarks) || 100), 0);
        const avgPercentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
        this.stats.cgpa = Number(((avgPercentage / 100) * 10).toFixed(2));

        this.recentGrades = myMarks.slice(0, 5).map((m: any) => {
          const score = Math.round((Number(m.obtained) / (Number(m.maxMarks) || 100)) * 100);
          let grade = 'F';
          if (score >= 90) grade = 'O';
          else if (score >= 80) grade = 'A+';
          else if (score >= 70) grade = 'A';
          else if (score >= 60) grade = 'B+';
          else if (score >= 50) grade = 'B';
          
          return {
            courseName: m.assessment || 'Assessment',
            score: score,
            grade: grade
          };
        });
      } else {
        this.stats.cgpa = 0.0;
        this.recentGrades = [];
      }

      // 4. Exams & Deadlines
      const storedAssessments = localStorage.getItem('obslmsAssessments');
      const assessments = storedAssessments ? JSON.parse(storedAssessments) : [];
      this.stats.pendingExams = assessments.filter((a: any) => a.status !== 'Completed').length;

      // Upcoming deadlines computed dynamically from real assessments
      const today = new Date();
      this.upcomingDeadlines = assessments
        .filter((a: any) => a.status !== 'Completed')
        .map((a: any) => {
          const due = a.dueDate ? new Date(a.dueDate) : today;
          const diffTime = due.getTime() - today.getTime();
          const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
          return {
            title: `${a.type || 'Assessment'} - ${a.course || 'Subject'}`,
            course: a.course || 'Course',
            type: a.type || 'Exam',
            dueDate: a.dueDate || 'TBD',
            daysLeft: daysLeft,
            marks: a.maxMarks || 50
          };
        });

      // 5. Today's Schedule from real timetable
      const storedSchedule = localStorage.getItem('obslmsTimetable');
      const timetable = storedSchedule ? JSON.parse(storedSchedule) : [];
      const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const todayClasses = timetable.filter((t: any) => t.day === currentDay);
      if (todayClasses.length > 0) {
        this.todaySchedule = todayClasses.map((t: any, idx: number) => ({
          period: t.period,
          subject: t.subject,
          room: t.room,
          isCurrent: idx === 0
        }));
      } else {
        this.todaySchedule = [];
      }

      // 6. OBE Course Outcomes Mastery Progress from real COs
      const storedCos = localStorage.getItem('obslmsCourseOutcomes');
      const cos = storedCos ? JSON.parse(storedCos) : [];
      this.coProgressList = cos.map((co: any) => {
        return {
          coCode: co.co || 'CO',
          courseName: co.course || 'Course',
          bloomsLevel: 'Apply',
          attainmentPct: 0,
          targetPct: 75,
          status: 'In Progress' as const
        };
      });

      // 7. Notifications from real system logs
      const storedNotifs = localStorage.getItem('obslmsNotifications');
      this.notifications = storedNotifs ? JSON.parse(storedNotifs) : [];

    } catch (e) {
      console.error('Error loading student dashboard data:', e);
    }
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

  navigate(path: string): void {
    this.router.navigate([path]);
  }
}
