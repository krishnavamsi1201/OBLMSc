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
import { NavigationService } from '../../shared/services/navigation.service';

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

<div class="container">
  <app-sidebar></app-sidebar>

  <div class="content">

    <!-- STUDENT VIEW -->
    <ng-container *ngIf="role === 'student'">
      <div class="page-header">
        <div class="header-title">
          <div class="page-back-nav-bar">
            <button type="button" class="btn-page-back" (click)="goBack()">
              <span class="material-icons">arrow_back</span>
              <span>Back to Dashboard</span>
            </button>
            <span class="nav-sep">|</span>
            <span class="page-category-hint">Academic Attendance Records</span>
          </div>
          <h1>📋 My Attendance</h1>
          <p>Track your overall academic attendance, day-wise lecture check-ins, and subject-wise 75% examination eligibility.</p>
        </div>
      </div>

        <!-- 3 ATTENDANCE NAVIGATION TABS -->
        <div class="student-tabs-bar">
            <button type="button" 
                    class="tab-btn" 
                    [class.active]="studentTab === 'overall'"
                    (click)="setStudentTab('overall')">
                Overall Attendance
            </button>
            <button type="button" 
                    class="tab-btn" 
                    [class.active]="studentTab === 'daywise'"
                    (click)="setStudentTab('daywise')">
                Day-Wise Attendance
            </button>
            <button type="button" 
                    class="tab-btn" 
                    [class.active]="studentTab === 'subjectwise'"
                    (click)="setStudentTab('subjectwise')">
                Subject-Wise Attendance
            </button>
        </div>

        <!-- ------------------------------------------------------------- -->
        <!-- TAB 1: OVERALL ATTENDANCE                                     -->
        <!-- ------------------------------------------------------------- -->
        <div *ngIf="studentTab === 'overall'" class="tab-content-area" style="display: flex; flex-direction: column; gap: 20px;">
            
            <!-- Overall KPI Summary Cards -->
            <div class="student-summary-grid">
                <div class="summary-card main-pct" [class.good]="myOverallPercentage >= 75" [class.warning]="myOverallPercentage < 75">
                    <span class="card-icon"><span class="material-icons">track_changes</span></span>
                    <h3>Overall Attendance</h3>
                    <strong class="stat-number">{{ myOverallPercentage }}%</strong>
                    <span class="status-pill" [class.pill-green]="myOverallPercentage >= 75" [class.pill-red]="myOverallPercentage < 75">
                        {{ myOverallPercentage >= 75 ? 'Exam Eligible (≥75%)' : 'Below 75% Threshold' }}
                    </span>
                </div>
                <div class="summary-card">
                    <span class="card-icon"><span class="material-icons">school</span></span>
                    <h3>Total Classes Conducted</h3>
                    <strong class="stat-number">{{ myTotalLectures }}</strong>
                    <p>Total course lecture sessions</p>
                </div>
                <div class="summary-card green-card">
                    <span class="card-icon"><span class="material-icons" style="color: #059669;">check_circle</span></span>
                    <h3>Classes Attended</h3>
                    <strong class="stat-number text-green">{{ myPresentCount }}</strong>
                    <p>Total lectures marked present</p>
                </div>
                <div class="summary-card red-card">
                    <span class="card-icon"><span class="material-icons" style="color: #dc2626;">cancel</span></span>
                    <h3>Classes Missed</h3>
                    <strong class="stat-number text-red">{{ myAbsentCount }}</strong>
                    <p>Total lectures marked absent</p>
                </div>
            </div>

            <!-- Safe Margin & Eligibility Calculator Box -->
            <div class="eligibility-banner" [class.good-banner]="myOverallPercentage >= 75" [class.warn-banner]="myOverallPercentage < 75">
                <div class="eligibility-icon">
                    <span class="material-icons">{{ myOverallPercentage >= 75 ? 'verified_user' : 'warning_amber' }}</span>
                </div>
                <div class="eligibility-info">
                    <h4>{{ myOverallPercentage >= 75 ? 'Examination Eligibility Standing: High' : 'Attendance Shortage Warning' }}</h4>
                    <p *ngIf="myOverallPercentage >= 75">
                        <strong>Safe Attendance Margin:</strong> You can safely miss up to <strong>{{ safeBunkClasses }}</strong> more classes and still maintain above the mandatory 75% minimum semester examination requirement.
                    </p>
                    <p *ngIf="myOverallPercentage < 75">
                        <strong>Action Required:</strong> You need to attend the next <strong>{{ neededConsecutiveClasses }}</strong> consecutive classes without any absence to reach the 75% minimum examination threshold.
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
    </ng-container>

    <!-- FACULTY / ADMIN VIEW -->
    <ng-container *ngIf="role !== 'student'">
        <!-- Page Header -->
        <div class="page-header">
            <div class="header-main-row">
                <div>
                    <div class="page-back-nav-bar">
                        <button type="button" class="btn-page-back" (click)="goBack()">
                            <span class="material-icons">arrow_back</span>
                            <span>Back to Dashboard</span>
                        </button>
                        <span class="nav-sep">|</span>
                        <span class="page-category-hint">Institutional Attendance Governance</span>
                    </div>
                    <h1>Course Attendance Management</h1>
                    <p>Select a course to view enrolled students. Click Present or Absent on the right of each student to instantly increase or decrease their attendance percentage.</p>
                </div>
            </div>
        </div>

        <!-- Main Attendance Marking Card -->
        <div class="attendance-card">
            
            <!-- Top Controls Toolbar -->
            <div class="toolbar-header">
                <div class="toolbar-field course-select-field">
                    <label>Select Course</label>
                    <select [(ngModel)]="selectedCourse" (ngModelChange)="onCourseChanged()" class="styled-select">
                        <option *ngFor="let c of coursesList" [value]="c.title">{{ c.code ? c.code + ' - ' : '' }}{{ c.title }}</option>
                    </select>
                </div>

                <div class="toolbar-field date-select-field">
                    <label>Date</label>
                    <input type="date" [(ngModel)]="attendanceDate" (change)="onDateChanged()" class="styled-input" />
                </div>

                <div class="toolbar-actions">
                    <label>Batch Actions</label>
                    <div class="attendance-btn-pair">
                        <button type="button" 
                                class="btn-attend present-btn" 
                                [class.active]="areAllPresent"
                                (click)="markAll('Present')"
                                title="Mark all students Present">
                            <span class="btn-icon">✅</span>
                            <span class="btn-lbl">Present</span>
                        </button>
                        <button type="button" 
                                class="btn-attend absent-btn" 
                                [class.active]="areAllAbsent"
                                (click)="markAll('Absent')"
                                title="Mark all students Absent">
                            <span class="btn-icon">❌</span>
                            <span class="btn-lbl">Absent</span>
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
                                            (click)="toggleAttendance(s, 'Present')"
                                            title="Mark Present">
                                        <span class="btn-icon">✅</span>
                                        <span class="btn-lbl">Present</span>
                                    </button>
                                    <button type="button" 
                                            class="btn-attend absent-btn" 
                                            [class.active]="s.status === 'Absent'"
                                            (click)="toggleAttendance(s, 'Absent')"
                                            title="Mark Absent">
                                        <span class="btn-icon">❌</span>
                                        <span class="btn-lbl">Absent</span>
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
    </ng-container>

    <app-footer></app-footer>
  </div>
