import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../shared/services/toast.service';
import { NavigationService } from '../../shared/services/navigation.service';

export interface ScheduleEntry {
  id: number;
  day: string;
  period: string;
  subject: string;
  room: string;
  facultyName?: string;
  batch?: string;
  isTeaching?: boolean;
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

        <!-- Page Header -->
        <div class="page-header">
            <div class="header-text-group">
                <div class="page-back-nav-bar" style="margin-bottom: 8px;">
                    <button type="button" class="btn-page-back" (click)="goBack()">
                        <span class="material-icons">arrow_back</span>
                        <span>Back to Dashboard</span>
                    </button>
                    <span class="nav-sep">|</span>
                    <span class="page-category-hint">Academic Schedules</span>
                </div>
                <div class="header-tag-line">
                    <span class="pulse-dot"></span>
                    <span>OUTCOME-BASED ACADEMIC TIMETABLE SYSTEM</span>
                </div>
                <h1>🗓️ Timetable & Academic Schedules</h1>
                <p>Synchronized weekly theory lectures, lab practicums, faculty research duties, and balanced daily leisure rotations.</p>
            </div>
            
            <div class="header-right-actions">
                <a *ngIf="role === 'faculty' || role === 'admin'" href="/class-adjustments" class="btn btn-adjustments">
                    🔄 Manage Class Adjustments
                </a>

                <!-- Faculty Header Badge -->
                <div class="context-badge faculty-badge" *ngIf="role === 'faculty'">
                    <span class="badge-sub">👨‍🏫 Logged-in Faculty</span>
                    <strong class="badge-main">{{ userName || 'Dr. Ramesh Babu' }}</strong>
                    <span class="badge-dept-tag">{{ userDept }}</span>
                </div>
                <!-- Student Header Badge -->
                <div class="context-badge student-badge" *ngIf="role === 'student'">
                    <span class="badge-sub">🎓 Student Timetable</span>
                    <strong class="badge-main">{{ userDept }}</strong>
                    <span class="badge-dept-tag">Semester 3 • Sec A</span>
                </div>
                <!-- Admin Header Badge -->
                <div class="context-badge admin-badge" *ngIf="role === 'admin'">
                    <span class="badge-sub">⚡ Institutional Admin</span>
                    <strong class="badge-main">Master Schedule Control</strong>
                </div>
            </div>
        </div>

        <!-- Faculty View Mode Switcher (My Schedule vs Department Master) -->
        <div class="view-mode-bar" *ngIf="role === 'faculty' || role === 'admin'">
            <div class="tab-group">
                <button type="button" class="view-tab-btn" 
                        [class.active-tab]="activeViewMode === 'faculty'" 
                        (click)="setViewMode('faculty')">
                    👨‍🏫 My Personal Faculty Schedule
                </button>
                <button type="button" class="view-tab-btn" 
                        [class.active-tab]="activeViewMode === 'department'" 
                        (click)="setViewMode('department')">
                    🏫 {{ userDept }} Master Timetable
                </button>
            </div>
            <div class="view-mode-hint" *ngIf="activeViewMode === 'faculty'">
                <span>✨ Showing strictly your teaching slots & academic responsibilities. No other faculty clutter.</span>
            </div>
            <div class="view-mode-hint" *ngIf="activeViewMode === 'department'">
                <span>📋 Showing complete departmental class timetable synchronized 1:1 with students.</span>
            </div>
        </div>

        <!-- Faculty Teaching Allocation Summary Banner -->
        <div class="faculty-info-banner" *ngIf="role === 'faculty'">
            <div class="banner-icon">📋</div>
            <div class="banner-text">
                <div class="banner-title-row">
                    <strong>Assigned Teaching Portfolio (1:1 Student Sync):</strong>
                    <span class="sync-pill">✅ 100% Student Schedule Synchronized</span>
                </div>
                <div class="assigned-courses-list">{{ facultyAssignedSubjectsDisplay }}</div>
                <small>Your teaching lectures & labs are locked 1:1 with student timetables. Non-teaching hours feature rotating research, doubt clearing, and leisure slots.</small>
            </div>
        </div>

        <!-- 4 Stat Summary Cards -->
        <div class="summary-grid">
            <div class="section-card stat-primary">
                <div class="stat-header">
                    <h3>Weekly Teaching Classes</h3>
                    <span class="stat-icon">📖</span>
                </div>
                <strong>{{ totalWeeklyClassesCount }}</strong>
                <p>Theory lectures & practical lab sessions this week.</p>
            </div>
            <div class="section-card stat-success">
                <div class="stat-header">
                    <h3>Today's Schedule ({{ currentDay }})</h3>
                    <span class="stat-icon">⏰</span>
                </div>
                <strong>{{ todayTeachingClassesCount }} Slots</strong>
                <p>{{ todayTeachingClassesCount > 0 ? 'Active lectures & duties scheduled today.' : 'No lectures scheduled today.' }}</p>
            </div>
            <div class="section-card stat-info">
                <div class="stat-header">
                    <h3>Leisure & Recess</h3>
                    <span class="stat-icon">☕</span>
                </div>
                <strong>{{ weeklyLeisureSlotsCount }} Slots</strong>
                <p>Dynamic day-to-day rotating leisure & recess.</p>
            </div>
            <div class="section-card stat-amber">
                <div class="stat-header">
                    <h3>Classrooms & Labs</h3>
                    <span class="stat-icon">📍</span>
                </div>
                <strong>{{ activeRoomsCount }}</strong>
                <p>Active lecture halls, specialized labs & zones.</p>
            </div>
        </div>

        <!-- Schedule Matrix Visual Calendar Grid -->
        <div class="table-card matrix-container">
            <div class="matrix-header-bar">
                <div class="matrix-header-title">
                    <h2>📅 {{ activeViewMode === 'faculty' && role === 'faculty' ? (userName || 'Faculty') + "'s Personal Timetable Matrix" : userDept + " Master Timetable Matrix" }}</h2>
                    <p>Real-time visual schedule with dynamic daily leisure rotation and live substitution sync.</p>
                </div>
                <div class="matrix-legend">
                    <button type="button" class="legend-btn" [class.active-legend]="matrixFilter === 'all'" (click)="setMatrixFilter('all')">
                        <span class="legend-dot dot-all"></span> All Slots
                    </button>
                    <button type="button" class="legend-btn" [class.active-legend]="matrixFilter === 'theory'" (click)="setMatrixFilter('theory')">
                        <span class="legend-dot dot-theory"></span> Theory Lecture
                    </button>
                    <button type="button" class="legend-btn" [class.active-legend]="matrixFilter === 'lab'" (click)="setMatrixFilter('lab')">
                        <span class="legend-dot dot-lab"></span> Lab / Practical
                    </button>
                    <button type="button" class="legend-btn" [class.active-legend]="matrixFilter === 'leisure'" (click)="setMatrixFilter('leisure')">
                        <span class="legend-dot dot-leisure"></span> ☕ Leisure / Recess
                    </button>
                    <button *ngIf="role === 'faculty' && activeViewMode === 'faculty'" type="button" class="legend-btn" [class.active-legend]="matrixFilter === 'faculty-duty'" (click)="setMatrixFilter('faculty-duty')">
                        <span class="legend-dot dot-duty"></span> 🔬 Research & Duty
                    </button>
                    <button type="button" class="legend-btn" [class.active-legend]="matrixFilter === 'adjusted'" (click)="setMatrixFilter('adjusted')">
                        <span class="legend-dot dot-adjusted"></span> 🔄 Adjustment
                    </button>
                </div>
            </div>
            
            <div class="table-scroll-wrapper">
                <table class="tt-matrix-table">
                    <thead>
                        <tr>
                            <th class="day-col-header">Day</th>
                            <th *ngFor="let p of periods" class="period-col-header">
                                <div class="period-header-inner">
                                    <span class="period-icon">⏰</span>
                                    <span class="period-text">{{ p }}</span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let d of days" [class.today-row]="d === currentDay">
                            <td class="day-cell">
                                <div class="day-badge" [class.today-badge]="d === currentDay">
                                    <span class="day-name">{{ d }}</span>
                                    <span *ngIf="d === currentDay" class="today-tag">TODAY</span>
                                </div>
                            </td>
                            <td *ngFor="let p of periods" class="slot-cell">
                                <div *ngIf="getSlot(d, p) as slot" 
                                     class="matrix-slot-card"
                                     [class.lab-card]="isLab(slot)"
                                     [class.leisure-card]="isLeisure(slot)"
                                     [class.faculty-duty-card]="isFacultyDuty(slot)"
                                     [class.adjusted-card]="slot.isAdjusted"
                                     [class.extra-card]="slot.isExtraClass"
                                     [class.my-teaching-card]="isMyTeachingSlot(slot)"
                                     [class.dimmed-slot]="isSlotDimmed(slot)"
                                     [class.active-filter-match]="isSlotActiveHighlight(slot)">
                                    
