import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts$ = new BehaviorSubject<ToastMessage[]>([]);

  getToasts(): Observable<ToastMessage[]> {
    return this.toasts$.asObservable();
  }

  show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration: number = 3500): void {
    const current = this.toasts$.value;
    
    // Prevent spamming exact duplicate message
    const duplicate = current.find(t => t.message === message && t.type === type);
    if (duplicate) {
      return;
    }

    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const toast: ToastMessage = { id, message, type, duration };
    
    // Keep max 3 toasts at a time
    const updated = current.length >= 3 ? [...current.slice(1), toast] : [...current, toast];
    this.toasts$.next(updated);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  success(message: string, duration?: number): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number): void {
    this.show(message, 'error', duration);
  }

  info(message: string, duration?: number): void {
    this.show(message, 'info', duration);
  }

  warning(message: string, duration?: number): void {
    this.show(message, 'warning', duration);
  }

  remove(id: string): void {
    const current = this.toasts$.value;
    this.toasts$.next(current.filter(t => t.id !== id));
  }
}
