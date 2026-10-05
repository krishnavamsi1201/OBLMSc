import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'delete';
  duration?: number;
}

export interface PopupAlert {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'delete';
  icon: string;
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts$ = new BehaviorSubject<ToastMessage[]>([]);
  private activePopup$ = new BehaviorSubject<PopupAlert | null>(null);
  private popupTimeout: any = null;

  getToasts(): Observable<ToastMessage[]> {
    return this.toasts$.asObservable();
  }

  getActivePopup(): Observable<PopupAlert | null> {
    return this.activePopup$.asObservable();
  }

  show(
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' | 'delete' = 'info',
    duration: number = 2800,
    customTitle?: string
  ): void {
    const id = 'popup_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    // Context-aware type & title derivation
    let computedType = type;
    const msgLower = (message || '').toLowerCase();
    if (msgLower.includes('delete') || msgLower.includes('remove') || msgLower.includes('purged') || msgLower.includes('archived')) {
      computedType = 'delete';
    }

    let title = customTitle;
    if (!title) {
      if (computedType === 'delete') {
        title = 'Item Removed Successfully';
      } else if (msgLower.includes('student') && (msgLower.includes('added') || msgLower.includes('create') || msgLower.includes('enrolled'))) {
        title = 'Student Enrolled Successfully';
      } else if (msgLower.includes('faculty') && (msgLower.includes('added') || msgLower.includes('create') || msgLower.includes('assigned'))) {
        title = 'Faculty Assigned Successfully';
      } else if (msgLower.includes('course') || msgLower.includes('subject')) {
        title = msgLower.includes('added') ? 'Subject Created Successfully' : 'Course Updated';
      } else if (msgLower.includes('mark') || msgLower.includes('score') || msgLower.includes('grade')) {
        title = 'Marks Recorded & Attainment Updated';
      } else if (msgLower.includes('attendance')) {
        title = 'Attendance Successfully Saved';
      } else if (msgLower.includes('question') || msgLower.includes('assessment')) {
        title = 'Assessment / Question Bank Updated';
      } else if (msgLower.includes('broadcast') || msgLower.includes('circular') || msgLower.includes('notice')) {
        title = 'Circular Broadcasted to Students';
      } else if (msgLower.includes('co') || msgLower.includes('po') || msgLower.includes('outcome')) {
        title = 'OBE Outcomes Mapped & Saved';
      } else if (computedType === 'success') {
        title = 'Action Completed Successfully!';
      } else if (computedType === 'error') {
        title = 'Action Encountered an Error';
      } else if (computedType === 'warning') {
        title = 'Attention / Verification Required';
      } else {
        title = 'System Notification';
      }
    }

    // Determine icon
    let icon = 'check_circle';
    if (computedType === 'delete') {
      icon = 'delete_sweep';
    } else if (computedType === 'error') {
      icon = 'error_outline';
    } else if (computedType === 'warning') {
      icon = 'warning_amber';
    } else if (computedType === 'info') {
      icon = 'info_outline';
    } else if (msgLower.includes('mark') || msgLower.includes('grade')) {
      icon = 'fact_check';
    } else if (msgLower.includes('attendance')) {
      icon = 'how_to_reg';
    } else if (msgLower.includes('broadcast') || msgLower.includes('circular')) {
      icon = 'campaign';
    }

    // Set centered popup
    if (this.popupTimeout) {
      clearTimeout(this.popupTimeout);
      this.popupTimeout = null;
    }

    const popup: PopupAlert = {
      id,
      title,
      message,
      type: computedType,
      icon,
      duration
    };

    this.activePopup$.next(popup);

    if (duration > 0) {
      this.popupTimeout = setTimeout(() => {
        this.closePopup(id);
      }, duration);
    }
  }

  popup(title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' | 'delete' = 'success', duration: number = 2800): void {
    this.show(message, type, duration, title);
  }

  success(message: string, duration?: number, title?: string): void {
    this.show(message, 'success', duration, title);
  }

  error(message: string, duration?: number, title?: string): void {
    this.show(message, 'error', duration, title);
  }

  info(message: string, duration?: number, title?: string): void {
    this.show(message, 'info', duration, title);
  }

  warning(message: string, duration?: number, title?: string): void {
    this.show(message, 'warning', duration, title);
  }

  delete(message: string, duration?: number, title?: string): void {
    this.show(message, 'delete', duration, title);
  }

  closePopup(id?: string): void {
    if (this.popupTimeout) {
      clearTimeout(this.popupTimeout);
      this.popupTimeout = null;
    }
    const current = this.activePopup$.value;
    if (!id || (current && current.id === id)) {
      this.activePopup$.next(null);
    }
  }

  remove(id: string): void {
    const current = this.toasts$.value;
    this.toasts$.next(current.filter(t => t.id !== id));
  }
}