                                    <!-- Badge Tags -->
                                    <div *ngIf="slot.isAdjusted" class="substitute-pill">
                                        🔄 Sub: {{ slot.substituteName }}
                                    </div>
                                    <div *ngIf="slot.isExtraClass" class="extra-pill">
                                        ⭐ Extra Class
                                    </div>
                                    <div *ngIf="isMyTeachingSlot(slot)" class="teaching-pill">
                                        👨‍🏫 Teaching Lecture
                                    </div>
                                    <div *ngIf="isFacultyDuty(slot)" class="duty-pill">
                                        💼 Academic Duty
                                    </div>
                                    <div *ngIf="isLeisure(slot)" class="leisure-pill">
                                        ☕ Leisure Slot
                                    </div>

                                    <!-- Subject Title -->
                                    <div class="slot-subject">{{ slot.subject }}</div>

                                    <!-- Batch / Section info if present -->
                                    <div *ngIf="slot.batch" class="slot-batch">
                                        👥 {{ slot.batch }}
                                    </div>

                                    <!-- Faculty Name (Visible on student / master view, hidden if leisure) -->
                                    <div *ngIf="slot.facultyName && !isLeisure(slot) && !isFacultyDuty(slot) && activeViewMode !== 'faculty'" class="slot-faculty">
                                        👨‍🏫 {{ slot.facultyName }}
                                    </div>

                                    <!-- Room Location -->
                                    <div class="slot-room">
                                        {{ isLeisure(slot) ? '☕' : (isLab(slot) ? '🔬' : (isFacultyDuty(slot) ? '💼' : '🚪')) }} {{ slot.room }}
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

