import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';

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

<div class="container">
  <app-sidebar></app-sidebar>
  <div class="content">
    <div class="page-header">
      <h1>👤 My Profile</h1>
      <p>Review and update your user details.</p>
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
        <div class="picture-container">
          <img *ngIf="profilePicturePreview" [src]="profilePicturePreview" alt="Profile Picture" class="profile-pic" />
          <div *ngIf="!profilePicturePreview" class="profile-pic-placeholder">
            📷
          </div>
        </div>
        <div class="picture-controls">
          <p class="picture-label">Profile Picture</p>
          <input 
            type="file" 
            accept="image/*" 
            (change)="onProfilePictureSelected($event)"
            class="file-input"
            hidden />
          <button 
            *ngIf="editing"
            type="button" 
            class="btn-upload"
            (click)="triggerFileInput()">
            📤 Upload Picture
          </button>
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
  </div>
</div>

<app-footer></app-footer>`,
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
      gap: 20px;
      align-items: center;
      padding: 20px;
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      border-radius: 12px;
      margin-bottom: 10px;
    }

    .picture-container {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .profile-pic {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid #fff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .profile-pic-placeholder {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      border: 4px solid #cbd5e1;
    }

    .picture-controls {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .picture-label {
      font-weight: 600;
      color: #1f3051;
      margin: 0;
    }

    .btn-upload {
      padding: 10px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.2s ease;
    }

    .btn-upload:hover {
      background: #2563eb;
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
      font-size: 16px;
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
      background: #f9fafb;
      color: #6b7280;
      cursor: not-allowed;
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
  `]
})
export class Profile {
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

  private readonly storageKey = 'userProfile';
  private readonly profilePictureKey = 'userProfilePicture';
  fileInputElement: any;

  constructor() {
    this.loadProfile();
    this.loadProfilePicture();
  }

  private loadProfile(): void {
    const savedProfile = localStorage.getItem(this.storageKey);
    if (savedProfile) {
      try {
        this.profile = JSON.parse(savedProfile) as ProfileData;
      } catch {
        this.setDefaults();
      }
      return;
    }

    this.setDefaults();
  }

  private setDefaults(): void {
    this.profile = {
      name: localStorage.getItem('userName') || 'User',
      email: localStorage.getItem('userEmail') || 'user@example.com',
      role: localStorage.getItem('userRole') || 'Faculty',
      department: localStorage.getItem('userDepartment') || 'Computer Science',
      phone: localStorage.getItem('userPhone') || '+91-XXXXXXXXXX'
    };
  }

  private loadProfilePicture(): void {
    const savedPicture = localStorage.getItem(this.profilePictureKey);
    if (savedPicture) {
      this.profilePicturePreview = savedPicture;
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
      localStorage.setItem(this.storageKey, JSON.stringify(this.profile));
      localStorage.setItem('userName', this.profile.name);
      localStorage.setItem('userEmail', this.profile.email);
      localStorage.setItem('userDepartment', this.profile.department);
      localStorage.setItem('userPhone', this.profile.phone);
      
      this.showSuccessMessage = true;
      this.editing = false;
      
      setTimeout(() => {
        this.showSuccessMessage = false;
      }, 5000);
    } catch (error) {
      this.validationErrors['general'] = 'Failed to save profile. Please try again.';
    }
  }

  triggerFileInput(): void {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onProfilePictureSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profilePicturePreview = e.target.result;
        try {
          localStorage.setItem(this.profilePictureKey, e.target.result);
        } catch {}
      };
      reader.readAsDataURL(file);
    }
  }
}

