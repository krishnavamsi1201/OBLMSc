import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';

import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, Navbar, Sidebar, Footer],
  templateUrl: './users.html',
  styleUrls: ['./users.css'],
})
export class Users implements OnInit {
  selectedTab: 'faculty' | 'students' = 'faculty';
  
  facultyUsers: UserRecord[] = [];
  studentUsers: UserRecord[] = [];
  searchQuery: string = '';

  // CRUD Bindings
  showUserForm = false;
  editingUserIndex = -1;
  currentUser: UserRecord = this.createEmptyUser();

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  createEmptyUser(): UserRecord {
    return { id: '', name: '', email: '', role: 'Faculty', department: 'Computer Science' };
  }

  loadUsers(): void {
    this.http.get<UserRecord[]>('http://localhost:8080/api/users').subscribe({
      next: (data) => {
        this.facultyUsers = data.filter(u => u.role.toLowerCase() === 'faculty' || u.role.toLowerCase() === 'admin');
        this.studentUsers = data.filter(u => u.role.toLowerCase() === 'student');
        try {
          localStorage.setItem('obslmsUsersDatabase', JSON.stringify(data));
        } catch {}
      },
      error: () => {
        this.facultyUsers = [];
        this.studentUsers = [];
      }
    });
  }

  saveUsersToStorage(): void {}

  logAction(action: string): void {
    try {
      const activeAdmin = localStorage.getItem('userName') || 'Admin';
      const storedLogs = localStorage.getItem('obslmsAuditLogs');
      const logs = storedLogs ? JSON.parse(storedLogs) : [];
      logs.unshift({
        user: activeAdmin,
        action,
        timestamp: new Date().toISOString()
      });
      if (logs.length > 50) logs.pop();
      localStorage.setItem('obslmsAuditLogs', JSON.stringify(logs));
    } catch {}
  }

  toggleTab(tab: 'faculty' | 'students'): void {
    this.selectedTab = tab;
    this.resetUserForm();
  }

  getFilteredUsers(): UserRecord[] {
    const list = this.selectedTab === 'faculty' ? this.facultyUsers : this.studentUsers;
    if (!this.searchQuery.trim()) {
      return list;
    }
    const q = this.searchQuery.toLowerCase();
    return list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q));
  }

  openAddForm(): void {
    this.showUserForm = true;
    this.editingUserIndex = -1;
    this.currentUser = this.createEmptyUser();
    this.currentUser.role = this.selectedTab === 'faculty' ? 'Faculty' : 'Student';
  }

  editUser(user: UserRecord, index: number): void {
    this.showUserForm = true;
    this.editingUserIndex = index;
    this.currentUser = { ...user };
  }

  saveUser(): void {
    if (!this.currentUser.id.trim() || !this.currentUser.name.trim() || !this.currentUser.email.trim()) {
      alert('Please fill out all user profile details.');
      return;
    }

    this.http.post<UserRecord>('http://localhost:8080/api/users', this.currentUser).subscribe({
      next: () => {
        this.loadUsers();
        this.resetUserForm();
        alert('User profile saved successfully.');
      },
      error: () => {
        alert('Failed to save user profile.');
      }
    });
  }

  deleteUser(user: UserRecord): void {
    if (confirm(`Are you sure you want to delete user ${user.name}?`)) {
      this.http.delete('http://localhost:8080/api/users/' + user.id).subscribe({
        next: () => {
          this.loadUsers();
          alert('User profile deleted.');
        },
        error: () => {
          alert('Failed to delete user.');
        }
      });
    }
  }

  changeRole(user: UserRecord, newRole: string): void {
    if (user.role === newRole) return;
    
    const updatedUser = { ...user, role: newRole };
    this.http.post<UserRecord>('http://localhost:8080/api/users', updatedUser).subscribe({
      next: () => {
        this.loadUsers();
        alert(`Role changed successfully to ${newRole}.`);
      },
      error: () => {
        alert('Failed to change user role.');
      }
    });
  }

  resetUserForm(): void {
    this.showUserForm = false;
    this.editingUserIndex = -1;
    this.currentUser = this.createEmptyUser();
  }
}