    .header-tag-line {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(212, 175, 55, 0.1);
      border: 1px solid rgba(212, 175, 55, 0.3);
      padding: 4px 12px;
      border-radius: 20px;
      color: #d4af37;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.8px;
      margin-bottom: 8px;
    }

    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 8px #10b981;
    }

    .page-header h1 {
      font-size: 1.85rem;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 6px 0;
      letter-spacing: -0.5px;
    }

    .page-header p {
      color: #94a3b8;
      font-size: 0.95rem;
      margin: 0;
      max-width: 680px;
      line-height: 1.4;
    }

    .header-right-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .btn-adjustments {
      background: #16244a;
      color: #cbd5e1;
      border: 1px solid #1f2f54;
      padding: 10px 16px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
    }

    .btn-adjustments:hover {
      background: #1e3a8a;
      color: #ffffff;
      border-color: #3b82f6;
      transform: translateY(-1px);
    }

    .context-badge {
      background: #101b38;
      border: 1px solid #1f2f54;
      padding: 10px 16px;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    }

    .faculty-badge {
      border-color: rgba(212, 175, 55, 0.4);
      background: linear-gradient(135deg, #101b38 0%, #17244a 100%);
    }

    .badge-sub {
      font-size: 11px;
      color: #d4af37;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-main {
      font-size: 15px;
      color: #ffffff;
      font-weight: 800;
      margin: 2px 0;
    }

    .badge-dept-tag {
      font-size: 11.5px;
      color: #94a3b8;
      font-weight: 600;
    }

    /* View Mode Switcher */
    .view-mode-bar {
      background: #0d1730;
      border: 1px solid #1f2f54;
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    .tab-group {
      display: flex;
      gap: 8px;
    }

    .view-tab-btn {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      border: 1px solid #1f2f54;
      background: #101b38;
      color: #94a3b8;
      transition: all 0.2s ease;
    }

    .view-tab-btn:hover {
      color: #ffffff;
      border-color: #3b82f6;
      background: #16244a;
    }

    .view-tab-btn.active-tab {
      background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%);
      color: #0a1128;
      border-color: #d4af37;
      font-weight: 800;
      box-shadow: 0 0 12px rgba(212, 175, 55, 0.35);
    }

    .view-mode-hint {
      color: #94a3b8;
      font-size: 12.5px;
      font-weight: 600;
    }

    /* Faculty Banner */
    .faculty-info-banner {
      background: linear-gradient(135deg, #101b38 0%, #1a2a50 100%);
      border: 1px solid #1f2f54;
      border-left: 4px solid #d4af37;
      padding: 14px 18px;
      border-radius: 12px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    }

    .banner-icon {
      font-size: 2rem;
    }

    .banner-text {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.9rem;
      color: #e2e8f0;
      flex: 1;
    }

    .banner-title-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .banner-title-row strong {
      color: #d4af37;
      font-size: 14px;
    }

    .sync-pill {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34d399;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 700;
    }

    .assigned-courses-list {
      color: #ffffff;
      font-weight: 700;
      font-size: 13.5px;
    }

    .banner-text small {
      color: #94a3b8;
      font-size: 0.82rem;
    }

    /* Stat Cards */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .section-card {
      background: #101b38;
      border: 1px solid #1f2f54;
      border-radius: 12px;
      padding: 18px 20px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
      transition: transform 0.2s ease;
    }

    .section-card:hover {
      transform: translateY(-2px);
    }

    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .section-card h3 {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #94a3b8;
      margin: 0;
      font-weight: 700;
    }

    .stat-icon {
      font-size: 1.2rem;
    }

    .section-card strong {
      font-size: 1.85rem;
      color: #ffffff;
      font-weight: 800;
      display: block;
      margin-bottom: 4px;
    }

    .section-card p {
      font-size: 0.82rem;
      color: #64748b;
      margin: 0;
    }

    .stat-primary strong { color: #fde68a; }
    .stat-success strong { color: #34d399; }
    .stat-info strong { color: #a5b4fc; }
    .stat-amber strong { color: #38bdf8; }

    /* Matrix Card */
    .table-card {
      background: #101b38;
      border: 1px solid #1f2f54;
      border-radius: 14px;
      padding: 22px;
      margin-bottom: 24px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    }

    .matrix-header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
      flex-wrap: wrap;
      gap: 14px;
    }

    .matrix-header-title h2 {
      margin: 0 0 4px 0;
      font-size: 1.25rem;
      color: #ffffff;
      font-weight: 800;
    }

    .matrix-header-title p {
      color: #94a3b8;
      font-size: 0.88rem;
      margin: 0;
    }

    .matrix-legend {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
    }

    .legend-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: #0d1730;
      color: #cbd5e1;
      border: 1px solid #1f2f54;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;
    }

    .legend-btn:hover {
      background: #16244a;
      border-color: #3b82f6;
      color: #ffffff;
    }

    .legend-btn.active-legend {
      background: #1e3a8a;
      color: #ffffff;
      border-color: #60a5fa;
      box-shadow: 0 0 10px rgba(96, 165, 250, 0.35);
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 3px;
      display: inline-block;
    }

    .dot-all { background: #94a3b8; }
    .dot-theory { background: #fde68a; border: 1px solid #d4af37; }
    .dot-lab { background: #10b981; }
    .dot-leisure { background: #6366f1; }
    .dot-duty { background: #64748b; }
    .dot-adjusted { background: #38bdf8; }

    .table-scroll-wrapper {
      overflow-x: auto;
      border-radius: 10px;
      border: 1px solid #1f2f54;
    }

    .tt-matrix-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      min-width: 860px;
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
      font-size: 13px !important;
    }

    .period-col-header {
      min-width: 145px;
    }

    .period-header-inner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
    }

    .period-text {
      font-size: 12px;
      letter-spacing: 0.2px;
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
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .day-name {
      font-size: 13px;
      font-weight: 700;
      color: #e2e8f0;
    }

    .today-row td.day-cell {
      background: #18284e;
      border-left: 3px solid #d4af37;
    }

    .today-row td.slot-cell {
      background-color: rgba(212, 175, 55, 0.05) !important;
    }

    .today-badge .day-name {
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
      height: 90px;
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
      justify-content: space-between;
      align-items: center;
      text-align: center;
      gap: 3px;
      transition: all 0.2s ease;
    }

    .matrix-slot-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
      border-color: #d4af37;
    }

    .matrix-slot-card.dimmed-slot {
      opacity: 0.2;
      filter: grayscale(80%);
      transform: scale(0.96);
    }

    .matrix-slot-card.active-filter-match {
      box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);
      border-color: #60a5fa;
    }

    .matrix-slot-card.my-teaching-card {
      border: 1.5px solid #d4af37 !important;
      background: linear-gradient(135deg, rgba(212, 175, 55, 0.18) 0%, rgba(16, 27, 56, 0.95) 100%) !important;
      box-shadow: 0 0 12px rgba(212, 175, 55, 0.25);
    }

    .matrix-slot-card.lab-card {
      background: rgba(16, 185, 129, 0.12);
      border-color: rgba(16, 185, 129, 0.35);
    }

    .matrix-slot-card.lab-card .slot-subject {
      color: #34d399;
    }

    .matrix-slot-card.leisure-card {
      background: rgba(99, 102, 241, 0.12);
      border-color: rgba(99, 102, 241, 0.35);
    }

    .matrix-slot-card.leisure-card .slot-subject {
      color: #a5b4fc;
    }

    .matrix-slot-card.faculty-duty-card {
      background: rgba(100, 116, 139, 0.12);
      border-color: rgba(100, 116, 139, 0.35);
    }

    .matrix-slot-card.faculty-duty-card .slot-subject {
      color: #cbd5e1;
    }

    .matrix-slot-card.adjusted-card {
      border-color: #38bdf8;
      background: rgba(56, 189, 248, 0.14);
    }

    .teaching-pill {
      background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%);
      color: #0a1128;
      font-size: 9px;
      font-weight: 800;
      padding: 1px 6px;
      border-radius: 4px;
      letter-spacing: 0.3px;
    }

    .duty-pill {
      background: #334155;
      color: #cbd5e1;
      font-size: 9px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 4px;
    }

    .leisure-pill {
      background: rgba(99, 102, 241, 0.3);
      color: #c7d2fe;
      font-size: 9px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 4px;
    }

    .substitute-pill {
      background: #0284c7;
      color: #ffffff;
      font-size: 9px;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 4px;
    }

    .extra-pill {
      background: #9333ea;
      color: #ffffff;
      font-size: 9px;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 4px;
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
      margin: 1px 0;
    }

    .slot-batch {
      font-size: 9px;
      font-weight: 700;
      color: #93c5fd;
      background: rgba(59, 130, 246, 0.12);
      padding: 1px 4px;
      border-radius: 3px;
    }

    .slot-faculty {
      font-size: 9.5px;
      font-weight: 700;
      color: #fde68a;
      background: rgba(212, 175, 55, 0.12);
      border: 1px solid rgba(212, 175, 55, 0.25);
      padding: 1px 5px;
      border-radius: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    .slot-room {
      font-size: 9.5px;
      font-weight: 700;
      color: #fde68a;
      background: #091024;
      border: 1px solid #1f2f54;
      padding: 1px 5px;
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
    `
  ]
})
export class Timetable implements OnInit {
  role: string | null = null;
  userName: string = '';
  currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  weeklySchedule: ScheduleEntry[] = [];
  userAssignedCourses: string[] = [];
  userDept: string = 'Computer Science & Engineering';
  matrixFilter: string = 'all';
  activeViewMode: 'faculty' | 'department' = 'faculty';

  // Visual grid variables
  days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  periods = [
    '09:00 AM - 10:00 AM',
    '10:15 AM - 11:15 AM',
    '11:30 AM - 12:30 PM',
    '02:00 PM - 03:00 PM',
    '03:15 PM - 04:15 PM'
  ];

  // Master schedules across all departments
  private masterDepartmentSchedules: { [dept: string]: ScheduleEntry[] } = {
    'cse': [
      // Monday: 3 classes, 2 leisure (Leisure at P3, Library at P5)
      { id: 101, day: 'Monday', period: '09:00 AM - 10:00 AM', subject: 'Database Management Systems (CS101)', room: 'LH-101', facultyName: 'Dr. Ramesh Babu', batch: 'CSE Sem 3' },
      { id: 102, day: 'Monday', period: '10:15 AM - 11:15 AM', subject: 'Data Structures & Algorithms (CS102)', room: 'LH-204', facultyName: 'Prof. Sunita Sharma', batch: 'CSE Sem 3' },
      { id: 103, day: 'Monday', period: '11:30 AM - 12:30 PM', subject: '☕ Leisure & Self-Study', room: 'Reading Hall' },
      { id: 104, day: 'Monday', period: '02:00 PM - 03:00 PM', subject: 'Operating Systems (CS201)', room: 'LH-101', facultyName: 'Dr. Amit Patel', batch: 'CSE Sem 3' },
      { id: 105, day: 'Monday', period: '03:15 PM - 04:15 PM', subject: '📚 Central Library & Digital Research', room: 'Central Library' },

      // Tuesday: 3 classes, 2 leisure (Leisure at P3, Lab at P4 & P5)
      { id: 106, day: 'Tuesday', period: '09:00 AM - 10:00 AM', subject: 'Object-Oriented Programming (CS103)', room: 'LH-204', facultyName: 'Dr. Ramesh Babu', batch: 'CSE Sem 3' },
      { id: 107, day: 'Tuesday', period: '10:15 AM - 11:15 AM', subject: 'Database Management Systems (CS101)', room: 'LH-101', facultyName: 'Dr. Ramesh Babu', batch: 'CSE Sem 3' },
      { id: 108, day: 'Tuesday', period: '11:30 AM - 12:30 PM', subject: '☕ Leisure & Coding Club', room: 'Innovation Hub' },
      { id: 109, day: 'Tuesday', period: '02:00 PM - 03:00 PM', subject: 'Database Management Systems Lab', room: 'Lab-4A', facultyName: 'Dr. Ramesh Babu', batch: 'CSE Sem 3' },
      { id: 110, day: 'Tuesday', period: '03:15 PM - 04:15 PM', subject: 'Database Management Systems Lab', room: 'Lab-4A', facultyName: 'Dr. Ramesh Babu', batch: 'CSE Sem 3' },

      // Wednesday: 2 classes, 3 leisure (Leisure at P1, Lab at P4 & P5)
      { id: 111, day: 'Wednesday', period: '09:00 AM - 10:00 AM', subject: '☕ Leisure & Peer Mentoring', room: 'Campus Zone' },
      { id: 112, day: 'Wednesday', period: '10:15 AM - 11:15 AM', subject: 'Operating Systems (CS201)', room: 'LH-101', facultyName: 'Dr. Amit Patel', batch: 'CSE Sem 3' },
      { id: 113, day: 'Wednesday', period: '11:30 AM - 12:30 PM', subject: 'Database Management Systems (CS101)', room: 'LH-305', facultyName: 'Dr. Ramesh Babu', batch: 'CSE Sem 3' },
      { id: 114, day: 'Wednesday', period: '02:00 PM - 03:00 PM', subject: 'Data Structures Laboratory', room: 'Lab-2B', facultyName: 'Prof. Sunita Sharma', batch: 'CSE Sem 3' },
      { id: 115, day: 'Wednesday', period: '03:15 PM - 04:15 PM', subject: 'Data Structures Laboratory', room: 'Lab-2B', facultyName: 'Prof. Sunita Sharma', batch: 'CSE Sem 3' },

      // Thursday: 3 classes, 2 leisure (Leisure at P4, Library at P5)
      { id: 116, day: 'Thursday', period: '09:00 AM - 10:00 AM', subject: 'Data Structures & Algorithms (CS102)', room: 'LH-305', facultyName: 'Prof. Sunita Sharma', batch: 'CSE Sem 3' },
      { id: 117, day: 'Thursday', period: '10:15 AM - 11:15 AM', subject: 'Computer Networks (CS301)', room: 'LH-101', facultyName: 'Dr. Priya Nair', batch: 'CSE Sem 3' },
      { id: 118, day: 'Thursday', period: '11:30 AM - 12:30 PM', subject: 'Object-Oriented Programming (CS103)', room: 'LH-204', facultyName: 'Dr. Ramesh Babu', batch: 'CSE Sem 3' },
      { id: 119, day: 'Thursday', period: '02:00 PM - 03:00 PM', subject: '☕ Leisure & Project Brainstorming', room: 'Student Lounge' },
      { id: 120, day: 'Thursday', period: '03:15 PM - 04:15 PM', subject: '📚 Library & Technical Journals', room: 'Central Library' },

      // Friday: 3 classes, 2 leisure (Leisure at P2, Sports at P5)
      { id: 121, day: 'Friday', period: '09:00 AM - 10:00 AM', subject: 'Computer Networks (CS301)', room: 'LH-305', facultyName: 'Dr. Priya Nair', batch: 'CSE Sem 3' },
      { id: 122, day: 'Friday', period: '10:15 AM - 11:15 AM', subject: '☕ Leisure & Faculty Consultation', room: 'Faculty Lounge' },
      { id: 123, day: 'Friday', period: '11:30 AM - 12:30 PM', subject: 'Software Engineering (CS302)', room: 'LH-101', facultyName: 'Prof. Rajesh Verma', batch: 'CSE Sem 3' },
      { id: 124, day: 'Friday', period: '02:00 PM - 03:00 PM', subject: 'Operating Systems Lab', room: 'OS Lab-1', facultyName: 'Dr. Amit Patel', batch: 'CSE Sem 3' },
      { id: 125, day: 'Friday', period: '03:15 PM - 04:15 PM', subject: '⚽ Sports & Physical Fitness', room: 'Sports Ground' },

      // Saturday: 2 classes, 3 leisure (Leisure at P3, Leisure at P5)
      { id: 126, day: 'Saturday', period: '09:00 AM - 10:00 AM', subject: 'Software Engineering (CS302)', room: 'LH-204', facultyName: 'Prof. Rajesh Verma', batch: 'CSE Sem 3' },
      { id: 127, day: 'Saturday', period: '10:15 AM - 11:15 AM', subject: 'Object-Oriented Programming (CS103)', room: 'LH-204', facultyName: 'Dr. Ramesh Babu', batch: 'CSE Sem 3' },
      { id: 128, day: 'Saturday', period: '11:30 AM - 12:30 PM', subject: '☕ Leisure & Hackathon Preparation', room: 'Innovation Hub' },
      { id: 129, day: 'Saturday', period: '02:00 PM - 03:00 PM', subject: 'Industry Expert Webinar / Seminar', room: 'Seminar Hall', facultyName: 'Dr. Ramesh Babu', batch: 'CSE All' },
      { id: 130, day: 'Saturday', period: '03:15 PM - 04:15 PM', subject: '☕ Leisure & Weekend Review', room: 'Student Lounge' }
    ],

    'it': [
      // Monday: 3 classes, 2 leisure
      { id: 201, day: 'Monday', period: '09:00 AM - 10:00 AM', subject: 'Calculus & Linear Algebra (IT111)', room: 'IT-LH-101', facultyName: 'Dr. Priya Nair', batch: 'IT Sem 3' },
      { id: 202, day: 'Monday', period: '10:15 AM - 11:15 AM', subject: 'Data Structures & Algorithms (IT201)', room: 'IT-LH-102', facultyName: 'Dr. V. C. Reddy', batch: 'IT Sem 3' },
      { id: 203, day: 'Monday', period: '11:30 AM - 12:30 PM', subject: '☕ Leisure & Self-Study', room: 'Reading Hall' },
      { id: 204, day: 'Monday', period: '02:00 PM - 03:00 PM', subject: 'Database Management Systems (IT301)', room: 'IT-LH-204', facultyName: 'Dr. Priya Nair', batch: 'IT Sem 3' },
      { id: 205, day: 'Monday', period: '03:15 PM - 04:15 PM', subject: '📚 Open Source Research & Library', room: 'Central Library' },

      // Tuesday: 3 classes, 2 leisure
      { id: 206, day: 'Tuesday', period: '09:00 AM - 10:00 AM', subject: 'Cloud Infrastructure & DevOps (IT401)', room: 'IT-LH-101', facultyName: 'Dr. V. C. Reddy', batch: 'IT Sem 3' },
      { id: 207, day: 'Tuesday', period: '10:15 AM - 11:15 AM', subject: '☕ Leisure & Web Dev Club', room: 'Innovation Hub' },
      { id: 208, day: 'Tuesday', period: '11:30 AM - 12:30 PM', subject: 'Database Management Systems (IT301)', room: 'IT-LH-204', facultyName: 'Dr. Priya Nair', batch: 'IT Sem 3' },
      { id: 209, day: 'Tuesday', period: '02:00 PM - 03:00 PM', subject: 'Database & SQL Practicum Lab', room: 'DB Lab', facultyName: 'Dr. Priya Nair', batch: 'IT Sem 3' },
      { id: 210, day: 'Tuesday', period: '03:15 PM - 04:15 PM', subject: 'Database & SQL Practicum Lab', room: 'DB Lab', facultyName: 'Dr. Priya Nair', batch: 'IT Sem 3' },

      // Wednesday: 2 classes, 3 leisure
      { id: 211, day: 'Wednesday', period: '09:00 AM - 10:00 AM', subject: '☕ Leisure & Peer Mentoring', room: 'Student Lounge' },
      { id: 212, day: 'Wednesday', period: '10:15 AM - 11:15 AM', subject: 'Calculus & Linear Algebra (IT111)', room: 'IT-LH-101', facultyName: 'Dr. Priya Nair', batch: 'IT Sem 3' },
      { id: 213, day: 'Wednesday', period: '11:30 AM - 12:30 PM', subject: 'Data Structures & Algorithms (IT201)', room: 'IT-LH-204', facultyName: 'Dr. V. C. Reddy', batch: 'IT Sem 3' },
      { id: 214, day: 'Wednesday', period: '02:00 PM - 03:00 PM', subject: 'Data Structures Practical Lab', room: 'IT Lab-2', facultyName: 'Dr. V. C. Reddy', batch: 'IT Sem 3' },
      { id: 215, day: 'Wednesday', period: '03:15 PM - 04:15 PM', subject: '⚽ Sports & Physical Fitness', room: 'Campus Ground' },

      // Thursday: 3 classes, 2 leisure
      { id: 216, day: 'Thursday', period: '09:00 AM - 10:00 AM', subject: 'Cloud Infrastructure & DevOps (IT401)', room: 'IT-LH-102', facultyName: 'Dr. V. C. Reddy', batch: 'IT Sem 3' },
      { id: 217, day: 'Thursday', period: '10:15 AM - 11:15 AM', subject: 'Database Management Systems (IT301)', room: 'IT-LH-101', facultyName: 'Dr. Priya Nair', batch: 'IT Sem 3' },
      { id: 218, day: 'Thursday', period: '11:30 AM - 12:30 PM', subject: '☕ Leisure & Self-Study', room: 'Reading Hall' },
      { id: 219, day: 'Thursday', period: '02:00 PM - 03:00 PM', subject: 'Cloud & DevOps Practical Lab', room: 'Cloud Lab', facultyName: 'Dr. V. C. Reddy', batch: 'IT Sem 3' },
      { id: 220, day: 'Thursday', period: '03:15 PM - 04:15 PM', subject: '📚 Library & Technical Research', room: 'Central Library' },

      // Friday: 3 classes, 2 leisure
      { id: 221, day: 'Friday', period: '09:00 AM - 10:00 AM', subject: 'Data Structures & Algorithms (IT201)', room: 'IT-LH-204', facultyName: 'Dr. V. C. Reddy', batch: 'IT Sem 3' },
      { id: 222, day: 'Friday', period: '10:15 AM - 11:15 AM', subject: '☕ Leisure & Faculty Consultation', room: 'Faculty Lounge' },
      { id: 223, day: 'Friday', period: '11:30 AM - 12:30 PM', subject: 'Cloud Infrastructure & DevOps (IT401)', room: 'IT-LH-102', facultyName: 'Dr. V. C. Reddy', batch: 'IT Sem 3' },
      { id: 224, day: 'Friday', period: '02:00 PM - 03:00 PM', subject: 'Outcome-Based Remedial & Mentoring', room: 'IT-LH-101', facultyName: 'Dr. Priya Nair', batch: 'IT Sem 3' },
      { id: 225, day: 'Friday', period: '03:15 PM - 04:15 PM', subject: '⚽ Sports & Recreation', room: 'Campus Ground' },

      // Saturday: 2 classes, 3 leisure
      { id: 226, day: 'Saturday', period: '09:00 AM - 10:00 AM', subject: 'Calculus & Linear Algebra (IT111)', room: 'IT-LH-101', facultyName: 'Dr. Priya Nair', batch: 'IT Sem 3' },
      { id: 227, day: 'Saturday', period: '10:15 AM - 11:15 AM', subject: 'Industry Expert Guest Lecture', room: 'Seminar Hall', facultyName: 'Dr. V. C. Reddy', batch: 'IT All' },
      { id: 228, day: 'Saturday', period: '11:30 AM - 12:30 PM', subject: '☕ Leisure & Hackathon Brainstorming', room: 'Innovation Hub' },
      { id: 229, day: 'Saturday', period: '02:00 PM - 03:00 PM', subject: '📚 Library & Certification Prep', room: 'Central Library' },
      { id: 230, day: 'Saturday', period: '03:15 PM - 04:15 PM', subject: '☕ Leisure & Weekend Review', room: 'Student Lounge' }
    ],

    'ece': [
      // Monday: 3 classes, 2 leisure
      { id: 301, day: 'Monday', period: '09:00 AM - 10:00 AM', subject: 'Linear Algebra & Transform Calculus (EC111)', room: 'EC-LH-101', facultyName: 'Dr. Amit Patel', batch: 'ECE Sem 3' },
      { id: 302, day: 'Monday', period: '10:15 AM - 11:15 AM', subject: 'Electronic Devices and Circuits (EC201)', room: 'EC-LH-102', facultyName: 'Prof. Deepa Reddy', batch: 'ECE Sem 3' },
      { id: 303, day: 'Monday', period: '11:30 AM - 12:30 PM', subject: '☕ Leisure & Self-Study', room: 'Reading Hall' },
      { id: 304, day: 'Monday', period: '02:00 PM - 03:00 PM', subject: 'Digital Communication Systems (EC301)', room: 'EC-LH-101', facultyName: 'Prof. Snehalata Das', batch: 'ECE Sem 3' },
      { id: 305, day: 'Monday', period: '03:15 PM - 04:15 PM', subject: '📚 Central Library & Hardware Documentation', room: 'Central Library' },

      // Tuesday: 3 classes, 2 leisure
      { id: 306, day: 'Tuesday', period: '09:00 AM - 10:00 AM', subject: 'VLSI Design and Embedded Systems (EC401)', room: 'EC-LH-102', facultyName: 'Dr. Amit Patel', batch: 'ECE Sem 3' },
      { id: 307, day: 'Tuesday', period: '10:15 AM - 11:15 AM', subject: '☕ Leisure & Robotics Club', room: 'Activity Center' },
      { id: 308, day: 'Tuesday', period: '11:30 AM - 12:30 PM', subject: 'Electronic Devices and Circuits (EC201)', room: 'EC-LH-204', facultyName: 'Prof. Deepa Reddy', batch: 'ECE Sem 3' },
      { id: 309, day: 'Tuesday', period: '02:00 PM - 03:00 PM', subject: 'Electronic Devices & Circuits Lab', room: 'Hardware Lab', facultyName: 'Prof. Deepa Reddy', batch: 'ECE Sem 3' },
      { id: 310, day: 'Tuesday', period: '03:15 PM - 04:15 PM', subject: 'Electronic Devices & Circuits Lab', room: 'Hardware Lab', facultyName: 'Prof. Deepa Reddy', batch: 'ECE Sem 3' },

      // Wednesday: 2 classes, 3 leisure
      { id: 311, day: 'Wednesday', period: '09:00 AM - 10:00 AM', subject: '☕ Leisure & Peer Mentoring', room: 'Student Lounge' },
      { id: 312, day: 'Wednesday', period: '10:15 AM - 11:15 AM', subject: 'Digital Communication Systems (EC301)', room: 'EC-LH-101', facultyName: 'Prof. Snehalata Das', batch: 'ECE Sem 3' },
      { id: 313, day: 'Wednesday', period: '11:30 AM - 12:30 PM', subject: 'Linear Algebra & Transform Calculus (EC111)', room: 'EC-LH-101', facultyName: 'Dr. Amit Patel', batch: 'ECE Sem 3' },
      { id: 314, day: 'Wednesday', period: '02:00 PM - 03:00 PM', subject: 'Digital Communication Laboratory', room: 'Comm Lab', facultyName: 'Prof. Snehalata Das', batch: 'ECE Sem 3' },
      { id: 315, day: 'Wednesday', period: '03:15 PM - 04:15 PM', subject: '⚽ Sports & Physical Activity', room: 'Campus Ground' },

      // Thursday: 3 classes, 2 leisure
      { id: 316, day: 'Thursday', period: '09:00 AM - 10:00 AM', subject: 'VLSI Design and Embedded Systems (EC401)', room: 'EC-LH-204', facultyName: 'Dr. Amit Patel', batch: 'ECE Sem 3' },
      { id: 317, day: 'Thursday', period: '10:15 AM - 11:15 AM', subject: 'Electronic Devices and Circuits (EC201)', room: 'EC-LH-204', facultyName: 'Prof. Deepa Reddy', batch: 'ECE Sem 3' },
      { id: 318, day: 'Thursday', period: '11:30 AM - 12:30 PM', subject: '☕ Leisure & Self-Study', room: 'Reading Hall' },
      { id: 319, day: 'Thursday', period: '02:00 PM - 03:00 PM', subject: 'VLSI Design & Simulation Lab', room: 'VLSI Lab', facultyName: 'Dr. Amit Patel', batch: 'ECE Sem 3' },
      { id: 320, day: 'Thursday', period: '03:15 PM - 04:15 PM', subject: '📚 Library & Circuit Design Cases', room: 'Central Library' },

      // Friday: 3 classes, 2 leisure
      { id: 321, day: 'Friday', period: '09:00 AM - 10:00 AM', subject: 'Digital Communication Systems (EC301)', room: 'EC-LH-204', facultyName: 'Prof. Snehalata Das', batch: 'ECE Sem 3' },
      { id: 322, day: 'Friday', period: '10:15 AM - 11:15 AM', subject: '☕ Leisure & Faculty Consultation', room: 'Faculty Lounge' },
      { id: 323, day: 'Friday', period: '11:30 AM - 12:30 PM', subject: 'VLSI Design and Embedded Systems (EC401)', room: 'EC-LH-102', facultyName: 'Dr. Amit Patel', batch: 'ECE Sem 3' },
      { id: 324, day: 'Friday', period: '02:00 PM - 03:00 PM', subject: 'Outcome-Based Remedial & Mentoring', room: 'EC-LH-101', facultyName: 'Dr. Amit Patel', batch: 'ECE Sem 3' },
      { id: 325, day: 'Friday', period: '03:15 PM - 04:15 PM', subject: '⚽ Sports & Fitness Hours', room: 'Campus Ground' },

      // Saturday: 2 classes, 3 leisure
      { id: 326, day: 'Saturday', period: '09:00 AM - 10:00 AM', subject: 'Linear Algebra & Transform Calculus (EC111)', room: 'EC-LH-101', facultyName: 'Dr. Amit Patel', batch: 'ECE Sem 3' },
      { id: 327, day: 'Saturday', period: '10:15 AM - 11:15 AM', subject: 'Expert Guest Lecture / Webinar', room: 'Seminar Hall', facultyName: 'Prof. Snehalata Das', batch: 'ECE All' },
      { id: 328, day: 'Saturday', period: '11:30 AM - 12:30 PM', subject: '☕ Leisure & Project Brainstorming', room: 'Activity Center' },
      { id: 329, day: 'Saturday', period: '02:00 PM - 03:00 PM', subject: '📚 Library & GATE Prep Session', room: 'Central Library' },
      { id: 330, day: 'Saturday', period: '03:15 PM - 04:15 PM', subject: '☕ Leisure & Weekend Review', room: 'Student Lounge' }
    ],

    'mech': [
      // Monday: 3 classes, 2 leisure
      { id: 401, day: 'Monday', period: '09:00 AM - 10:00 AM', subject: 'Calculus & Linear Algebra (ME111)', room: 'ME-LH-101', facultyName: 'Dr. Ananya Mishra', batch: 'Mech Sem 3' },
      { id: 402, day: 'Monday', period: '10:15 AM - 11:15 AM', subject: 'Engineering Thermodynamics (ME201)', room: 'ME-LH-102', facultyName: 'Prof. Arun Roy', batch: 'Mech Sem 3' },
      { id: 403, day: 'Monday', period: '11:30 AM - 12:30 PM', subject: '☕ Leisure & Self-Study', room: 'Reading Hall' },
      { id: 404, day: 'Monday', period: '02:00 PM - 03:00 PM', subject: 'Heat and Mass Transfer (ME301)', room: 'ME-LH-204', facultyName: 'Dr. Ananya Mishra', batch: 'Mech Sem 3' },
      { id: 405, day: 'Monday', period: '03:15 PM - 04:15 PM', subject: '📚 Central Library & Research Hours', room: 'Central Library' },

      // Tuesday: 3 classes, 2 leisure
      { id: 406, day: 'Tuesday', period: '09:00 AM - 10:00 AM', subject: 'Mechatronics & Automation (ME401)', room: 'ME-LH-101', facultyName: 'Prof. Arun Roy', batch: 'Mech Sem 3' },
      { id: 407, day: 'Tuesday', period: '10:15 AM - 11:15 AM', subject: '☕ Leisure & Innovation Club', room: 'Activity Center' },
      { id: 408, day: 'Tuesday', period: '11:30 AM - 12:30 PM', subject: 'Engineering Thermodynamics (ME201)', room: 'ME-LH-204', facultyName: 'Prof. Arun Roy', batch: 'Mech Sem 3' },
      { id: 409, day: 'Tuesday', period: '02:00 PM - 03:00 PM', subject: 'CAD/CAM Simulation & Modeling Lab', room: 'CAD Lab', facultyName: 'Dr. Ananya Mishra', batch: 'Mech Sem 3' },
      { id: 410, day: 'Tuesday', period: '03:15 PM - 04:15 PM', subject: 'CAD/CAM Simulation & Modeling Lab', room: 'CAD Lab', facultyName: 'Dr. Ananya Mishra', batch: 'Mech Sem 3' },

      // Wednesday: 2 classes, 3 leisure
      { id: 411, day: 'Wednesday', period: '09:00 AM - 10:00 AM', subject: '☕ Leisure & Peer Mentoring', room: 'Campus Zone' },
      { id: 412, day: 'Wednesday', period: '10:15 AM - 11:15 AM', subject: 'Heat and Mass Transfer (ME301)', room: 'ME-LH-102', facultyName: 'Dr. Ananya Mishra', batch: 'Mech Sem 3' },
      { id: 413, day: 'Wednesday', period: '11:30 AM - 12:30 PM', subject: 'Calculus & Linear Algebra (ME111)', room: 'ME-LH-101', facultyName: 'Dr. Ananya Mishra', batch: 'Mech Sem 3' },
      { id: 414, day: 'Wednesday', period: '02:00 PM - 03:00 PM', subject: 'Thermal Engineering Laboratory', room: 'Thermal Lab', facultyName: 'Prof. Arun Roy', batch: 'Mech Sem 3' },
      { id: 415, day: 'Wednesday', period: '03:15 PM - 04:15 PM', subject: '⚽ Sports & Physical Fitness', room: 'Sports Ground' },

      // Thursday: 3 classes, 2 leisure
      { id: 416, day: 'Thursday', period: '09:00 AM - 10:00 AM', subject: 'Mechatronics & Automation (ME401)', room: 'ME-LH-204', facultyName: 'Prof. Arun Roy', batch: 'Mech Sem 3' },
      { id: 417, day: 'Thursday', period: '10:15 AM - 11:15 AM', subject: 'Engineering Thermodynamics (ME201)', room: 'ME-LH-101', facultyName: 'Prof. Arun Roy', batch: 'Mech Sem 3' },
      { id: 418, day: 'Thursday', period: '11:30 AM - 12:30 PM', subject: '☕ Leisure & Self-Study', room: 'Reading Hall' },
      { id: 419, day: 'Thursday', period: '02:00 PM - 03:00 PM', subject: 'Mechatronics & Robotics Lab', room: 'Robotics Lab', facultyName: 'Prof. Arun Roy', batch: 'Mech Sem 3' },
      { id: 420, day: 'Thursday', period: '03:15 PM - 04:15 PM', subject: '📚 Library & Design Cases', room: 'Central Library' },

      // Friday: 3 classes, 2 leisure
      { id: 421, day: 'Friday', period: '09:00 AM - 10:00 AM', subject: 'Calculus & Linear Algebra (ME111)', room: 'ME-LH-204', facultyName: 'Dr. Ananya Mishra', batch: 'Mech Sem 3' },
      { id: 422, day: 'Friday', period: '10:15 AM - 11:15 AM', subject: '☕ Leisure & Faculty Consultation', room: 'Faculty Lounge' },
      { id: 423, day: 'Friday', period: '11:30 AM - 12:30 PM', subject: 'Heat and Mass Transfer (ME301)', room: 'ME-LH-102', facultyName: 'Dr. Ananya Mishra', batch: 'Mech Sem 3' },
      { id: 424, day: 'Friday', period: '02:00 PM - 03:00 PM', subject: 'Manufacturing Workshop Practice', room: 'Machine Shop', facultyName: 'Prof. Arun Roy', batch: 'Mech Sem 3' },
      { id: 425, day: 'Friday', period: '03:15 PM - 04:15 PM', subject: '⚽ Sports & Physical Fitness', room: 'Sports Ground' },

      // Saturday: 2 classes, 3 leisure
      { id: 426, day: 'Saturday', period: '09:00 AM - 10:00 AM', subject: 'Mechatronics & Automation (ME401)', room: 'ME-LH-101', facultyName: 'Prof. Arun Roy', batch: 'Mech Sem 3' },
      { id: 427, day: 'Saturday', period: '10:15 AM - 11:15 AM', subject: 'Mini-Project Review & Technical Viva', room: 'CAD Lab', facultyName: 'Dr. Ananya Mishra', batch: 'Mech Sem 3' },
      { id: 428, day: 'Saturday', period: '11:30 AM - 12:30 PM', subject: '☕ Leisure & Project Brainstorming', room: 'Activity Center' },
      { id: 429, day: 'Saturday', period: '02:00 PM - 03:00 PM', subject: '📚 Library & CAD Modeling', room: 'Central Library' },
      { id: 430, day: 'Saturday', period: '03:15 PM - 04:15 PM', subject: '☕ Leisure & Weekend Review', room: 'Student Lounge' }
    ],

    'civil': [
      // Monday: 3 classes, 2 leisure
      { id: 501, day: 'Monday', period: '09:00 AM - 10:00 AM', subject: 'Calculus & Linear Algebra (CE111)', room: 'CE-LH-101', facultyName: 'Dr. Suresh Kumar', batch: 'Civil Sem 3' },
      { id: 502, day: 'Monday', period: '10:15 AM - 11:15 AM', subject: 'Strength of Materials I (CE201)', room: 'CE-LH-102', facultyName: 'Dr. Alok Nath', batch: 'Civil Sem 3' },
      { id: 503, day: 'Monday', period: '11:30 AM - 12:30 PM', subject: '☕ Leisure & Self-Study', room: 'Reading Hall' },
      { id: 504, day: 'Monday', period: '02:00 PM - 03:00 PM', subject: 'Structural Analysis II (CE301)', room: 'CE-LH-204', facultyName: 'Dr. Suresh Kumar', batch: 'Civil Sem 3' },
      { id: 505, day: 'Monday', period: '03:15 PM - 04:15 PM', subject: '📚 Central Library & Digital Research', room: 'Central Library' },

      // Tuesday: 3 classes, 2 leisure
      { id: 506, day: 'Tuesday', period: '09:00 AM - 10:00 AM', subject: 'Estimation & Costing (CE401)', room: 'CE-LH-101', facultyName: 'Dr. Alok Nath', batch: 'Civil Sem 3' },
      { id: 507, day: 'Tuesday', period: '10:15 AM - 11:15 AM', subject: '☕ Leisure & Innovation Cell', room: 'Campus Zone' },
      { id: 508, day: 'Tuesday', period: '11:30 AM - 12:30 PM', subject: 'Concrete Technology & Testing', room: 'CE-LH-204', facultyName: 'Dr. Suresh Kumar', batch: 'Civil Sem 3' },
      { id: 509, day: 'Tuesday', period: '02:00 PM - 03:00 PM', subject: 'Civil Engineering Workshop Lab', room: 'Survey Field', facultyName: 'Dr. Suresh Kumar', batch: 'Civil Sem 3' },
      { id: 510, day: 'Tuesday', period: '03:15 PM - 04:15 PM', subject: 'Civil Engineering Workshop Lab', room: 'Survey Field', facultyName: 'Dr. Suresh Kumar', batch: 'Civil Sem 3' },

      // Wednesday: 2 classes, 3 leisure
      { id: 511, day: 'Wednesday', period: '09:00 AM - 10:00 AM', subject: '☕ Leisure & Recess / Hobbies', room: 'Campus Zone' },
      { id: 512, day: 'Wednesday', period: '10:15 AM - 11:15 AM', subject: 'Strength of Materials I (CE201)', room: 'CE-LH-102', facultyName: 'Dr. Alok Nath', batch: 'Civil Sem 3' },
      { id: 513, day: 'Wednesday', period: '11:30 AM - 12:30 PM', subject: 'Calculus & Linear Algebra (CE111)', room: 'CE-LH-101', facultyName: 'Dr. Suresh Kumar', batch: 'Civil Sem 3' },
      { id: 514, day: 'Wednesday', period: '02:00 PM - 03:00 PM', subject: 'Strength of Materials Laboratory', room: 'Mechanics Lab', facultyName: 'Dr. Alok Nath', batch: 'Civil Sem 3' },
      { id: 515, day: 'Wednesday', period: '03:15 PM - 04:15 PM', subject: '⚽ Sports & Physical Fitness', room: 'Sports Ground' },

      // Thursday: 3 classes, 2 leisure
      { id: 516, day: 'Thursday', period: '09:00 AM - 10:00 AM', subject: 'Structural Analysis II (CE301)', room: 'CE-LH-101', facultyName: 'Dr. Suresh Kumar', batch: 'Civil Sem 3' },
      { id: 517, day: 'Thursday', period: '10:15 AM - 11:15 AM', subject: 'Estimation & Costing (CE401)', room: 'CE-LH-102', facultyName: 'Dr. Alok Nath', batch: 'Civil Sem 3' },
      { id: 518, day: 'Thursday', period: '11:30 AM - 12:30 PM', subject: '☕ Leisure & Self-Study', room: 'Reading Hall' },
      { id: 519, day: 'Thursday', period: '02:00 PM - 03:00 PM', subject: 'Building CAD Laboratory', room: 'CE-CAD Lab', facultyName: 'Dr. Suresh Kumar', batch: 'Civil Sem 3' },
      { id: 520, day: 'Thursday', period: '03:15 PM - 04:15 PM', subject: '📚 Library & Case Studies', room: 'Central Library' },

      // Friday: 3 classes, 2 leisure
      { id: 521, day: 'Friday', period: '09:00 AM - 10:00 AM', subject: 'Strength of Materials I (CE201)', room: 'CE-LH-101', facultyName: 'Dr. Alok Nath', batch: 'Civil Sem 3' },
      { id: 522, day: 'Friday', period: '10:15 AM - 11:15 AM', subject: '☕ Leisure & Faculty Consultation', room: 'Faculty Lounge' },
      { id: 523, day: 'Friday', period: '11:30 AM - 12:30 PM', subject: 'Structural Analysis II (CE301)', room: 'CE-LH-102', facultyName: 'Dr. Suresh Kumar', batch: 'Civil Sem 3' },
      { id: 524, day: 'Friday', period: '02:00 PM - 03:00 PM', subject: 'Geotechnical Material Testing Lab', room: 'Geo Lab', facultyName: 'Dr. Alok Nath', batch: 'Civil Sem 3' },
      { id: 525, day: 'Friday', period: '03:15 PM - 04:15 PM', subject: '⚽ Sports & Physical Fitness', room: 'Sports Ground' },

      // Saturday: 2 classes, 3 leisure
      { id: 526, day: 'Saturday', period: '09:00 AM - 10:00 AM', subject: 'Calculus & Linear Algebra (CE111)', room: 'CE-LH-102', facultyName: 'Dr. Suresh Kumar', batch: 'Civil Sem 3' },
      { id: 527, day: 'Saturday', period: '10:15 AM - 11:15 AM', subject: 'Technical Seminar & Capstone Mentoring', room: 'Seminar Hall', facultyName: 'Dr. Suresh Kumar', batch: 'Civil Sem 3' },
      { id: 528, day: 'Saturday', period: '11:30 AM - 12:30 PM', subject: '☕ Leisure & Project Brainstorming', room: 'Activity Center' },
      { id: 529, day: 'Saturday', period: '02:00 PM - 03:00 PM', subject: '📚 Library & Exam Prep', room: 'Central Library' },
      { id: 530, day: 'Saturday', period: '03:15 PM - 04:15 PM', subject: '☕ Leisure & Weekend Review', room: 'Student Lounge' }
    ]
  };

  get facultyAssignedSubjectsDisplay(): string {
    if (this.userAssignedCourses && this.userAssignedCourses.length > 0) {
      return this.userAssignedCourses.join(' • ');
    }
    const faculty = (this.userName || 'Dr. Ramesh Babu').toLowerCase();
    if (faculty.includes('ramesh')) return 'Database Management Systems (CS101) • Object-Oriented Programming (CS103) • DBMS Practicum Lab';
    if (faculty.includes('sunita')) return 'Data Structures & Algorithms (CS102) • Data Structures Practical Lab';
    if (faculty.includes('amit')) return 'Operating Systems (CS201) • VLSI Design & Embedded Systems (EC401) • OS Lab';
    if (faculty.includes('priya')) return 'Computer Networks (CS301) • Database Systems (IT301) • Calculus (IT111)';
    if (faculty.includes('reddy') || faculty.includes('v. c.')) return 'Cloud Infrastructure & DevOps (IT401) • Data Structures (IT201)';
    if (faculty.includes('suresh')) return 'Structural Analysis II (CE301) • Concrete Technology • Calculus (CE111)';
    if (faculty.includes('ananya')) return 'Calculus & Linear Algebra (ME111) • Heat & Mass Transfer (ME301) • CAD Lab';
    
    return 'Database Management Systems (CS101) • Object-Oriented Programming (CS103) • DBMS Practicum Lab';
  }

  isLeisure(slot: ScheduleEntry): boolean {
    if (!slot || !slot.subject) return false;
    const s = slot.subject.toLowerCase();
    const r = (slot.room || '').toLowerCase();
    return s.includes('leisure') || s.includes('laser') || s.includes('free') || s.includes('self-study') || 
           s.includes('library') || s.includes('sports') || s.includes('lounge') ||
           s.includes('recess') || s.includes('break') || s.includes('hobbies') ||
           r.includes('reading hall') || r.includes('library') || r.includes('ground') || r.includes('lounge') || r.includes('campus zone');
  }

  isFacultyDuty(slot: ScheduleEntry): boolean {
    if (!slot || !slot.subject) return false;
    if (this.isLeisure(slot) || this.isLab(slot) || slot.isTeaching) return false;
    const s = slot.subject.toLowerCase();
    return s.includes('research') || s.includes('mentoring') || s.includes('doubt') || 
           s.includes('committee') || s.includes('board') || s.includes('curriculum') || 
           s.includes('grading') || s.includes('paper') || s.includes('academic') || 
           s.includes('grant') || s.includes('duty') || s.includes('wrap-up');
  }

  isLab(slot: ScheduleEntry): boolean {
    if (!slot || !slot.subject) return false;
    if (this.isLeisure(slot)) return false;
    const s = slot.subject.toLowerCase();
    const r = (slot.room || '').toLowerCase();
    return s.includes('lab') || r.includes('lab') || s.includes('survey field') || r.includes('survey field') || s.includes('workshop') || r.includes('workshop');
  }

  get totalWeeklyClassesCount(): number {
    return this.weeklySchedule.filter(s => !this.isLeisure(s) && !this.isFacultyDuty(s)).length;
  }

  get weeklyLeisureSlotsCount(): number {
    return this.weeklySchedule.filter(s => this.isLeisure(s)).length;
  }

  get todayTeachingClassesCount(): number {
    return this.todayClasses.filter(s => !this.isLeisure(s) && !this.isFacultyDuty(s)).length;
  }

  // Get department class timetable
  getBranchSchedule(dept: string): ScheduleEntry[] {
    const d = (dept || '').toLowerCase();
    if (d.includes('civil') || d === 'ce') return JSON.parse(JSON.stringify(this.masterDepartmentSchedules['civil']));
    if (d.includes('mech') || d.includes('me')) return JSON.parse(JSON.stringify(this.masterDepartmentSchedules['mech']));
    if (d.includes('elect') || d.includes('ece')) return JSON.parse(JSON.stringify(this.masterDepartmentSchedules['ece']));
    if (d.includes('info') || d.includes('it')) return JSON.parse(JSON.stringify(this.masterDepartmentSchedules['it']));
    return JSON.parse(JSON.stringify(this.masterDepartmentSchedules['cse']));
  }

  // Generate dedicated Faculty Schedule strictly isolating the faculty's classes & non-teaching duties
  generateFacultySchedule(facultyName: string, dept: string): ScheduleEntry[] {
    const targetFaculty = (facultyName || 'Dr. Ramesh Babu').toLowerCase().trim();
    const targetDept = (dept || 'cse').toLowerCase();
    
    // Collect all classes taught by this faculty across all departments
    const allMasterSlots: ScheduleEntry[] = [];
    Object.keys(this.masterDepartmentSchedules).forEach(k => {
      allMasterSlots.push(...this.masterDepartmentSchedules[k]);
    });

    const facultySchedule: ScheduleEntry[] = [];
    let idCounter = 1;

    // Faculty non-teaching responsibilities rotating across days to avoid repetitive leisure
    const facultyDutyRotation: { [key: string]: { [period: string]: { subject: string; room: string; isLeisure?: boolean } } } = {
      'Monday': {
        '10:15 AM - 11:15 AM': { subject: '🔬 Research & Course Outcome (CO) Mapping', room: 'Faculty Cabin 302' },
        '11:30 AM - 12:30 PM': { subject: '☕ Leisure & Faculty Lounge', room: 'Faculty Lounge', isLeisure: true },
        '02:00 PM - 03:00 PM': { subject: '👨‍🎓 Student Doubt Clearing & Mentoring', room: 'Dept Consultation Room' },
        '03:15 PM - 04:15 PM': { subject: '📚 Central Library & Journal Study', room: 'Central Library', isLeisure: true }
      },
      'Tuesday': {
        '09:00 AM - 10:00 AM': { subject: '📚 Central Library & Tech Reading', room: 'Central Library', isLeisure: true },
        '11:30 AM - 12:30 PM': { subject: '☕ Leisure & Refreshment Break', room: 'Faculty Lounge', isLeisure: true },
        '02:00 PM - 03:00 PM': { subject: '📝 Continuous Assessment & Assignment Grading', room: 'Faculty Cabin 302' },
        '03:15 PM - 04:15 PM': { subject: '📝 Continuous Assessment & Assignment Grading', room: 'Faculty Cabin 302' }
      },
      'Wednesday': {
        '09:00 AM - 10:00 AM': { subject: '☕ Leisure & Morning Preparation', room: 'Faculty Cabin 302', isLeisure: true },
        '10:15 AM - 11:15 AM': { subject: '📋 Curriculum Design & Question Bank Review', room: 'Board Room' },
        '02:00 PM - 03:00 PM': { subject: '👨‍🎓 Academic Performance Review & Mentoring', room: 'Dept Office' },
        '03:15 PM - 04:15 PM': { subject: '☕ Faculty Leisure & Peer Discussion', room: 'Faculty Lounge', isLeisure: true }
      },
      'Thursday': {
        '09:00 AM - 10:00 AM': { subject: '🔬 Research Paper Writing & Grant Proposals', room: 'Faculty Cabin 302' },
        '10:15 AM - 11:15 AM': { subject: '☕ Leisure & Department Interaction', room: 'Faculty Lounge', isLeisure: true },
        '02:00 PM - 03:00 PM': { subject: '📝 OBE Continuous Assessment Grading', room: 'Faculty Cabin 302' },
        '03:15 PM - 04:15 PM': { subject: '📚 Central Library & IEEE Publication Review', room: 'Central Library', isLeisure: true }
      },
      'Friday': {
        '09:00 AM - 10:00 AM': { subject: '🏛️ Departmental Faculty Committee Meeting', room: 'Board Room' },
        '10:15 AM - 11:15 AM': { subject: '☕ Leisure & Tea Break', room: 'Faculty Lounge', isLeisure: true },
        '02:00 PM - 03:00 PM': { subject: '💻 Mini-Project Mentoring & Evaluation', room: 'Lab-4A' },
        '03:15 PM - 04:15 PM': { subject: '⚽ Campus Walk & Recreational Activity', room: 'Campus Ground', isLeisure: true }
      },
      'Saturday': {
        '09:00 AM - 10:00 AM': { subject: '☕ Leisure & Weekend Planning', room: 'Faculty Cabin 302', isLeisure: true },
        '11:30 AM - 12:30 PM': { subject: '☕ Leisure & Academic Discussion', room: 'Faculty Lounge', isLeisure: true },
        '02:00 PM - 03:00 PM': { subject: '👥 Industry Expert Webinar / Seminar', room: 'Seminar Hall' },
        '03:15 PM - 04:15 PM': { subject: '📊 Weekly Academic Progress Wrap-up', room: 'Faculty Cabin 302' }
      }
    };

    for (const day of this.days) {
      for (const period of this.periods) {
        // Check if target faculty teaches a class at this day and period
        const matchedClass = allMasterSlots.find(s => {
          if (s.day !== day || s.period !== period) return false;
          const f = (s.facultyName || '').toLowerCase().trim();
          return f.includes(targetFaculty) || targetFaculty.includes(f);
        });

        if (matchedClass) {
          // Add this verified 1:1 teaching slot
          facultySchedule.push({
            id: idCounter++,
            day: day,
            period: period,
            subject: matchedClass.subject,
            room: matchedClass.room,
            facultyName: facultyName || 'Dr. Ramesh Babu',
            batch: matchedClass.batch || (dept ? dept.toUpperCase() + ' Sem 3' : 'CSE Sem 3'),
            isTeaching: true
          });
        } else {
          // Non-teaching slot: use faculty duty rotation
          const duty = facultyDutyRotation[day]?.[period];
          if (duty) {
            facultySchedule.push({
              id: idCounter++,
              day: day,
              period: period,
              subject: duty.subject,
              room: duty.room,
              facultyName: facultyName || 'Dr. Ramesh Babu',
              isTeaching: false
            });
          } else {
            // Fallback default non-teaching slot
            facultySchedule.push({
              id: idCounter++,
              day: day,
              period: period,
              subject: '🔬 Research & Course Outcome Review',
              room: 'Faculty Cabin 302',
              facultyName: facultyName || 'Dr. Ramesh Babu',
              isTeaching: false
            });
          }
        }
      }
    }

    return facultySchedule;
  }

  approvedAdjustments: any[] = [];
  extraClasses: any[] = [];
  private navService = inject(NavigationService);

  goBack(): void {
    this.navService.goBack();
  }

  constructor(private http: HttpClient) {
    try {
      this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
      this.userName = localStorage.getItem('userName') || '';
      const email = (localStorage.getItem('userEmail') || '').toLowerCase();
      const name = (this.userName || '').toLowerCase();
      const storedDept = localStorage.getItem('userDepartment') || localStorage.getItem('userDept') || '';

      if (email.includes('krishna') || name.includes('krishna') || (!storedDept && email.includes('cse'))) {
        this.userDept = 'Computer Science & Engineering';
      } else if (storedDept) {
        this.userDept = storedDept;
      } else {
        this.userDept = 'Computer Science & Engineering';
      }

      // Default active view mode
      this.activeViewMode = (this.role === 'faculty') ? 'faculty' : 'department';

      const storedAssigned = localStorage.getItem('userAssignedCourses');
      if (storedAssigned) {
        this.userAssignedCourses = JSON.parse(storedAssigned);
      }
    } catch {
      this.role = null;
    }
  }

  ngOnInit(): void {
    this.refreshScheduleData();
    this.loadTimetable();
  }

  setViewMode(mode: 'faculty' | 'department'): void {
    this.activeViewMode = mode;
    this.refreshScheduleData();
    this.loadAdjustmentsAndOverlay();
  }

  private refreshScheduleData(): void {
    if (this.role === 'faculty' && this.activeViewMode === 'faculty') {
      this.weeklySchedule = this.generateFacultySchedule(this.userName || 'Dr. Ramesh Babu', this.userDept);
    } else {
      this.weeklySchedule = this.getBranchSchedule(this.userDept);
    }
  }

  isMyTeachingSlot(slot: ScheduleEntry): boolean {
    if (!slot || this.isLeisure(slot) || this.isFacultyDuty(slot)) return false;
    if (slot.isTeaching) return true;
    if (this.role !== 'faculty') return false;
    const user = (this.userName || 'Dr. Ramesh Babu').toLowerCase().trim();
    const fName = (slot.facultyName || '').toLowerCase().trim();
    if (user && fName && (fName.includes(user) || user.includes(fName))) return true;

    if (this.userAssignedCourses && this.userAssignedCourses.length > 0) {
      const sSubj = (slot.subject || '').toLowerCase();
      return this.userAssignedCourses.some(c => {
        const cl = c.toLowerCase();
        return sSubj.includes(cl) || cl.includes(sSubj);
      });
    }
    return false;
  }

  private loadTimetable(): void {
    this.refreshScheduleData();
    this.enrichWithCourseAllocations();
    this.loadAdjustmentsAndOverlay();
  }

  private enrichWithCourseAllocations(): void {
    try {
      const localAllocations = localStorage.getItem('obslmsCourseAllocations');
      if (localAllocations) {
        const parsed = JSON.parse(localAllocations);
        if (Array.isArray(parsed)) {
          this.applyAllocationsToSchedule(parsed);
        }
      }
    } catch {}

    this.http.get<any[]>('http://localhost:8080/api/courses').subscribe({
      next: (courses) => {
        if (Array.isArray(courses) && courses.length > 0) {
          this.applyAllocationsToSchedule(courses);
        }
      },
      error: () => {}
    });
  }

  private applyAllocationsToSchedule(courses: any[]): void {
    if (!courses || !courses.length) return;
    this.weeklySchedule.forEach(slot => {
      if (this.isLeisure(slot) || this.isFacultyDuty(slot) || slot.isAdjusted) return;
      const sName = (slot.subject || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const matched = courses.find(c => {
        const cCode = (c.code || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const cTitle = (c.title || c.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return (cCode && sName.includes(cCode)) || (cTitle && (sName.includes(cTitle) || cTitle.includes(sName)));
      });
      if (matched && (matched.faculty || matched.facultyName)) {
        slot.facultyName = matched.faculty || matched.facultyName;
      }
    });
  }

  private loadAdjustmentsAndOverlay(): void {
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

    this.approvedAdjustments = [];
  }

  private overlayAdjustmentsAndExtraClasses(): void {
    try {
      const storedExtra = localStorage.getItem('obslmsExtraClasses');
      if (storedExtra) {
        this.extraClasses = JSON.parse(storedExtra);
      }
    } catch {}

    // 1. Overlay Adjustments
    this.weeklySchedule.forEach(slot => {
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

  setMatrixFilter(type: string): void {
    if (this.matrixFilter === type && type !== 'all') {
      this.matrixFilter = 'all';
    } else {
      this.matrixFilter = type;
    }
  }

  isSlotMatch(slot: ScheduleEntry): boolean {
    if (!slot || this.matrixFilter === 'all' || !this.matrixFilter) return true;
    if (this.matrixFilter === 'theory' || this.matrixFilter === 'classes') {
      return !this.isLeisure(slot) && !this.isLab(slot) && !this.isFacultyDuty(slot) && !slot.isAdjusted && !slot.isExtraClass;
    }
    if (this.matrixFilter === 'lab') {
      return this.isLab(slot);
    }
    if (this.matrixFilter === 'leisure') {
      return this.isLeisure(slot);
    }
    if (this.matrixFilter === 'faculty-duty' || this.matrixFilter === 'duty') {
      return this.isFacultyDuty(slot);
    }
    if (this.matrixFilter === 'adjusted') {
      return !!slot.isAdjusted;
    }
    return true;
  }

  isSlotDimmed(slot: ScheduleEntry): boolean {
    if (!slot || this.matrixFilter === 'all' || !this.matrixFilter) return false;
    return !this.isSlotMatch(slot);
  }

  isSlotActiveHighlight(slot: ScheduleEntry): boolean {
    if (!slot || this.matrixFilter === 'all' || !this.matrixFilter) return false;
    return this.isSlotMatch(slot);
  }
}
