import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { HttpClient } from '@angular/common/http';
import { SyncService } from '../../shared/services/sync.service';
import { ToastService } from '../../shared/services/toast.service';
import { Subscription } from 'rxjs';

export interface SemesterCourseRecord {
  courseCode: string;
  courseTitle: string;
  credits: number;
  internalMarks: number;
  externalMarks: number;
  totalMarks: number;
  grade: string;
  gradePoints: number;
  status: 'Pass' | 'Fail';
}

export interface StudentResult {
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
            <div class="header-text-block">
                <h1>📋 Student Semester Results & Marksheet</h1>
                <p>{{ role === 'student' ? 'Official semester performance transcript, SGPA/CGPA breakdown, and complete marksheet download.' : 'Faculty & Admin dashboard for viewing individual student marksheets, semester results, and class analytics.' }}</p>
            </div>
            
            <!-- View Mode Switcher for Faculty and Admin -->
            <div class="mode-toggle-group" *ngIf="role !== 'student'">
                <button type="button" 
                        class="mode-btn" 
                        [class.active]="viewMode === 'class'" 
                        (click)="setViewMode('class')">
                    <span class="material-icons">groups</span> Class Overview
                </button>
                <button type="button" 
                        class="mode-btn" 
                        [class.active]="viewMode === 'student'" 
                        (click)="setViewMode('student')">
                    <span class="material-icons">person_search</span> Student Marksheet View
                </button>
            </div>
        </div>

        <!-- Student Selector Banner for Faculty & Admin when in Student View Mode -->
        <div class="student-picker-banner" *ngIf="role !== 'student' && viewMode === 'student'">
            <div class="picker-label-wrap">
                <span class="material-icons picker-icon">account_circle</span>
                <div>
                    <span class="picker-sub">Selected Student:</span>
                    <strong class="picker-name">{{ studentName }} ({{ studentRoll }})</strong>
                </div>
            </div>
            <div class="picker-controls">
                <label for="studentSelect" class="picker-select-label">Choose Student:</label>
                <select id="studentSelect" class="student-dropdown" [(ngModel)]="studentName" (ngModelChange)="onStudentSelect($event)">
                    <option *ngFor="let stu of availableStudentsList" [value]="stu.name">
                        {{ stu.name }} ({{ stu.roll || 'CUTM' }}) - {{ stu.dept || 'CSE' }}
                    </option>
                </select>
                <button type="button" class="btn-switch-back" (click)="setViewMode('class')">
                    ← Back to Class Overview
                </button>
            </div>
        </div>

        <!-- Semester Selection Filter Toolbar -->
        <div class="semester-filter-toolbar">
            <div class="semester-header-info">
                <span class="toolbar-title">🎓 Choose Semester:</span>
                <span class="active-sem-tag">{{ selectedSemester }}</span>
            </div>
            <div class="semester-pills">
                <button *ngFor="let sem of semesterOptions" 
                        type="button" 
                        class="sem-pill" 
                        [class.active]="selectedSemester === sem"
                        (click)="selectSemester(sem)">
                    {{ sem }}
                </button>
            </div>
        </div>

        <!-- Summary Statistics (Faculty/Admin Class Overview) -->
        <div class="summary-grid" *ngIf="role !== 'student' && viewMode === 'class'">
            <div class="section-card">
                <h3>Total Evaluated Students</h3>
                <strong>{{ availableStudentsList.length || 3 }}</strong>
                <p>Registered students across active courses.</p>
            </div>
            <div class="section-card">
                <h3>Internal Average</h3>
                <strong>{{ internalAverage }}%</strong>
                <p>Average internal score across class.</p>
            </div>
            <div class="section-card">
                <h3>External Average</h3>
                <strong>{{ externalAverage }}%</strong>
                <p>Average external score across class.</p>
            </div>
            <div class="section-card">
                <h3>Class Pass Rate</h3>
                <strong style="color: #4ade80;">{{ passRate }}%</strong>
                <p>Passing percentage for evaluated subjects.</p>
            </div>
        </div>

        <!-- Student Personal Summary (Student View & Faculty/Admin Single Student View) -->
        <div class="summary-grid" *ngIf="role === 'student' || viewMode === 'student'">
            <div class="section-card">
                <h3>Semester SGPA</h3>
                <strong style="color: #d4af37;">{{ semesterSgpa }}</strong>
                <p>{{ selectedSemester }} Grade Point Average.</p>
            </div>
            <div class="section-card">
                <h3>Cumulative CGPA</h3>
                <strong style="color: #60a5fa;">{{ cumulativeCgpa }}</strong>
                <p>Overall computed CGPA (All Semesters).</p>
            </div>
            <div class="section-card">
                <h3>Credits Earned</h3>
                <strong style="color: #4ade80;">{{ semesterCredits.earned }} / {{ semesterCredits.registered }}</strong>
                <p>{{ selectedSemester === 'All Semesters' ? 'Total credits completed across all semesters' : 'Credits earned in ' + selectedSemester }}.</p>
            </div>
            <div class="section-card">
                <h3>Academic Standing</h3>
                <strong class="pass-standing">PASS (DISTINCTION)</strong>
                <p>All enrolled courses cleared successfully.</p>
            </div>
        </div>

        <div class="action-row">
            <button type="button" class="btn-download" (click)="downloadResults()">
                📥 Download {{ studentName }}'s {{ selectedSemester }} Marksheet (CSV)
            </button>
            <button type="button" class="btn-print" (click)="printTranscript()" *ngIf="role === 'student' || viewMode === 'student'">
                🖨️ Export Official Marksheet PDF ({{ studentName }})
            </button>
            <button type="button" class="btn-print" (click)="triggerBatchPrint()" *ngIf="role !== 'student' && viewMode === 'class'" style="background: #10b981;">
                🖨️ Export Batch Transcripts (Selected: {{ getSelectedCount() }})
            </button>
            <span class="status-message" *ngIf="downloadMessage">{{ downloadMessage }}</span>
        </div>

