import { AfterViewInit, Component, ElementRef, ViewChild, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

export interface NavItem {
  icon: string;
  label: string;
  path: string;
  exact?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
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

  private router = inject(Router);

  collapsed = localStorage.getItem('sidebarCollapsed') === 'true';

  get role(): string {
    return (localStorage.getItem('userRole') || 'faculty').toLowerCase();
  }

  get userName(): string {
    return localStorage.getItem('userName') || (this.role === 'admin' ? 'Administrator' : this.role === 'faculty' ? 'Faculty Member' : 'Student');
  }

  get userEmail(): string {
    return localStorage.getItem('userEmail') || '';
  }

  get portalTitle(): string {
    if (this.role === 'admin') return 'ADMIN CONSOLE';
    if (this.role === 'faculty') return 'FACULTY CONSOLE';
    return 'STUDENT PORTAL';
  }

  get userInitial(): string {
    return this.userName.trim().charAt(0).toUpperCase() || 'U';
  }

  studentNavGroups: NavGroup[] = [
    {
      title: 'ACADEMICS',
      items: [
        { icon: 'dashboard', label: 'Student Dashboard', path: '/students', exact: true },
        { icon: 'menu_book', label: 'Enrolled Courses', path: '/courses', exact: true },
        { icon: 'subject', label: 'Subject List', path: '/subjects', exact: true },
        { icon: 'calendar_month', label: 'Weekly Timetable', path: '/timetable', exact: true }
      ]
    },
    {
      title: 'OBE & OUTCOMES',
      items: [
        { icon: 'track_changes', label: 'Course Outcomes (CO)', path: '/course-outcomes', exact: true },
        { icon: 'military_tech', label: 'Program Outcomes (PO)', path: '/program-outcomes', exact: true },
        { icon: 'hub', label: 'CO-PO Mapping Matrix', path: '/copo-mapping', exact: true },
        { icon: 'stacked_bar_chart', label: 'CO Attainment', path: '/co-attainment', exact: true },
        { icon: 'trending_up', label: 'PO Attainment', path: '/po-attainment', exact: true }
      ]
    },
    {
      title: 'EXAMINATIONS & RESULTS',
      items: [
        { icon: 'grade', label: 'Semester Results', path: '/results', exact: true },
        { icon: 'quiz', label: 'Upcoming Exams', path: '/assessments', exact: true },
        { icon: 'fact_check', label: 'Attendance %', path: '/attendance', exact: true },
        { icon: 'assessment', label: 'Marks Summary', path: '/performance', exact: true }
      ]
    },
    {
      title: 'STUDENT SERVICES',
      items: [
        { icon: 'rate_review', label: 'Feedback & Survey', path: '/feedback', exact: true },
        { icon: 'assignment', label: 'File Grievance', path: '/grievance', exact: true },
        { icon: 'notifications', label: 'Notifications', path: '/notifications', exact: true },
        { icon: 'manage_accounts', label: 'My Profile', path: '/profile', exact: true }
      ]
    }
  ];

  facultyNavGroups: NavGroup[] = [
    {
      title: 'ACADEMICS & CURRICULUM',
      items: [
        { icon: 'dashboard', label: 'Command Center', path: '/faculty', exact: true },
        { icon: 'menu_book', label: 'Assigned Courses', path: '/courses', exact: true },
        { icon: 'subject', label: 'Curriculum Subjects', path: '/subjects', exact: true },
        { icon: 'calendar_month', label: 'Weekly Timetable', path: '/timetable', exact: true },
        { icon: 'published_with_changes', label: 'Class Adjustments', path: '/class-adjustments', exact: true }
      ]
    },
    {
      title: 'OBE & ACCREDITATION',
      items: [
        { icon: 'track_changes', label: 'Course Outcomes (COs)', path: '/course-outcomes', exact: true },
        { icon: 'military_tech', label: 'Program Outcomes (POs)', path: '/program-outcomes', exact: true },
        { icon: 'hub', label: 'CO-PO Mapping Matrix', path: '/copo-mapping', exact: true },
        { icon: 'stacked_bar_chart', label: 'CO Attainment Monitor', path: '/co-attainment', exact: true },
        { icon: 'trending_up', label: 'PO Attainment Analytics', path: '/po-attainment', exact: true }
      ]
    },
    {
      title: 'EVALUATION & RESULTS',
      items: [
        { icon: 'grade', label: 'Semester Results & Marks', path: '/results', exact: true },
        { icon: 'assignment', label: 'Assessments & Grading', path: '/assessments', exact: true },
        { icon: 'quiz', label: 'Question Bank & AI', path: '/question-bank', exact: true },
        { icon: 'fact_check', label: 'Live Attendance', path: '/attendance', exact: true },
        { icon: 'assessment', label: 'Performance Analysis', path: '/performance', exact: true },
        { icon: 'edit_calendar', label: 'Examination Schedule', path: '/examination', exact: true },
        { icon: 'support_agent', label: 'Student Grievances', path: '/grievance', exact: true }
      ]
    },
    {
      title: 'SERVICES & ACCOUNT',
      items: [
        { icon: 'rate_review', label: 'Feedback & Surveys', path: '/feedback', exact: true },
        { icon: 'notifications', label: 'Alerts & Notices', path: '/notifications', exact: true },
        { icon: 'manage_accounts', label: 'Faculty Profile', path: '/profile', exact: true }
      ]
    }
  ];

  adminNavGroups: NavGroup[] = [
    {
      title: 'INSTITUTIONAL GOVERNANCE',
      items: [
        { icon: 'dashboard', label: 'Admin Command Center', path: '/admin', exact: true },
        { icon: 'school', label: 'Student Management', path: '/admin/student-management', exact: true },
        { icon: 'badge', label: 'Faculty Management', path: '/admin/faculty-management', exact: true },
        { icon: 'gavel', label: 'Unified Approvals', path: '/admin/approval-management', exact: true }
      ]
    },
    {
      title: 'CURRICULUM & OBE REGISTRY',
      items: [
        { icon: 'auto_stories', label: 'Course-Subject Allocation', path: '/admin/course-subject-assignment', exact: true },
        { icon: 'supervisor_account', label: 'Faculty Course Mapping', path: '/admin/faculty-course-allocation', exact: true },
        { icon: 'published_with_changes', label: 'Class Adjustments Registry', path: '/class-adjustments', exact: true },
        { icon: 'hub', label: 'Assessment-CO Mapping', path: '/admin/assessment-co-mapping', exact: true },
        { icon: 'hub', label: 'Institutional CO-PO Matrix', path: '/copo-mapping', exact: true },
        { icon: 'menu_book', label: 'Courses Catalog', path: '/courses', exact: true }
      ]
    },
    {
      title: 'ACCREDITATION & RESULTS',
      items: [
        { icon: 'grade', label: 'Student Results & Transcripts', path: '/results', exact: true },
        { icon: 'trending_up', label: 'PO Institutional Attainment', path: '/po-attainment', exact: true },
        { icon: 'quiz', label: 'Question Bank Governance', path: '/question-bank', exact: true },
        { icon: 'assignment', label: 'Assessments Registry', path: '/assessments', exact: true },
        { icon: 'bar_chart', label: 'Accreditation Reports', path: '/reports', exact: true },
        { icon: 'support_agent', label: 'Student Grievance Desk', path: '/grievance', exact: true }
      ]
    },
    {
      title: 'SYSTEM & SETTINGS',
      items: [
        { icon: 'notifications', label: 'System Notifications', path: '/notifications', exact: true },
        { icon: 'settings', label: 'System Settings', path: '/settings', exact: true },
        { icon: 'manage_accounts', label: 'Dean Profile', path: '/profile', exact: true }
      ]
    }
  ];

  get navGroups(): NavGroup[] {
    const currentRole = this.role;
    if (currentRole === 'student') {
      return this.studentNavGroups;
    }
    if (currentRole === 'admin') {
      return this.adminNavGroups;
    }
    return this.facultyNavGroups;
  }

  constructor() {
    this.applySidebarState();
  }

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    localStorage.setItem('sidebarCollapsed', String(this.collapsed));
    this.applySidebarState();
  }

  logout(): void {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
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
