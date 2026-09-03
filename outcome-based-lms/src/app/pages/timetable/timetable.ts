import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { HttpClient } from '@angular/common/http';

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
                        <select name="period" [(ngModel)]="currentEntry.period" required>
                            <option *ngFor="let p of periods" [value]="p">{{ p }}</option>
                        </select>
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

        <!-- Weekly Visual Grid Calendar (Matrix View) -->
        <div class="table-card matrix-container">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
                <div>
                    <h2 style="margin: 0; font-size: 1.25rem; color: #1e3a8a; font-weight: 800;">📅 Weekly Timetable Matrix</h2>
                    <p style="color: #64748b; font-size: 0.88rem; margin: 4px 0 0 0;">Visual schedule representation of lectures, lab sessions, and classroom distribution.</p>
                </div>
                <div class="matrix-legend" style="display: flex; gap: 12px; font-size: 12px; font-weight: 600;">
                    <span style="display: inline-flex; align-items: center; gap: 5px; color: #0369a1;">
                        <span style="width: 10px; height: 10px; border-radius: 3px; background: #e0f2fe; border: 1px solid #7dd3fc;"></span> Theory Lecture
                    </span>
                    <span style="display: inline-flex; align-items: center; gap: 5px; color: #047857;">
                        <span style="width: 10px; height: 10px; border-radius: 3px; background: #d1fae5; border: 1px solid #6ee7b7;"></span> Lab / Practical
                    </span>
                </div>
            </div>
            
            <div class="table-scroll-wrapper">
                <table class="tt-matrix-table">
                    <thead>
                        <tr>
                            <th class="day-col-header">Day</th>
                            <th *ngFor="let p of periods" class="period-col-header">
                                <span class="period-icon">⏰</span>
                                <span class="period-text">{{ p }}</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let d of days" [class.today-row]="d === currentDay">
                            <td class="day-cell">
                                <div class="day-badge" [class.today-badge]="d === currentDay">
                                    {{ d }}
                                    <span *ngIf="d === currentDay" class="today-tag">TODAY</span>
                                </div>
                            </td>
                            <td *ngFor="let p of periods" class="slot-cell">
                                <div *ngIf="getSlot(d, p) as slot" 
                                     class="matrix-slot-card"
                                     [class.lab-card]="slot.subject.toLowerCase().includes('lab') || slot.room.toLowerCase().includes('lab')">
                                    <div class="slot-subject">{{ slot.subject }}</div>
                                    <div class="slot-room">
                                        🚪 {{ slot.room }}
                                    </div>
                                </div>
                                <div *ngIf="!getSlot(d, p)" class="empty-slot">
                                    <span>—</span>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="table-card">
            <h2>Weekly Timetable List ({{ filteredSchedule.length }})</h2>
            
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

            <table *ngIf="filteredSchedule.length > 0" class="list-table">
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
                            <button type="button" class="danger" (click)="deleteEntry(entry)" style="margin-left: 8px;">Delete</button>
                        </td>
                    </tr>
                </tbody>
            </table>
            <p *ngIf="filteredSchedule.length === 0" class="empty-state">No schedule slots found.</p>
        </div>

        <div class="table-card" *ngIf="todayClasses.length > 0">
            <h2>Today&apos;s Schedule ({{ currentDay }})</h2>
            <table class="list-table">
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
    `
    .summary-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-bottom: 24px; }
    .section-card, .table-card, .form-card { padding: 22px; background: #fff; border-radius: 14px; box-shadow: 0 4px 16px rgba(0,0,0,0.05); margin-bottom: 24px; border: 1px solid rgba(74, 140, 234, 0.14); }
    .section-card h3, .table-card h2, .form-card h2 { margin-top: 0; }
    .section-card strong { display: block; font-size: 2.2rem; margin-bottom: 8px; color: #1e40af; }
    
    .table-scroll-wrapper {
      width: 100%;
      overflow-x: auto;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
    }

    /* Timetable Matrix Table Styles */
    table.tt-matrix-table {
      display: table !important;
      width: 100% !important;
      min-width: 920px !important;
      border-collapse: collapse !important;
      table-layout: fixed !important;
      background: #ffffff;
      margin: 0;
    }

    table.tt-matrix-table th, table.tt-matrix-table td {
      border: 1px solid #e2e8f0 !important;
      padding: 10px 8px !important;
      vertical-align: middle !important;
      box-sizing: border-box !important;
    }

    table.tt-matrix-table th {
      background: #f8fafc;
      color: #1e293b;
      font-weight: 700;
      text-align: center;
      padding: 12px 8px !important;
    }

    th.day-col-header {
      width: 130px;
      font-size: 13px;
      background: #f1f5f9 !important;
      color: #0f172a;
    }

    th.period-col-header {
      font-size: 12px;
    }

    .period-icon {
      margin-right: 4px;
      font-size: 13px;
    }

    .period-text {
      display: inline-block;
      white-space: nowrap;
    }

    td.day-cell {
      width: 130px;
      text-align: center;
      background: #f8fafc;
      font-weight: 700;
    }

    .day-badge {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      font-size: 13px;
      color: #334155;
    }

    .today-row {
      background-color: #f0fdf4 !important;
    }

    .today-badge {
      color: #166534;
      font-weight: 800;
    }

    .today-tag {
      font-size: 9px;
      background: #22c55e;
      color: #ffffff;
      padding: 1px 5px;
      border-radius: 4px;
      font-weight: 800;
      letter-spacing: 0.04em;
    }

    td.slot-cell {
      height: 80px;
      padding: 6px !important;
      background: #ffffff;
    }

    .matrix-slot-card {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 8px 6px;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      gap: 4px;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .matrix-slot-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(2, 132, 199, 0.15);
    }

    .matrix-slot-card.lab-card {
      background: #ecfdf5;
      border-color: #a7f3d0;
    }

    .matrix-slot-card.lab-card .slot-subject {
      color: #065f46;
    }

    .matrix-slot-card.lab-card .slot-room {
      background: #d1fae5;
      color: #047857;
    }

    .slot-subject {
      font-size: 11.5px;
      font-weight: 700;
      color: #0369a1;
      line-height: 1.25;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .slot-room {
      font-size: 10px;
      font-weight: 700;
      color: #0284c7;
      background: #e0f2fe;
      padding: 2px 6px;
      border-radius: 4px;
      white-space: nowrap;
    }

    .empty-slot {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #cbd5e1;
      font-size: 14px;
    }

    /* List Table */
    table.list-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }

    table.list-table th, table.list-table td {
      padding: 12px 10px;
      border-bottom: 1px solid #e2e8f0;
      text-align: left;
    }

    table.list-table th {
      font-weight: 700;
      background: #f8fafc;
      color: #334155;
      font-size: 13px;
    }

    .room-badge {
      background: #e0f2fe;
      color: #0369a1;
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
    }

    .form-card form { display: grid; gap: 16px; }
    .grid-row { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    label { display: flex; flex-direction: column; font-weight: 600; color: #333; font-size: 13px; }
    input[type=text], select { margin-top: 6px; padding: 10px 12px; border: 1px solid #cfd8dc; border-radius: 8px; font-size: 14px; outline: none; }
    
    .form-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }
    .btn { padding: 10px 18px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; }
    .btn-primary { background: #1976d2; color: #fff; }
    .btn-secondary { background: #616161; color: #fff; }
    
    .actions-cell { display: flex; gap: 8px; }
    .edit-btn { background: #4CAF50; color: white; padding: 6px 12px; font-size: 12px; border: none; border-radius: 4px; cursor: pointer; }
    button.danger { background: #d32f2f; color: white; padding: 6px 12px; font-size: 12px; border: none; border-radius: 4px; cursor: pointer; }
    
    .filter-row { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 16px; background: #f8fafc; padding: 14px; border-radius: 10px; border: 1px solid #e2e8f0; }
    .filter-row label { flex: 1; min-width: 180px; }
    .filter-row select, .filter-row input { margin-top: 4px; }
    .empty-state { padding: 40px; text-align: center; color: #94a3b8; font-weight: 600; }
    `
  ]
})
export class Timetable implements OnInit {
  role: string | null = null;
  currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  weeklySchedule: ScheduleEntry[] = [];
  filteredSchedule: ScheduleEntry[] = [];

