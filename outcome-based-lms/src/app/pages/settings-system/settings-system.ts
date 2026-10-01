import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { ToastService } from '../../shared/services/toast.service';
import { SyncService } from '../../shared/services/sync.service';

@Component({
  selector: 'app-settings-system',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  template: `<app-navbar></app-navbar>

<div class="container">
  <app-sidebar></app-sidebar>

  <div class="content">
    
    <!-- Executive Page Header -->
    <div class="page-header">
      <div class="header-text-block">
        <h1>⚙️ Academic & OBE Parameters Configuration</h1>
        <p>Configure institutional grading weights, accreditation benchmarks, and academic session parameters.</p>
      </div>
    </div>

    <!-- Active Configuration KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon-wrap" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8;">
          📅
        </div>
        <div class="kpi-body">
          <span class="kpi-label">Active Academic Session</span>
          <h3 class="kpi-val">{{ system.academicYear }}</h3>
          <span class="kpi-sub">{{ system.semester }}</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon-wrap" style="background: rgba(212, 175, 55, 0.15); color: #fde68a;">
          🎯
        </div>
        <div class="kpi-body">
          <span class="kpi-label">CO Target Threshold</span>
          <h3 class="kpi-val" style="color: #fde68a;">{{ system.obeTarget }}% <small style="font-size: 0.85rem; color: #94a3b8;">Benchmark</small></h3>
          <span class="kpi-sub">NBA Tier-1 Accreditation Criterion</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon-wrap" style="background: rgba(16, 185, 129, 0.15); color: #34d399;">
          ⚖️
        </div>
        <div class="kpi-body">
          <span class="kpi-label">OBE Grade Distribution</span>
          <h3 class="kpi-val" style="color: #4ade80;">{{ system.internalWeight }}% / {{ system.externalWeight }}%</h3>
          <span class="kpi-sub">Internal CIE vs End-Semester SEE</span>
        </div>
      </div>
    </div>

    <!-- Main Configuration Panel -->
    <div class="settings-card-wrapper">
      <form (ngSubmit)="saveSystemSettings()" #systemForm="ngForm">
        
        <!-- Section 1: Academic Session -->
        <div class="settings-section">
          <div class="section-title-row">
            <span class="sec-icon">🏛️</span>
            <div>
              <h3>Institutional Academic Session</h3>
              <p>Configure the university academic calendar and active semester cycle.</p>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="input-group">
              <label>Academic Year</label>
              <input 
                name="academicYear" 
                type="text" 
                [(ngModel)]="system.academicYear" 
                placeholder="e.g. 2025–2026" 
                required 
                class="form-input"
              />
              <small class="input-hint">Applied across all course syllabus and transcripts</small>
            </div>

            <div class="input-group">
              <label>Active Semester Evaluation Cycle</label>
              <select name="semester" [(ngModel)]="system.semester" required class="form-input">
                <option value="Odd Semester (Semesters 1, 3, 5, 7)">Odd Semester (Semesters 1, 3, 5, 7)</option>
                <option value="Even Semester (Semesters 2, 4, 6, 8)">Even Semester (Semesters 2, 4, 6, 8)</option>
                <option value="Semester 1">Semester 1</option>
                <option value="Semester 2">Semester 2</option>
                <option value="Semester 3">Semester 3</option>
                <option value="Semester 4">Semester 4</option>
                <option value="Semester 5">Semester 5</option>
                <option value="Semester 6">Semester 6</option>
                <option value="Semester 7">Semester 7</option>
                <option value="Semester 8">Semester 8</option>
              </select>
              <small class="input-hint">Controls default semester filters on student & faculty pages</small>
            </div>
          </div>

          <div class="checkbox-row">
            <label class="custom-checkbox-label">
              <input type="checkbox" name="disableNewRegistrations" [(ngModel)]="system.disableNewRegistrations" />
              <span>Lock student portal registrations (Restricts new self-service accounts)</span>
            </label>
          </div>
        </div>

        <!-- Section 2: OBE & Accreditation Parameters -->
        <div class="settings-section">
          <div class="section-title-row">
            <span class="sec-icon">🎯</span>
            <div>
              <h3>Outcome-Based Education (OBE) Weightages & Thresholds</h3>
              <p>Governs automated marksheet computations, CO-PO attainment levels, and SGPA formulas.</p>
            </div>
          </div>

          <!-- Threshold Slider -->
          <div class="threshold-slider-box">
            <div class="slider-header">
              <label>Course Outcome (CO) Target Threshold Benchmark</label>
              <span class="threshold-badge">{{ system.obeTarget }}% Minimum Achievement</span>
            </div>
            <input 
              type="range" 
              name="obeTarget" 
              min="50" 
              max="95" 
              step="5" 
              [(ngModel)]="system.obeTarget" 
              class="range-slider"
            />
            <div class="slider-ticks">
              <span>50% (Basic)</span>
              <span>65%</span>
              <span>75% (Standard NBA)</span>
              <span>85%</span>
              <span>95% (Excellence)</span>
            </div>
          </div>

          <!-- Weightages Grid -->
          <div class="weights-grid">
            <div class="weight-card internal">
              <div class="weight-header">
                <span class="weight-tag">Internal CIE</span>
                <span class="weight-icon">📝</span>
              </div>
              <h4>Continuous Internal Evaluation</h4>
              <p>Assignments, Midterm Exams, Quizzes & Practical Labs</p>
              <div class="weight-input-wrap">
                <input 
                  type="number" 
                  name="internalWeight" 
                  [(ngModel)]="system.internalWeight" 
                  (ngModelChange)="adjustWeights('internal')" 
                  min="0" 
                  max="100" 
                  class="weight-input"
                />
                <span class="pct-sign">%</span>
              </div>
            </div>

            <div class="weight-card external">
              <div class="weight-header">
                <span class="weight-tag">External SEE</span>
                <span class="weight-icon">🏛️</span>
              </div>
              <h4>Semester End Examination</h4>
              <p>Final University Written Examination & External Evaluation</p>
              <div class="weight-input-wrap">
                <input 
                  type="number" 
                  name="externalWeight" 
                  [(ngModel)]="system.externalWeight" 
                  (ngModelChange)="adjustWeights('external')" 
                  min="0" 
                  max="100" 
                  class="weight-input"
                />
                <span class="pct-sign">%</span>
              </div>
            </div>
          </div>

          <div class="weights-validation-bar" [class.valid]="system.internalWeight + system.externalWeight === 100" [class.invalid]="system.internalWeight + system.externalWeight !== 100">
            <span *ngIf="system.internalWeight + system.externalWeight === 100">
              ✅ Total Weight Distribution: <strong>100%</strong> ({{ system.internalWeight }}% Internal + {{ system.externalWeight }}% External) — Configuration is valid.
            </span>
            <span *ngIf="system.internalWeight + system.externalWeight !== 100">
              ⚠️ Total weights must sum up to exactly 100% (Current Total: {{ system.internalWeight + system.externalWeight }}%).
            </span>
          </div>
        </div>

        <!-- Action Submit Row -->
        <div class="form-actions-footer">
          <button 
            type="submit" 
            [disabled]="systemForm.invalid || system.internalWeight + system.externalWeight !== 100" 
            class="btn-save-settings"
          >
            💾 Save Academic & OBE Configuration
          </button>
          <span class="save-status-hint" *ngIf="saveSuccessMessage">{{ saveSuccessMessage }}</span>
        </div>

      </form>
    </div>

    <app-footer></app-footer>
  </div>
</div>`,
  styles: [
    `
    .page-header {
      background: #101b38;
      border: 1px solid #1f2f54;
      border-radius: 14px;
      padding: 20px 24px;
      margin-bottom: 24px;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.3);
    }
    .header-text-block h1 {
      margin: 0 0 4px 0;
      color: #ffffff;
      font-size: 1.6rem;
      font-weight: 800;
    }
    .header-text-block p {
      margin: 0;
      color: #94a3b8;
      font-size: 0.92rem;
    }

    /* KPI Summary Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: #101b38;
      border: 1px solid #1f2f54;
      border-radius: 14px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    }
    .kpi-icon-wrap {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      flex-shrink: 0;
    }
    .kpi-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .kpi-label {
      font-size: 11.5px;
      text-transform: uppercase;
      font-weight: 700;
      color: #94a3b8;
    }
    .kpi-val {
      margin: 0;
      font-size: 1.45rem;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.2;
    }
    .kpi-sub {
      font-size: 12px;
      color: #64748b;
    }

    /* Settings Card Wrapper */
    .settings-card-wrapper {
      background: #101b38;
      border: 1px solid #1f2f54;
      border-radius: 14px;
      padding: 28px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
      margin-bottom: 24px;
    }

    .settings-section {
      padding-bottom: 24px;
      margin-bottom: 24px;
      border-bottom: 1px solid #1f2f54;
    }
    .settings-section:last-of-type {
      border-bottom: none;
      padding-bottom: 0;
    }

    .section-title-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 20px;
    }
    .sec-icon {
      font-size: 24px;
      margin-top: 2px;
    }
    .section-title-row h3 {
      margin: 0 0 4px 0;
      color: #ffffff;
      font-size: 1.2rem;
      font-weight: 800;
    }
    .section-title-row p {
      margin: 0;
      color: #94a3b8;
      font-size: 0.88rem;
    }

    .form-grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 16px;
    }
    .input-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .input-group label {
      font-size: 0.85rem;
      font-weight: 700;
      color: #cbd5e1;
      text-transform: uppercase;
    }
    .form-input {
      padding: 12px 14px;
      background: #091024;
      border: 1px solid #1f2f54;
      border-radius: 8px;
      color: #ffffff;
      font-size: 14px;
      font-weight: 600;
      outline: none;
      transition: all 0.2s ease;
    }
    .form-input:focus {
      border-color: #d4af37;
      box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
    }
    .input-hint {
      font-size: 11.5px;
      color: #64748b;
    }

    .checkbox-row {
      margin-top: 10px;
    }
    .custom-checkbox-label {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #cbd5e1;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
    }
    .custom-checkbox-label input {
      width: 16px;
      height: 16px;
      accent-color: #d4af37;
      cursor: pointer;
    }

    /* Threshold Slider Box */
    .threshold-slider-box {
      background: #091024;
      border: 1px solid #1f2f54;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 22px;
    }
    .slider-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 14px;
    }
    .slider-header label {
      font-size: 0.9rem;
      font-weight: 700;
      color: #cbd5e1;
      text-transform: uppercase;
    }
    .threshold-badge {
      background: rgba(212, 175, 55, 0.15);
      color: #fde68a;
      border: 1px solid rgba(212, 175, 55, 0.4);
      padding: 4px 12px;
      border-radius: 20px;
      font-weight: 800;
      font-size: 13px;
    }
    .range-slider {
      width: 100%;
      height: 8px;
      border-radius: 4px;
      background: #1f2f54;
      outline: none;
      accent-color: #d4af37;
      cursor: pointer;
      margin-bottom: 8px;
    }
    .slider-ticks {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
    }

    /* Weights Grid */
    .weights-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 16px;
    }
    .weight-card {
      background: #091024;
      border: 1px solid #1f2f54;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      transition: all 0.2s ease;
    }
    .weight-card.internal:focus-within {
      border-color: #38bdf8;
    }
    .weight-card.external:focus-within {
      border-color: #d4af37;
    }
    .weight-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .weight-tag {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 6px;
    }
    .weight-card.internal .weight-tag {
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
    }
    .weight-card.external .weight-tag {
      background: rgba(212, 175, 55, 0.15);
      color: #fde68a;
    }
    .weight-icon {
      font-size: 20px;
    }
    .weight-card h4 {
      margin: 0 0 4px 0;
      color: #ffffff;
      font-size: 1.05rem;
      font-weight: 800;
    }
    .weight-card p {
      margin: 0 0 16px 0;
      color: #94a3b8;
      font-size: 0.82rem;
      flex: 1;
    }
    .weight-input-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .weight-input {
      width: 100px;
      padding: 10px;
      background: #101b38;
      border: 1px solid #1f2f54;
      border-radius: 8px;
      color: #ffffff;
      font-size: 1.4rem;
      font-weight: 800;
      text-align: center;
      outline: none;
    }
    .pct-sign {
      font-size: 1.2rem;
      font-weight: 800;
      color: #94a3b8;
    }

    /* Validation Bar */
    .weights-validation-bar {
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
    }
    .weights-validation-bar.valid {
      background: rgba(34, 197, 94, 0.12);
      color: #4ade80;
      border: 1px solid rgba(74, 222, 128, 0.3);
    }
    .weights-validation-bar.invalid {
      background: rgba(239, 68, 68, 0.12);
      color: #f87171;
      border: 1px solid rgba(248, 113, 113, 0.3);
    }

    /* Footer Action */
    .form-actions-footer {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 24px;
      flex-wrap: wrap;
    }
    .btn-save-settings {
      padding: 14px 28px;
      background: linear-gradient(135deg, #d4af37 0%, #b38f28 100%);
      color: #0a1128;
      border: none;
      border-radius: 10px;
      font-weight: 800;
      font-size: 15px;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(212, 175, 55, 0.3);
      transition: all 0.2s ease;
    }
    .btn-save-settings:hover:not(:disabled) {
      filter: brightness(1.1);
      transform: translateY(-2px);
    }
    .btn-save-settings:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .save-status-hint {
      color: #4ade80;
      font-weight: 700;
      font-size: 13.5px;
      background: rgba(34, 197, 94, 0.15);
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid rgba(74, 222, 128, 0.3);
    }
    `
  ]
})
export class SettingsSystem implements OnInit {
  system = {
    academicYear: '2026-2027',
    semester: 'Odd Semester (Semesters 1, 3, 5, 7)',
    mode: 'live',
    disableNewRegistrations: false,
    obeTarget: 75,
    internalWeight: 40,
    externalWeight: 60
  };

