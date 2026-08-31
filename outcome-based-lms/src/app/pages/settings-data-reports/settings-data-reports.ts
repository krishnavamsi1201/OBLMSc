import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';

@Component({
  selector: 'app-settings-data-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  template: `<app-navbar></app-navbar>

<div class="container">
  <app-sidebar></app-sidebar>
  <div class="content">
    <div class="page-header">
      <h1>Data & Reports</h1>
      <p>Export reports and backup important data.</p>
    </div>

    <form class="settings-form" (ngSubmit)="saveReportSettings()" #reportForm="ngForm">
      <div class="form-group">
        <label for="exportFormat">Export Format</label>
        <select id="exportFormat" name="exportFormat" [(ngModel)]="reportSettings.exportFormat" required>
          <option value="pdf">PDF</option>
          <option value="xlsx">Excel</option>
          <option value="csv">CSV</option>
        </select>
      </div>

      <div class="form-group checkbox-group">
        <label>
          <input type="checkbox" name="includeHistory" [(ngModel)]="reportSettings.includeHistory" />
          Include full historical data
        </label>
      </div>

      <div class="form-group">
        <label for="backupFrequency">Backup Frequency</label>
        <select id="backupFrequency" name="backupFrequency" [(ngModel)]="reportSettings.backupFrequency" required>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <div class="form-actions">
        <button type="submit" [disabled]="reportForm.invalid">Save Report Settings</button>
        <button type="button" class="secondary" (click)="downloadReport()">Download Report</button>
      </div>
    </form>
    <app-footer></app-footer>
  </div>
</div>`,
  styles: [
    `.settings-form { max-width: 620px; display: grid; gap: 18px; margin-top: 24px; }
    .form-group { display: grid; gap: 8px; }
    .form-group label { font-weight: 600; color: #1f3051; }
    .form-group select, .form-group input { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; font-size: 16px; }
    .checkbox-group label { display: flex; align-items: center; gap: 10px; font-weight: 500; }
    .form-actions { display: flex; gap: 12px; flex-wrap: wrap; }
    .form-actions button { padding: 12px 24px; border-radius: 10px; border: none; cursor: pointer; }
    .form-actions button.secondary { background: #e2e8f0; color: #1f2937; }
    .form-actions button:not(.secondary) { background: #2563eb; color: white; }
    `]
})
export class SettingsDataReports {
  reportSettings = {
    exportFormat: 'pdf',
    includeHistory: true,
    backupFrequency: 'weekly'
  };
  private readonly storageKey = 'facultyReportSettings';

  constructor() {
    this.loadReportSettings();
  }

  private loadReportSettings(): void {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      try {
        this.reportSettings = JSON.parse(stored);
      } catch {
        this.resetDefaults();
      }
    }
  }

  private resetDefaults(): void {
    this.reportSettings = { exportFormat: 'pdf', includeHistory: true, backupFrequency: 'weekly' };
  }

  saveReportSettings(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.reportSettings));
    alert('Report settings saved successfully.');
  }

  downloadReport(): void {
    const content = `Report export\nFormat: ${this.reportSettings.exportFormat}\nInclude History: ${this.reportSettings.includeHistory ? 'Yes' : 'No'}\nBackup Frequency: ${this.reportSettings.backupFrequency}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `faculty-report.${this.reportSettings.exportFormat}`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