  // Visual grid variables
  days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  periods = [
    '09:00 AM - 10:00 AM',
    '10:15 AM - 11:15 AM',
    '11:30 AM - 12:30 PM',
    '02:00 PM - 03:00 PM',
    '03:15 PM - 04:15 PM'
  ];

  // Default rich fallback timetable
  defaultSchedule: ScheduleEntry[] = [
    { id: 1, day: 'Monday', period: '09:00 AM - 10:00 AM', subject: 'Database Management Systems (CS101)', room: 'LH-101' },
    { id: 2, day: 'Monday', period: '10:15 AM - 11:15 AM', subject: 'Java & OOPs Programming (CS102)', room: 'LH-204' },
    { id: 3, day: 'Monday', period: '11:30 AM - 12:30 PM', subject: 'Data Structures & Algorithms (CS103)', room: 'LH-101' },
    { id: 4, day: 'Monday', period: '02:00 PM - 03:00 PM', subject: 'Operating Systems (CS301)', room: 'LH-305' },
    { id: 5, day: 'Monday', period: '03:15 PM - 04:15 PM', subject: 'Computer Networks (CS302)', room: 'Lab-2B' },

    { id: 6, day: 'Tuesday', period: '09:00 AM - 10:00 AM', subject: 'Java & OOPs Programming (CS102)', room: 'LH-204' },
    { id: 7, day: 'Tuesday', period: '10:15 AM - 11:15 AM', subject: 'Database Management Systems (CS101)', room: 'LH-101' },
    { id: 8, day: 'Tuesday', period: '11:30 AM - 12:30 PM', subject: 'Operating Systems (CS301)', room: 'LH-305' },
    { id: 9, day: 'Tuesday', period: '02:00 PM - 03:00 PM', subject: 'Database & SQL Lab Session', room: 'Lab-4A' },
    { id: 10, day: 'Tuesday', period: '03:15 PM - 04:15 PM', subject: 'Database & SQL Lab Session', room: 'Lab-4A' },

    { id: 11, day: 'Wednesday', period: '09:00 AM - 10:00 AM', subject: 'Data Structures & Algorithms (CS103)', room: 'LH-101' },
    { id: 12, day: 'Wednesday', period: '10:15 AM - 11:15 AM', subject: 'Computer Networks (CS302)', room: 'LH-305' },
    { id: 13, day: 'Wednesday', period: '11:30 AM - 12:30 PM', subject: 'Software Engineering & OBE (CS201)', room: 'LH-204' },
    { id: 14, day: 'Wednesday', period: '02:00 PM - 03:00 PM', subject: 'Discrete Mathematics & Graph Theory', room: 'LH-101' },
    { id: 15, day: 'Wednesday', period: '03:15 PM - 04:15 PM', subject: 'Technical Seminar & Project Mentoring', room: 'Seminar Hall' },

    { id: 16, day: 'Thursday', period: '09:00 AM - 10:00 AM', subject: 'Operating Systems (CS301)', room: 'LH-305' },
    { id: 17, day: 'Thursday', period: '10:15 AM - 11:15 AM', subject: 'Database Management Systems (CS101)', room: 'LH-101' },
    { id: 18, day: 'Thursday', period: '11:30 AM - 12:30 PM', subject: 'Java & OOPs Programming (CS102)', room: 'LH-204' },
    { id: 19, day: 'Thursday', period: '02:00 PM - 03:00 PM', subject: 'Java & OOPs Practical Lab', room: 'Lab-2B' },
    { id: 20, day: 'Thursday', period: '03:15 PM - 04:15 PM', subject: 'Java & OOPs Practical Lab', room: 'Lab-2B' },

    { id: 21, day: 'Friday', period: '09:00 AM - 10:00 AM', subject: 'Computer Networks (CS302)', room: 'LH-305' },
    { id: 22, day: 'Friday', period: '10:15 AM - 11:15 AM', subject: 'Data Structures & Algorithms (CS103)', room: 'LH-101' },
    { id: 23, day: 'Friday', period: '11:30 AM - 12:30 PM', subject: 'Discrete Mathematics & Graph Theory', room: 'LH-204' },
    { id: 24, day: 'Friday', period: '02:00 PM - 03:00 PM', subject: 'Cloud Computing & DevOps Workshop', room: 'LH-101' },
    { id: 25, day: 'Friday', period: '03:15 PM - 04:15 PM', subject: 'Outcome-Based Assessment / Remedial', room: 'LH-204' },

    { id: 26, day: 'Saturday', period: '09:00 AM - 10:00 AM', subject: 'Software Engineering & Agile Methodologies', room: 'LH-204' },
    { id: 27, day: 'Saturday', period: '10:15 AM - 11:15 AM', subject: 'Mini-Project Review & Viva Preparation', room: 'Lab-4A' },
    { id: 28, day: 'Saturday', period: '11:30 AM - 12:30 PM', subject: 'Industry Expert Guest Lecture / Webinar', room: 'Seminar Hall' }
  ];

