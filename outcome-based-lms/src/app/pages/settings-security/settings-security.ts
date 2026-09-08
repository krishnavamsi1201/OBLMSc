import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-settings-security',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  template: `
<app-navbar></app-navbar>

<div class="container">
  <app-sidebar></app-sidebar>
  <div class="content">
    <div class="page-header">
      <div>
        <h1>🛡️ Security Settings</h1>
        <p>Update your password and protect your academic account.</p>
      </div>
    </div>

    <div class="security-card">
      <div class="card-intro">
        <div class="icon-bubble">🔒</div>
        <div>
          <h3>Change Account Password</h3>
          <p>Ensure your account is using a secure, strong password with at least 6 characters.</p>
        </div>
      </div>

      <form class="settings-form" (ngSubmit)="changePassword()" #securityForm="ngForm">
        <!-- Current Password -->
        <div class="form-group">
          <label for="currentPassword">Current Password</label>
          <div class="password-input-wrap">
            <input 
              id="currentPassword" 
              name="currentPassword" 
              [type]="showCurrent ? 'text' : 'password'" 
              [(ngModel)]="currentPassword" 
              placeholder="Enter current password"
              required 
            />
            <button type="button" class="toggle-eye-btn" (click)="showCurrent = !showCurrent" title="Toggle visibility">
              {{ showCurrent ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>

        <!-- New Password -->
        <div class="form-group">
          <label for="newPassword">New Password</label>
          <div class="password-input-wrap">
            <input 
              id="newPassword" 
              name="newPassword" 
              [type]="showNew ? 'text' : 'password'" 
              [(ngModel)]="newPassword" 
              placeholder="Enter new password (min. 6 characters)"
              required 
              minlength="6" 
            />
            <button type="button" class="toggle-eye-btn" (click)="showNew = !showNew" title="Toggle visibility">
              {{ showNew ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>

        <!-- Confirm New Password -->
        <div class="form-group">
          <label for="confirmPassword">Confirm New Password</label>
          <div class="password-input-wrap">
            <input 
              id="confirmPassword" 
              name="confirmPassword" 
              [type]="showConfirm ? 'text' : 'password'" 
              [(ngModel)]="confirmPassword" 
              placeholder="Re-enter new password"
              required 
            />
            <button type="button" class="toggle-eye-btn" (click)="showConfirm = !showConfirm" title="Toggle visibility">
              {{ showConfirm ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-save-pwd" [disabled]="securityForm.invalid">
            💾 Save Password
          </button>
        </div>
      </form>
    </div>

    <app-footer></app-footer>
  </div>
</div>
  `,
  styles: [`
    .security-card {
      max-width: 620px;
      background: #101b38;
      border: 1px solid #1f2f54;
      border-radius: 16px;
      padding: 28px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
      margin-top: 8px;
    }

    .card-intro {
      display: flex;
      align-items: center;
      gap: 16px;
      padding-bottom: 20px;
      border-bottom: 1px solid #1f2f54;
      margin-bottom: 24px;
    }

    .icon-bubble {
      font-size: 26px;
      width: 52px;
      height: 52px;
      background: rgba(212, 175, 55, 0.15);
      border: 1px solid rgba(212, 175, 55, 0.35);
      color: #d4af37;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .card-intro h3 {
      margin: 0 0 4px 0;
      color: #ffffff;
      font-size: 18px;
      font-weight: 700;
    }

    .card-intro p {
      margin: 0;
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.4;
    }

    .settings-form {
      display: grid;
      gap: 20px;
    }

    .form-group {
      display: grid;
      gap: 8px;
    }

    .form-group label {
      font-weight: 600;
      font-size: 13.5px;
      color: #cbd5e1;
    }

    .password-input-wrap {
      display: flex;
      align-items: center;
      background: #091024;
      border: 1px solid #1f2f54;
      border-radius: 10px;
      transition: all 0.2s ease;
      overflow: hidden;
    }

    .password-input-wrap:focus-within {
      border-color: #d4af37;
      box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.2);
    }

    .password-input-wrap input {
      flex: 1;
      background: transparent;
      border: none;
      padding: 12px 14px;
      font-size: 14px;
      color: #f1f5f9;
      outline: none;
    }

    .password-input-wrap input::placeholder {
      color: #475569;
      font-size: 13px;
    }

    .toggle-eye-btn {
      background: transparent;
      border: none;
      font-size: 16px;
      color: #94a3b8;
      padding: 8px 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.15s ease;
    }

    .toggle-eye-btn:hover {
      opacity: 0.8;
    }

    .form-actions {
      margin-top: 10px;
    }

    .btn-save-pwd {
      padding: 12px 24px;
      background: linear-gradient(135deg, #d4af37, #b38f28);
      color: #091024;
      font-size: 14px;
      font-weight: 700;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 14px rgba(212, 175, 55, 0.35);
      transition: all 0.2s ease;
    }

    .btn-save-pwd:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(212, 175, 55, 0.5);
    }

    .btn-save-pwd:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      transform: none;
    }
  `]
})
export class SettingsSecurity {
  private toastService = inject(ToastService);

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  showCurrent = false;
  showNew = false;
  showConfirm = false;

  private readonly passwordKey = 'userPassword';

  changePassword(): void {
    const savedPassword = localStorage.getItem(this.passwordKey) || 'password';
    if (this.currentPassword !== savedPassword) {
      this.toastService.error('Current password is incorrect.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.toastService.warning('New password and confirmation do not match.');
      return;
    }

    if (this.newPassword.length < 6) {
      this.toastService.warning('Password must be at least 6 characters long.');
      return;
    }

    localStorage.setItem(this.passwordKey, this.newPassword);
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.toastService.success('Password updated successfully! 🔒');
  }
}
