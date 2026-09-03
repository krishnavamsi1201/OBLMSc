import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { ToastService } from '../../shared/services/toast.service';
import { SyncService } from '../../shared/services/sync.service';
import { CourseService, AppCourse } from '../../shared/services/course.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

interface AttendanceRecord {
  id: number;
  student: string;
  regNo?: string;
  course: string;
  date: string;
  status: 'Present' | 'Absent';
  period?: string;
  topic?: string;
}

interface EnrolledStudent {
  id: string;
  regNo: string;
  name: string;
  department: string;
  semester: string;
  totalPresent: number;
  totalLectures: number;
  attendancePercentage: number;
  status: 'Present' | 'Absent' | 'Unmarked';
}

interface SubjectAttendanceSummary {
  courseCode: string;
  courseTitle: string;
  faculty: string;
  totalClasses: number;
  attended: number;
  absent: number;
  percentage: number;
  isEligible: boolean;
}

interface DayLectureEntry {
  period: string;
  course: string;
  faculty: string;
  status: 'Present' | 'Absent';
  topic: string;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  template: `<app-navbar></app-navbar>

<div *ngIf="role === 'student'; else fullApp" class="student-shell" [ngStyle]="themeStyles">
  <!-- Categorized Sidebar Navigation -->
  <div class="student-sidebar">
    <div class="logo">
      <h2>🎓 OBLMS</h2>
      <p>Outcome Based LMS</p>
    </div>

    <div class="nav-groups-container">
      <div *ngFor="let group of studentNavGroups" class="nav-group-block">
        <span class="group-title">{{ group.title }}</span>
        <div class="group-items">
          <button mat-button *ngFor="let item of group.items" (click)="navigate(item.path)" [class.active]="item.path === '/attendance'">
            <span class="icon">{{ item.icon }}</span>
            <span class="nav-label">{{ item.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Mini Profile Card at Bottom of Sidebar -->
    <div class="sidebar-user-card" (click)="navigate('/profile')" title="View profile details" style="margin-top: auto; padding: 10px 12px; background: var(--student-card-bg); border: 1px solid var(--student-border); border-radius: 12px; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: all 0.2s ease;">
      <div class="user-avatar-mini" style="width: 36px; height: 36px; border-radius: 50%; overflow: hidden; background: rgba(var(--student-primary-rgb), 0.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1.5px solid var(--student-primary);">
        <img *ngIf="studentPhoto" [src]="studentPhoto" alt="Profile" style="width: 100%; height: 100%; object-fit: cover;" />
        <span *ngIf="!studentPhoto">👨‍🎓</span>
      </div>
      <div class="user-meta-mini" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
        <strong class="user-name-mini" style="font-size: 12.5px; color: var(--student-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 700;">{{ studentName }}</strong>
        <span class="user-roll-mini" style="font-size: 11px; color: var(--student-text-secondary);">{{ studentRoll }}</span>
      </div>
      <button class="logout-icon-btn" (click)="$event.stopPropagation(); logout()" title="Logout" style="background: transparent; border: none; font-size: 15px; cursor: pointer; padding: 4px; opacity: 0.7;">🚪</button>
    </div>
  </div>

  <!-- Student Scrollable Content Area -->
  <div class="student-content" style="flex: 1; height: 100%; box-sizing: border-box; padding: 24px 28px 40px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px;">
    
        <!-- Page Header -->
        <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div class="header-title">
            <h1 style="margin: 0; font-size: 1.8rem; color: var(--student-text); font-weight: 800;">📅 My Attendance</h1>
            <p style="margin: 4px 0 0 0; color: var(--student-text-secondary); font-size: 0.95rem;">Track your overall academic attendance, day-wise lecture check-ins, and subject-wise 75% examination eligibility.</p>
          </div>
        </div>

        <!-- 3 ATTENDANCE NAVIGATION TABS -->
        <div class="student-tabs-bar">
            <button type="button" 
                    class="tab-btn" 
                    [class.active]="studentTab === 'overall'"
                    (click)="setStudentTab('overall')">
                📊 Overall Attendance
            </button>
            <button type="button" 
                    class="tab-btn" 
                    [class.active]="studentTab === 'daywise'"
                    (click)="setStudentTab('daywise')">
                📆 Day-Wise Attendance
            </button>
            <button type="button" 
                    class="tab-btn" 
                    [class.active]="studentTab === 'subjectwise'"
                    (click)="setStudentTab('subjectwise')">
                📚 Subject-Wise Attendance
            </button>
        </div>

        <!-- ------------------------------------------------------------- -->
        <!-- 📊 TAB 1: OVERALL ATTENDANCE                                  -->
        <!-- ------------------------------------------------------------- -->
        <div *ngIf="studentTab === 'overall'" class="tab-content-area" style="display: flex; flex-direction: column; gap: 20px;">
            
            <!-- Overall KPI Summary Cards -->
            <div class="student-summary-grid">
                <div class="summary-card main-pct" [class.good]="myOverallPercentage >= 75" [class.warning]="myOverallPercentage < 75">
                    <span class="card-icon">🎯</span>
                    <h3>Overall Attendance</h3>
                    <strong class="stat-number">{{ myOverallPercentage }}%</strong>
                    <span class="status-pill" [class.pill-green]="myOverallPercentage >= 75" [class.pill-red]="myOverallPercentage < 75">
                        {{ myOverallPercentage >= 75 ? '✅ Exam Eligible (≥75%)' : '⚠️ Below 75% Threshold' }}
                    </span>
                </div>
                <div class="summary-card">
                    <span class="card-icon">🏫</span>
                    <h3>Total Classes Conducted</h3>
                    <strong class="stat-number">{{ myTotalLectures }}</strong>
                    <p>Total course lecture sessions</p>
                </div>
                <div class="summary-card green-card">
                    <span class="card-icon">✅</span>
                    <h3>Classes Attended</h3>
                    <strong class="stat-number text-green">{{ myPresentCount }}</strong>
                    <p>Total lectures marked present</p>
                </div>
                <div class="summary-card red-card">
                    <span class="card-icon">❌</span>
                    <h3>Classes Missed</h3>
                    <strong class="stat-number text-red">{{ myAbsentCount }}</strong>
                    <p>Total lectures marked absent</p>
                </div>
            </div>

            <!-- Safe Margin & Eligibility Calculator Box -->
            <div class="eligibility-banner" [class.good-banner]="myOverallPercentage >= 75" [class.warn-banner]="myOverallPercentage < 75">
                <div class="eligibility-icon">{{ myOverallPercentage >= 75 ? '🛡️' : '⚠️' }}</div>
                <div class="eligibility-info">
                    <h4>{{ myOverallPercentage >= 75 ? 'Examination Eligibility Standing: High' : 'Attendance Shortage Warning!' }}</h4>
                    <p *ngIf="myOverallPercentage >= 75">
                        🌟 <strong>Safe Attendance Margin:</strong> You can safely miss up to <strong>{{ safeBunkClasses }}</strong> more classes and still maintain above the mandatory 75% minimum semester examination requirement.
                    </p>
                    <p *ngIf="myOverallPercentage < 75">
                        🚨 <strong>Action Required:</strong> You need to attend the next <strong>{{ neededConsecutiveClasses }}</strong> consecutive classes without any absence to reach the 75% minimum examination threshold.
                    </p>
                </div>
            </div>

            <!-- Complete Attendance Log Table -->
            <div class="logs-card">
                <div class="logs-header">
                    <h2>📋 Complete Attendance History ({{ filteredLogs.length }} Records)</h2>
                    <div class="logs-filter-group">
                        <input type="text" [(ngModel)]="searchTerm" (input)="filterLogs()" placeholder="Search by course name or date..." class="search-input" />
                        <select [(ngModel)]="statusFilter" (change)="filterLogs()" class="status-select">
                            <option value="">All Statuses</option>
                            <option value="Present">Present Only</option>
                            <option value="Absent">Absent Only</option>
                        </select>
                    </div>
                </div>

                <table class="logs-table" *ngIf="filteredLogs.length > 0">
                    <thead>
                        <tr>
                            <th style="width: 50px;">#</th>
                            <th>Subject / Course Name</th>
                            <th>Date</th>
                            <th style="text-align: center; width: 160px;">Attendance Status</th>
                            <th>Remarks / Period</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let log of filteredLogs; let i = index; trackBy: trackByLogId">
                            <td><span class="row-index">{{ i + 1 }}</span></td>
                            <td><strong>{{ log.course }}</strong></td>
                            <td>{{ log.date }}</td>
                            <td style="text-align: center;">
                                <span class="status-tag" [class.tag-present]="log.status === 'Present'" [class.tag-absent]="log.status === 'Absent'">
                                    {{ log.status === 'Present' ? '✅ Present' : '❌ Absent' }}
                                </span>
                            </td>
                            <td>
                                <span class="dept-label">{{ log.topic || (log.status === 'Present' ? 'Attended scheduled lecture' : 'Missed scheduled lecture') }}</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <p *ngIf="filteredLogs.length === 0" class="no-logs">No attendance history records found matching your search filter.</p>
            </div>

        </div>

        <!-- ------------------------------------------------------------- -->
        <!-- 📆 TAB 2: DAY-WISE ATTENDANCE                                 -->
        <!-- ------------------------------------------------------------- -->
        <div *ngIf="studentTab === 'daywise'" class="tab-content-area" style="display: flex; flex-direction: column; gap: 20px;">
            
            <!-- Date Picker & Quick Navigation Controls -->
            <div class="day-navigation-card">
                <div class="date-controls-group">
                    <button type="button" class="btn-day-nav" (click)="stepDate(-1)">◀ Previous Day</button>
                    <div class="date-picker-wrap">
                        <label>Select Date:</label>
                        <input type="date" [(ngModel)]="selectedDayDate" (change)="onDayDateChanged()" class="date-input-styled" />
                    </div>
                    <button type="button" class="btn-day-nav today-btn" (click)="setTodayDate()">Today</button>
                    <button type="button" class="btn-day-nav" (click)="stepDate(1)">Next Day ▶</button>
                </div>

                <!-- Daily Summary Stats Pill Strip -->
                <div class="day-stats-strip">
                    <div class="day-stat-chip">
                        <span>Date:</span>
                        <strong>{{ selectedDayFormatted }}</strong>
                    </div>
                    <div class="day-stat-chip">
                        <span>Scheduled Classes:</span>
                        <strong>{{ daySchedule.length }}</strong>
                    </div>
                    <div class="day-stat-chip green">
                        <span>Present:</span>
                        <strong>{{ dayPresentCount }}</strong>
                    </div>
                    <div class="day-stat-chip red">
                        <span>Absent:</span>
                        <strong>{{ dayAbsentCount }}</strong>
                    </div>
                    <div class="day-stat-chip blue">
                        <span>Daily Attendance Rate:</span>
                        <strong>{{ dayRate }}%</strong>
                    </div>
                </div>
            </div>

            <!-- Daily Periods Timetable Status -->
            <div class="logs-card">
                <div class="logs-header">
                    <h2>📅 Daily Class Attendance for {{ selectedDayFormatted }}</h2>
                </div>

                <table class="logs-table" *ngIf="daySchedule.length > 0">
                    <thead>
                        <tr>
                            <th style="width: 170px;">Period & Time</th>
                            <th>Subject / Course</th>
                            <th>Faculty In-Charge</th>
                            <th style="text-align: center; width: 160px;">Attendance Status</th>
                            <th>Topic & Learning Concept</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let item of daySchedule" [class.row-present]="item.status === 'Present'" [class.row-absent]="item.status === 'Absent'">
                            <td>
                                <span class="period-badge">{{ item.period }}</span>
                            </td>
                            <td>
                                <strong>{{ item.course }}</strong>
                            </td>
                            <td>
                                <span class="faculty-tag">{{ item.faculty }}</span>
                            </td>
                            <td style="text-align: center;">
                                <span class="status-tag" [class.tag-present]="item.status === 'Present'" [class.tag-absent]="item.status === 'Absent'">
                                    {{ item.status === 'Present' ? '✅ Present' : '❌ Absent' }}
                                </span>
                            </td>
                            <td>
                                <span class="topic-text">{{ item.topic }}</span>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div *ngIf="daySchedule.length === 0" class="no-logs">
                    <p>📭 No classes or attendance records logged for this selected date ({{ selectedDayFormatted }}).</p>
                    <button type="button" class="btn-day-nav today-btn mt-2" (click)="setTodayDate()">Back to Today</button>
                </div>
            </div>

        </div>

        <!-- ------------------------------------------------------------- -->
        <!-- 📚 TAB 3: SUBJECT-WISE ATTENDANCE                             -->
        <!-- ------------------------------------------------------------- -->
        <div *ngIf="studentTab === 'subjectwise'" class="tab-content-area" style="display: flex; flex-direction: column; gap: 20px;">
            
            <!-- Subject Cards Grid -->
            <div class="subject-cards-grid">
                <div *ngFor="let sub of subjectSummaries" class="subject-stat-card" [class.sub-good]="sub.isEligible" [class.sub-warning]="!sub.isEligible">
                    <div class="sub-card-head">
                        <div>
                            <span class="sub-code-badge">{{ sub.courseCode }}</span>
                            <h3 class="sub-title">{{ sub.courseTitle }}</h3>
                            <span class="sub-faculty">👨‍🏫 {{ sub.faculty }}</span>
                        </div>
                        <div class="sub-pct-circle" [class.pct-circle-good]="sub.isEligible" [class.pct-circle-warn]="!sub.isEligible">
                            <span class="pct-val">{{ sub.percentage }}%</span>
                        </div>
                    </div>

                    <!-- Progress bar -->
                    <div class="progress-bar-track">
                        <div class="progress-bar-fill" 
                             [style.width.%]="sub.percentage"
                             [class.bg-green]="sub.isEligible"
                             [class.bg-red]="!sub.isEligible">
                        </div>
                    </div>

                    <div class="sub-card-footer">
                        <div class="sub-counts">
                            <span class="count-item text-green">✅ Attended: <strong>{{ sub.attended }}</strong></span>
                            <span class="count-item text-red">❌ Absent: <strong>{{ sub.absent }}</strong></span>
                            <span class="count-item">Total: <strong>{{ sub.totalClasses }}</strong></span>
                        </div>
                        <span class="eligibility-tag" [class.tag-green]="sub.isEligible" [class.tag-red]="!sub.isEligible">
                            {{ sub.isEligible ? 'Eligible for Exams' : 'Attendance Shortage' }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Comprehensive Subject Breakdown Table -->
            <div class="logs-card mt-4">
                <div class="logs-header">
                    <h2>📚 Subject-Wise Attendance Breakdown Table</h2>
                </div>

                <table class="logs-table">
                    <thead>
                        <tr>
                            <th style="width: 50px;">#</th>
                            <th>Subject Code & Title</th>
                            <th>Faculty In-Charge</th>
                            <th style="text-align: center;">Total Classes</th>
                            <th style="text-align: center;">Classes Attended</th>
                            <th style="text-align: center;">Classes Absent</th>
                            <th style="text-align: center; width: 140px;">Attendance %</th>
                            <th style="text-align: center; width: 160px;">Exam Eligibility</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let sub of subjectSummaries; let i = index">
                            <td><span class="row-index">{{ i + 1 }}</span></td>
                            <td>
                                <strong>{{ sub.courseCode ? sub.courseCode + ' - ' : '' }}{{ sub.courseTitle }}</strong>
                            </td>
                            <td>
                                <span class="faculty-tag">{{ sub.faculty }}</span>
                            </td>
                            <td style="text-align: center;"><strong>{{ sub.totalClasses }}</strong></td>
                            <td style="text-align: center; color: #16a34a;"><strong>{{ sub.attended }}</strong></td>
                            <td style="text-align: center; color: #dc2626;"><strong>{{ sub.absent }}</strong></td>
                            <td style="text-align: center;">
                                <div class="pct-badge" [class.good]="sub.isEligible" [class.warning]="!sub.isEligible">
                                    <span class="pct-val">{{ sub.percentage }}%</span>
                                </div>
                            </td>
                            <td style="text-align: center;">
                                <span class="status-tag" [class.tag-present]="sub.isEligible" [class.tag-absent]="!sub.isEligible">
                                    {{ sub.isEligible ? '✅ Eligible' : '⚠️ Shortage' }}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

        </div>

    <app-footer></app-footer>
  </div>
</div>

<ng-template #fullApp>
<div class="container">
    <app-sidebar></app-sidebar>
    <div class="content">

        <!-- Page Header -->
        <div class="page-header">
            <div class="header-main-row">
                <div>
                    <h1>📅 Course Attendance Management</h1>
                    <p>Select a course to view enrolled students. Click Present or Absent on the right of each student to instantly increase or decrease their attendance percentage.</p>
                </div>
            </div>
        </div>

        <!-- Main Attendance Marking Card -->
        <div class="attendance-card">
            
            <!-- Top Controls Toolbar -->
            <div class="toolbar-header">
                <div class="toolbar-field">
                    <label>Select Course</label>
                    <select [(ngModel)]="selectedCourse" (ngModelChange)="onCourseChanged()" class="styled-select">
                        <option *ngFor="let c of coursesList" [value]="c.title">{{ c.code ? c.code + ' - ' : '' }}{{ c.title }}</option>
                    </select>
                </div>

                <div class="toolbar-field">
                    <label>Date</label>
                    <input type="date" [(ngModel)]="attendanceDate" (change)="onDateChanged()" class="styled-input" />
                </div>

                <div class="toolbar-actions">
                    <label>Batch Actions</label>
                    <div class="action-btn-row">
                        <button type="button" class="btn-quick present-all" (click)="markAll('Present')">
                            ✅ Mark All Present
                        </button>
                        <button type="button" class="btn-quick absent-all" (click)="markAll('Absent')">
                            ❌ Mark All Absent
                        </button>
                    </div>
                </div>
            </div>

            <!-- Session Stats Header Bar -->
            <div class="stats-ribbon">
                <div class="stat-bubble">
                    <span>Enrolled Students:</span>
                    <strong>{{ students.length }}</strong>
                </div>
                <div class="stat-bubble green">
                    <span>Present Today:</span>
                    <strong>{{ countPresentToday }}</strong>
                </div>
                <div class="stat-bubble red">
                    <span>Absent Today:</span>
                    <strong>{{ countAbsentToday }}</strong>
                </div>
                <div class="stat-bubble blue">
                    <span>Today's Attendance Rate:</span>
                    <strong>{{ todayRate }}%</strong>
                </div>
            </div>

            <!-- ENROLLED STUDENTS TABLE WITH PRESENT/ABSENT BUTTONS -->
            <div class="table-responsive">
                <table class="students-table">
                    <thead>
                        <tr>
                            <th style="width: 50px;">#</th>
                            <th style="width: 140px;">Reg No</th>
                            <th>Student Name</th>
                            <th>Department & Sem</th>
                            <th style="width: 180px; text-align: center;">Attendance %</th>
                            <th style="width: 260px; text-align: center;">Mark Attendance</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngIf="students.length === 0">
                            <td colspan="6" class="no-data">No students enrolled in this course.</td>
                        </tr>
                        <tr *ngFor="let s of students; let i = index; trackBy: trackByStudentId" 
                            [class.marked-present]="s.status === 'Present'"
                            [class.marked-absent]="s.status === 'Absent'">
                            
                            <td><span class="row-index">{{ i + 1 }}</span></td>
                            <td><span class="reg-pill">{{ s.regNo }}</span></td>
                            <td>
                                <div class="student-name-group">
                                    <span class="avatar-circle">{{ (s.name && s.name.length > 0 ? s.name.charAt(0) : 'S') }}</span>
                                    <div>
                                        <div class="student-title">{{ s.name }}</div>
                                        <div class="course-sub">{{ selectedCourse }}</div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <span class="dept-label">{{ s.department }} ({{ s.semester }})</span>
                            </td>
                            
                            <!-- ATTENDANCE PERCENTAGE (Increases on Present, Decreases on Absent) -->
                            <td style="text-align: center;">
                                <div class="pct-badge" [class.good]="s.attendancePercentage >= 75" [class.warning]="s.attendancePercentage < 75">
                                    <span class="pct-val">{{ s.attendancePercentage }}%</span>
                                    <span class="pct-sub">({{ s.totalPresent }}/{{ s.totalLectures }} classes)</span>
                                </div>
                            </td>

                            <!-- 2 BUTTONS: PRESENT & ABSENT ON THE RIGHT -->
                            <td style="text-align: center;">
                                <div class="attendance-btn-pair">
                                    <button type="button" 
                                            class="btn-attend present-btn" 
                                            [class.active]="s.status === 'Present'"
                                            (click)="toggleAttendance(s, 'Present')">
                                        ✅ Present
                                    </button>
                                    <button type="button" 
                                            class="btn-attend absent-btn" 
                                            [class.active]="s.status === 'Absent'"
                                            (click)="toggleAttendance(s, 'Absent')">
                                        ❌ Absent
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Footer confirmation note -->
            <div class="table-footer-bar">
                <span class="info-text">
                    💡 Clicking <strong>Present</strong> increases attendance % and <strong>Absent</strong> decreases attendance % in real-time.
                </span>
                <button type="button" class="btn-confirm-save" (click)="saveBulkToBackend()">
                    💾 Sync All Attendance
                </button>
            </div>
        </div>

        <!-- Attendance Logs History Table for Faculty/Admin (With Status Change & Delete) -->
        <div class="logs-card">
            <div class="logs-header">
                <h2>📜 Attendance Records & Logs ({{ filteredLogs.length }})</h2>
                <div class="logs-filter-group">
                    <input type="text" [(ngModel)]="searchTerm" (input)="filterLogs()" placeholder="Search logs by student, date, course..." class="search-input" />
                    <select [(ngModel)]="statusFilter" (change)="filterLogs()" class="status-select">
                        <option value="">All Statuses</option>
                        <option value="Present">Present Only</option>
                        <option value="Absent">Absent Only</option>
                    </select>
                </div>
            </div>

            <table class="logs-table" *ngIf="filteredLogs.length > 0">
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>RegNo</th>
                        <th>Course</th>
                        <th>Date</th>
                        <th style="text-align: center; width: 250px;">Change Status (Present / Absent)</th>
                        <th style="text-align: right; width: 120px;">Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let log of filteredLogs; trackBy: trackByLogId">
                        <td><strong>{{ log.student }}</strong></td>
                        <td><span class="reg-pill">{{ log.regNo || '-' }}</span></td>
                        <td><strong>{{ log.course }}</strong></td>
                        <td>{{ log.date }}</td>
                        
                        <td style="text-align: center;">
                            <div class="attendance-btn-pair">
                                <button type="button" 
                                        class="btn-attend-mini present-btn" 
                                        [class.active]="log.status === 'Present'"
                                        (click)="toggleLogStatus(log, 'Present')">
                                    ✅ Present
                                </button>
                                <button type="button" 
                                        class="btn-attend-mini absent-btn" 
                                        [class.active]="log.status === 'Absent'"
                                        (click)="toggleLogStatus(log, 'Absent')">
                                    ❌ Absent
                                </button>
                            </div>
                        </td>

                        <td style="text-align: right;">
                            <button type="button" class="btn-remove-log" (click)="removeLog(log)">🗑️ Delete</button>
                        </td>
                    </tr>
                </tbody>
            </table>
            <p *ngIf="filteredLogs.length === 0" class="no-logs">No attendance history records match your search filter.</p>
        </div>

        <app-footer></app-footer>
    </div>
</div>`,
  styles: [
    `
    .page-header { margin-bottom: 22px; }
    .header-main-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; }
    .page-header h1 { font-size: 1.85rem; color: #0f172a; margin: 0 0 6px; font-weight: 800; }
    .page-header p { color: #64748b; margin: 0; font-size: 0.95rem; }

    .student-pill-header { display: flex; align-items: center; gap: 12px; padding: 8px 16px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .user-avatar-badge { width: 38px; height: 38px; border-radius: 50%; background: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem; }
    .user-header-name { display: block; font-size: 0.95rem; color: #0f172a; }
    .user-header-sub { font-size: 0.8rem; color: #64748b; }

    /* Student Tabs Bar */
    .student-tabs-bar { display: flex; gap: 10px; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; flex-wrap: wrap; }
    .tab-btn { padding: 11px 20px; border-radius: 10px; border: 1px solid #cbd5e1; background: #ffffff; color: #475569; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: all 0.2s ease; outline: none; }
    .tab-btn:hover { background: #f8fafc; border-color: #94a3b8; }
    .tab-btn.active { background: #2563eb; color: #ffffff; border-color: #1d4ed8; box-shadow: 0 4px 12px rgba(37,99,235,0.25); }

    /* Student Summary Grid */
    .student-summary-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-bottom: 24px; }
    .summary-card { padding: 22px; background: #fff; border-radius: 14px; box-shadow: 0 4px 14px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; position: relative; }
    .summary-card.main-pct.good { border-color: #86efac; background: linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%); }
    .summary-card.main-pct.warning { border-color: #fca5a5; background: linear-gradient(180deg, #ffffff 0%, #fef2f2 100%); }
    .summary-card h3 { margin: 0 0 8px; font-size: 0.92rem; color: #475569; }
    .summary-card .stat-number { display: block; font-size: 2.2rem; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
    .summary-card p { margin: 0; font-size: 0.84rem; color: #64748b; }
    .card-icon { font-size: 1.5rem; margin-bottom: 8px; display: inline-block; }
    .text-green { color: #16a34a !important; }
    .text-red { color: #dc2626 !important; }

    /* Status Pill */
    .status-pill { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; }
    .pill-green { background: #dcfce7; color: #15803d; }
    .pill-red { background: #fee2e2; color: #b91c1c; }

    /* Eligibility Banner */
    .eligibility-banner { display: flex; gap: 16px; padding: 18px 22px; border-radius: 12px; margin-bottom: 24px; align-items: center; border: 1px solid; }
    .eligibility-banner.good-banner { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
    .eligibility-banner.warn-banner { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
    .eligibility-icon { font-size: 2.2rem; }
    .eligibility-info h4 { margin: 0 0 4px; font-size: 1.05rem; font-weight: 800; }
    .eligibility-info p { margin: 0; font-size: 0.92rem; line-height: 1.4; }

    /* Day Navigation Card */
    .day-navigation-card { background: #ffffff; padding: 20px 24px; border-radius: 14px; border: 1px solid #e2e8f0; margin-bottom: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.04); }
    .date-controls-group { display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap; margin-bottom: 18px; }
    .btn-day-nav { padding: 9px 18px; border-radius: 8px; border: 1px solid #cbd5e1; background: #ffffff; font-size: 0.9rem; font-weight: 700; cursor: pointer; color: #334155; }
    .btn-day-nav:hover { background: #f1f5f9; }
    .btn-day-nav.today-btn { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
    .date-picker-wrap { display: flex; align-items: center; gap: 8px; }
    .date-picker-wrap label { font-size: 0.88rem; font-weight: 700; color: #475569; }
    .date-input-styled { padding: 8px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; background: #ffffff; font-weight: 600; }

    .day-stats-strip { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .day-stat-chip { display: flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 8px; font-size: 0.86rem; background: #f8fafc; color: #334155; border: 1px solid #e2e8f0; }
    .day-stat-chip.green { background: #dcfce7; color: #15803d; border-color: #bbf7d0; }
    .day-stat-chip.red { background: #fee2e2; color: #b91c1c; border-color: #fecaca; }
    .day-stat-chip.blue { background: #e0e7ff; color: #3730a3; border-color: #c7d2fe; }

    .period-badge { background: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 6px; font-size: 0.82rem; font-weight: 700; }
    .faculty-tag { background: #f1f5f9; color: #475569; padding: 3px 8px; border-radius: 6px; font-size: 0.84rem; font-weight: 600; }
    .topic-text { font-size: 0.88rem; color: #334155; }

    /* Subject Wise Cards Grid */
    .subject-cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 18px; margin-bottom: 24px; }
    .subject-stat-card { background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; padding: 22px; box-shadow: 0 4px 14px rgba(0,0,0,0.04); display: flex; flex-direction: column; justify-content: space-between; }
    .subject-stat-card.sub-good { border-top: 4px solid #16a34a; }
    .subject-stat-card.sub-warning { border-top: 4px solid #dc2626; }

    .sub-card-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
    .sub-code-badge { background: #eff6ff; color: #1d4ed8; padding: 3px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 700; display: inline-block; margin-bottom: 6px; }
    .sub-title { margin: 0 0 4px; font-size: 1.05rem; color: #0f172a; font-weight: 800; }
    .sub-faculty { font-size: 0.82rem; color: #64748b; display: block; }

    .sub-pct-circle { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 800; font-size: 1.1rem; }
    .pct-circle-good { background: #dcfce7; color: #15803d; border: 2px solid #86efac; }
    .pct-circle-warn { background: #fee2e2; color: #b91c1c; border: 2px solid #fca5a5; }

    .progress-bar-track { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; margin-bottom: 14px; }
    .progress-bar-fill { height: 100%; transition: width 0.3s ease; }
    .bg-green { background: #16a34a; }
    .bg-red { background: #dc2626; }

    .sub-card-footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
    .sub-counts { display: flex; gap: 10px; font-size: 0.82rem; }
    .eligibility-tag { padding: 4px 10px; border-radius: 12px; font-size: 0.78rem; font-weight: 700; }
    .tag-green { background: #dcfce7; color: #15803d; }
    .tag-red { background: #fee2e2; color: #b91c1c; }

    /* Faculty Attendance Card */
    .attendance-card { background: #ffffff; border-radius: 14px; border: 1px solid #cbd5e1; box-shadow: 0 4px 24px rgba(0,0,0,0.06); margin-bottom: 28px; overflow: hidden; }
    
    /* Toolbar */
    .toolbar-header { display: grid; grid-template-columns: 2fr 1.2fr 1.6fr; gap: 20px; padding: 22px 24px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; align-items: flex-end; }
    .toolbar-field { display: flex; flex-direction: column; }
    .toolbar-field label, .toolbar-actions label { font-size: 0.88rem; font-weight: 700; color: #334155; margin-bottom: 6px; }
    .styled-select, .styled-input { padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; background: #ffffff; color: #1e293b; outline: none; }
    .styled-select:focus, .styled-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }

    .action-btn-row { display: flex; gap: 10px; }
    .btn-quick { padding: 9px 14px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: all 0.15s ease; }
    .btn-quick.present-all { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
    .btn-quick.present-all:hover { background: #dcfce7; }
    .btn-quick.absent-all { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
    .btn-quick.absent-all:hover { background: #fee2e2; }

    /* Stats Ribbon */
    .stats-ribbon { display: flex; gap: 14px; padding: 14px 24px; background: #ffffff; border-bottom: 1px solid #f1f5f9; flex-wrap: wrap; }
    .stat-bubble { display: flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 8px; font-size: 0.88rem; font-weight: 600; background: #f1f5f9; color: #334155; }
    .stat-bubble.green { background: #dcfce7; color: #15803d; }
    .stat-bubble.red { background: #fee2e2; color: #b91c1c; }
    .stat-bubble.blue { background: #e0e7ff; color: #4338ca; }
    .stat-bubble strong { font-size: 1.05rem; }

    /* Table */
    .table-responsive { overflow-x: auto; width: 100%; }
    .students-table { width: 100%; border-collapse: collapse; text-align: left; }
    .students-table th { padding: 14px 18px; background: #f8fafc; font-size: 0.84rem; font-weight: 700; color: #475569; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
    .students-table td { padding: 14px 18px; border-bottom: 1px solid #f1f5f9; font-size: 0.95rem; color: #1e293b; vertical-align: middle; }
    .students-table tbody tr:hover { background: #f8fafc; }
    .students-table tbody tr.marked-present { background: #fafffc; }
    .students-table tbody tr.marked-absent { background: #fffcfb; }

    .row-index { font-weight: 700; color: #94a3b8; font-size: 0.88rem; }
    .reg-pill { background: #f1f5f9; color: #475569; padding: 4px 8px; border-radius: 6px; font-size: 0.84rem; font-family: monospace; font-weight: 600; }
    
    .student-name-group { display: flex; align-items: center; gap: 12px; }
    .avatar-circle { width: 36px; height: 36px; border-radius: 50%; background: #2563eb; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.95rem; flex-shrink: 0; }
    .student-title { font-weight: 700; color: #0f172a; }
    .course-sub { color: #64748b; font-size: 0.82rem; margin-top: 1px; }
    .dept-label { color: #475569; font-size: 0.88rem; }

    /* Attendance % Badge */
    .pct-badge { display: inline-flex; flex-direction: column; align-items: center; padding: 6px 14px; border-radius: 10px; min-width: 85px; }
    .pct-badge.good { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
    .pct-badge.warning { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
    .pct-val { font-size: 1.05rem; font-weight: 800; }
    .pct-sub { font-size: 0.74rem; opacity: 0.88; margin-top: 2px; }

    /* 2 Interactive Buttons */
    .attendance-btn-pair { display: inline-flex; gap: 8px; justify-content: center; }
    .btn-attend { padding: 9px 18px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem; font-weight: 700; cursor: pointer; background: #ffffff; color: #64748b; transition: all 0.15s ease; outline: none; }
    
    .btn-attend.present-btn:hover, .btn-attend-mini.present-btn:hover { background: #f0fdf4; border-color: #86efac; color: #16a34a; }
    .btn-attend.present-btn.active, .btn-attend-mini.present-btn.active { background: #16a34a; border-color: #15803d; color: #ffffff; box-shadow: 0 2px 10px rgba(22,163,74,0.35); }

    .btn-attend.absent-btn:hover, .btn-attend-mini.absent-btn:hover { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
    .btn-attend.absent-btn.active, .btn-attend-mini.absent-btn.active { background: #dc2626; border-color: #b91c1c; color: #ffffff; box-shadow: 0 2px 10px rgba(220,38,38,0.35); }

    .btn-attend-mini { padding: 6px 12px; border: 1.5px solid #cbd5e1; border-radius: 6px; font-size: 0.82rem; font-weight: 700; cursor: pointer; background: #ffffff; color: #64748b; transition: all 0.15s ease; outline: none; }

    /* Footer */
    .table-footer-bar { padding: 18px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    .info-text { font-size: 0.9rem; color: #64748b; }
    .btn-confirm-save { padding: 11px 24px; border: none; border-radius: 8px; background: #2563eb; color: #ffffff; font-weight: 700; font-size: 0.95rem; cursor: pointer; box-shadow: 0 4px 12px rgba(37,99,235,0.25); }
    .btn-confirm-save:hover { background: #1d4ed8; }

    /* Logs Card */
    .logs-card { padding: 22px 24px; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 2px 10px rgba(0,0,0,0.04); margin-bottom: 24px; }
    .logs-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
    .logs-header h2 { margin: 0; font-size: 1.2rem; color: #0f172a; }
    .logs-filter-group { display: flex; gap: 10px; }
    .search-input { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.88rem; min-width: 240px; outline: none; }
    .status-select { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.88rem; background: #fff; outline: none; }

    .logs-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .logs-table th { padding: 12px 14px; background: #f8fafc; font-size: 0.82rem; font-weight: 700; color: #475569; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; text-align: left; }
    .logs-table td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; font-size: 0.92rem; color: #1e293b; vertical-align: middle; }
    .logs-table tbody tr:hover { background: #f8fafc; }
    .logs-table tbody tr.row-present { background: #fafffc; }
    .logs-table tbody tr.row-absent { background: #fffcfb; }

    .status-tag { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 0.84rem; font-weight: 700; }
    .status-tag.tag-present { background: #dcfce7; color: #166534; }
    .status-tag.tag-absent { background: #fee2e2; color: #991b1b; }

    .btn-remove-log { padding: 6px 14px; border: 1px solid #fecaca; background: #fff; color: #dc2626; border-radius: 6px; cursor: pointer; font-size: 0.82rem; font-weight: 600; }
    .btn-remove-log:hover { background: #fee2e2; }
    .no-data, .no-logs { padding: 30px; text-align: center; color: #94a3b8; font-size: 0.95rem; }

    /* ==========================================================
       STUDENT SHELL SIDEBAR & SCROLLABLE CONTENT AREA LAYOUT CSS
       ========================================================== */
    .student-shell {
      display: flex;
      position: absolute;
      top: 72px;
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      min-height: 0;
      align-items: stretch;
      background: var(--student-bg, rgba(240, 249, 255, 0.92));
      color: var(--student-text, #1e293b);
      overflow: hidden;
      box-sizing: border-box;
    }

    .student-sidebar {
      width: 270px;
      height: 100%;
      box-sizing: border-box;
      padding: 20px 16px;
      background: var(--student-sidebar-bg, rgba(255, 255, 255, 0.98));
      border-right: 1px solid var(--student-border, rgba(74, 140, 234, 0.16));
      box-shadow: 2px 0 30px rgba(74, 140, 234, 0.08);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      flex-shrink: 0;
    }

    .student-sidebar .logo {
      margin-bottom: 20px;
      padding: 0 8px;
    }

    .student-sidebar .logo h2 {
      color: var(--student-primary, #1976d2);
      margin: 0;
      font-size: 1.4rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .student-sidebar .logo p {
      font-size: 0.78rem;
      margin: 2px 0 0;
      color: var(--student-text-secondary, #64748b);
      font-weight: 500;
    }

    .nav-groups-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      flex: 1;
    }

    .nav-group-block {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .group-title {
      font-size: 10.5px;
      font-weight: 800;
      color: var(--student-text-secondary, #64748b);
      letter-spacing: 0.08em;
      padding: 0 12px;
      margin-bottom: 4px;
      text-transform: uppercase;
    }

    .group-items {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .group-items button {
      width: 100%;
      justify-content: flex-start;
      gap: 10px;
      padding: 8px 12px;
      font-size: 13.5px;
      font-weight: 500;
      border-radius: 8px;
      color: var(--student-text, #1e293b);
      background: transparent;
      border: none;
      text-align: left;
      cursor: pointer;
      display: flex;
      align-items: center;
      transition: all 0.18s ease;
    }

    .group-items button .icon {
      font-size: 15px;
      flex-shrink: 0;
    }

    .group-items button .nav-label {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .group-items button:hover {
      background: rgba(var(--student-primary-rgb, 25, 118, 210), 0.08);
      color: var(--student-primary, #1976d2);
      transform: translateX(2px);
    }

    .group-items button.active {
      background: var(--student-primary, #1976d2);
      color: #ffffff;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(var(--student-primary-rgb, 25, 118, 210), 0.28);
    }
    `
  ]
})
export class AttendancePage implements OnInit, OnDestroy {
  role: string = 'faculty';
  userName: string = 'Faculty';

