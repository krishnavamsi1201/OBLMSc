import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';

interface ScheduleEntry {
  id: number;
  day: string;
  period: string;
  subject: string;
  room: string;
  facultyName?: string;
}

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  template: `<app-navbar></app-navbar>

<div class="container">

    <app-sidebar></app-sidebar>

    <div class="content">

        <div class="page-header">
            <h1>🗓️ Timetable & Schedules</h1>
            <p>Weekly classroom assignments, time slots, and schedule planner.</p>
        </div>

        <div class="summary-grid">
            <div class="section-card">
                <h3>Weekly Classes</h3>
                <strong>{{ weeklySchedule.length }}</strong>
                <p>Total scheduled sessions for the week.</p>
            </div>
            <div class="section-card">
                <h3>Today&apos;s Classes</h3>
                <strong>{{ todayClasses.length }}</strong>
                <p>Classes scheduled for {{ currentDay }}.</p>
            </div>
            <div class="section-card">
                <h3>Active Rooms</h3>
                <strong>{{ activeRoomsCount }}</strong>
                <p>Unique classrooms utilized in the schedule.</p>
            </div>
        </div>

        <!-- Add/Edit Form for Faculty and Admin -->
        <div class="form-card" *ngIf="role === 'admin' || role === 'faculty'">
            <h2>{{ editIndex >= 0 ? 'Edit Schedule Slot' : 'Add New Schedule Slot' }}</h2>
            <form (ngSubmit)="saveSchedule()">
                <div class="grid-row">
                    <label>
                        Day of Week
                        <select name="day" [(ngModel)]="currentEntry.day" required>
                            <option value="Monday">Monday</option>
                            <option value="Tuesday">Tuesday</option>
                            <option value="Wednesday">Wednesday</option>
                            <option value="Thursday">Thursday</option>
                            <option value="Friday">Friday</option>
                            <option value="Saturday">Saturday</option>
                        </select>
                    </label>
                    <label>
                        Time Period
                        <input type="text" name="period" [(ngModel)]="currentEntry.period" placeholder="e.g. 09:00 AM - 10:00 AM" required />
                    </label>
                </div>
                <div class="grid-row">
                    <label>
                        Subject / Course
                        <input type="text" name="subject" [(ngModel)]="currentEntry.subject" placeholder="e.g. Machine Learning" required />
                    </label>
                    <label>
                        Room Number
                        <input type="text" name="room" [(ngModel)]="currentEntry.room" placeholder="e.g. LH-301 or Lab-4" required />
                    </label>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">{{ editIndex >= 0 ? 'Update Slot' : 'Add Slot' }}</button>
                    <button type="button" class="btn btn-secondary" (click)="resetForm()">Clear</button>
                </div>
            </form>
        </div>

        <div class="table-card">
            <h2>Weekly Timetable ({{ filteredSchedule.length }})</h2>
            
            <div class="filter-row">
                <label>
                    Filter by Day:
                    <select [(ngModel)]="dayFilter" (change)="applyFilters()">
                        <option value="">All Days</option>
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                        <option value="Saturday">Saturday</option>
                    </select>
                </label>
                <label>
                    Search Subject:
                    <input type="text" [(ngModel)]="searchSubject" (input)="applyFilters()" placeholder="Search subject name...">
                </label>
            </div>

            <table *ngIf="filteredSchedule.length > 0">
                <thead>
                    <tr>
                        <th>Day</th>
                        <th>Period</th>
                        <th>Subject</th>
                        <th>Room Number</th>
                        <th *ngIf="role === 'admin' || role === 'faculty'">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let entry of filteredSchedule">
                        <td><strong>{{ entry.day }}</strong></td>
                        <td>{{ entry.period }}</td>
                        <td>{{ entry.subject }}</td>
                        <td><span class="room-badge">{{ entry.room }}</span></td>
                        <td *ngIf="role === 'admin' || role === 'faculty'" class="actions-cell">
                            <button type="button" class="edit-btn" (click)="editEntry(entry)">Edit</button>
                            <button type="button" class="delete-btn" (click)="deleteEntry(entry)">Delete</button>
                        </td>
                    </tr>
                </tbody>
            </table>
            <p *ngIf="filteredSchedule.length === 0" class="empty-state">No schedule slots found.</p>
        </div>

        <div class="table-card" *ngIf="todayClasses.length > 0">
            <h2>Today&apos;s Schedule ({{ currentDay }})</h2>
            <table>
                <thead>
                    <tr>
                        <th>Period</th>
                        <th>Subject</th>
                        <th>Room Number</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let entry of todayClasses">
                        <td>{{ entry.period }}</td>
                        <td><strong>{{ entry.subject }}</strong></td>
                        <td><span class="room-badge">{{ entry.room }}</span></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <app-footer></app-footer>
    </div>

</div>`,
  styles: [
    `.summary-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-bottom: 24px; }
    .section-card, .table-card, .form-card { padding: 20px; background: #fff; border-radius: 10px; box-shadow: 0 1px 12px rgba(0,0,0,.06); margin-bottom: 24px; }
    .section-card h3, .table-card h2, .form-card h2 { margin-top: 0; }
    .section-card strong { display: block; font-size: 2rem; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { padding: 12px 10px; border-bottom: 1px solid #e8e8e8; text-align: left; }
    th { font-weight: 700; background: #f5f5f5; }
    tbody tr:hover { background: #fafafa; }
    .room-badge { background: #e3f2fd; color: #0d47a1; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 0.85rem; }
    
    .form-card form { display: grid; gap: 16px; }
    .grid-row { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    label { display: flex; flex-direction: column; font-weight: 600; color: #333; }
    input[type=text], select { margin-top: 8px; padding: 10px 12px; border: 1px solid #cfd8dc; border-radius: 8px; font-size: 14px; }
    
    .form-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }
    .btn { padding: 10px 18px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
    .btn-primary { background: #1976d2; color: #fff; }
    .btn-secondary { background: #616161; color: #fff; }
    
    .actions-cell { display: flex; gap: 8px; }
    .edit-btn { background: #4CAF50; color: white; padding: 6px 12px; font-size: 12px; border: none; border-radius: 4px; cursor: pointer; }
    .delete-btn { background: #f44336; color: white; padding: 6px 12px; font-size: 12px; border: none; border-radius: 4px; cursor: pointer; }
    
    .filter-row { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 16px; background: #fdfdfd; padding: 12px; border-radius: 8px; border: 1px solid #eee; }
    .filter-row label { flex: 1; min-width: 180px; }
    .filter-row select, .filter-row input { margin-top: 4px; }
    .empty-state { padding: 40px; text-align: center; color: #999; }
    `
  ]
})
export class Timetable implements OnInit {
  role: string | null = null;
  currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  weeklySchedule: ScheduleEntry[] = [];
  filteredSchedule: ScheduleEntry[] = [];

