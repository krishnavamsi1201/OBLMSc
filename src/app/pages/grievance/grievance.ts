import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';

interface GrievanceComment {
  sender: string;
  role: string;
  text: string;
  timestamp: string;
}

interface GrievanceItem {
  id: number;
  title: string;
  description: string;
  category: string;
  studentName: string;
  status: 'Open' | 'In Review' | 'Resolved';
  date: string;
  resolution?: string;
  comments?: GrievanceComment[];
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
  newCommentText = '';

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
      if (stored) {
        this.grievanceItems = JSON.parse(stored) as GrievanceItem[];
      } else {
        // Seed default grievances
        this.grievanceItems = [
          { 
            id: 1, 
            title: 'Discrepancy in Midterm attendance record', 
            description: 'I was marked absent on August 10th despite presenting my medical certificate.', 
            category: 'Attendance', 
            studentName: 'Raj Kumar', 
            status: 'Open', 
            date: '2026-08-11T10:00',
            comments: [
              { sender: 'System', role: 'System', text: 'Ticket submitted successfully.', timestamp: '2026-08-11T10:00:00Z' }
            ]
          },
          { 
            id: 2, 
            title: 'LMS file upload error', 
            description: 'When trying to submit the machine learning assignment, the upload button throws a 500 error.', 
            category: 'Technical Support', 
            studentName: 'Sneha Patel', 
            status: 'In Review', 
            date: '2026-08-12T14:30',
            comments: [
              { sender: 'Sneha Patel', role: 'student', text: 'Please resolve soon as deadline is tomorrow.', timestamp: '2026-08-12T14:32:00Z' },
              { sender: 'System Administrator', role: 'admin', text: 'Taking a look at the server log. It seems like a file size restriction.', timestamp: '2026-08-12T16:00:00Z' }
            ]
          },
          { 
            id: 3, 
            title: 'Incomplete Course outcome description', 
            description: 'Course outcomes for cloud computing subject are missing CO5 details.', 
            category: 'Academics', 
            studentName: 'Amit Shah', 
            status: 'Resolved', 
            date: '2026-08-05T09:00', 
            resolution: 'Added the missing CO5 description to the course outline.',
            comments: [
              { sender: 'Amit Shah', role: 'student', text: 'Cloud Computing CO5 is empty on performance grid.', timestamp: '2026-08-05T09:02:00Z' },
              { sender: 'Faculty Board', role: 'faculty', text: 'CO5 added successfully: Compare and evaluate infrastructure metrics.', timestamp: '2026-08-05T11:45:00Z' }
            ]
          }
        ];
        this.saveGrievances();
      }
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
      date: new Date().toISOString(),
      comments: [
        { sender: this.userName, role: this.role || 'Student', text: `Submitted grievance: ${this.newGrievance.title.trim()}`, timestamp: new Date().toISOString() }
      ]
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
    this.selectedGrievance = grievance;
    this.updateStatus = grievance.status;
    this.resolutionText = grievance.resolution || '';
    this.newCommentText = '';
  }

  closeUpdateModal(): void {
    this.selectedGrievance = null;
    this.resolutionText = '';
    this.newCommentText = '';
  }

  saveStatusUpdate(): void {
    if (!this.selectedGrievance) return;

    const idx = this.grievanceItems.findIndex(g => g.id === this.selectedGrievance!.id);
    if (idx >= 0) {
      this.grievanceItems[idx].status = this.updateStatus;
      if (this.resolutionText.trim()) {
        this.grievanceItems[idx].resolution = this.resolutionText.trim();
        
        // Log status change comment
        if (!this.grievanceItems[idx].comments) {
          this.grievanceItems[idx].comments = [];
        }
        this.grievanceItems[idx].comments!.push({
          sender: this.userName,
          role: this.role || 'Faculty',
          text: `Status updated to ${this.updateStatus}. Resolution Remarks: ${this.resolutionText.trim()}`,
          timestamp: new Date().toISOString()
        });
      }
      this.saveGrievances();
      alert('Grievance status and resolution updated successfully.');
      this.closeUpdateModal();
      this.applyFilters();
    }
  }

  addComment(grievance: GrievanceItem): void {
    if (!this.newCommentText.trim()) return;

    if (!grievance.comments) {
      grievance.comments = [];
    }

    grievance.comments.push({
      sender: this.userName,
      role: this.role || 'Student',
      text: this.newCommentText.trim(),
      timestamp: new Date().toISOString()
    });

    const idx = this.grievanceItems.findIndex(g => g.id === grievance.id);
    if (idx >= 0) {
      this.grievanceItems[idx].comments = grievance.comments;
      this.saveGrievances();
    }

    this.newCommentText = '';
  }
}
