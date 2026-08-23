import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';

interface GrievanceItem {
  id: number;
  title: string;
  description: string;
  category: string;
  studentName: string;
  status: 'Open' | 'In Review' | 'Resolved';
  date: string;
  resolution?: string;
}

@Component({
  selector: 'app-grievance',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, Navbar, Sidebar, Footer],
  templateUrl: './grievance.html',
  styleUrls: ['./grievance.css'],
})
export class Grievance implements OnInit {
  role: string | null = null;
  userName = 'User';
  grievanceItems: GrievanceItem[] = [];
  filteredGrievances: GrievanceItem[] = [];
  isLoading = true;

  // New Grievance form bindings (for students)
  newGrievance = {
    title: '',
    description: '',
    category: 'Academics'
  };

  // Status update bindings (for faculty/admin)
  selectedGrievance: GrievanceItem | null = null;
  updateStatus: 'Open' | 'In Review' | 'Resolved' = 'In Review';
  resolutionText = '';

  // Filters
  categoryFilter = '';
  statusFilter = '';

  constructor() {
    try {
      this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
      this.userName = localStorage.getItem('userName') || 'User';
    } catch {
      this.role = null;
    }
  }

  ngOnInit(): void {
    this.loadData();
    this.applyFilters();
  }

  private loadData(): void {
    try {
      const stored = localStorage.getItem('obslmsGrievances');
      this.grievanceItems = stored ? JSON.parse(stored) as GrievanceItem[] : [];
    } catch {
      this.grievanceItems = [];
    }
    this.isLoading = false;
  }

  private saveGrievances(): void {
    try {
      localStorage.setItem('obslmsGrievances', JSON.stringify(this.grievanceItems));
    } catch {}
  }

  applyFilters(): void {
    let results = this.grievanceItems;

    // Filter by student if role is student
    if (this.role === 'student') {
      results = results.filter(g => g.studentName.toLowerCase() === this.userName.toLowerCase());
    }

    if (this.statusFilter) {
      results = results.filter(g => g.status === this.statusFilter);
    }

    if (this.categoryFilter) {
      results = results.filter(g => g.category === this.categoryFilter);
    }

    this.filteredGrievances = results.sort((a, b) => b.id - a.id); // Show newest first
  }

  submitGrievance(): void {
    if (!this.newGrievance.title.trim() || !this.newGrievance.description.trim()) {
      alert('Please fill in both the title and description.');
      return;
    }

    const nextId = this.grievanceItems.length ? Math.max(...this.grievanceItems.map(g => g.id)) + 1 : 1;
    const newRecord: GrievanceItem = {
      id: nextId,
      title: this.newGrievance.title.trim(),
      description: this.newGrievance.description.trim(),
      category: this.newGrievance.category,
      studentName: this.userName,
      status: 'Open',
      date: new Date().toISOString()
    };

    this.grievanceItems = [...this.grievanceItems, newRecord];
    this.saveGrievances();
    
    // Reset form
    this.newGrievance = {
      title: '',
      description: '',
      category: 'Academics'
    };

    alert('Your grievance has been successfully submitted.');
    this.applyFilters();
  }

  openUpdateModal(grievance: GrievanceItem): void {
    if (this.role !== 'admin' && this.role !== 'faculty') {
      alert('Only admins and faculty can resolve grievances.');
      return;
    }
    this.selectedGrievance = grievance;
    this.updateStatus = grievance.status;
    this.resolutionText = grievance.resolution || '';
  }

  closeUpdateModal(): void {
    this.selectedGrievance = null;
    this.resolutionText = '';
  }

  saveStatusUpdate(): void {
    if (!this.selectedGrievance) return;

    const idx = this.grievanceItems.findIndex(g => g.id === this.selectedGrievance!.id);
    if (idx >= 0) {
      this.grievanceItems[idx].status = this.updateStatus;
      if (this.resolutionText.trim()) {
        this.grievanceItems[idx].resolution = this.resolutionText.trim();
      }
      this.saveGrievances();
      alert('Grievance status updated successfully.');
      this.closeUpdateModal();
      this.applyFilters();
    }
  }
}
