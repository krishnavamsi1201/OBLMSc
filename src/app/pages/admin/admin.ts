import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [Navbar, Sidebar, Footer, RouterModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css'],
})
export class Admin {
  counts = {
    faculty: 0,
    students: 0,
    courses: 0,
    subjects: 0,
    assessments: 0
  };

  constructor() {
    this.loadCounts();
  }

  private loadCounts(): void {
    this.counts.faculty = this.safeLoadCount('obslmsFaculty');
    this.counts.students = this.safeLoadCount('obslmsStudents');
    this.counts.courses = this.safeLoadCount('obslmsCourses');
    this.counts.subjects = this.safeLoadCount('obslmsSubjects');
    this.counts.assessments = this.safeLoadCount('obslmsAssessments');
  }

  private safeLoadCount(key: string): number {
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as any[]).length : 0;
    } catch {
      return 0;
    }
  }
}




