import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';

@Component({
  selector: 'app-settings-system',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  template: `<app-navbar></app-navbar>

<div class="container">
  <app-sidebar></app-sidebar>
  <div class="content">
    <div class="page-header">
      <h1>System Settings</h1>
      <p>Monitor system status, configure global defaults, and manage platform availability.</p>
    </div>

    <div class="system-grid">
      <div class="system-card status-card">
        <h3>System Status</h3>
        <p class="status-pill online">Online</p>
        <p>System status is based on live configuration.</p>
      </div>

      <div class="system-card">
        <h3>Maintenance Window</h3>
        <p>Use the form below to configure maintenance timing.</p>
        <p><strong>{{ system.maintenanceWindow || 'Not scheduled' }}</strong></p>
      </div>

      <div class="system-card">
        <h3>Platform Mode</h3>
        <label>
          <input type="radio" name="platformMode" [(ngModel)]="system.mode" value="live" /> Live
        </label>
        <label>
          <input type="radio" name="platformMode" [(ngModel)]="system.mode" value="maintenance" /> Maintenance
        </label>
      </div>
    </div>

    <form class="settings-form" (ngSubmit)="saveSystemSettings()" #systemForm="ngForm">
      <div class="form-group">
        <label for="academicYear">Academic Year</label>
        <input id="academicYear" name="academicYear" type="text" [(ngModel)]="system.academicYear" required />
      </div>

      <div class="form-group">
        <label for="semester">Current Semester</label>
        <select id="semester" name="semester" [(ngModel)]="system.semester" required>
          <option value="Spring">Spring</option>
          <option value="Summer">Summer</option>
          <option value="Fall">Fall</option>
          <option value="Winter">Winter</option>
        </select>
      </div>

      <div class="form-group checkbox-group">
        <label>
          <input type="checkbox" name="disableNewRegistrations" [(ngModel)]="system.disableNewRegistrations" />
          Disable new registrations
        </label>
      </div>

      <div class="form-group">
        <label for="maintenanceWindow">Maintenance Window</label>
        <input id="maintenanceWindow" name="maintenanceWindow" type="text" [(ngModel)]="system.maintenanceWindow" placeholder="e.g. Saturday, 02:00 - 04:00 AM" />
      </div>

      <div class="form-actions">
        <button type="submit" [disabled]="systemForm.invalid">Save System Settings</button>
      </div>
    </form>
  </div>
</div>

<app-footer></app-footer>`,
  styles: [
    `.system-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-top: 24px; }
    .system-card { background: #ffffff; border-radius: 14px; padding: 22px; box-shadow: 0 2px 14px rgba(0,0,0,0.08); }
    .system-card h3 { margin-bottom: 12px; }
    .status-pill { display: inline-block; padding: 8px 14px; border-radius: 999px; font-weight: 700; margin-bottom: 12px; }
    .status-pill.online { background: #dcfce7; color: #15803d; }
    .status-pill.offline { background: #fee2e2; color: #b91c1c; }
    .settings-form { max-width: 680px; margin-top: 28px; display: grid; gap: 18px; }
    .form-group { display: grid; gap: 10px; }
    .form-group label { font-weight: 600; color: #1f3051; }
    .form-group input,
    .form-group select { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px 14px; font-size: 15px; }
    .checkbox-group label { display: flex; align-items: center; gap: 10px; font-weight: 500; }
    .form-actions { margin-top: 16px; }
    .form-actions button { padding: 12px 24px; border-radius: 10px; border: none; cursor: pointer; background: #2563eb; color: white; }
    .form-actions button:disabled { opacity: 0.65; cursor: not-allowed; }
    `]
})
export class SettingsSystem {
  system = {
    academicYear: '',
    semester: '',
    mode: 'live',
    disableNewRegistrations: false,
    maintenanceWindow: ''
  };

  private readonly storageKey = 'systemSettings';

  constructor() {
    this.loadSystemSettings();
  }

  private loadSystemSettings(): void {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        this.system = JSON.parse(saved);
      } catch {
        // fallback to defaults
      }
    }
  }

  saveSystemSettings(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.system));
    alert('System settings saved successfully.');
  }
}
