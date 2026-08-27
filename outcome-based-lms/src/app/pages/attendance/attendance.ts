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

interface AttendanceRecord {
  id: number;
  student: string;
  regNo?: string;
  course: string;
  date: string;
  status: 'Present' | 'Absent';
}

interface StudentRosterItem {
  id: string;
  name: string;
  regNo: string;
  department: string;
  semester: string;
  pastAttendancePercentage: number;
  status: 'Present' | 'Absent';
}

const DEFAULT_STUDENT_ROSTER: Omit<StudentRosterItem, 'pastAttendancePercentage' | 'status'>[] = [
  { id: '240101120001', name: 'Aditya Sharma', regNo: '240101120001', department: 'Computer Science', semester: 'Semester 3' },
  { id: '240101120002', name: 'Ananya Deshmukh', regNo: '240101120002', department: 'Computer Science', semester: 'Semester 3' },
  { id: '240101120003', name: 'Kavita Iyer', regNo: '240101120003', department: 'Computer Science', semester: 'Semester 3' },
  { id: '240101120004', name: 'Manish Chawla', regNo: '240101120004', department: 'Computer Science', semester: 'Semester 3' },
  { id: '240101120005', name: 'Pooja Reddy', regNo: '240101120005', department: 'Computer Science', semester: 'Semester 3' },
  { id: '240101120006', name: 'Priyanka Sen', regNo: '240101120006', department: 'Computer Science', semester: 'Semester 3' },
  { id: '240101120007', name: 'Rahul Verma', regNo: '240101120007', department: 'Computer Science', semester: 'Semester 3' },
  { id: '240101120008', name: 'Rohan Joshi', regNo: '240101120008', department: 'Computer Science', semester: 'Semester 3' },
  { id: '240101120009', name: 'Sneha Rao', regNo: '240101120009', department: 'Computer Science', semester: 'Semester 3' },
  { id: '240101120010', name: 'Tanmay Kulkarni', regNo: '240101120010', department: 'Computer Science', semester: 'Semester 3' },
  { id: '240101120011', name: 'Vikas Gupta', regNo: '240101120011', department: 'Computer Science', semester: 'Semester 3' }
];

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  template: `<app-navbar></app-navbar>

<div class="container">
    <app-sidebar></app-sidebar>
    <div class="content">
        <div class="page-header">
            <h1>📅 {{ role === 'student' ? 'My Attendance Record' : 'Course Attendance Roster' }}</h1>
            <p>{{ role === 'student' ? 'View your class attendance percentage, lecture history, and OBE 75% eligibility standing.' : 'Select a course and date to mark attendance for all enrolled students using Present / Absent buttons.' }}</p>
        </div>

        <!-- Student Personal Summary Cards (Student Role Only) -->
        <div class="summary-grid" *ngIf="role === 'student'">
            <div class="section-card">
                <h3>Attendance Percentage</h3>
                <strong [style.color]="attendancePercentage >= 75 ? '#10b981' : '#ef4444'">{{ attendancePercentage }}%</strong>
                <p>{{ attendancePercentage >= 75 ? 'Eligible for end-semester exams' : '⚠️ Below 75% threshold' }}</p>
            </div>
            <div class="section-card">
                <h3>Present Lectures</h3>
                <strong style="color: #10b981;">{{ totalPresent }}</strong>
                <p>Total lectures attended.</p>
            </div>
            <div class="section-card">
                <h3>Absent Lectures</h3>
                <strong style="color: #ef4444;">{{ totalAbsent }}</strong>
                <p>Total lectures missed.</p>
            </div>
            <div class="section-card">
                <h3>Current Cycle</h3>
                <strong>{{ monthlyReportDate }}</strong>
                <p>Monthly attendance cycle.</p>
            </div>
        </div>

        <!-- ================================================================= -->
        <!-- FACULTY / ADMIN INTERACTIVE COURSE ATTENDANCE SHEET               -->
        <!-- ================================================================= -->
        <div class="roster-card" *ngIf="role === 'admin' || role === 'faculty'">
            <div class="roster-header">
                <div class="roster-title-area">
                    <h2>📋 Daily Class Attendance Sheet</h2>
                    <span class="active-badge">{{ selectedCourseTitle }}</span>
                </div>

                <div class="roster-controls-grid">
                    <div class="control-group">
                        <label>Select Course</label>
                        <select [(ngModel)]="selectedCourseName" (ngModelChange)="onCourseChange()">
                            <option *ngFor="let c of coursesList" [value]="c.title">{{ c.code ? c.code + ' - ' : '' }}{{ c.title }}</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <label>Attendance Date</label>
                        <input type="date" [(ngModel)]="attendanceDate" (change)="onDateChange()" />
                    </div>
                    <div class="control-group batch-actions">
                        <label>Quick Actions</label>
                        <div class="btn-group">
                            <button type="button" class="btn-batch present" (click)="setAllStatus('Present')">✅ Mark All Present</button>
                            <button type="button" class="btn-batch absent" (click)="setAllStatus('Absent')">❌ Mark All Absent</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Attendance Stats Bar -->
            <div class="roster-stats-bar">
                <div class="stat-pill total">
                    <span>Enrolled Students:</span>
                    <strong>{{ studentRoster.length }}</strong>
                </div>
                <div class="stat-pill present">
                    <span>Present:</span>
                    <strong>{{ presentCount }}</strong>
                </div>
                <div class="stat-pill absent">
                    <span>Absent:</span>
                    <strong>{{ absentCount }}</strong>
                </div>
                <div class="stat-pill rate">
                    <span>Session Attendance:</span>
                    <strong>{{ sessionRate }}%</strong>
                </div>
            </div>

            <!-- Interactive Student Attendance Table -->
            <div class="roster-table-wrapper">
                <table class="roster-table">
                    <thead>
                        <tr>
                            <th style="width: 60px;">#</th>
                            <th style="width: 140px;">Reg No</th>
                            <th>Student Name</th>
                            <th>Department & Sem</th>
                            <th style="width: 140px;">Past Attainment</th>
                            <th style="width: 240px; text-align: center;">Today's Attendance Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let student of studentRoster; let i = index" [class.row-absent]="student.status === 'Absent'">
                            <td><span class="row-num">{{ i + 1 }}</span></td>
                            <td><span class="reg-badge">{{ student.regNo }}</span></td>
                            <td>
                                <div class="student-info">
                                    <span class="avatar">{{ student.name.charAt(0) }}</span>
                                    <strong>{{ student.name }}</strong>
                                </div>
                            </td>
                            <td><span class="dept-text">{{ student.department }} ({{ student.semester }})</span></td>
                            <td>
                                <span class="past-badge" [class.good]="student.pastAttendancePercentage >= 75" [class.poor]="student.pastAttendancePercentage < 75">
                                    {{ student.pastAttendancePercentage }}%
                                </span>
                            </td>
                            <td style="text-align: center;">
                                <div class="toggle-button-group">
                                    <button type="button" 
                                            class="toggle-btn present-btn" 
                                            [class.active]="student.status === 'Present'"
                                            (click)="setStudentStatus(student, 'Present')">
                                        ✅ Present
                                    </button>
                                    <button type="button" 
                                            class="toggle-btn absent-btn" 
                                            [class.active]="student.status === 'Absent'"
                                            (click)="setStudentStatus(student, 'Absent')">
                                        ❌ Absent
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Save Roster Footer -->
            <div class="roster-footer">
                <p class="summary-note">
                    Marking attendance for <strong>{{ studentRoster.length }} students</strong> in <em>{{ selectedCourseTitle }}</em> on <strong>{{ attendanceDate }}</strong>.
                </p>
                <button type="button" class="btn-save-attendance" (click)="saveRosterAttendance()">
                    💾 Save & Record Attendance
                </button>
            </div>
        </div>

        <!-- ================================================================= -->
        <!-- ATTENDANCE LOGS & AUDIT HISTORY                                   -->
        <!-- ================================================================= -->
        <div class="table-card">
            <div class="log-header">
                <h2>{{ role === 'student' ? 'My Attendance Logs' : '📜 Recent Attendance History' }} ({{ filteredRecords.length }})</h2>
                
                <div class="search-filters">
                    <input type="text" [(ngModel)]="searchTerm" (input)="onSearch()" placeholder="Search by student, course, or date..." class="search-input" />
                    <select [(ngModel)]="statusFilter" (change)="onSearch()" class="filter-select">
                        <option value="">All Statuses</option>
                        <option value="Present">Present Only</option>
                        <option value="Absent">Absent Only</option>
                    </select>
                </div>
            </div>

            <table *ngIf="filteredRecords.length > 0">
                <thead>
                    <tr>
                        <th *ngIf="role !== 'student'">Student</th>
                        <th *ngIf="role !== 'student'">RegNo</th>
                        <th>Course</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th *ngIf="role === 'admin' || role === 'faculty'">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let record of filteredRecords">
                        <td *ngIf="role !== 'student'"><strong>{{ record.student }}</strong></td>
                        <td *ngIf="role !== 'student'">{{ record.regNo || '-' }}</td>
                        <td><strong>{{ record.course }}</strong></td>
                        <td>{{ record.date }}</td>
                        <td>
                            <span class="status-chip" [class.present]="record.status === 'Present'" [class.absent]="record.status === 'Absent'">
                                {{ record.status === 'Present' ? '✅ Present' : '❌ Absent' }}
                            </span>
                        </td>
                        <td *ngIf="role === 'admin' || role === 'faculty'">
                            <button type="button" class="delete-btn" (click)="deleteAttendanceRecord(record)">🗑️ Remove</button>
                        </td>
                    </tr>
                </tbody>
            </table>
            <p *ngIf="filteredRecords.length === 0" class="empty-state">No attendance records found for this criteria.</p>
        </div>

        <app-footer></app-footer>
    </div>
</div>`,
  styles: [
    `
    .page-header { margin-bottom: 24px; }
    .page-header h1 { font-size: 1.8rem; color: #1e293b; margin: 0 0 6px; }
    .page-header p { color: #64748b; margin: 0; font-size: 0.95rem; }

    /* Student Summary Grid */
    .summary-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-bottom: 24px; }
    .section-card { padding: 20px; background: #fff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; }
    .section-card h3 { margin: 0 0 8px; font-size: 0.95rem; color: #475569; }
    .section-card strong { display: block; font-size: 1.9rem; margin-bottom: 6px; }
    .section-card p { margin: 0; font-size: 0.85rem; color: #64748b; }

    /* Roster Card */
    .roster-card { background: #ffffff; border-radius: 14px; border: 1px solid #cbd5e1; box-shadow: 0 4px 20px rgba(0,0,0,0.05); margin-bottom: 28px; overflow: hidden; }
    
    .roster-header { padding: 22px 24px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .roster-title-area { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
    .roster-title-area h2 { margin: 0; font-size: 1.25rem; color: #0f172a; }
    .active-badge { background: #e0e7ff; color: #3730a3; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; }

    .roster-controls-grid { display: grid; grid-template-columns: 2fr 1.2fr 1.8fr; gap: 18px; align-items: flex-end; }
    .control-group { display: flex; flex-direction: column; }
    .control-group label { font-size: 0.85rem; font-weight: 600; color: #334155; margin-bottom: 6px; }
    .control-group select, .control-group input[type=date] { padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.92rem; background: #ffffff; color: #1e293b; outline: none; }
    .control-group select:focus, .control-group input[type=date]:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); }

    .btn-group { display: flex; gap: 8px; }
    .btn-batch { padding: 8px 12px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.82rem; font-weight: 600; cursor: pointer; background: #ffffff; transition: all 0.15s; }
    .btn-batch.present { color: #166534; border-color: #bbf7d0; background: #f0fdf4; }
    .btn-batch.present:hover { background: #dcfce7; }
    .btn-batch.absent { color: #991b1b; border-color: #fecaca; background: #fef2f2; }
    .btn-batch.absent:hover { background: #fee2e2; }

    /* Roster Stats Bar */
    .roster-stats-bar { display: flex; gap: 14px; padding: 14px 24px; background: #ffffff; border-bottom: 1px solid #f1f5f9; flex-wrap: wrap; }
    .stat-pill { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 8px; font-size: 0.88rem; font-weight: 600; }
    .stat-pill.total { background: #f1f5f9; color: #334155; }
    .stat-pill.present { background: #dcfce7; color: #15803d; }
    .stat-pill.absent { background: #fee2e2; color: #b91c1c; }
    .stat-pill.rate { background: #e0e7ff; color: #4338ca; }
    .stat-pill strong { font-size: 1rem; }

    /* Table */
    .roster-table-wrapper { overflow-x: auto; max-height: 520px; }
    .roster-table { width: 100%; border-collapse: collapse; text-align: left; }
    .roster-table th { padding: 12px 16px; background: #f8fafc; font-size: 0.82rem; font-weight: 700; color: #475569; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 2; }
    .roster-table td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 0.92rem; color: #1e293b; }
    .roster-table tbody tr:hover { background: #f8fafc; }
    .roster-table tbody tr.row-absent { background: #fffbfb; }

    .row-num { font-weight: 600; color: #94a3b8; font-size: 0.85rem; }
    .reg-badge { background: #f1f5f9; color: #475569; padding: 4px 8px; border-radius: 6px; font-size: 0.82rem; font-family: monospace; font-weight: 600; }
    
    .student-info { display: flex; align-items: center; gap: 10px; }
    .avatar { width: 30px; height: 30px; border-radius: 50%; background: #3b82f6; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; }
    .dept-text { color: #64748b; font-size: 0.85rem; }
    
    .past-badge { padding: 3px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 700; }
    .past-badge.good { background: #dcfce7; color: #166534; }
    .past-badge.poor { background: #fee2e2; color: #991b1b; }

    /* Interactive Toggle Buttons */
    .toggle-button-group { display: inline-flex; border-radius: 8px; border: 1px solid #cbd5e1; overflow: hidden; background: #f1f5f9; }
    .toggle-btn { padding: 7px 16px; border: none; font-size: 0.85rem; font-weight: 700; cursor: pointer; background: transparent; color: #64748b; transition: all 0.15s ease; outline: none; }
    
    .toggle-btn.present-btn.active { background: #16a34a; color: #ffffff; box-shadow: inset 0 1px 3px rgba(0,0,0,0.15); }
    .toggle-btn.absent-btn.active { background: #dc2626; color: #ffffff; box-shadow: inset 0 1px 3px rgba(0,0,0,0.15); }
    .toggle-btn:hover:not(.active) { background: #e2e8f0; }

    /* Roster Footer */
    .roster-footer { padding: 18px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .summary-note { margin: 0; color: #475569; font-size: 0.92rem; }
    .btn-save-attendance { padding: 11px 26px; border: none; border-radius: 8px; background: #2563eb; color: #ffffff; font-weight: 700; font-size: 0.95rem; cursor: pointer; box-shadow: 0 4px 12px rgba(37,99,235,0.25); transition: background 0.15s; }
    .btn-save-attendance:hover { background: #1d4ed8; }

    /* Recent History Card */
    .table-card { padding: 22px 24px; background: #fff; border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 2px 10px rgba(0,0,0,0.04); margin-bottom: 24px; }
    .log-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
    .log-header h2 { margin: 0; font-size: 1.15rem; color: #0f172a; }
    .search-filters { display: flex; gap: 10px; }
    .search-input { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.88rem; min-width: 220px; outline: none; }
    .filter-select { padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.88rem; background: #fff; outline: none; }

    .table-card table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .table-card th { padding: 10px 14px; background: #f8fafc; font-size: 0.82rem; font-weight: 700; color: #475569; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; text-align: left; }
    .table-card td { padding: 11px 14px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; color: #1e293b; }
    .table-card tbody tr:hover { background: #f8fafc; }

    .status-chip { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 0.82rem; font-weight: 700; }
    .status-chip.present { background: #dcfce7; color: #166534; }
    .status-chip.absent { background: #fee2e2; color: #991b1b; }

    .delete-btn { padding: 4px 10px; border: 1px solid #fecaca; background: #fff; color: #dc2626; border-radius: 6px; cursor: pointer; font-size: 0.82rem; font-weight: 600; }
    .delete-btn:hover { background: #fee2e2; }
    .empty-state { padding: 30px; text-align: center; color: #94a3b8; font-size: 0.92rem; }
    `
  ]
})
export class AttendancePage implements OnInit, OnDestroy {
  role: string | null = null;
  userName = 'Faculty';

