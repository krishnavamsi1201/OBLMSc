
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule
  ],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class Navbar {
  role: string | null = null;
  userName: string | null = null;

  private http = inject(HttpClient);

  constructor(private router: Router) {
    try {
      this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
      this.userName = localStorage.getItem('userName') || localStorage.getItem('userEmail');
    } catch (e) {
      this.role = null;
      this.userName = null;
    }
    this.syncDatabaseToLocalStorage();
  }

  private syncDatabaseToLocalStorage(): void {
    // 1. Fetch courses
    this.http.get<any[]>('http://localhost:8080/api/courses').subscribe({
      next: (courses) => {
        const obslmsCourses = courses.map(c => ({
          id: c.id,
          code: c.code,
          title: c.title,
          faculty: c.faculty || 'Faculty Board',
          semester: c.semester || 'Semester 1'
        }));
        localStorage.setItem('obslmsCourses', JSON.stringify(obslmsCourses));

        const obslmsCourseSubjects = courses.map(c => ({
          id: c.id.toString(),
          courseId: c.id.toString(),
          courseName: c.title,
          subjectId: c.id.toString(),
          subjectName: c.code
        }));
        localStorage.setItem('obslmsCourseSubjects', JSON.stringify(obslmsCourseSubjects));
      }
    });

    // 2. Fetch users
    this.http.get<any[]>('http://localhost:8080/api/users').subscribe({
      next: (users) => {
        const faculty = users.filter(u => u.role?.toUpperCase() === 'FACULTY').map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          department: u.department || 'Computer Science',
          designation: 'Assistant Professor',
          courses: []
        }));
        localStorage.setItem('obslmsFaculty', JSON.stringify(faculty));

        const students = users.filter(u => u.role?.toUpperCase() === 'STUDENT').map(u => ({
          id: u.id,
          regNo: u.id,
          name: u.name,
          email: u.email,
          department: u.department || 'Computer Science',
          semester: 'Semester 1'
        }));
        localStorage.setItem('obslmsStudents', JSON.stringify(students));
        
        localStorage.setItem('obslmsUsersDatabase', JSON.stringify(users));

        const studentCourses: any[] = [];
        users.forEach(u => {
          if (u.role?.toUpperCase() === 'STUDENT' && u.enrolledCourses) {
            const codes = u.enrolledCourses.split(',');
            codes.forEach((code: string) => {
              studentCourses.push({
                studentName: u.name,
                courseCode: code.trim()
              });
            });
          }
        });
        localStorage.setItem('obslmsStudentCourses', JSON.stringify(studentCourses));
      }
    });

    // 3. Fetch Program Outcomes
    this.http.get<any[]>('http://localhost:8080/api/copo/po').subscribe({
      next: (pos) => {
        localStorage.setItem('obslmsProgramOutcomes', JSON.stringify(pos));
      }
    });

    // 4. Fetch Course Outcomes
    this.http.get<any[]>('http://localhost:8080/api/copo/co').subscribe({
      next: (cos) => {
        const formattedCos = cos.map(co => ({
          id: co.id,
          code: co.co,
          co: co.co,
          course: co.course,
          description: co.description
        }));
        localStorage.setItem('obslmsCourseOutcomes', JSON.stringify(formattedCos));
      }
    });

    // 5. Fetch Mappings
    this.http.get<any[]>('http://localhost:8080/api/copo/mappings').subscribe({
      next: (mappings) => {
        localStorage.setItem('obslmsCOPOMappings', JSON.stringify(mappings));
      }
    });

    // 6. Fetch Assessments
    this.http.get<any[]>('http://localhost:8080/api/obe/assessments').subscribe({
      next: (assessments) => {
        const formatted = assessments.map(item => ({
          id: item.id,
          course: item.courseName || item.courseId,
          type: item.type,
          questions: 5,
          maxMarks: item.maxMarks || 100,
          dueDate: '2026-12-01',
          status: 'Active'
        }));
        localStorage.setItem('obslmsAssessments', JSON.stringify(formatted));

        const formattedMappings = assessments.map(item => ({
          id: (item.id || '').toString(),
          assessmentId: (item.id || '').toString(),
          assessmentName: item.name || `${item.type} - ${item.courseName}`,
          assessmentType: item.type,
          courseId: item.courseId,
          courseName: item.courseName,
          courseOutcomes: (item.courseOutcomes || 'CO1').split(','),
          maxMarks: item.maxMarks || 100
        }));
        localStorage.setItem('obslmsAssessmentCOMappings', JSON.stringify(formattedMappings));
      }
    });

    // 7. Fetch Marks
    this.http.get<any[]>('http://localhost:8080/api/obe/marks').subscribe({
      next: (marks) => {
        localStorage.setItem('obslmsMarkEntries', JSON.stringify(marks));
      }
    });
  }

  logout(): void {
    try {
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
    } catch (e) {}
    this.router.navigate(['/login']);
  }

}