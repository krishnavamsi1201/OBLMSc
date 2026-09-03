import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'approval';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  relatedData?: any;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Navbar, Sidebar, Footer],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.css']
})
export class Notifications implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  allNotifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  
  filterType: string = '';
  filterStatus: string = '';
  searchQuery: string = '';

  userRole: string = 'student';
  userName: string = 'Student';
  userId: string = '';

  notificationTypes = [
    { value: '', label: 'All Types' },
    { value: 'info', label: 'Info' },
    { value: 'success', label: 'Success' },
    { value: 'warning', label: 'Warning' },
    { value: 'error', label: 'Error' },
    { value: 'approval', label: 'Approval Required' }
  ];

  constructor() {
    this.userRole = (localStorage.getItem('userRole') || 'student').toLowerCase();
    this.userName = localStorage.getItem('userName') || (this.userRole === 'student' ? 'Student' : 'Faculty');
    this.userId = localStorage.getItem('userId') || localStorage.getItem('userEmail') || '';
  }

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    const uId = localStorage.getItem('userId') || '';
    const email = localStorage.getItem('userEmail') || '';
    const name = localStorage.getItem('userName') || '';
    const url = `http://localhost:8080/api/notifications?userId=${encodeURIComponent(uId)}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&role=${encodeURIComponent(this.userRole.toUpperCase())}`;

    this.http.get<any[]>(url).subscribe({
      next: (backendNotifs) => {
        if (Array.isArray(backendNotifs)) {
          this.allNotifications = backendNotifs.map(b => ({
            id: (b.id || Math.random()).toString(),
            type: (b.type || 'info') as any,
            title: b.title || 'Notification',
            message: b.message || '',
            timestamp: b.createdAt || new Date().toISOString(),
            isRead: !!b.read,
            actionUrl: b.actionUrl
          }));
          this.filterNotifications();
          this.cdr.detectChanges();
        }
      },
      error: () => {
        try {
          const stored = localStorage.getItem('obslmsNotifications');
          this.allNotifications = stored ? JSON.parse(stored) : [];
        } catch {
          this.allNotifications = [];
        }
        this.filterNotifications();
        this.cdr.detectChanges();
      }
    });
  }

  saveNotifications(): void {
    try {
      localStorage.setItem('obslmsNotifications', JSON.stringify(this.allNotifications));
    } catch {}
  }

  private generateSmartSystemAlerts(): void {
    const existingIds = new Set(this.allNotifications.map(n => n.id));
    const now = new Date().toISOString();

    // 1. Student Attendance Shortage Alerts
    if (this.userRole === 'student') {
      try {
        const storedLogs = JSON.parse(localStorage.getItem('obslmsAttendance') || '[]');
        const myLogs = storedLogs.filter((l: any) =>
          (l.student && l.student.toLowerCase() === this.userName.toLowerCase()) ||
          (l.student && l.student.toLowerCase() === 'krishnavamsi')
        );

        if (myLogs.length > 0) {
          const present = myLogs.filter((l: any) => l.status === 'Present').length;
          const overallPct = Math.round((present / myLogs.length) * 100);

          if (overallPct < 75 && !existingIds.has('alert-att-shortage')) {
            this.allNotifications.unshift({
              id: 'alert-att-shortage',
              type: 'warning',
              title: '⚠️ Mandatory Attendance Shortage Notice (<75%)',
              message: `Your overall attendance is currently ${overallPct}%, which is below the mandatory 75% examination eligibility threshold. Please attend upcoming lectures to maintain exam clearance.`,
              timestamp: now,
              isRead: false,
              actionUrl: '/attendance'
            });
          }
        }
      } catch {}

      // Student Grievance Resolution Notice
      if (!existingIds.has('alert-grievance-resolved')) {
        this.allNotifications.push({
          id: 'alert-grievance-resolved',
          type: 'success',
          title: '✅ Grievance Ticket Resolved',
          message: 'Your recent academic re-evaluation request has been reviewed and marked Resolved by the Department Dean.',
          timestamp: now,
          isRead: false,
          actionUrl: '/grievance'
        });
      }
    }

    // 2. Accreditation & Admin Alerts
    if (this.userRole === 'admin' || this.userRole === 'faculty') {
      if (!existingIds.has('alert-nba-ready')) {
        this.allNotifications.unshift({
          id: 'alert-nba-ready',
          type: 'info',
          title: '🎯 NBA SAR Criterion 3 Dossier Ready',
          message: 'Annual Course Outcome & Program Outcome Attainment report for Tier-1 evaluation has been compiled and is ready for PDF export.',
          timestamp: now,
          isRead: false,
          actionUrl: '/reports'
        });
      }

      if (!existingIds.has('alert-course-approvals')) {
        this.allNotifications.push({
          id: 'alert-course-approvals',
          type: 'approval',
          title: '📋 Pending CO-PO Matrix Approvals',
          message: 'New Course Outcomes mappings for Semester 3 require HOD approval.',
          timestamp: now,
          isRead: false,
          actionUrl: '/admin/approvals'
        });
      }
    }

    this.saveNotifications();
  }

  filterNotifications(): void {
    this.filteredNotifications = this.allNotifications.filter(notif => {
      const matchType = this.filterType === '' || notif.type === this.filterType;
      const matchStatus = this.filterStatus === '' || 
        (this.filterStatus === 'read' && notif.isRead) ||
        (this.filterStatus === 'unread' && !notif.isRead);
      const matchSearch = this.searchQuery === '' ||
        notif.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        notif.message.toLowerCase().includes(this.searchQuery.toLowerCase());

      return matchType && matchStatus && matchSearch;
    });
  }

  onFilterChange(): void {
    this.filterNotifications();
  }

  onSearchChange(): void {
    this.filterNotifications();
  }

  markAsRead(notification: Notification): void {
    notification.isRead = true;
    if (notification.id && !notification.id.startsWith('alert-')) {
      this.http.put(`http://localhost:8080/api/notifications/${notification.id}/read`, {}).subscribe();
    }
    this.saveNotifications();
    this.filterNotifications();
  }

  markAsUnread(notification: Notification): void {
    notification.isRead = false;
    this.saveNotifications();
    this.filterNotifications();
  }

  markAllAsRead(): void {
    this.allNotifications.forEach(n => n.isRead = true);
    const uId = this.userId || localStorage.getItem('userEmail') || this.userName;
    this.http.put(`http://localhost:8080/api/notifications/read-all?userId=${encodeURIComponent(uId)}`, {}).subscribe();
    this.saveNotifications();
    this.filterNotifications();
  }

  deleteNotification(id: string): void {
    this.allNotifications = this.allNotifications.filter(n => n.id !== id);
    if (!id.startsWith('alert-')) {
      this.http.delete(`http://localhost:8080/api/notifications/${id}`).subscribe();
    }
    this.saveNotifications();
    this.filterNotifications();
  }

  deleteAllRead(): void {
    this.allNotifications = this.allNotifications.filter(n => !n.isRead);
    this.saveNotifications();
    this.filterNotifications();
  }

  getTypeColor(type: string): string {
    switch (type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      case 'approval': return '#8b5cf6';
      default: return '#6b7280';
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'approval': return '👤';
      default: return '📢';
    }
  }

  getUnreadCount(): number {
    return this.allNotifications.filter(n => !n.isRead).length;
  }

  getTimeAgo(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

    return date.toLocaleDateString();
  }

  navigate(url?: string): void {
    if (url) {
      this.router.navigateByUrl(url);
    }
  }
}
