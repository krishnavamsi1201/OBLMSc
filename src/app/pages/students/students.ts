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
  
  stats: DashboardStats = {
    enrolledCourses: 0,
    attendancePercentage: 0,
    cgpa: 0.0,
    pendingExams: 0
  };

  showAttendanceWarning = false;
  attendanceWarningMsg = '';

  searchQuery = '';

  todaySchedule: TimetableEntry[] = [];
  notifications: any[] = [];
  recentGrades: StudentGrade[] = [];
  coProgressList: StudentCoProgress[] = [];
  upcomingDeadlines: UpcomingDeadline[] = [];
  enrolledCourseCards: EnrolledCourseCard[] = [];

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
    { label: 'Student Details', path: '/profile', icon: '👤' }
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
    if (!this.searchQuery.trim()) return this.upcomingDeadlines;
    const q = this.searchQuery.toLowerCase();
    return this.upcomingDeadlines.filter(d => 
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
      this.studentEmail = localStorage.getItem('userEmail') || '';
    } catch {
      this.role = null;
    }
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    try {
      // 1. Courses
      const storedCourses = localStorage.getItem('obslmsCourses');
      const courses = storedCourses ? JSON.parse(storedCourses) : [];
      this.stats.enrolledCourses = courses.length || 4;

      // Build Enrolled Course Cards
      this.enrolledCourseCards = (courses.length > 0 ? courses : [
        { code: 'CSE-301', title: 'Database Management Systems', faculty: 'Dr. Ramesh Kumar', credits: 4 },
        { code: 'CSE-302', title: 'Cloud Computing & Virtualization', faculty: 'Prof. Anita Sharma', credits: 3 },
        { code: 'CSE-303', title: 'Machine Learning Fundamentals', faculty: 'Dr. Sanjay Patel', credits: 4 },
        { code: 'CSE-304', title: 'Software Engineering & OBE', faculty: 'Prof. Meera Rao', credits: 3 }
      ]).map((c: any, index: number) => ({
        code: c.code || `CSE-30${index + 1}`,
        title: c.title || 'Course Title',
        faculty: c.faculty || 'Assigned Faculty',
        credits: c.credits || (index % 2 === 0 ? 4 : 3),
        currentAvg: [86, 78, 92, 84][index % 4],
        attendancePct: [88, 72, 94, 86][index % 4]
      }));

      // 2. Attendance
      const storedAttendance = localStorage.getItem('obslmsAttendance');
      const attendance = storedAttendance ? JSON.parse(storedAttendance) : [];
      const myAttendance = attendance.filter((a: any) => 
        a.student && a.student.toLowerCase() === this.studentName.toLowerCase()
      );
      if (myAttendance.length > 0) {
        const present = myAttendance.filter((a: any) => a.status === 'Present').length;
        this.stats.attendancePercentage = Math.round((present / myAttendance.length) * 100);
      } else {
        this.stats.attendancePercentage = 85;
      }

      // Check attendance warning
      if (this.stats.attendancePercentage < 75) {
        this.showAttendanceWarning = true;
        this.attendanceWarningMsg = `Overall attendance is at ${this.stats.attendancePercentage}%. University OBE regulations require minimum 75% for exam eligibility.`;
      } else {
        const lowCourse = this.enrolledCourseCards.find(c => c.attendancePct < 75);
        if (lowCourse) {
          this.showAttendanceWarning = true;
          this.attendanceWarningMsg = `Attendance in ${lowCourse.title} is at ${lowCourse.attendancePct}%. Attend next 2 lectures to cross the 75% threshold.`;
        }
      }

      // 3. Performance / CGPA
      const storedMarks = localStorage.getItem('obslmsMarkEntries');
      const marks = storedMarks ? JSON.parse(storedMarks) : [];
      const myMarks = marks.filter((m: any) => 
        m.student && m.student.toLowerCase() === this.studentName.toLowerCase()
      );
      if (myMarks.length > 0) {
        const totalObtained = myMarks.reduce((sum: number, m: any) => sum + (Number(m.obtained) || 0), 0);
        const totalMax = myMarks.reduce((sum: number, m: any) => sum + (Number(m.maxMarks) || 100), 0);
        const avgPercentage = (totalObtained / totalMax) * 100;
        this.stats.cgpa = Number(((avgPercentage / 100) * 10).toFixed(2));

        this.recentGrades = myMarks.slice(0, 3).map((m: any) => {
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
        this.stats.cgpa = 8.25;
        this.recentGrades = [
          { courseName: 'Internal Test 1 - DBMS', score: 82, grade: 'A+' },
          { courseName: 'Assignment 1 - Cloud Computing', score: 94, grade: 'O' },
          { courseName: 'Lab Practical - Machine Learning', score: 88, grade: 'A+' }
        ];
      }

      // 4. Exams
      const storedExams = localStorage.getItem('obslmsExams');
      const exams = storedExams ? JSON.parse(storedExams) : [];
      this.stats.pendingExams = exams.filter((e: any) => e.status !== 'Completed').length || 2;

      // 5. Today's Schedule
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
        this.todaySchedule = [
          { period: '09:00 AM - 10:00 AM', subject: 'Cloud Computing & Virtualization', room: 'LH-101', isCurrent: true },
          { period: '11:15 AM - 12:15 PM', subject: 'Database Management Systems', room: 'LH-204', isCurrent: false },
          { period: '02:00 PM - 04:00 PM', subject: 'Machine Learning Lab', room: 'Lab-4', isCurrent: false }
        ];
      }

      // 6. OBE Course Outcomes Mastery Progress
      this.coProgressList = [
        { coCode: 'CO1', courseName: 'Database Management', bloomsLevel: 'Understand', attainmentPct: 88, targetPct: 75, status: 'Achieved' },
        { coCode: 'CO2', courseName: 'Cloud Computing', bloomsLevel: 'Apply', attainmentPct: 82, targetPct: 75, status: 'Achieved' },
        { coCode: 'CO3', courseName: 'Machine Learning', bloomsLevel: 'Analyze', attainmentPct: 71, targetPct: 75, status: 'In Progress' },
        { coCode: 'CO4', courseName: 'Software Engineering', bloomsLevel: 'Evaluate', attainmentPct: 91, targetPct: 75, status: 'Achieved' }
      ];

      // 7. Upcoming Deadlines & Evaluations
      this.upcomingDeadlines = [
        { title: 'Continuous Assessment 2', course: 'Cloud Computing', type: 'Mid-Sem Exam', dueDate: 'Aug 26, 2026', daysLeft: 6, marks: 30 },
        { title: 'Normalization Case Study', course: 'Database Management', type: 'Assignment', dueDate: 'Aug 28, 2026', daysLeft: 8, marks: 15 },
        { title: 'Mini Project Milestone 1', course: 'Machine Learning', type: 'Project', dueDate: 'Sep 02, 2026', daysLeft: 13, marks: 25 }
      ];

      // 8. Notifications
      this.notifications = [
        { title: 'Exam Registration Open', message: 'Register for end semester examinations before August 25.', date: new Date() },
        { title: 'Feedback Submission', message: 'Please fill the course feedback form for OBE.', date: new Date(Date.now() - 86400000) }
      ];

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
