import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
  allNotifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  
  filterType: string = '';
  filterStatus: string = '';
  searchQuery: string = '';

  notificationTypes = [
    { value: '', label: 'All Types' },
    { value: 'info', label: 'Info' },
    { value: 'success', label: 'Success' },
    { value: 'warning', label: 'Warning' },
    { value: 'error', label: 'Error' },
    { value: 'approval', label: 'Approval Required' }
  ];

  constructor() {
    this.loadNotifications();
    this.generateNotifications();
  }

  ngOnInit(): void {
    this.filterNotifications();
  }

  loadNotifications(): void {
    try {
      const stored = localStorage.getItem('obslmsNotifications');
      this.allNotifications = stored ? JSON.parse(stored) : [];
    } catch {
      this.allNotifications = [];
    }
  }

  saveNotifications(): void {
    try {
      localStorage.setItem('obslmsNotifications', JSON.stringify(this.allNotifications));
    } catch {}
  }

  generateNotifications(): void {
    if (this.allNotifications.length === 0) {
      const sampleNotifications: Notification[] = [
        {
          id: '1',
          type: 'success',
          title: 'Faculty Added',
          message: 'Dr. Ramesh Kumar has been added as Faculty - CSE Department',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          isRead: false,
          relatedData: { type: 'faculty', action: 'added', name: 'Dr. Ramesh Kumar' }
        },
        {
          id: '2',
          type: 'approval',
          title: 'Mapping Pending Approval',
          message: 'Assessment-CO Mapping for CSE-DBMS requires admin approval',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          isRead: false,
          actionUrl: '/admin/approval-management',
          relatedData: { type: 'assessment-co-mapping', status: 'pending' }
        },
        {
          id: '3',
          type: 'info',
          title: 'Assessment Created',
          message: 'Mid Exam for CSE-Java programming assessment has been created',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          isRead: true,
          relatedData: { type: 'assessment', action: 'created' }
        },
        {
          id: '4',
          type: 'success',
          title: 'Marks Entered',
          message: 'Marks for Quiz-1 (CSE-DBMS) have been entered by Faculty',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          isRead: true,
          relatedData: { type: 'marks', action: 'entered' }
        },
        {
          id: '5',
          type: 'warning',
          title: 'CO Attainment Below Target',
          message: 'CO1 achievement (62%) is below target (75%) for CSE Course',
          timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          isRead: true,
          actionUrl: '/co-attainment',
          relatedData: { type: 'co-attainment', coCode: 'CO1', achievement: 62 }
        }
      ];

      this.allNotifications = sampleNotifications;
      this.saveNotifications();
    }
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
    this.saveNotifications();
    this.filterNotifications();
  }

  deleteNotification(id: string): void {
    this.allNotifications = this.allNotifications.filter(n => n.id !== id);
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

  addNotification(notif: Omit<Notification, 'id'>): void {
    const newNotif: Notification = {
      ...notif,
      id: Date.now().toString()
    };
    this.allNotifications.unshift(newNotif);
    this.saveNotifications();
    this.filterNotifications();
  }

  notifyFacultyAdded(facultyName: string, department: string): void {
    this.addNotification({
      type: 'success',
      title: 'Faculty Added',
      message: `${facultyName} has been added as Faculty - ${department} Department`,
      timestamp: new Date().toISOString(),
      isRead: false,
      relatedData: { type: 'faculty', action: 'added', name: facultyName }
    });
  }

  notifyAssessmentCreated(assessmentName: string, course: string): void {
    this.addNotification({
      type: 'info',
      title: 'Assessment Created',
      message: `${assessmentName} assessment has been created for ${course}`,
      timestamp: new Date().toISOString(),
      isRead: false,
      relatedData: { type: 'assessment', action: 'created' }
    });
  }

  notifyMarksEntered(assessmentName: string, course: string): void {
    this.addNotification({
      type: 'success',
      title: 'Marks Entered',
      message: `Marks for ${assessmentName} (${course}) have been entered`,
      timestamp: new Date().toISOString(),
      isRead: false,
      relatedData: { type: 'marks', action: 'entered' }
    });
  }

  notifyMappingPending(): void {
    this.addNotification({
      type: 'approval',
      title: 'Mapping Pending Approval',
      message: 'New mappings require admin approval',
      timestamp: new Date().toISOString(),
      isRead: false,
      actionUrl: '/admin/approval-management',
      relatedData: { type: 'mapping', status: 'pending' }
    });
  }
}

