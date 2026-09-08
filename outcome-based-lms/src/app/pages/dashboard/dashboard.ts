import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { DashboardHeader } from '../../components/dashboard-header/dashboard-header';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatButtonModule, Navbar, Sidebar, Footer, DashboardHeader],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {
  role: string | null = null;
  enrolledCount = 0;
  attendance = '—';
  cgpa = '—';
  coAttainment = '—';

  constructor(private router: Router) {
    try {
      const raw = localStorage.getItem('enrolledCourses');
      const enrolled = raw ? JSON.parse(raw) : [];
      this.enrolledCount = enrolled.length;
      this.attendance = '—';
      this.cgpa = '—';
      this.coAttainment = '—';
      this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
      if (this.role === 'student') {
        this.router.navigate(['/students']);
      } else if (this.role === 'admin') {
        this.router.navigate(['/admin']);
      } else if (this.role === 'faculty') {
        this.router.navigate(['/faculty']);
      }
    } catch (e) {
      this.role = null;
    }
  }

  ngOnInit(): void {
  }

  goToCourses() {
    this.router.navigate(['/courses']);
  }

  viewAttendance() {
    this.router.navigate(['/attendance']);
  }

  viewPerformance() {
    this.router.navigate(['/performance']);
  }

  viewTimetable() {
    this.router.navigate(['/timetable']);
  }

  viewFees() {
    this.router.navigate(['/student/fees']);
  }

  viewAdmitCard() {
    this.router.navigate(['/examination']);
  }

  giveFeedback() {
    this.router.navigate(['/grievance']);
  }

}


