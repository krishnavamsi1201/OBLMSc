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
    <div class="page-header" style="background: #101b38; padding: 20px 24px; border-radius: 12px; border: 1px solid #1f2f54; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.25);">
      <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 1.8rem; font-weight: 700;">⚙️ System & OBE Settings</h1>
      <p style="color: #94a3b8; margin: 0; font-size: 0.95rem;">Configure academic weights, global target thresholds, and monitor administrator transaction logs.</p>
    </div>

    <div class="system-grid">
      <div class="system-card status-card">
        <h3>System Status</h3>
        <p class="status-pill online">Online</p>
        <p style="color: #94a3b8; margin: 0;">Live Outcome-Based education grid engine.</p>
      </div>

      <div class="system-card">
        <h3>Maintenance Window</h3>
        <p style="color: #94a3b8;">Current maintenance scheduling details:</p>
        <p><strong style="color: #d4af37;">{{ system.maintenanceWindow || 'Not scheduled' }}</strong></p>
      </div>

      <div class="system-card">
        <h3>OBE Configuration Defaults</h3>
        <p style="color: #cbd5e1;">Target Threshold: <strong style="color: #d4af37;">{{ system.obeTarget }}% Achievement</strong></p>
        <p style="color: #cbd5e1;">Grade Weights: <strong style="color: #ffffff;">{{ system.internalWeight }}% Internal / {{ system.externalWeight }}% External</strong></p>
      </div>
    </div>

    <!-- Configuration Form -->
    <div class="form-card-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; margin-top: 24px;">
      
      <!-- System Form -->
      <div style="background: #101b38; border: 1px solid #1f2f54; border-radius: 12px; padding: 22px; box-shadow: 0 4px 15px rgba(0,0,0,0.25);">
        <h3 style="margin-top: 0; color: #ffffff; border-bottom: 1px solid #1f2f54; padding-bottom: 8px; margin-bottom: 16px; font-weight: 700;">Platform Settings</h3>
        <form (ngSubmit)="saveSystemSettings()" #systemForm="ngForm" style="display: grid; gap: 14px;">
          <div style="display: grid; gap: 6px;">
            <label style="font-weight: 600; font-size: 0.9rem; color: #cbd5e1;">Academic Year</label>
            <input name="academicYear" type="text" [(ngModel)]="system.academicYear" required style="padding: 10px; background: #091024; color: #ffffff; border: 1px solid #1f2f54; border-radius: 8px;" />
          </div>

          <div style="display: grid; gap: 6px;">
            <label style="font-weight: 600; font-size: 0.9rem; color: #cbd5e1;">Current Semester</label>
            <select name="semester" [(ngModel)]="system.semester" required style="padding: 10px; background: #091024; color: #ffffff; border: 1px solid #1f2f54; border-radius: 8px;">
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
              <option value="Fall">Fall</option>
              <option value="Winter">Winter</option>
            </select>
          </div>

          <div style="display: grid; gap: 6px;">
            <label style="font-weight: 600; font-size: 0.9rem; color: #cbd5e1;">Maintenance Schedule</label>
            <input name="maintenanceWindow" type="text" [(ngModel)]="system.maintenanceWindow" placeholder="e.g. Saturday, 02:00 - 04:00 AM" style="padding: 10px; background: #091024; color: #ffffff; border: 1px solid #1f2f54; border-radius: 8px;" />
          </div>

          <div style="margin-top: 10px; display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" name="disableNewRegistrations" [(ngModel)]="system.disableNewRegistrations" id="disableReg" />
            <label for="disableReg" style="font-weight: 500; color: #cbd5e1;">Disable new student registrations</label>
          </div>

          <!-- OBE Config Panel -->
          <h3 style="margin-top: 20px; color: #ffffff; border-bottom: 1px solid #1f2f54; padding-bottom: 8px; margin-bottom: 12px; font-weight: 700;">OBE Parameters</h3>
          
          <div style="display: grid; gap: 6px;">
            <label style="font-weight: 600; font-size: 0.9rem; color: #cbd5e1; display: flex; justify-content: space-between;">
              <span>CO Attainment Target Threshold</span>
              <strong style="color: #d4af37;">{{ system.obeTarget }}%</strong>
            </label>
            <input type="range" name="obeTarget" min="50" max="95" step="5" [(ngModel)]="system.obeTarget" style="width: 100%; cursor: pointer;" />
          </div>

          <div style="display: grid; gap: 10px; margin-top: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label style="font-weight: 600; font-size: 0.9rem; color: #cbd5e1;">Internal Assessment Weight (%)</label>
              <input type="number" name="internalWeight" [(ngModel)]="system.internalWeight" (ngModelChange)="adjustWeights('internal')" min="0" max="100" style="width: 80px; padding: 6px; background: #091024; color: #ffffff; border: 1px solid #1f2f54; border-radius: 6px; text-align: center; font-weight: bold;" />
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label style="font-weight: 600; font-size: 0.9rem; color: #cbd5e1;">External End-Sem Weight (%)</label>
              <input type="number" name="externalWeight" [(ngModel)]="system.externalWeight" (ngModelChange)="adjustWeights('external')" min="0" max="100" style="width: 80px; padding: 6px; background: #091024; color: #ffffff; border: 1px solid #1f2f54; border-radius: 6px; text-align: center; font-weight: bold;" />
            </div>
            <p *ngIf="system.internalWeight + system.externalWeight !== 100" style="color: #f87171; font-size: 0.85rem; margin: 0; font-weight: 600;">⚠️ Total weights must sum up to exactly 100% (Current: {{ system.internalWeight + system.externalWeight }}%).</p>
          </div>

          <div style="margin-top: 16px;">
            <button type="submit" [disabled]="systemForm.invalid || system.internalWeight + system.externalWeight !== 100" style="width: 100%; padding: 12px; background: #d4af37; color: #0a1128; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 0.95rem;">
              Save Platform & OBE Configuration
            </button>
          </div>
        </form>
      </div>

      <!-- Audit Logs Terminal Card -->
      <div style="background: #101b38; border: 1px solid #1f2f54; border-radius: 12px; padding: 22px; box-shadow: 0 4px 15px rgba(0,0,0,0.25); display: flex; flex-direction: column; height: 500px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1f2f54; padding-bottom: 8px; margin-bottom: 16px;">
          <h3 style="margin: 0; color: #ffffff; font-weight: 700;">📋 System Audit Trail</h3>
          <button type="button" (click)="clearAuditLogs()" style="background: #091024; color: #cbd5e1; border: 1px solid #1f2f54; padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 700; cursor: pointer;">Clear Trail</button>
        </div>
        <p style="color: #94a3b8; font-size: 0.82rem; margin-top: 0; margin-bottom: 12px;">Real-time logs of administrative changes and system mappings.</p>
        
        <div class="logs-container" style="flex: 1; overflow-y: auto; background: #091024; border: 1px solid #1f2f54; border-radius: 8px; padding: 12px; font-family: monospace; display: flex; flex-direction: column; gap: 8px;">
          <div *ngFor="let log of auditLogs" style="font-size: 0.8rem; line-height: 1.4; color: #cbd5e1; border-bottom: 1px solid #1f2f54; padding-bottom: 6px;">
            <span style="color: #d4af37;">[{{ log.timestamp | date:'shortTime' }}]</span> 
            <span style="color: #60a5fa; font-weight: bold;">{{ log.user }}</span>: 
            <span>{{ log.action }}</span>
          </div>
          <div *ngIf="auditLogs.length === 0" style="text-align: center; color: #64748b; font-size: 0.85rem; padding: 40px 10px;">
            No actions logged yet in this session.
          </div>
        </div>
      </div>

    </div>

    <app-footer></app-footer>
  </div>
</div>`,
  styles: [
    `.system-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-top: 24px; }
    .system-card { background: #101b38; border: 1px solid #1f2f54; border-radius: 14px; padding: 22px; box-shadow: 0 4px 15px rgba(0,0,0,0.25); }
    .system-card h3 { margin-bottom: 12px; color: #ffffff; }
    .status-pill { display: inline-block; padding: 6px 14px; border-radius: 999px; font-weight: 700; margin-bottom: 12px; }
    .status-pill.online { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .status-pill.offline { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
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
