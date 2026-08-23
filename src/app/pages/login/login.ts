import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
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

  private parseUserName(input: string): string {
    if (!input) return '';
    const trimmed = input.trim();
    if (trimmed.includes('@')) {
      const namePart = trimmed.split('@')[0] || trimmed;
      return namePart
        .split(/[^a-zA-Z]+/)
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
    }
    return '';
  }

  login(): void {
    const cleanId = this.identifier ? this.identifier.trim() : '';
    if (!cleanId || !this.password || !this.role) {
      this.toast.warning('Please enter your email or phone number, password, and select a role.');
      return;
    }

    const parsedName = this.parseUserName(cleanId);
    const roleCapitalized = this.role.charAt(0).toUpperCase() + this.role.slice(1);

    try {
      localStorage.setItem('userRole', this.role.toLowerCase());
      if (cleanId.includes('@')) {
        localStorage.setItem('userEmail', cleanId);
      } else {
        localStorage.setItem('userPhone', cleanId);
        localStorage.setItem('userEmail', `${cleanId}@centurionuniv.edu.in`);
      }
      localStorage.setItem('userName', parsedName || roleCapitalized);
    } catch (e) {}

    const displayName = parsedName || roleCapitalized;
    this.toast.success(`Welcome, ${displayName}!`);

    switch (this.role) {
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
  }
}