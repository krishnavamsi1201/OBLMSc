import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';

@Component({
  selector: 'app-settings-teaching-preferences',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  template: `<app-navbar></app-navbar>

<div class="container">
  <app-sidebar></app-sidebar>
  <div class="content">
    <div class="page-header">
      <h1>Teaching Preferences</h1>
      <p>Manage classroom, grading, and notification settings.</p>
    </div>

    <form class="settings-form" (ngSubmit)="savePreferences()" #preferencesForm="ngForm">
      <div class="form-group">
        <label for="defaultView">Default Course View</label>
        <select id="defaultView" name="defaultView" [(ngModel)]="preferences.defaultView" required>
          <option value="overview">Course Overview</option>
          <option value="assessment">Assessment Summary</option>
          <option value="attendance">Attendance Dashboard</option>
        </select>
      </div>

      <div class="form-group checkbox-group">
        <label>
          <input type="checkbox" name="sendEmailNotifications" [(ngModel)]="preferences.sendEmailNotifications" />
          Receive email alerts for assessment updates
        </label>
      </div>

      <div class="form-group">
        <label for="gradingScale">Preferred Grading Scale</label>
        <select id="gradingScale" name="gradingScale" [(ngModel)]="preferences.gradingScale" required>
          <option value="percentage">Percentage</option>
          <option value="letter">Letter Grade</option>
          <option value="points">Point Scale</option>
        </select>
      </div>

      <div class="form-group">
        <label for="classFormat">Default Class Format</label>
        <select id="classFormat" name="classFormat" [(ngModel)]="preferences.classFormat" required>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>

      <div class="form-actions">
        <button type="submit" [disabled]="preferencesForm.invalid">Save Preferences</button>
      </div>
    </form>
  </div>
</div>

<app-footer></app-footer>`,
  styles: [
    `.settings-form { max-width: 620px; display: grid; gap: 18px; margin-top: 24px; }
    .form-group { display: grid; gap: 8px; }
    .form-group label { font-weight: 600; color: #1f3051; }
    .form-group select, .form-group input { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; font-size: 16px; }
    .checkbox-group label { display: flex; align-items: center; gap: 10px; font-weight: 500; }
    .form-actions button { padding: 12px 24px; background: #2563eb; color: white; border: none; border-radius: 10px; cursor: pointer; }
    `]
})
export class SettingsTeachingPreferences {
  preferences = {
    defaultView: 'overview',
    sendEmailNotifications: true,
    gradingScale: 'percentage',
    classFormat: 'hybrid'
  };
  private readonly storageKey = 'facultyTeachingPreferences';

  constructor() {
    this.loadPreferences();
  }

  private loadPreferences(): void {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      try {
        this.preferences = JSON.parse(stored);
      } catch {
        this.resetDefaults();
      }
    }
  }

  private resetDefaults(): void {
    this.preferences = {
      defaultView: 'overview',
      sendEmailNotifications: true,
      gradingScale: 'percentage',
      classFormat: 'hybrid'
    };
  }

  savePreferences(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.preferences));
    alert('Teaching preferences saved successfully.');
  }
}
