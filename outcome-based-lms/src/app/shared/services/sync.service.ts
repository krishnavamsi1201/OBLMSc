import { Injectable, NgZone, inject } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export type SyncEventType =
  | 'COURSES_CHANGED'
  | 'ENROLLMENTS_CHANGED'
  | 'ATTENDANCE_CHANGED'
  | 'MARKS_CHANGED'
  | 'LECTURES_CHANGED'
  | 'GRIEVANCES_CHANGED'
  | 'NOTIFICATIONS_CHANGED';

export interface SyncEvent {
  type: SyncEventType;
  payload?: any;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private zone = inject(NgZone);
  private eventSubject = new Subject<SyncEvent>();

  public events$: Observable<SyncEvent> = this.eventSubject.asObservable();

  constructor() {
    this.listenToStorageEvents();
  }

  /**
   * Emit an event locally and across open browser tabs
   */
  public emit(type: SyncEventType, payload?: any): void {
    const event: SyncEvent = {
      type,
      payload,
      timestamp: Date.now()
    };

    // Emit in current window
    this.eventSubject.next(event);

    // Broadcast across browser tabs using localStorage trigger
    try {
      localStorage.setItem('obslms_sync_event', JSON.stringify(event));
    } catch {}
  }

  /**
   * Listen to storage events from other tabs
   */
  private listenToStorageEvents(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === 'obslms_sync_event' && event.newValue) {
          try {
            const parsed: SyncEvent = JSON.parse(event.newValue);
            this.zone.run(() => {
              this.eventSubject.next(parsed);
            });
          } catch {}
        }
      });
    }
  }
}
