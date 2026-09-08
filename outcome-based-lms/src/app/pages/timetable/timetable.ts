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
  isAdjusted?: boolean;
  substituteName?: string;
  requesterName?: string;
  topicInstructions?: string;
  isExtraClass?: boolean;
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
            <div class="header-text-group">
                <h1>🗓️ Timetable & Schedules</h1>
                <p>Weekly classroom assignments, theory lectures, practical labs, and balanced leisure/library slots.</p>
            </div>
            <div class="faculty-context-badge" *ngIf="role === 'faculty'">
                <span class="badge-role">👨‍🏫 Faculty Schedule</span>
                <span class="badge-dept">{{ userDept }}</span>
            </div>
        </div>

        <!-- Faculty Assigned Subjects Banner -->
        <div class="faculty-info-banner" *ngIf="role === 'faculty'">
            <div class="banner-icon">📋</div>
            <div class="banner-text">
                <strong>Assigned Teaching Allocation:</strong>
                <span>{{ facultyAssignedSubjectsDisplay }}</span>
                <small>Schedule is optimized with max 2–3 classes per day and alternating leisure / library / research hours.</small>
            </div>
        </div>

        <div class="summary-grid">
            <div class="section-card">
                <h3>Weekly Classes</h3>
                <strong>{{ totalWeeklyClassesCount }}</strong>
                <p>Total theory lectures & lab sessions this week.</p>
            </div>
            <div class="section-card">
                <h3>Today&apos;s Classes</h3>
                <strong>{{ todayTeachingClassesCount }}</strong>
                <p>Classes scheduled for {{ currentDay }}.</p>
            </div>
            <div class="section-card">
                <h3>Leisure & Self-Study</h3>
                <strong>{{ weeklyLeisureSlotsCount }}</strong>
                <p>Library, sports & self-study slots allocated.</p>
            </div>
            <div class="section-card">
                <h3>Active Rooms</h3>
                <strong>{{ activeRoomsCount }}</strong>
                <p>Unique classrooms, labs & activity zones.</p>
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
                        Subject / Activity Name
                        <input type="text" name="subject" [(ngModel)]="currentEntry.subject" placeholder="e.g. Machine Learning or ☕ Leisure & Self-Study" required />
                    </label>
                    <label>
                        Room / Location
                        <input type="text" name="room" [(ngModel)]="currentEntry.room" placeholder="e.g. LH-301, Lab-4, or Reading Hall" required />
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
                    <h2 style="margin: 0; font-size: 1.25rem; color: #ffffff; font-weight: 800;">📅 Weekly Timetable Matrix</h2>
                    <p style="color: #94a3b8; font-size: 0.88rem; margin: 4px 0 0 0;">2–3 classes per day with alternating leisure & self-study slots. Live-synced with faculty substitutions & extra classes.</p>
                </div>
                <div class="matrix-legend" style="display: flex; gap: 14px; font-size: 12px; font-weight: 600; flex-wrap: wrap;">
                    <span style="display: inline-flex; align-items: center; gap: 5px; color: #fde68a;">
                        <span style="width: 10px; height: 10px; border-radius: 3px; background: rgba(212, 175, 55, 0.2); border: 1px solid #d4af37;"></span> Theory Lecture
                    </span>
                    <span style="display: inline-flex; align-items: center; gap: 5px; color: #34d399;">
                        <span style="width: 10px; height: 10px; border-radius: 3px; background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981;"></span> Lab / Practical
                    </span>
                    <span style="display: inline-flex; align-items: center; gap: 5px; color: #a5b4fc;">
                        <span style="width: 10px; height: 10px; border-radius: 3px; background: rgba(99, 102, 241, 0.2); border: 1px solid #6366f1;"></span> Leisure / Library
                    </span>
                    <span style="display: inline-flex; align-items: center; gap: 5px; color: #38bdf8;">
                        <span style="width: 10px; height: 10px; border-radius: 3px; background: rgba(56, 189, 248, 0.25); border: 1px solid #38bdf8;"></span> 🔄 Substitute Adjustment
                    </span>
                    <span style="display: inline-flex; align-items: center; gap: 5px; color: #c084fc;">
                        <span style="width: 10px; height: 10px; border-radius: 3px; background: rgba(192, 132, 252, 0.25); border: 1px solid #c084fc;"></span> ⭐ Extra Class
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
                                     [class.lab-card]="isLab(slot)"
                                     [class.leisure-card]="isLeisure(slot)"
                                     [class.adjusted-card]="slot.isAdjusted"
                                     [class.extra-card]="slot.isExtraClass"
                                     [title]="slot.isAdjusted ? ('Substituted by ' + slot.substituteName + ' (Covering for ' + slot.requesterName + ')') : (slot.isExtraClass ? 'Extra Remedial Lecture by ' + slot.facultyName : '')">
                                    
                                    <!-- Substitute Tag -->
                                    <div *ngIf="slot.isAdjusted" class="substitute-pill">
                                        🔄 Sub: {{ slot.substituteName }}
                                    </div>
                                    <!-- Extra Class Tag -->
                                    <div *ngIf="slot.isExtraClass" class="extra-pill">
                                        ⭐ Extra Class: {{ slot.facultyName }}
                                    </div>

                                    <div class="slot-subject">{{ slot.subject }}</div>
                                    <div class="slot-room">
                                        {{ isLeisure(slot) ? '📍' : (isLab(slot) ? '🔬' : '🚪') }} {{ slot.room }}
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
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
                <h2 style="margin: 0;">Weekly Timetable List ({{ filteredSchedule.length }})</h2>
                <div *ngIf="role === 'faculty' || role === 'admin'">
                    <a href="/class-adjustments" class="btn btn-secondary" style="font-size: 12px; text-decoration: none; padding: 6px 14px; display: inline-flex; align-items: center; gap: 6px;">
                        🔄 Manage Class Adjustments & Extra Classes
                    </a>
                </div>
            </div>
            
            <!-- Search & Filters -->
            <div class="filter-row">
                <label>
                    Filter by Day:
                    <select [(ngModel)]="dayFilter" (change)="applyFilters()">
                        <option value="">All Days</option>
                        <option *ngFor="let d of days" [value]="d">{{ d }}</option>
                    </select>
                </label>
                <label>
                    Type Filter:
                    <select [(ngModel)]="typeFilter" (change)="applyFilters()">
                        <option value="">All Slots</option>
                        <option value="adjusted">🔄 Only Adjusted Slots</option>
                        <option value="extra">⭐ Only Extra Classes</option>
                        <option value="classes">📚 Regular Classes Only</option>
                        <option value="leisure">☕ Leisure & Self-Study</option>
                    </select>
                </label>
                <label>
                    Search Subject / Room / Faculty:
                    <input type="text" [(ngModel)]="searchSubject" (input)="applyFilters()" placeholder="Filter subjects or substitute faculty..." />
                </label>
            </div>

            <table class="list-table">
                <thead>
                    <tr>
                        <th>Day</th>
                        <th>Period</th>
                        <th>Subject / Activity</th>
                        <th>Location</th>
                        <th>Faculty / Substitution</th>
                        <th *ngIf="role === 'admin' || role === 'faculty'">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let entry of filteredSchedule">
                        <td><strong>{{ entry.day }}</strong></td>
                        <td>{{ entry.period }}</td>
                        <td>
                            <span [style.color]="isLeisure(entry) ? '#a5b4fc' : (isLab(entry) ? '#34d399' : '#ffffff')">
                                {{ entry.subject }}
                            </span>
                            <span *ngIf="entry.isExtraClass" class="extra-badge-pill">⭐ Extra Lecture</span>
                        </td>
                        <td><span class="room-badge">{{ entry.room }}</span></td>
                        <td>
                            <div *ngIf="entry.isAdjusted" class="substitute-info-box">
                                <span class="sub-name">🔄 <strong>{{ entry.substituteName }}</strong></span>
                                <small class="sub-for">Covering for: {{ entry.requesterName }}</small>
                            </div>
                            <div *ngIf="entry.isExtraClass" class="extra-info-box">
                                <span style="color: #c084fc; font-weight: 700;">👨‍🏫 {{ entry.facultyName || 'Faculty' }}</span>
                            </div>
                            <span *ngIf="!entry.isAdjusted && !entry.isExtraClass" style="color: #94a3b8; font-size: 12px;">
                                Regular Department Faculty
                            </span>
                        </td>
                        <td *ngIf="role === 'admin' || role === 'faculty'" class="actions-cell">
                            <button class="edit-btn" (click)="editEntry(entry)">Edit</button>
                            <button class="danger" (click)="deleteEntry(entry)">Delete</button>
                        </td>
                    </tr>
                    <tr *ngIf="filteredSchedule.length === 0">
                        <td [attr.colspan]="(role === 'admin' || role === 'faculty') ? 6 : 5" class="empty-state">No schedule slots match your search.</td>
                    </tr>
                </tbody>
            </table>
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

    .page-header h1 {
      font-size: 1.8rem;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 4px 0;
    }

    .page-header p {
      color: #94a3b8;
      font-size: 0.95rem;
      margin: 0;
    }

    .faculty-context-badge {
      background: #101b38;
      border: 1px solid #1f2f54;
      padding: 8px 14px;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .badge-role {
      font-size: 11px;
      color: #d4af37;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-dept {
      font-size: 13px;
      color: #ffffff;
      font-weight: 700;
    }

    .faculty-info-banner {
      background: linear-gradient(135deg, #101b38 0%, #1a2a50 100%);
      border: 1px solid #1f2f54;
      border-left: 4px solid #d4af37;
      padding: 14px 18px;
      border-radius: 12px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    }

    .banner-icon {
      font-size: 1.8rem;
    }

    .banner-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 0.9rem;
      color: #e2e8f0;
    }

    .banner-text strong {
      color: #d4af37;
    }

    .banner-text span {
      color: #ffffff;
      font-weight: 700;
    }

    .banner-text small {
      color: #94a3b8;
      font-size: 0.8rem;
      margin-top: 2px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .section-card {
      background: #101b38;
      border: 1px solid #1f2f54;
      border-radius: 12px;
      padding: 16px 20px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    }

    .section-card h3 {
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
      margin: 0 0 6px 0;
    }

    .section-card strong {
      font-size: 1.7rem;
      color: #ffffff;
      font-weight: 800;
    }

    .section-card p {
      font-size: 0.8rem;
      color: #64748b;
      margin: 4px 0 0 0;
    }

    .table-card {
      background: #101b38;
      border: 1px solid #1f2f54;
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 24px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    }

    .matrix-container {
      padding: 20px;
    }

    .table-scroll-wrapper {
      overflow-x: auto;
      border-radius: 10px;
      border: 1px solid #1f2f54;
    }

    .tt-matrix-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      min-width: 820px;
    }

    .tt-matrix-table th {
      background: #0d1730;
      color: #cbd5e1;
      padding: 12px 10px;
      font-size: 12px;
      font-weight: 700;
      border-bottom: 2px solid #1f2f54;
      border-right: 1px solid #1f2f54;
      text-align: center;
    }

    .day-col-header {
      width: 110px;
      background: #091024 !important;
      color: #d4af37 !important;
    }

    .period-col-header {
      min-width: 135px;
    }

    .period-icon {
      margin-right: 4px;
    }

    .tt-matrix-table td {
      border-bottom: 1px solid #1f2f54;
      border-right: 1px solid #1f2f54;
      vertical-align: middle;
    }

    td.day-cell {
      background: #0d1730;
      text-align: center;
      padding: 8px !important;
    }

    .day-badge {
      font-size: 13px;
      font-weight: 700;
      color: #e2e8f0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .today-row td.day-cell {
      background: #18284e;
      border-left: 3px solid #d4af37;
    }

    .today-row td.slot-cell {
      background-color: rgba(212, 175, 55, 0.06) !important;
    }

    .today-badge {
      color: #fde68a;
      font-weight: 800;
    }

    .today-tag {
      font-size: 9px;
      background: #d4af37;
      color: #0a1128;
      padding: 1px 5px;
      border-radius: 4px;
      font-weight: 800;
      letter-spacing: 0.04em;
    }

    td.slot-cell {
      height: 80px;
      padding: 6px !important;
      background: #091024;
    }

    .matrix-slot-card {
      background: #101b38;
      border: 1px solid #1f2f54;
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
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
      border-color: #d4af37;
    }

    .matrix-slot-card.lab-card {
      background: rgba(16, 185, 129, 0.15);
      border-color: rgba(16, 185, 129, 0.35);
    }

    .matrix-slot-card.lab-card .slot-subject {
      color: #34d399;
    }

    .matrix-slot-card.lab-card .slot-room {
      background: rgba(16, 185, 129, 0.25);
      color: #34d399;
      border-color: rgba(16, 185, 129, 0.35);
    }

    .matrix-slot-card.leisure-card {
      background: rgba(99, 102, 241, 0.15);
      border-color: rgba(99, 102, 241, 0.4);
    }

    .matrix-slot-card.leisure-card .slot-subject {
      color: #a5b4fc;
    }

    .matrix-slot-card.leisure-card .slot-room {
      background: rgba(99, 102, 241, 0.25);
      color: #c7d2fe;
      border-color: rgba(99, 102, 241, 0.4);
    }

    .matrix-slot-card.adjusted-card {
      background: linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(16, 27, 56, 0.9) 100%);
      border: 1px solid #38bdf8;
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.2);
    }

    .matrix-slot-card.extra-card {
      background: linear-gradient(135deg, rgba(192, 132, 252, 0.15) 0%, rgba(16, 27, 56, 0.9) 100%);
      border: 1px solid #c084fc;
      box-shadow: 0 0 12px rgba(192, 132, 252, 0.2);
    }

    .substitute-pill {
      background: #0284c7;
      color: #ffffff;
      font-size: 9px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 0.3px;
      white-space: nowrap;
      margin-bottom: 2px;
    }

    .extra-pill {
      background: #9333ea;
      color: #ffffff;
      font-size: 9px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 0.3px;
      white-space: nowrap;
      margin-bottom: 2px;
    }

    .extra-badge-pill {
      display: inline-block;
      margin-left: 8px;
      background: rgba(192, 132, 252, 0.2);
      color: #c084fc;
      border: 1px solid rgba(192, 132, 252, 0.4);
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 10.5px;
      font-weight: 700;
    }

    .substitute-info-box {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .sub-name {
      color: #38bdf8;
      font-size: 13px;
    }

    .sub-for {
      color: #94a3b8;
      font-size: 11px;
    }

    .slot-subject {
      font-size: 11px;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.25;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .slot-room {
      font-size: 10px;
      font-weight: 700;
      color: #fde68a;
      background: #091024;
      border: 1px solid #1f2f54;
      padding: 2px 6px;
      border-radius: 4px;
      white-space: nowrap;
    }

    .empty-slot {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #64748b;
      font-size: 14px;
    }

    /* List Table */
    table.list-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      background: #091024;
    }

    table.list-table th, table.list-table td {
      padding: 12px 10px;
      border-bottom: 1px solid #132247;
      text-align: left;
    }

    table.list-table th {
      font-weight: 700;
      background: #0d1730;
      color: #fde68a;
      font-size: 13px;
    }

    table.list-table td {
      color: #e2e8f0;
    }

    .room-badge {
      background: rgba(59, 130, 246, 0.15);
      color: #93c5fd;
      border: 1px solid rgba(59, 130, 246, 0.35);
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
    }

    .form-card {
      background: #101b38;
      border: 1px solid #1f2f54;
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 24px;
    }

    .form-card h2 {
      margin: 0 0 16px 0;
      font-size: 1.25rem;
      color: #ffffff;
      font-weight: 800;
    }

    .form-card form { display: grid; gap: 16px; }
    .grid-row { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    label { display: flex; flex-direction: column; font-weight: 600; color: #cbd5e1; font-size: 13px; }
    input[type=text], select { margin-top: 6px; padding: 10px 12px; border: 1px solid #1f2f54; border-radius: 8px; font-size: 14px; outline: none; background: #091024; color: #ffffff; }
    input[type=text]:focus, select:focus { border-color: #d4af37; box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.2); }
    
    .form-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }
    .btn { padding: 10px 18px; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 14px; }
    .btn-primary { background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%); color: #0a1128; font-weight: 800; }
    .btn-secondary { background: #16244a; color: #cbd5e1; border: 1px solid #1f2f54; }
    
    .actions-cell { display: flex; gap: 8px; }
    .edit-btn { background: #10b981; color: #0a1128; padding: 6px 12px; font-size: 12px; border: none; border-radius: 4px; cursor: pointer; font-weight: 700; }
    button.danger { background: #ef4444; color: white; padding: 6px 12px; font-size: 12px; border: none; border-radius: 4px; cursor: pointer; font-weight: 700; }
    
    .filter-row { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 16px; background: #0d1730; padding: 14px; border-radius: 10px; border: 1px solid #1f2f54; }
    .filter-row label { flex: 1; min-width: 180px; }
    .filter-row select, .filter-row input { margin-top: 4px; }
    .empty-state { padding: 40px; text-align: center; color: #94a3b8; font-weight: 600; }
    `
  ]
})
export class Timetable implements OnInit {
  role: string | null = null;
  userName: string = '';
  currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  weeklySchedule: ScheduleEntry[] = [];
  filteredSchedule: ScheduleEntry[] = [];
  userAssignedCourses: string[] = [];
  userDept: string = 'Computer Science & Engineering';

  // Visual grid variables
  days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  periods = [
    '09:00 AM - 10:00 AM',
    '10:15 AM - 11:15 AM',
    '11:30 AM - 12:30 PM',
    '02:00 PM - 03:00 PM',
    '03:15 PM - 04:15 PM'
  ];

  get facultyAssignedSubjectsDisplay(): string {
    if (this.userAssignedCourses && this.userAssignedCourses.length > 0) {
      return this.userAssignedCourses.join(', ');
    }
    const d = this.userDept.toLowerCase();
    if (d.includes('civil') || d.includes('ce')) return 'Fluid Mechanics & Hydraulic Machinery (FMHM), Structural Mechanics (SMSE), Surveying Field Practice Lab';
    if (d.includes('mech') || d.includes('me')) return 'Metallurgy & Materials (ME210), Kinematics of Machinery (KM), CAD/CAM Lab';
    if (d.includes('elect') || d.includes('ece')) return 'Microprocessors & Embedded Systems (MES), Digital Systems (DSLD), Hardware Lab';
    if (d.includes('info') || d.includes('it')) return 'Web Technologies (IT305), Linux Programming, Cloud DevOps (CS303)';
    return 'Database Management Systems (CS101), Java & OOPs (CS102), Operating Systems (CS301)';
  }

  isLeisure(slot: ScheduleEntry): boolean {
    if (!slot || !slot.subject) return false;
    const s = slot.subject.toLowerCase();
    const r = (slot.room || '').toLowerCase();
    return s.includes('leisure') || s.includes('free') || s.includes('self-study') || 
           s.includes('library') || s.includes('sports') || s.includes('lounge') ||
           s.includes('recess') || s.includes('break') || s.includes('hobbies') ||
           s.includes('journal') || s.includes('mentoring') ||
           r.includes('library') || r.includes('ground') || r.includes('lounge') || r.includes('zone') || r.includes('reading hall');
  }

  isLab(slot: ScheduleEntry): boolean {
    if (!slot || !slot.subject) return false;
    if (this.isLeisure(slot)) return false;
    const s = slot.subject.toLowerCase();
    const r = (slot.room || '').toLowerCase();
    return s.includes('lab') || r.includes('lab') || s.includes('survey field') || r.includes('survey field') || s.includes('workshop') || r.includes('workshop');
  }

  get totalWeeklyClassesCount(): number {
    return this.weeklySchedule.filter(s => !this.isLeisure(s)).length;
  }

  get weeklyLeisureSlotsCount(): number {
    return this.weeklySchedule.filter(s => this.isLeisure(s)).length;
  }

  get todayTeachingClassesCount(): number {
    return this.todayClasses.filter(s => !this.isLeisure(s)).length;
  }

  // Generate strictly 2 or 3 classes per day with strictly alternating leisure slots (no continuous leisure)
  getBranchSchedule(dept: string): ScheduleEntry[] {
    const d = (dept || '').toLowerCase();

    if (d.includes('civil') || d.includes('ce')) {
      return [
        // Monday: 3 classes, 2 leisure (Alternating: Class -> Leisure -> Class -> Library -> Class)
        { id: 1, day: 'Monday', period: '09:00 AM - 10:00 AM', subject: 'Fluid Mechanics & Hydraulic Machinery (FMHM)', room: 'CE-LH-101' },
        { id: 2, day: 'Monday', period: '10:15 AM - 11:15 AM', subject: '☕ Leisure & Self-Study', room: 'Reading Hall' },
        { id: 3, day: 'Monday', period: '11:30 AM - 12:30 PM', subject: 'Structural Mechanics & Materials (SMSE)', room: 'CE-LH-102' },
        { id: 4, day: 'Monday', period: '02:00 PM - 03:00 PM', subject: '📚 Library & Digital Research', room: 'Central Library' },
        { id: 5, day: 'Monday', period: '03:15 PM - 04:15 PM', subject: 'Principles of Management (HS300)', room: 'CE-LH-204' },

        // Tuesday: 3 classes, 2 leisure (Alternating: Class -> Leisure -> Class -> Lab -> Leisure)
        { id: 6, day: 'Tuesday', period: '09:00 AM - 10:00 AM', subject: 'Engineering Mathematics II (EMII)', room: 'CE-LH-101' },
        { id: 7, day: 'Tuesday', period: '10:15 AM - 11:15 AM', subject: '☕ Leisure & Innovation Cell', room: 'Campus Zone' },
        { id: 8, day: 'Tuesday', period: '11:30 AM - 12:30 PM', subject: 'Concrete Technology & Construction', room: 'CE-LH-204' },
        { id: 9, day: 'Tuesday', period: '02:00 PM - 03:00 PM', subject: 'Surveying Field Practice Lab', room: 'Survey Field' },
        { id: 10, day: 'Tuesday', period: '03:15 PM - 04:15 PM', subject: '☕ Leisure & Peer Mentoring', room: 'Student Lounge' },

        // Wednesday: 2 classes, 3 leisure (Alternating: Class -> Leisure -> Class -> Library -> Sports)
        { id: 11, day: 'Wednesday', period: '09:00 AM - 10:00 AM', subject: 'Geotechnical & Soil Mechanics', room: 'CE-LH-102' },
        { id: 12, day: 'Wednesday', period: '10:15 AM - 11:15 AM', subject: '☕ Leisure & Recess / Hobbies', room: 'Campus Zone' },
        { id: 13, day: 'Wednesday', period: '11:30 AM - 12:30 PM', subject: 'Fluid Mechanics & Hydraulic Machinery (FMHM)', room: 'CE-LH-101' },
        { id: 14, day: 'Wednesday', period: '02:00 PM - 03:00 PM', subject: '📚 Library & Research Hour', room: 'Central Library' },
        { id: 15, day: 'Wednesday', period: '03:15 PM - 04:15 PM', subject: 'Fluid Mechanics & Hydraulics Lab (CE234)', room: 'Fluid Lab' },

        // Thursday: 3 classes, 2 leisure (Alternating: Class -> Leisure -> Class -> Lab -> Library)
        { id: 16, day: 'Thursday', period: '09:00 AM - 10:00 AM', subject: 'Transportation & Highway Engineering', room: 'CE-LH-101' },
        { id: 17, day: 'Thursday', period: '10:15 AM - 11:15 AM', subject: '☕ Leisure & Self-Study', room: 'Reading Hall' },
        { id: 18, day: 'Thursday', period: '11:30 AM - 12:30 PM', subject: 'Structural Analysis & Design (SMSE)', room: 'CE-LH-102' },
        { id: 19, day: 'Thursday', period: '02:00 PM - 03:00 PM', subject: 'Building Planning & CAD Laboratory', room: 'CE-CAD Lab' },
        { id: 20, day: 'Thursday', period: '03:15 PM - 04:15 PM', subject: '📚 Library & Case Studies', room: 'Central Library' },

        // Friday: 3 classes, 2 leisure (Alternating: Class -> Leisure -> Class -> Sports -> Lab)
        { id: 21, day: 'Friday', period: '09:00 AM - 10:00 AM', subject: 'Hydrology & Water Resources Engineering', room: 'CE-LH-101' },
        { id: 22, day: 'Friday', period: '10:15 AM - 11:15 AM', subject: '☕ Leisure & Faculty Consultation', room: 'Faculty Lounge' },
        { id: 23, day: 'Friday', period: '11:30 AM - 12:30 PM', subject: 'Geotechnical & Soil Mechanics', room: 'CE-LH-102' },
        { id: 24, day: 'Friday', period: '02:00 PM - 03:00 PM', subject: '⚽ Sports & Physical Fitness', room: 'Sports Ground' },
        { id: 25, day: 'Friday', period: '03:15 PM - 04:15 PM', subject: 'Geotechnical Material Testing Lab', room: 'Geo Lab' },

        // Saturday: 2 classes, 3 leisure (Alternating: Class -> Leisure -> Class -> Library -> Leisure)
        { id: 26, day: 'Saturday', period: '09:00 AM - 10:00 AM', subject: 'Structural Mechanics & Materials (SMSE)', room: 'CE-LH-102' },
        { id: 27, day: 'Saturday', period: '10:15 AM - 11:15 AM', subject: '☕ Leisure & Project Brainstorming', room: 'Activity Center' },
        { id: 28, day: 'Saturday', period: '11:30 AM - 12:30 PM', subject: 'Technical Seminar & Capstone Mentoring', room: 'Seminar Hall' },
        { id: 29, day: 'Saturday', period: '02:00 PM - 03:00 PM', subject: '📚 Library & Competitive Exam Prep', room: 'Central Library' },
        { id: 30, day: 'Saturday', period: '03:15 PM - 04:15 PM', subject: '☕ Leisure & Weekend Review', room: 'Student Lounge' }
      ];
    } else if (d.includes('mech') || d.includes('me')) {
      return [
        // Monday: 3 classes, 2 leisure
        { id: 1, day: 'Monday', period: '09:00 AM - 10:00 AM', subject: 'Metallurgy & Materials Engineering (ME210)', room: 'ME-LH-101' },
        { id: 2, day: 'Monday', period: '10:15 AM - 11:15 AM', subject: '☕ Leisure & Self-Study', room: 'Reading Hall' },
        { id: 3, day: 'Monday', period: '11:30 AM - 12:30 PM', subject: 'Kinematics of Machinery (KM)', room: 'ME-LH-102' },
        { id: 4, day: 'Monday', period: '02:00 PM - 03:00 PM', subject: '📚 Library & Research Hours', room: 'Central Library' },
        { id: 5, day: 'Monday', period: '03:15 PM - 04:15 PM', subject: 'I C Engines and Combustion (IC)', room: 'ME-LH-204' },

        // Tuesday: 3 classes, 2 leisure
        { id: 6, day: 'Tuesday', period: '09:00 AM - 10:00 AM', subject: 'Strength of Materials & Mechanics (SMSE)', room: 'ME-LH-101' },
        { id: 7, day: 'Tuesday', period: '10:15 AM - 11:15 AM', subject: '☕ Leisure & Innovation Club', room: 'Activity Center' },
        { id: 8, day: 'Tuesday', period: '11:30 AM - 12:30 PM', subject: 'Auto Chassis & Dynamics (AU203)', room: 'ME-LH-204' },
        { id: 9, day: 'Tuesday', period: '02:00 PM - 03:00 PM', subject: 'CAD/CAM Simulation & Modeling (04ME6512)', room: 'CAD Lab' },
        { id: 10, day: 'Tuesday', period: '03:15 PM - 04:15 PM', subject: '☕ Leisure & Peer Mentoring', room: 'Student Lounge' },

        // Wednesday: 2 classes, 3 leisure
        { id: 11, day: 'Wednesday', period: '09:00 AM - 10:00 AM', subject: 'Kinematics of Machinery (KM)', room: 'ME-LH-102' },
        { id: 12, day: 'Wednesday', period: '10:15 AM - 11:15 AM', subject: '☕ Leisure & Recess', room: 'Campus Zone' },
        { id: 13, day: 'Wednesday', period: '11:30 AM - 12:30 PM', subject: 'Metallurgy & Materials Engineering (ME210)', room: 'ME-LH-101' },
        { id: 14, day: 'Wednesday', period: '02:00 PM - 03:00 PM', subject: '📚 Library & Journal Reading', room: 'Central Library' },
        { id: 15, day: 'Wednesday', period: '03:15 PM - 04:15 PM', subject: 'Strength of Materials Lab / Testing', room: 'Mechanics Lab' },

        // Thursday: 3 classes, 2 leisure
        { id: 16, day: 'Thursday', period: '09:00 AM - 10:00 AM', subject: 'I C Engines and Combustion (IC)', room: 'ME-LH-204' },
        { id: 17, day: 'Thursday', period: '10:15 AM - 11:15 AM', subject: '☕ Leisure & Self-Study', room: 'Reading Hall' },
        { id: 18, day: 'Thursday', period: '11:30 AM - 12:30 PM', subject: 'Strength of Materials & Mechanics (SMSE)', room: 'ME-LH-101' },
        { id: 19, day: 'Thursday', period: '02:00 PM - 03:00 PM', subject: 'IC Engines & Automobile Lab', room: 'Auto Lab' },
        { id: 20, day: 'Thursday', period: '03:15 PM - 04:15 PM', subject: '📚 Library & Design Cases', room: 'Central Library' },

        // Friday: 3 classes, 2 leisure
        { id: 21, day: 'Friday', period: '09:00 AM - 10:00 AM', subject: 'Auto Chassis & Dynamics (AU203)', room: 'ME-LH-204' },
        { id: 22, day: 'Friday', period: '10:15 AM - 11:15 AM', subject: '☕ Leisure & Faculty Consultation', room: 'Faculty Lounge' },
        { id: 23, day: 'Friday', period: '11:30 AM - 12:30 PM', subject: 'Engineering Mathematics IV (EM IV)', room: 'ME-LH-102' },
        { id: 24, day: 'Friday', period: '02:00 PM - 03:00 PM', subject: '⚽ Sports & Physical Fitness', room: 'Sports Ground' },
        { id: 25, day: 'Friday', period: '03:15 PM - 04:15 PM', subject: 'Mechatronics & Robotics Workshop', room: 'ME-LH-204' },

        // Saturday: 2 classes, 3 leisure
        { id: 26, day: 'Saturday', period: '09:00 AM - 10:00 AM', subject: 'Industrial Engineering & Operations', room: 'ME-LH-101' },
        { id: 27, day: 'Saturday', period: '10:15 AM - 11:15 AM', subject: '☕ Leisure & Project Brainstorming', room: 'Activity Center' },
        { id: 28, day: 'Saturday', period: '11:30 AM - 12:30 PM', subject: 'Mini-Project Review & Technical Viva', room: 'CAD Lab' },
        { id: 29, day: 'Saturday', period: '02:00 PM - 03:00 PM', subject: '📚 Library & CAD Modeling', room: 'Central Library' },
        { id: 30, day: 'Saturday', period: '03:15 PM - 04:15 PM', subject: '☕ Leisure & Weekend Review', room: 'Student Lounge' }
      ];
    } else if (d.includes('elect') || d.includes('ece')) {
      return [
        { id: 1, day: 'Monday', period: '09:00 AM - 10:00 AM', subject: 'Microprocessors & Embedded Systems (MES)', room: 'EC-LH-101' },
        { id: 2, day: 'Monday', period: '10:15 AM - 11:15 AM', subject: 'Digital Systems & Logic Designs (DSLD)', room: 'EC-LH-102' },
        { id: 3, day: 'Monday', period: '11:30 AM - 12:30 PM', subject: 'Computer Organization (EC206)', room: 'EC-LH-101' },
        { id: 4, day: 'Monday', period: '02:00 PM - 03:00 PM', subject: 'Digital Signal Processing (EE407)', room: 'EC-LH-204' },
        { id: 5, day: 'Monday', period: '03:15 PM - 04:15 PM', subject: 'Analog & Digital Communication (CS203)', room: 'EC-LH-204' },

        { id: 6, day: 'Tuesday', period: '09:00 AM - 10:00 AM', subject: 'Digital Systems & Logic Designs (DSLD)', room: 'EC-LH-102' },
        { id: 7, day: 'Tuesday', period: '10:15 AM - 11:15 AM', subject: 'Microprocessors & Embedded Systems (MES)', room: 'EC-LH-101' },
        { id: 8, day: 'Tuesday', period: '11:30 AM - 12:30 PM', subject: 'Digital Signal Processing (EE407)', room: 'EC-LH-204' },
        { id: 9, day: 'Tuesday', period: '02:00 PM - 03:00 PM', subject: 'Microprocessors & Hardware Lab', room: 'Hardware Lab' },
        { id: 10, day: 'Tuesday', period: '03:15 PM - 04:15 PM', subject: 'Microprocessors & Hardware Lab', room: 'Hardware Lab' },

        { id: 11, day: 'Wednesday', period: '09:00 AM - 10:00 AM', subject: 'Computer Organization (EC206)', room: 'EC-LH-101' },
        { id: 12, day: 'Wednesday', period: '10:15 AM - 11:15 AM', subject: 'Analog & Digital Communication (CS203)', room: 'EC-LH-204' },
        { id: 13, day: 'Wednesday', period: '11:30 AM - 12:30 PM', subject: 'Microprocessors & Embedded Systems (MES)', room: 'EC-LH-101' },
        { id: 14, day: 'Wednesday', period: '02:00 PM - 03:00 PM', subject: 'VLSI Circuit Design & Verilog Modeling', room: 'EC-LH-102' },
        { id: 15, day: 'Wednesday', period: '03:15 PM - 04:15 PM', subject: 'Technical Seminar & Research Discussion', room: 'Seminar Hall' },

        { id: 16, day: 'Thursday', period: '09:00 AM - 10:00 AM', subject: 'Digital Signal Processing (EE407)', room: 'EC-LH-204' },
        { id: 17, day: 'Thursday', period: '10:15 AM - 11:15 AM', subject: 'Computer Organization (EC206)', room: 'EC-LH-101' },
        { id: 18, day: 'Thursday', period: '11:30 AM - 12:30 PM', subject: 'Digital Systems & Logic Designs (DSLD)', room: 'EC-LH-102' },
        { id: 19, day: 'Thursday', period: '02:00 PM - 03:00 PM', subject: 'Logic Design & Simulation Lab (LD LAB)', room: 'Logic Lab' },
        { id: 20, day: 'Thursday', period: '03:15 PM - 04:15 PM', subject: 'Logic Design & Simulation Lab (LD LAB)', room: 'Logic Lab' },

        { id: 21, day: 'Friday', period: '09:00 AM - 10:00 AM', subject: 'Analog & Digital Communication (CS203)', room: 'EC-LH-204' },
        { id: 22, day: 'Friday', period: '10:15 AM - 11:15 AM', subject: 'Microprocessors & Embedded Systems (MES)', room: 'EC-LH-101' },
        { id: 23, day: 'Friday', period: '11:30 AM - 12:30 PM', subject: 'Digital Systems & Logic Designs (DSLD)', room: 'EC-LH-102' },
        { id: 24, day: 'Friday', period: '02:00 PM - 03:00 PM', subject: 'Embedded IoT & Robotics Workshop', room: 'IoT Lab' },
        { id: 25, day: 'Friday', period: '03:15 PM - 04:15 PM', subject: 'Outcome-Based Remedial & Mentoring', room: 'EC-LH-101' },

        { id: 26, day: 'Saturday', period: '09:00 AM - 10:00 AM', subject: 'Wireless & Optical Communications', room: 'EC-LH-101' },
        { id: 27, day: 'Saturday', period: '10:15 AM - 11:15 AM', subject: 'Hardware Mini-Project Evaluation', room: 'Hardware Lab' },
        { id: 28, day: 'Saturday', period: '11:30 AM - 12:30 PM', subject: 'Expert Guest Lecture / Webinar', room: 'Seminar Hall' },
        { id: 29, day: 'Saturday', period: '02:00 PM - 03:00 PM', subject: 'Library & Reading Session', room: 'Central Library' },
        { id: 30, day: 'Saturday', period: '03:15 PM - 04:15 PM', subject: 'Sports & Student Clubs', room: 'Campus Ground' }
      ];
    } else if (d.includes('info') || d.includes('it')) {
      return [
        { id: 1, day: 'Monday', period: '09:00 AM - 10:00 AM', subject: 'Operating Systems & Systems Programming (IT305)', room: 'IT-LH-101' },
        { id: 2, day: 'Monday', period: '10:15 AM - 11:15 AM', subject: 'Linux & Shell Programming (Linux)', room: 'IT-LH-102' },
        { id: 3, day: 'Monday', period: '11:30 AM - 12:30 PM', subject: 'Web Technologies & Frameworks (WT)', room: 'IT-LH-101' },
        { id: 4, day: 'Monday', period: '02:00 PM - 03:00 PM', subject: 'Soft Computing (CS361)', room: 'IT-LH-204' },
        { id: 5, day: 'Monday', period: '03:15 PM - 04:15 PM', subject: 'Database Systems & SQL (CS303)', room: 'IT-LH-204' },

        { id: 6, day: 'Tuesday', period: '09:00 AM - 10:00 AM', subject: 'Linux & Shell Programming (Linux)', room: 'IT-LH-102' },
        { id: 7, day: 'Tuesday', period: '10:15 AM - 11:15 AM', subject: 'Web Technologies & Frameworks (WT)', room: 'IT-LH-101' },
        { id: 8, day: 'Tuesday', period: '11:30 AM - 12:30 PM', subject: 'Operating Systems & Systems Programming (IT305)', room: 'IT-LH-101' },
        { id: 9, day: 'Tuesday', period: '02:00 PM - 03:00 PM', subject: 'Linux & Open Source Lab', room: 'Linux Lab' },
        { id: 10, day: 'Tuesday', period: '03:15 PM - 04:15 PM', subject: 'Linux & Open Source Lab', room: 'Linux Lab' },

        { id: 11, day: 'Wednesday', period: '09:00 AM - 10:00 AM', subject: 'Database Systems & SQL (CS303)', room: 'IT-LH-204' },
        { id: 12, day: 'Wednesday', period: '10:15 AM - 11:15 AM', subject: 'Soft Computing (CS361)', room: 'IT-LH-204' },
        { id: 13, day: 'Wednesday', period: '11:30 AM - 12:30 PM', subject: 'Web Technologies & Frameworks (WT)', room: 'IT-LH-101' },
        { id: 14, day: 'Wednesday', period: '02:00 PM - 03:00 PM', subject: 'Full-Stack Web Development Workshop', room: 'Web Lab' },
        { id: 15, day: 'Wednesday', period: '03:15 PM - 04:15 PM', subject: 'Technical Seminar & Code Review', room: 'Seminar Hall' },

        { id: 16, day: 'Thursday', period: '09:00 AM - 10:00 AM', subject: 'Operating Systems & Systems Programming (IT305)', room: 'IT-LH-101' },
        { id: 17, day: 'Thursday', period: '10:15 AM - 11:15 AM', subject: 'Database Systems & SQL (CS303)', room: 'IT-LH-204' },
        { id: 18, day: 'Thursday', period: '11:30 AM - 12:30 PM', subject: 'Linux & Shell Programming (Linux)', room: 'IT-LH-102' },
        { id: 19, day: 'Thursday', period: '02:00 PM - 03:00 PM', subject: 'Web Technologies Practical Lab', room: 'Web Lab' },
        { id: 20, day: 'Thursday', period: '03:15 PM - 04:15 PM', subject: 'Web Technologies Practical Lab', room: 'Web Lab' },

        { id: 21, day: 'Friday', period: '09:00 AM - 10:00 AM', subject: 'Soft Computing (CS361)', room: 'IT-LH-204' },
        { id: 22, day: 'Friday', period: '10:15 AM - 11:15 AM', subject: 'Operating Systems & Systems Programming (IT305)', room: 'IT-LH-101' },
        { id: 23, day: 'Friday', period: '11:30 AM - 12:30 PM', subject: 'Web Technologies & Frameworks (WT)', room: 'IT-LH-101' },
        { id: 24, day: 'Friday', period: '02:00 PM - 03:00 PM', subject: 'Cyber Security & Network Forensics', room: 'IT-LH-102' },
        { id: 25, day: 'Friday', period: '03:15 PM - 04:15 PM', subject: 'Outcome-Based Remedial & Mentoring', room: 'IT-LH-101' },

        { id: 26, day: 'Saturday', period: '09:00 AM - 10:00 AM', subject: 'Cloud Infrastructure & DevOps Practicum', room: 'IT-LH-101' },
        { id: 27, day: 'Saturday', period: '10:15 AM - 11:15 AM', subject: 'Capstone Project Evaluation & Viva', room: 'Web Lab' },
        { id: 28, day: 'Saturday', period: '11:30 AM - 12:30 PM', subject: 'Industry Expert Guest Lecture', room: 'Seminar Hall' },
        { id: 29, day: 'Saturday', period: '02:00 PM - 03:00 PM', subject: 'Library & Reading Session', room: 'Central Library' },
        { id: 30, day: 'Saturday', period: '03:15 PM - 04:15 PM', subject: 'Sports & Student Clubs', room: 'Campus Ground' }
      ];
    }
    
    // Default CSE Schedule (Monday to Saturday, 5 periods each day, completely balanced)
    return [
      { id: 1, day: 'Monday', period: '09:00 AM - 10:00 AM', subject: 'Database Management Systems (CS101)', room: 'LH-101' },
      { id: 2, day: 'Monday', period: '10:15 AM - 11:15 AM', subject: 'Data Structures & Algorithms (CS103)', room: 'LH-204' },
      { id: 3, day: 'Monday', period: '11:30 AM - 12:30 PM', subject: 'Operating Systems (CS301)', room: 'LH-101' },
      { id: 4, day: 'Monday', period: '02:00 PM - 03:00 PM', subject: 'Java & OOPs Programming (CS102)', room: 'LH-305' },
      { id: 5, day: 'Monday', period: '03:15 PM - 04:15 PM', subject: 'Computer Networks (CS302)', room: 'Lab-2B' },

      { id: 6, day: 'Tuesday', period: '09:00 AM - 10:00 AM', subject: 'Java & OOPs Programming (CS102)', room: 'LH-204' },
      { id: 7, day: 'Tuesday', period: '10:15 AM - 11:15 AM', subject: 'Computer Networks (CS302)', room: 'LH-101' },
      { id: 8, day: 'Tuesday', period: '11:30 AM - 12:30 PM', subject: 'Database Management Systems (CS101)', room: 'LH-305' },
      { id: 9, day: 'Tuesday', period: '02:00 PM - 03:00 PM', subject: 'Database & SQL Lab Session', room: 'Lab-4A' },
      { id: 10, day: 'Tuesday', period: '03:15 PM - 04:15 PM', subject: 'Database & SQL Lab Session', room: 'Lab-4A' },

      { id: 11, day: 'Wednesday', period: '09:00 AM - 10:00 AM', subject: 'Operating Systems (CS301)', room: 'LH-101' },
      { id: 12, day: 'Wednesday', period: '10:15 AM - 11:15 AM', subject: 'Database Management Systems (CS101)', room: 'LH-305' },
      { id: 13, day: 'Wednesday', period: '11:30 AM - 12:30 PM', subject: 'Data Structures & Algorithms (CS103)', room: 'LH-204' },
      { id: 14, day: 'Wednesday', period: '02:00 PM - 03:00 PM', subject: 'Discrete Mathematics & Graph Theory', room: 'LH-101' },
      { id: 15, day: 'Wednesday', period: '03:15 PM - 04:15 PM', subject: 'Technical Seminar & OBE Review', room: 'Seminar Hall' },

      { id: 16, day: 'Thursday', period: '09:00 AM - 10:00 AM', subject: 'Data Structures & Algorithms (CS103)', room: 'LH-305' },
      { id: 17, day: 'Thursday', period: '10:15 AM - 11:15 AM', subject: 'Operating Systems (CS301)', room: 'LH-101' },
      { id: 18, day: 'Thursday', period: '11:30 AM - 12:30 PM', subject: 'Java & OOPs Programming (CS102)', room: 'LH-204' },
      { id: 19, day: 'Thursday', period: '02:00 PM - 03:00 PM', subject: 'Java & OOPs Practical Lab', room: 'Lab-2B' },
      { id: 20, day: 'Thursday', period: '03:15 PM - 04:15 PM', subject: 'Java & OOPs Practical Lab', room: 'Lab-2B' },

      { id: 21, day: 'Friday', period: '09:00 AM - 10:00 AM', subject: 'Computer Networks (CS302)', room: 'LH-305' },
      { id: 22, day: 'Friday', period: '10:15 AM - 11:15 AM', subject: 'Java & OOPs Programming (CS102)', room: 'LH-101' },
      { id: 23, day: 'Friday', period: '11:30 AM - 12:30 PM', subject: 'Database Management Systems (CS101)', room: 'LH-204' },
      { id: 24, day: 'Friday', period: '02:00 PM - 03:00 PM', subject: 'Cloud Computing & DevOps Workshop', room: 'LH-101' },
      { id: 25, day: 'Friday', period: '03:15 PM - 04:15 PM', subject: 'Outcome-Based Assessment / Remedial', room: 'LH-204' },

      { id: 26, day: 'Saturday', period: '09:00 AM - 10:00 AM', subject: 'Software Engineering & Agile Methodologies', room: 'LH-204' },
      { id: 27, day: 'Saturday', period: '10:15 AM - 11:15 AM', subject: 'Mini-Project Review & Coding Practice', room: 'Lab-4A' },
      { id: 28, day: 'Saturday', period: '11:30 AM - 12:30 PM', subject: 'Industry Expert Guest Lecture / Webinar', room: 'Seminar Hall' },
      { id: 29, day: 'Saturday', period: '02:00 PM - 03:00 PM', subject: 'Library & Reading Session', room: 'Central Library' },
      { id: 30, day: 'Saturday', period: '03:15 PM - 04:15 PM', subject: 'Sports & Student Clubs', room: 'Campus Ground' }
    ];
  }

  // Form bindings
  currentEntry: ScheduleEntry = this.createEmptyEntry();
  editIndex = -1;

  // Filters
  dayFilter = '';
  typeFilter = '';
  searchSubject = '';

  approvedAdjustments: any[] = [];
  extraClasses: any[] = [];

  constructor(private http: HttpClient) {
    try {
      this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
      this.userName = localStorage.getItem('userName') || '';
      const email = (localStorage.getItem('userEmail') || '').toLowerCase();
      const name = (this.userName || '').toLowerCase();
      const storedDept = localStorage.getItem('userDepartment') || localStorage.getItem('userDept') || '';

      // Auto-detect student department accurately
      if (email.includes('krishna') || name.includes('krishna') || (!storedDept && email.includes('cse'))) {
        this.userDept = 'Computer Science & Engineering';
      } else if (storedDept) {
        this.userDept = storedDept;
      } else {
        this.userDept = storedDept || 'Computer Science & Engineering';
      }

      const storedAssigned = localStorage.getItem('userAssignedCourses');
      if (storedAssigned) {
        this.userAssignedCourses = JSON.parse(storedAssigned);
      }
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
    const branchFallback = this.getBranchSchedule(this.userDept);

    // Load backend timetable slots if applicable
    this.http.get<ScheduleEntry[]>('http://localhost:8080/api/timetable').subscribe({
      next: (data) => {
        const isCSE = this.userDept.toLowerCase().includes('computer') || this.userDept.toLowerCase().includes('cse');
        if (Array.isArray(data) && data.length >= 25 && isCSE && this.role !== 'faculty' && this.role !== 'student') {
          this.weeklySchedule = data;
        } else {
          this.weeklySchedule = branchFallback;
        }
        this.loadAdjustmentsAndOverlay();
      },
      error: () => {
        this.weeklySchedule = branchFallback;
        this.loadAdjustmentsAndOverlay();
      }
    });
  }

  private loadAdjustmentsAndOverlay(): void {
    // 1. Fetch Class Adjustments from API / Local Storage
    this.http.get<any[]>('http://localhost:8080/api/class-adjustments').subscribe({
      next: (adjustments) => {
        if (Array.isArray(adjustments) && adjustments.length > 0) {
          this.approvedAdjustments = adjustments.filter(a => a.status === 'APPROVED' || a.notifiedStudents);
        } else {
          this.loadLocalAdjustments();
        }
        this.overlayAdjustmentsAndExtraClasses();
      },
      error: () => {
        this.loadLocalAdjustments();
        this.overlayAdjustmentsAndExtraClasses();
      }
    });
  }

  private loadLocalAdjustments(): void {
    try {
      const stored = localStorage.getItem('obslmsClassAdjustments');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.approvedAdjustments = parsed.filter((a: any) => a.status === 'APPROVED' || a.notifiedStudents);
          return;
        }
      }
    } catch {}

    // Fallback sample approved adjustment for live display
    this.approvedAdjustments = [
      {
        id: 1,
        courseName: 'Fluid Mechanics & Hydraulic Machinery (FMHM)',
        substituteName: 'Prof. Sunita Sharma',
        requesterName: 'Prof. Ramesh Babu',
        adjustmentDate: '2026-09-10',
        period: '09:00 AM - 10:00 AM',
        room: 'CE-LH-101',
        status: 'APPROVED'
      }
    ];
  }

  private overlayAdjustmentsAndExtraClasses(): void {
    // Load extra classes from local storage
    try {
      const storedExtra = localStorage.getItem('obslmsExtraClasses');
      if (storedExtra) {
        this.extraClasses = JSON.parse(storedExtra);
      }
    } catch {}

    // 1. Overlay Adjustments
    this.weeklySchedule.forEach(slot => {
      // Normalize comparison strings
      const sSubject = (slot.subject || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const sPeriod = (slot.period || '').trim().toLowerCase().split(' - ')[0].trim();

      const matchedAdj = this.approvedAdjustments.find(a => {
        const aSubject = (a.courseName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const aPeriod = (a.period || '').trim().toLowerCase().split(' - ')[0].trim();
        
        const subjectMatch = sSubject.includes(aSubject) || aSubject.includes(sSubject);
        const periodMatch = sPeriod === aPeriod;

        let dayMatch = true;
        if (a.adjustmentDate) {
          try {
            const adjDay = new Date(a.adjustmentDate).toLocaleDateString('en-US', { weekday: 'long' });
            if (adjDay && slot.day) {
              dayMatch = adjDay.toLowerCase() === slot.day.toLowerCase();
            }
          } catch {}
        }

        return (subjectMatch && periodMatch) || (subjectMatch && dayMatch);
      });

      if (matchedAdj) {
        slot.isAdjusted = true;
        slot.substituteName = matchedAdj.substituteName;
        slot.requesterName = matchedAdj.requesterName;
        slot.topicInstructions = matchedAdj.topicInstructions;
      }
    });

    // 2. Overlay Extra Classes
    if (Array.isArray(this.extraClasses) && this.extraClasses.length > 0) {
      this.extraClasses.forEach(extra => {
        const targetDay = (extra.day || 'Monday').toLowerCase();
        const targetPeriodStart = (extra.period || '09:00 AM').split(' - ')[0].trim().toLowerCase();

        const existingSlot = this.weeklySchedule.find(s => 
          s.day.toLowerCase() === targetDay && 
          (s.period || '').toLowerCase().startsWith(targetPeriodStart)
        );

        if (existingSlot) {
          existingSlot.subject = extra.courseName;
          existingSlot.room = extra.room;
          existingSlot.facultyName = extra.facultyName;
          existingSlot.isExtraClass = true;
        } else {
          this.weeklySchedule.push({
            id: Date.now() + Math.floor(Math.random() * 1000),
            day: extra.day,
            period: extra.period,
            subject: extra.courseName,
            room: extra.room,
            facultyName: extra.facultyName,
            isExtraClass: true
          });
        }
      });
    }

    this.applyFilters();
  }

  getSlot(day: string, period: string): ScheduleEntry | null {
    const target = period.trim().toLowerCase();
    const targetStart = target.split(' - ')[0].trim();
    
    return this.weeklySchedule.find(s => {
      if (s.day.toLowerCase() !== day.toLowerCase()) return false;
      const sPeriod = (s.period || '').trim().toLowerCase();
      if (sPeriod === target) return true;
      const sStart = sPeriod.split(' - ')[0].trim();
      return sStart === targetStart;
    }) || null;
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

    if (this.typeFilter) {
      if (this.typeFilter === 'adjusted') {
        result = result.filter(e => e.isAdjusted === true);
      } else if (this.typeFilter === 'extra') {
        result = result.filter(e => e.isExtraClass === true);
      } else if (this.typeFilter === 'classes') {
        result = result.filter(e => !this.isLeisure(e) && !e.isExtraClass);
      } else if (this.typeFilter === 'leisure') {
        result = result.filter(e => this.isLeisure(e));
      }
    }

    if (this.searchSubject.trim()) {
      const q = this.searchSubject.toLowerCase();
      result = result.filter(e => 
        e.subject.toLowerCase().includes(q) || 
        (e.room && e.room.toLowerCase().includes(q)) ||
        (e.substituteName && e.substituteName.toLowerCase().includes(q)) ||
        (e.facultyName && e.facultyName.toLowerCase().includes(q))
      );
    }

    // Sort by Day and Period
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
