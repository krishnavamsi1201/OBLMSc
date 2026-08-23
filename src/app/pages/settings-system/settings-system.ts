import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';

interface AuditLog {
  user: string;
  action: string;
  timestamp: string;
}

@Component({
  selector: 'app-settings-system',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  template: `<app-navbar></app-navbar>

<div class="container">
  <app-sidebar></app-sidebar>
  <div class="content">
    <div class="page-header">
      <h1>⚙️ System & OBE Settings</h1>
      <p>Configure academic weights, global target thresholds, and monitor administrator transaction logs.</p>
    </div>

    <div class="system-grid">
      <div class="system-card status-card">
        <h3>System Status</h3>
        <p class="status-pill online">Online</p>
        <p>Live Outcome-Based education grid engine.</p>
      </div>

      <div class="system-card">
        <h3>Maintenance Window</h3>
        <p>Current maintenance scheduling details:</p>
        <p><strong>{{ system.maintenanceWindow || 'Not scheduled' }}</strong></p>
      </div>

      <div class="system-card">
        <h3>OBE Configuration Defaults</h3>
        <p>Target Threshold: <strong>{{ system.obeTarget }}% Achievement</strong></p>
        <p>Grade Weights: <strong>{{ system.internalWeight }}% Internal / {{ system.externalWeight }}% External</strong></p>
      </div>
    </div>

    <!-- Configuration Form -->
    <div class="form-card-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; margin-top: 24px;">
      
      <!-- System Form -->
      <div style="background: white; border-radius: 12px; padding: 22px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">
        <h3 style="margin-top: 0; color: #1e3d7a; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 16px;">Platform Settings</h3>
        <form (ngSubmit)="saveSystemSettings()" #systemForm="ngForm" style="display: grid; gap: 14px;">
          <div style="display: grid; gap: 6px;">
            <label style="font-weight: 600; font-size: 0.9rem;">Academic Year</label>
            <input name="academicYear" type="text" [(ngModel)]="system.academicYear" required style="padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px;" />
          </div>

          <div style="display: grid; gap: 6px;">
            <label style="font-weight: 600; font-size: 0.9rem;">Current Semester</label>
            <select name="semester" [(ngModel)]="system.semester" required style="padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background: white;">
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
              <option value="Fall">Fall</option>
              <option value="Winter">Winter</option>
            </select>
          </div>

          <div style="display: grid; gap: 6px;">
            <label style="font-weight: 600; font-size: 0.9rem;">Maintenance Schedule</label>
            <input name="maintenanceWindow" type="text" [(ngModel)]="system.maintenanceWindow" placeholder="e.g. Saturday, 02:00 - 04:00 AM" style="padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px;" />
          </div>

          <div style="margin-top: 10px; display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" name="disableNewRegistrations" [(ngModel)]="system.disableNewRegistrations" id="disableReg" />
            <label for="disableReg" style="font-weight: 500;">Disable new student registrations</label>
          </div>

          <!-- OBE Config Panel -->
          <h3 style="margin-top: 20px; color: #1e3d7a; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 12px;">OBE Parameters</h3>
          
          <div style="display: grid; gap: 6px;">
            <label style="font-weight: 600; font-size: 0.9rem; display: flex; justify-content: space-between;">
              <span>CO Attainment Target Threshold</span>
              <strong>{{ system.obeTarget }}%</strong>
            </label>
            <input type="range" name="obeTarget" min="50" max="95" step="5" [(ngModel)]="system.obeTarget" style="width: 100%; cursor: pointer;" />
          </div>

          <div style="display: grid; gap: 10px; margin-top: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label style="font-weight: 600; font-size: 0.9rem;">Internal Assessment Weight (%)</label>
              <input type="number" name="internalWeight" [(ngModel)]="system.internalWeight" (ngModelChange)="adjustWeights('internal')" min="0" max="100" style="width: 80px; padding: 6px; border: 1px solid #cbd5e1; border-radius: 6px; text-align: center; font-weight: bold;" />
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label style="font-weight: 600; font-size: 0.9rem;">External End-Sem Weight (%)</label>
              <input type="number" name="externalWeight" [(ngModel)]="system.externalWeight" (ngModelChange)="adjustWeights('external')" min="0" max="100" style="width: 80px; padding: 6px; border: 1px solid #cbd5e1; border-radius: 6px; text-align: center; font-weight: bold;" />
            </div>
            <p *ngIf="system.internalWeight + system.externalWeight !== 100" style="color: #991b1b; font-size: 0.85rem; margin: 0; font-weight: 600;">⚠️ Total weights must sum up to exactly 100% (Current: {{ system.internalWeight + system.externalWeight }}%).</p>
          </div>

          <div style="margin-top: 16px;">
            <button type="submit" [disabled]="systemForm.invalid || system.internalWeight + system.externalWeight !== 100" style="width: 100%; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 0.95rem;">
              Save Platform & OBE Configuration
            </button>
          </div>
        </form>
      </div>

      <!-- Audit Logs Terminal Card -->
      <div style="background: white; border-radius: 12px; padding: 22px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); display: flex; flex-direction: column; height: 500px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 16px;">
          <h3 style="margin: 0; color: #1e3d7a;">📋 System Audit Trail</h3>
          <button type="button" (click)="clearAuditLogs()" style="background: #e2e8f0; color: #475569; border: none; padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 700; cursor: pointer;">Clear Trail</button>
        </div>
        <p style="color: #64748b; font-size: 0.82rem; margin-top: 0; margin-bottom: 12px;">Real-time logs of administrative changes and system mappings.</p>
        
        <div class="logs-container" style="flex: 1; overflow-y: auto; background: #0f172a; border-radius: 8px; padding: 12px; font-family: monospace; display: flex; flex-direction: column; gap: 8px;">
          <div *ngFor="let log of auditLogs" style="font-size: 0.8rem; line-height: 1.4; color: #cbd5e1; border-bottom: 1px solid #1e293b; padding-bottom: 6px;">
            <span style="color: #38bdf8;">[{{ log.timestamp | date:'shortTime' }}]</span> 
            <span style="color: #4ade80; font-weight: bold;">{{ log.user }}</span>: 
            <span>{{ log.action }}</span>
          </div>
          <div *ngIf="auditLogs.length === 0" style="text-align: center; color: #64748b; font-size: 0.85rem; padding: 40px 10px;">
            No actions logged yet in this session.
          </div>
        </div>
      </div>

    </div>

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
    `
  ]
})
export class SettingsSystem implements OnInit {
  system = {
    academicYear: '2025-2026',
    semester: 'Fall',
    mode: 'live',
    disableNewRegistrations: false,
    maintenanceWindow: 'Saturday, 02:00 - 04:00 AM',
    obeTarget: 75,
    internalWeight: 40,
    externalWeight: 60
  };

