
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

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

  constructor(private router: Router) {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private parseUserName(email: string): string {
    const namePart = email.split('@')[0] || email;
    return namePart
      .split(/[^a-zA-Z]+/)
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  login(): void {
    if (!this.email || !this.password || !this.role) {
      alert('Please fill email, password and select a role.');
      return;
    }

    const parsedName = this.parseUserName(this.email);

    try {
      localStorage.setItem('userRole', this.role.toLowerCase());
      localStorage.setItem('userEmail', this.email);
      localStorage.setItem('userName', parsedName);
    } catch (e) {}

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