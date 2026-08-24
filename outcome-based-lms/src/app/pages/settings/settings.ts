import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';

interface SettingsCard {
  title: string;
  description: string;
  route: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    Navbar,
    Sidebar,
    Footer
  ],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css'],
})
export class Settings implements OnInit {
  role: string | null = null;
  settingsCards: SettingsCard[] = [];

  private allCards: SettingsCard[] = [
    {
      title: '👤 Profile Settings',
      description: 'Update name, email, and department details.',
      route: '/profile'
    },
    {
      title: '🔒 Security',
      description: 'Change password and protect your account.',
      route: '/settings/security'
    },
    {
      title: '🖥️ System',
      description: 'Manage system-level preferences and status.',
      route: '/settings/system'
    },
    {
      title: '🔔 Notifications',
      description: 'Control email and application notifications.',
      route: '/notifications'
    },
    {
      title: '🎨 Appearance',
      description: 'Choose theme, colors, and display preferences.',
      route: '/settings/appearance'
    },
    {
      title: '💾 Data & Reports',
      description: 'Export reports and backup important data.',
      route: '/settings/data-reports'
    }
  ];

  constructor() {
    try {
      this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
    } catch {
      this.role = null;
    }
  }

  ngOnInit(): void {
    if (this.role === 'student') {
      // Filter out System settings and Data & Reports settings for students
      this.settingsCards = this.allCards.filter(card => 
        card.route === '/profile' || 
        card.route === '/settings/security' || 
        card.route === '/notifications' || 
        card.route === '/settings/appearance'
      );
    } else {
      this.settingsCards = [...this.allCards];
    }
  }
}
