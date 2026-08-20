import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';

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
export class Settings {
  settingsCards = [
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
}
