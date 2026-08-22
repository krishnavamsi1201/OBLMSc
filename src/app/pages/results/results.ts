import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';

interface StudentResult {
  id: number;
  student: string;
  course: string;
  internal: number;
  external: number;
  grade: string;
  status: string;
}

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  template: `<app-navbar></app-navbar>

<div class="container">

    <app-sidebar></app-sidebar>

    <div class="content">

        <div class="page-header">
            <h1>📋 Student Marks & Results</h1>
            <p>{{ role === 'student' ? 'View your grades, internal/external performance, and pass status.' : 'Faculty dashboard for internal/external results, grading, and pass/fail analysis.' }}</p>
        </div>

        <!-- Summary Statistics (Faculty/Admin View) -->
        <div class="summary-grid" *ngIf="role !== 'student'">
            <div class="section-card">
                <h3>Internal Average</h3>
                <strong>{{ internalAverage }}%</strong>
                <p>Average internal score across students.</p>
            </div>
            <div class="section-card">
                <h3>External Average</h3>
                <strong>{{ externalAverage }}%</strong>
                <p>Average external score across students.</p>
            </div>
            <div class="section-card">
                <h3>Pass Rate</h3>
                <strong>{{ passRate }}%</strong>
                <p>Class pass percentage based on final results.</p>
            </div>
            <div class="section-card">
                <h3>Grades Active</h3>
                <strong>{{ gradeDistribution }}</strong>
                <p>Grades obtained by students.</p>
            </div>
        </div>

        <!-- Student Personal Summary (Student View) -->
        <div class="summary-grid" *ngIf="role === 'student'">
            <div class="section-card">
                <h3>My Internal Score</h3>
                <strong>{{ myInternalAverage }}%</strong>
                <p>Your average internal assessment score.</p>
            </div>
            <div class="section-card">
                <h3>My External Score</h3>
                <strong>{{ myExternalAverage }}%</strong>
                <p>Your end-semester exam average.</p>
            </div>
            <div class="section-card">
                <h3>Calculated CGPA</h3>
                <strong>{{ myCgpa }}</strong>
                <p>Overall computed grade point average.</p>
            </div>
            <div class="section-card">
                <h3>Academic Standing</h3>
                <strong [class.pass-standing]="isPassing">{{ isPassing ? 'PASS' : 'FAIL' }}</strong>
                <p>Status of your course completion.</p>
            </div>
        </div>

        <div class="action-row">
            <button type="button" (click)="downloadResults()">Download Report</button>
            <span class="status-message" *ngIf="downloadMessage">{{ downloadMessage }}</span>
        </div>

        <div class="table-card">
            <div class="table-header-row">
                <h2>{{ role === 'student' ? 'My Academic Transcript' : 'Class Result Analysis' }} ({{ filteredResults.length }})</h2>
                <div class="table-filter-inputs">
                    <input 
                        type="text" 
                        [(ngModel)]="searchTerm" 
                        (input)="applyFilters()"
                        placeholder="🔍 Search {{ role === 'student' ? 'course name' : 'student or course' }}..."
                        class="table-search-input"
                    />
                    <select [(ngModel)]="statusFilter" (change)="applyFilters()" class="table-filter-select">
                        <option value="">All Statuses</option>
                        <option value="Pass">Pass</option>
                        <option value="Fail">Fail</option>
                    </select>
                </div>
            </div>
            <table *ngIf="filteredResults.length > 0">
                <thead>
                    <tr>
                        <th *ngIf="role !== 'student'">Student</th>
                        <th>Course</th>
                        <th>Internal (40%)</th>
                        <th>External (60%)</th>
                        <th>Final Grade</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let result of filteredResults">
                        <td *ngIf="role !== 'student'"><strong>{{ result.student }}</strong></td>
                        <td>{{ result.course }}</td>
                        <td>{{ result.internal }}%</td>
                        <td>{{ result.external }}%</td>
                        <td><span class="grade-badge" [class.excellent]="result.grade === 'O' || result.grade === 'A+'">{{ result.grade }}</span></td>
                        <td><span class="status-pill" [class.pass]="result.status === 'Pass'" [class.fail]="result.status === 'Fail'">{{ result.status }}</span></td>
                    </tr>
                </tbody>
            </table>
            <p *ngIf="filteredResults.length === 0" class="empty-state">No academic results match your search.</p>
        </div>

        <app-footer></app-footer>
    </div>

</div>`,
  styles: [
    `.summary-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-bottom: 24px; }
    .section-card, .table-card { padding: 20px; background: #fff; border-radius: 10px; box-shadow: 0 1px 12px rgba(0,0,0,.06); margin-bottom: 24px; }
    .section-card h3, .table-card h2 { margin-top: 0; font-size: 1.1rem; color: #1f3d7a; }
    .section-card strong { display: block; font-size: 2rem; margin-top: 8px; margin-bottom: 8px; color: #333; }
    .pass-standing { color: #2e7d32 !important; }
    .action-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
    .action-row button { padding: 10px 18px; border: none; border-radius: 8px; background: #1976d2; color: #fff; cursor: pointer; font-weight: 600; }
    .status-message { color: #2e7d32; font-weight: 600; }
    .table-header-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; }
    .table-filter-inputs { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .table-search-input { padding: 8px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13.5px; min-width: 220px; outline: none; }
    .table-search-input:focus { border-color: #1976d2; }
    .table-filter-select { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13.5px; outline: none; }
    .table-card table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    .table-card th, .table-card td { padding: 12px 10px; border-bottom: 1px solid #e8e8e8; text-align: left; }
    .table-card th { font-weight: 700; color: #1f3d7a; background: #f5f5f5; }
    .table-card tbody tr:hover { background: #fafafa; }
    
    .grade-badge { background: #e2e3e5; color: #383d41; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 700; }
    .grade-badge.excellent { background: #d4edda; color: #155724; }
    
    .status-pill { font-size: 0.8rem; font-weight: 700; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; }
    .status-pill.pass { background: #e8f5e9; color: #2e7d32; }
    .status-pill.fail { background: #ffebee; color: #c62828; }
    .empty-state { text-align: center; color: #999; padding: 40px 20px; }
    `
  ]
})
export class Results implements OnInit {
  role: string | null = null;
  userName = 'User';
  
