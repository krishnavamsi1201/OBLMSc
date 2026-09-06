import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';

@Component({
  selector: 'app-settings-appearance',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  template: `<app-navbar></app-navbar>

<div class="container">
  <app-sidebar></app-sidebar>

  <div class="content">
    <div class="page-header">
      <div class="header-title">
        <h1>🎨 Appearance Settings</h1>
        <p>Customize theme, colors, and layout preferences for your dashboard</p>
      </div>
      <button class="btn btn-secondary" (click)="resetToDefaults()">🔄 Reset Defaults</button>
    </div>

    <form class="settings-form" (ngSubmit)="saveAppearance()">
      <!-- Theme Selection -->
      <div class="settings-section">
        <h2>Display Theme</h2>
        <div class="form-group">
          <label for="theme">Select Theme</label>
          <select id="theme" name="theme" [(ngModel)]="appearance.theme" required class="form-input">
            <option value="light">☀️ Light Mode</option>
            <option value="dark">🌙 Dark Mode</option>
            <option value="system">💻 System Default</option>
          </select>
        </div>
      </div>

      <!-- Color Scheme Selection -->
      <div class="settings-section">
        <h2>Color Scheme</h2>
        <div class="color-scheme-grid">
          <div *ngFor="let scheme of colorSchemes" 
            class="color-option"
            [class.selected]="appearance.colorScheme === scheme.id"
            (click)="appearance.colorScheme = scheme.id">
            <div class="color-circle" [style.backgroundColor]="scheme.hex"></div>
            <span>{{ scheme.name }}</span>
          </div>
        </div>
      </div>

      <!-- Layout Settings -->
      <div class="settings-section">
        <h2>Layout</h2>
        <div class="form-group">
          <label for="layout">Dashboard Layout</label>
          <select id="layout" name="layout" [(ngModel)]="appearance.layout" required class="form-input">
            <option value="comfortable">👕 Comfortable (Spacious)</option>
            <option value="compact">📦 Compact (Condensed)</option>
          </select>
        </div>

        <div class="form-group">
          <label for="fontSize">Font Size</label>
          <select id="fontSize" name="fontSize" [(ngModel)]="appearance.fontSize" class="form-input">
            <option value="small">Small</option>
            <option value="medium">Medium (Default)</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>

      <!-- Additional Options -->
      <div class="settings-section">
        <h2>Options</h2>
        <div class="checkbox-group">
          <label>
            <input type="checkbox" name="showSidebar" [(ngModel)]="appearance.showSidebar" />
            <span>Show sidebar on all pages</span>
          </label>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">💾 Save Preferences</button>
      </div>
    </form>
  </div>
</div>

<app-footer></app-footer>`,
  styles: [`
    .container {
      display: grid;
      grid-template-columns: auto 1fr;
      min-height: 100vh;
      background: #0a1128;
    }

    .content {
      padding: 24px;
      overflow-y: auto;
      background: #0a1128;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      background: #101b38;
      padding: 20px 24px;
      border-radius: 12px;
      border: 1px solid #1f2f54;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    }

    .header-title h1 {
      margin: 0 0 8px 0;
      font-size: 1.8rem;
      color: #ffffff;
      font-weight: 700;
    }

    .header-title p {
      margin: 0;
      color: #94a3b8;
      font-size: 0.95rem;
    }

    .btn {
      padding: 10px 18px;
      border: none;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: #d4af37;
      color: #0a1128;
      font-weight: 700;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(212, 175, 55, 0.4);
    }

    .btn-secondary {
      background: #091024;
      color: #d4af37;
      border: 1px solid #1f2f54;
    }

    .btn-secondary:hover {
      background: #101b38;
      border-color: #d4af37;
    }

    .settings-form {
      max-width: 800px;
      margin: 0 auto;
    }

    .settings-section {
      background: #101b38;
      border: 1px solid #1f2f54;
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    }

    .settings-section h2 {
      margin: 0 0 16px 0;
      font-size: 1.25rem;
      color: #ffffff;
      border-bottom: 1px solid #1f2f54;
      padding-bottom: 12px;
      font-weight: 700;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #cbd5e1;
      font-size: 0.95rem;
    }

    .form-input {
      width: 100%;
      padding: 12px;
      border: 1px solid #1f2f54;
      border-radius: 8px;
      font-size: 0.95rem;
      background: #091024;
      color: #ffffff;
      transition: all 0.3s ease;
    }

    .form-input:focus {
      outline: none;
      border-color: #d4af37;
      box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
    }

    .color-scheme-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 16px;
    }

    .color-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #091024;
      border: 2px solid #1f2f54;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .color-option:hover {
      border-color: #d4af37;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
    }

    .color-option.selected {
      border-color: #d4af37;
      background: rgba(212, 175, 55, 0.1);
      box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
    }

    .color-circle {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
    }

    .color-option span {
      font-size: 0.9rem;
      font-weight: 600;
      color: #ffffff;
    }

    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .checkbox-group label {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      font-weight: 500;
      color: #cbd5e1;
      margin: 0;
    }

    .checkbox-group input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: #d4af37;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-top: 32px;
    }

    .form-actions .btn {
      min-width: 200px;
      text-align: center;
      justify-content: center;
    }

    @media (max-width: 768px) {
      .container {
        grid-template-columns: 1fr;
      }

      .page-header {
        flex-direction: column;
        gap: 16px;
      }

      .color-scheme-grid {
        grid-template-columns: repeat(3, 1fr);
      }

      .settings-form {
        max-width: 100%;
      }

      .form-actions {
        flex-direction: column;
      }

      .form-actions .btn {
        width: 100%;
        min-width: auto;
      }
    }
  `]
})
export class SettingsAppearance {
  appearance = {
    theme: 'light',
    colorScheme: 'blue',
    layout: 'comfortable',
    showSidebar: true,
    fontSize: 'medium'
  };
  
  private readonly storageKey = 'oblmsAppearance';

  colorSchemes = [
    { id: 'blue', name: 'Blue', hex: '#3b82f6' },
    { id: 'purple', name: 'Purple', hex: '#8b5cf6' },
    { id: 'green', name: 'Green', hex: '#10b981' },
    { id: 'red', name: 'Red', hex: '#ef4444' },
    { id: 'orange', name: 'Orange', hex: '#f97316' }
  ];

  constructor() {
    this.loadAppearance();
  }

  private loadAppearance(): void {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      try {
        this.appearance = JSON.parse(stored);
      } catch {
        this.resetDefaults();
      }
    }
  }

  private resetDefaults(): void {
    this.appearance = {
      theme: 'light',
      colorScheme: 'blue',
      layout: 'comfortable',
      showSidebar: true,
      fontSize: 'medium'
    };
  }

  saveAppearance(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.appearance));
    
    // Apply theme to document
    document.documentElement.style.colorScheme = this.appearance.theme;
    
    alert('✅ Appearance preferences saved successfully.');
  }

  resetToDefaults(): void {
    if (confirm('Are you sure you want to reset all appearance settings to defaults?')) {
      this.resetDefaults();
      this.saveAppearance();
    }
  }

  getColorSchemeColor(schemeId: string): string {
    const scheme = this.colorSchemes.find(s => s.id === schemeId);
    return scheme ? scheme.hex : '#3b82f6';
  }
}