  // Form bindings
  currentEntry: ScheduleEntry = this.createEmptyEntry();
  editIndex = -1;

  // Filters
  dayFilter = '';
  searchSubject = '';

  constructor() {
    try {
      this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
    } catch {
      this.role = null;
    }
  }

  ngOnInit(): void {
    this.loadTimetable();
    this.applyFilters();
  }

  createEmptyEntry(): ScheduleEntry {
    return { id: 0, day: 'Monday', period: '', subject: '', room: '' };
  }

  private loadTimetable(): void {
    try {
      const stored = localStorage.getItem('obslmsTimetable');
      if (stored) {
        this.weeklySchedule = JSON.parse(stored) as ScheduleEntry[];
      } else {
        // Seed default schedules
        this.weeklySchedule = [
          { id: 1, day: 'Monday', period: '09:00 AM - 10:00 AM', subject: 'Outcome-Based Education', room: 'LH-301' },
          { id: 2, day: 'Monday', period: '11:15 AM - 12:15 PM', subject: 'Database Management Systems', room: 'LH-302' },
          { id: 3, day: 'Tuesday', period: '10:00 AM - 11:00 AM', subject: 'Machine Learning', room: 'Lab-4' },
          { id: 4, day: 'Wednesday', period: '09:00 AM - 10:00 AM', subject: 'Outcome-Based Education', room: 'LH-301' },
          { id: 5, day: 'Thursday', period: '02:00 PM - 03:00 PM', subject: 'Cloud Computing', room: 'LH-101' },
          { id: 6, day: 'Friday', period: '11:15 AM - 12:15 PM', subject: 'Database Management Systems', room: 'LH-302' }
        ];
        this.saveTimetable();
      }
    } catch {
      this.weeklySchedule = [];
    }
  }

  private saveTimetable(): void {
    try {
      localStorage.setItem('obslmsTimetable', JSON.stringify(this.weeklySchedule));
    } catch {}
  }

  get todayClasses(): ScheduleEntry[] {
    return this.weeklySchedule.filter(entry => entry.day.toLowerCase() === this.currentDay.toLowerCase());
  }

  get activeRoomsCount(): number {
    const rooms = this.weeklySchedule.map(e => e.room);
    return new Set(rooms).size;
  }

  applyFilters(): void {
    let result = this.weeklySchedule;

    if (this.dayFilter) {
      result = result.filter(e => e.day === this.dayFilter);
    }

    if (this.searchSubject.trim()) {
      const q = this.searchSubject.toLowerCase();
      result = result.filter(e => e.subject.toLowerCase().includes(q));
    }

    // Sort by Day and Period roughly
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    this.filteredSchedule = [...result].sort((a, b) => {
      const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      if (dayDiff !== 0) return dayDiff;
      return a.period.localeCompare(b.period);
    });
  }

  saveSchedule(): void {
    if (!this.currentEntry.period || !this.currentEntry.subject || !this.currentEntry.room) {
      alert('Please fill all required schedule details.');
      return;
    }

    if (this.editIndex >= 0) {
      const targetId = this.weeklySchedule[this.editIndex].id;
      this.weeklySchedule[this.editIndex] = { ...this.currentEntry, id: targetId };
    } else {
      const nextId = this.weeklySchedule.length ? Math.max(...this.weeklySchedule.map(e => e.id)) + 1 : 1;
      this.weeklySchedule = [...this.weeklySchedule, { ...this.currentEntry, id: nextId }];
    }

    this.saveTimetable();
    this.resetForm();
    this.applyFilters();
  }

  editEntry(entry: ScheduleEntry): void {
    const idx = this.weeklySchedule.findIndex(e => e.id === entry.id);
    if (idx >= 0) {
      this.editIndex = idx;
      this.currentEntry = { ...entry };
    }
  }

  deleteEntry(entry: ScheduleEntry): void {
    this.weeklySchedule = this.weeklySchedule.filter(e => e.id !== entry.id);
    this.saveTimetable();
    this.applyFilters();
  }

  resetForm(): void {
    this.editIndex = -1;
    this.currentEntry = this.createEmptyEntry();
  }
}
