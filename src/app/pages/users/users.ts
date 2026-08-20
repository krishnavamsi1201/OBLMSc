import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

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
  imports: [CommonModule, MatButtonModule, Navbar, Sidebar, Footer],
  templateUrl: './users.html',
  styleUrls: ['./users.css'],
})
export class Users {
  selectedTab: 'faculty' | 'students' = 'faculty';

  facultyUsers: UserRecord[] = [];

  studentUsers: UserRecord[] = [];

  toggleTab(tab: 'faculty' | 'students'): void {
    this.selectedTab = tab;
  }

  get currentUsers(): UserRecord[] {
    return this.selectedTab === 'faculty' ? this.facultyUsers : this.studentUsers;
  }
}
