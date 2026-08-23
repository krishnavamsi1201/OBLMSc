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
    this.loadStats();
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