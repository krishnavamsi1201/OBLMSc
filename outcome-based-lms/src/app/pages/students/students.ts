import { Component, ChangeDetectorRef, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  private syncSub?: Subscription;

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

    this.syncSub = this.syncService.events$.subscribe(() => {
      this.loadDashboardData();
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.syncSub?.unsubscribe();
  }

  private loadDashboardData(): void {
    try {
      // 1. Enrolled courses mapping
      const storedStudentCourses = localStorage.getItem('obslmsStudentCourses');
      let studentCourses = storedStudentCourses ? JSON.parse(storedStudentCourses) : [];
      
      // Auto-seed default student-course mappings for seed users
      if (studentCourses.length === 0) {
        studentCourses = [
          { studentName: 'Krishnavamsi', courseCode: 'INMCA202' },
          { studentName: 'Krishnavamsi', courseCode: 'DS' },
          { studentName: 'Krishnavamsi', courseCode: 'MES' },
          { studentName: 'Krishnavamsi', courseCode: 'IT305' },
          { studentName: 'Krishnavamsi', courseCode: 'OOP' },
          { studentName: 'Raj Kumar', courseCode: 'INMCA202' },
          { studentName: 'Raj Kumar', courseCode: 'DS' },
          { studentName: 'Raj Kumar', courseCode: 'MES' },
          { studentName: 'Raj Kumar', courseCode: 'IT305' },
          { studentName: 'Raj Kumar', courseCode: 'OOP' }
        ];
        localStorage.setItem('obslmsStudentCourses', JSON.stringify(studentCourses));
      }

      const storedCourses = localStorage.getItem('obslmsCourses');
      const allCourses = storedCourses ? JSON.parse(storedCourses) : [];
      
      const myCourseCodes = studentCourses
        .filter((sc: any) => sc.studentName.toLowerCase() === this.studentName.toLowerCase())
        .map((sc: any) => sc.courseCode.toLowerCase());

      // Filter to only enrolled courses
      const courses = allCourses.filter((c: any) => 
        myCourseCodes.includes(c.code.toLowerCase()) || myCourseCodes.includes(c.title?.toLowerCase())
      );
      this.stats.enrolledCourses = courses.length;

      // 2. Attendance & Marks for computing per-course metrics
      const storedAttendance = localStorage.getItem('obslmsAttendance');
      let attendance = storedAttendance ? JSON.parse(storedAttendance) : [];
      let myAttendance = attendance.filter((a: any) => 
        a.student && a.student.toLowerCase() === this.studentName.toLowerCase()
      );

      // Only generate mock attendance for seed students if empty to avoid cluttering newly created students
      const isSeedStudent = ['krishnavamsi', 'raj kumar'].includes(this.studentName.toLowerCase());
      if (myAttendance.length === 0 && courses.length > 0 && isSeedStudent) {
        const generated: any[] = [];
        courses.forEach((c: any) => {
          const attendanceRate = 0.70 + Math.random() * 0.22;
          for (let i = 1; i <= 10; i++) {
            generated.push({
              id: `ATT-${c.code}-${i}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              student: this.studentName,
              course: c.title || c.name || c.code,
              date: `2026-08-${10 + i}`,
              status: Math.random() < attendanceRate ? 'Present' : 'Absent'
            });
          }
        });
        attendance = [...attendance, ...generated];
        localStorage.setItem('obslmsAttendance', JSON.stringify(attendance));
        myAttendance = attendance.filter((a: any) => 
          a.student && a.student.toLowerCase() === this.studentName.toLowerCase()
        );
      }

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
        this.stats.attendancePercentage = courses.length > 0 ? 72 : 0; // Fallback only for seed student warning demo
      }

      // Check attendance warning
      if (courses.length > 0 && this.stats.attendancePercentage < 75 && this.stats.attendancePercentage > 0) {
        this.showAttendanceWarning = true;
        this.attendanceWarningMsg = `Overall attendance is at ${this.stats.attendancePercentage}%. University OBE regulations require minimum 75% for exam eligibility.`;
      } else {
        this.showAttendanceWarning = false;
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

      // 6. OBE Course Outcomes Mastery Progress from real COs and Marks
      const storedCos = localStorage.getItem('obslmsCourseOutcomes');
      const cos = storedCos ? JSON.parse(storedCos) : [];
      const mappings = JSON.parse(localStorage.getItem('obslmsAssessmentCOMappings') || '[]');

      this.coProgressList = cos.map((co: any) => {
        const coCode = co.co || co.code || 'CO1';
        const courseName = co.course || 'Course';
        const target = Number(co.targetPercentage) || 75;

        // Find assessment mappings linked to this CO
        const linkedMappings = mappings.filter((m: any) =>
          m.courseOutcomes && Array.isArray(m.courseOutcomes) && m.courseOutcomes.includes(coCode)
        );

        let myObt = 0;
        let myMax = 0;

        if (linkedMappings.length > 0) {
          linkedMappings.forEach((mapping: any) => {
            const studentMarks = myMarks.filter((m: any) =>
              m.assessment && m.assessment.toLowerCase().includes((mapping.assessmentName || '').toLowerCase())
            );
            studentMarks.forEach((m: any) => {
              myObt += Number(m.obtained) || 0;
              myMax += Number(m.maxMarks) || mapping.maxMarks || 100;
            });
          });
        } else {
          const studentMarks = myMarks.filter((m: any) =>
            m.assessment && (m.assessment.toLowerCase().includes(courseName.toLowerCase()) || m.assessment.toLowerCase().includes(coCode.toLowerCase()))
          );
          studentMarks.forEach((m: any) => {
            myObt += Number(m.obtained) || 0;
            myMax += Number(m.maxMarks) || 100;
          });
        }

        const pct = myMax > 0 ? Math.round((myObt / myMax) * 100) : 0;
        let status: 'Achieved' | 'In Progress' | 'Needs Attention' = 'In Progress';
        if (pct >= target && pct > 0) {
          status = 'Achieved';
        } else if (pct < 40 && myMax > 0) {
          status = 'Needs Attention';
        }

        return {
          coCode: coCode,
          courseName: courseName,
          bloomsLevel: co.bloomsLevel || 'Apply',
          attainmentPct: pct,
          targetPct: target,
          status: status
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