  studentName = 'Student';
  studentEmail = '';
  studentPhoto: string | null = null;
  studentRoll = 'CUTM2026CSE042';
  studentDept = 'Computer Science & Engineering';

  appearance = {
    theme: 'light',
    colorScheme: 'blue',
    layout: 'comfortable',
    showSidebar: true,
    fontSize: 'medium'
  };

  themeStyles: { [key: string]: string } = {};

  studentNavGroups = [
    {
      title: 'ACADEMICS',
      items: [
        { label: 'Student Dashboard', path: '/students', icon: '🏠' },
        { label: 'Enrolled Courses', path: '/courses', icon: '📚' },
        { label: 'Subject List', path: '/subjects', icon: '📖' },
        { label: 'Weekly Timetable', path: '/timetable', icon: '📆' }
      ]
    },
    {
      title: 'OBE & OUTCOMES',
      items: [
        { label: 'Course Outcomes (CO)', path: '/course-outcomes', icon: '🎯' },
        { label: 'Program Outcomes (PO)', path: '/program-outcomes', icon: '🎯' },
        { label: 'CO-PO Mapping', path: '/copo-mapping', icon: '🔗' },
        { label: 'CO Attainment', path: '/co-attainment', icon: '📊' },
        { label: 'PO Attainment', path: '/po-attainment', icon: '📈' }
      ]
    },
    {
      title: 'EXAMINATIONS & MARKS',
      items: [
        { label: 'Upcoming Exams', path: '/assessments', icon: '📝' },
        { label: 'Attendance %', path: '/attendance', icon: '📅' },
        { label: 'Marks Summary', path: '/performance', icon: '📈' },
        { label: 'Semester Results', path: '/results', icon: '📄' }
      ]
    },
    {
      title: 'STUDENT SERVICES',
      items: [
        { label: 'Feedback Form', path: '/feedback', icon: '💬' },
        { label: 'File Grievance', path: '/grievance', icon: '📩' },
        { label: 'Notifications', path: '/notifications', icon: '🔔' },
        { label: 'Student Details', path: '/profile', icon: '👤' }
      ]
    }
  ];