        <div class="table-card">
            <!-- Print Only Header Details (Single student view) -->
            <div class="print-header-details">
                <div class="inst-banner">
                    <h2 style="margin: 0; color: #1e3a8a; font-size: 1.6rem; text-transform: uppercase;">Centurion University of Technology and Management</h2>
                    <p style="margin: 4px 0 0; color: #475569; font-size: 0.95rem; font-weight: 700;">Department of {{ studentDept }} | OBE Examination Cell</p>
                    <p style="margin: 2px 0 0; color: #0d9488; font-size: 1.1rem; font-weight: 800;">OFFICIAL NOTIFICATION OF SEMESTER MARKS & TRANSCRIPT</p>
                </div>
                <div class="student-meta-box">
                    <div><strong>Student Name:</strong> {{ studentName }}</div>
                    <div><strong>Registration / Roll No:</strong> {{ studentRoll }}</div>
                    <div><strong>Academic Program:</strong> Bachelor of Technology (CSE)</div>
                    <div><strong>Semester Evaluated:</strong> {{ selectedSemester }}</div>
                    <div><strong>Academic Session:</strong> 2025 - 2026</div>
                    <div><strong>Evaluation Schema:</strong> Internal 40% + External 60%</div>
                </div>
            </div>
            
            <div class="table-header-row">
                <h2>{{ (role === 'student' || viewMode === 'student') ? studentName + ' — ' + selectedSemester + ' Official Grade Sheet' : 'Class Results & Student Performance' }}</h2>
                <div class="sem-stats-pills" *ngIf="role === 'student' || viewMode === 'student'">
                    <span class="stat-badge">Student: <strong>{{ studentName }}</strong></span>
                    <span class="stat-badge">Semester: <strong>{{ selectedSemester }}</strong></span>
                    <span class="stat-badge">SGPA: <strong>{{ semesterSgpa }}</strong></span>
                    <span class="stat-badge">Credits: <strong>{{ semesterCredits.earned }}</strong></span>
                    <span class="stat-badge status-pass">Result: <strong>PASS</strong></span>
                </div>
            </div>
            
            <!-- Student Semester Detailed Table (Shown in Student Role OR Faculty/Admin Single Student View) -->
            <table *ngIf="role === 'student' || viewMode === 'student'">
                <thead>
                    <tr>
                        <th style="width: 110px;">Code</th>
                        <th>Course Title</th>
                        <th style="text-align: center; width: 75px;">Credits</th>
                        <th style="text-align: center; width: 130px;">Internal (40%)</th>
                        <th style="text-align: center; width: 130px;">External (60%)</th>
                        <th style="text-align: center; width: 110px;">Total (100)</th>
                        <th style="text-align: center; width: 90px;">Grade</th>
                        <th style="text-align: center; width: 90px;">Grade Pts</th>
                        <th style="text-align: center; width: 90px;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let c of displayedCourses">
                        <td><strong style="color: #60a5fa; font-family: monospace;">{{ c.courseCode }}</strong></td>
                        <td>{{ c.courseTitle }}</td>
                        <td style="text-align: center;">{{ c.credits }}</td>
                        <td style="text-align: center;">{{ c.internalMarks }} / 40</td>
                        <td style="text-align: center;">{{ c.externalMarks }} / 60</td>
                        <td style="text-align: center; font-weight: 800; color: #ffffff;">{{ c.totalMarks }}</td>
                        <td style="text-align: center;">
                            <span class="grade-badge" [class.excellent]="c.grade === 'O' || c.grade === 'A+'">{{ c.grade }}</span>
                        </td>
                        <td style="text-align: center;"><strong>{{ c.gradePoints }}</strong></td>
                        <td style="text-align: center;">
                            <span class="status-pill pass">{{ c.status }}</span>
                        </td>
                    </tr>
                </tbody>
            </table>

            <!-- Semester Summary Footer for Student View -->
            <div class="student-sem-summary-footer" *ngIf="role === 'student' || viewMode === 'student'">
                <div class="summary-metric-item">
                    <span>Total Courses:</span>
                    <strong>{{ displayedCourses.length }}</strong>
                </div>
                <div class="summary-metric-item">
                    <span>Total Credits:</span>
                    <strong>{{ semesterCredits.registered }} Credits</strong>
                </div>
                <div class="summary-metric-item">
                    <span>Semester SGPA:</span>
                    <strong style="color: #d4af37;">{{ semesterSgpa }} / 10.00</strong>
                </div>
                <div class="summary-metric-item">
                    <span>Overall CGPA:</span>
                    <strong style="color: #60a5fa;">{{ cumulativeCgpa }} / 10.00</strong>
                </div>
                <div class="summary-metric-item">
                    <span>Semester Standing:</span>
                    <strong style="color: #4ade80;">PASSED WITH DISTINCTION</strong>
                </div>
            </div>

