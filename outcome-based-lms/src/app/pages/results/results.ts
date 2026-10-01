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
import { DEFAULT_DATABASE_COURSES } from '../../shared/services/course.service';

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

export interface StudentAcademicProfileGroup {
  studentId: string;
  studentName: string;
  department: string;
  shortDept: string;
  semester: string;
  email: string;
  courses: SemesterCourseRecord[];
  totalCredits: number;
  earnedCredits: number;
  sgpa: number;
  cgpa: number;
  totalCourses: number;
  passedCourses: number;
  failedCourses: number;
  overallGrade: string;
  standing: string;
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
                <h1>📋 Student Semester Results & Marksheet Deck</h1>
                <p>{{ role === 'student' ? 'Official semester performance transcript, SGPA/CGPA breakdown, and complete marksheet download.' : 'Master academic results deck: Expandable student profiles, departmental performance matrix, and official semester transcripts.' }}</p>
            </div>
            
            <!-- View Mode Switcher for Faculty and Admin -->
            <div class="mode-toggle-group" *ngIf="role !== 'student'">
                <button type="button" 
                        class="mode-btn" 
                        [class.active]="viewMode === 'class'" 
                        (click)="setViewMode('class')">
                    <span class="material-icons">view_agenda</span> Student Results Deck
                </button>
                <button type="button" 
                        class="mode-btn" 
                        [class.active]="viewMode === 'student'" 
                        (click)="setViewMode('student')">
                    <span class="material-icons">description</span> Official Marksheet View
                </button>
            </div>
        </div>

        <!-- Student Selector Banner for Faculty & Admin when in Student View Mode -->
        <div class="student-picker-banner" *ngIf="role !== 'student' && viewMode === 'student'">
            <div class="picker-label-wrap">
                <span class="material-icons picker-icon">account_circle</span>
                <div>
                    <span class="picker-sub">Selected Student Profile:</span>
                    <strong class="picker-name">{{ studentName }} ({{ studentRoll }}) — {{ studentDept }}</strong>
                </div>
            </div>
            <div class="picker-controls">
                <label for="studentSelect" class="picker-select-label">Switch Student:</label>
                <select id="studentSelect" class="student-dropdown" [(ngModel)]="studentName" (ngModelChange)="onStudentSelect($event)">
                    <option *ngFor="let stu of availableStudentsList" [value]="stu.name">
                        {{ stu.name }} ({{ stu.roll || 'CUTM' }}) - {{ getShortDept(stu.dept) }}
                    </option>
                </select>
                <button type="button" class="btn-switch-back" (click)="setViewMode('class')">
                    ← Back to Results Deck
                </button>
            </div>
        </div>

        <!-- Semester Selection Filter Toolbar -->
        <div class="semester-filter-toolbar">
            <div class="semester-header-info">
                <span class="toolbar-title">🎓 Choose Evaluation Semester:</span>
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
            <div class="section-card kpi-card-lux">
                <div class="kpi-icon-badge" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8;">👨‍🎓</div>
                <div class="kpi-text-block">
                    <span class="kpi-tag">Enrolled Students</span>
                    <strong class="kpi-num">{{ filteredStudentGroups.length }} <small style="font-size: 0.9rem; color: #94a3b8;">/ {{ studentGroups.length }}</small></strong>
                    <p>Total evaluated student profiles across departments.</p>
                </div>
            </div>
            <div class="section-card kpi-card-lux">
                <div class="kpi-icon-badge" style="background: rgba(212, 175, 55, 0.15); color: #fde68a;">⭐</div>
                <div class="kpi-text-block">
                    <span class="kpi-tag">Average Class SGPA</span>
                    <strong class="kpi-num" style="color: #fde68a;">{{ classAverageSgpa }} <small style="font-size: 0.9rem; color: #94a3b8;">/ 10</small></strong>
                    <p>Weighted semester SGPA across active students.</p>
                </div>
            </div>
            <div class="section-card kpi-card-lux">
                <div class="kpi-icon-badge" style="background: rgba(96, 165, 250, 0.15); color: #60a5fa;">📈</div>
                <div class="kpi-text-block">
                    <span class="kpi-tag">Cumulative CGPA</span>
                    <strong class="kpi-num" style="color: #60a5fa;">{{ classAverageCgpa }} <small style="font-size: 0.9rem; color: #94a3b8;">/ 10</small></strong>
                    <p>Average cumulative standing (all semesters).</p>
                </div>
            </div>
            <div class="section-card kpi-card-lux">
                <div class="kpi-icon-badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">🏆</div>
                <div class="kpi-text-block">
                    <span class="kpi-tag">Overall Pass Rate</span>
                    <strong class="kpi-num" style="color: #4ade80;">{{ classPassRate }}%</strong>
                    <p>Students cleared in evaluated curriculum.</p>
                </div>
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
                <h3>Semester Grade & Standing</h3>
                <strong class="pass-standing">{{ getAcademicStandingGrade() }}</strong>
                <p>Calculated dynamically based on SGPA & Credit Points.</p>
            </div>
        </div>

        <!-- Action Row -->
        <div class="action-row" *ngIf="role === 'student' || viewMode === 'student'">
            <button type="button" class="btn-download" (click)="downloadResults()">
                📥 Download {{ studentName }}'s {{ selectedSemester }} Marksheet (CSV)
            </button>
            <button type="button" class="btn-print" (click)="printTranscript()">
                🖨️ Export Official Marksheet PDF ({{ studentName }})
            </button>
            <span class="status-message" *ngIf="downloadMessage">{{ downloadMessage }}</span>
        </div>

        <!-- ========================================================================= -->
        <!-- VIEW 1: STUDENT RESULTS ACCORDION DECK (CLASS OVERVIEW)                   -->
        <!-- ========================================================================= -->
        <div class="results-deck-container" *ngIf="role !== 'student' && viewMode === 'class'">
            
            <!-- Search & Filter Deck Toolbar -->
            <div class="results-search-toolbar">
                <div class="search-input-wrap">
                    <span class="search-icon">🔍</span>
                    <input 
                        type="text" 
                        [(ngModel)]="searchQuery" 
                        (input)="onSearchChange()" 
                        placeholder="Search student name (e.g. Krishnavamsi), Roll / ID (e.g. CUTM2026CSE042, STU004), department, or subject..."
                        class="results-search-input"
                    />
                    <button class="clear-search-btn" *ngIf="searchQuery" (click)="clearSearch()" title="Clear search">✕</button>
                </div>

                <div class="search-filter-wrap">
                    <select [(ngModel)]="filterDept" (change)="onSearchChange()" class="filter-dropdown-select">
                        <option value="">All Departments (6 Branches)</option>
                        <option value="CSE">Computer Science & Engineering (CSE)</option>
                        <option value="IT">Information Technology (IT)</option>
                        <option value="ECE">Electronics & Communication (ECE)</option>
                        <option value="ME">Mechanical Engineering (ME)</option>
                        <option value="CE">Civil Engineering (CE)</option>
                        <option value="EEE">Electrical & Electronics (EEE)</option>
                    </select>

