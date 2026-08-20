import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';

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
}

interface StudentGrade {
  courseName: string;
  score: number;
  grade: string;
}

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    Navbar,
    Sidebar,
    Footer
  ],
  templateUrl: './students.html',
  styleUrls: ['./students.css'],
})
export class Students implements OnInit {
  role: string | null = null;
  studentName = 'Student';
  studentEmail = '';
  
  stats: DashboardStats = {
    enrolledCourses: 0,
    attendancePercentage: 0,
    cgpa: 0.0,
    pendingExams: 0
  };

  todaySchedule: TimetableEntry[] = [];
  notifications: any[] = [];
  recentGrades: StudentGrade[] = [];

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

  constructor(private router: Router) {
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
      this.stats.enrolledCourses = courses.length || 4; // Fallback to 4 courses if empty

      // 2. Attendance
      const storedAttendance = localStorage.getItem('obslmsAttendance');
      const attendance = storedAttendance ? JSON.parse(storedAttendance) : [];
      const myAttendance = attendance.filter((a: any) => 
        a.student.toLowerCase() === this.studentName.toLowerCase()
      );
      if (myAttendance.length > 0) {
        const present = myAttendance.filter((a: any) => a.status === 'Present').length;
        this.stats.attendancePercentage = Math.round((present / myAttendance.length) * 100);
      } else {
        this.stats.attendancePercentage = 85; // Fallback
      }

      // 3. Performance / CGPA
      const storedMarks = localStorage.getItem('obslmsMarkEntries');
      const marks = storedMarks ? JSON.parse(storedMarks) : [];
      const myMarks = marks.filter((m: any) => 
        m.student.toLowerCase() === this.studentName.toLowerCase()
      );
      if (myMarks.length > 0) {
        const totalObtained = myMarks.reduce((sum: number, m: any) => sum + (Number(m.obtained) || 0), 0);
        const totalMax = myMarks.reduce((sum: number, m: any) => sum + (Number(m.maxMarks) || 100), 0);
        const avgPercentage = (totalObtained / totalMax) * 100;
        this.stats.cgpa = Number(((avgPercentage / 100) * 10).toFixed(2));

        // Populating recent grades
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
        this.stats.cgpa = 8.25; // Fallback
        this.recentGrades = [
          { courseName: 'Internal Test 1', score: 82, grade: 'A+' },
          { courseName: 'Assignment 1', score: 94, grade: 'O' }
        ];
      }

      // 4. Exams
      const storedExams = localStorage.getItem('obslmsExams');
      const exams = storedExams ? JSON.parse(storedExams) : [];
      this.stats.pendingExams = exams.filter((e: any) => e.status !== 'Completed').length || 2; // Fallback

      // 5. Today's Schedule
      const storedSchedule = localStorage.getItem('obslmsTimetable');
      const timetable = storedSchedule ? JSON.parse(storedSchedule) : [];
      const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const todayClasses = timetable.filter((t: any) => t.day === currentDay);
      if (todayClasses.length > 0) {
        this.todaySchedule = todayClasses.map((t: any) => ({
          period: t.period,
          subject: t.subject,
          room: t.room
        }));
      } else {
        // Fallback timetable
        this.todaySchedule = [
          { period: '09:00 AM - 10:00 AM', subject: 'Outcome-Based Education', room: 'LH-301' },
          { period: '11:15 AM - 12:15 PM', subject: 'Database Management Systems', room: 'LH-302' },
          { period: '02:00 PM - 03:00 PM', subject: 'Machine Learning', room: 'Lab-4' }
        ];
      }

      // 6. Notifications
      this.notifications = [
        { title: 'Exam Registration Open', message: 'Register for end semester examinations before August 25.', date: new Date() },
        { title: 'Feedback Submission', message: 'Please fill the course feedback form for OBE.', date: new Date(Date.now() - 86400000) }
      ];

    } catch (e) {
      console.error('Error loading student dashboard data:', e);
    }
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }
}
