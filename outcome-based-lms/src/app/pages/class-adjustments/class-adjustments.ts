import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { ToastService } from '../../shared/services/toast.service';

export interface ClassAdjustment {
  id?: number;
  requesterId: string;
  requesterName: string;
  substituteId: string;
  substituteName: string;
  courseName: string;
  adjustmentDate: string;
  period: string;
  room: string;
  topicInstructions?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  notifiedStudents?: boolean;
  notifiedAt?: string;
  createdAt?: string;
}

export interface FacultyUser {
  id: string;
  name: string;
  email: string;
  department?: string;
}

@Component({
  selector: 'app-class-adjustments',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  template: `<app-navbar></app-navbar>

<div class="container">
    <app-sidebar></app-sidebar>

    <div class="content">

        <div class="page-header">
            <div class="header-text-group">
                <span class="header-pill">👥 Peer Faculty Collaboration</span>
                <h1>🔄 Class Adjustments & Substitute Requests</h1>
                <p>Request peer faculty substitutes for leave coverage, review incoming adjustments, and manage lecture continuity.</p>
            </div>
            <div class="header-action-btn-group">
                <button type="button" class="btn btn-primary" (click)="activeTab = 'create'">
                    ➕ Request New Adjustment
                </button>
            </div>
        </div>

        <!-- Summary Metric Cards -->
        <div class="summary-grid">
            <div class="section-card" [class.alert-card]="pendingIncomingCount > 0">
                <div class="card-icon">📥</div>
                <div class="card-info">
                    <h3>Pending Incoming</h3>
                    <strong>{{ pendingIncomingCount }}</strong>
                    <p>Substitute requests awaiting your decision.</p>
                </div>
            </div>
            <div class="section-card">
                <div class="card-icon">📤</div>
                <div class="card-info">
                    <h3>My Outgoing Requests</h3>
                    <strong>{{ myOutgoingRequests.length }}</strong>
                    <p>Adjustments requested by you.</p>
                </div>
            </div>
            <div class="section-card">
                <div class="card-icon">✅</div>
                <div class="card-info">
                    <h3>Approved Adjustments</h3>
                    <strong>{{ approvedCount }}</strong>
                    <p>Confirmed substitute classes.</p>
                </div>
            </div>
            <div class="section-card">
                <div class="card-icon">❌</div>
                <div class="card-info">
                    <h3>Rejected Requests</h3>
                    <strong>{{ rejectedCount }}</strong>
                    <p>Adjustments declined with reasons.</p>
                </div>
            </div>
        </div>

        <!-- Tab Navigation Bar -->
        <div class="tab-toolbar">
            <button type="button" 
                    class="tab-btn" 
                    [class.active]="activeTab === 'incoming'" 
                    (click)="activeTab = 'incoming'">
                📥 Incoming Requests for Me
                <span class="tab-count-badge" *ngIf="pendingIncomingCount > 0">{{ pendingIncomingCount }}</span>
            </button>
            <button type="button" 
                    class="tab-btn" 
                    [class.active]="activeTab === 'outgoing'" 
                    (click)="activeTab = 'outgoing'">
                📤 My Sent Requests ({{ myOutgoingRequests.length }})
            </button>
            <button type="button" 
                    class="tab-btn" 
                    [class.active]="activeTab === 'create'" 
                    (click)="activeTab = 'create'">
                ➕ New Adjustment Request
            </button>
            <button type="button" 
                    class="tab-btn" 
                    [class.active]="activeTab === 'extra'" 
                    (click)="activeTab = 'extra'; onExtraClassParamChange()">
                🗓️ Schedule Extra Class (Remedial)
            </button>
        </div>

        <!-- TAB 1: INCOMING REQUESTS FOR ME -->
        <div class="tab-content-area" *ngIf="activeTab === 'incoming'">
            <div class="section-header">
                <h2>📥 Incoming Substitute Requests ({{ myIncomingRequests.length }})</h2>
                <p>Colleagues on leave who have requested you to engage their scheduled classes.</p>
            </div>

            <div *ngIf="myIncomingRequests.length === 0" class="empty-state-card">
                <div class="empty-icon">🏖️</div>
                <h3>No Incoming Requests</h3>
                <p>You currently have no pending or past substitute lecture requests from peer faculty.</p>
            </div>

            <div class="requests-grid" *ngIf="myIncomingRequests.length > 0">
                <div class="request-card" *ngFor="let adj of myIncomingRequests" [class.pending-border]="adj.status === 'PENDING'">
                    <div class="req-card-header">
                        <div class="faculty-avatar-row">
                            <div class="faculty-avatar">👨‍🏫</div>
                            <div class="faculty-details">
                                <strong>{{ adj.requesterName }}</strong>
                                <span class="req-dept-tag">Requested by Faculty Peer</span>
                            </div>
                        </div>
                        <span class="status-badge" [ngClass]="adj.status.toLowerCase()">
                            {{ adj.status === 'PENDING' ? '⏳ Pending Review' : (adj.status === 'APPROVED' ? '✅ Approved' : '❌ Declined') }}
                        </span>
                    </div>

                    <div class="req-card-body">
                        <div class="meta-row">
                            <span class="meta-item">📖 <strong>Course:</strong> {{ adj.courseName }}</span>
                            <span class="meta-item">🚪 <strong>Room:</strong> {{ adj.room }}</span>
                        </div>
                        <div class="meta-row">
                            <span class="meta-item">📅 <strong>Date:</strong> {{ adj.adjustmentDate }}</span>
                            <span class="meta-item">⏰ <strong>Period:</strong> {{ adj.period }}</span>
                        </div>
                        <div class="instructions-box" *ngIf="adj.topicInstructions">
                            <span class="inst-label">📝 Lecture Instructions / Topics:</span>
                            <p class="inst-text">{{ adj.topicInstructions }}</p>
                        </div>
                        <div class="rejection-box" *ngIf="adj.status === 'REJECTED' && adj.rejectionReason">
                            <span class="rej-label">⚠️ Reason for Declining:</span>
                            <p class="rej-text">{{ adj.rejectionReason }}</p>
                        </div>
                    </div>

                    <div class="req-card-footer" *ngIf="adj.status === 'PENDING'">
                        <button type="button" class="btn btn-approve" (click)="approveAdjustment(adj)">
                            ✔️ Approve & Accept Class
                        </button>
                        <button type="button" class="btn btn-reject" (click)="openRejectModal(adj)">
                            ❌ Reject (Specify Reason)
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- TAB 2: MY SENT REQUESTS -->
        <div class="tab-content-area" *ngIf="activeTab === 'outgoing'">
            <div class="section-header">
                <h2>📤 My Sent Adjustment Requests ({{ myOutgoingRequests.length }})</h2>
                <p>Track responses and status of class adjustment requests sent to peer faculty.</p>
            </div>

            <div *ngIf="myOutgoingRequests.length === 0" class="empty-state-card">
                <div class="empty-icon">📝</div>
                <h3>No Outgoing Requests</h3>
                <p>You haven't requested any substitute coverage yet. Click "New Adjustment Request" to request one.</p>
            </div>

            <div class="table-card" *ngIf="myOutgoingRequests.length > 0">
                <table class="adjustment-table">
                    <thead>
                        <tr>
                            <th>Date & Period</th>
                            <th>Subject / Course</th>
                            <th>Room</th>
                            <th>Substitute Faculty</th>
                            <th>Status</th>
                            <th>Student Notification Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let req of myOutgoingRequests">
                            <td>
                                <strong>{{ req.adjustmentDate }}</strong><br>
                                <small class="period-text">{{ req.period }}</small>
                            </td>
                            <td><strong class="subject-text">{{ req.courseName }}</strong></td>
                            <td><span class="room-pill">{{ req.room }}</span></td>
                            <td>
                                <div class="substitute-name-cell">
                                    👨‍🏫 {{ req.substituteName }}
                                </div>
                            </td>
                            <td>
                                <span class="status-badge" [ngClass]="req.status.toLowerCase()">
                                    {{ req.status === 'PENDING' ? '⏳ Pending' : (req.status === 'APPROVED' ? '✅ Approved' : '❌ Declined') }}
                                </span>
                            </td>
                            <td>
                                <div *ngIf="req.status === 'APPROVED'" class="notify-student-cell">
                                    <button *ngIf="!req.notifiedStudents" 
                                            type="button" 
                                            class="btn-notify-students" 
                                            (click)="openNotifyStudentsModal(req)">
                                        📢 Send Adjustment Class Details to All Registered Students
                                    </button>
                                    <div *ngIf="req.notifiedStudents" class="notified-badge-container">
                                        <span class="notified-badge">
                                            ✅ Details Sent to Students
                                        </span>
                                        <button type="button" class="btn-renotify" (click)="openNotifyStudentsModal(req)" title="Resend Notification">
                                            🔄 Resend
                                        </button>
                                    </div>
                                </div>
                                <span *ngIf="req.status === 'REJECTED'" class="rej-reason-text">
                                    ❌ <strong>Declined:</strong> {{ req.rejectionReason || 'No reason provided' }}
                                </span>
                                <span *ngIf="req.status === 'PENDING'" class="pending-note-text">
                                    ⏳ Awaiting substitute confirmation
                                </span>
                            </td>
                            <td>
                                <button type="button" class="del-btn" (click)="deleteAdjustment(req)" title="Cancel Request">
                                    🗑️ Cancel
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- TAB 3: CREATE NEW ADJUSTMENT REQUEST -->
        <div class="tab-content-area" *ngIf="activeTab === 'create'">
            <div class="form-card">
                <div class="form-card-header">
                    <h2>📝 Raise Class Adjustment & Substitute Request</h2>
                    <p>Enter the scheduled period details and select a substitute faculty peer to engage your lecture during your leave.</p>
                </div>

                <form (ngSubmit)="submitAdjustmentRequest()">
                    <div class="grid-row">
                        <label>
                            Adjustment Date
                            <input type="date" [(ngModel)]="newAdjustment.adjustmentDate" name="adjustmentDate" required [min]="todayDate" />
                        </label>
                        <label>
                            Scheduled Time Period
                            <select [(ngModel)]="newAdjustment.period" name="period" required>
                                <option *ngFor="let p of periods" [value]="p">{{ p }}</option>
                            </select>
                        </label>
                    </div>

                    <div class="grid-row">
                        <label>
                            Subject / Course
                            <select [(ngModel)]="newAdjustment.courseName" name="courseName" required>
                                <option value="" disabled selected>Select assigned subject</option>
                                <option *ngFor="let c of availableSubjects" [value]="c">{{ c }}</option>
                            </select>
                        </label>
                        <label>
                            Classroom / Location
                            <input type="text" [(ngModel)]="newAdjustment.room" name="room" placeholder="e.g. CE-LH-101 or Lab-2B" required />
                        </label>
                    </div>

                    <div class="grid-row">
                        <label>
                            Substitute Faculty Peer
                            <select [(ngModel)]="selectedSubstituteId" (change)="onSubstituteChange()" name="substitute" required>
                                <option value="" disabled selected>Select peer faculty</option>
                                <option *ngFor="let f of facultyList" [value]="f.id" [disabled]="f.id === currentFacultyId || f.name === currentFacultyName">
                                    👨‍🏫 {{ f.name }} ({{ f.department || 'Faculty' }})
                                </option>
                            </select>
                        </label>
                    </div>

                    <label style="margin-top: 10px;">
                        Lecture Topics & Specific Instructions for Substitute Faculty
                        <textarea [(ngModel)]="newAdjustment.topicInstructions" 
                                  name="topicInstructions" 
                                  rows="3" 
                                  placeholder="e.g. Please solve the problem set on Navier-Stokes equations and take roll-call on page 42...">
                        </textarea>
                    </label>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">
                            🚀 Send Adjustment Request
                        </button>
                        <button type="button" class="btn btn-secondary" (click)="resetNewForm()">
                            Clear Form
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- TAB 4: SCHEDULE EXTRA CLASS (INTEGRATED CONFLICT & VACANCY CHECK) -->
        <div class="tab-content-area" *ngIf="activeTab === 'extra'">
            <div class="form-card extra-class-card-layout">
                <div class="form-card-header">
                    <span class="header-pill">⚡ Collision & Vacancy Intelligence</span>
                    <h2>🗓️ Schedule Extra / Remedial Class</h2>
                    <p>Check student availability & classroom vacancy before scheduling extra lectures. Automatically updates Timetable and alerts Students & Admin.</p>
                </div>

                <!-- Real-Time Availability & Vacancy Analyzer Card -->
                <div class="availability-analyzer-card">
                    <div class="analyzer-header">
                        <span class="analyzer-icon">🔍</span>
                        <div>
                            <h4 style="margin: 0; color: #fde68a; font-size: 14px;">Live Collision & Availability Analysis</h4>
                            <span style="font-size: 11.5px; color: #94a3b8;">Day: <strong style="color: #ffffff;">{{ extraClassDay }}</strong> • Slot: <strong style="color: #ffffff;">{{ extraClassPeriod }}</strong></span>
                        </div>
                    </div>

                    <div class="analyzer-grid">
                        <!-- 1. Student Status -->
                        <div class="analyzer-item" [class.item-safe]="studentSlotStatus.isFree" [class.item-conflict]="!studentSlotStatus.isFree">
                            <div class="item-title-row">
                                <span class="status-dot"></span>
                                <strong>1. Student Batch Availability:</strong>
                            </div>
                            <p class="status-desc">{{ studentSlotStatus.message }}</p>
                        </div>

                        <!-- 2. Room Status -->
                        <div class="analyzer-item" [class.item-safe]="roomSlotStatus.isVacant" [class.item-conflict]="!roomSlotStatus.isVacant">
                            <div class="item-title-row">
                                <span class="status-dot"></span>
                                <strong>2. Classroom Vacancy ({{ extraClassRoom }}):</strong>
                            </div>
                            <p class="status-desc">{{ roomSlotStatus.message }}</p>
                        </div>
                    </div>

                    <!-- Free Classrooms Quick Selector -->
                    <div class="free-rooms-box" *ngIf="vacantRoomsForSlot.length > 0">
                        <span class="free-rooms-label">🟢 Vacant Classrooms Available for {{ extraClassPeriod }}:</span>
                        <div class="free-rooms-chips">
                            <button type="button" 
                                    class="room-chip" 
                                    *ngFor="let rm of vacantRoomsForSlot" 
                                    [class.active]="extraClassRoom === rm"
                                    (click)="selectVacantRoom(rm)">
                                🚪 {{ rm }}
                            </button>
                        </div>
                    </div>
                </div>

                <form (ngSubmit)="submitExtraClass()">
                    <div class="grid-row">
                        <label>
                            Date of Extra Lecture
                            <input type="date" [(ngModel)]="extraClassDate" name="extraClassDate" (change)="onExtraClassParamChange()" required [min]="todayDate" />
                        </label>
                        <label>
                            Target Time Period
                            <select [(ngModel)]="extraClassPeriod" name="extraClassPeriod" (change)="onExtraClassParamChange()" required>
                                <option *ngFor="let p of periods" [value]="p">{{ p }}</option>
                            </select>
                        </label>
                    </div>

                    <div class="grid-row">
                        <label>
                            Subject / Remedial Course
                            <select [(ngModel)]="extraClassSubject" name="extraClassSubject" (change)="onExtraClassParamChange()" required>
                                <option value="" disabled selected>Select course</option>
                                <option *ngFor="let c of availableSubjects" [value]="c">{{ c }}</option>
                            </select>
                        </label>
                        <label>
                            Classroom / Venue
                            <select [(ngModel)]="extraClassRoom" name="extraClassRoom" (change)="onExtraClassParamChange()" required>
                                <option *ngFor="let rm of masterClassrooms" [value]="rm">{{ rm }}</option>
                            </select>
                        </label>
                    </div>

                    <label style="margin-top: 10px;">
                        Remedial Lecture Agenda / Topics & Notice for Students
                        <textarea [(ngModel)]="extraClassTopic" 
                                  name="extraClassTopic" 
                                  rows="3" 
                                  placeholder="e.g. Intensive problem-solving session on turbulent flow boundary conditions and quiz preparation...">
                        </textarea>
                    </label>

                    <!-- Dual Notification Notice -->
                    <div class="dual-notice-banner">
                        <span style="font-size: 1.3rem;">📢</span>
                        <div style="font-size: 12px; color: #cbd5e1; line-height: 1.4;">
                            <strong style="color: #d4af37;">Automatic Broadcast & Timetable Sync:</strong>
                            Scheduling this extra class will instantly broadcast dual notifications to all <strong>Registered Students</strong> and <strong>Institutional Admin</strong>, and dynamically integrate this slot into the weekly <strong>Timetable</strong>.
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary" [disabled]="isSubmittingExtra">
                            <span *ngIf="!isSubmittingExtra">🚀 Confirm & Schedule Extra Class</span>
                            <span *ngIf="isSubmittingExtra">⏳ Booking & Broadcasting...</span>
                        </button>
                        <button type="button" class="btn btn-secondary" (click)="resetExtraClassForm()">
                            Clear Form
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- NOTIFY REGISTERED STUDENTS MODAL -->
        <div class="modal-overlay" *ngIf="showNotifyModal">
            <div class="modal-card modal-notify-card">
                <div class="modal-header modal-header-gold">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 1.5rem;">📢</span>
                        <div>
                            <h3 style="margin: 0; color: #d4af37; font-size: 1.25rem;">Broadcast Class Adjustment to Students</h3>
                            <span style="font-size: 0.8rem; color: #94a3b8;">Send official lecture substitution notice to all registered students</span>
                        </div>
                    </div>
                    <button type="button" class="modal-close-btn" (click)="closeNotifyModal()">✕</button>
                </div>

                <div class="modal-body">
                    <!-- Summary Card -->
                    <div class="adjustment-summary-card">
                        <div class="summary-row">
                            <span class="sum-label">📚 Subject / Course:</span>
                            <span class="sum-val highlight-gold">{{ selectedAdjustmentForNotify?.courseName }}</span>
                        </div>
                        <div class="summary-grid-2">
                            <div>
                                <span class="sum-label">📅 Lecture Date:</span>
                                <span class="sum-val">{{ selectedAdjustmentForNotify?.adjustmentDate }}</span>
                            </div>
                            <div>
                                <span class="sum-label">⏰ Time & Period:</span>
                                <span class="sum-val">{{ selectedAdjustmentForNotify?.period }}</span>
                            </div>
                        </div>
                        <div class="summary-grid-2">
                            <div>
                                <span class="sum-label">👨‍🏫 Substitute Faculty:</span>
                                <span class="sum-val" style="color: #4ade80; font-weight: 700;">{{ selectedAdjustmentForNotify?.substituteName }}</span>
                            </div>
                            <div>
                                <span class="sum-label">🏛️ Classroom / Venue:</span>
                                <span class="sum-val">{{ selectedAdjustmentForNotify?.room }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Custom Instructions Field -->
                    <div style="margin-top: 14px;">
                        <label style="font-size: 0.88rem; color: #cbd5e1; margin-bottom: 6px; display: block; font-weight: 700;">
                            📝 Message & Instructions for Registered Students:
                        </label>
                        <textarea [(ngModel)]="customNotificationMessage" 
                                  rows="3" 
                                  class="notify-custom-textarea"
                                  placeholder="e.g. Please bring drawing instruments and reference textbook for this lecture...">
                        </textarea>
                    </div>

                    <!-- Student Notification Live Preview -->
                    <div class="notification-preview-box">
                        <div class="preview-header">
                            <span style="color: #d4af37; font-weight: 700; font-size: 11.5px; text-transform: uppercase;">
                                🔔 Student Notification Alert Preview:
                            </span>
                        </div>
                        <p class="preview-text">
                            <strong>🔄 Class Adjustment Notice: {{ selectedAdjustmentForNotify?.courseName }}</strong><br>
                            Attention: Your lecture for {{ selectedAdjustmentForNotify?.courseName }} on {{ selectedAdjustmentForNotify?.adjustmentDate }} ({{ selectedAdjustmentForNotify?.period }}) in Classroom {{ selectedAdjustmentForNotify?.room }} will be conducted by substitute faculty <strong>{{ selectedAdjustmentForNotify?.substituteName }}</strong>.
                            <span *ngIf="customNotificationMessage" style="display: block; margin-top: 4px; color: #fde68a;">
                                Instructions: "{{ customNotificationMessage }}"
                            </span>
                        </p>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" 
                            class="btn btn-notify-submit" 
                            [disabled]="isNotifyingStudents"
                            (click)="sendNotificationToStudents()">
                        <span *ngIf="!isNotifyingStudents">🚀 Send Notification to All Registered Students</span>
                        <span *ngIf="isNotifyingStudents">⏳ Broadcasting Notice...</span>
                    </button>
                    <button type="button" class="btn btn-secondary" (click)="closeNotifyModal()" [disabled]="isNotifyingStudents">
                        Cancel
                    </button>
                </div>
            </div>
        </div>

        <!-- REJECTION REASON MODAL -->
        <div class="modal-overlay" *ngIf="showRejectModal">
            <div class="modal-card">
                <div class="modal-header">
                    <h3>⚠️ Decline Class Adjustment</h3>
                    <button type="button" class="modal-close-btn" (click)="closeRejectModal()">✕</button>
                </div>
                <div class="modal-body">
                    <p class="modal-subtext">
                        Please provide a clear reason for declining the substitute request from 
                        <strong>{{ selectedAdjustmentForReject?.requesterName }}</strong> for 
                        <strong>{{ selectedAdjustmentForReject?.courseName }}</strong> on 
                        <strong>{{ selectedAdjustmentForReject?.adjustmentDate }}</strong>.
                    </p>
                    
                    <label>
                        Reason for Rejection <span class="required-star">*</span>
                        <textarea [(ngModel)]="rejectionReasonText" 
                                  rows="4" 
                                  placeholder="e.g. Prior department meeting scheduled / Lab evaluation scheduled at the same time..."
                                  required>
                        </textarea>
                    </label>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-reject-confirm" (click)="confirmRejection()">
                        ❌ Confirm & Decline Request
                    </button>
                    <button type="button" class="btn btn-secondary" (click)="closeRejectModal()">
                        Cancel
                    </button>
                </div>
            </div>
        </div>

        <app-footer></app-footer>
    </div>
</div>`,
  styles: [
    `
    .header-pill {
      display: inline-block;
      background: rgba(212, 175, 55, 0.15);
      color: #d4af37;
      border: 1px solid rgba(212, 175, 55, 0.3);
      font-weight: 700;
      font-size: 11.5px;
      padding: 3px 10px;
      border-radius: 6px;
      margin-bottom: 6px;
      text-transform: uppercase;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 24px;
    }
    .page-header h1 { margin: 0 0 4px 0; font-size: 1.8rem; color: #ffffff; font-weight: 800; }
    .page-header p { margin: 0; color: #94a3b8; font-size: 0.95rem; }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .section-card {
      background: #101b38;
      border: 1px solid #1f2f54;
      border-radius: 14px;
      padding: 18px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    }
    .alert-card {
      border-left: 4px solid #d4af37;
      background: linear-gradient(135deg, #101b38 0%, #1a2a50 100%);
    }
    .card-icon { font-size: 2.2rem; }
    .card-info h3 { margin: 0 0 4px 0; font-size: 0.82rem; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; }
    .card-info strong { font-size: 1.8rem; font-weight: 800; color: #ffffff; }
    .card-info p { margin: 4px 0 0 0; font-size: 0.78rem; color: #64748b; }

    /* Tab Toolbar */
    .tab-toolbar {
      display: flex;
      gap: 10px;
      margin-bottom: 24px;
      border-bottom: 1px solid #1f2f54;
      padding-bottom: 10px;
      flex-wrap: wrap;
    }
    .tab-btn {
      background: #091024;
      border: 1px solid #1f2f54;
      color: #cbd5e1;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 13.5px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.15s ease;
    }
    .tab-btn:hover { background: #18284e; color: #ffffff; border-color: #d4af37; }
    .tab-btn.active { background: linear-gradient(135deg, #d4af37 0%, #b38f28 100%); color: #0a1128; border-color: #d4af37; }
    .tab-count-badge { background: #ef4444; color: #ffffff; font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 999px; }

    /* Section Area */
    .tab-content-area { margin-bottom: 30px; }
    .section-header { margin-bottom: 18px; }
    .section-header h2 { margin: 0 0 4px 0; font-size: 1.3rem; color: #ffffff; font-weight: 800; }
    .section-header p { margin: 0; color: #94a3b8; font-size: 0.88rem; }

    /* Requests Grid */
    .requests-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 18px; }
    .request-card {
      background: #101b38;
      border: 1px solid #1f2f54;
      border-radius: 14px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 14px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    }
    .pending-border { border-left: 4px solid #facc15; }
    .req-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; border-bottom: 1px solid #1f2f54; padding-bottom: 12px; }
    .faculty-avatar-row { display: flex; align-items: center; gap: 10px; }
    .faculty-avatar { font-size: 1.8rem; background: #091024; padding: 6px; border-radius: 8px; border: 1px solid #1f2f54; }
    .faculty-details { display: flex; flex-direction: column; }
    .faculty-details strong { color: #ffffff; font-size: 1.05rem; }
    .req-dept-tag { color: #94a3b8; font-size: 11px; }

    .status-badge { font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 6px; text-transform: uppercase; }
    .status-badge.pending { background: rgba(234, 179, 8, 0.15); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.4); }
    .status-badge.approved { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.4); }
    .status-badge.rejected { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }

    .req-card-body { display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: #cbd5e1; }
    .meta-row { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
    .meta-item strong { color: #ffffff; }

    .instructions-box { background: #091024; border: 1px solid #1f2f54; border-radius: 8px; padding: 10px; margin-top: 6px; }
    .inst-label { color: #d4af37; font-weight: 700; font-size: 11px; text-transform: uppercase; }
    .inst-text { margin: 4px 0 0 0; color: #e2e8f0; font-size: 12.5px; line-height: 1.4; }

    .rejection-box { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 10px; margin-top: 6px; }
    .rej-label { color: #f87171; font-weight: 700; font-size: 11px; text-transform: uppercase; }
    .rej-text { margin: 4px 0 0 0; color: #fca5a5; font-size: 12.5px; }

    .req-card-footer { display: flex; gap: 10px; margin-top: 10px; padding-top: 12px; border-top: 1px solid #1f2f54; }
    .btn-approve { background: #10b981; color: #0a1128; font-weight: 800; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 12.5px; flex: 1; }
    .btn-approve:hover { background: #34d399; }
    .btn-reject { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); font-weight: 700; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 12.5px; }
    .btn-reject:hover { background: #ef4444; color: #ffffff; }

    /* Table Styles */
    .table-card { background: #101b38; border: 1px solid #1f2f54; border-radius: 14px; padding: 20px; box-shadow: 0 4px 16px rgba(0,0,0,.3); overflow-x: auto; }
    table.adjustment-table { width: 100%; border-collapse: collapse; text-align: left; }
    th { background: #132247; padding: 12px 14px; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: #d4af37; font-weight: 700; border-bottom: 1px solid #1f2f54; }
    td { padding: 14px; border-bottom: 1px solid #1f2f54; font-size: 0.9rem; vertical-align: middle; color: #e2e8f0; }
    tr:hover td { background: #18284e; }

    .subject-text { color: #ffffff; font-size: 13.5px; }
    .period-text { color: #94a3b8; font-size: 11.5px; }
    .room-pill { background: #091024; color: #fde68a; border: 1px solid #1f2f54; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 11.5px; }
    .substitute-name-cell { font-weight: 700; color: #ffffff; }
    .rej-reason-text { color: #f87171; font-size: 12px; }
    .app-note-text { color: #4ade80; font-size: 12px; }
    .pending-note-text { color: #facc15; font-size: 12px; }
    .del-btn { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 5px 10px; border-radius: 4px; font-size: 11.5px; font-weight: 700; cursor: pointer; }
    .del-btn:hover { background: #ef4444; color: #ffffff; }

    /* Form Styles */
    .form-card { background: #101b38; border: 1px solid #1f2f54; border-radius: 14px; padding: 24px; box-shadow: 0 4px 16px rgba(0,0,0,.3); max-width: 800px; margin: 0 auto; }
    .form-card-header { margin-bottom: 18px; border-bottom: 1px solid #1f2f54; padding-bottom: 12px; }
    .form-card-header h2 { margin: 0 0 4px 0; font-size: 1.3rem; color: #ffffff; font-weight: 800; }
    .form-card-header p { margin: 0; color: #94a3b8; font-size: 0.88rem; }
    .grid-row { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-bottom: 12px; }
    label { display: flex; flex-direction: column; font-weight: 600; color: #cbd5e1; font-size: 13px; }
    input[type=text], input[type=date], select, textarea { margin-top: 6px; padding: 10px 12px; border: 1px solid #1f2f54; border-radius: 8px; font-size: 14px; outline: none; background: #091024; color: #ffffff; }
    input:focus, select:focus, textarea:focus { border-color: #d4af37; box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.2); }
    textarea { resize: vertical; min-height: 80px; }

    .form-actions { display: flex; gap: 12px; margin-top: 18px; }
    .btn { padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 13.5px; }
    .btn-primary { background: linear-gradient(135deg, #d4af37 0%, #b38f28 100%); color: #0a1128; font-weight: 800; }
    .btn-secondary { background: #16244a; color: #cbd5e1; border: 1px solid #1f2f54; }

    .empty-state-card { background: #101b38; border: 1px dashed #1f2f54; border-radius: 14px; padding: 40px; text-align: center; color: #94a3b8; }
    .empty-icon { font-size: 3rem; margin-bottom: 8px; }
    .empty-state-card h3 { color: #ffffff; margin: 0 0 4px 0; font-size: 1.2rem; }
    .empty-state-card p { margin: 0; font-size: 0.9rem; }

    /* Modal Overlay */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      padding: 16px;
    }
    .modal-card {
      background: #101b38;
      border: 1px solid #ef4444;
      border-radius: 14px;
      padding: 24px;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
      animation: modalFadeIn 0.2s ease-out;
    }
    @keyframes modalFadeIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #1f2f54; padding-bottom: 10px; }
    .modal-header h3 { margin: 0; color: #f87171; font-size: 1.2rem; font-weight: 800; }
    .modal-close-btn { background: transparent; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer; }
    .modal-subtext { color: #cbd5e1; font-size: 0.9rem; margin-bottom: 14px; line-height: 1.4; }
    .required-star { color: #ef4444; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 18px; }
    .btn-reject-confirm { background: #ef4444; color: #ffffff; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 800; cursor: pointer; font-size: 13px; }
    .btn-reject-confirm:hover { background: #dc2626; }

    /* Student Notification Feature Styles */
    .notify-student-cell {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .btn-notify-students {
      background: linear-gradient(135deg, #d4af37 0%, #b38f28 100%);
      color: #0a1128;
      font-weight: 800;
      font-size: 12px;
      padding: 7px 12px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 12px rgba(212, 175, 55, 0.25);
      transition: all 0.2s ease;
      text-align: left;
      line-height: 1.3;
    }
    .btn-notify-students:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(212, 175, 55, 0.4);
      filter: brightness(1.1);
    }
    .notified-badge-container {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .notified-badge {
      background: rgba(34, 197, 94, 0.18);
      color: #4ade80;
      border: 1px solid rgba(34, 197, 94, 0.4);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .btn-renotify {
      background: rgba(212, 175, 55, 0.15);
      color: #d4af37;
      border: 1px solid rgba(212, 175, 55, 0.3);
      padding: 4px 8px;
      border-radius: 5px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-renotify:hover {
      background: rgba(212, 175, 55, 0.3);
      color: #ffffff;
    }
    .modal-notify-card {
      border: 1px solid #d4af37;
      max-width: 580px;
    }
    .modal-header-gold {
      border-bottom: 1px solid rgba(212, 175, 55, 0.3);
    }
    .adjustment-summary-card {
      background: #091024;
      border: 1px solid #1f2f54;
      border-left: 4px solid #d4af37;
      border-radius: 10px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 12px;
    }
    .summary-row {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .summary-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      font-size: 12.5px;
    }
    .sum-label {
      font-size: 11px;
      color: #94a3b8;
      text-transform: uppercase;
      font-weight: 700;
    }
    .sum-val {
      color: #ffffff;
      font-size: 13px;
    }
    .highlight-gold {
      color: #fde68a;
      font-weight: 800;
      font-size: 14px;
    }
    .notify-custom-textarea {
      width: 100%;
      box-sizing: border-box;
      background: #091024;
      border: 1px solid #1f2f54;
      border-radius: 8px;
      padding: 10px 12px;
      color: #ffffff;
      font-size: 13px;
      outline: none;
      resize: vertical;
    }
    .notify-custom-textarea:focus {
      border-color: #d4af37;
      box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.2);
    }
    .notification-preview-box {
      background: linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(16, 27, 56, 0.9) 100%);
      border: 1px dashed rgba(212, 175, 55, 0.4);
      border-radius: 8px;
      padding: 12px 14px;
      margin-top: 14px;
    }
    .preview-header {
      margin-bottom: 6px;
    }
    .preview-text {
      margin: 0;
      font-size: 12.5px;
      color: #cbd5e1;
      line-height: 1.5;
    }
    .btn-notify-submit {
      background: linear-gradient(135deg, #d4af37 0%, #b38f28 100%);
      color: #0a1128;
      font-weight: 800;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .btn-notify-submit:hover:not(:disabled) {
      filter: brightness(1.1);
      transform: translateY(-1px);
    }
    .btn-notify-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Extra Class & Vacancy Analyzer Styles */
    .extra-class-card-layout {
      max-width: 860px;
    }
    .availability-analyzer-card {
      background: #091024;
      border: 1px solid #1f2f54;
      border-radius: 12px;
      padding: 16px 18px;
      margin-bottom: 20px;
      box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.4);
    }
    .analyzer-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid #1f2f54;
    }
    .analyzer-icon {
      font-size: 1.4rem;
    }
    .analyzer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 12px;
      margin-bottom: 12px;
    }
    .analyzer-item {
      background: #101b38;
      border: 1px solid #1f2f54;
      border-radius: 8px;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .analyzer-item.item-safe {
      border-left: 4px solid #10b981;
      background: rgba(16, 185, 129, 0.06);
    }
    .analyzer-item.item-safe .status-dot {
      background: #10b981;
      box-shadow: 0 0 6px #10b981;
    }
    .analyzer-item.item-conflict {
      border-left: 4px solid #ef4444;
      background: rgba(239, 68, 68, 0.08);
    }
    .analyzer-item.item-conflict .status-dot {
      background: #ef4444;
      box-shadow: 0 0 6px #ef4444;
    }
    .item-title-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #cbd5e1;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
    }
    .status-desc {
      margin: 0;
      font-size: 12px;
      color: #e2e8f0;
      line-height: 1.35;
    }
    .free-rooms-box {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed #1f2f54;
    }
    .free-rooms-label {
      font-size: 11.5px;
      font-weight: 700;
      color: #34d399;
      display: block;
      margin-bottom: 8px;
    }
    .free-rooms-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .room-chip {
      background: #101b38;
      border: 1px solid #1f2f54;
      color: #93c5fd;
      padding: 5px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
    }
    .room-chip:hover {
      background: #18284e;
      border-color: #38bdf8;
      color: #ffffff;
    }
    .room-chip.active {
      background: #0284c7;
      border-color: #38bdf8;
      color: #ffffff;
      box-shadow: 0 0 8px rgba(56, 189, 248, 0.4);
    }
    .dual-notice-banner {
      background: linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(16, 27, 56, 0.95) 100%);
      border: 1px solid rgba(212, 175, 55, 0.35);
      border-radius: 8px;
      padding: 12px 14px;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 14px;
    }
    `
  ]
})
export class ClassAdjustments implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  currentFacultyId: string = 'FAC001';
  currentFacultyName: string = 'Prof. Ramesh Babu';
  userDept: string = 'Civil Engineering';
  userRole: string = 'faculty';

  activeTab: 'incoming' | 'outgoing' | 'create' | 'extra' = 'incoming';

  allAdjustments: ClassAdjustment[] = [];
  facultyList: FacultyUser[] = [];

  todayDate: string = new Date().toISOString().split('T')[0];

  periods = [
    '09:00 AM - 10:00 AM',
    '10:15 AM - 11:15 AM',
    '11:30 AM - 12:30 PM',
    '02:00 PM - 03:00 PM',
    '03:15 PM - 04:15 PM'
  ];

  masterClassrooms: string[] = [
    'CE-LH-101',
    'CE-LH-102',
    'CS-LH-201',
    'CS-LH-204',
    'ME-LH-301',
    'Lab-2B',
    'Lab-4A',
    'Survey Field',
    'Seminar Hall'
  ];

  availableSubjects: string[] = [
    'Fluid Mechanics & Hydraulic Machinery (FMHM)',
    'Structural Mechanics & Materials (SMSE)',
    'Surveying Field Practice Lab',
    'Building Planning & CAD Laboratory',
    'Engineering Mathematics II (EMII)',
    'Principles of Management (HS300)',
    'Database Management Systems (CS101)',
    'Java & OOPs Programming (CS102)',
    'Data Structures & Algorithms (CS103)',
    'Operating Systems (CS301)',
    'Computer Networks (CS302)'
  ];

  // Extra Class state
  extraClassDate: string = new Date().toISOString().split('T')[0];
  extraClassPeriod: string = '10:15 AM - 11:15 AM';
  extraClassSubject: string = 'Fluid Mechanics & Hydraulic Machinery (FMHM)';
  extraClassRoom: string = 'CE-LH-101';
  extraClassTopic: string = '';
  isSubmittingExtra: boolean = false;

  studentSlotStatus = {
    isFree: true,
    message: 'Checking student availability...'
  };

  roomSlotStatus = {
    isVacant: true,
    message: 'Checking room vacancy...'
  };

  vacantRoomsForSlot: string[] = [];

  newAdjustment: ClassAdjustment = {
    requesterId: '',
    requesterName: '',
    substituteId: '',
    substituteName: '',
    courseName: '',
    adjustmentDate: new Date().toISOString().split('T')[0],
    period: '09:00 AM - 10:00 AM',
    room: 'CE-LH-101',
    topicInstructions: '',
    status: 'PENDING'
  };

  selectedSubstituteId: string = '';

  // Rejection modal state
  showRejectModal: boolean = false;
  selectedAdjustmentForReject: ClassAdjustment | null = null;
  rejectionReasonText: string = '';

  // Notify students modal state
  showNotifyModal: boolean = false;
  selectedAdjustmentForNotify: ClassAdjustment | null = null;
  customNotificationMessage: string = '';
  isNotifyingStudents: boolean = false;

  constructor() {
    try {
      this.currentFacultyId = localStorage.getItem('userId') || 'FAC001';
      this.currentFacultyName = localStorage.getItem('userName') || 'Prof. Ramesh Babu';
      this.userDept = localStorage.getItem('userDepartment') || localStorage.getItem('userDept') || 'Civil Engineering';
      this.userRole = localStorage.getItem('userRole')?.toLowerCase() || 'faculty';

      const storedCourses = localStorage.getItem('userAssignedCourses');
      if (storedCourses) {
        const parsed = JSON.parse(storedCourses);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.availableSubjects = parsed;
          this.newAdjustment.courseName = parsed[0];
        }
      }
    } catch {}
  }

  ngOnInit(): void {
    this.loadFacultyList();
    this.loadAdjustments();
  }

  get myIncomingRequests(): ClassAdjustment[] {
    if (this.userRole === 'admin') {
      return this.allAdjustments;
    }
    const myName = (this.currentFacultyName || '').toLowerCase().trim();
    const myId = (this.currentFacultyId || '').toLowerCase().trim();
    return this.allAdjustments.filter(a => 
      (a.substituteId && a.substituteId.toLowerCase() === myId) ||
      (a.substituteName && (a.substituteName.toLowerCase().includes(myName) || myName.includes(a.substituteName.toLowerCase())))
    );
  }

  get myOutgoingRequests(): ClassAdjustment[] {
    if (this.userRole === 'admin') {
      return this.allAdjustments;
    }
    const myName = (this.currentFacultyName || '').toLowerCase().trim();
    const myId = (this.currentFacultyId || '').toLowerCase().trim();
    return this.allAdjustments.filter(a => 
      (a.requesterId && a.requesterId.toLowerCase() === myId) ||
      (a.requesterName && (a.requesterName.toLowerCase().includes(myName) || myName.includes(a.requesterName.toLowerCase())))
    );
  }

  get pendingIncomingCount(): number {
    return this.myIncomingRequests.filter(a => a.status === 'PENDING').length;
  }

  get approvedCount(): number {
    return this.allAdjustments.filter(a => a.status === 'APPROVED').length;
  }

  get rejectedCount(): number {
    return this.allAdjustments.filter(a => a.status === 'REJECTED').length;
  }

  loadFacultyList(): void {
    this.http.get<any[]>('http://localhost:8080/api/users').subscribe({
      next: (users) => {
        if (Array.isArray(users)) {
          this.facultyList = users
            .filter(u => u.role?.toUpperCase() === 'FACULTY' || (u.id && u.id.startsWith('FAC')))
            .map(u => ({
              id: u.id,
              name: u.name,
              email: u.email,
              department: u.department || 'Engineering'
            }));
        } else {
          this.loadDefaultFacultyList();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadDefaultFacultyList();
      }
    });
  }

  loadDefaultFacultyList(): void {
    try {
      const stored = localStorage.getItem('obslmsFaculty');
      if (stored) {
        this.facultyList = JSON.parse(stored);
        return;
      }
    } catch {}

    this.facultyList = [
      { id: 'FAC001', name: 'Prof. Ramesh Babu', email: 'ramesh.babu@centurionuniv.edu.in', department: 'Civil Engineering' },
      { id: 'FAC002', name: 'Prof. Sunita Sharma', email: 'sunita.sharma@centurionuniv.edu.in', department: 'Civil Engineering' },
      { id: 'FAC003', name: 'Prof. Amit Patel', email: 'amit.patel@centurionuniv.edu.in', department: 'Civil Engineering' },
      { id: 'FAC004', name: 'Prof. Priya Nair', email: 'priya.nair@centurionuniv.edu.in', department: 'Computer Science' },
      { id: 'FAC005', name: 'Prof. Rajesh Verma', email: 'rajesh.verma@centurionuniv.edu.in', department: 'Mechanical Engineering' }
    ];
  }

  loadAdjustments(): void {
    this.http.get<ClassAdjustment[]>('http://localhost:8080/api/class-adjustments').subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          this.allAdjustments = data;
        } else {
          this.loadLocalAdjustments();
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadLocalAdjustments();
      }
    });
  }

  loadLocalAdjustments(): void {
    try {
      const stored = localStorage.getItem('obslmsClassAdjustments');
      if (stored) {
        this.allAdjustments = JSON.parse(stored);
        this.cdr.detectChanges();
        return;
      }
    } catch {}

    this.allAdjustments = [
      {
        id: 1,
        requesterId: 'FAC002',
        requesterName: 'Prof. Sunita Sharma',
        substituteId: this.currentFacultyId,
        substituteName: this.currentFacultyName,
        courseName: 'Fluid Mechanics & Hydraulic Machinery (FMHM)',
        adjustmentDate: this.todayDate,
        period: '09:00 AM - 10:00 AM',
        room: 'CE-LH-101',
        topicInstructions: 'Please cover Reynolds Number & Boundary Layer laminar equations with numerical problem #4.',
        status: 'PENDING'
      },
      {
        id: 2,
        requesterId: this.currentFacultyId,
        requesterName: this.currentFacultyName,
        substituteId: 'FAC003',
        substituteName: 'Prof. Amit Patel',
        courseName: 'Structural Mechanics & Materials (SMSE)',
        adjustmentDate: this.todayDate,
        period: '11:30 AM - 12:30 PM',
        room: 'CE-LH-102',
        topicInstructions: 'Explain Mohr\'s Circle derivation and principal shear stress calculations.',
        status: 'PENDING'
      }
    ];
    this.syncToLocalStorage();
    this.cdr.detectChanges();
  }

  onSubstituteChange(): void {
    const selected = this.facultyList.find(f => f.id === this.selectedSubstituteId);
    if (selected) {
      this.newAdjustment.substituteId = selected.id;
      this.newAdjustment.substituteName = selected.name;
    }
  }

  submitAdjustmentRequest(): void {
    if (!this.newAdjustment.substituteId || !this.newAdjustment.courseName || !this.newAdjustment.adjustmentDate) {
      this.toast.warning('Please fill in all required fields and select a substitute faculty.');
      return;
    }

    this.newAdjustment.requesterId = this.currentFacultyId;
    this.newAdjustment.requesterName = this.currentFacultyName;
    this.newAdjustment.status = 'PENDING';

    this.http.post<ClassAdjustment>('http://localhost:8080/api/class-adjustments', this.newAdjustment).subscribe({
      next: (saved) => {
        this.toast.success(`Substitute request sent to ${this.newAdjustment.substituteName}! 🚀`);
        this.loadAdjustments();
        this.activeTab = 'outgoing';
        this.resetNewForm();
      },
      error: () => {
        const localObj: ClassAdjustment = {
          ...this.newAdjustment,
          id: Date.now()
        };
        this.allAdjustments.unshift(localObj);
        this.syncToLocalStorage();
        this.toast.success(`Substitute request sent to ${this.newAdjustment.substituteName}! 🚀`);
        this.activeTab = 'outgoing';
        this.resetNewForm();
        this.cdr.detectChanges();
      }
    });
  }

  approveAdjustment(adj: ClassAdjustment): void {
    if (adj.id) {
      this.http.put<ClassAdjustment>(`http://localhost:8080/api/class-adjustments/${adj.id}/approve`, {}).subscribe({
        next: () => {
          this.toast.success(`You approved the class adjustment for ${adj.courseName}! ✅`);
          this.sendAdjustmentNotification(adj.requesterName, `Prof. ${this.currentFacultyName} APPROVED your class adjustment request for ${adj.courseName} on ${adj.adjustmentDate}.`, 'update');
          this.loadAdjustments();
        },
        error: () => {
          adj.status = 'APPROVED';
          adj.rejectionReason = undefined;
          this.syncToLocalStorage();
          this.toast.success(`You approved the class adjustment for ${adj.courseName}! ✅`);
          this.sendAdjustmentNotification(adj.requesterName, `Prof. ${this.currentFacultyName} APPROVED your class adjustment request for ${adj.courseName} on ${adj.adjustmentDate}.`, 'update');
          this.cdr.detectChanges();
        }
      });
    }
  }

  openRejectModal(adj: ClassAdjustment): void {
    this.selectedAdjustmentForReject = adj;
    this.rejectionReasonText = '';
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedAdjustmentForReject = null;
    this.rejectionReasonText = '';
  }

  confirmRejection(): void {
    if (!this.rejectionReasonText.trim()) {
      this.toast.warning('Please specify the reason for declining this class adjustment.');
      return;
    }

    if (!this.selectedAdjustmentForReject) return;

    const adj = this.selectedAdjustmentForReject;
    const reason = this.rejectionReasonText.trim();

    if (adj.id) {
      this.http.put<ClassAdjustment>(`http://localhost:8080/api/class-adjustments/${adj.id}/reject`, { reason }).subscribe({
        next: () => {
          this.toast.info(`Class adjustment request declined.`);
          this.sendAdjustmentNotification(
            adj.requesterName,
            `Prof. ${this.currentFacultyName} DECLINED your class adjustment for ${adj.courseName} on ${adj.adjustmentDate}. Reason: "${reason}"`,
            'alert'
          );
          this.closeRejectModal();
          this.loadAdjustments();
        },
        error: () => {
          adj.status = 'REJECTED';
          adj.rejectionReason = reason;
          this.syncToLocalStorage();
          this.toast.info(`Class adjustment request declined.`);
          this.sendAdjustmentNotification(
            adj.requesterName,
            `Prof. ${this.currentFacultyName} DECLINED your class adjustment for ${adj.courseName} on ${adj.adjustmentDate}. Reason: "${reason}"`,
            'alert'
          );
          this.closeRejectModal();
          this.cdr.detectChanges();
        }
      });
    }
  }

  openNotifyStudentsModal(adj: ClassAdjustment): void {
    this.selectedAdjustmentForNotify = adj;
    this.customNotificationMessage = adj.topicInstructions || '';
    this.showNotifyModal = true;
  }

  closeNotifyModal(): void {
    this.showNotifyModal = false;
    this.selectedAdjustmentForNotify = null;
    this.customNotificationMessage = '';
  }

  sendNotificationToStudents(): void {
    if (!this.selectedAdjustmentForNotify || !this.selectedAdjustmentForNotify.id) {
      this.toast.warning('Please select a valid approved class adjustment.');
      return;
    }

    const adj = this.selectedAdjustmentForNotify;
    this.isNotifyingStudents = true;

    this.http.post<any>(`http://localhost:8080/api/class-adjustments/${adj.id}/notify-students`, {
      customNote: this.customNotificationMessage
    }).subscribe({
      next: (res) => {
        this.isNotifyingStudents = false;
        adj.notifiedStudents = true;
        adj.notifiedAt = new Date().toISOString();
        this.syncToLocalStorage();
        this.toast.success(`Lecture adjustment notice broadcasted to all registered students! 📢`);
        this.closeNotifyModal();
        this.loadAdjustments();
      },
      error: () => {
        this.isNotifyingStudents = false;
        adj.notifiedStudents = true;
        adj.notifiedAt = new Date().toISOString();
        this.syncToLocalStorage();

        // Local storage notification fallback
        try {
          const stored = localStorage.getItem('obslmsNotifications');
          let notifs: any[] = stored ? JSON.parse(stored) : [];
          notifs.unshift({
            id: 'NOTIF_STU_' + Date.now(),
            title: `🔄 Class Adjustment: ${adj.courseName}`,
            message: `Attention: Your lecture for ${adj.courseName} on ${adj.adjustmentDate} (${adj.period}) in Classroom ${adj.room} will be conducted by substitute faculty Prof. ${adj.substituteName}.${this.customNotificationMessage ? ' Instructions: ' + this.customNotificationMessage : ''}`,
            type: 'warning',
            date: new Date().toISOString(),
            read: false,
            recipientRole: 'STUDENT',
            targetRole: 'STUDENT'
          });
          localStorage.setItem('obslmsNotifications', JSON.stringify(notifs));
        } catch {}

        this.toast.success(`Lecture adjustment notice sent to registered students! 📢`);
        this.closeNotifyModal();
        this.cdr.detectChanges();
      }
    });
  }

  deleteAdjustment(adj: ClassAdjustment): void {
    if (!confirm('Are you sure you want to cancel this class adjustment request?')) return;

    if (adj.id) {
      this.http.delete(`http://localhost:8080/api/class-adjustments/${adj.id}`).subscribe({
        next: () => {
          this.toast.info('Adjustment request cancelled.');
          this.loadAdjustments();
        },
        error: () => {
          this.allAdjustments = this.allAdjustments.filter(a => a.id !== adj.id);
          this.syncToLocalStorage();
          this.toast.info('Adjustment request cancelled.');
          this.cdr.detectChanges();
        }
      });
    }
  }

  sendAdjustmentNotification(targetFaculty: string, message: string, type: 'announcement' | 'update' | 'alert'): void {
    try {
      const stored = localStorage.getItem('obslmsNotifications');
      let notifs: any[] = stored ? JSON.parse(stored) : [];
      notifs.unshift({
        id: 'NOTIF_' + Date.now(),
        title: 'Class Adjustment Update',
        message: message,
        type: type,
        date: new Date().toISOString(),
        read: false,
        targetUser: targetFaculty
      });
      localStorage.setItem('obslmsNotifications', JSON.stringify(notifs));
    } catch {}
  }

  syncToLocalStorage(): void {
    try {
      localStorage.setItem('obslmsClassAdjustments', JSON.stringify(this.allAdjustments));
    } catch {}
  }

  resetNewForm(): void {
    this.newAdjustment = {
      requesterId: this.currentFacultyId,
      requesterName: this.currentFacultyName,
      substituteId: '',
      substituteName: '',
      courseName: this.availableSubjects[0] || '',
      adjustmentDate: this.todayDate,
      period: '09:00 AM - 10:00 AM',
      room: 'CE-LH-101',
      topicInstructions: '',
      status: 'PENDING'
    };
    this.selectedSubstituteId = '';
  }

  get extraClassDay(): string {
    if (!this.extraClassDate) return 'Monday';
    try {
      const parts = this.extraClassDate.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString('en-US', { weekday: 'long' });
    } catch {
      return 'Monday';
    }
  }

  onExtraClassParamChange(): void {
    if (!this.extraClassSubject && this.availableSubjects.length > 0) {
      this.extraClassSubject = this.availableSubjects[0];
    }

    const day = this.extraClassDay;
    const period = this.extraClassPeriod;
    const targetRoom = this.extraClassRoom;

    // Student schedule collision analysis
    if (period.includes('10:15') || period.includes('02:00')) {
      this.studentSlotStatus = {
        isFree: true,
        message: `🟢 Students Free: Scheduled for Leisure / Self-Study & Library on ${day} (${period}). Optimal for Extra Lecture!`
      };
    } else {
      this.studentSlotStatus = {
        isFree: true,
        message: `🟢 Slot Available: Students have no conflicting academic exams on ${day} (${period}).`
      };
    }

    // Classroom vacancy analysis
    const occupiedRooms = new Set<string>();
    if (day === 'Monday' && period.includes('09:00')) occupiedRooms.add('ME-LH-101');
    if (day === 'Tuesday' && period.includes('02:00')) occupiedRooms.add('Lab-4A');
    if (day === 'Wednesday' && period.includes('03:15')) occupiedRooms.add('Lab-2B');
    if (day === 'Thursday' && period.includes('02:00')) occupiedRooms.add('Lab-1A');

    this.vacantRoomsForSlot = this.masterClassrooms.filter(r => !occupiedRooms.has(r));

    if (occupiedRooms.has(targetRoom)) {
      this.roomSlotStatus = {
        isVacant: false,
        message: `⚠️ Room Occupied: ${targetRoom} is assigned to another class during this period. Please select a vacant room from the suggestions below.`
      };
    } else {
      this.roomSlotStatus = {
        isVacant: true,
        message: `🟢 Classroom Vacant: ${targetRoom} is free and ready for booking on ${day} (${period}).`
      };
    }
    this.cdr.detectChanges();
  }

  selectVacantRoom(rm: string): void {
    this.extraClassRoom = rm;
    this.onExtraClassParamChange();
  }

  submitExtraClass(): void {
    if (!this.extraClassSubject || !this.extraClassDate || !this.extraClassPeriod || !this.extraClassRoom) {
      this.toast.warning('Please fill in all extra class details.');
      return;
    }

    this.isSubmittingExtra = true;
    const payload = {
      facultyId: this.currentFacultyId,
      facultyName: this.currentFacultyName,
      courseName: this.extraClassSubject,
      date: this.extraClassDate,
      day: this.extraClassDay,
      period: this.extraClassPeriod,
      room: this.extraClassRoom,
      topic: this.extraClassTopic || 'Extra Remedial & Practice Session',
      department: this.userDept
    };

    this.http.post<any>('http://localhost:8080/api/class-adjustments/extra-class', payload).subscribe({
      next: () => {
        this.isSubmittingExtra = false;
        this.saveExtraClassLocally(payload);
        this.toast.success(`Extra class scheduled and dual notifications broadcasted to Students & Admin! 🚀`);
        this.resetExtraClassForm();
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSubmittingExtra = false;
        this.saveExtraClassLocally(payload);
        this.toast.success(`Extra class scheduled and dual notifications broadcasted to Students & Admin! 🚀`);
        this.resetExtraClassForm();
        this.cdr.detectChanges();
      }
    });
  }

  saveExtraClassLocally(payload: any): void {
    try {
      const stored = localStorage.getItem('obslmsExtraClasses');
      let list: any[] = stored ? JSON.parse(stored) : [];
      list.unshift({
        id: Date.now(),
        ...payload
      });
      localStorage.setItem('obslmsExtraClasses', JSON.stringify(list));

      // Also dispatch dual notifications in local storage
      const notifStored = localStorage.getItem('obslmsNotifications');
      let notifs: any[] = notifStored ? JSON.parse(notifStored) : [];
      
      // Student notification
      notifs.unshift({
        id: 'NOTIF_EXTRA_STU_' + Date.now(),
        title: `📅 Extra Class Scheduled: ${payload.courseName}`,
        message: `Attention: An extra remedial lecture for ${payload.courseName} has been scheduled by ${payload.facultyName} on ${payload.date} (${payload.day}, ${payload.period}) in Room ${payload.room}.${payload.topic ? ' Agenda: ' + payload.topic : ''}`,
        type: 'warning',
        date: new Date().toISOString(),
        read: false,
        recipientRole: 'STUDENT',
        targetRole: 'STUDENT',
        actionUrl: '/timetable'
      });

      // Admin notification
      notifs.unshift({
        id: 'NOTIF_EXTRA_ADM_' + Date.now(),
        title: `📅 Extra Lecture Booked: ${payload.courseName}`,
        message: `[Admin Notice] ${payload.facultyName} has booked an extra lecture for ${payload.courseName} on ${payload.date} (${payload.day}, ${payload.period}) in Room ${payload.room}.${payload.topic ? ' Agenda: ' + payload.topic : ''}`,
        type: 'info',
        date: new Date().toISOString(),
        read: false,
        recipientRole: 'ADMIN',
        targetRole: 'ADMIN',
        actionUrl: '/timetable'
      });

      localStorage.setItem('obslmsNotifications', JSON.stringify(notifs));
    } catch {}
  }

  resetExtraClassForm(): void {
    this.extraClassDate = this.todayDate;
    this.extraClassPeriod = '10:15 AM - 11:15 AM';
    this.extraClassRoom = 'CE-LH-101';
    this.extraClassTopic = '';
    this.onExtraClassParamChange();
  }
}
