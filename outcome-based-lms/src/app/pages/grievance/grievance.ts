import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { HttpClient } from '@angular/common/http';
import { SyncService } from '../../shared/services/sync.service';
import { Subscription } from 'rxjs';

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
export class Grievance implements OnInit, OnDestroy {
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

  private syncService = inject(SyncService);
  private syncSub?: Subscription;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {
    try {
      this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
      this.userName = localStorage.getItem('userName') || 'User';
    } catch {
      this.role = null;
    }
  }

  ngOnInit(): void {
    this.loadData();

    this.syncSub = this.syncService.events$.subscribe((e) => {
      if (e.type === 'GRIEVANCES_CHANGED') {
        this.loadData();
      }
    });
  }

  ngOnDestroy(): void {
    this.syncSub?.unsubscribe();
  }

  private loadData(): void {
    try {
      const stored = localStorage.getItem('obslmsGrievances');
      if (stored) {
        this.grievanceItems = JSON.parse(stored);
        this.applyFilters();
      }
    } catch {}

    this.http.get<GrievanceItem[]>('http://localhost:8080/api/grievances').subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          this.grievanceItems = data;
          try {
            localStorage.setItem('obslmsGrievances', JSON.stringify(data));
          } catch {}
          this.applyFilters();
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private saveGrievances(): void {}

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

    const payload: GrievanceItem = {
      id: Date.now(),
      title: this.newGrievance.title.trim(),
      description: this.newGrievance.description.trim(),
      category: this.newGrievance.category,
      studentName: this.userName,
      status: 'Open',
      date: new Date().toISOString()
    };

    // Save locally first
    try {
      const stored = localStorage.getItem('obslmsGrievances');
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(payload);
      localStorage.setItem('obslmsGrievances', JSON.stringify(list));
      this.syncService.emit('GRIEVANCES_CHANGED', payload);
    } catch {}

    this.http.post<GrievanceItem>('http://localhost:8080/api/grievances', payload).subscribe({
      next: (res) => {
        const commentPayload = {
          sender: this.userName,
          role: this.role || 'Student',
          text: `Submitted grievance: ${this.newGrievance.title.trim()}`,
          timestamp: new Date().toISOString()
        };
        this.http.post('http://localhost:8080/api/grievances/' + (res?.id || payload.id) + '/comments', commentPayload).subscribe(() => {
          this.loadData();
          alert('Your grievance has been successfully submitted.');
        });
      },
      error: () => {
        this.loadData();
        alert('Your grievance has been successfully recorded.');
      }
    });

    this.newGrievance = {
      title: '',
      description: '',
      category: 'Academics'
    };
  }

  loadComments(grievanceId: number): void {
    this.http.get<GrievanceComment[]>('http://localhost:8080/api/grievances/' + grievanceId + '/comments').subscribe({
      next: (data) => {
        if (this.selectedGrievance && this.selectedGrievance.id === grievanceId) {
          this.selectedGrievance.comments = data;
        }
      }
    });
  }

  openUpdateModal(grievance: GrievanceItem): void {
    this.selectedGrievance = grievance;
    this.updateStatus = grievance.status;
    this.resolutionText = grievance.resolution || '';
    this.newCommentText = '';
    this.loadComments(grievance.id);
  }

  closeUpdateModal(): void {
    this.selectedGrievance = null;
    this.resolutionText = '';
    this.newCommentText = '';
  }

  saveStatusUpdate(): void {
    if (!this.selectedGrievance) return;

    const updated = {
      ...this.selectedGrievance,
      status: this.updateStatus,
      resolution: this.resolutionText.trim()
    };

    // Update locally
    try {
      const stored = localStorage.getItem('obslmsGrievances');
      const list = stored ? JSON.parse(stored) : [];
      const idx = list.findIndex((g: any) => g.id === this.selectedGrievance!.id);
      if (idx !== -1) {
        list[idx] = updated;
      } else {
        list.push(updated);
      }
      localStorage.setItem('obslmsGrievances', JSON.stringify(list));
      this.syncService.emit('GRIEVANCES_CHANGED', updated);
    } catch {}

    const payload = {
      status: this.updateStatus,
      resolution: this.resolutionText.trim()
    };

    this.http.put<GrievanceItem>('http://localhost:8080/api/grievances/' + this.selectedGrievance.id + '/status', payload).subscribe({
      next: () => {
        if (this.resolutionText.trim()) {
          const commentPayload = {
            sender: this.userName,
            role: this.role || 'Faculty',
            text: `Status updated to ${this.updateStatus}. Remarks: ${this.resolutionText.trim()}`,
            timestamp: new Date().toISOString()
          };
          this.http.post('http://localhost:8080/api/grievances/' + this.selectedGrievance!.id + '/comments', commentPayload).subscribe(() => {
            this.loadData();
            this.closeUpdateModal();
            alert('Grievance status and resolution updated successfully.');
          });
        } else {
          this.loadData();
          this.closeUpdateModal();
          alert('Grievance status and resolution updated successfully.');
        }
      },
      error: () => {
        this.loadData();
        this.closeUpdateModal();
        alert('Grievance status and resolution updated successfully.');
      }
    });
  }

  addComment(grievance: GrievanceItem): void {
    if (!this.newCommentText.trim()) return;

    const payload = {
      sender: this.userName,
      role: this.role || 'Student',
      text: this.newCommentText.trim(),
      timestamp: new Date().toISOString()
    };

    this.http.post<GrievanceComment>('http://localhost:8080/api/grievances/' + grievance.id + '/comments', payload).subscribe({
      next: () => {
        this.loadComments(grievance.id);
        this.newCommentText = '';
      },
      error: () => {
        alert('Failed to send comment.');
      }
    });
  }
}
