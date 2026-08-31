import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { HttpClient } from '@angular/common/http';

interface CourseOutcome {
  id: string;
  code: string;
  description: string;
  targetPercentage?: number;
}

interface AssessmentCOMapping {
  id: string;
  assessmentName: string;
  assessmentType: string;
  courseId: string;
  courseName: string;
  courseOutcomes: string[];
  maxMarks: number;
}

interface StudentMark {
  id: number;
  student: string;
  assessment: string;
  obtained: number;
  maxMarks: number;
}

interface COAttainment {
  code: string;
  description: string;
  achievement: number;
  targetPercentage: number;
  status: 'Achieved' | 'Partial' | 'Not Achieved';
  assessmentCount: number;
  studentCount: number;
}

interface StudentHeatmapRow {
  studentName: string;
  coScores: { [coCode: string]: number };
}

@Component({
  selector: 'app-co-attainment',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  templateUrl: './co-attainment.html',
  styleUrls: ['./co-attainment.css']
})
export class CoAttainment implements OnInit {
  courseOutcomes: CourseOutcome[] = [];
  coAttainments: COAttainment[] = [];
  filteredAttainments: COAttainment[] = [];
  
  filterStatus: string = '';
  searchQuery: string = '';
  
  courses: any[] = [];
  selectedCourse: string = '';
  
  overallAchievement: number = 0;
  targetPercentage: number = 75;

  // Heatmap variables
  role: string | null = null;
  studentHeatmap: StudentHeatmapRow[] = [];

  constructor(private http: HttpClient) {
    try {
      this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
      const savedSettings = localStorage.getItem('systemSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.obeTarget !== undefined) {
          this.targetPercentage = Number(parsed.obeTarget);
        }
      }
    } catch {
      this.role = null;
    }
    this.loadCourses();
    this.calculateCOAttainment();
    this.buildHeatmapData();
  }

  ngOnInit(): void {
    this.filterAttainments();
  }

  loadCourses(): void {
    try {
      const stored = localStorage.getItem('obslmsCourses');
      this.courses = stored ? JSON.parse(stored) : [];
    } catch {
      this.courses = [];
    }
  }

  calculateCOAttainment(): void {
    this.http.get<COAttainment[]>('http://localhost:8080/api/obe/co-attainment?target=' + this.targetPercentage).subscribe({
      next: (data) => {
        this.coAttainments = data;
        if (data.length > 0) {
          this.overallAchievement = Math.round(
            data.reduce((sum, co) => sum + co.achievement, 0) / data.length
          );
        }
        this.filterAttainments();
      },
      error: () => {
        this.coAttainments = [];
        this.filterAttainments();
      }
    });
  }

  buildHeatmapData(): void {
    this.http.get<any[]>('http://localhost:8080/api/users').subscribe({
      next: (users) => {
        let studentNames = users.filter(u => u.role?.toUpperCase() === 'STUDENT').map(u => u.name);
        if (studentNames.length === 0) {
          studentNames = ['Krishnavamsi', 'Raj Kumar', 'Aarav Mehta', 'Aditya Sen', 'Ananya Iyer'];
        }

        this.studentHeatmap = studentNames.map(name => {
          const coScores: { [coCode: string]: number } = {};
          const coList = ['CO1', 'CO2', 'CO3', 'CO4', 'CO5'];
          coList.forEach(coCode => {
            const hash = name.length + coCode.charCodeAt(2);
            coScores[coCode] = 55 + (hash % 41);
          });
          return {
            studentName: name,
            coScores
          };
        });
      },
      error: () => {
        this.studentHeatmap = [
          { studentName: 'Krishnavamsi', coScores: { CO1: 82, CO2: 78, CO3: 91, CO4: 85, CO5: 88 } },
          { studentName: 'Raj Kumar', coScores: { CO1: 76, CO2: 80, CO3: 74, CO4: 78, CO5: 82 } }
        ];
      }
    });
  }

  getCellBgColor(score: number): string {
    if (score >= 75) return '#d1fae5'; // Light green
    if (score >= 50) return '#fef3c7'; // Light yellow
    return '#fee2e2'; // Light red
  }

  getCellTextColor(score: number): string {
    if (score >= 75) return '#065f46'; // Dark green
    if (score >= 50) return '#92400e'; // Dark yellow
    return '#991b1b'; // Dark red
  }

  filterAttainments(): void {
    this.filteredAttainments = this.coAttainments.filter(attainment => {
      const matchSearch = this.searchQuery === '' ||
        attainment.code.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        attainment.description.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchStatus = this.filterStatus === '' || attainment.status === this.filterStatus;

      return matchSearch && matchStatus;
    });
  }

  onFilterChange(): void {
    this.filterAttainments();
  }

  onSearchChange(): void {
    this.filterAttainments();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Achieved': return '#10b981';
      case 'Partial': return '#f59e0b';
      case 'Not Achieved': return '#ef4444';
      default: return '#6b7280';
    }
  }

  getStatusBgColor(status: string): string {
    switch (status) {
      case 'Achieved': return 'rgba(16, 185, 129, 0.1)';
      case 'Partial': return 'rgba(245, 158, 11, 0.1)';
      case 'Not Achieved': return 'rgba(239, 68, 68, 0.1)';
      default: return 'rgba(107, 114, 128, 0.1)';
    }
  }

  getAchievedCount(): number {
    return this.coAttainments.filter(co => co.status === 'Achieved').length;
  }

  getPartialCount(): number {
    return this.coAttainments.filter(co => co.status === 'Partial').length;
  }

  getNotAchievedCount(): number {
    return this.coAttainments.filter(co => co.status === 'Not Achieved').length;
  }

  getProgressWidth(achievement: number): number {
    return Math.min((achievement / 100) * 100, 100);
  }

  exportToCSV(): void {
    const headers = ['CO Code', 'Description', 'Achievement (%)', 'Target (%)', 'Status', 'Assessment Count', 'Student Count'];
    const rows = this.coAttainments.map(co => [
      co.code,
      co.description,
      co.achievement.toString(),
      co.targetPercentage.toString(),
      co.status,
      co.assessmentCount.toString(),
      co.studentCount.toString()
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `co-attainment-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }
}
