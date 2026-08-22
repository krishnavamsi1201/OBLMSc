import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Chatbot } from './pages/chatbot/chatbot';
import { ToastService } from './shared/services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Chatbot],
  templateUrl: './app.html'
})
export class App {
  private toastService = inject(ToastService);
  toasts$ = this.toastService.getToasts();

  removeToast(id: string): void {
    this.toastService.remove(id);
  }
}