  // Roster variables
  coursesList: AppCourse[] = [];
  selectedCourseName = '';
  attendanceDate = new Date().toISOString().split('T')[0];
  studentRoster: StudentRosterItem[] = [];

  // Logs & History
  attendanceRecords: AttendanceRecord[] = [];
  filteredRecords: AttendanceRecord[] = [];
  searchTerm = '';
  statusFilter = '';
  monthlyReportDate = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  private toast = inject(ToastService);
  private syncService = inject(SyncService);
  private courseService = inject(CourseService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private syncSub?: Subscription;

  constructor() {
    this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
    this.userName = localStorage.getItem('userName') || 'Faculty';
  }

  ngOnInit(): void {
    this.loadCourses();
    this.loadAttendanceRecords();
    this.buildStudentRoster();

    this.syncSub = this.syncService.events$.subscribe((e) => {
      if (e.type === 'ATTENDANCE_CHANGED' || e.type === 'COURSES_CHANGED') {
        this.loadAttendanceRecords();
        this.buildStudentRoster();
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.syncSub?.unsubscribe();
  }

  get selectedCourseTitle(): string {
    return this.selectedCourseName || 'Database Management Systems';
  }

  private loadCourses(): void {
    this.coursesList = this.courseService.getCoursesSync();
    if (this.coursesList.length > 0) {
      this.selectedCourseName = this.coursesList[0].title;
    } else {
      this.selectedCourseName = 'Database Management Systems';
    }
  }

  private loadAttendanceRecords(): void {
    try {
      const stored = localStorage.getItem('obslmsAttendance');
      this.attendanceRecords = stored ? JSON.parse(stored) as AttendanceRecord[] : [];
    } catch {
      this.attendanceRecords = [];
    }
    this.onSearch();
  }

  /**
   * Builds the student roster for the selected course and date
   */
  buildStudentRoster(): void {
    // 1. Get raw students from localStorage or fallback
    let studentsRaw: any[] = [];
    try {
      const storedStudents = localStorage.getItem('obslmsStudents');
      if (storedStudents) {
        studentsRaw = JSON.parse(storedStudents);
      }
    } catch {}

    if (studentsRaw.length === 0) {
      studentsRaw = [...DEFAULT_STUDENT_ROSTER];
    }

    // 2. Check existing attendance for this course & date
    const existingDateRecords = this.attendanceRecords.filter(r =>
      r.date === this.attendanceDate &&
      r.course && (
        r.course.toLowerCase().includes(this.selectedCourseName.toLowerCase()) ||
        this.selectedCourseName.toLowerCase().includes(r.course.toLowerCase())
      )
    );

    // 3. Map into StudentRosterItem
    this.studentRoster = studentsRaw.map((s, idx) => {
      const sName = s.name || s.studentName || 'Student';
      const reg = s.regNo || s.id || `2401011200${(idx + 1).toString().padStart(2, '0')}`;

      // Check if already marked for this date
      const existing = existingDateRecords.find(r => r.student.toLowerCase() === sName.toLowerCase());
      const currentStatus: 'Present' | 'Absent' = existing ? existing.status : 'Present';

      // Compute past attendance percentage
      const studentPastRecords = this.attendanceRecords.filter(r => r.student.toLowerCase() === sName.toLowerCase());
      let pastPct = 85;
      if (studentPastRecords.length > 0) {
        const presents = studentPastRecords.filter(r => r.status === 'Present').length;
        pastPct = Math.round((presents / studentPastRecords.length) * 100);
      }

      return {
        id: s.id || reg,
        name: sName,
        regNo: reg,
        department: s.department || 'Computer Science',
        semester: s.semester || 'Semester 3',
        pastAttendancePercentage: pastPct,
        status: currentStatus
      };
    });

    this.cdr.detectChanges();
  }

  onCourseChange(): void {
    this.buildStudentRoster();
  }

  onDateChange(): void {
    this.buildStudentRoster();
  }

  setStudentStatus(student: StudentRosterItem, status: 'Present' | 'Absent'): void {
    student.status = status;
  }

  setAllStatus(status: 'Present' | 'Absent'): void {
    this.studentRoster.forEach(s => s.status = status);
  }

  get presentCount(): number {
    return this.studentRoster.filter(s => s.status === 'Present').length;
  }

  get absentCount(): number {
    return this.studentRoster.filter(s => s.status === 'Absent').length;
  }

  get sessionRate(): number {
    if (this.studentRoster.length === 0) return 0;
    return Math.round((this.presentCount / this.studentRoster.length) * 100);
  }

  /**
   * Save the daily attendance roster
   */
  saveRosterAttendance(): void {
    if (this.studentRoster.length === 0) {
      this.toast.warning('No students in roster to save.');
      return;
    }

    const recordsToSave = this.studentRoster.map(s => ({
      id: Date.now() + Math.floor(Math.random() * 10000),
      student: s.name,
      regNo: s.regNo,
      course: this.selectedCourseTitle,
      date: this.attendanceDate,
      status: s.status
    }));

    // Update localStorage
    try {
      const existing = [...this.attendanceRecords];
      recordsToSave.forEach(rec => {
        const idx = existing.findIndex(r =>
          r.student.toLowerCase() === rec.student.toLowerCase() &&
          r.course.toLowerCase() === rec.course.toLowerCase() &&
          r.date === rec.date
        );
        if (idx !== -1) {
          existing[idx] = rec;
        } else {
          existing.unshift(rec);
        }
      });

      localStorage.setItem('obslmsAttendance', JSON.stringify(existing));
      this.attendanceRecords = existing;
      this.syncService.emit('ATTENDANCE_CHANGED', recordsToSave);
      this.toast.success(`Attendance saved for ${this.studentRoster.length} students on ${this.attendanceDate}! 🎉`);
      this.onSearch();
    } catch {}

    // Background sync with Spring Boot backend
    const payloads = recordsToSave.map(rec => ({
      student: rec.student,
      courseCode: rec.course,
      date: rec.date,
      status: rec.status
    }));
    this.http.post('http://localhost:8080/api/attendance/bulk', payloads).subscribe({
      next: () => {},
      error: () => {}
    });
  }

  deleteAttendanceRecord(record: AttendanceRecord): void {
    this.attendanceRecords = this.attendanceRecords.filter(r => r !== record);
    try {
      localStorage.setItem('obslmsAttendance', JSON.stringify(this.attendanceRecords));
      this.syncService.emit('ATTENDANCE_CHANGED');
      this.toast.info('Attendance record removed.');
    } catch {}
    this.onSearch();
  }

  onSearch(): void {
    let results = this.attendanceRecords;

    if (this.role === 'student') {
      const uname = (this.userName || localStorage.getItem('userName') || 'Student').toLowerCase();
      results = results.filter(r =>
        r.student.toLowerCase() === uname ||
        r.student.toLowerCase() === 'student' ||
        r.student.toLowerCase() === 'raj kumar'
      );
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      results = results.filter(r =>
        r.student.toLowerCase().includes(term) ||
        r.course.toLowerCase().includes(term) ||
        (r.regNo && r.regNo.toLowerCase().includes(term)) ||
        r.date.includes(term)
      );
    }

    if (this.statusFilter) {
      results = results.filter(r => r.status === this.statusFilter);
    }

    this.filteredRecords = results;
  }

  get userRecords(): AttendanceRecord[] {
    if (this.role === 'student') {
      const uname = (this.userName || localStorage.getItem('userName') || 'Student').toLowerCase();
      return this.attendanceRecords.filter(r =>
        r.student.toLowerCase() === uname ||
        r.student.toLowerCase() === 'student' ||
        r.student.toLowerCase() === 'raj kumar'
      );
    }
    return this.attendanceRecords;
  }

  get totalPresent(): number {
    return this.userRecords.filter(r => r.status === 'Present').length;
  }

  get totalAbsent(): number {
    return this.userRecords.filter(r => r.status === 'Absent').length;
  }

  get attendancePercentage(): number {
    const total = this.userRecords.length;
    return total === 0 ? 0 : Math.round((this.totalPresent / total) * 100);
  }
}