                    <select [(ngModel)]="filterGrade" (change)="onSearchChange()" class="filter-dropdown-select">
                        <option value="">All Academic Grades</option>
                        <option value="O">Grade O (Outstanding ≥ 9.0 SGPA)</option>
                        <option value="A+">Grade A+ (Excellent 8.0 - 8.9)</option>
                        <option value="A">Grade A (Very Good 7.0 - 7.9)</option>
                        <option value="B+">Grade B+ (Good 6.0 - 6.9)</option>
                        <option value="B">Grade B (Above Average 5.5 - 5.9)</option>
                        <option value="F">Grade F (Backlog / Re-appear)</option>
                    </select>

                    <div class="accordion-global-buttons">
                        <button type="button" class="btn-toggle-accordion" (click)="expandAllStudents()" title="Expand all student result cards">
                            ▾ Expand All
                        </button>
                        <button type="button" class="btn-toggle-accordion" (click)="collapseAllStudents()" title="Collapse all student result cards">
                            ▴ Collapse All
                        </button>
                    </div>

                    <span class="match-count-badge">
                        Showing <strong>{{ filteredStudentGroups.length }}</strong> of {{ studentGroups.length }} Students
                    </span>
                </div>
            </div>

            <!-- Empty Results State -->
            <div *ngIf="filteredStudentGroups.length === 0" class="empty-state">
                <p>📭 No student academic records found matching your filters in {{ selectedSemester }}.</p>
                <button type="button" class="btn-clear-filters" (click)="clearSearch()">Reset Search & Filters</button>
            </div>

