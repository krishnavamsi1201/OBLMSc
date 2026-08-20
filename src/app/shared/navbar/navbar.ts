
import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

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

  constructor(private router: Router) {
    try {
      this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
      this.userName = localStorage.getItem('userName') || localStorage.getItem('userEmail');
    } catch (e) {
      this.role = null;
      this.userName = null;
    }
  }

  logout(): void {
    try {
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
    } catch (e) {}
    this.router.navigate(['/login']);
  }

}