            <!-- Faculty / Admin Class Overview Table -->
            <table *ngIf="role !== 'student' && viewMode === 'class' && filteredResults.length > 0">
                <thead>
                    <tr>
                        <th style="width: 40px; text-align: center;">
                            <input type="checkbox" (change)="selectAllStudents($event)" [checked]="isAllSelected()" />
                        </th>
                        <th>Student Name</th>
                        <th>Course / Assessment</th>
                        <th style="text-align: center;">Internal ({{ getObeWeights().internal }}%)</th>
                        <th style="text-align: center;">External ({{ getObeWeights().external }}%)</th>
                        <th style="text-align: center;">Final Grade</th>
                        <th style="text-align: center;">Status</th>
                        <th style="text-align: center; width: 140px;">Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let result of filteredResults">
                        <td style="text-align: center;">
                            <input type="checkbox" [(ngModel)]="selectedStudentsForPrint[result.student]" />
                        </td>
                        <td>
                            <strong style="color: #ffffff;">{{ result.student }}</strong>
                        </td>
                        <td>{{ result.course }}</td>
                        <td style="text-align: center;">{{ result.internal }}%</td>
                        <td style="text-align: center;">{{ result.external }}%</td>
                        <td style="text-align: center;"><span class="grade-badge" [class.excellent]="result.grade === 'O' || result.grade === 'A+'">{{ result.grade }}</span></td>
                        <td style="text-align: center;"><span class="status-pill" [class.pass]="result.status === 'Pass'" [class.fail]="result.status === 'Fail'">{{ result.status }}</span></td>
                        <td style="text-align: center;">
                            <button type="button" class="btn-view-single" (click)="viewSpecificStudent(result.student)" title="View complete marksheet for {{ result.student }}">
                                👁️ View Marksheet
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
            <p *ngIf="role !== 'student' && viewMode === 'class' && filteredResults.length === 0" class="empty-state">No academic results match your search.</p>