            <!-- Master-Detail Expandable Student Cards Deck -->
            <div class="student-accordion-deck" *ngIf="filteredStudentGroups.length > 0">
                <div 
                    *ngFor="let s of filteredStudentGroups" 
                    class="student-accordion-card"
                    [class.expanded]="isStudentExpanded(s.studentId)"
                >
                    <!-- Student Card Master Header (Click to Expand) -->
                    <div class="student-card-header" (click)="toggleExpandStudent(s.studentId)">
                        <div class="student-main-profile">
                            <div class="student-avatar" [ngClass]="s.shortDept.toLowerCase()">
                                {{ getAvatarInitials(s.studentName) }}
                            </div>
                            <div class="student-meta-details">
                                <div class="student-name-row">
                                    <h3 class="student-heading">{{ s.studentName }}</h3>
                                    <span class="stu-id-tag">{{ s.studentId }}</span>
                                    <span class="badge-dept-tag" [ngClass]="s.shortDept.toLowerCase()">{{ s.shortDept }}</span>
                                </div>
                                <div class="student-sub-row">
                                    <span class="student-dept-name">{{ s.department }}</span>
                                    <span class="student-dot-separator">•</span>
                                    <span class="student-sem-tag">{{ s.semester }}</span>
                                    <span class="student-dot-separator">•</span>
                                    <span class="student-email-link">{{ s.email }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Performance Metric KPI Badges -->
                        <div class="student-kpi-deck">
                            <div class="kpi-mini-pill" title="Total Subjects Evaluated">
                                <span class="kpi-mini-icon">📚</span>
                                <span class="kpi-mini-label">Subjects:</span>
                                <strong class="kpi-mini-val">{{ s.passedCourses }}/{{ s.totalCourses }}</strong>
                            </div>

                            <div class="kpi-mini-pill credits" title="Academic Credits Completed">
                                <span class="kpi-mini-icon">⭐</span>
                                <span class="kpi-mini-label">Credits:</span>
                                <strong class="kpi-mini-val">{{ s.earnedCredits }}/{{ s.totalCredits }} CR</strong>
                            </div>

                            <div class="kpi-mini-pill sgpa" title="Semester SGPA">
                                <span class="kpi-mini-icon">🏆</span>
                                <span class="kpi-mini-label">SGPA:</span>
                                <strong class="kpi-mini-val">{{ s.sgpa }}</strong>
                            </div>

                            <div class="kpi-mini-pill cgpa" title="Cumulative CGPA">
                                <span class="kpi-mini-icon">📈</span>
                                <span class="kpi-mini-label">CGPA:</span>
                                <strong class="kpi-mini-val">{{ s.cgpa }}</strong>
                            </div>

                            <div class="kpi-mini-pill grade" [class.pass]="s.standing === 'PASS'" [class.fail]="s.standing !== 'PASS'">
                                <span class="kpi-mini-label">Grade:</span>
                                <strong class="kpi-mini-val">{{ s.overallGrade }}</strong>
                            </div>
                        </div>

                        <!-- Card Quick Actions -->
                        <div class="student-card-actions" (click)="$event.stopPropagation()">
                            <button 
                                type="button" 
                                class="btn-deck-action view-btn" 
                                (click)="viewSpecificStudent(s.studentName)"
                                title="Open full official marksheet for {{ s.studentName }}"
                            >
                                👁️ View Marksheet
                            </button>
                            <button 
                                type="button" 
                                class="btn-deck-action csv-btn" 
                                (click)="downloadSingleStudentCsv(s)"
                                title="Download CSV transcript"
                            >
                                📥 CSV
                            </button>
                            <button 
                                type="button" 
                                class="btn-expand-chevron" 
                                (click)="toggleExpandStudent(s.studentId)"
                                [title]="isStudentExpanded(s.studentId) ? 'Collapse subject breakdown' : 'Expand subject breakdown'"
                            >
                                <span class="material-icons chevron-icon">{{ isStudentExpanded(s.studentId) ? 'expand_less' : 'expand_more' }}</span>
                            </button>
                        </div>
                    </div>

                    <!-- Expandable Nested Subject Marks Breakdown -->
                    <div class="student-card-body" *ngIf="isStudentExpanded(s.studentId)">
                        <div class="nested-table-wrap">
                            <table class="nested-results-table">
                                <thead>
                                    <tr>
                                        <th style="width: 110px;">Subject Code</th>
                                        <th>Course / Subject Title</th>
                                        <th style="text-align: center; width: 80px;">Credits</th>
                                        <th style="text-align: center; width: 130px;">Internal (40%)</th>
                                        <th style="text-align: center; width: 130px;">External (60%)</th>
                                        <th style="text-align: center; width: 110px;">Total (100)</th>
                                        <th style="text-align: center; width: 90px;">Grade</th>
                                        <th style="text-align: center; width: 90px;">Grade Pts</th>
                                        <th style="text-align: center; width: 90px;">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr *ngFor="let c of s.courses">
                                        <td>
                                            <span class="sub-code-badge">{{ c.courseCode }}</span>
                                        </td>
                                        <td>
                                            <strong class="sub-title-text">{{ c.courseTitle }}</strong>
                                        </td>
                                        <td style="text-align: center;">
                                            <span class="sub-cr-pill">{{ c.credits }} CR</span>
                                        </td>
                                        <td style="text-align: center;">
                                            <span class="mark-val">{{ c.internalMarks }}</span> / 40
                                        </td>
                                        <td style="text-align: center;">
                                            <span class="mark-val">{{ c.externalMarks }}</span> / 60
                                        </td>
                                        <td style="text-align: center;">
                                            <strong class="mark-total-val">{{ c.totalMarks }}</strong>
                                        </td>
                                        <td style="text-align: center;">
                                            <span class="grade-badge" [class.excellent]="c.grade === 'O' || c.grade === 'A+'">{{ c.grade }}</span>
                                        </td>
                                        <td style="text-align: center;">
                                            <strong style="color: #cbd5e1;">{{ c.gradePoints }}</strong>
                                        </td>
                                        <td style="text-align: center;">
                                            <span class="status-pill" [class.pass]="c.status === 'Pass'" [class.fail]="c.status !== 'Pass'">{{ c.status }}</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Mini Semester Performance Summary Footer -->
                        <div class="nested-summary-footer">
                            <div class="nested-kpi-item">
                                <span class="lbl">Evaluated Semester:</span>
                                <strong class="val" style="color: #fde68a;">{{ selectedSemester }}</strong>
                            </div>
                            <div class="nested-kpi-item">
                                <span class="lbl">Registered Credits:</span>
                                <strong class="val">{{ s.totalCredits }} CR</strong>
                            </div>
                            <div class="nested-kpi-item">
                                <span class="lbl">Credits Earned:</span>
                                <strong class="val" style="color: #4ade80;">{{ s.earnedCredits }} CR</strong>
                            </div>
                            <div class="nested-kpi-item">
                                <span class="lbl">Semester SGPA:</span>
                                <strong class="val" style="color: #d4af37;">{{ s.sgpa }} / 10.00</strong>
                            </div>
                            <div class="nested-kpi-item">
                                <span class="lbl">Cumulative CGPA:</span>
                                <strong class="val" style="color: #60a5fa;">{{ s.cgpa }} / 10.00</strong>
                            </div>
                            <div class="nested-kpi-item">
                                <span class="lbl">Academic Standing:</span>
                                <strong class="val standing-badge" [class.pass]="s.standing === 'PASS'" [class.fail]="s.standing !== 'PASS'">
                                    {{ s.standing === 'PASS' ? 'PASS (FIRST CLASS WITH DISTINCTION)' : 'RE-APPEAR / BACKLOG' }}
                                </strong>
                            </div>
                            <div class="nested-kpi-actions">
                                <button type="button" class="btn-micro-print" (click)="printStudentMarksheet(s)">
                                    🖨️ Export PDF Transcript
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ========================================================================= -->
        <!-- VIEW 2: SINGLE STUDENT OFFICIAL MARKSHEET TRANSCRIPT VIEW                 -->
        <!-- ========================================================================= -->
        <div class="table-card" *ngIf="role === 'student' || viewMode === 'student'">
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
                    <div><strong>Academic Program:</strong> Bachelor of Technology ({{ getShortDept(studentDept) }})</div>
                    <div><strong>Semester Evaluated:</strong> {{ selectedSemester }}</div>
                    <div><strong>Academic Session:</strong> 2025 - 2026</div>
                    <div><strong>Evaluation Schema:</strong> Internal {{ getObeWeights().internal }}% + External {{ getObeWeights().external }}%</div>
                </div>
            </div>
            
            <div class="table-header-row">
                <h2>{{ studentName }} — {{ selectedSemester }} Official Grade Sheet</h2>
                <div class="sem-stats-pills">
                    <span class="stat-badge">Student: <strong>{{ studentName }}</strong></span>
                    <span class="stat-badge">Semester: <strong>{{ selectedSemester }}</strong></span>
                    <span class="stat-badge">SGPA: <strong>{{ semesterSgpa }}</strong></span>
                    <span class="stat-badge">Credits: <strong>{{ semesterCredits.earned }} CR</strong></span>
                    <span class="stat-badge status-pass">Result: <strong>PASS</strong></span>
                </div>
            </div>
            
            <!-- Student Semester Detailed Table -->
            <table>
                <thead>
                    <tr>
                        <th style="width: 110px;">Subject Code</th>
                        <th>Course Title</th>
                        <th style="text-align: center; width: 75px;">Credits</th>
                        <th style="text-align: center; width: 130px;">Internal ({{ getObeWeights().internal }}%)</th>
                        <th style="text-align: center; width: 130px;">External ({{ getObeWeights().external }}%)</th>
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
                        <td style="text-align: center;">{{ c.internalMarks }} / {{ getObeWeights().internal }}</td>
                        <td style="text-align: center;">{{ c.externalMarks }} / {{ getObeWeights().external }}</td>
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
            <div class="student-sem-summary-footer">
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
                    <span>Semester Grade:</span>
                    <strong style="color: #4ade80;">{{ getAcademicStandingGrade() }}</strong>
                </div>
            </div>

            <!-- Signatures for Printed Marksheet -->
            <div class="print-signatures-area">
                <div class="sig-col">
                    <div class="sig-line">Prepared & Verified By</div>
                    <small>Office of the Examination Section</small>
                </div>
                <div class="sig-col">
                    <div class="sig-line">Head of Department ({{ getShortDept(studentDept) }})</div>
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

</div>`,
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
      min-width: 260px;
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

    .summary-grid {
      display: grid;
      gap: 16px;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      margin-bottom: 24px;
    }
    .section-card, .table-card {
      padding: 22px;
      background: #101b38;
      border: 1px solid #1f2f54;
      border-radius: 14px;
      box-shadow: 0 8px 24px rgba(0,0,0,.35);
      margin-bottom: 24px;
    }
    .kpi-card-lux {
      display: flex;
      align-items: center;
      gap: 18px;
      padding: 20px;
      margin-bottom: 0;
    }
    .kpi-icon-badge {
      font-size: 28px;
      width: 54px;
      height: 54px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      flex-shrink: 0;
    }
    .kpi-text-block {
      flex: 1;
    }
    .kpi-tag {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: #94a3b8;
      display: block;
      margin-bottom: 4px;
    }
    .kpi-num {
      display: block;
      font-size: 1.8rem;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.1;
      margin-bottom: 4px;
    }
    .kpi-text-block p {
      margin: 0;
      font-size: 12px;
      color: #64748b;
    }

    .section-card h3, .table-card h2 {
      margin-top: 0;
      font-size: 1.1rem;
      color: #ffffff;
      font-weight: 800;
    }
    .section-card strong {
      display: block;
      font-size: 2rem;
      margin-top: 8px;
      margin-bottom: 8px;
      color: #ffffff;
    }
    .pass-standing {
      color: #4ade80 !important;
      font-size: 1.4rem !important;
    }
    
    .action-row {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
      margin-bottom: 22px;
    }
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
    .btn-download:hover {
      filter: brightness(1.1);
      transform: translateY(-1px);
    }
    .btn-print {
      background: #10b981 !important;
      color: white !important;
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 700;
      font-size: 13.5px;
    }
    .btn-print:hover {
      filter: brightness(1.1);
    }
    .status-message {
      color: #4ade80;
      font-weight: 700;
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid rgba(74, 222, 128, 0.3);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
    }
    
    .table-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 16px;
    }
    .sem-stats-pills {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .stat-badge {
      background: #091024;
      border: 1px solid #1f2f54;
      color: #cbd5e1;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
    }
    .stat-badge strong {
      color: #ffffff;
      margin-left: 4px;
    }
    .stat-badge.status-pass {
      background: rgba(34, 197, 94, 0.15);
      border-color: rgba(74, 222, 128, 0.3);
      color: #4ade80;
    }
    .stat-badge.status-pass strong {
      color: #4ade80;
    }

    /* Results Search Toolbar */
    .results-search-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
      margin-bottom: 20px;
      padding: 14px 18px;
      background: #101b38;
      border: 1px solid #1f2f54;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      flex-wrap: wrap;
    }
    .search-input-wrap {
      flex: 1;
      min-width: 280px;
      display: flex;
      align-items: center;
      background: #091024;
      border: 1px solid #1f2f54;
      border-radius: 8px;
      padding: 0 12px;
      transition: all 0.2s ease;
    }
    .search-input-wrap:focus-within {
      border-color: #d4af37;
      box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.2);
    }
    .search-icon {
      font-size: 14px;
      margin-right: 8px;
      opacity: 0.8;
    }
    .results-search-input {
      width: 100%;
      padding: 10px 0;
      background: transparent;
      border: none;
      color: #ffffff;
      font-size: 13.5px;
      outline: none;
    }
    .results-search-input::placeholder {
      color: #64748b;
    }
    .clear-search-btn {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 14px;
      padding: 4px;
    }
    .clear-search-btn:hover {
      color: #f87171;
    }
    .search-filter-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .filter-dropdown-select {
      padding: 9px 14px;
      background: #091024;
      border: 1px solid #1f2f54;
      border-radius: 8px;
      color: #fde68a;
      font-size: 13px;
      font-weight: 600;
      outline: none;
      cursor: pointer;
    }
    .accordion-global-buttons {
      display: flex;
      gap: 6px;
    }
    .btn-toggle-accordion {
      background: #091024;
      color: #94a3b8;
      border: 1px solid #1f2f54;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-toggle-accordion:hover {
      background: #18284e;
      color: #ffffff;
      border-color: #d4af37;
    }
    .match-count-badge {
      font-size: 12.5px;
      color: #94a3b8;
      white-space: nowrap;
    }
    .match-count-badge strong {
      color: #d4af37;
    }

    /* ========================================================================= */
    /* STUDENT RESULTS ACCORDION DECK STYLES                                     */
    /* ========================================================================= */
    .student-accordion-deck {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
    }
    .student-accordion-card {
      background: #101b38;
      border: 1px solid #1f2f54;
      border-radius: 14px;
      overflow: hidden;
      transition: all 0.25s ease;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.25);
    }
    .student-accordion-card:hover {
      border-color: #3b82f6;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
    }
    .student-accordion-card.expanded {
      border-color: #d4af37;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.45);
    }

    /* Master Card Header */
    .student-card-header {
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      cursor: pointer;
      background: #101b38;
      user-select: none;
      transition: background 0.2s ease;
    }
    .student-accordion-card.expanded .student-card-header {
      background: #132247;
      border-bottom: 1px solid #1f2f54;
    }
    .student-main-profile {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 260px;
    }
    .student-avatar {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1e3a8a, #3b82f6);
      color: #ffffff;
      font-weight: 800;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
      flex-shrink: 0;
    }
    .student-avatar.cse { background: linear-gradient(135deg, #3730a3, #6366f1); }
    .student-avatar.it { background: linear-gradient(135deg, #0e7490, #06b6d4); }
    .student-avatar.ece { background: linear-gradient(135deg, #b45309, #f59e0b); }
    .student-avatar.me { background: linear-gradient(135deg, #c2410c, #f97316); }
    .student-avatar.ce { background: linear-gradient(135deg, #15803d, #22c55e); }
    .student-avatar.eee { background: linear-gradient(135deg, #7e22ce, #a855f7); }

    .student-meta-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .student-name-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .student-heading {
      margin: 0;
      color: #ffffff;
      font-size: 1.15rem;
      font-weight: 800;
    }
    .stu-id-tag {
      background: rgba(212, 175, 55, 0.15);
      color: #fde68a;
      border: 1px solid rgba(212, 175, 55, 0.35);
      font-family: monospace;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 12px;
    }
    .badge-dept-tag {
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      background: rgba(99, 102, 241, 0.2);
      color: #a5b4fc;
      border: 1px solid rgba(99, 102, 241, 0.4);
    }
    .badge-dept-tag.cse { background: rgba(99, 102, 241, 0.2); color: #a5b4fc; border-color: rgba(99, 102, 241, 0.4); }
    .badge-dept-tag.it { background: rgba(6, 182, 212, 0.2); color: #67e8f9; border-color: rgba(6, 182, 212, 0.4); }
    .badge-dept-tag.ece { background: rgba(245, 158, 11, 0.2); color: #fcd34d; border-color: rgba(245, 158, 11, 0.4); }
    .badge-dept-tag.me { background: rgba(249, 115, 22, 0.2); color: #fdba74; border-color: rgba(249, 115, 22, 0.4); }
    .badge-dept-tag.ce { background: rgba(34, 197, 94, 0.2); color: #86efac; border-color: rgba(34, 197, 94, 0.4); }
    .badge-dept-tag.eee { background: rgba(168, 85, 247, 0.2); color: #d8b4fe; border-color: rgba(168, 85, 247, 0.4); }

    .student-sub-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      font-size: 12px;
      color: #94a3b8;
    }
    .student-dept-name {
      color: #cbd5e1;
      font-weight: 600;
    }
    .student-dot-separator {
      opacity: 0.5;
    }
    .student-sem-tag {
      color: #d4af37;
      font-weight: 700;
    }
    .student-email-link {
      color: #64748b;
      font-family: monospace;
      font-size: 11.5px;
    }

    /* KPI Summary Pills */
    .student-kpi-deck {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .kpi-mini-pill {
      background: #091024;
      border: 1px solid #1f2f54;
      border-radius: 8px;
      padding: 6px 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
    }
    .kpi-mini-icon {
      font-size: 13px;
    }
    .kpi-mini-label {
      color: #94a3b8;
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
    }
    .kpi-mini-val {
      color: #ffffff;
      font-weight: 800;
      font-size: 13px;
    }
    .kpi-mini-pill.credits strong {
      color: #fde68a;
    }
    .kpi-mini-pill.sgpa {
      background: rgba(212, 175, 55, 0.12);
      border-color: rgba(212, 175, 55, 0.35);
    }
    .kpi-mini-pill.sgpa strong {
      color: #d4af37;
      font-size: 14px;
    }
    .kpi-mini-pill.cgpa {
      background: rgba(96, 165, 250, 0.12);
      border-color: rgba(96, 165, 250, 0.35);
    }
    .kpi-mini-pill.cgpa strong {
      color: #60a5fa;
      font-size: 14px;
    }
    .kpi-mini-pill.grade.pass {
      background: rgba(34, 197, 94, 0.15);
      border-color: rgba(74, 222, 128, 0.35);
    }
    .kpi-mini-pill.grade.pass strong {
      color: #4ade80;
    }
    .kpi-mini-pill.grade.fail {
      background: rgba(239, 68, 68, 0.15);
      border-color: rgba(248, 113, 113, 0.35);
    }
    .kpi-mini-pill.grade.fail strong {
      color: #f87171;
    }

    /* Actions */
    .student-card-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn-deck-action {
      padding: 7px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-deck-action.view-btn {
      background: rgba(212, 175, 55, 0.15);
      color: #fde68a;
      border: 1px solid rgba(212, 175, 55, 0.35);
    }
    .btn-deck-action.view-btn:hover {
      background: #d4af37;
      color: #0a1128;
      transform: translateY(-1px);
    }
    .btn-deck-action.csv-btn {
      background: #091024;
      color: #cbd5e1;
      border: 1px solid #1f2f54;
    }
    .btn-deck-action.csv-btn:hover {
      background: #18284e;
      color: #ffffff;
    }
    .btn-expand-chevron {
      background: #091024;
      border: 1px solid #1f2f54;
      color: #94a3b8;
      border-radius: 8px;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-expand-chevron:hover {
      background: #18284e;
      color: #d4af37;
      border-color: #d4af37;
    }
    .chevron-icon {
      font-size: 22px;
    }

    /* Nested Table & Body */
    .student-card-body {
      padding: 18px 20px;
      background: #091024;
      animation: fadeIn 0.2s ease-in-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .nested-table-wrap {
      overflow-x: auto;
      border-radius: 10px;
      border: 1px solid #1f2f54;
      margin-bottom: 14px;
    }
    .nested-results-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .nested-results-table th {
      background: #101b38;
      color: #d4af37;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.78rem;
      padding: 10px 14px;
      border-bottom: 1px solid #1f2f54;
      text-align: left;
    }
    .nested-results-table td {
      padding: 10px 14px;
      border-bottom: 1px solid #18284e;
      color: #cbd5e1;
    }
    .nested-results-table tbody tr:hover {
      background: #101b38;
    }
    .sub-code-badge {
      font-family: monospace;
      font-weight: 700;
      color: #60a5fa;
      background: rgba(96, 165, 250, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid rgba(96, 165, 250, 0.25);
    }
    .sub-title-text {
      color: #ffffff;
    }
    .sub-cr-pill {
      background: rgba(212, 175, 55, 0.15);
      color: #fde68a;
      border: 1px solid rgba(212, 175, 55, 0.3);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 800;
    }
    .mark-val {
      color: #e2e8f0;
      font-weight: 700;
    }
    .mark-total-val {
      color: #ffffff;
      font-size: 14px;
    }

    /* Nested Summary Footer */
    .nested-summary-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 14px;
      padding: 12px 16px;
      background: #101b38;
      border: 1px solid #1f2f54;
      border-radius: 10px;
    }
    .nested-kpi-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .nested-kpi-item .lbl {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      font-weight: 700;
    }
    .nested-kpi-item .val {
      font-size: 13.5px;
      color: #ffffff;
      font-weight: 800;
    }
    .standing-badge.pass {
      color: #4ade80 !important;
    }
    .standing-badge.fail {
      color: #f87171 !important;
    }
    .btn-micro-print {
      background: #10b981;
      color: #ffffff;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-micro-print:hover {
      filter: brightness(1.1);
    }

    /* Standard Table */
    .table-card table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    .table-card th, .table-card td {
      padding: 12px 14px;
      border-bottom: 1px solid #1f2f54;
      text-align: left;
    }
    .table-card th {
      font-weight: 700;
      color: #d4af37;
      background: #132247;
      text-transform: uppercase;
      font-size: 0.82rem;
    }
    .table-card td {
      color: #e2e8f0;
      font-size: 13.5px;
    }
    .table-card tbody tr:hover {
      background: #18284e;
    }
    
    .grade-badge {
      background: #091024;
      color: #d4af37;
      border: 1px solid #1f2f54;
      padding: 4px 8px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 800;
      font-family: monospace;
    }
    .grade-badge.excellent {
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
      border: 1px solid rgba(74, 222, 128, 0.3);
    }
    
    .status-pill {
      font-size: 0.8rem;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .status-pill.pass {
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
      border: 1px solid rgba(74, 222, 128, 0.3);
    }
    .status-pill.fail {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(248, 113, 113, 0.3);
    }
    .empty-state {
      text-align: center;
      color: #94a3b8;
      padding: 40px 20px;
      background: #101b38;
      border: 1px solid #1f2f54;
      border-radius: 12px;
    }
    .btn-clear-filters {
      margin-top: 12px;
      padding: 8px 18px;
      background: #18284e;
      color: #fde68a;
      border: 1px solid #d4af37;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 700;
      font-size: 13px;
    }

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
    
    @media print {
      body * {
        visibility: hidden;
      }
      .table-card, 
      .table-card * {
        visibility: visible;
      }
      .table-card {
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
      .print-header-details {
        display: block !important;
        margin-bottom: 20px;
        border-bottom: 2px solid #1e3a8a;
        padding-bottom: 12px;
      }
      .inst-banner {
        text-align: center;
        margin-bottom: 14px;
      }
      .student-meta-box {
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
      table {
        border-collapse: collapse;
        width: 100%;
        margin-top: 15px;
      }
      th {
        background: #1e40af !important;
        color: #ffffff !important;
        border: 1px solid #1e40af !important;
        padding: 8px 10px !important;
        font-size: 11px !important;
      }
      td {
        border: 1px solid #cbd5e1 !important;
        color: #1e293b !important;
        padding: 8px 10px !important;
        font-size: 11px !important;
      }
      .student-sem-summary-footer {
        background: #f8fafc !important;
        border: 1px solid #cbd5e1 !important;
        color: #1e293b !important;
        margin-top: 15px !important;
      }
      .summary-metric-item strong {
        color: #1e3a8a !important;
      }
      .print-signatures-area {
        display: flex !important;
        justify-content: space-between;
        margin-top: 50px;
        padding-top: 20px;
      }
      .sig-col {
        text-align: center;
        width: 180px;
        border-top: 1px solid #475569;
        padding-top: 6px;
        font-size: 11px;
        font-weight: 700;
        color: #1e293b;
      }
      app-navbar, app-sidebar, app-footer, .page-header, .semester-filter-toolbar, .summary-grid, .action-row, .empty-state, .sem-stats-pills, .results-deck-container, .student-picker-banner {
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

  // Expandable Master Deck State
  studentGroups: StudentAcademicProfileGroup[] = [];
  filteredStudentGroups: StudentAcademicProfileGroup[] = [];
  expandedStudentIds = new Set<string>();

  searchQuery: string = '';
  filterDept: string = '';
  filterGrade: string = '';

  availableStudentsList: { name: string; roll: string; dept: string; email: string }[] = [];

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

  getShortDept(dept: string): 'CSE' | 'IT' | 'ECE' | 'ME' | 'CE' | 'EEE' {
    const d = (dept || '').toLowerCase();
    if (d.includes('civil') || d === 'ce') return 'CE';
    if (d.includes('mechanical') || d.includes('mech') || d === 'me') return 'ME';
    if (d.includes('electrical & electronics') || d.includes('eee')) return 'EEE';
    if (d.includes('electronic') || d.includes('ece') || d.includes('electrical') || d === 'ee') return 'ECE';
    if (d.includes('information') || d.includes('it')) return 'IT';
    return 'CSE';
  }

  getAvatarInitials(name: string): string {
    if (!name) return 'ST';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  buildCurriculumForStudent(studentName: string, dept: string, semester: string): SemesterCourseRecord[] {
    const shortDept = this.getShortDept(dept);
    const prefix = shortDept === 'CSE' ? 'CS' : shortDept;
    const deptCourses = DEFAULT_DATABASE_COURSES.filter(c => c.code.toUpperCase().startsWith(prefix));

    if (deptCourses.length === 0) {
      if (semester === 'All Semesters') {
        const all: SemesterCourseRecord[] = [];
        for (const s of ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8']) {
          if (this.semesterCurriculumData[s]) all.push(...this.semesterCurriculumData[s]);
        }
        return all;
      }
      return this.semesterCurriculumData[semester] || this.semesterCurriculumData['Semester 6'] || [];
    }

    const semsToBuild = semester === 'All Semesters' 
      ? ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8']
      : [semester];

    const result: SemesterCourseRecord[] = [];

    for (const sem of semsToBuild) {
      const semCourses = deptCourses.filter(c => c.semester === sem);
      const coursesToMap = semCourses.length > 0 ? semCourses : deptCourses.slice(0, 5);

      coursesToMap.forEach((c) => {
        const isLab = c.code.endsWith('L') || c.title.toLowerCase().includes('lab');
        const isProject = c.code.includes('498') || c.title.toLowerCase().includes('project');
        const isViva = c.code.includes('499') || c.title.toLowerCase().includes('viva');
        const credits = isProject ? 8 : (isLab || isViva) ? 2 : (c.code.includes('115') || c.code.includes('125')) ? 3 : 4;

        const seed = Math.abs(((studentName || 'student') + c.code).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0));
        const internalMarks = 34 + (seed % 7);
        const externalMarks = 50 + ((seed * 3) % 10);
        const totalMarks = internalMarks + externalMarks;
        const grade = totalMarks >= 90 ? 'O' : totalMarks >= 80 ? 'A+' : totalMarks >= 70 ? 'A' : totalMarks >= 60 ? 'B+' : 'B';
        const gradePoints = grade === 'O' ? 10 : grade === 'A+' ? 9 : grade === 'A' ? 8 : grade === 'B+' ? 7 : 6;

        result.push({
          courseCode: c.code,
          courseTitle: c.title,
          credits,
          internalMarks,
          externalMarks,
          totalMarks,
          grade,
          gradePoints,
          status: 'Pass'
        });
      });
    }

    return result;
  }

  buildCurriculumForDepartment(dept: string): { [sem: string]: SemesterCourseRecord[] } {
    const shortDept = this.getShortDept(dept);
    const prefix = shortDept === 'CSE' ? 'CS' : shortDept;
    const deptCourses = DEFAULT_DATABASE_COURSES.filter(c => c.code.toUpperCase().startsWith(prefix));

    if (deptCourses.length === 0) {
      return this.semesterCurriculumData;
    }

    const sems = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'];
    const result: { [sem: string]: SemesterCourseRecord[] } = {};

    for (const sem of sems) {
      const semCourses = deptCourses.filter(c => c.semester === sem);
      result[sem] = semCourses.map((c) => {
        const isLab = c.code.endsWith('L') || c.title.toLowerCase().includes('lab');
        const isProject = c.code.includes('498') || c.title.toLowerCase().includes('project');
        const isViva = c.code.includes('499') || c.title.toLowerCase().includes('viva');
        const credits = isProject ? 8 : (isLab || isViva) ? 2 : (c.code.includes('115') || c.code.includes('125')) ? 3 : 4;

        const seed = Math.abs(((this.studentName || 'student') + c.code).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0));
        const internalMarks = 34 + (seed % 7);
        const externalMarks = 50 + ((seed * 3) % 10);
        const totalMarks = internalMarks + externalMarks;
        const grade = totalMarks >= 90 ? 'O' : totalMarks >= 80 ? 'A+' : totalMarks >= 70 ? 'A' : 'B+';
        const gradePoints = grade === 'O' ? 10 : grade === 'A+' ? 9 : grade === 'A' ? 8 : 7;

        return {
          courseCode: c.code,
          courseTitle: c.title,
          credits,
          internalMarks,
          externalMarks,
          totalMarks,
          grade,
          gradePoints,
          status: 'Pass'
        };
      });
    }

    return result;
  }

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
      this.semesterCurriculumData = this.buildCurriculumForDepartment(this.studentDept);
    } catch {
      this.role = null;
    }
  }

  ngOnInit(): void {
    this.loadAllStudentsAndResults();

    this.syncSub = this.syncService.events$.subscribe((e) => {
      if (e.type === 'MARKS_CHANGED' || e.type === 'COURSES_CHANGED' || e.type === 'USERS_CHANGED') {
        this.loadAllStudentsAndResults();
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

  selectSemester(sem: string): void {
    this.selectedSemester = sem;
    this.rebuildStudentGroups();
    this.cdr.detectChanges();
  }

  // Accordion Expand/Collapse methods
  toggleExpandStudent(studentId: string): void {
    if (this.expandedStudentIds.has(studentId)) {
      this.expandedStudentIds.delete(studentId);
    } else {
      this.expandedStudentIds.add(studentId);
    }
  }

  isStudentExpanded(studentId: string): boolean {
    return this.expandedStudentIds.has(studentId);
  }

  expandAllStudents(): void {
    this.filteredStudentGroups.forEach(s => this.expandedStudentIds.add(s.studentId));
  }

  collapseAllStudents(): void {
    this.expandedStudentIds.clear();
  }

  viewSpecificStudent(sName: string): void {
    this.studentName = sName;
    const match = this.availableStudentsList.find(s => s.name.toLowerCase() === sName.toLowerCase());
    if (match) {
      this.studentRoll = match.roll || 'CUTM2026CSE042';
      this.studentDept = match.dept || 'Computer Science & Engineering';
      this.semesterCurriculumData = this.buildCurriculumForDepartment(this.studentDept);
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
      this.semesterCurriculumData = this.buildCurriculumForDepartment(this.studentDept);
    }
    this.cdr.detectChanges();
  }

  private generateAllDefaultStudents(): { name: string; roll: string; dept: string; email: string }[] {
    const list: { name: string; roll: string; dept: string; email: string }[] = [
      { name: 'vamsi', roll: '646456455', dept: 'Computer Science & Engineering', email: 'vamsi1201@gmail.com' },
      { name: 'Krishnavamsi', roll: 'CUTM2026CSE042', dept: 'Computer Science & Engineering', email: 'krishnavamsi1201@gmail.com' },
      { name: 'Raj Kumar', roll: 'CUTM2026CSE018', dept: 'Computer Science & Engineering', email: 'raj.kumar@oblms.edu' },
      { name: 'zing', roll: '4444444556', dept: 'Civil Engineering', email: 'zing@gmail.com' },
      { name: 'Aarav Mehta', roll: 'CUTM2026CSE003', dept: 'Computer Science & Engineering', email: 'aarav.mehta@oblms.edu' }
    ];

    const branches = [
      { code: 'CSE', name: 'Computer Science & Engineering' },
      { code: 'IT', name: 'Information Technology' },
      { code: 'ECE', name: 'Electronics & Communication Engineering' },
      { code: 'ME', name: 'Mechanical Engineering' },
      { code: 'CE', name: 'Civil Engineering' },
      { code: 'EEE', name: 'Electrical & Electronics Engineering' }
    ];

    const firstNames = [
      'Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Ananya', 'Rohan', 'Divya', 
      'Aditya', 'Meera', 'Karthik', 'Pooja', 'Suresh', 'Harish', 'Bhavya', 
      'Chaitanya', 'Deepak', 'Gautam', 'Ishaan', 'Kalyan', 'Kavya', 'Keerthi', 'Madhuri', 
      'Manoj', 'Naveen', 'Neha', 'Nikhil', 'Pranav', 'Prashanth', 'Rajesh', 'Rakesh', 
      'Riya', 'Rohit', 'Sai', 'Sameer', 'Sanjay', 'Santosh', 'Shreya', 'Sowmya', 
      'Srikanth', 'Surya', 'Swathi', 'Tarun', 'Varun', 'Venkatesh', 'Vikas', 'Vinay'
    ];

    const lastNames = [
      'Sharma', 'Patel', 'Reddy', 'Nair', 'Singh', 'Roy', 'Gupta', 'Sri',
      'Verma', 'Hegde', 'Rao', 'Kalyan', 'Pillai', 'Mishra', 'Joshi', 'Bhat',
      'Choudhury', 'Das', 'Menon', 'Prasad', 'Naidu', 'Babu', 'Sundaram', 'Sen'
    ];

    let nameIndex = 0;
    let globalCounter = 5;

    for (const b of branches) {
      for (let sem = 1; sem <= 8; sem++) {
        for (let stuNum = 1; stuNum <= 3; stuNum++) {
          const stuId = `CUTM2026${b.code}${String(globalCounter).padStart(3, '0')}`;
          globalCounter++;

          const f = firstNames[nameIndex % firstNames.length];
          const l = lastNames[Math.floor(nameIndex / firstNames.length) % lastNames.length];
          nameIndex++;
          const fullName = `${f} ${l}`;
          const email = `${f.toLowerCase()}.${l.toLowerCase()}.${b.code.toLowerCase()}@oblms.edu`;

          list.push({
            name: fullName,
            roll: stuId,
            dept: b.name,
            email: email
          });
        }
      }
    }

    return list;
  }

  private loadAllStudentsAndResults(): void {
    const studentMap = new Map<string, { name: string; roll: string; dept: string; email: string }>();

    // 1. Initialize default student roster
    const defaults = this.generateAllDefaultStudents();
    defaults.forEach(s => studentMap.set(s.name.toLowerCase(), s));

    // 2. Load from localStorage if present
    try {
      const stored = localStorage.getItem('obslmsStudents');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach((s: any) => {
            if (s.name) {
              studentMap.set(s.name.toLowerCase(), {
                name: s.name,
                roll: s.regNo || s.id || `CUTM2026CSE${Math.floor(Math.random()*900+100)}`,
                dept: s.department || 'Computer Science & Engineering',
                email: s.email || `${s.name.toLowerCase().replace(/\s+/g, '.')}@oblms.edu`
              });
            }
          });
        }
      }
    } catch {}

    // 3. Load from backend API if active
    this.http.get<any[]>('http://localhost:8080/api/users').subscribe({
      next: (users) => {
        if (Array.isArray(users)) {
          const studentUsers = users.filter(u => u.role?.toUpperCase() === 'STUDENT');
          studentUsers.forEach((u: any) => {
            if (u.name) {
              studentMap.set(u.name.toLowerCase(), {
                name: u.name,
                roll: u.id || `CUTM2026CSE${Math.floor(Math.random()*900+100)}`,
                dept: u.department || 'Computer Science & Engineering',
                email: u.email || `${u.name.toLowerCase().replace(/\s+/g, '.')}@oblms.edu`
              });
            }
          });
        }
        this.availableStudentsList = Array.from(studentMap.values());
        this.rebuildStudentGroups();
      },
      error: () => {
        this.availableStudentsList = Array.from(studentMap.values());
        this.rebuildStudentGroups();
      }
    });
  }

  private rebuildStudentGroups(): void {
    // Check if marks are recorded in localStorage
    let savedMarks: any[] = [];
    try {
      const stored = localStorage.getItem('obslmsMarkEntries');
      if (stored) savedMarks = JSON.parse(stored) || [];
    } catch {}

    const weights = this.getObeWeights();
    const intWeight = weights.internal;
    const extWeight = weights.external;

    this.studentGroups = this.availableStudentsList.map((stu) => {
      const shortDept = this.getShortDept(stu.dept);
      const courses = this.buildCurriculumForStudent(stu.name, stu.dept, this.selectedSemester);

      // Overlay any customized mark entries
      courses.forEach(c => {
        const found = savedMarks.find(m => 
          (m.student && m.student.toLowerCase() === stu.name.toLowerCase()) &&
          (m.assessment && (m.assessment.includes(c.courseCode) || m.assessment.includes(c.courseTitle)))
        );
        if (found && found.obtained !== undefined) {
          const ob = Number(found.obtained) || 35;
          const mx = Number(found.maxMarks) || 40;
          c.internalMarks = Math.min(intWeight, Math.round((ob / mx) * intWeight));
          c.totalMarks = c.internalMarks + c.externalMarks;
          c.grade = c.totalMarks >= 90 ? 'O' : c.totalMarks >= 80 ? 'A+' : c.totalMarks >= 70 ? 'A' : c.totalMarks >= 60 ? 'B+' : 'B';
          c.gradePoints = c.grade === 'O' ? 10 : c.grade === 'A+' ? 9 : c.grade === 'A' ? 8 : c.grade === 'B+' ? 7 : 6;
          c.status = 'Pass';
        }
      });

      const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
      const earnedCredits = courses.filter(c => c.status === 'Pass').reduce((sum, c) => sum + c.credits, 0);
      const weightedPoints = courses.reduce((sum, c) => sum + (c.credits * c.gradePoints), 0);
      const sgpa = totalCredits > 0 ? Number((weightedPoints / totalCredits).toFixed(2)) : 0;
      
      const seed = Math.abs((stu.name + stu.roll).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0));
      const cgpa = Number((Math.min(9.95, Math.max(7.2, sgpa - 0.2 + (seed % 5) * 0.1))).toFixed(2));
      
      const totalCourses = courses.length;
      const passedCourses = courses.filter(c => c.status === 'Pass').length;
      const failedCourses = totalCourses - passedCourses;

      let overallGrade = 'O';
      if (sgpa < 9.0) overallGrade = 'A+';
      if (sgpa < 8.0) overallGrade = 'A';
      if (sgpa < 7.0) overallGrade = 'B+';
      if (sgpa < 6.0) overallGrade = 'B';
      if (failedCourses > 0) overallGrade = 'F';

      const standing = failedCourses === 0 ? 'PASS' : 'FAIL';

      return {
        studentId: stu.roll || 'CUTM2026CSE001',
        studentName: stu.name,
        department: stu.dept,
        shortDept,
        semester: this.selectedSemester,
        email: stu.email,
        courses,
        totalCredits,
        earnedCredits,
        sgpa,
        cgpa,
        totalCourses,
        passedCourses,
        failedCourses,
        overallGrade,
        standing
      };
    });

    // Expand the top 3 students by default
    this.expandedStudentIds.clear();
    if (this.studentGroups.length > 0) {
      this.expandedStudentIds.add(this.studentGroups[0].studentId);
      if (this.studentGroups[1]) this.expandedStudentIds.add(this.studentGroups[1].studentId);
    }

    this.applyResultsFilter();
  }

  onSearchChange(): void {
    this.applyResultsFilter();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filterDept = '';
    this.filterGrade = '';
    this.applyResultsFilter();
  }

  applyResultsFilter(): void {
    const q = this.searchQuery.toLowerCase().trim();
    const dept = this.filterDept;
    const grade = this.filterGrade;

    this.filteredStudentGroups = this.studentGroups.filter(s => {
      const matchSearch = !q ||
        s.studentName.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        s.courses.some(c => c.courseTitle.toLowerCase().includes(q) || c.courseCode.toLowerCase().includes(q));

      const matchDept = !dept || s.shortDept === dept || s.department.toLowerCase().includes(dept.toLowerCase());
      const matchGrade = !grade || s.overallGrade === grade;

      return matchSearch && matchDept && matchGrade;
    });

    this.cdr.detectChanges();
  }

  // Analytics Metrics
  get classAverageSgpa(): number {
    if (!this.filteredStudentGroups.length) return 0;
    const total = this.filteredStudentGroups.reduce((sum, s) => sum + s.sgpa, 0);
    return Number((total / this.filteredStudentGroups.length).toFixed(2));
  }

  get classAverageCgpa(): number {
    if (!this.filteredStudentGroups.length) return 0;
    const total = this.filteredStudentGroups.reduce((sum, s) => sum + s.cgpa, 0);
    return Number((total / this.filteredStudentGroups.length).toFixed(2));
  }

  get classPassRate(): number {
    if (!this.filteredStudentGroups.length) return 0;
    const passed = this.filteredStudentGroups.filter(s => s.standing === 'PASS').length;
    return Math.round((passed / this.filteredStudentGroups.length) * 100);
  }

  get displayedCourses(): SemesterCourseRecord[] {
    const cur = (this.semesterCurriculumData && Object.keys(this.semesterCurriculumData).length > 0)
      ? this.semesterCurriculumData
      : this.buildCurriculumForDepartment(this.studentDept);
    if (this.selectedSemester === 'All Semesters') {
      const all: SemesterCourseRecord[] = [];
      for (const sem of ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8']) {
        if (cur[sem]) all.push(...cur[sem]);
      }
      return all;
    }
    return cur[this.selectedSemester] || [];
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
    const cur = (this.semesterCurriculumData && Object.keys(this.semesterCurriculumData).length > 0)
      ? this.semesterCurriculumData
      : this.buildCurriculumForDepartment(this.studentDept);
    for (const sem of ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8']) {
      const list = cur[sem] || [];
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

  getAcademicStandingGrade(): string {
    const sgpa = this.semesterSgpa;
    const allPassed = this.displayedCourses.length > 0 && this.displayedCourses.every(c => c.status === 'Pass');
    if (!allPassed && this.displayedCourses.length > 0) {
      return 'GRADE F (RE-APPEAR)';
    }
    if (sgpa >= 9.0) return 'GRADE O (OUTSTANDING)';
    if (sgpa >= 8.0) return 'GRADE A+ (EXCELLENT)';
    if (sgpa >= 7.0) return 'GRADE A (VERY GOOD)';
    if (sgpa >= 6.0) return 'GRADE B+ (GOOD)';
    if (sgpa >= 5.5) return 'GRADE B (ABOVE AVERAGE)';
    if (sgpa >= 5.0) return 'GRADE C (PASS)';
    return 'GRADE F (FAIL)';
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

  downloadSingleStudentCsv(s: StudentAcademicProfileGroup): void {
    let csv = `CENTURION UNIVERSITY OF TECHNOLOGY & MANAGEMENT\n`;
    csv += `OUTCOME-BASED EDUCATION (OBE) CELL - OFFICIAL ACADEMIC TRANSCRIPT\n`;
    csv += `Student Name,${s.studentName}\n`;
    csv += `Roll Number,${s.studentId}\n`;
    csv += `Department,${s.department}\n`;
    csv += `Academic Program,Bachelor of Technology (${s.shortDept})\n`;
    csv += `Semester,${s.semester}\n`;
    csv += `Date Generated,${new Date().toLocaleDateString('en-IN')}\n\n`;

    csv += `Course Code,Course Title,Credits,Internal Marks (40),External Marks (60),Total Marks (100),Grade,Grade Points,Status\n`;

    s.courses.forEach(c => {
      csv += `"${c.courseCode}","${c.courseTitle}",${c.credits},${c.internalMarks},${c.externalMarks},${c.totalMarks},"${c.grade}",${c.gradePoints},"${c.status}"\n`;
    });

    csv += `\nSUMMARY EVALUATION METRICS\n`;
    csv += `Total Registered Credits,${s.totalCredits}\n`;
    csv += `Total Credits Earned,${s.earnedCredits}\n`;
    csv += `Semester Grade Point Average (SGPA),${s.sgpa}\n`;
    csv += `Cumulative Grade Point Average (CGPA),${s.cgpa}\n`;
    csv += `Overall Academic Standing,${s.standing === 'PASS' ? 'PASS (FIRST CLASS WITH DISTINCTION)' : 'RE-APPEAR'}\n`;
    csv += `Status,OFFICIAL NOTIFICATION OF RESULTS\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const cleanSem = s.semester.replace(/\s+/g, '_');
    a.download = `${s.studentId}_${s.studentName}_${cleanSem}_Marksheet.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    this.toastService.success(`Downloaded transcript for ${s.studentName} 📥`);
  }

  printStudentMarksheet(s: StudentAcademicProfileGroup): void {
    this.viewSpecificStudent(s.studentName);
    setTimeout(() => {
      window.print();
    }, 150);
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
