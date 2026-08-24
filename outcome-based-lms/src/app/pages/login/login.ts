import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login implements OnInit {
  private router = inject(Router);
  private toast = inject(ToastService);
  private http = inject(HttpClient);

  identifier = '';
  password = '';
  role: 'admin' | 'faculty' | 'student' | '' = '';
  showPassword = false;

  stats = {
    courses: 0,
    faculty: 0,
    students: 0,
    outcomes: 0
  };

  ngOnInit(): void {
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
        this.loadStats();
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
        this.loadStats();
      }
    });

    // 3. Fetch Program Outcomes
    this.http.get<any[]>('http://localhost:8080/api/copo/po').subscribe({
      next: (pos) => {
        localStorage.setItem('obslmsProgramOutcomes', JSON.stringify(pos));
        this.loadStats();
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
        this.loadStats();
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

  private loadStats(): void {
    this.stats.courses = this.getStorageCount('obslmsCourses');
    this.stats.faculty = this.getStorageCount('obslmsFaculty');
    this.stats.students = this.getStorageCount('obslmsStudents');
    this.stats.outcomes = this.getStorageCount('obslmsCourseOutcomes');
  }

  private getStorageCount(key: string): number {
    try {
      const data = localStorage.getItem(key);
      return data ? (JSON.parse(data) as any[]).length : 0;
    } catch {
      return 0;
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  login(): void {
    const cleanId = this.identifier ? this.identifier.trim() : '';
    if (!cleanId || !this.password || !this.role) {
      this.toast.warning('Please enter your email, password, and select a role.');
      return;
    }

    const payload = {
      email: cleanId,
      password: this.password,
      role: this.role
    };

    this.http.post<any>('http://localhost:8080/api/auth/login', payload).subscribe({
      next: (response) => {
        try {
          localStorage.setItem('userRole', response.role.toLowerCase());
          localStorage.setItem('userEmail', response.email);
          localStorage.setItem('userName', response.name);
          localStorage.setItem('userId', response.id);
          localStorage.setItem('userDept', response.department);
        } catch (e) {}

        this.syncDatabaseToLocalStorage();
        this.toast.success(`Welcome, ${response.name}!`);

        switch (response.role.toLowerCase()) {
          case 'admin':
            this.router.navigate(['/admin']);
            break;
          case 'faculty':
            this.router.navigate(['/faculty']);
            break;
          case 'student':
            this.router.navigate(['/students']);
            break;
          default:
            this.router.navigate(['/login']);
        }
      },
      error: (err) => {
        const errorMsg = err.error?.message || 'Invalid credentials or connection issue.';
        this.toast.error('Login failed: ' + errorMsg);
      }
    });
  }
}