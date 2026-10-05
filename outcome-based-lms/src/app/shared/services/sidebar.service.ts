import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private collapsedSubject = new BehaviorSubject<boolean>(
    typeof localStorage !== 'undefined' && localStorage.getItem('sidebarCollapsed') === 'true'
  );

  public collapsed$: Observable<boolean> = this.collapsedSubject.asObservable();

  constructor() {
    this.applyBodyClass(this.isCollapsed);
  }

  public get isCollapsed(): boolean {
    return this.collapsedSubject.value;
  }

  public toggle(): void {
    const next = !this.isCollapsed;
    this.setCollapsed(next);
  }

  public setCollapsed(collapsed: boolean): void {
    this.collapsedSubject.next(collapsed);
    try {
      localStorage.setItem('sidebarCollapsed', String(collapsed));
    } catch {}
    this.applyBodyClass(collapsed);
  }

  private applyBodyClass(collapsed: boolean): void {
    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.toggle('sidebar-collapsed', collapsed);
    }
  }
}