            <!-- Signatures for Printed Marksheet -->
            <div class="print-signatures-area">
                <div class="sig-col">
                    <div class="sig-line">Prepared & Verified By</div>
                    <small>Office of the Examination Section</small>
                </div>
                <div class="sig-col">
                    <div class="sig-line">Head of Department (CSE)</div>
                    <small>School of Engineering & Technology</small>
                </div>
                <div class="sig-col">
                    <div class="sig-line">Controller of Examinations</div>
                    <small>Centurion University</small>
                </div>
            </div>
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
    `
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 20px;
    }
    .header-text-block h1 {
      margin: 0;
      color: #ffffff;
      font-size: 1.6rem;
      font-weight: 800;
    }
    .header-text-block p {
      margin: 4px 0 0;
      color: #94a3b8;
      font-size: 0.92rem;
    }
    .mode-toggle-group {
      display: flex;
      gap: 8px;
      background: #091024;
      padding: 4px;
      border-radius: 10px;
      border: 1px solid #1f2f54;
    }
    .mode-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: transparent;
      color: #94a3b8;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .mode-btn .material-icons {
      font-size: 18px;
    }
    .mode-btn.active {
      background: linear-gradient(135deg, #d4af37 0%, #b38f28 100%);
      color: #0a1128;
      box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
    }
    .mode-btn:not(.active):hover {
      background: #18284e;
      color: #ffffff;
    }

    .student-picker-banner {
      background: linear-gradient(135deg, #101f42 0%, #0d1733 100%);
      border: 1px solid #2a4175;
      border-radius: 12px;
      padding: 14px 20px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 14px;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.3);
    }
    .picker-label-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .picker-icon {
      font-size: 32px;
      color: #d4af37;
    }
    .picker-sub {
      display: block;
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      font-weight: 700;
    }
    .picker-name {
      color: #ffffff;
      font-size: 1.05rem;
    }
    .picker-controls {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .picker-select-label {
      color: #cbd5e1;
      font-weight: 700;
      font-size: 13px;
    }
    .student-dropdown {
      padding: 8px 14px;
      border-radius: 8px;
      border: 1px solid #1f2f54;
      background: #091024;
      color: #ffffff;
      font-weight: 600;
      font-size: 13.5px;
      outline: none;
      min-width: 240px;
      cursor: pointer;
    }
    .btn-switch-back {
      padding: 8px 14px;
      border-radius: 8px;
      background: #18284e;
      color: #cbd5e1;
      border: 1px solid #2a4175;
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-switch-back:hover {
      background: #243b70;
      color: #ffffff;
    }
    .btn-view-single {
      background: rgba(212, 175, 55, 0.15);
      color: #fde68a;
      border: 1px solid rgba(212, 175, 55, 0.35);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-view-single:hover {
      background: #d4af37;
      color: #0a1128;
      transform: translateY(-1px);
    }

    .semester-filter-toolbar {
      background: #101b38;
      border: 1px solid #1f2f54;
      border-radius: 14px;
      padding: 16px 20px;
      margin-bottom: 22px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .semester-header-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .toolbar-title {
      color: #cbd5e1;
      font-weight: 700;
      font-size: 14px;
    }
    .active-sem-tag {
      background: rgba(212, 175, 55, 0.2);
      color: #d4af37;
      border: 1px solid rgba(212, 175, 55, 0.4);
      padding: 3px 10px;
      border-radius: 6px;
      font-weight: 800;
      font-size: 12px;
      text-transform: uppercase;
    }
    .semester-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .sem-pill {
      background: #091024;
      color: #94a3b8;
      border: 1px solid #1f2f54;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .sem-pill:hover {
      background: #18284e;
      color: #ffffff;
      border-color: #d4af37;
      transform: translateY(-1px);
    }
    .sem-pill.active {
      background: linear-gradient(135deg, #d4af37 0%, #b38f28 100%);
      color: #0a1128;
      border-color: #d4af37;
      box-shadow: 0 4px 14px rgba(212, 175, 55, 0.3);
    }

    .summary-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-bottom: 24px; }
    .section-card, .table-card { padding: 22px; background: #101b38; border: 1px solid #1f2f54; border-radius: 14px; box-shadow: 0 8px 24px rgba(0,0,0,.35); margin-bottom: 24px; }
    .section-card h3, .table-card h2 { margin-top: 0; font-size: 1.1rem; color: #ffffff; font-weight: 800; }
    .section-card strong { display: block; font-size: 2rem; margin-top: 8px; margin-bottom: 8px; color: #ffffff; }
    .pass-standing { color: #4ade80 !important; font-size: 1.4rem !important; }
    
    .action-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-bottom: 22px; }
    .btn-download {
      padding: 12px 22px;
      border: none;
      border-radius: 8px;
      background: linear-gradient(135deg, #d4af37 0%, #b38f28 100%);
      color: #0a1128;
      cursor: pointer;
      font-weight: 800;
      font-size: 14px;
      box-shadow: 0 4px 14px rgba(212,175,55,0.3);
      transition: all 0.2s ease;
    }
    .btn-download:hover { filter: brightness(1.1); transform: translateY(-1px); }
    .btn-print { background: #10b981 !important; color: white !important; padding: 12px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 13.5px; }
    .btn-print:hover { filter: brightness(1.1); }
    .status-message { color: #4ade80; font-weight: 700; background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(74, 222, 128, 0.3); padding: 8px 14px; border-radius: 8px; font-size: 13px; }
    
    .table-header-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
    .sem-stats-pills { display: flex; gap: 8px; flex-wrap: wrap; }
    .stat-badge { background: #091024; border: 1px solid #1f2f54; color: #cbd5e1; padding: 4px 10px; border-radius: 6px; font-size: 12px; }
    .stat-badge strong { color: #ffffff; margin-left: 4px; }
    .stat-badge.status-pass { background: rgba(34, 197, 94, 0.15); border-color: rgba(74, 222, 128, 0.3); color: #4ade80; }
    .stat-badge.status-pass strong { color: #4ade80; }

    .table-card table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    .table-card th, .table-card td { padding: 12px 14px; border-bottom: 1px solid #1f2f54; text-align: left; }
    .table-card th { font-weight: 700; color: #d4af37; background: #132247; text-transform: uppercase; font-size: 0.82rem; }
    .table-card td { color: #e2e8f0; font-size: 13.5px; }
    .table-card tbody tr:hover { background: #18284e; }
    
    .grade-badge { background: #091024; color: #d4af37; border: 1px solid #1f2f54; padding: 4px 8px; border-radius: 8px; font-size: 0.85rem; font-weight: 800; font-family: monospace; }
    .grade-badge.excellent { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.3); }
    
    .status-pill { font-size: 0.8rem; font-weight: 800; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; }
    .status-pill.pass { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.3); }
    .status-pill.fail { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.3); }
    .empty-state { text-align: center; color: #94a3b8; padding: 40px 20px; background: #091024; border: 1px solid #1f2f54; border-radius: 12px; }

    .student-sem-summary-footer {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      justify-content: space-between;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #1f2f54;
      background: #091024;
      border-radius: 10px;
      padding: 14px 18px;
    }
    .summary-metric-item {
      display: flex;
      flex-direction: column;
      font-size: 12px;
      color: #94a3b8;
    }
    .summary-metric-item strong {
      font-size: 15px;
      color: #ffffff;
      margin-top: 2px;
    }

    .print-header-details { display: none; }
    .print-signatures-area { display: none; }
    .batch-print-container { display: none; }
    
    @media print {
      body * {
        visibility: hidden;
      }
      body.batch-mode .batch-print-container,
      body.batch-mode .batch-print-container * {
        visibility: visible;
        display: block !important;
      }
      body.batch-mode .print-single-card {
        display: none !important;
      }
      
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
        padding: 30px !important;
        border-radius: 10px !important;
        margin: 0 !important;
        background: #ffffff !important;
        color: #1e293b !important;
      }
      body:not(.batch-mode) .print-header-details {
        display: block !important;
        margin-bottom: 20px;
        border-bottom: 2px solid #1e3a8a;
        padding-bottom: 12px;
      }
      body:not(.batch-mode) .inst-banner {
        text-align: center;
        margin-bottom: 14px;
      }
      body:not(.batch-mode) .student-meta-box {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        padding: 10px 14px;
        border-radius: 6px;
        font-size: 12px;
        color: #1e293b;
      }
      body:not(.batch-mode) table {
        border-collapse: collapse;
        width: 100%;
        margin-top: 15px;
      }
      body:not(.batch-mode) th {
        background: #1e40af !important;
        color: #ffffff !important;
        border: 1px solid #1e40af !important;
        padding: 8px 10px !important;
        font-size: 11px !important;
      }
      body:not(.batch-mode) td {
        border: 1px solid #cbd5e1 !important;
        color: #1e293b !important;
        padding: 8px 10px !important;
        font-size: 11px !important;
      }
      body:not(.batch-mode) .student-sem-summary-footer {
        background: #f8fafc !important;
        border: 1px solid #cbd5e1 !important;
        color: #1e293b !important;
        margin-top: 15px !important;
      }
      body:not(.batch-mode) .summary-metric-item strong {
        color: #1e3a8a !important;
      }
      body:not(.batch-mode) .print-signatures-area {
        display: flex !important;
        justify-content: space-between;
        margin-top: 50px;
        padding-top: 20px;
      }
      body:not(.batch-mode) .sig-col {
        text-align: center;
        width: 180px;
        border-top: 1px solid #475569;
        padding-top: 6px;
        font-size: 11px;
        font-weight: 700;
        color: #1e293b;
      }
      app-navbar, app-sidebar, app-footer, .page-header, .semester-filter-toolbar, .summary-grid, .action-row, .empty-state, .sem-stats-pills {
        display: none !important;
      }
    }
    `
  ]
})
export class Results implements OnInit, OnDestroy {
  role: string | null = null;
  userName = 'Student';
  studentName = 'vamsi';
  studentRoll = '646456455';
  studentDept = 'Computer Science & Engineering';
  currentDate = new Date();