  // Student Navigation Tabs
  studentTab: 'overall' | 'daywise' | 'subjectwise' = 'overall';

  // Option 2: Day-Wise Attendance State
  selectedDayDate: string = new Date().toISOString().split('T')[0];
  daySchedule: DayLectureEntry[] = [];

  // Option 3: Subject-Wise Attendance State
  subjectSummaries: SubjectAttendanceSummary[] = [];

  // Active selections (Faculty/Admin)
  coursesList: AppCourse[] = [];
  selectedCourse: string = 'Advanced Java';
  attendanceDate: string = new Date().toISOString().split('T')[0];

  // Enrolled Students list (Faculty/Admin only)
  students: EnrolledStudent[] = [];

  // Logs & History
  allLogs: AttendanceRecord[] = [];
  filteredLogs: AttendanceRecord[] = [];
  searchTerm: string = '';
  statusFilter: string = '';
  isLocalChange = false;

  private toast = inject(ToastService);
  private syncService = inject(SyncService);
  private courseService = inject(CourseService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private syncSub?: Subscription;

  constructor() {
    this.refreshUserRole();
    this.loadAppearance();
  }

  get isStudent(): boolean {
    const r = (this.role || localStorage.getItem('userRole') || '').toLowerCase();
    return r === 'student';
  }

  private refreshUserRole(): void {
    const r = (localStorage.getItem('userRole') || 'faculty').toLowerCase();
    this.role = r;
    this.userName = localStorage.getItem('userName') || (this.isStudent ? 'Krishnavamsi' : 'Faculty');
    this.studentName = this.userName;
    this.studentEmail = localStorage.getItem('userEmail') || 'student@centurionuniv.edu.in';
    this.studentPhoto = localStorage.getItem('userProfilePicture') || null;
    this.studentDept = localStorage.getItem('userDepartment') || 'Computer Science & Engineering';
    this.studentRoll = localStorage.getItem('userRoll') || 'CUTM2026CSE042';
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  logout(): void {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    this.router.navigate(['/login']);
  }

  ngOnInit(): void {
    try {
      localStorage.removeItem('obslmsAttendance');
    } catch {}
    this.refreshUserRole();
    this.loadCourses();
    this.ensureDefaultStudentLogs();
    this.loadAllLogs();
    
    if (this.isStudent) {
      this.calculateSubjectSummaries();
      this.loadDaySchedule();
    } else {
      this.loadEnrolledStudents();
    }

    this.syncSub = this.syncService.events$.subscribe((e) => {
      if (e.type === 'ATTENDANCE_CHANGED' || e.type === 'COURSES_CHANGED') {
        this.refreshUserRole();
        this.loadAllLogs();
        if (this.isStudent) {
          this.calculateSubjectSummaries();
          this.loadDaySchedule();
        } else {
          if (!this.isLocalChange) {
            this.loadEnrolledStudents();
          }
        }
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.syncSub?.unsubscribe();
  }

  trackByStudentId(index: number, student: EnrolledStudent): string {
    return student.id;
  }

  trackByLogId(index: number, log: AttendanceRecord): number {
    return log.id;
  }

  setStudentTab(tab: 'overall' | 'daywise' | 'subjectwise'): void {
    this.studentTab = tab;
    if (tab === 'daywise') {
      this.loadDaySchedule();
    } else if (tab === 'subjectwise') {
      this.calculateSubjectSummaries();
    }
  }

  private loadCourses(): void {
    this.http.get<any[]>('http://localhost:8080/api/courses').subscribe({
      next: (allCourses) => {
        const all = Array.isArray(allCourses) && allCourses.length > 0 ? allCourses : [];
        if (this.role === 'faculty') {
          const uName = (this.userName || localStorage.getItem('userName') || '').toLowerCase();
          const uEmail = (localStorage.getItem('userEmail') || '').toLowerCase();
          let assigned: string[] = [];
          try {
            const stored = localStorage.getItem('userAssignedCourses');
            if (stored) assigned = JSON.parse(stored);
          } catch {}

          const facultyCourses = all.filter(c => 
            assigned.some(a => a.toLowerCase() === (c.title || '').toLowerCase() || a.toLowerCase() === (c.code || '').toLowerCase()) ||
            (c.faculty && (c.faculty.toLowerCase().includes(uName) || uName.includes(c.faculty.toLowerCase()) || c.faculty.toLowerCase().includes(uEmail)))
          );

          this.coursesList = facultyCourses;
        } else {
          this.coursesList = all;
        }

        if (this.coursesList.length > 0) {
          this.selectedCourse = this.coursesList[0].code ? `${this.coursesList[0].code} - ${this.coursesList[0].title}` : this.coursesList[0].title;
        } else {
          this.selectedCourse = '';
        }

        if (!this.isStudent) {
          this.loadEnrolledStudents();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.coursesList = [];
        this.selectedCourse = '';
        this.cdr.detectChanges();
      }
    });
  }

  isCourseMatch(logCourse: string, courseCode: string, courseTitle: string): boolean {
    if (!logCourse) return false;
    const lc = logCourse.toLowerCase();
    const code = (courseCode || '').toLowerCase();
    const title = (courseTitle || '').toLowerCase();
    return (
      (!!code && lc.includes(code)) || 
      (!!title && lc.includes(title)) || 
      (!!code && code.includes(lc)) || 
      (!!title && title.includes(lc))
    );
  }

  getStudentEnrolledCourses(): any[] {
    const all = this.coursesList;
    try {
      const storedStudentCourses = localStorage.getItem('obslmsStudentCourses');
      const studentCourses = storedStudentCourses ? JSON.parse(storedStudentCourses) : [];
      const sName = this.userName || localStorage.getItem('userName') || 'student';
      const myCourseCodes = studentCourses
        .filter((sc: any) => sc.studentName.toLowerCase() === sName.toLowerCase())
        .map((sc: any) => sc.courseCode.toLowerCase());

      return all.filter(c => 
        myCourseCodes.includes(c.code.toLowerCase()) || 
        myCourseCodes.includes(c.title?.toLowerCase())
      );
    } catch {
      return all;
    }
  }

  private ensureDefaultStudentLogs(): void {
    // Zero fake data: attendance logs are strictly loaded from MySQL backend
  }

  private loadAllLogs(): void {
    this.http.get<any[]>('http://localhost:8080/api/attendance').subscribe({
      next: (backendLogs) => {
        if (Array.isArray(backendLogs)) {
          const mapped: AttendanceRecord[] = backendLogs.map((b, idx) => ({
            id: b.id || (Date.now() + idx),
            student: b.student,
            regNo: b.regNo || '240101120001',
            course: b.courseCode || b.course || '',
            date: b.date || this.attendanceDate,
            status: (b.status === 'Absent' ? 'Absent' : 'Present') as 'Present' | 'Absent',
            period: b.period,
            topic: b.topic
          }));
          this.allLogs = mapped;
          this.filterLogs();
          if (this.isStudent) {
            this.calculateSubjectSummaries();
            this.loadDaySchedule();
          } else {
            this.loadEnrolledStudents();
          }
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.allLogs = [];
        this.filterLogs();
      }
    });
  }

  /**
   * Option 2: Loads Day-wise attendance schedule
   */
  loadDaySchedule(): void {
    const studentLogs = this.myLogs;
    const enrolled = this.getStudentEnrolledCourses();
    const matchingDateLogs = studentLogs.filter(l => 
      l.date === this.selectedDayDate &&
      enrolled.some(c => this.isCourseMatch(l.course, c.code, c.title))
    );

    this.daySchedule = matchingDateLogs.map(l => {
      const courseMatch = enrolled.find(c => this.isCourseMatch(l.course, c.code, c.title));
      return {
        period: l.period || 'Scheduled Period',
        course: courseMatch ? `${courseMatch.code} - ${courseMatch.title}` : l.course,
        faculty: courseMatch?.faculty || 'Senior Faculty',
        status: l.status,
        topic: l.topic || 'Regular Class Session'
      };
    });
  }

  stepDate(days: number): void {
    const current = new Date(this.selectedDayDate);
    current.setDate(current.getDate() + days);
    this.selectedDayDate = current.toISOString().split('T')[0];
    this.loadDaySchedule();
  }

  setTodayDate(): void {
    this.selectedDayDate = new Date().toISOString().split('T')[0];
    this.loadDaySchedule();
  }

  onDayDateChanged(): void {
    this.loadDaySchedule();
  }

  get selectedDayFormatted(): string {
    try {
      const d = new Date(this.selectedDayDate);
      return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return this.selectedDayDate;
    }
  }

  get dayPresentCount(): number {
    return this.daySchedule.filter(s => s.status === 'Present').length;
  }

  get dayAbsentCount(): number {
    return this.daySchedule.filter(s => s.status === 'Absent').length;
  }

  get dayRate(): number {
    if (this.daySchedule.length === 0) return 0;
    return Math.round((this.dayPresentCount / this.daySchedule.length) * 100);
  }

  /**
   * Option 3: Calculates Subject-wise attendance breakdown
   */
  calculateSubjectSummaries(): void {
    const enrolled = this.getStudentEnrolledCourses();
    const studentLogs = this.myLogs;

    this.subjectSummaries = enrolled.map(c => {
      const cLogs = studentLogs.filter(l => this.isCourseMatch(l.course, c.code, c.title));

      const total = cLogs.length;
      const present = cLogs.filter(l => l.status === 'Present').length;
      const absent = total - present;
      const pct = total > 0 ? Math.round((present / total) * 100) : 0;

      return {
        courseCode: c.code,
        courseTitle: c.title,
        faculty: c.faculty || 'Senior Faculty',
        totalClasses: total,
        attended: present,
        absent: absent,
        percentage: pct,
        isEligible: pct >= 75
      };
    });
  }

  get safeBunkClasses(): number {
    const safe = Math.floor((this.myPresentCount - (0.75 * this.myTotalLectures)) / 0.75);
    return Math.max(0, safe);
  }

  get neededConsecutiveClasses(): number {
    const needed = Math.ceil(((0.75 * this.myTotalLectures) - this.myPresentCount) / 0.25);
    return Math.max(1, needed);
  }

  /**
   * Loads students enrolled in the current course (strictly from MySQL database)
   */
  loadEnrolledStudents(): void {
    if (!this.selectedCourse) {
      this.students = [];
      this.cdr.detectChanges();
      return;
    }

    const courseTokens = this.selectedCourse.split(' - ');
    const searchParam = courseTokens.length > 1 ? courseTokens[0].trim() : this.selectedCourse.trim();

    this.http.get<any[]>(`http://localhost:8080/api/attendance/enrolled-students?courseCode=${encodeURIComponent(searchParam)}`).subscribe({
      next: (enrolledList) => {
        if (Array.isArray(enrolledList) && enrolledList.length > 0) {
          this.students = enrolledList.map(s => {
            const studentCourseLogs = this.allLogs.filter(l =>
              l.student && l.student.toLowerCase() === s.name.toLowerCase() &&
              l.course && (l.course.toLowerCase().includes(searchParam.toLowerCase()) || searchParam.toLowerCase().includes(l.course.toLowerCase()))
            );

            const todayLog = studentCourseLogs.find(l => l.date === this.attendanceDate);
            const status: 'Present' | 'Absent' | 'Unmarked' = todayLog ? todayLog.status : 'Unmarked';
            const totalLectures = studentCourseLogs.length;
            const totalPresent = studentCourseLogs.filter(l => l.status === 'Present').length;
            const pct = totalLectures > 0 ? Math.round((totalPresent / totalLectures) * 100) : 0;

            return {
              id: s.id,
              regNo: s.regNo || s.id,
              name: s.name,
              department: s.department,
              semester: s.semester || 'Semester 6',
              totalPresent: totalPresent,
              totalLectures: totalLectures,
              attendancePercentage: pct,
              status: status
            };
          });
        } else {
          this.students = [];
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.students = [];
        this.cdr.detectChanges();
      }
    });
  }

  onCourseChanged(): void {
    if (!this.isStudent) {
      this.loadEnrolledStudents();
    }
  }

  onDateChanged(): void {
    if (!this.isStudent) {
      this.loadEnrolledStudents();
    }
  }

  /**
   * Toggle attendance for a student in the top Roster table
   */
  toggleAttendance(student: EnrolledStudent, newStatus: 'Present' | 'Absent'): void {
    const oldStatus = student.status;
    student.status = newStatus;

    if (oldStatus === 'Unmarked') {
      student.totalLectures += 1;
      if (newStatus === 'Present') {
        student.totalPresent += 1;
      }
    } else if (oldStatus === 'Absent' && newStatus === 'Present') {
      student.totalPresent += 1;
    } else if (oldStatus === 'Present' && newStatus === 'Absent') {
      student.totalPresent = Math.max(0, student.totalPresent - 1);
    }
    student.attendancePercentage = Math.round((student.totalPresent / student.totalLectures) * 100);

    const recordIndex = this.allLogs.findIndex(l =>
      l.student && l.student.toLowerCase() === student.name.toLowerCase() &&
      l.course && l.course.toLowerCase() === this.selectedCourse.toLowerCase() &&
      l.date === this.attendanceDate
    );

    if (recordIndex !== -1) {
      this.allLogs[recordIndex].status = newStatus;
    } else {
      this.allLogs.unshift({
        id: Date.now() + Math.floor(Math.random() * 10000),
        student: student.name,
        regNo: student.regNo,
        course: this.selectedCourse,
        date: this.attendanceDate,
        status: newStatus
      });
    }

    try {
      localStorage.setItem('obslmsAttendance', JSON.stringify(this.allLogs));
    } catch {}

    // Immediate background push to MySQL database
    this.http.post('http://localhost:8080/api/attendance', {
      student: student.name,
      courseCode: this.selectedCourse,
      date: this.attendanceDate,
      status: newStatus
    }).subscribe({ error: () => {} });

    this.isLocalChange = true;
    this.syncService.emit('ATTENDANCE_CHANGED');
    this.isLocalChange = false;

    if (newStatus === 'Present') {
      this.toast.success(`${student.name} marked Present. (Attendance: ${student.attendancePercentage}%) 📈`);
    } else {
      this.toast.warning(`${student.name} marked Absent. (Attendance: ${student.attendancePercentage}%) 📉`);
    }

    this.filterLogs();
    this.cdr.detectChanges();
  }

  /**
   * Toggle status directly from the bottom Attendance Logs table
   */
  toggleLogStatus(log: AttendanceRecord, newStatus: 'Present' | 'Absent'): void {
    if (log.status === newStatus) return;
    log.status = newStatus;

    try {
      localStorage.setItem('obslmsAttendance', JSON.stringify(this.allLogs));
    } catch {}

    this.isLocalChange = true;
    this.syncService.emit('ATTENDANCE_CHANGED');
    this.isLocalChange = false;
    if (!this.isStudent) {
      this.loadEnrolledStudents();
    }
    this.filterLogs();

    if (newStatus === 'Present') {
      this.toast.success(`Switched ${log.student} to Present for ${log.date}. (Attendance increased 📈)`);
    } else {
      this.toast.warning(`Switched ${log.student} to Absent for ${log.date}. (Attendance decreased 📉)`);
    }
  }

  /**
   * Batch mark all students Present or Absent
   */
  markAll(status: 'Present' | 'Absent'): void {
    this.students.forEach(s => {
      this.toggleAttendance(s, status);
    });
    this.toast.success(`Marked all students ${status} for ${this.attendanceDate}!`);
  }

  saveBulkToBackend(): void {
    const payload = this.students.map(s => ({
      student: s.name,
      courseCode: this.selectedCourse,
      date: this.attendanceDate,
      status: s.status === 'Absent' ? 'Absent' : 'Present'
    }));

    this.http.post('http://localhost:8080/api/attendance/bulk', payload).subscribe({
      next: () => {},
      error: () => {}
    });

    this.toast.success(`All attendance records synced successfully!`);
  }

  removeLog(log: AttendanceRecord): void {
    this.allLogs = this.allLogs.filter(l => l !== log);
    try {
      localStorage.setItem('obslmsAttendance', JSON.stringify(this.allLogs));
      this.syncService.emit('ATTENDANCE_CHANGED');
      this.toast.info('Attendance entry deleted.');
    } catch {}
    if (!this.isStudent) {
      this.loadEnrolledStudents();
    }
    this.filterLogs();
  }

  filterLogs(): void {
    let results = this.allLogs;

    // If Student, only show their own logs
    if (this.isStudent) {
      const u = (this.userName || localStorage.getItem('userName') || 'student').toLowerCase();
      results = results.filter(l =>
        (l.student && l.student.toLowerCase() === u) ||
        (l.student && l.student.toLowerCase() === 'student') ||
        (l.student && l.student.toLowerCase() === 'krishnavamsi')
      );
    } else if (this.role === 'faculty') {
      // Faculty should ONLY see logs for courses allocated to them!
      const myCourseCodes = this.coursesList.map(c => (c.code || '').toLowerCase()).filter(Boolean);
      const myCourseTitles = this.coursesList.map(c => (c.title || '').toLowerCase()).filter(Boolean);
      
      results = results.filter(l => {
        if (!l.course) return false;
        const lc = l.course.toLowerCase();
        return myCourseCodes.some(c => lc.includes(c) || c.includes(lc)) ||
               myCourseTitles.some(t => lc.includes(t) || t.includes(lc));
      });
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      results = results.filter(l =>
        (l.student && l.student.toLowerCase().includes(term)) ||
        (l.course && l.course.toLowerCase().includes(term)) ||
        (l.regNo && l.regNo.toLowerCase().includes(term)) ||
        (l.date && l.date.includes(term))
      );
    }

    if (this.statusFilter) {
      results = results.filter(l => l.status === this.statusFilter);
    }

    this.filteredLogs = results;
  }

  get countPresentToday(): number {
    return this.students.filter(s => s.status === 'Present').length;
  }

  get countAbsentToday(): number {
    return this.students.filter(s => s.status === 'Absent').length;
  }

  get todayRate(): number {
    const marked = this.countPresentToday + this.countAbsentToday;
    if (marked === 0) return 0;
    return Math.round((this.countPresentToday / marked) * 100);
  }

  // Student Getters
  get myLogs(): AttendanceRecord[] {
    const u = (this.userName || localStorage.getItem('userName') || 'student').toLowerCase();
    return this.allLogs.filter(l =>
      (l.student && l.student.toLowerCase() === u) ||
      (l.student && l.student.toLowerCase() === 'student') ||
      (l.student && l.student.toLowerCase() === 'krishnavamsi')
    );
  }

  get myPresentCount(): number {
    if (this.subjectSummaries.length === 0) {
      this.calculateSubjectSummaries();
    }
    return this.subjectSummaries.reduce((sum, s) => sum + s.attended, 0);
  }

  get myAbsentCount(): number {
    if (this.subjectSummaries.length === 0) {
      this.calculateSubjectSummaries();
    }
    return this.subjectSummaries.reduce((sum, s) => sum + s.absent, 0);
  }

  get myTotalLectures(): number {
    if (this.subjectSummaries.length === 0) {
      this.calculateSubjectSummaries();
    }
    return this.subjectSummaries.reduce((sum, s) => sum + s.totalClasses, 0);
  }

  get myOverallPercentage(): number {
    const total = this.myTotalLectures;
    if (total === 0) return 0;
    return Math.round((this.myPresentCount / total) * 100);
  }

  loadAppearance(): void {
    try {
      const stored = localStorage.getItem('oblmsAppearance');
      if (stored) {
        this.appearance = JSON.parse(stored);
      }
    } catch {}
    this.applyThemeStyleMapping();
  }

  private applyThemeStyleMapping(): void {
    const isDark = this.appearance.theme === 'dark' || 
      (this.appearance.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const bg = isDark ? '#0f172a' : 'rgba(240, 249, 255, 0.92)';
    const cardBg = isDark ? '#1e293b' : 'rgba(255, 255, 255, 0.98)';
    const text = isDark ? '#f8fafc' : '#1e293b';
    const textSecondary = isDark ? '#94a3b8' : '#64748b';
    const border = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(74, 140, 234, 0.16)';
    const sidebarBg = isDark ? '#1e293b' : 'rgba(255, 255, 255, 0.98)';

    let primary = '#1976d2';
    let primaryRgb = '25, 118, 210';
    let heroBg = 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)';

    switch (this.appearance.colorScheme) {
      case 'purple':
        primary = '#8b5cf6';
        primaryRgb = '139, 92, 246';
        heroBg = 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 50%, #7c3aed 100%)';
        break;
      case 'green':
        primary = '#10b981';
        primaryRgb = '16, 185, 129';
        heroBg = 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #10b981 100%)';
        break;
      case 'red':
        primary = '#ef4444';
        primaryRgb = '239, 68, 68';
        heroBg = 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #ef4444 100%)';
        break;
      case 'orange':
        primary = '#f97316';
        primaryRgb = '249, 115, 22';
        heroBg = 'linear-gradient(135deg, #7c2d12 0%, #9a3412 50%, #f97316 100%)';
        break;
      default:
        primary = '#1976d2';
        primaryRgb = '25, 118, 210';
        heroBg = 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)';
    }

    this.themeStyles = {
      '--student-primary': primary,
      '--student-primary-rgb': primaryRgb,
      '--student-hero-bg': heroBg,
      '--student-bg': bg,
      '--student-card-bg': cardBg,
      '--student-text': text,
      '--student-text-secondary': textSecondary,
      '--student-border': border,
      '--student-sidebar-bg': sidebarBg
    };
  }
}
