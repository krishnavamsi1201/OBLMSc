import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  email = '';
  password = '';
  role: 'admin' | 'faculty' | 'student' | '' = '';
  showPassword = false;

  constructor(private router: Router, private http: HttpClient) {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  login(): void {
    if (!this.email || !this.password || !this.role) {
      alert('Please fill email, password and select a role.');
      return;
    }

    const payload = {
      email: this.email,
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
        alert('Login failed: ' + errorMsg);
      }
    });
  }

}