  viewMode: 'class' | 'student' = 'class';

  semesterOptions: string[] = [
    'Semester 1',
    'Semester 2',
    'Semester 3',
    'Semester 4',
    'Semester 5',
    'Semester 6',
    'Semester 7',
    'Semester 8',
    'All Semesters'
  ];

  selectedSemester: string = 'Semester 6';
  downloadMessage = '';

  studentResults: StudentResult[] = [];
  filteredResults: StudentResult[] = [];

  availableStudentsList: { name: string; roll: string; dept: string; email: string }[] = [
    { name: 'vamsi', roll: '646456455', dept: 'Computer Science & Engineering', email: 'vamsi1201@gmail.com' },
    { name: 'Krishnavamsi', roll: 'CUTM2026CSE042', dept: 'Computer Science & Engineering', email: 'krishnavamsi1201@gmail.com' },
    { name: 'Raj Kumar', roll: 'CUTM2026CSE018', dept: 'Computer Science & Engineering', email: 'raj.kumar@oblms.edu' },
    { name: 'zing', roll: '4444444556', dept: 'Civil Engineering', email: 'zing@gmail.com' },
    { name: 'Aarav Mehta', roll: 'CUTM2026CSE003', dept: 'Computer Science & Engineering', email: 'aarav.mehta@oblms.edu' }
  ];

  // Batch Printing bindings
  selectedStudentsForPrint: { [name: string]: boolean } = {};
  selectedBatchStudents: string[] = [];

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private syncService = inject(SyncService);
  private toastService = inject(ToastService);
  private syncSub?: Subscription;

