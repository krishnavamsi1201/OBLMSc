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
    `.access-denied-shell { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(180deg, #e9f2ff 0%, #f7fbff 100%); padding: 20px; }
     .card { width: 100%; max-width: 420px; background: #fff; border-radius: 24px; padding: 36px; box-shadow: 0 24px 60px rgba(31, 99, 186, 0.12); text-align: center; }
     .icon { font-size: 48px; margin-bottom: 20px; }
     h1 { margin: 0 0 16px; color: #1f3d7a; font-size: 2rem; }
     p { margin: 0 0 28px; color: #4f6d94; line-height: 1.6; }
     button { min-width: 160px; }
    `
  ]
})
export class AccessDenied {}
