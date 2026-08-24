import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
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
</div>`,
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
  `]
})
export class Profile {
  private toast = inject(ToastService);
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
      name: localStorage.getItem('userName') || 'Student',
      email: localStorage.getItem('userEmail') || 'student@centurionuniv.edu.in',
      role: localStorage.getItem('userRole') || 'student',
      department: localStorage.getItem('userDepartment') || 'Computer Science',
      phone: localStorage.getItem('userPhone') || '998905954'
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
    try {
      localStorage.removeItem(this.profilePictureKey);
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
          try {
            localStorage.setItem(this.profilePictureKey, dataUrl);
          } catch {}
          this.toast.success('Profile photo updated successfully!');
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }
}