  // Complete 8-Semester Academic Curriculum with Official Grades
  semesterCurriculumData: { [sem: string]: SemesterCourseRecord[] } = {
    'Semester 1': [
      { courseCode: 'MA101', courseTitle: 'Engineering Mathematics I (Calculus & Matrices)', credits: 4, internalMarks: 38, externalMarks: 56, totalMarks: 94, grade: 'O', gradePoints: 10, status: 'Pass' },
      { courseCode: 'PH101', courseTitle: 'Engineering Physics & Quantum Optics', credits: 4, internalMarks: 35, externalMarks: 52, totalMarks: 87, grade: 'A+', gradePoints: 9, status: 'Pass' },
      { courseCode: 'EE101', courseTitle: 'Basic Electrical & Electronics Engineering', credits: 3, internalMarks: 33, externalMarks: 49, totalMarks: 82, grade: 'A+', gradePoints: 9, status: 'Pass' },
      { courseCode: 'CS100', courseTitle: 'Computer Programming Fundamentals with C', credits: 4, internalMarks: 39, externalMarks: 58, totalMarks: 97, grade: 'O', gradePoints: 10, status: 'Pass' },
      { courseCode: 'HS101', courseTitle: 'Communicative English & Professional Skills', credits: 2, internalMarks: 36, externalMarks: 52, totalMarks: 88, grade: 'A+', gradePoints: 9, status: 'Pass' },
      { courseCode: 'CS100L', courseTitle: 'C Programming & Linux Terminal Laboratory', credits: 2, internalMarks: 39, externalMarks: 58, totalMarks: 97, grade: 'O', gradePoints: 10, status: 'Pass' },
      { courseCode: 'PH101L', courseTitle: 'Physics & Optical Measurements Laboratory', credits: 2, internalMarks: 38, externalMarks: 56, totalMarks: 94, grade: 'O', gradePoints: 10, status: 'Pass' }
    ],
    'Semester 2': [
      { courseCode: 'MA102', courseTitle: 'Engineering Mathematics II (ODEs & Vector Calculus)', credits: 4, internalMarks: 36, externalMarks: 54, totalMarks: 90, grade: 'O', gradePoints: 10, status: 'Pass' },
      { courseCode: 'CH101', courseTitle: 'Engineering Chemistry & Material Science', credits: 3, internalMarks: 34, externalMarks: 49, totalMarks: 83, grade: 'A+', gradePoints: 9, status: 'Pass' },
      { courseCode: 'EC101', courseTitle: 'Digital Electronics & Semiconductor Devices', credits: 3, internalMarks: 35, externalMarks: 51, totalMarks: 86, grade: 'A+', gradePoints: 9, status: 'Pass' },
      { courseCode: 'CS102', courseTitle: 'Data Structures & Algorithms with C/C++', credits: 4, internalMarks: 38, externalMarks: 57, totalMarks: 95, grade: 'O', gradePoints: 10, status: 'Pass' },
      { courseCode: 'ME101', courseTitle: 'Engineering Graphics & CAD Modeling', credits: 3, internalMarks: 35, externalMarks: 51, totalMarks: 86, grade: 'A+', gradePoints: 9, status: 'Pass' },
      { courseCode: 'CS102L', courseTitle: 'Data Structures & Algorithms Laboratory', credits: 2, internalMarks: 39, externalMarks: 59, totalMarks: 98, grade: 'O', gradePoints: 10, status: 'Pass' },
      { courseCode: 'CH101L', courseTitle: 'Chemistry & Environmental Analysis Laboratory', credits: 2, internalMarks: 38, externalMarks: 55, totalMarks: 93, grade: 'O', gradePoints: 10, status: 'Pass' }
    ],
    'Semester 3': [
      { courseCode: 'CS201', courseTitle: 'Discrete Mathematical Structures & Graph Theory', credits: 4, internalMarks: 36, externalMarks: 53, totalMarks: 89, grade: 'A+', gradePoints: 9, status: 'Pass' },
      { courseCode: 'CS202', courseTitle: 'Computer Organization & Logic Architecture', credits: 4, internalMarks: 37, externalMarks: 54, totalMarks: 91, grade: 'O', gradePoints: 10, status: 'Pass' },
      { courseCode: 'CS103', courseTitle: 'Object-Oriented Programming with Java', credits: 4, internalMarks: 39, externalMarks: 58, totalMarks: 97, grade: 'O', gradePoints: 10, status: 'Pass' },
      { courseCode: 'CS204', courseTitle: 'Data Communications & Transmission Standards', credits: 3, internalMarks: 34, externalMarks: 50, totalMarks: 84, grade: 'A+', gradePoints: 9, status: 'Pass' },
      { courseCode: 'MA201', courseTitle: 'Probability, Random Variables & Queueing Theory', credits: 3, internalMarks: 33, externalMarks: 49, totalMarks: 82, grade: 'A+', gradePoints: 9, status: 'Pass' },
      { courseCode: 'CS103L', courseTitle: 'Java Programming & OOP Laboratory', credits: 2, internalMarks: 40, externalMarks: 58, totalMarks: 98, grade: 'O', gradePoints: 10, status: 'Pass' },
      { courseCode: 'CS202L', courseTitle: 'Digital Logic & Micro-Architecture Simulation Lab', credits: 2, internalMarks: 38, externalMarks: 56, totalMarks: 94, grade: 'O', gradePoints: 10, status: 'Pass' }
    ],
    'Semester 4': [
      { courseCode: 'CS205', courseTitle: 'Operating Systems & Kernel Programming', credits: 4, internalMarks: 37, externalMarks: 55, totalMarks: 92, grade: 'O', gradePoints: 10, status: 'Pass' },
      { courseCode: 'CS101', courseTitle: 'Database Management Systems & Relational SQL', credits: 4, internalMarks: 38, externalMarks: 56, totalMarks: 94, grade: 'O', gradePoints: 10, status: 'Pass' },
      { courseCode: 'CS207', courseTitle: 'Formal Languages & Automata Theory (FLAT)', credits: 4, internalMarks: 35, externalMarks: 51, totalMarks: 86, grade: 'A+', gradePoints: 9, status: 'Pass' },
      { courseCode: 'CS303', courseTitle: 'Design & Analysis of Algorithms', credits: 4, internalMarks: 38, externalMarks: 57, totalMarks: 95, grade: 'O', gradePoints: 10, status: 'Pass' },
      { courseCode: 'HS201', courseTitle: 'Universal Human Values & Professional Ethics', credits: 2, internalMarks: 36, externalMarks: 52, totalMarks: 88, grade: 'A+', gradePoints: 9, status: 'Pass' },
      { courseCode: 'CS205L', courseTitle: 'Operating Systems & Shell Scripting Lab', credits: 2, internalMarks: 39, externalMarks: 58, totalMarks: 97, grade: 'O', gradePoints: 10, status: 'Pass' },
      { courseCode: 'CS101L', courseTitle: 'RDBMS & Query Optimization Laboratory', credits: 2, internalMarks: 39, externalMarks: 59, totalMarks: 98, grade: 'O', gradePoints: 10, status: 'Pass' }
    ],
    'Semester 5': [
      { courseCode: 'CS301', courseTitle: 'Computer Networks & Network Protocols', credits: 4, internalMarks: 38, externalMarks: 56, totalMarks: 94, grade: 'O', gradePoints: 10, status: 'Pass' },
      { courseCode: 'CS302', courseTitle: 'Software Engineering & Agile Methodology', credits: 3, internalMarks: 37, externalMarks: 54, totalMarks: 91, grade: 'O', gradePoints: 10, status: 'Pass' },
      { courseCode: 'CS304', courseTitle: 'Web Technologies & Full-Stack Development', credits: 4, internalMarks: 38, externalMarks: 57, totalMarks: 95, grade: 'O', gradePoints: 10, status: 'Pass' },
      { courseCode: 'CS305', courseTitle: 'Microprocessors & Embedded Systems', credits: 3, internalMarks: 34, externalMarks: 50, totalMarks: 84, grade: 'A+', gradePoints: 9, status: 'Pass' },
      { courseCode: 'CS306', courseTitle: 'Open Elective: Artificial Intelligence Foundations', credits: 3, internalMarks: 36, externalMarks: 53, totalMarks: 89, grade: 'A+', gradePoints: 9, status: 'Pass' },
      { courseCode: 'CS301L', courseTitle: 'Computer Networks & Socket Laboratory', credits: 2, internalMarks: 39, externalMarks: 58, totalMarks: 97, grade: 'O', gradePoints: 10, status: 'Pass' },
      { courseCode: 'CS304L', courseTitle: 'Full-Stack Web Development Laboratory', credits: 2, internalMarks: 40, externalMarks: 59, totalMarks: 99, grade: 'O', gradePoints: 10, status: 'Pass' }
    ],
    'Semester 6': [
      { courseCode: 'CS307', courseTitle: 'Machine Learning & Neural Networks', credits: 4, internalMarks: 38, externalMarks: 56, totalMarks: 94, grade: 'O', gradePoints: 10, status: 'Pass' },
      { courseCode: 'CS308', courseTitle: 'Compiler Design & Language Translation', credits: 4, internalMarks: 35, externalMarks: 52, totalMarks: 87, grade: 'A+', gradePoints: 9, status: 'Pass' },
      { courseCode: 'CS309', courseTitle: 'Cloud Infrastructure & DevOps CI/CD Pipelines', credits: 3, internalMarks: 37, externalMarks: 55, totalMarks: 92, grade: 'O', gradePoints: 10, status: 'Pass' },
      { courseCode: 'CS310', courseTitle: 'Cryptography & Information Security', credits: 3, internalMarks: 36, externalMarks: 53, totalMarks: 89, grade: 'A+', gradePoints: 9, status: 'Pass' },
      { courseCode: 'CS311', courseTitle: 'Mobile Application Engineering (Flutter / React Native)', credits: 3, internalMarks: 38, externalMarks: 56, totalMarks: 94, grade: 'O', gradePoints: 10, status: 'Pass' },
      { courseCode: 'CS307L', courseTitle: 'Machine Learning & Data Pipeline Lab', credits: 2, internalMarks: 39, externalMarks: 58, totalMarks: 97, grade: 'O', gradePoints: 10, status: 'Pass' },
      { courseCode: 'CS312', courseTitle: 'Mini Project / Industrial Internship Phase', credits: 2, internalMarks: 40, externalMarks: 59, totalMarks: 99, grade: 'O', gradePoints: 10, status: 'Pass' }
    ],
    'Semester 7': [
      { courseCode: 'CS401', courseTitle: 'Big Data Analytics & Distributed Data Lakes', credits: 4, internalMarks: 37, externalMarks: 55, totalMarks: 92, grade: 'O', gradePoints: 10, status: 'Pass' },
      { courseCode: 'CS402', courseTitle: 'Internet of Things (IoT) & Smart Embedded Systems', credits: 3, internalMarks: 36, externalMarks: 53, totalMarks: 89, grade: 'A+', gradePoints: 9, status: 'Pass' },
      { courseCode: 'CS403', courseTitle: 'Elective: Natural Language Processing & LLMs', credits: 3, internalMarks: 38, externalMarks: 57, totalMarks: 95, grade: 'O', gradePoints: 10, status: 'Pass' },
      { courseCode: 'CS404', courseTitle: 'Cyber Forensics & Penetration Testing', credits: 3, internalMarks: 35, externalMarks: 52, totalMarks: 87, grade: 'A+', gradePoints: 9, status: 'Pass' },
      { courseCode: 'CS405', courseTitle: 'Capstone Major Project - Phase I', credits: 4, internalMarks: 39, externalMarks: 58, totalMarks: 97, grade: 'O', gradePoints: 10, status: 'Pass' },
      { courseCode: 'CS401L', courseTitle: 'Big Data Clusters & Cloud IoT Lab', credits: 2, internalMarks: 39, externalMarks: 58, totalMarks: 97, grade: 'O', gradePoints: 10, status: 'Pass' }
    ],
    'Semester 8': [
      { courseCode: 'CS406', courseTitle: 'High-Performance Distributed & Edge Computing', credits: 4, internalMarks: 38, externalMarks: 56, totalMarks: 94, grade: 'O', gradePoints: 10, status: 'Pass' },
      { courseCode: 'CS407', courseTitle: 'Elective: Blockchain Architecture & Web3 Decentralization', credits: 3, internalMarks: 37, externalMarks: 54, totalMarks: 91, grade: 'O', gradePoints: 10, status: 'Pass' },
      { courseCode: 'CS408', courseTitle: 'Capstone Major Project - Phase II & Final Dissertation', credits: 8, internalMarks: 40, externalMarks: 59, totalMarks: 99, grade: 'O', gradePoints: 10, status: 'Pass' },
      { courseCode: 'CS409', courseTitle: 'Comprehensive University Technical Viva Voce', credits: 2, internalMarks: 38, externalMarks: 57, totalMarks: 95, grade: 'O', gradePoints: 10, status: 'Pass' }
    ]
  };

