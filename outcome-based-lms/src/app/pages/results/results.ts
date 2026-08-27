import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { HttpClient } from '@angular/common/http';
import { SyncService } from '../../shared/services/sync.service';
import { Subscription } from 'rxjs';

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

<div class="container print-single-card">

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
                <h3>OBE Weights Configured</h3>
                <strong style="font-size: 1.4rem; margin-top: 14px;">{{ getObeWeights().internal }}% Int / {{ getObeWeights().external }}% Ext</strong>
                <p>Configured grading ratios.</p>
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
            <button type="button" class="btn-print" (click)="printTranscript()" *ngIf="role === 'student'">🖨️ Export Marksheet PDF</button>
            <button type="button" class="btn-print" (click)="triggerBatchPrint()" *ngIf="role !== 'student'" style="background: #10b981;">
                🖨️ Export Batch Transcripts (Selected: {{ getSelectedCount() }})
            </button>
            <span class="status-message" *ngIf="downloadMessage">{{ downloadMessage }}</span>
        </div>

        <div class="table-card">
            <!-- Print Only Header Details (Single student view) -->
            <div class="print-header-details">
                <h3 style="margin: 0; color: #1e3a8a; font-size: 1.4rem;">Student Name: {{ userName }}</h3>
                <p style="margin: 4px 0 0; color: #475569; font-size: 0.95rem;">Academic Program: Bachelor of Technology (CSE)</p>
                <p style="margin: 2px 0 0; color: #475569; font-size: 0.95rem;">Academic Session: 2025-2026</p>
            </div>
            
            <h2>{{ role === 'student' ? 'My Academic Transcript' : 'Class Result Analysis' }}</h2>
            
            <table *ngIf="filteredResults.length > 0">
                <thead>
                    <tr>
                        <th *ngIf="role !== 'student'" style="width: 40px; text-align: center;">
                            <input type="checkbox" (change)="selectAllStudents($event)" [checked]="isAllSelected()" />
                        </th>
                        <th *ngIf="role !== 'student'">Student</th>
                        <th>Course</th>
                        <th>Internal ({{ getObeWeights().internal }}%)</th>
                        <th>External ({{ getObeWeights().external }}%)</th>
                        <th>Final Grade</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let result of filteredResults">
                        <td *ngIf="role !== 'student'" style="text-align: center;">
                            <input type="checkbox" [(ngModel)]="selectedStudentsForPrint[result.student]" />
                        </td>
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

</div>

<!-- Batch printing layout (visible ONLY in print mode when batch printing is triggered) -->
<div class="batch-print-container" *ngIf="selectedBatchStudents.length > 0">
    <div class="batch-print-page" *ngFor="let sName of selectedBatchStudents" style="page-break-after: always; border: 2px solid #1e3a8a; padding: 40px; border-radius: 12px; margin-bottom: 30px; background: white; box-sizing: border-box; width: 100%;">
        <h2 style="text-align: center; color: #1e3a8a; font-size: 1.8rem; margin-top: 0; text-transform: uppercase; letter-spacing: 0.5px;">Outcome-Based Learning Management System</h2>
        <h3 style="text-align: center; color: #475569; font-size: 1.25rem; margin-top: 4px; margin-bottom: 24px; text-transform: uppercase; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px;">Official Academic Transcript</h3>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div>
                <h3 style="margin: 0; color: #1e3a8a; font-size: 1.4rem;">Student Name: {{ sName }}</h3>
                <p style="margin: 4px 0 0; color: #475569; font-size: 0.95rem;">Academic Program: Bachelor of Technology (CSE)</p>
                <p style="margin: 2px 0 0; color: #475569; font-size: 0.95rem;">Academic Session: 2025-2026</p>
            </div>
            <div style="text-align: right;">
                <p style="margin: 0; color: #64748b; font-size: 0.9rem;">Date Issued: {{ currentDate | date:'mediumDate' }}</p>
                <p style="margin: 2px 0 0; color: #64748b; font-size: 0.9rem;">Status: OFFICIAL TRANSCRIPT</p>
            </div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; border: 1px solid #cbd5e1;">
            <thead>
                <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                    <th style="padding: 12px; text-align: left; font-weight: 700; color: #1f3d7a; border: 1px solid #cbd5e1;">Course Title</th>
                    <th style="padding: 12px; text-align: center; font-weight: 700; color: #1f3d7a; border: 1px solid #cbd5e1; width: 130px;">Internal ({{ getObeWeights().internal }}%)</th>
                    <th style="padding: 12px; text-align: center; font-weight: 700; color: #1f3d7a; border: 1px solid #cbd5e1; width: 130px;">External ({{ getObeWeights().external }}%)</th>
                    <th style="padding: 12px; text-align: center; font-weight: 700; color: #1f3d7a; border: 1px solid #cbd5e1; width: 110px;">Final Grade</th>
                    <th style="padding: 12px; text-align: center; font-weight: 700; color: #1f3d7a; border: 1px solid #cbd5e1; width: 100px;">Status</th>
                </tr>
            </thead>
            <tbody>
                <tr *ngFor="let result of getStudentResultsList(sName)" style="border-bottom: 1px solid #cbd5e1;">
                    <td style="padding: 12px; border: 1px solid #cbd5e1; font-weight: 600;">{{ result.course }}</td>
                    <td style="padding: 12px; border: 1px solid #cbd5e1; text-align: center;">{{ result.internal }}%</td>
                    <td style="padding: 12px; border: 1px solid #cbd5e1; text-align: center;">{{ result.external }}%</td>
                    <td style="padding: 12px; border: 1px solid #cbd5e1; text-align: center;">
                        <span style="font-weight: 700; font-size: 0.9rem; padding: 2px 8px; border-radius: 4px; background: #f1f5f9;">{{ result.grade }}</span>
                    </td>
                    <td style="padding: 12px; border: 1px solid #cbd5e1; text-align: center; font-weight: 700;" 
                        [style.color]="result.status === 'Pass' ? '#166534' : '#991b1b'">
                        {{ result.status }}
                    </td>
                </tr>
            </tbody>
        </table>
        
        <div style="margin-top: 35px; display: flex; justify-content: space-between; align-items: center; border-top: 2px dashed #cbd5e1; padding-top: 20px;">
            <div style="font-size: 1.1rem;">
                <strong>Calculated CGPA:</strong> <span style="font-size: 1.25rem; font-weight: bold; color: #1e3a8a;">{{ getStudentCGPA(sName) }}</span>
            </div>
            <div style="font-size: 1.1rem;">
                <strong>Academic Standing:</strong> 
                <span style="font-weight: bold; font-size: 1.2rem; text-transform: uppercase; padding: 4px 14px; border-radius: 8px;"
                      [style.background]="getStudentStanding(sName) === 'PASS' ? '#dcfce7' : '#fee2e2'"
                      [style.color]="getStudentStanding(sName) === 'PASS' ? '#15803d' : '#b91c1c'">
                    {{ getStudentStanding(sName) }}
                </span>
            </div>
        </div>

        <div style="margin-top: 60px; display: flex; justify-content: space-between;">
            <div style="text-align: center; width: 200px; border-top: 1px solid #475569; padding-top: 6px; font-size: 0.85rem; color: #475569;">
                Prepared By: Registrar Office
            </div>
            <div style="text-align: center; width: 200px; border-top: 1px solid #475569; padding-top: 6px; font-size: 0.85rem; color: #475569;">
                Authorized Controller of Exams
            </div>
        </div>
    </div>
