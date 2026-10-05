import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { SidebarService } from '../services/sidebar.service';
import { NavigationService } from '../services/navigation.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule
  ],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class Navbar {
  role: string | null = null;
  userName: string | null = null;
  private router = inject(Router);
  private sidebarService = inject(SidebarService);
  private navService = inject(NavigationService);

  get canGoBack(): boolean {
    return this.navService.canGoBack();
  }

  get isRootDashboard(): boolean {
    return this.navService.isAtRootDashboard();
  }

  goBack(): void {
    this.navService.goBack();
  }

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  constructor() {
    try {
      this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
      this.userName = localStorage.getItem('userName') || localStorage.getItem('userEmail');
    } catch (e) {
      this.role = null;
      this.userName = null;
    }
  }

  logout(): void {
    try {
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('userId');
      localStorage.removeItem('authToken');
    } catch (e) {}
    this.router.navigate(['/login']);
  }
}