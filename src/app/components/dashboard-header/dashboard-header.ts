import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard-header.html',
  styleUrls: ['./dashboard-header.css'],
})
export class DashboardHeader {
  searchQuery = '';
  suggestions = [
    'Dashboard',
    'Courses',
    'Outcomes',
    'CO-PO Mapping',
    'Attainment',
    'Assessments',
    'Attendance',
    'Timetable',
    'Results',
    'Feedback',
    'Profile',
    'Settings',
    'Notifications'
  ];
  filteredSuggestions: string[] = [];

  constructor(private router: Router) {}

  onSearchChange(): void {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      this.filteredSuggestions = [];
      return;
    }

    this.filteredSuggestions = this.suggestions.filter((suggestion) =>
      suggestion.toLowerCase().includes(query)
    );
  }

  search(event: Event): void {
    event.preventDefault();
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      return;
    }

    const route = this.mapQueryToRoute(query);
    if (route) {
      this.router.navigate([route]);
      this.searchQuery = '';
      this.filteredSuggestions = [];
    }
  }

  selectSuggestion(suggestion: string): void {
    this.searchQuery = suggestion;
    this.filteredSuggestions = [];
    const route = this.mapQueryToRoute(suggestion.toLowerCase());
    if (route) {
      this.router.navigate([route]);
      this.searchQuery = '';
    }
  }

  private mapQueryToRoute(query: string): string | null {
    if (query.includes('course')) {
      return '/courses';
    }
    if (query.includes('outcome')) {
      return '/outcomes';
    }
    if (query.includes('co-po') || query.includes('copo') || query.includes('mapping')) {
      return '/copo-mapping';
    }
    if (query.includes('attainment')) {
      return '/attainment';
    }
    if (query.includes('assessment') || query.includes('assign')) {
      return '/assessments';
    }
    if (query.includes('student')) {
      return '/students';
    }
    if (query.includes('report')) {
      return '/reports';
    }
    if (query.includes('setting')) {
      return '/settings';
    }
    if (query.includes('faculty')) {
      return '/faculty';
    }
    if (query.includes('admin')) {
      return '/admin';
    }
    if (query.includes('chatbot') || query.includes('chat')) {
      return '/chatbot';
    }
    if (query.includes('dashboard')) {
      return '/dashboard';
    }
    return null;
  }
}