</div>

<app-footer></app-footer>`,
  styles: [
    `.summary-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-bottom: 24px; }
    .section-card, .table-card { padding: 20px; background: #fff; border-radius: 10px; box-shadow: 0 1px 12px rgba(0,0,0,.06); margin-bottom: 24px; }
    .section-card h3, .table-card h2 { margin-top: 0; font-size: 1.1rem; color: #1f3d7a; }
    .section-card strong { display: block; font-size: 2rem; margin-top: 8px; margin-bottom: 8px; color: #333; }
    .pass-standing { color: #2e7d32 !important; }
    .action-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
    .action-row button { padding: 10px 18px; border: none; border-radius: 8px; background: #1976d2; color: #fff; cursor: pointer; font-weight: 600; }
    .btn-print { background: #10b981 !important; margin-left: 10px; }
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
    .print-header-details { display: none; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
    .batch-print-container { display: none; }
    
    @media print {
      body * {
        visibility: hidden;
      }
      /* If batch printing is active */
      body.batch-mode .batch-print-container,
      body.batch-mode .batch-print-container * {
        visibility: visible;
        display: block !important;
      }
      body.batch-mode .print-single-card {
        display: none !important;
      }
      
      /* Single transcript print */
      body:not(.batch-mode) .table-card, 
      body:not(.batch-mode) .table-card * {
        visibility: visible;
      }
      body:not(.batch-mode) .table-card {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        box-shadow: none !important;
        border: 2px solid #1e3a8a !important;
        padding: 35px !important;
        border-radius: 12px !important;
        margin: 0 !important;
        background: #ffffff !important;
      }
      body:not(.batch-mode) .table-card::before {
        content: "OUTCOME-BASED LEARNING MANAGEMENT SYSTEM\\A OFFICIAL ACADEMIC TRANSCRIPT\\A";
        display: block;
        text-align: center;
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 25px;
        white-space: pre-wrap;
        color: #1e3a8a;
      }
      body:not(.batch-mode) .print-header-details {
        display: block !important;
      }
      app-navbar, app-sidebar, app-footer, .page-header, .summary-grid, .action-row, .empty-state {
        display: none !important;
      }
    }
    `
  ]
})
export class Results implements OnInit {
  role: string | null = null;
  userName = 'User';
  currentDate = new Date();
  
  studentResults: StudentResult[] = [];
  filteredResults: StudentResult[] = [];
  downloadMessage = '';

  // Batch Printing bindings
  selectedStudentsForPrint: { [name: string]: boolean } = {};
  selectedBatchStudents: string[] = [];

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private syncService = inject(SyncService);
  private syncSub?: Subscription;

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

    this.syncSub = this.syncService.events$.subscribe((e) => {
      if (e.type === 'MARKS_CHANGED') {
        this.loadResultsData();
      }
    });
  }

  ngOnDestroy(): void {
    this.syncSub?.unsubscribe();
  }

  getObeWeights(): { internal: number; external: number } {
    let internal = 40;
    let external = 60;
    try {
      const saved = localStorage.getItem('systemSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.internalWeight !== undefined) internal = Number(parsed.internalWeight);
        if (parsed.externalWeight !== undefined) external = Number(parsed.externalWeight);
      }
    } catch {}
    return { internal, external };
  }

  calculateFinalScore(internal: number, external: number): number {
    const weights = this.getObeWeights();
    return Math.round(internal * (weights.internal / 100) + external * (weights.external / 100));
  }

  private processMarksIntoResults(marks: any[]): void {
    const weights = this.getObeWeights();
    const intRatio = weights.internal / 100;
    const extRatio = weights.external / 100;

    // Group marks by student and course
    const grouped = new Map<string, any>();

    marks.forEach((mark: any) => {
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
      const externalScore = Math.min(100, Math.max(0, Math.round(internalScore - 5)));
      const finalScore = Math.round(internalScore * intRatio + externalScore * extRatio);

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

    // Filter results based on student role
    if (this.role === 'student') {
      this.filteredResults = this.studentResults.filter(
        r => r.student.toLowerCase() === this.userName.toLowerCase()
      );
    } else {
      this.filteredResults = [...this.studentResults];
      this.filteredResults.forEach(r => {
        if (this.selectedStudentsForPrint[r.student] === undefined) {
          this.selectedStudentsForPrint[r.student] = false;
        }
      });
    }
    this.cdr.detectChanges();
  }

  private loadResultsData(): void {
    // 1. Load from localStorage immediately
    try {
      const stored = localStorage.getItem('obslmsMarkEntries');
      if (stored) {
        const localMarks = JSON.parse(stored);
        if (Array.isArray(localMarks) && localMarks.length > 0) {
          this.processMarksIntoResults(localMarks);
        }
      }
    } catch {}

    // 2. Fetch from backend API
    this.http.get<any[]>('http://localhost:8080/api/obe/marks').subscribe({
      next: (marks) => {
        if (Array.isArray(marks) && marks.length > 0) {
          this.processMarksIntoResults(marks);
        }
      },
      error: () => {
        // Backend offline, already rendered local marks
      }
    });
  }

  // Selection helpers
  selectAllStudents(event: any): void {
    const checked = event.target.checked;
    this.filteredResults.forEach(r => {
      this.selectedStudentsForPrint[r.student] = checked;
    });
  }

  isAllSelected(): boolean {
    if (this.filteredResults.length === 0) return false;
    return this.filteredResults.every(r => this.selectedStudentsForPrint[r.student]);
  }

  getSelectedCount(): number {
    return Object.keys(this.selectedStudentsForPrint).filter(k => this.selectedStudentsForPrint[k]).length;
  }

  getStudentResultsList(name: string): StudentResult[] {
    return this.studentResults.filter(r => r.student === name);
  }

  getStudentCGPA(name: string): number {
    const list = this.getStudentResultsList(name);
    if (!list.length) return 0;
    const weights = this.getObeWeights();
    const intRatio = weights.internal / 100;
    const extRatio = weights.external / 100;
    const averages = list.map(r => {
      const finalScore = r.internal * intRatio + r.external * extRatio;
      return (finalScore / 100) * 10;
    });
    const avg = averages.reduce((sum, val) => sum + val, 0) / averages.length;
    return Number(avg.toFixed(2));
  }

  getStudentStanding(name: string): string {
    const list = this.getStudentResultsList(name);
    if (!list.length) return 'FAIL';
    return list.every(r => r.status === 'Pass') ? 'PASS' : 'FAIL';
  }

  triggerBatchPrint(): void {
    const selected = Object.keys(this.selectedStudentsForPrint).filter(k => this.selectedStudentsForPrint[k]);
    if (selected.length === 0) {
      alert('Please select at least one student to export batch transcripts.');
      return;
    }
    
    this.selectedBatchStudents = selected;
    document.body.classList.add('batch-mode');
    
    // Log the print action
    try {
      const activeAdmin = localStorage.getItem('userName') || 'Admin';
      const stored = localStorage.getItem('obslmsAuditLogs');
      const logs = stored ? JSON.parse(stored) : [];
      logs.unshift({
        user: activeAdmin,
        action: `Exported Batch Transcripts for: ${selected.join(', ')}`,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('obslmsAuditLogs', JSON.stringify(logs));
    } catch {}

    setTimeout(() => {
      window.print();
      this.selectedBatchStudents = [];
      document.body.classList.remove('batch-mode');
    }, 100);
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
    const weights = this.getObeWeights();
    const intRatio = weights.internal / 100;
    const extRatio = weights.external / 100;
    const averages = this.filteredResults.map(r => {
      const finalScore = r.internal * intRatio + r.external * extRatio;
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

  printTranscript(): void {
    window.print();
  }
}