  auditLogs: AuditLog[] = [];

  private readonly storageKey = 'systemSettings';

  constructor() {
    this.loadSystemSettings();
  }

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  private loadSystemSettings(): void {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.system = {
          academicYear: parsed.academicYear || '2025-2026',
          semester: parsed.semester || 'Fall',
          mode: parsed.mode || 'live',
          disableNewRegistrations: !!parsed.disableNewRegistrations,
          maintenanceWindow: parsed.maintenanceWindow || 'Saturday, 02:00 - 04:00 AM',
          obeTarget: parsed.obeTarget !== undefined ? Number(parsed.obeTarget) : 75,
          internalWeight: parsed.internalWeight !== undefined ? Number(parsed.internalWeight) : 40,
          externalWeight: parsed.externalWeight !== undefined ? Number(parsed.externalWeight) : 60
        };
      } catch {
        // keep defaults
      }
    }
  }

  loadAuditLogs(): void {
    try {
      const stored = localStorage.getItem('obslmsAuditLogs');
      this.auditLogs = stored ? JSON.parse(stored) : [];
    } catch {
      this.auditLogs = [];
    }
  }

  adjustWeights(changed: 'internal' | 'external'): void {
    if (changed === 'internal') {
      this.system.externalWeight = Math.max(0, Math.min(100, 100 - this.system.internalWeight));
    } else {
      this.system.internalWeight = Math.max(0, Math.min(100, 100 - this.system.externalWeight));
    }
  }

  logAction(action: string): void {
    try {
      const activeAdmin = localStorage.getItem('userName') || 'Admin';
      const storedLogs = localStorage.getItem('obslmsAuditLogs');
      const logs = storedLogs ? JSON.parse(storedLogs) : [];
      logs.unshift({
        user: activeAdmin,
        action,
        timestamp: new Date().toISOString()
      });
      if (logs.length > 50) logs.pop();
      localStorage.setItem('obslmsAuditLogs', JSON.stringify(logs));
      this.auditLogs = logs;
    } catch {}
  }

  saveSystemSettings(): void {
    if (this.system.internalWeight + this.system.externalWeight !== 100) {
      alert('Error: Internal and External weights must equal 100%.');
      return;
    }

    localStorage.setItem(this.storageKey, JSON.stringify(this.system));
    
    // Log setting modification
    this.logAction(`Updated system parameters: Target=${this.system.obeTarget}%, Weight Ratios=${this.system.internalWeight}% Int / ${this.system.externalWeight}% Ext`);
    
    alert('System & OBE parameters saved successfully.');
  }

  clearAuditLogs(): void {
    if (confirm('Are you sure you want to clear the system audit trail?')) {
      localStorage.setItem('obslmsAuditLogs', '[]');
      this.auditLogs = [];
      this.logAction('Cleared system audit logs');
    }
  }
}