  studentResults: StudentResult[] = [];
  filteredResults: StudentResult[] = [];
  downloadMessage = '';

  searchTerm = '';
  statusFilter = '';

  constructor() {
    try {
      this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
      this.userName = localStorage.getItem('userName') || 'User';
    } catch {
      this.role = null;
    }
  }

  ngOnInit(): void {
    this.loadResultsData();
  }

  applyFilters(): void {
    let list = this.studentResults;

    if (this.role === 'student') {
      list = list.filter(
        r => r.student.toLowerCase() === this.userName.toLowerCase()
      );
    }

    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      list = list.filter(r => 
        r.student.toLowerCase().includes(q) ||
        r.course.toLowerCase().includes(q) ||
        r.grade.toLowerCase().includes(q)
      );
    }

    if (this.statusFilter) {
      list = list.filter(r => r.status === this.statusFilter);
    }

    this.filteredResults = list;
  }

  private loadResultsData(): void {
    try {
      const storedMarks = localStorage.getItem('obslmsMarkEntries');
      const marks = storedMarks ? JSON.parse(storedMarks) : [];

      if (marks.length === 0) {
        // Seed default results if empty
        const defaultResults: StudentResult[] = [
          { id: 1, student: 'Raj Kumar', course: 'Database Management Systems', internal: 82, external: 78, grade: 'A', status: 'Pass' },
          { id: 2, student: 'Raj Kumar', course: 'Machine Learning', internal: 92, external: 88, grade: 'O', status: 'Pass' },
          { id: 3, student: 'Sneha Patel', course: 'Database Management Systems', internal: 75, external: 72, grade: 'B+', status: 'Pass' },
          { id: 4, student: 'Amit Shah', course: 'Cloud Computing', internal: 45, external: 48, grade: 'F', status: 'Fail' }
        ];
        this.studentResults = defaultResults;
        
        // Also map these to mark entries so everything connects
        const mockMarkEntries = [
          { id: 101, student: 'Raj Kumar', assessment: 'Database Management Systems', obtained: 41, maxMarks: 50 },
          { id: 102, student: 'Raj Kumar', assessment: 'Machine Learning', obtained: 46, maxMarks: 50 },
          { id: 103, student: 'Sneha Patel', assessment: 'Database Management Systems', obtained: 37, maxMarks: 50 },
          { id: 104, student: 'Amit Shah', assessment: 'Cloud Computing', obtained: 22, maxMarks: 50 }
        ];
        localStorage.setItem('obslmsMarkEntries', JSON.stringify(mockMarkEntries));
      } else {
        // Group marks by student and course (assessment type is treated as course context if it contains subject name)
        const grouped = new Map<string, any>();

        marks.forEach((mark: any, idx: number) => {
          if (!mark.student) return;
          const key = `${mark.student}_${mark.assessment || 'General Course'}`;

          if (!grouped.has(key)) {
            grouped.set(key, {
              student: mark.student,
              course: mark.assessment || 'General Course',
              marksList: []
            });
          }
          grouped.get(key).marksList.push(mark);
        });

        let idCounter = 1;
        this.studentResults = Array.from(grouped.values()).map(group => {
          const totalObtained = group.marksList.reduce((sum: number, m: any) => sum + (Number(m.obtained) || 0), 0);
          const totalMax = group.marksList.reduce((sum: number, m: any) => sum + (Number(m.maxMarks) || 100), 0);
          
          const internalScore = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 75;
          // Calculate realistic mock external score based on internal
          const externalScore = Math.min(100, Math.max(0, Math.round(internalScore - 5 + Math.random() * 10)));
          const finalScore = Math.round(internalScore * 0.4 + externalScore * 0.6);

          let grade = 'F';
          let status = 'Fail';
          
          if (finalScore >= 90) { grade = 'O'; status = 'Pass'; }
          else if (finalScore >= 80) { grade = 'A+'; status = 'Pass'; }
          else if (finalScore >= 70) { grade = 'A'; status = 'Pass'; }
          else if (finalScore >= 60) { grade = 'B+'; status = 'Pass'; }
          else if (finalScore >= 50) { grade = 'B'; status = 'Pass'; }

          return {
            id: idCounter++,
            student: group.student,
            course: group.course,
            internal: internalScore,
            external: externalScore,
            grade,
            status
          };
        });
      }
    } catch {
      this.studentResults = [];
    }

    // Filter results based on student role
    if (this.role === 'student') {
      this.filteredResults = this.studentResults.filter(
        r => r.student.toLowerCase() === this.userName.toLowerCase()
      );
    } else {
      this.filteredResults = [...this.studentResults];
    }
  }

  // Getters for Faculty View
  get internalAverage(): number {
    if (!this.studentResults.length) return 0;
    return Math.round(this.studentResults.reduce((sum, r) => sum + r.internal, 0) / this.studentResults.length);
  }

  get externalAverage(): number {
    if (!this.studentResults.length) return 0;
    return Math.round(this.studentResults.reduce((sum, r) => sum + r.external, 0) / this.studentResults.length);
  }

  get passRate(): number {
    if (!this.studentResults.length) return 0;
    const passed = this.studentResults.filter(r => r.status === 'Pass').length;
    return Math.round((passed / this.studentResults.length) * 100);
  }

  get gradeDistribution(): string {
    if (!this.studentResults.length) return '—';
    const grades = this.studentResults.map(r => r.grade);
    const unique = Array.from(new Set(grades));
    return unique.join(', ');
  }

  // Getters for Student View
  get myInternalAverage(): number {
    if (!this.filteredResults.length) return 0;
    return Math.round(this.filteredResults.reduce((sum, r) => sum + r.internal, 0) / this.filteredResults.length);
  }

  get myExternalAverage(): number {
    if (!this.filteredResults.length) return 0;
    return Math.round(this.filteredResults.reduce((sum, r) => sum + r.external, 0) / this.filteredResults.length);
  }

  get myCgpa(): number {
    if (!this.filteredResults.length) return 0;
    const averages = this.filteredResults.map(r => {
      const finalScore = r.internal * 0.4 + r.external * 0.6;
      return (finalScore / 100) * 10;
    });
    const avgCgpa = averages.reduce((sum, val) => sum + val, 0) / averages.length;
    return Number(avgCgpa.toFixed(2));
  }

  get isPassing(): boolean {
    if (!this.filteredResults.length) return false;
    return this.filteredResults.every(r => r.status === 'Pass');
  }

  downloadResults() {
    this.downloadMessage = this.role === 'student' 
      ? 'Preparing academic report transcript PDF download...' 
      : 'Exporting complete student results spreadsheet...';
    setTimeout(() => this.downloadMessage = '', 3500);
  }
}