  saveSuccessMessage = '';

  private readonly storageKey = 'systemSettings';
  private toastService = inject(ToastService);
  private syncService = inject(SyncService);

  constructor() {
    this.loadSystemSettings();
  }

  ngOnInit(): void {}

  private loadSystemSettings(): void {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        let currentSem = parsed.semester || 'Odd Semester (Semesters 1, 3, 5, 7)';
        if (/fall|summer/i.test(currentSem)) {
          currentSem = 'Odd Semester (Semesters 1, 3, 5, 7)';
        } else if (/spring|winter/i.test(currentSem)) {
          currentSem = 'Even Semester (Semesters 2, 4, 6, 8)';
        }

        this.system = {
          academicYear: parsed.academicYear || '2026-2027',
          semester: currentSem,
          mode: parsed.mode || 'live',
          disableNewRegistrations: !!parsed.disableNewRegistrations,
          obeTarget: parsed.obeTarget !== undefined ? Number(parsed.obeTarget) : 75,
          internalWeight: parsed.internalWeight !== undefined ? Number(parsed.internalWeight) : 40,
          externalWeight: parsed.externalWeight !== undefined ? Number(parsed.externalWeight) : 60
        };
      } catch {
        // keep defaults
      }
    }
  }

  adjustWeights(changed: 'internal' | 'external'): void {
    if (changed === 'internal') {
      this.system.externalWeight = Math.max(0, Math.min(100, 100 - this.system.internalWeight));
    } else {
      this.system.internalWeight = Math.max(0, Math.min(100, 100 - this.system.externalWeight));
    }
  }

  saveSystemSettings(): void {
    if (this.system.internalWeight + this.system.externalWeight !== 100) {
      this.toastService.error('Internal and External weights must equal 100%.');
      return;
    }

    localStorage.setItem(this.storageKey, JSON.stringify(this.system));
    this.syncService.emit('MARKS_CHANGED');
    this.toastService.success('Academic & OBE Parameters saved successfully! ⚙️');
    
    this.saveSuccessMessage = '✅ Global parameters saved & synced with Results & Transcripts!';
    setTimeout(() => this.saveSuccessMessage = '', 4000);
  }
}
