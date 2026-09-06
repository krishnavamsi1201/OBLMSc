import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule],
  template: `
    <div class="access-denied-shell">
      <div class="card">
        <div class="icon">🚫</div>
        <h1>Access Denied</h1>
        <p>You do not have permission to view this page.</p>
        <button mat-raised-button color="primary" routerLink="/login">Return to Login</button>
      </div>
    </div>
  `,
  styles: [
    `.access-denied-shell { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0a1128; padding: 20px; }
     .card { width: 100%; max-width: 420px; background: #101b38; border: 1px solid #1f2f54; border-radius: 24px; padding: 36px; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5); text-align: center; }
     .icon { font-size: 48px; margin-bottom: 20px; }
     h1 { margin: 0 0 16px; color: #ffffff; font-size: 2rem; font-weight: 800; }
     p { margin: 0 0 28px; color: #94a3b8; line-height: 1.6; }
     button { min-width: 160px; background: linear-gradient(135deg, #d4af37 0%, #b38f28 100%) !important; color: #0a1128 !important; font-weight: 700 !important; }
    `
  ]
})
export class AccessDenied {}
