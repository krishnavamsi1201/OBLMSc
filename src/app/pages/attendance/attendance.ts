import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';

interface AttendanceRecord {
  id: number;
  student: string;
  regNo?: string;
  course: string;
  date: string;
  status: 'Present' | 'Absent';
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  template: `<app-navbar></app-navbar>

<div class="container">
    <app-sidebar></app-sidebar>
    <div class="content">
        <div class="page-header">
            <h1>📅 Student Attendance</h1>
            <p>Faculty controls for marking attendance, editing records, and monthly reporting.</p>
        </div>

        <div class="summary-grid">
            <div class="section-card">
                <h3>Attendance Percentage</h3>
                <strong>{{ attendancePercentage }}%</strong>
                <p>Average attendance across tracked students.</p>
            </div>
            <div class="section-card">
                <h3>Present</h3>
                <strong>{{ totalPresent }}</strong>
                <p>Total present entries for selected month.</p>
            </div>
            <div class="section-card">
                <h3>Absent</h3>
                <strong>{{ totalAbsent }}</strong>
                <p>Total absent entries for selected month.</p>
            </div>
            <div class="section-card">
                <h3>Monthly Report</h3>
                <strong>{{ monthlyReportDate }}</strong>
                <p>Latest monthly attendance summary.</p>
            </div>
        </div>

        <div class="form-card">
            <h2>Mark Attendance</h2>
            <form (ngSubmit)="saveAttendanceRecord()">
                <div class="grid-row">
                    <label>
                        Student Name
                        <input type="text" name="student" [(ngModel)]="currentRecord.student" placeholder="Enter student name" required />
                    </label>
                    <label>
                        RegNo (Optional)
                        <input type="text" name="regNo" [(ngModel)]="currentRecord.regNo" placeholder="Enter registration number" />
                    </label>
                </div>
                <div class="grid-row">
                    <label>
                        Course
                        <input type="text" name="course" [(ngModel)]="currentRecord.course" required />
                    </label>
                    <label>
                        Date
                        <input type="date" name="date" [(ngModel)]="currentRecord.date" required />
                    </label>
                </div>
                <div class="grid-row">
                    <label>
                        Status
                        <select name="status" [(ngModel)]="currentRecord.status" required>
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                        </select>
                    </label>
                </div>
                <div class="form-actions">
                    <button type="submit">{{ editIndex >= 0 ? 'Update Attendance' : 'Add Attendance' }}</button>
                    <button type="button" class="secondary" (click)="resetForm()">Clear</button>
                </div>
            </form>
        </div>

        <div class="search-card">
            <h2>Search Attendance</h2>
            <div class="search-filters">
                <label>
                    Search by Name or RegNo
                    <input type="text" [(ngModel)]="searchTerm" (input)="onSearch()" placeholder="Enter student name or registration number">
                </label>
                <label>
                    Filter by Status
                    <select [(ngModel)]="statusFilter" (change)="onSearch()">
                        <option value="">All</option>
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                    </select>
                </label>
            </div>
        </div>

        <div class="table-card">
            <h2>Attendance Records ({{ filteredRecords.length }})</h2>
            <table *ngIf="filteredRecords.length > 0">
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>RegNo</th>
                        <th>Course</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let record of filteredRecords; index as i">
                        <td>{{ record.student }}</td>
                        <td>{{ record.regNo || '-' }}</td>
                        <td>{{ record.course }}</td>
                        <td>{{ record.date }}</td>
                        <td><span [class.present]="record.status === 'Present'" [class.absent]="record.status === 'Absent'">{{ record.status }}</span></td>
                        <td>
                            <button type="button" class="edit-btn" (click)="editAttendance(attendanceRecords.indexOf(record))">Edit</button>
                            <button type="button" class="delete-btn" (click)="deleteAttendance(attendanceRecords.indexOf(record))">Delete</button>
                        </td>
                    </tr>
                </tbody>
            </table>
            <p *ngIf="filteredRecords.length === 0" class="empty-state">No attendance records found.</p>
        </div>

        <div class="chart-card">
            <h2>Monthly Report</h2>
            <div class="report-summary">
                <div>
                    <h3>Present</h3>
                    <strong>{{ totalPresent }}</strong>
                </div>
                <div>
                    <h3>Absent</h3>
                    <strong>{{ totalAbsent }}</strong>
                </div>
                <div>
                    <h3>Attendance %</h3>
                    <strong>{{ attendancePercentage }}%</strong>
                </div>
            </div>
        </div>
        <app-footer></app-footer>
    </div>
</div>`,
  styles: [
    `.summary-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-bottom: 24px; }
    .section-card, .table-card, .form-card, .chart-card, .search-card { padding: 20px; background: #fff; border-radius: 10px; box-shadow: 0 1px 12px rgba(0,0,0,.06); margin-bottom: 24px; }
    .section-card h3, .table-card h2, .form-card h2, .chart-card h2, .search-card h2 { margin-top: 0; }
    .section-card strong { display: block; font-size: 2rem; margin-bottom: 8px; }
    .form-card form, .search-card { display: grid; gap: 16px; }
    .grid-row { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    label { display: flex; flex-direction: column; font-weight: 600; color: #333; }
    input[type=text], input[type=date], select { margin-top: 8px; padding: 10px 12px; border: 1px solid #cfd8dc; border-radius: 8px; font-size: 14px; }
    .form-actions { display: flex; gap: 10px; flex-wrap: wrap; }
    button { padding: 10px 18px; border: none; border-radius: 8px; background: #1976d2; color: #fff; cursor: pointer; font-weight: 600; }
    button.secondary { background: #616161; }
    button.edit-btn { background: #4CAF50; padding: 6px 12px; font-size: 12px; }
    button.delete-btn { background: #f44336; padding: 6px 12px; font-size: 12px; }
    .table-card table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    .table-card th, .table-card td { padding: 12px 10px; border-bottom: 1px solid #e8e8e8; text-align: left; }
    .table-card th { font-weight: 700; background: #f5f5f5; }
    .table-card tbody tr:hover { background: #fafafa; }
    .present { color: #4CAF50; font-weight: 600; }
    .absent { color: #f44336; font-weight: 600; }
    .report-summary { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
    .report-summary div { background: #f4f7fb; border-radius: 12px; padding: 16px; text-align: center; }
    .report-summary h3 { margin: 0 0 10px; font-size: 1rem; color: #555; }
    .report-summary strong { font-size: 1.8rem; }
    .search-filters { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .empty-state { padding: 40px; text-align: center; color: #999; }
    `
  ]
})
export class AttendancePage implements OnInit {
  attendanceRecords: AttendanceRecord[] = [];
  filteredRecords: AttendanceRecord[] = [];
  searchTerm = '';
  statusFilter = '';

