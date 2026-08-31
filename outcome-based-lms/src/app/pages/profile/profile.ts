import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { ToastService } from '../../shared/services/toast.service';

interface ProfileData {
  name: string;
  email: string;
  role: string;
  department: string;
  phone: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Navbar, Sidebar, Footer],
  template: `<app-navbar></app-navbar>

<div *ngIf="isStudent; else fullApp" class="student-shell" [ngStyle]="themeStyles">
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
          <button mat-button *ngFor="let item of group.items" (click)="navigate(item.path)" [class.active]="item.path === '/profile'">
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
    
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <div class="header-title">
        <h1 style="margin: 0; font-size: 1.8rem; color: var(--student-text); font-weight: 800;">👤 My Profile</h1>
        <p style="margin: 4px 0 0 0; color: var(--student-text-secondary); font-size: 0.95rem;">Review and update your user credentials, profile photo, and contact details.</p>
      </div>
    </div>

    <!-- Success Message -->
    <div *ngIf="showSuccessMessage" class="alert alert-success">
      ✅ Profile changes saved successfully!
    </div>

    <!-- General Validation Error -->
    <div *ngIf="validationErrors['general']" class="alert alert-error">
      ⚠️ {{ validationErrors['general'] }}
    </div>

    <form class="profile-form" (ngSubmit)="saveProfile(profileForm)" #profileForm="ngForm">
      <!-- Profile Picture Section -->
      <div class="profile-picture-section">
        <div class="picture-container" (click)="fileInput.click()" title="Click to upload profile photo">
          <img *ngIf="profilePicturePreview" [src]="profilePicturePreview" alt="Profile Picture" class="profile-pic" />
          <div *ngIf="!profilePicturePreview" class="profile-pic-placeholder">
            📷
          </div>
          <div class="pic-hover-overlay">
            <span>📷 Change</span>
          </div>
        </div>
        <div class="picture-controls">
          <p class="picture-label">Profile Photo</p>
          <small class="picture-hint">Click the avatar or upload button (PNG, JPG, WebP supported)</small>
          
          <input 
            #fileInput
            type="file" 
            accept="image/*" 
            (change)="onProfilePictureSelected($event)"
            class="file-input"
            style="display:none;" />
            
          <div class="pic-action-buttons">
            <button 
              type="button" 
              class="btn-upload"
              (click)="fileInput.click()">
              📤 Upload Photo
            </button>
            <button 
              *ngIf="profilePicturePreview"
              type="button" 
              class="btn-remove-pic"
              (click)="removeProfilePicture()">
              🗑️ Remove
            </button>
          </div>
        </div>
      </div>

      <!-- Name Field -->
      <div class="form-group">
        <label for="name">Full Name *</label>
        <input 
          id="name" 
          name="name" 
          type="text" 
          [(ngModel)]="profile.name" 
          required 
          [readonly]="!editing"
          [class.input-error]="validationErrors['name']"
          class="form-input" />
        <span *ngIf="validationErrors['name']" class="error-message">
          ❌ {{ validationErrors['name'] }}
        </span>
      </div>

      <!-- Email Field -->
      <div class="form-group">
        <label for="email">Email Address *</label>
        <input 
          id="email" 
          name="email" 
          type="email" 
          [(ngModel)]="profile.email" 
          required 
          [readonly]="!editing"
          [class.input-error]="validationErrors['email']"
          class="form-input" />
        <span *ngIf="validationErrors['email']" class="error-message">
          ❌ {{ validationErrors['email'] }}
        </span>
      </div>

      <!-- Role Field -->
      <div class="form-group">
        <label for="role">Role</label>
        <input 
          id="role" 
          name="role" 
          type="text" 
          [(ngModel)]="profile.role" 
          readonly
          class="form-input" />
      </div>

      <!-- Department Field -->
      <div class="form-group">
        <label for="department">Department *</label>
        <input 
          id="department" 
          name="department" 
          type="text" 
          [(ngModel)]="profile.department" 
          [readonly]="!editing"
          [class.input-error]="validationErrors['department']"
          placeholder="e.g., Computer Science"
          class="form-input" />
        <span *ngIf="validationErrors['department']" class="error-message">
          ❌ {{ validationErrors['department'] }}
        </span>
      </div>

      <!-- Phone Field -->
      <div class="form-group">
        <label for="phone">Phone Number *</label>
        <input 
          id="phone" 
          name="phone" 
          type="tel" 
          [(ngModel)]="profile.phone" 
          [readonly]="!editing"
          [class.input-error]="validationErrors['phone']"
          placeholder="+91-XXXXXXXXXX"
          class="form-input" />
        <span *ngIf="validationErrors['phone']" class="error-message">
          ❌ {{ validationErrors['phone'] }}
        </span>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" (click)="toggleEdit()">
          {{ editing ? '❌ Cancel' : '✏️ Edit Profile' }}
        </button>
        <button type="button" class="btn btn-secondary" routerLink="/settings/security">
          🔐 Change Password
        </button>
        <button type="submit" class="btn btn-primary" [disabled]="!editing">
          💾 Save Changes
        </button>
      </div>
    </form>

    <app-footer></app-footer>
  </div>
</div>

<ng-template #fullApp>
<div class="container">
  <app-sidebar></app-sidebar>
  <div class="content">
    <div class="page-header">
      <h1>👤 My Profile</h1>
      <p>Review and update your user credentials, profile photo, and contact details.</p>
    </div>

    <!-- Success Message -->
    <div *ngIf="showSuccessMessage" class="alert alert-success">
      ✅ Profile changes saved successfully!
    </div>

    <!-- General Validation Error -->
    <div *ngIf="validationErrors['general']" class="alert alert-error">
      ⚠️ {{ validationErrors['general'] }}
    </div>

    <form class="profile-form" (ngSubmit)="saveProfile(profileForm)" #profileForm="ngForm">
      <!-- Profile Picture Section -->
      <div class="profile-picture-section">
        <div class="picture-container" (click)="fileInput.click()" title="Click to upload profile photo">
          <img *ngIf="profilePicturePreview" [src]="profilePicturePreview" alt="Profile Picture" class="profile-pic" />
          <div *ngIf="!profilePicturePreview" class="profile-pic-placeholder">
            📷
          </div>
          <div class="pic-hover-overlay">
            <span>📷 Change</span>
          </div>
        </div>
        <div class="picture-controls">
          <p class="picture-label">Profile Photo</p>
          <small class="picture-hint">Click the avatar or upload button (PNG, JPG, WebP supported)</small>
          
          <input 
            #fileInput
            type="file" 
            accept="image/*" 
            (change)="onProfilePictureSelected($event)"
            class="file-input"
            style="display:none;" />
            
          <div class="pic-action-buttons">
            <button 
              type="button" 
              class="btn-upload"
              (click)="fileInput.click()">
              📤 Upload Photo
            </button>
            <button 
              *ngIf="profilePicturePreview"
              type="button" 
              class="btn-remove-pic"
              (click)="removeProfilePicture()">
              🗑️ Remove
            </button>
          </div>
        </div>
      </div>

      <!-- Name Field -->
      <div class="form-group">
        <label for="name">Full Name *</label>
        <input 
          id="name" 
          name="name" 
          type="text" 
          [(ngModel)]="profile.name" 
          required 
          [readonly]="!editing"
          [class.input-error]="validationErrors['name']"
          class="form-input" />
        <span *ngIf="validationErrors['name']" class="error-message">
          ❌ {{ validationErrors['name'] }}
        </span>
      </div>

      <!-- Email Field -->
      <div class="form-group">
        <label for="email">Email Address *</label>
        <input 
          id="email" 
          name="email" 
          type="email" 
          [(ngModel)]="profile.email" 
          required 
          [readonly]="!editing"
          [class.input-error]="validationErrors['email']"
          class="form-input" />
        <span *ngIf="validationErrors['email']" class="error-message">
          ❌ {{ validationErrors['email'] }}
        </span>
      </div>

      <!-- Role Field -->
      <div class="form-group">
        <label for="role">Role</label>
        <input 
          id="role" 
          name="role" 
          type="text" 
          [(ngModel)]="profile.role" 
          readonly
          class="form-input" />
      </div>

      <!-- Department Field -->
      <div class="form-group">
        <label for="department">Department *</label>
        <input 
          id="department" 
          name="department" 
          type="text" 
          [(ngModel)]="profile.department" 
          [readonly]="!editing"
          [class.input-error]="validationErrors['department']"
          placeholder="e.g., Computer Science"
          class="form-input" />
        <span *ngIf="validationErrors['department']" class="error-message">
          ❌ {{ validationErrors['department'] }}
        </span>
      </div>

      <!-- Phone Field -->
      <div class="form-group">
        <label for="phone">Phone Number *</label>
        <input 
          id="phone" 
          name="phone" 
          type="tel" 
          [(ngModel)]="profile.phone" 
          [readonly]="!editing"
          [class.input-error]="validationErrors['phone']"
          placeholder="+91-XXXXXXXXXX"
          class="form-input" />
        <span *ngIf="validationErrors['phone']" class="error-message">
          ❌ {{ validationErrors['phone'] }}
        </span>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" (click)="toggleEdit()">
          {{ editing ? '❌ Cancel' : '✏️ Edit Profile' }}
        </button>
        <button type="button" class="btn btn-secondary" routerLink="/settings/security">
          🔐 Change Password
        </button>
        <button type="submit" class="btn btn-primary" [disabled]="!editing">
          💾 Save Changes
        </button>
      </div>
    </form>
    <app-footer></app-footer>
  </div>
</div>
</ng-template>`,
  styles: [
    `.profile-form {
      max-width: 700px;
      margin-top: 24px;
      display: grid;
      gap: 18px;
    }

    .alert {
      padding: 16px;
      border-radius: 10px;
      font-weight: 500;
      animation: slideDown 0.3s ease;
    }

    .alert-success {
      background: #d1fae5;
      color: #065f46;
      border-left: 4px solid #10b981;
    }

    .alert-error {
      background: #fee2e2;
      color: #7f1d1d;
      border-left: 4px solid #ef4444;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .profile-picture-section {
      display: flex;
      gap: 22px;
      align-items: center;
      padding: 20px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      margin-bottom: 10px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
    }

    .picture-container {
      position: relative;
      width: 110px;
      height: 110px;
      border-radius: 50%;
      overflow: hidden;
      cursor: pointer;
      flex-shrink: 0;
      border: 3px solid #3b82f6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
    }

    .profile-pic {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .profile-pic-placeholder {
      width: 100%;
      height: 100%;
      background: #eff6ff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 42px;
    }

    .pic-hover-overlay {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.55);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s ease;
      font-size: 12px;
      font-weight: 600;
    }

    .picture-container:hover .pic-hover-overlay {
      opacity: 1;
    }

    .picture-controls {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .picture-label {
      font-weight: 700;
      color: #1e293b;
      margin: 0;
      font-size: 15px;
    }

    .picture-hint {
      color: #64748b;
      font-size: 12px;
      margin-bottom: 4px;
    }

    .pic-action-buttons {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .btn-upload {
      padding: 8px 16px;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-upload:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
    }

    .btn-remove-pic {
      padding: 8px 14px;
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fca5a5;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      transition: all 0.2s ease;
    }

    .btn-remove-pic:hover {
      background: #fecaca;
    }

    .file-input {
      display: none;
    }

    .form-group {
      display: grid;
      gap: 8px;
    }

    .form-group label {
      font-weight: 600;
      color: #1f3051;
      font-size: 14px;
    }

    .form-input {
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 15px;
      width: 100%;
      box-sizing: border-box;
      background: #ffffff;
      transition: all 0.2s ease;
    }

    .form-input:focus {
      outline: 2px solid rgba(59, 130, 246, 0.35);
      border-color: rgba(59, 130, 246, 0.5);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-input:read-only {
      background: #f8fafc;
      color: #475569;
      cursor: default;
    }

    .form-input.input-error {
      border-color: #ef4444;
      background: #fef2f2;
    }

    .error-message {
      font-size: 13px;
      color: #dc2626;
      font-weight: 500;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 10px;
    }

    .btn {
      padding: 12px 24px;
      font-size: 15px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-primary {
      background: #2563eb;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #1d4ed8;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }

    .btn-secondary {
      background: #e2e8f0;
      color: #1f2937;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #cbd5e1;
      transform: translateY(-2px);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .profile-picture-section {
        flex-direction: column;
        text-align: center;
      }

      .form-actions {
        flex-direction: column;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }
    }

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
export class Profile {
  private toast = inject(ToastService);
  private router = inject(Router);
  editing = false;
  showSuccessMessage = false;
  profilePicturePreview: string | null = null;
  validationErrors: { [key: string]: string } = {};
  profile: ProfileData = {
    name: '',
    email: '',
    role: '',
    department: '',
    phone: ''
  };

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

  getStorageKey(): string {
    const email = localStorage.getItem('userEmail') || 'default';
    return `userProfile_${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  }

  getProfilePictureKey(): string {
    const email = localStorage.getItem('userEmail') || 'default';
    return `userProfilePicture_${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  }

  constructor() {
    this.loadProfile();
    this.loadProfilePicture();
    this.loadAppearance();
  }

  get isStudent(): boolean {
    const r = (this.profile.role || localStorage.getItem('userRole') || '').toLowerCase();
    return r === 'student';
  }

  private loadProfile(): void {
    const savedProfile = localStorage.getItem(this.getStorageKey());
    if (savedProfile) {
      try {
        this.profile = JSON.parse(savedProfile) as ProfileData;
        this.studentName = this.profile.name;
        this.studentEmail = this.profile.email;
        this.studentDept = this.profile.department;
      } catch {
        this.setDefaults();
      }
      return;
    }

    this.setDefaults();
  }

  private setDefaults(): void {
    this.profile = {
      name: localStorage.getItem('userName') || 'Student',
      email: localStorage.getItem('userEmail') || 'student@centurionuniv.edu.in',
      role: localStorage.getItem('userRole') || 'student',
      department: localStorage.getItem('userDepartment') || 'Computer Science',
      phone: localStorage.getItem('userPhone') || '998905954'
    };
    this.studentName = this.profile.name;
    this.studentEmail = this.profile.email;
    this.studentDept = this.profile.department;
    this.studentRoll = localStorage.getItem('userRoll') || 'CUTM2026CSE042';
  }

  private loadProfilePicture(): void {
    const savedPicture = localStorage.getItem(this.getProfilePictureKey());
    if (savedPicture) {
      this.profilePicturePreview = savedPicture;
      this.studentPhoto = savedPicture;
    }
  }

  toggleEdit(): void {
    if (this.editing) {
      this.loadProfile();
      this.validationErrors = {};
    }
    this.editing = !this.editing;
  }

  validateForm(): boolean {
    this.validationErrors = {};

    if (!this.profile.name || this.profile.name.trim() === '') {
      this.validationErrors['name'] = 'Name is required';
    }

    if (!this.profile.email || this.profile.email.trim() === '') {
      this.validationErrors['email'] = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.profile.email)) {
      this.validationErrors['email'] = 'Please enter a valid email address';
    }

    if (!this.profile.department || this.profile.department.trim() === '') {
      this.validationErrors['department'] = 'Department is required';
    }

    if (!this.profile.phone || this.profile.phone.trim() === '') {
      this.validationErrors['phone'] = 'Phone number is required';
    } else if (!/^[\d\s\-\+\(\)]+$/.test(this.profile.phone)) {
      this.validationErrors['phone'] = 'Please enter a valid phone number';
    }

    return Object.keys(this.validationErrors).length === 0;
  }

  saveProfile(form: any): void {
    if (!this.validateForm()) {
      return;
    }

    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(this.profile));
      localStorage.setItem('userName', this.profile.name);
      localStorage.setItem('userEmail', this.profile.email);
      localStorage.setItem('userDepartment', this.profile.department);
      localStorage.setItem('userPhone', this.profile.phone);

      this.studentName = this.profile.name;
      this.studentEmail = this.profile.email;
      this.studentDept = this.profile.department;
      
      this.showSuccessMessage = true;
      this.editing = false;
      this.toast.success('Profile updated successfully!');
      
      setTimeout(() => {
        this.showSuccessMessage = false;
      }, 5000);
    } catch (error) {
      this.validationErrors['general'] = 'Failed to save profile. Please try again.';
      this.toast.error('Failed to save profile.');
    }
  }

  removeProfilePicture(): void {
    this.profilePicturePreview = null;
    this.studentPhoto = null;
    try {
      localStorage.removeItem(this.getProfilePictureKey());
    } catch {}
    this.toast.info('Profile photo removed.');
  }

  onProfilePictureSelected(event: any): void {
    const file = event.target?.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        this.toast.error('Please select an image file (PNG, JPG, WebP).');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          // Compress via Canvas to optimize storage
          const canvas = document.createElement('canvas');
          const maxDim = 300;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

          this.profilePicturePreview = dataUrl;
          this.studentPhoto = dataUrl;
          try {
            localStorage.setItem(this.getProfilePictureKey(), dataUrl);
          } catch {}
          this.toast.success('Profile photo updated successfully!');
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  logout(): void {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    this.router.navigate(['/login']);
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