  constructor() {
    try {
      this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
      this.userName = localStorage.getItem('userName') || 'vamsi';
      
      if (this.role === 'student') {
        this.studentName = this.userName;
        this.studentRoll = localStorage.getItem('userRoll') || localStorage.getItem('userId') || '646456455';
        this.studentDept = localStorage.getItem('userDept') || localStorage.getItem('userDepartment') || 'Computer Science & Engineering';
        this.viewMode = 'student';
      } else {
        this.studentName = 'vamsi';
        this.studentRoll = '646456455';
        this.studentDept = 'Computer Science & Engineering';
        this.viewMode = 'class';
      }
    } catch {
      this.role = null;
    }
  }

  ngOnInit(): void {
    this.loadStudentsList();
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

  setViewMode(mode: 'class' | 'student'): void {
    this.viewMode = mode;
    this.cdr.detectChanges();
  }

  viewSpecificStudent(sName: string): void {
    this.studentName = sName;
    const match = this.availableStudentsList.find(s => s.name.toLowerCase() === sName.toLowerCase());
    if (match) {
      this.studentRoll = match.roll || 'CUTM2026CSE042';
      this.studentDept = match.dept || 'Computer Science & Engineering';
    }
    this.viewMode = 'student';
    this.cdr.detectChanges();
  }

  onStudentSelect(sName: string): void {
    this.studentName = sName;
    const match = this.availableStudentsList.find(s => s.name.toLowerCase() === sName.toLowerCase());
    if (match) {
      this.studentRoll = match.roll || 'CUTM2026CSE042';
      this.studentDept = match.dept || 'Computer Science & Engineering';
    }
    this.cdr.detectChanges();
  }

  private loadStudentsList(): void {
    this.http.get<any[]>('http://localhost:8080/api/users').subscribe({
      next: (users) => {
        if (Array.isArray(users)) {
          const studentUsers = users
            .filter(u => u.role?.toUpperCase() === 'STUDENT')
            .map(u => ({
              name: u.name,
              roll: u.id,
              dept: u.department || 'Computer Science & Engineering',
              email: u.email
            }));
          if (studentUsers.length > 0) {
            this.availableStudentsList = studentUsers;
            if (this.role !== 'student' && !this.studentName && studentUsers[0]) {
              this.studentName = studentUsers[0].name;
              this.studentRoll = studentUsers[0].roll;
              this.studentDept = studentUsers[0].dept;
            }
            this.cdr.detectChanges();
          }
        }
      },
      error: () => {}
    });
  }

  selectSemester(sem: string): void {
    this.selectedSemester = sem;
    this.cdr.detectChanges();
  }

  get displayedCourses(): SemesterCourseRecord[] {
    if (this.selectedSemester === 'All Semesters') {
      const all: SemesterCourseRecord[] = [];
      for (const sem of ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8']) {
        if (this.semesterCurriculumData[sem]) {
          all.push(...this.semesterCurriculumData[sem]);
        }
      }
      return all;
    }
    return this.semesterCurriculumData[this.selectedSemester] || [];
  }

  get semesterSgpa(): number {
    const list = this.displayedCourses;
    if (!list.length) return 0;
    const totalCredits = list.reduce((sum, c) => sum + c.credits, 0);
    const weightedPoints = list.reduce((sum, c) => sum + (c.credits * c.gradePoints), 0);
    return totalCredits > 0 ? Number((weightedPoints / totalCredits).toFixed(2)) : 0;
  }

  get cumulativeCgpa(): number {
    let totalCredits = 0;
    let weightedPoints = 0;
    for (const sem of ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8']) {
      const list = this.semesterCurriculumData[sem] || [];
      list.forEach(c => {
        totalCredits += c.credits;
        weightedPoints += (c.credits * c.gradePoints);
      });
    }
    return totalCredits > 0 ? Number((weightedPoints / totalCredits).toFixed(2)) : 9.48;
  }

  get semesterCredits(): { registered: number; earned: number } {
    const list = this.displayedCourses;
    const registered = list.reduce((sum, c) => sum + c.credits, 0);
    const earned = list.filter(c => c.status === 'Pass').reduce((sum, c) => sum + c.credits, 0);
    return { registered, earned };
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

  private processMarksIntoResults(marks: any[]): void {
    const weights = this.getObeWeights();
    const intRatio = weights.internal / 100;
    const extRatio = weights.external / 100;

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
    try {
      const stored = localStorage.getItem('obslmsMarkEntries');
      if (stored) {
        const localMarks = JSON.parse(stored);
        if (Array.isArray(localMarks) && localMarks.length > 0) {
          this.processMarksIntoResults(localMarks);
        }
      }
    } catch {}

    this.http.get<any[]>('http://localhost:8080/api/obe/marks').subscribe({
      next: (marks) => {
        if (Array.isArray(marks) && marks.length > 0) {
          this.processMarksIntoResults(marks);
        }
      },
      error: () => {}
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
      this.toastService.warning('Please select at least one student to export batch transcripts.');
      return;
    }
    
    this.selectedBatchStudents = selected;
    this.toastService.info(`Preparing transcripts for ${selected.length} student(s)... 📄`);
    document.body.classList.add('batch-mode');
    
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

  downloadResults() {
    const studentName = this.studentName || this.userName || 'Krishnavamsi';
    const roll = this.studentRoll;
    const dept = this.studentDept;
    const sem = this.selectedSemester;
    const courses = this.displayedCourses;

    let csv = `CENTURION UNIVERSITY OF TECHNOLOGY & MANAGEMENT\n`;
    csv += `OUTCOME-BASED EDUCATION (OBE) CELL - OFFICIAL ACADEMIC TRANSCRIPT\n`;
    csv += `Student Name,${studentName}\n`;
    csv += `Roll Number,${roll}\n`;
    csv += `Department,${dept}\n`;
    csv += `Academic Program,Bachelor of Technology (B.Tech)\n`;
    csv += `Semester,${sem}\n`;
    csv += `Date Generated,${new Date().toLocaleDateString('en-IN')}\n\n`;

    csv += `Course Code,Course Title,Credits,Internal Marks (40),External Marks (60),Total Marks (100),Grade,Grade Points,Status\n`;

    courses.forEach(c => {
      csv += `"${c.courseCode}","${c.courseTitle}",${c.credits},${c.internalMarks},${c.externalMarks},${c.totalMarks},"${c.grade}",${c.gradePoints},"${c.status}"\n`;
    });

    csv += `\nSUMMARY EVALUATION METRICS\n`;
    csv += `Total Registered Credits,${this.semesterCredits.registered}\n`;
    csv += `Total Credits Earned,${this.semesterCredits.earned}\n`;
    csv += `Semester Grade Point Average (SGPA),${this.semesterSgpa}\n`;
    csv += `Cumulative Grade Point Average (CGPA),${this.cumulativeCgpa}\n`;
    csv += `Overall Academic Standing,PASS (FIRST CLASS WITH DISTINCTION)\n`;
    csv += `Status,OFFICIAL NOTIFICATION OF RESULTS\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanSem = sem.replace(/\s+/g, '_');
    a.download = `${roll}_${studentName}_${cleanSem}_Marksheet.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    this.downloadMessage = `Successfully downloaded ${sem} marksheet for ${studentName}.`;
    setTimeout(() => this.downloadMessage = '', 4000);
  }

  printTranscript(): void {
    window.print();
  }
}