  currentRecord: AttendanceRecord = { id: 0, student: '', regNo: '', course: '', date: '', status: 'Present' };
  editIndex = -1;
  monthlyReportDate = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  constructor() {
    this.loadAttendance();
  }

  ngOnInit(): void {
    this.filteredRecords = [...this.attendanceRecords];
  }

  /**
   * Load attendance from localStorage
   */
  private loadAttendance(): void {
    try {
      const stored = localStorage.getItem('obslmsAttendance');
      this.attendanceRecords = stored ? JSON.parse(stored) as AttendanceRecord[] : [];
      this.filteredRecords = [...this.attendanceRecords];
    } catch {
      this.attendanceRecords = [];
    }
  }

  /**
   * Save attendance to localStorage
   */
  private saveAttendance(): void {
    try {
      localStorage.setItem('obslmsAttendance', JSON.stringify(this.attendanceRecords));
    } catch {}
  }

  /**
   * Add or update attendance record
   */
  saveAttendanceRecord(): void {
    if (!this.currentRecord.student || !this.currentRecord.course || !this.currentRecord.date) {
      alert('Please fill all required fields');
      return;
    }

    if (this.editIndex >= 0) {
      this.attendanceRecords[this.editIndex] = { ...this.currentRecord, id: this.attendanceRecords[this.editIndex].id };
    } else {
      this.attendanceRecords = [...this.attendanceRecords, { ...this.currentRecord, id: Date.now() }];
    }

    this.saveAttendance();
    this.resetForm();
    this.onSearch();
  }

  /**
   * Edit attendance record
   */
  editAttendance(index: number): void {
    if (index < 0 || index >= this.attendanceRecords.length) return;
    this.editIndex = index;
    this.currentRecord = { ...this.attendanceRecords[index] };
  }

  /**
   * Delete attendance record
   */
  deleteAttendance(index: number): void {
    if (index < 0 || index >= this.attendanceRecords.length) return;
    this.attendanceRecords.splice(index, 1);
    this.saveAttendance();
    this.onSearch();
  }

  /**
   * Reset form
   */
  resetForm(): void {
    this.editIndex = -1;
    this.currentRecord = { id: 0, student: '', regNo: '', course: '', date: '', status: 'Present' };
  }

  /**
   * Search by name or RegNo, filter by status
   */
  onSearch(): void {
    let results = this.attendanceRecords;

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      results = results.filter(r =>
        r.student.toLowerCase().includes(term) ||
        (r.regNo && r.regNo.toLowerCase().includes(term))
      );
    }

    if (this.statusFilter) {
      results = results.filter(r => r.status === this.statusFilter);
    }

    this.filteredRecords = results;
  }

  get totalPresent(): number {
    return this.attendanceRecords.filter(r => r.status === 'Present').length;
  }

  get totalAbsent(): number {
    return this.attendanceRecords.filter(r => r.status === 'Absent').length;
  }

  get attendancePercentage(): number {
    const total = this.attendanceRecords.length;
    return total === 0 ? 0 : Math.round((this.totalPresent / total) * 100);
  }
}