  getBranchSchedule(dept: string): ScheduleEntry[] {
    const d = (dept || '').toLowerCase();
    if (d.includes('mech') || d.includes('me')) {
      return [
        { id: 1, day: 'Monday', period: '09:00 AM - 10:00 AM', subject: 'Metallurgy & Materials Engineering (ME210)', room: 'ME-LH-101' },
        { id: 2, day: 'Monday', period: '10:15 AM - 11:15 AM', subject: 'Kinematics of Machinery (KM)', room: 'ME-LH-102' },
        { id: 3, day: 'Monday', period: '11:30 AM - 12:30 PM', subject: 'Strength of Materials & Mechanics (SMSE)', room: 'ME-LH-101' },
        { id: 4, day: 'Monday', period: '02:00 PM - 03:00 PM', subject: 'I C Engines and Combustion (IC)', room: 'ME-LH-204' },
        { id: 5, day: 'Monday', period: '03:15 PM - 04:15 PM', subject: 'Auto Chassis & Dynamics (AU203)', room: 'ME-LH-204' },

        { id: 6, day: 'Tuesday', period: '09:00 AM - 10:00 AM', subject: 'CAD/CAM Simulation & Modeling (04ME6512)', room: 'CAD Lab' },
        { id: 7, day: 'Tuesday', period: '10:15 AM - 11:15 AM', subject: 'CAD/CAM Simulation & Modeling (04ME6512)', room: 'CAD Lab' },
        { id: 8, day: 'Tuesday', period: '11:30 AM - 12:30 PM', subject: 'Metallurgy & Materials Engineering (ME210)', room: 'ME-LH-101' },
        { id: 9, day: 'Tuesday', period: '02:00 PM - 03:00 PM', subject: 'Engineering Mathematics IV (EM IV)', room: 'ME-LH-102' },
        { id: 10, day: 'Tuesday', period: '03:15 PM - 04:15 PM', subject: 'Thermal Engineering Practice / Seminar', room: 'Seminar Hall' },

        { id: 11, day: 'Wednesday', period: '09:00 AM - 10:00 AM', subject: 'Kinematics of Machinery (KM)', room: 'ME-LH-102' },
        { id: 12, day: 'Wednesday', period: '10:15 AM - 11:15 AM', subject: 'I C Engines and Combustion (IC)', room: 'ME-LH-204' },
        { id: 13, day: 'Wednesday', period: '11:30 AM - 12:30 PM', subject: 'Metallurgy & Materials Engineering (ME210)', room: 'ME-LH-101' },
        { id: 14, day: 'Wednesday', period: '02:00 PM - 03:00 PM', subject: 'Strength of Materials Lab / Testing', room: 'Mechanics Lab' },
        { id: 15, day: 'Wednesday', period: '03:15 PM - 04:15 PM', subject: 'Strength of Materials Lab / Testing', room: 'Mechanics Lab' },

        { id: 16, day: 'Thursday', period: '09:00 AM - 10:00 AM', subject: 'Auto Chassis & Dynamics (AU203)', room: 'ME-LH-204' },
        { id: 17, day: 'Thursday', period: '10:15 AM - 11:15 AM', subject: 'Engineering Mathematics IV (EM IV)', room: 'ME-LH-102' },
        { id: 18, day: 'Thursday', period: '11:30 AM - 12:30 PM', subject: 'Kinematics of Machinery (KM)', room: 'ME-LH-102' },
        { id: 19, day: 'Thursday', period: '02:00 PM - 03:00 PM', subject: 'IC Engines & Automobile Lab', room: 'Auto Lab' },
        { id: 20, day: 'Thursday', period: '03:15 PM - 04:15 PM', subject: 'IC Engines & Automobile Lab', room: 'Auto Lab' },

        { id: 21, day: 'Friday', period: '09:00 AM - 10:00 AM', subject: 'Metallurgy & Materials Engineering (ME210)', room: 'ME-LH-101' },
        { id: 22, day: 'Friday', period: '10:15 AM - 11:15 AM', subject: 'Strength of Materials & Mechanics (SMSE)', room: 'ME-LH-101' },
        { id: 23, day: 'Friday', period: '11:30 AM - 12:30 PM', subject: 'CAD/CAM Simulation & Modeling (04ME6512)', room: 'CAD Lab' },
        { id: 24, day: 'Friday', period: '02:00 PM - 03:00 PM', subject: 'Mechatronics & Robotics Workshop', room: 'ME-LH-204' },
        { id: 25, day: 'Friday', period: '03:15 PM - 04:15 PM', subject: 'Outcome-Based Assessment / Remedial', room: 'ME-LH-101' }
      ];
    } else if (d.includes('civil') || d.includes('ce')) {
      return [
        { id: 1, day: 'Monday', period: '09:00 AM - 10:00 AM', subject: 'Fluid Mechanics & Hydraulic Machinery (FMHM)', room: 'CE-LH-101' },
        { id: 2, day: 'Monday', period: '10:15 AM - 11:15 AM', subject: 'Structural Mechanics & Materials (SMSE)', room: 'CE-LH-102' },
        { id: 3, day: 'Monday', period: '11:30 AM - 12:30 PM', subject: 'Engineering Mathematics II (EMII)', room: 'CE-LH-101' },
        { id: 4, day: 'Monday', period: '02:00 PM - 03:00 PM', subject: 'Principles of Management (HS300)', room: 'CE-LH-204' },
        { id: 5, day: 'Monday', period: '03:15 PM - 04:15 PM', subject: 'Fluid Mechanics Lab (CE234)', room: 'Fluid Lab' },
        { id: 6, day: 'Tuesday', period: '09:00 AM - 10:00 AM', subject: 'Fluid Mechanics & Hydraulic Machinery (FMHM)', room: 'CE-LH-101' },
        { id: 7, day: 'Tuesday', period: '10:15 AM - 11:15 AM', subject: 'Structural Mechanics & Materials (SMSE)', room: 'CE-LH-102' },
        { id: 8, day: 'Tuesday', period: '11:30 AM - 12:30 PM', subject: 'Engineering Mathematics II (EMII)', room: 'CE-LH-101' },
        { id: 9, day: 'Tuesday', period: '02:00 PM - 03:00 PM', subject: 'Surveying Field Practice Lab', room: 'Survey Field' }
      ];
    } else if (d.includes('elect') || d.includes('ece')) {
      return [
        { id: 1, day: 'Monday', period: '09:00 AM - 10:00 AM', subject: 'Microprocessors & Embedded Systems (MES)', room: 'EC-LH-101' },
        { id: 2, day: 'Monday', period: '10:15 AM - 11:15 AM', subject: 'Digital Systems & Logic Designs (DSLD)', room: 'EC-LH-102' },
        { id: 3, day: 'Monday', period: '11:30 AM - 12:30 PM', subject: 'Computer Organization (EC206)', room: 'EC-LH-101' },
        { id: 4, day: 'Monday', period: '02:00 PM - 03:00 PM', subject: 'Digital Signal Processing (EE407)', room: 'EC-LH-204' },
        { id: 5, day: 'Monday', period: '03:15 PM - 04:15 PM', subject: 'Microprocessors & Hardware Lab', room: 'Hardware Lab' }
      ];
    } else if (d.includes('info') || d.includes('it')) {
      return [
        { id: 1, day: 'Monday', period: '09:00 AM - 10:00 AM', subject: 'Operating Systems & Systems Programming (IT305)', room: 'IT-LH-101' },
        { id: 2, day: 'Monday', period: '10:15 AM - 11:15 AM', subject: 'Linux & Shell Programming (Linux)', room: 'IT-LH-102' },
        { id: 3, day: 'Monday', period: '11:30 AM - 12:30 PM', subject: 'Web Technologies & Frameworks (WT)', room: 'IT-LH-101' },
        { id: 4, day: 'Monday', period: '02:00 PM - 03:00 PM', subject: 'Soft Computing (CS361)', room: 'IT-LH-204' },
        { id: 5, day: 'Monday', period: '03:15 PM - 04:15 PM', subject: 'Linux & Open Source Lab', room: 'Linux Lab' }
      ];
    }
    return this.defaultSchedule;
  }

