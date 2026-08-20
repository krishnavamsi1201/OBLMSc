import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

interface NavItem {
  icon: string;
  label: string;
  path: string;
  exact?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, MatButtonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class Sidebar implements AfterViewInit {
  @ViewChild('sidebarRef') sidebarRef!: ElementRef<HTMLDivElement>;

  collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  navItems: NavItem[] = [];

  studentNav: NavItem[] = [
    { icon: '🏠', label: 'Student Dashboard', path: '/students', exact: true },
    { icon: '📚', label: 'My Courses', path: '/courses', exact: true },
    { icon: '📖', label: 'Subjects', path: '/subjects', exact: true },
    { icon: '🎯', label: 'Course Outcomes (CO)', path: '/course-outcomes', exact: true },
    { icon: '🎯', label: 'Program Outcomes (PO)', path: '/program-outcomes', exact: true },
    { icon: '📈', label: 'Performance', path: '/performance', exact: true },
    { icon: '🔗', label: 'CO-PO Mapping', path: '/copo-mapping', exact: true },
    { icon: '📊', label: 'CO Attainment', path: '/co-attainment', exact: true },
    { icon: '📈', label: 'PO Attainment', path: '/po-attainment', exact: true },
    { icon: '📝', label: 'Assessments', path: '/assessments', exact: true },
    { icon: '📅', label: 'Attendance', path: '/attendance', exact: true },
    { icon: '📆', label: 'Timetable', path: '/timetable', exact: true },
    { icon: '📄', label: 'Results', path: '/results', exact: true },
    { icon: '💬', label: 'Feedback', path: '/feedback', exact: true },
    { icon: '�', label: 'Notifications', path: '/notifications', exact: true },
    { icon: '👤', label: 'My Profile', path: '/profile', exact: true },
    { icon: '⚙️', label: 'Settings', path: '/settings', exact: true }
  ];

  facultyNav: NavItem[] = [
    { icon: '🏠', label: 'Faculty Dashboard', path: '/faculty', exact: true },
    { icon: '📚', label: 'Courses', path: '/courses', exact: true },
    { icon: '🎯', label: 'Outcomes', path: '/outcomes', exact: true },
    { icon: '🎯', label: 'Program Outcomes (PO)', path: '/program-outcomes', exact: true },
    { icon: '📊', label: 'Performance', path: '/performance', exact: true },
    { icon: '🔗', label: 'CO-PO Mapping', path: '/copo-mapping', exact: true },
    { icon: '📈', label: 'Attainment', path: '/attainment', exact: true },
    { icon: '📝', label: 'Examinations', path: '/examination', exact: true },
    { icon: '📩', label: 'Grievance', path: '/grievance', exact: true },
    { icon: '🧠', label: 'Question Bank', path: '/question-bank', exact: true },
    { icon: '📝', label: 'Assessments', path: '/assessments', exact: true },
    { icon: '📅', label: 'Attendance', path: '/attendance', exact: true },
    { icon: '📆', label: 'Timetable', path: '/timetable', exact: true },
    { icon: '📋', label: 'Results', path: '/results', exact: true },
    { icon: '💬', label: 'Feedback', path: '/feedback', exact: true },
    { icon: '👤', label: 'My Profile', path: '/profile', exact: true },
    { icon: '⚙️', label: 'Settings', path: '/settings', exact: true }
  ];

  adminNav: NavItem[] = [
    { icon: '�', label: 'Dashboard', path: '/admin', exact: true },
    { icon: '📚', label: 'Courses', path: '/courses', exact: true },
    { icon: '📖', label: 'Subjects', path: '/subjects', exact: true },
    { icon: '🎯', label: 'Outcomes', path: '/outcomes', exact: true },
    { icon: '🔗', label: 'CO-PO Mapping', path: '/copo-mapping', exact: true },
    { icon: '📝', label: 'Assessments', path: '/assessments', exact: true },
    { icon: '📊', label: 'Reports', path: '/reports', exact: true },
    { icon: '🔔', label: 'Notifications', path: '/notifications', exact: true },
    { icon: '⚙️', label: 'Settings', path: '/settings', exact: true },
    { icon: '👤', label: 'My Profile', path: '/profile', exact: true }
  ];

  get role(): string | null {
    return localStorage.getItem('userRole')?.toLowerCase() || null;
  }

  constructor() {
    this.applySidebarState();
    this.setNavItems();
  }

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    localStorage.setItem('sidebarCollapsed', String(this.collapsed));
    this.applySidebarState();
  }

  private setNavItems(): void {
    const currentRole = this.role;
    if (currentRole === 'student') {
      this.navItems = this.studentNav;
      return;
    }
    if (currentRole === 'faculty') {
      this.navItems = this.facultyNav;
      return;
    }
    if (currentRole === 'admin') {
      this.navItems = this.adminNav;
      return;
    }
    this.navItems = this.facultyNav;
  }

  private applySidebarState(): void {
    document.body.classList.toggle('sidebar-collapsed', this.collapsed);
  }

  ngAfterViewInit(): void {
    this.restoreScrollPosition();
  }

  saveScrollPosition(): void {
    if (this.sidebarRef?.nativeElement) {
      localStorage.setItem('sidebarScrollTop', String(this.sidebarRef.nativeElement.scrollTop));
    }
  }

  private restoreScrollPosition(): void {
    const savedScroll = Number(localStorage.getItem('sidebarScrollTop') || '0');
    if (this.sidebarRef?.nativeElement && savedScroll >= 0) {
      setTimeout(() => {
        this.sidebarRef.nativeElement.scrollTop = savedScroll;
      }, 0);
    }
  }
}
