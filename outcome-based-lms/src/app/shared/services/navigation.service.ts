import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private router = inject(Router);
  private history: string[] = [];

  constructor() {
    // Listen to route changes and build internal history stack
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects || event.url;
        if (url && !url.includes('/login')) {
          const last = this.history[this.history.length - 1];
          if (last !== url) {
            this.history.push(url);
            if (this.history.length > 50) {
              this.history.shift();
            }
          }
        }
      });

    // Guard against browser back button popping all the way back to /login for active session
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', () => {
        const currentPath = window.location.pathname;
        const role = localStorage.getItem('userRole');
        if ((currentPath === '/login' || currentPath === '/' || currentPath === '') && role) {
          const dashboardRoute = this.getDashboardRoute();
          this.router.navigateByUrl(dashboardRoute, { replaceUrl: true });
        }
      });
    }
  }

  public getDashboardRoute(): string {
    const role = (localStorage.getItem('userRole') || '').toLowerCase();
    if (role === 'admin') return '/admin';
    if (role === 'faculty') return '/faculty';
    if (role === 'student') return '/students';
    return '/dashboard';
  }

  public isAtRootDashboard(): boolean {
    const current = this.router.url.split('?')[0];
    const rootRoute = this.getDashboardRoute();
    return current === rootRoute || current === '/login' || current === '/';
  }

  public canGoBack(): boolean {
    // Can go back if we are not on the root dashboard, or if history has prior screens
    return !this.isAtRootDashboard() || this.history.length > 1;
  }

  public goBack(): void {
    const current = this.router.url.split('?')[0];

    // Pop the current route from history if it matches
    if (this.history.length > 0 && this.history[this.history.length - 1] === current) {
      this.history.pop();
    }

    // Look for previous valid non-login route in history
    while (this.history.length > 0) {
      const prev = this.history.pop();
      if (prev && prev !== current && !prev.includes('/login')) {
        this.router.navigateByUrl(prev);
        return;
      }
    }

    // Safe fallback: Return directly to the user's role dashboard
    const dashboard = this.getDashboardRoute();
    if (current !== dashboard) {
      this.router.navigateByUrl(dashboard);
    } else {
      // If already on dashboard and history is empty, stay on dashboard safely
      this.router.navigateByUrl(dashboard);
    }
  }
}