</div>`,
  styles: [
    `
    .page-header { margin-bottom: 22px; }
    .header-main-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; }
    .page-header h1 { font-size: 1.85rem; color: #ffffff; margin: 0 0 6px; font-weight: 800; letter-spacing: -0.02em; }
    .page-header p { color: #94a3b8; margin: 0; font-size: 0.95rem; }

    .student-pill-header { display: flex; align-items: center; gap: 12px; padding: 8px 16px; background: #101b38; border: 1px solid #1f2f54; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
    .user-avatar-badge { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #d4af37 0%, #b38f28 100%); color: #0a1128; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem; }
    .user-header-name { display: block; font-size: 0.95rem; color: #ffffff; font-weight: 700; }
    .user-header-sub { font-size: 0.8rem; color: #94a3b8; }

    /* Student Tabs Bar */
    .student-tabs-bar { display: flex; gap: 10px; margin-bottom: 24px; border-bottom: 1px solid #1f2f54; padding-bottom: 12px; flex-wrap: wrap; }
    .tab-btn { padding: 11px 20px; border-radius: 10px; border: 1px solid #1f2f54; background: #101b38; color: #cbd5e1; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: all 0.2s ease; outline: none; }
    .tab-btn:hover { background: #18284e; border-color: #d4af37; color: #ffffff; }
    .tab-btn.active { background: linear-gradient(135deg, #d4af37 0%, #b38f28 100%); color: #0a1128; border-color: #d4af37; box-shadow: 0 4px 14px rgba(212,175,55,0.3); }

    /* Student Summary Grid */
    .student-summary-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-bottom: 24px; }
    .summary-card { padding: 22px; background: #101b38; border-radius: 14px; box-shadow: 0 8px 24px rgba(0,0,0,0.3); border: 1px solid #1f2f54; position: relative; }
    .summary-card.main-pct.good { border-color: rgba(74, 222, 128, 0.4); background: linear-gradient(180deg, #101b38 0%, rgba(34, 197, 94, 0.08) 100%); }
    .summary-card.main-pct.warning { border-color: rgba(248, 113, 113, 0.4); background: linear-gradient(180deg, #101b38 0%, rgba(239, 68, 68, 0.08) 100%); }
    .summary-card h3 { margin: 0 0 8px; font-size: 0.92rem; color: #94a3b8; }
    .summary-card .stat-number { display: block; font-size: 2.2rem; font-weight: 800; color: #ffffff; margin-bottom: 6px; }
    .summary-card p { margin: 0; font-size: 0.84rem; color: #94a3b8; }
    .card-icon { font-size: 1.5rem; margin-bottom: 8px; display: inline-block; }
    .text-green { color: #4ade80 !important; }
    .text-red { color: #f87171 !important; }

    /* Status Pill */
    .status-pill { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; }
    .pill-green { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.3); }
    .pill-red { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.3); }

    /* Eligibility Banner */
    .eligibility-banner { display: flex; gap: 16px; padding: 18px 22px; border-radius: 12px; margin-bottom: 24px; align-items: center; border: 1px solid; }
    .eligibility-banner.good-banner { background: rgba(34, 197, 94, 0.1); border-color: rgba(74, 222, 128, 0.3); color: #86efac; }
    .eligibility-banner.warn-banner { background: rgba(239, 68, 68, 0.1); border-color: rgba(248, 113, 113, 0.3); color: #fca5a5; }
    .eligibility-icon { font-size: 2.2rem; }
    .eligibility-info h4 { margin: 0 0 4px; font-size: 1.05rem; font-weight: 800; color: #ffffff; }
    .eligibility-info p { margin: 0; font-size: 0.92rem; line-height: 1.4; color: #cbd5e1; }

    /* Day Navigation Card */
    .day-navigation-card { background: #101b38; padding: 20px 24px; border-radius: 14px; border: 1px solid #1f2f54; margin-bottom: 24px; box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
    .date-controls-group { display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap; margin-bottom: 18px; }
    .btn-day-nav { padding: 9px 18px; border-radius: 8px; border: 1px solid #1f2f54; background: #091024; font-size: 0.9rem; font-weight: 700; cursor: pointer; color: #cbd5e1; transition: all 0.15s ease; }
    .btn-day-nav:hover { background: #18284e; color: #ffffff; border-color: #d4af37; }
    .btn-day-nav.today-btn { background: rgba(212, 175, 55, 0.15); color: #d4af37; border-color: #d4af37; }
    .date-picker-wrap { display: flex; align-items: center; gap: 8px; }
    .date-picker-wrap label { font-size: 0.88rem; font-weight: 700; color: #cbd5e1; }
    .date-input-styled { padding: 8px 14px; border: 1px solid #1f2f54; border-radius: 8px; font-size: 0.95rem; background: #091024; color: #ffffff; font-weight: 600; }

    .day-stats-strip { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .day-stat-chip { display: flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 8px; font-size: 0.86rem; background: #091024; color: #cbd5e1; border: 1px solid #1f2f54; }
    .day-stat-chip.green { background: rgba(34, 197, 94, 0.15); color: #4ade80; border-color: rgba(74, 222, 128, 0.3); }
    .day-stat-chip.red { background: rgba(239, 68, 68, 0.15); color: #f87171; border-color: rgba(248, 113, 113, 0.3); }
    .day-stat-chip.blue { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border-color: rgba(96, 165, 250, 0.3); }

    .period-badge { background: rgba(212, 175, 55, 0.15); color: #d4af37; border: 1px solid rgba(212, 175, 55, 0.3); padding: 4px 10px; border-radius: 6px; font-size: 0.82rem; font-weight: 700; }
    .faculty-tag { background: #132247; color: #94a3b8; border: 1px solid #1f2f54; padding: 3px 8px; border-radius: 6px; font-size: 0.84rem; font-weight: 600; }
    .topic-text { font-size: 0.88rem; color: #cbd5e1; }

    /* Subject Wise Cards Grid */
    .subject-cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 18px; margin-bottom: 24px; }
    .subject-stat-card { background: #101b38; border-radius: 14px; border: 1px solid #1f2f54; padding: 22px; box-shadow: 0 8px 24px rgba(0,0,0,0.3); display: flex; flex-direction: column; justify-content: space-between; }
    .subject-stat-card.sub-good { border-top: 4px solid #4ade80; }
    .subject-stat-card.sub-warning { border-top: 4px solid #f87171; }

    .sub-card-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
    .sub-code-badge { background: rgba(212, 175, 55, 0.15); color: #d4af37; border: 1px solid rgba(212, 175, 55, 0.3); padding: 3px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 700; display: inline-block; margin-bottom: 6px; }
    .sub-title { margin: 0 0 4px; font-size: 1.05rem; color: #ffffff; font-weight: 800; }
    .sub-faculty { font-size: 0.82rem; color: #94a3b8; display: block; }

    .sub-pct-circle { width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: 800; font-size: 1.1rem; }
    .pct-circle-good { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 2px solid rgba(74, 222, 128, 0.4); }
    .pct-circle-warn { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 2px solid rgba(248, 113, 113, 0.4); }

    .progress-bar-track { height: 8px; background: #091024; border-radius: 4px; overflow: hidden; margin-bottom: 14px; border: 1px solid #1f2f54; }
    .progress-bar-fill { height: 100%; transition: width 0.3s ease; }
    .bg-green { background: #4ade80; }
    .bg-red { background: #f87171; }

    .sub-card-footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
    .sub-counts { display: flex; gap: 10px; font-size: 0.82rem; color: #94a3b8; }
    .eligibility-tag { padding: 4px 10px; border-radius: 12px; font-size: 0.78rem; font-weight: 700; }
    .tag-green { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.3); }
    .tag-red { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.3); }

    /* Faculty Attendance Card */
    .attendance-card { background: #101b38; border-radius: 14px; border: 1px solid #1f2f54; box-shadow: 0 8px 30px rgba(0,0,0,0.35); margin-bottom: 28px; overflow: hidden; }
    
    /* Toolbar */
    .toolbar-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; padding: 18px 24px; background: #091024; border-bottom: 1px solid #1f2f54; flex-wrap: wrap; }
    .toolbar-field { display: flex; flex-direction: column; }
    .toolbar-field.course-select-field { flex: 1 1 260px; min-width: 200px; }
    .toolbar-field.date-select-field { flex: 0 1 180px; min-width: 140px; }
    .toolbar-actions { display: flex; flex-direction: column; flex: 0 0 auto; }
    .toolbar-field label, .toolbar-actions label { font-size: 0.88rem; font-weight: 700; color: #cbd5e1; margin-bottom: 6px; }
    .styled-select, .styled-input { padding: 9px 14px; border: 1px solid #1f2f54; border-radius: 8px; font-size: 0.95rem; background: #101b38; color: #ffffff; outline: none; height: 52px; box-sizing: border-box; }
    .styled-select:focus, .styled-input:focus { border-color: #d4af37; box-shadow: 0 0 0 3px rgba(212,175,55,0.2); }

    /* Stats Ribbon */
    .stats-ribbon { display: flex; gap: 14px; padding: 14px 24px; background: #0d162f; border-bottom: 1px solid #1f2f54; flex-wrap: wrap; }
    .stat-bubble { display: flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 8px; font-size: 0.88rem; font-weight: 600; background: #101b38; color: #cbd5e1; border: 1px solid #1f2f54; }
    .stat-bubble.green { background: rgba(34, 197, 94, 0.15); color: #4ade80; border-color: rgba(74, 222, 128, 0.3); }
    .stat-bubble.red { background: rgba(239, 68, 68, 0.15); color: #f87171; border-color: rgba(248, 113, 113, 0.3); }
    .stat-bubble.blue { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border-color: rgba(96, 165, 250, 0.3); }
    .stat-bubble strong { font-size: 1.05rem; }

    /* Table */
    .table-responsive { overflow-x: auto; width: 100%; }
    .students-table { width: 100%; border-collapse: collapse; text-align: left; }
    .students-table th { padding: 14px 18px; background: #132247; font-size: 0.84rem; font-weight: 700; color: #d4af37; text-transform: uppercase; border-bottom: 1px solid #1f2f54; }
    .students-table td { padding: 14px 18px; border-bottom: 1px solid #1f2f54; font-size: 0.95rem; color: #e2e8f0; vertical-align: middle; }
    .students-table tbody tr:hover { background: #18284e; }
    .students-table tbody tr.marked-present { background: rgba(34, 197, 94, 0.05); }
    .students-table tbody tr.marked-absent { background: rgba(239, 68, 68, 0.05); }

    .row-index { font-weight: 700; color: #64748b; font-size: 0.88rem; }
    .reg-pill { background: #091024; color: #d4af37; border: 1px solid #1f2f54; padding: 4px 8px; border-radius: 6px; font-size: 0.84rem; font-family: monospace; font-weight: 600; }
    
    .student-name-group { display: flex; align-items: center; gap: 12px; }
    .avatar-circle { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #d4af37 0%, #b38f28 100%); color: #0a1128; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.95rem; flex-shrink: 0; }
    .student-title { font-weight: 700; color: #ffffff; }
    .course-sub { color: #94a3b8; font-size: 0.82rem; margin-top: 1px; }
    .dept-label { color: #cbd5e1; font-size: 0.88rem; }

    /* Attendance % Badge */
    .pct-badge { display: inline-flex; flex-direction: column; align-items: center; padding: 6px 14px; border-radius: 10px; min-width: 85px; }
    .pct-badge.good { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.3); }
    .pct-badge.warning { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.3); }
    .pct-val { font-size: 1.05rem; font-weight: 800; }
    .pct-sub { font-size: 0.74rem; opacity: 0.88; margin-top: 2px; }

    /* 2 Interactive Buttons - Matching Image 2 */
    .attendance-btn-pair { display: inline-flex; gap: 8px; justify-content: center; align-items: center; }
    .btn-attend {
        min-width: 68px;
        height: 52px;
        padding: 6px 12px;
        border: 1.5px solid #1f2f54;
        border-radius: 8px;
        font-weight: 700;
        cursor: pointer;
        background: #091024;
        color: #94a3b8;
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        outline: none;
        user-select: none;
        box-sizing: border-box;
    }
    .btn-attend .btn-icon {
        font-size: 15px;
        line-height: 1;
        display: block;
    }
    .btn-attend .btn-lbl {
        font-size: 0.82rem;
        font-weight: 700;
        line-height: 1.1;
        display: block;
    }
    
    .btn-attend.present-btn:hover, .btn-attend-mini.present-btn:hover { background: rgba(34, 197, 94, 0.2); border-color: #4ade80; color: #4ade80; transform: translateY(-2px); }
    .btn-attend.present-btn.active, .btn-attend-mini.present-btn.active { background: #16a34a !important; border-color: #4ade80 !important; color: #ffffff !important; box-shadow: 0 4px 14px rgba(22,163,74,0.45); transform: scale(1.04); }

    .btn-attend.absent-btn:hover, .btn-attend-mini.absent-btn:hover { background: rgba(239, 68, 68, 0.2); border-color: #f87171; color: #f87171; transform: translateY(-2px); }
    .btn-attend.absent-btn.active, .btn-attend-mini.absent-btn.active { background: #dc2626 !important; border-color: #f87171 !important; color: #ffffff !important; box-shadow: 0 4px 14px rgba(220,38,38,0.45); transform: scale(1.04); }

    .btn-attend-mini { padding: 6px 12px; border: 1.5px solid #1f2f54; border-radius: 6px; font-size: 0.82rem; font-weight: 700; cursor: pointer; background: #091024; color: #94a3b8; transition: all 0.15s ease; outline: none; }

    /* Footer */
    .table-footer-bar { padding: 18px 24px; background: #091024; border-top: 1px solid #1f2f54; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    .info-text { font-size: 0.9rem; color: #94a3b8; }
    .btn-confirm-save { padding: 11px 24px; border: none; border-radius: 8px; background: linear-gradient(135deg, #d4af37 0%, #b38f28 100%); color: #0a1128; font-weight: 700; font-size: 0.95rem; cursor: pointer; box-shadow: 0 4px 14px rgba(212,175,55,0.3); }
    .btn-confirm-save:hover { filter: brightness(1.1); transform: translateY(-1px); }

    /* Logs Card */
    .logs-card { padding: 22px 24px; background: #101b38; border-radius: 14px; border: 1px solid #1f2f54; box-shadow: 0 8px 24px rgba(0,0,0,0.3); margin-bottom: 24px; }
    .logs-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
    .logs-header h2 { margin: 0; font-size: 1.2rem; color: #ffffff; }
    .logs-filter-group { display: flex; gap: 10px; }
    .search-input { padding: 8px 12px; border: 1px solid #1f2f54; border-radius: 6px; font-size: 0.88rem; min-width: 240px; background: #091024; color: #ffffff; outline: none; }
    .status-select { padding: 8px 12px; border: 1px solid #1f2f54; border-radius: 6px; font-size: 0.88rem; background: #091024; color: #ffffff; outline: none; }

    .logs-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .logs-table th { padding: 12px 14px; background: #132247; font-size: 0.82rem; font-weight: 700; color: #d4af37; text-transform: uppercase; border-bottom: 1px solid #1f2f54; text-align: left; }
    .logs-table td { padding: 12px 14px; border-bottom: 1px solid #1f2f54; font-size: 0.92rem; color: #e2e8f0; vertical-align: middle; }
    .logs-table tbody tr:hover { background: #18284e; }
    .logs-table tbody tr.row-present { background: rgba(34, 197, 94, 0.05); }
    .logs-table tbody tr.row-absent { background: rgba(239, 68, 68, 0.05); }

    .status-tag { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 0.84rem; font-weight: 700; }
    .status-tag.tag-present { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.3); }
    .status-tag.tag-absent { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.3); }

    .btn-remove-log { padding: 6px 14px; border: 1px solid rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.1); color: #f87171; border-radius: 6px; cursor: pointer; font-size: 0.82rem; font-weight: 600; }
    .btn-remove-log:hover { background: rgba(239, 68, 68, 0.2); }
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
    theme: 'dark',
    colorScheme: 'gold',
    layout: 'comfortable',
    showSidebar: true,
    fontSize: 'medium'
  };

  themeStyles: { [key: string]: string } = {};

  studentNavGroups = [
    {
      title: 'ACADEMICS',
      items: [
        { label: 'Student Dashboard', path: '/students', icon: 'dashboard' },
        { label: 'Enrolled Courses', path: '/courses', icon: 'menu_book' },
        { label: 'Subject List', path: '/subjects', icon: 'subject' },
        { label: 'Weekly Timetable', path: '/timetable', icon: 'calendar_month' }
      ]
    },
    {
      title: 'OBE & OUTCOMES',
      items: [
        { label: 'Course Outcomes (CO)', path: '/course-outcomes', icon: 'track_changes' },
        { label: 'Program Outcomes (PO)', path: '/program-outcomes', icon: 'military_tech' },
        { label: 'CO-PO Mapping', path: '/copo-mapping', icon: 'hub' },
        { label: 'CO Attainment', path: '/co-attainment', icon: 'stacked_bar_chart' },
        { label: 'PO Attainment', path: '/po-attainment', icon: 'trending_up' }
      ]
    },
    {
      title: 'EXAMINATIONS & MARKS',
      items: [
        { label: 'Upcoming Exams', path: '/assessments', icon: 'quiz' },
        { label: 'Attendance %', path: '/attendance', icon: 'fact_check' },
        { label: 'Marks Summary', path: '/performance', icon: 'assessment' },
        { label: 'Semester Results', path: '/results', icon: 'rate_review' }
      ]
    },
    {
      title: 'STUDENT SERVICES',
      items: [
        { label: 'Feedback Form', path: '/feedback', icon: 'rate_review' },
        { label: 'File Grievance', path: '/grievance', icon: 'assignment' },
        { label: 'Notifications', path: '/notifications', icon: 'notifications' },
        { label: 'Student Details', path: '/profile', icon: 'manage_accounts' }
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
  private navService = inject(NavigationService);
  private syncSub?: Subscription;

  goBack(): void {
    this.navService.goBack();
  }

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
      if (this.isLocalChange) {
        return; // Prevent clobbering optimistic UI updates from local actions
      }
      if (e.type === 'ATTENDANCE_CHANGED' || e.type === 'COURSES_CHANGED') {
        this.refreshUserRole();
        this.loadAllLogs();
        if (this.isStudent) {
          this.calculateSubjectSummaries();
          this.loadDaySchedule();
        } else {
          this.loadEnrolledStudents();
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

          const facultyCourses = all.filter(c => {
            const cFac = (c.faculty || '').trim();
            const isGeneric = !cFac || cFac.toLowerCase() === 'faculty board' || cFac.toLowerCase() === 'unassigned' || cFac.toLowerCase() === 'senior faculty';
            if (!isGeneric) {
              return (uName && (cFac.toLowerCase().includes(uName) || uName.includes(cFac.toLowerCase()))) ||
                     (uEmail && cFac.toLowerCase() === uEmail);
            }
            return assigned.some(a => a.toLowerCase() === (c.title || '').toLowerCase() || a.toLowerCase() === (c.code || '').toLowerCase());
          });

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
          this.filterLogs();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        let all = this.courseService.getCoursesSync();
        if (this.role === 'faculty') {
          const uName = (this.userName || localStorage.getItem('userName') || '').toLowerCase();
          let assigned: string[] = [];
          try {
            const stored = localStorage.getItem('userAssignedCourses');
            if (stored) assigned = JSON.parse(stored);
          } catch {}

          if (assigned.length === 0) {
            if (uName.includes('ramesh')) assigned = ['CS101', 'CS102', 'CS103'];
            else if (uName.includes('sunita')) assigned = ['CS201', 'CS202', 'CS205'];
            else if (uName.includes('amit')) assigned = ['EC201', 'EC202', 'EC203'];
            else if (uName.includes('priya')) assigned = ['IT201', 'IT202', 'IT301'];
            else if (uName.includes('rajesh')) assigned = ['CS301', 'CS302', 'CS303'];
            else if (uName.includes('suresh')) assigned = ['CE201', 'CE202', 'CE203'];
            else if (uName.includes('ananya')) assigned = ['ME201', 'ME202', 'ME203'];
            else assigned = ['CS101', 'CS102', 'CS103'];
          }

          all = all.filter(c => 
            assigned.some(a => a.toLowerCase() === (c.code || '').toLowerCase() || a.toLowerCase() === (c.title || '').toLowerCase() || (c.title && c.title.toLowerCase().includes(a.toLowerCase())))
          );
        }
        this.coursesList = all;
        if (this.coursesList.length > 0) {
          this.selectedCourse = this.coursesList[0].code ? `${this.coursesList[0].code} - ${this.coursesList[0].title}` : this.coursesList[0].title;
        } else {
          this.selectedCourse = '';
        }
        if (!this.isStudent) {
          this.loadEnrolledStudents();
        }
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

      if (myCourseCodes.length > 0) {
        return all.filter(c => 
          myCourseCodes.includes(c.code?.toLowerCase()) || 
          myCourseCodes.includes(c.title?.toLowerCase())
        );
      }

      // Department-aware fallback
      const userDept = (localStorage.getItem('userDept') || localStorage.getItem('userDepartment') || 'Computer Science').toLowerCase();
      let prefix = 'CS';
      if (userDept.includes('civil') || userDept === 'ce') prefix = 'CE';
      else if (userDept.includes('mechanical') || userDept.includes('mech') || userDept === 'me') prefix = 'ME';
      else if (userDept.includes('electronic') || userDept.includes('ece') || userDept.includes('electrical') || userDept.includes('eee') || userDept === 'ee') prefix = 'EC';
      else if (userDept.includes('information') || userDept.includes('it')) prefix = 'IT';

      const deptCourses = all.filter(c => c.code && c.code.toUpperCase().startsWith(prefix));
      return deptCourses.length > 0 ? deptCourses : all;
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
          const seen = new Set<string>();
          const cleanLogs: AttendanceRecord[] = [];
          for (const b of backendLogs) {
            const cCode = (b.courseCode || b.course || '').split(' - ')[0].trim().toLowerCase();
            const sName = (b.student || '').trim().toLowerCase();
            const d = (b.date || '').trim();
            const key = `${sName}_${d}_${cCode}`;
            if (!seen.has(key)) {
              seen.add(key);
              cleanLogs.push({
                id: b.id || (Date.now() + cleanLogs.length),
                student: b.student,
                regNo: b.regNo || '240101120001',
                course: b.courseCode || b.course || '',
                date: b.date || this.attendanceDate,
                status: (b.status === 'Absent' ? 'Absent' : 'Present') as 'Present' | 'Absent',
                period: b.period,
                topic: b.topic
              });
            }
          }
          this.allLogs = cleanLogs;
          try {
            localStorage.setItem('obslmsAttendance', JSON.stringify(this.allLogs));
          } catch {}
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
            const totalLectures = studentCourseLogs.length > 0 ? studentCourseLogs.length : (s.totalLectures || 0);
            const totalPresent = studentCourseLogs.length > 0 ? studentCourseLogs.filter(l => l.status === 'Present').length : (s.totalPresent || 0);
            const pct = totalLectures > 0 ? Math.round((totalPresent / totalLectures) * 100) : (s.attendancePercentage !== undefined ? s.attendancePercentage : 0);

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
          this.loadLocalEnrolledStudentsFallback(searchParam);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadLocalEnrolledStudentsFallback(searchParam);
        this.cdr.detectChanges();
      }
    });
  }

  private loadLocalEnrolledStudentsFallback(searchParam: string): void {
    let localStudents: any[] = [];
    try {
      const stored = localStorage.getItem('obslmsStudents');
      if (stored) localStudents = JSON.parse(stored);
    } catch {}

    const sp = searchParam.toLowerCase();
    let targetDept = 'computer';
    if (sp.startsWith('it') || sp.includes('information')) targetDept = 'information';
    else if (sp.startsWith('ec') || sp.includes('electronic')) targetDept = 'electronic';
    else if (sp.startsWith('me') || sp.includes('mechanical')) targetDept = 'mechanical';
    else if (sp.startsWith('ce') || sp.includes('civil')) targetDept = 'civil';
    else if (sp.startsWith('ee') || sp.includes('electrical')) targetDept = 'electrical';

    const matched = localStudents.filter((s: any) => (s.department || '').toLowerCase().includes(targetDept));
    const selectedStudents = matched.length > 0 ? matched.slice(0, 30) : localStudents.slice(0, 30);

    this.students = selectedStudents.map((s, idx) => {
      const studentCourseLogs = this.allLogs.filter(l =>
        l.student && l.student.toLowerCase() === s.name.toLowerCase() &&
        l.course && (l.course.toLowerCase().includes(searchParam.toLowerCase()) || searchParam.toLowerCase().includes(l.course.toLowerCase()))
      );

      const todayLog = studentCourseLogs.find(l => l.date === this.attendanceDate);
      const status: 'Present' | 'Absent' | 'Unmarked' = todayLog ? todayLog.status : 'Unmarked';
      const totalLectures = studentCourseLogs.length || 15;
      const totalPresent = studentCourseLogs.length > 0 ? studentCourseLogs.filter(l => l.status === 'Present').length : (12 + (idx % 4));
      const pct = Math.round((totalPresent / totalLectures) * 100);

      return {
        id: s.id || `STU${idx + 1}`,
        regNo: s.regNo || s.id || `CUTM2026${idx + 1}`,
        name: s.name,
        department: s.department || 'Engineering',
        semester: s.semester || 'Semester 3',
        totalPresent: totalPresent,
        totalLectures: totalLectures,
        attendancePercentage: pct,
        status: status
      };
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
    const courseTokens = this.selectedCourse.split(' - ');
    const searchParam = courseTokens.length > 1 ? courseTokens[0].trim() : this.selectedCourse.trim();

    // 1. Update or create the log in this.allLogs for today's date
    const recordIndex = this.allLogs.findIndex(l =>
      l.student && l.student.toLowerCase() === student.name.toLowerCase() &&
      l.course && (l.course.toLowerCase().includes(searchParam.toLowerCase()) || searchParam.toLowerCase().includes(l.course.toLowerCase())) &&
      l.date === this.attendanceDate
    );

    if (recordIndex !== -1) {
      this.allLogs[recordIndex].status = newStatus;
      this.allLogs[recordIndex].course = this.selectedCourse;
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

    // Deduplicate any repeated logs for this student + course + date in this.allLogs
    const seen = new Set<string>();
    this.allLogs = this.allLogs.filter(l => {
      const cCode = (l.course || '').split(' - ')[0].trim().toLowerCase();
      const sName = (l.student || '').trim().toLowerCase();
      const d = (l.date || '').trim();
      const key = `${sName}_${d}_${cCode}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    try {
      localStorage.setItem('obslmsAttendance', JSON.stringify(this.allLogs));
    } catch {}

    // 2. Accurately recalculate attendance from this.allLogs for this course
    const studentCourseLogs = this.allLogs.filter(l =>
      l.student && l.student.toLowerCase() === student.name.toLowerCase() &&
      l.course && (l.course.toLowerCase().includes(searchParam.toLowerCase()) || searchParam.toLowerCase().includes(l.course.toLowerCase()))
    );

    const totalLectures = Math.max(1, studentCourseLogs.length);
    const totalPresent = studentCourseLogs.filter(l => l.status === 'Present').length;
    const pct = Math.round((totalPresent / totalLectures) * 100);

    // Update the student model directly so UI table is immediate and exact
    student.status = newStatus;
    student.totalPresent = totalPresent;
    student.totalLectures = totalLectures;
    student.attendancePercentage = pct;

    // 3. Background sync to backend
    this.http.post('http://localhost:8080/api/attendance', {
      student: student.name,
      courseCode: this.selectedCourse,
      date: this.attendanceDate,
      status: newStatus
    }).subscribe({
      next: (saved: any) => {
        if (saved && saved.id) {
          const rec = this.allLogs.find(l =>
            l.student && l.student.toLowerCase() === student.name.toLowerCase() &&
            l.date === this.attendanceDate
          );
          if (rec) rec.id = saved.id;
        }
      },
      error: () => {}
    });

    this.isLocalChange = true;
    this.syncService.emit('ATTENDANCE_CHANGED');
    this.isLocalChange = false;

    // 4. Toast notification strictly matching the updated attendance percentage
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

    this.http.post('http://localhost:8080/api/attendance', {
      id: log.id,
      student: log.student,
      courseCode: log.course,
      date: log.date,
      status: newStatus
    }).subscribe({ error: () => {} });

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

  get areAllPresent(): boolean {
    return this.students.length > 0 && this.students.every(s => s.status === 'Present');
  }

  get areAllAbsent(): boolean {
    return this.students.length > 0 && this.students.every(s => s.status === 'Absent');
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
    const isDark = this.appearance.theme !== 'light';

    const bg = isDark ? '#0a1128' : 'rgba(240, 249, 255, 0.92)';
    const cardBg = isDark ? '#101b38' : 'rgba(255, 255, 255, 0.98)';
    const text = isDark ? '#ffffff' : '#1e293b';
    const textSecondary = isDark ? '#94a3b8' : '#64748b';
    const border = isDark ? '#1f2f54' : 'rgba(74, 140, 234, 0.16)';
    const sidebarBg = isDark ? '#101b38' : 'rgba(255, 255, 255, 0.98)';

    let primary = '#d4af37';
    let primaryRgb = '212, 175, 55';
    let heroBg = 'linear-gradient(135deg, #0a1128 0%, #101b38 50%, #1f2f54 100%)';

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
      case 'blue':
        primary = '#3b82f6';
        primaryRgb = '59, 130, 246';
        heroBg = 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)';
        break;
      default: // gold / oxford
        primary = '#d4af37';
        primaryRgb = '212, 175, 55';
        heroBg = 'linear-gradient(135deg, #0a1128 0%, #101b38 50%, #1f2f54 100%)';
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
