import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { ToastService } from '../../shared/services/toast.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

interface Outcome {
  id: number;
  type: 'CO' | 'PO';
  code: string;
  description: string;
  bloomsLevel: string;
  course: string;
  approvalStatus: 'Approved' | 'Pending Approval' | 'Rejected';
  faculty?: string;
}

@Component({
  selector: 'app-outcomes',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule],
  templateUrl: './outcomes.html',
  styleUrls: ['./outcomes.css'],
})
export class Outcomes implements OnInit {
  role: string | null = null;
  currentUserName: string = '';
  showList = true;
  outcomes: Outcome[] = [];
  pendingOutcomes: Outcome[] = [];

  courses: string[] = [];
  bloomLevels = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];

  currentOutcome: Outcome = this.createEmptyOutcome();
  editing = false;
  isLoading = false;

  private http = inject(HttpClient);
  private toast = inject(ToastService);

  ngOnInit(): void {
    this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
    this.currentUserName = localStorage.getItem('userName') || 'Faculty Member';
    this.loadCourses();
    this.loadOutcomes();
  }

  loadCourses(): void {
    this.http.get<any[]>('http://localhost:8080/api/courses').subscribe({
      next: (courseList) => {
        if (courseList && courseList.length > 0) {
          this.courses = courseList
            .map(c => `${c.code ? c.code : ''}${c.code && c.title ? ' - ' : ''}${c.title ? c.title : ''}`)
            .filter(Boolean);
        } else {
          this.fallbackCourses();
        }
      },
      error: () => this.fallbackCourses()
    });
  }

  private fallbackCourses(): void {
    try {
      const stored = localStorage.getItem('obslmsCourses');
      const courseList = stored ? JSON.parse(stored) as Array<{ code: string; title: string }> : [];
      this.courses = courseList
        .map(c => `${c.code ? c.code : ''}${c.code && c.title ? ' - ' : ''}${c.title ? c.title : ''}`)
        .filter(Boolean);
    } catch {
      this.courses = [];
    }
  }

  loadOutcomes(): void {
    this.isLoading = true;
    this.http.get<any[]>('http://localhost:8080/api/course-outcomes').subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.outcomes = data.map(item => ({
            id: item.id,
            type: 'CO',
            code: item.co || 'CO1',
            description: item.description || '',
            bloomsLevel: item.bloomsLevel || 'Apply',
            course: item.course || '',
            approvalStatus: item.approvalStatus || 'Approved',
            faculty: item.faculty || 'Faculty Member'
          }));
        } else {
          this.loadFallbackOutcomes();
        }
        this.updatePendingList();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching outcomes from backend:', err);
        this.loadFallbackOutcomes();
        this.isLoading = false;
      }
    });
  }

  private updatePendingList(): void {
    this.pendingOutcomes = this.outcomes.filter(o => o.approvalStatus === 'Pending Approval');
  }

  private loadFallbackOutcomes(): void {
    try {
      const stored = localStorage.getItem('obslmsOutcomes');
      this.outcomes = stored ? JSON.parse(stored) : [];
      this.updatePendingList();
    } catch {
      this.outcomes = [];
    }
  }

  get activeCount(): number {
    return this.outcomes.filter(o => o.approvalStatus === 'Approved').length;
  }

  get reviewCount(): number {
    return this.outcomes.filter(o => o.approvalStatus === 'Pending Approval').length;
  }

  createEmptyOutcome(): Outcome {
    return {
      id: 0,
      type: 'CO',
      code: '',
      description: '',
      bloomsLevel: 'Apply',
      course: '',
      approvalStatus: this.role === 'admin' ? 'Approved' : 'Pending Approval',
      faculty: this.currentUserName
    };
  }

  toggleList(): void {
    this.showList = !this.showList;
  }

  startAdd(type: 'CO' | 'PO'): void {
    this.editing = false;
    this.currentOutcome = this.createEmptyOutcome();
    this.currentOutcome.type = type;
    this.showList = true;
  }

  startEdit(outcome: Outcome): void {
    this.editing = true;
    this.currentOutcome = { ...outcome };
    this.showList = true;
  }

  saveOutcome(): void {
    if (!this.currentOutcome.code || !this.currentOutcome.description.trim() || !this.currentOutcome.bloomsLevel || (this.currentOutcome.type === 'CO' && !this.currentOutcome.course)) {
      alert('Please fill all required fields.');
      return;
    }

    // Extract pure course code
    const courseCode = this.currentOutcome.course.includes(' - ')
      ? this.currentOutcome.course.split(' - ')[0].trim()
      : this.currentOutcome.course.trim();

    const payload = {
      course: courseCode,
      co: this.currentOutcome.code,
      description: this.currentOutcome.description,
      bloomsLevel: this.currentOutcome.bloomsLevel,
      faculty: this.currentUserName,
      role: this.role || 'faculty'
    };

    if (this.editing && this.currentOutcome.id > 0) {
      this.http.put(`http://localhost:8080/api/course-outcomes/${this.currentOutcome.id}`, payload).subscribe({
        next: () => {
          this.toast.show('Course outcome updated successfully', 'success');
          this.loadOutcomes();
          this.resetForm();
        },
        error: () => {
          this.toast.show('Error updating outcome', 'error');
        }
      });
    } else {
      this.http.post('http://localhost:8080/api/course-outcomes', payload).subscribe({
        next: (created: any) => {
          if (this.role === 'admin') {
            this.toast.show('Course outcome created and approved!', 'success');
          } else {
            this.toast.show('Course outcome submitted! Sent to Admin for approval.', 'info');
          }
          this.loadOutcomes();
          this.resetForm();
        },
        error: (err) => {
          console.error('Error saving outcome:', err);
          this.toast.show('Failed to save outcome to backend.', 'error');
        }
      });
    }
  }

  approveOutcome(outcome: Outcome): void {
    this.http.put(`http://localhost:8080/api/course-outcomes/${outcome.id}/approve`, {}).subscribe({
      next: () => {
        this.toast.show(`Course Outcome "${outcome.code}" approved successfully!`, 'success');
        this.loadOutcomes();
      },
      error: (err) => {
        console.error('Error approving outcome:', err);
        this.toast.show('Failed to approve outcome', 'error');
      }
    });
  }

  rejectOutcome(outcome: Outcome): void {
    if (!confirm(`Reject Course Outcome "${outcome.code}" for ${outcome.course}?`)) {
      return;
    }
    this.http.put(`http://localhost:8080/api/course-outcomes/${outcome.id}/reject`, {}).subscribe({
      next: () => {
        this.toast.show(`Course Outcome "${outcome.code}" rejected.`, 'info');
        this.loadOutcomes();
      },
      error: (err) => {
        console.error('Error rejecting outcome:', err);
        this.toast.show('Failed to reject outcome', 'error');
      }
    });
  }

  deleteOutcome(id: number): void {
    if (!confirm('Delete this outcome?')) {
      return;
    }
    this.http.delete(`http://localhost:8080/api/course-outcomes/${id}`).subscribe({
      next: () => {
        this.toast.show('Outcome deleted.', 'info');
        this.loadOutcomes();
      },
      error: () => {
        this.outcomes = this.outcomes.filter(o => o.id !== id);
        this.updatePendingList();
      }
    });
  }

  resetForm(): void {
    this.currentOutcome = this.createEmptyOutcome();
    this.editing = false;
  }
}