  // Form bindings
  currentEntry: ScheduleEntry = this.createEmptyEntry();
  editIndex = -1;

  // Filters
  dayFilter = '';
  searchSubject = '';
  userDept: string = 'Computer Science & Engineering';

  constructor(private http: HttpClient) {
    try {
      this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
      this.userDept = localStorage.getItem('userDepartment') || localStorage.getItem('userDept') || 'Computer Science & Engineering';
    } catch {
      this.role = null;
    }
  }

  ngOnInit(): void {
    this.weeklySchedule = this.getBranchSchedule(this.userDept);
    this.applyFilters();
    this.loadTimetable();
  }

  createEmptyEntry(): ScheduleEntry {
    return { id: 0, day: 'Monday', period: '09:00 AM - 10:00 AM', subject: '', room: '' };
  }

  private loadTimetable(): void {
    this.http.get<ScheduleEntry[]>('http://localhost:8080/api/timetable').subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          this.weeklySchedule = data;
        } else {
          this.weeklySchedule = this.getBranchSchedule(this.userDept);
        }
        this.applyFilters();
      },
      error: () => {
        this.weeklySchedule = this.getBranchSchedule(this.userDept);
        this.applyFilters();
      }
    });
  }

  getSlot(day: string, period: string): ScheduleEntry | null {
    const pHour = period.split(':')[0]; // E.g., '09', '10', '11', '02', '03'
    return this.weeklySchedule.find(s => 
      s.day.toLowerCase() === day.toLowerCase() && 
      (s.period.toLowerCase().includes(pHour.toLowerCase()) || s.period.toLowerCase() === period.toLowerCase())
    ) || null;
  }

  get todayClasses(): ScheduleEntry[] {
    return this.weeklySchedule.filter(entry => entry.day.toLowerCase() === this.currentDay.toLowerCase());
  }

  get activeRoomsCount(): number {
    const rooms = this.weeklySchedule.map(e => e.room).filter(Boolean);
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

    const payload = {
      id: this.currentEntry.id > 0 ? this.currentEntry.id : null,
      day: this.currentEntry.day,
      period: this.currentEntry.period,
      subject: this.currentEntry.subject,
      room: this.currentEntry.room
    };

    this.http.post<ScheduleEntry>('http://localhost:8080/api/timetable', payload).subscribe({
      next: () => {
        this.loadTimetable();
        this.resetForm();
      },
      error: () => {
        alert('Failed to save schedule slot.');
      }
    });
  }

  editEntry(entry: ScheduleEntry): void {
    const idx = this.weeklySchedule.findIndex(e => e.id === entry.id);
    if (idx >= 0) {
      this.editIndex = idx;
      this.currentEntry = { ...entry };
    }
  }

  deleteEntry(entry: ScheduleEntry): void {
    this.http.delete('http://localhost:8080/api/timetable/' + entry.id).subscribe({
      next: () => {
        this.loadTimetable();
      },
      error: () => {
        alert('Failed to delete schedule slot.');
      }
    });
  }

  resetForm(): void {
    this.editIndex = -1;
    this.currentEntry = this.createEmptyEntry();
  }
}
