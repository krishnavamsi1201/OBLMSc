import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';

@Component({
  selector: 'app-settings-security',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  template: `<app-navbar></app-navbar>

<div class="container">
  <app-sidebar></app-sidebar>
  <div class="content">
    <div class="page-header">
      <h1>Security Settings</h1>
      <p>Update your password and protect your faculty account.</p>
    </div>

    <form class="settings-form" (ngSubmit)="changePassword()" #securityForm="ngForm">
      <div class="form-group">
        <label for="currentPassword">Current Password</label>
        <input id="currentPassword" name="currentPassword" type="password" [(ngModel)]="currentPassword" required />
      </div>

      <div class="form-group">
        <label for="newPassword">New Password</label>
        <input id="newPassword" name="newPassword" type="password" [(ngModel)]="newPassword" required minlength="6" />
      </div>

      <div class="form-group">
        <label for="confirmPassword">Confirm New Password</label>
        <input id="confirmPassword" name="confirmPassword" type="password" [(ngModel)]="confirmPassword" required />
      </div>

      <div class="form-actions">
        <button type="submit" [disabled]="securityForm.invalid">Save Password</button>
      </div>
    </form>
    <app-footer></app-footer>
  </div>
</div>`,
  styles: [
    `.settings-form { max-width: 620px; display: grid; gap: 18px; margin-top: 24px; }
    .form-group { display: grid; gap: 8px; }
    .form-group label { font-weight: 600; color: #1f3051; }
    .form-group input { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; font-size: 16px; }
    .form-actions { margin-top: 16px; }
    .form-actions button { padding: 12px 24px; background: #2563eb; color: white; border: none; border-radius: 10px; cursor: pointer; }
    .form-actions button:disabled { opacity: 0.6; cursor: not-allowed; }
    `]
})
export class SettingsSecurity {
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  private readonly passwordKey = 'userPassword';

  changePassword(): void {
    const savedPassword = localStorage.getItem(this.passwordKey) || 'password';
    if (this.currentPassword !== savedPassword) {
      alert('Current password is incorrect.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      alert('New password and confirmation do not match.');
      return;
    }

    if (this.newPassword.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    localStorage.setItem(this.passwordKey, this.newPassword);
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    alert('Password updated successfully.');
  }
}
