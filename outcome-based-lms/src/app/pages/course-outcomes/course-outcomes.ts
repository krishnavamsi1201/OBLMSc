import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { ToastService } from '../../shared/services/toast.service';

interface CourseOutcome {
  id: number;
  course: string;
  co: string;
  description: string;
}

@Component({
  selector: 'app-course-outcomes',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  template: `<app-navbar></app-navbar>

<div class="container">

    <app-sidebar></app-sidebar>

    <div class="content">

        <div class="page-header">
            <h1>🎯 Course Outcomes (CO)</h1>
            <p>Define and manage Course Outcomes (COs) specifying skills and competencies students acquire upon course completion.</p>
        </div>

        <div class="page-actions" *ngIf="role === 'admin' || role === 'faculty'">
            <button type="button" class="primary-button" (click)="toggleForm()">{{ showForm ? 'Hide Form' : '+ Add Course Outcome' }}</button>
        </div>

        <div class="form-card" *ngIf="showForm">
            <h2>{{ editingIndex >= 0 ? 'Edit Course Outcome' : 'Create Course Outcome' }}</h2>
            <form (ngSubmit)="saveOutcome()">
                <label>
                    Course
                    <select [(ngModel)]="currentOutcome.course" name="course" required>
                        <option value="" disabled selected>Select course</option>
                        <option *ngFor="let course of courses" [value]="course">{{ course }}</option>
                    </select>
                </label>
                <label>
                    CO Code (e.g. CO1, CO2)
                    <input type="text" [(ngModel)]="currentOutcome.co" name="co" placeholder="CO1" required />
                </label>
                <label>
                    Outcome Description
                    <textarea rows="4" [(ngModel)]="currentOutcome.description" name="description" placeholder="Students will be able to apply fundamental principles of..." required></textarea>
                </label>
                <div class="form-actions">
                    <button type="submit" class="primary-button">{{ editingIndex >= 0 ? 'Save Changes' : 'Save Outcome' }}</button>
                    <button type="button" class="secondary-button" (click)="resetForm()">Cancel</button>
                </div>
            </form>
        </div>

        <div class="table-card">
            <h2>Course Outcome Directory</h2>
            <table>
                <thead>
                    <tr>
                        <th>Course</th>
                        <th>CO Code</th>
                        <th>Outcome Description</th>
                        <th *ngIf="role === 'admin' || role === 'faculty'">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngIf="courseOutcomes.length === 0">
                        <td [attr.colspan]="(role === 'admin' || role === 'faculty') ? 4 : 3">No course outcomes defined yet.</td>
                    </tr>
                    <tr *ngFor="let outcome of courseOutcomes; index as i">
                        <td><strong>{{ outcome.course }}</strong></td>
                        <td><span class="obe-badge obe-badge-co">{{ outcome.co }}</span></td>
                        <td>{{ outcome.description }}</td>
                        <td class="actions-cell" *ngIf="role === 'admin' || role === 'faculty'">
                            <button type="button" class="small-button" (click)="editOutcome(outcome, i)">Edit</button>
                            <button type="button" class="danger-button" (click)="deleteOutcome(outcome.id)">Delete</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <app-footer></app-footer>
    </div>

</div>`,
  styles: [
    `.page { padding: 24px; }`,
    `.page-actions { margin-bottom: 24px; display: flex; justify-content: flex-end; }`,
    `.form-card, .table-card { background: #fff; border-radius: 18px; padding: 24px; box-shadow: 0 16px 40px rgba(23, 58, 113, 0.08); margin-bottom: 24px; }`,
    `.form-card label, .form-card textarea, .form-card select, .form-card input { width: 100%; display: block; margin-bottom: 16px; font-weight: 600; color: #1e293b; }`,
    `.form-card input, .form-card select, .form-card textarea { padding: 10px 12px; border: 1px solid #d8e3f1; border-radius: 10px; font-size: 14px; margin-top: 6px; }`,
    `.form-actions { display: flex; flex-wrap: wrap; gap: 12px; }`,
    `.primary-button { background: #1565c0; color: #fff; border: none; padding: 10px 22px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s ease; }`,
    `.primary-button:hover { background: #0d47a1; transform: translateY(-1px); }`,
    `.secondary-button { background: #e3eaf7; color: #1d3f76; border: none; padding: 10px 22px; border-radius: 8px; cursor: pointer; font-weight: 600; }`,
    `.danger-button { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; padding: 6px 14px; border-radius: 8px; cursor: pointer; font-weight: 600; }`,
    `.danger-button:hover { background: #fecaca; }`,
    `.table-card table { width: 100%; border-collapse: collapse; }`,
    `.table-card th, .table-card td { padding: 14px 12px; border-bottom: 1px solid #eef2fb; text-align: left; }`,
    `.table-card th { color: #1f3d7a; font-weight: 700; background: #f8fafc; }`,
    `.actions-cell { display: flex; gap: 8px; flex-wrap: wrap; }`,
    `.small-button { background: #e3eaf7; color: #1d3f76; border: none; padding: 6px 14px; border-radius: 8px; cursor: pointer; font-weight: 600; }`,
    `.small-button:hover { background: #d0def2; }`
  ]
})
export class CourseOutcomes {
  private toast = inject(ToastService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  role: string | null = null;
  facultyName = '';
  showForm = false;
  editingIndex = -1;
  courseOutcomes: CourseOutcome[] = [];
  courses: string[] = [];

  currentOutcome: CourseOutcome = this.createEmptyOutcome();

  constructor() {
    this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
    this.facultyName = localStorage.getItem('userName') || '';
    this.loadCourses();
    this.loadOutcomes();
  }

  createEmptyOutcome(): CourseOutcome {
    return { id: 0, course: '', co: '', description: '' };
  }

  loadCourses(): void {
    const facultyParam = (this.role === 'faculty' && this.facultyName) ? encodeURIComponent(this.facultyName) : '';
    const url = facultyParam ? `http://localhost:8080/api/courses?faculty=${facultyParam}` : 'http://localhost:8080/api/courses';

    this.http.get<Array<{ code: string; title: string }>>(url).subscribe({
      next: (courseList) => {
        let list = courseList;
        if (this.role === 'faculty') {
          let assigned: string[] = [];
          try {
            const storedAssigned = localStorage.getItem('userAssignedCourses');
            if (storedAssigned) assigned = JSON.parse(storedAssigned);
          } catch {}
          if (assigned.length > 0) {
            list = courseList.filter(c => 
              assigned.includes(c.title) || assigned.includes(c.code) ||
              assigned.some(a => c.title && c.title.toLowerCase().includes(a.toLowerCase()))
            );
          }
        }
        this.courses = list
          .map(c => `${c.code ? c.code : ''}${c.code && c.title ? ' - ' : ''}${c.title ? c.title : ''}`)
          .filter(Boolean);
        this.cdr.detectChanges();
      },
      error: () => {
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
    });
  }

  loadOutcomes(): void {
    const facultyParam = (this.role === 'faculty' && this.facultyName) ? encodeURIComponent(this.facultyName) : '';
    const url = facultyParam ? `http://localhost:8080/api/copo/co?faculty=${facultyParam}` : 'http://localhost:8080/api/copo/co';

    this.http.get<CourseOutcome[]>(url).subscribe({
      next: (data) => {
        let list = data;
        if (this.role === 'faculty') {
          let assigned: string[] = [];
          try {
            const storedAssigned = localStorage.getItem('userAssignedCourses');
            if (storedAssigned) assigned = JSON.parse(storedAssigned);
          } catch {}
          if (assigned.length > 0) {
            list = data.filter(co => 
              assigned.includes(co.course) ||
              assigned.some(a => (co.course || '').toLowerCase().includes(a.toLowerCase()))
            );
          }
        }
        this.courseOutcomes = list;
        try {
          localStorage.setItem('obslmsCourseOutcomes', JSON.stringify(this.courseOutcomes));
        } catch {}
        this.cdr.detectChanges();
      },
      error: () => {
        try {
          const stored = localStorage.getItem('obslmsCourseOutcomes');
          let list = stored ? JSON.parse(stored) as CourseOutcome[] : [];
          if (this.role === 'faculty') {
            let assigned: string[] = [];
            try {
              const storedAssigned = localStorage.getItem('userAssignedCourses');
              if (storedAssigned) assigned = JSON.parse(storedAssigned);
            } catch {}
            if (assigned.length > 0) {
              list = list.filter(co => 
                assigned.includes(co.course) ||
                assigned.some(a => (co.course || '').toLowerCase().includes(a.toLowerCase()))
              );
            }
          }
          this.courseOutcomes = list;
        } catch {
          this.courseOutcomes = [];
        }
      }
    });
  }

  saveOutcomes(): void {
    try {
      localStorage.setItem('obslmsCourseOutcomes', JSON.stringify(this.courseOutcomes));
    } catch {}
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
    }
  }

  saveOutcome(): void {
    if (!this.currentOutcome.course || !this.currentOutcome.co.trim() || !this.currentOutcome.description.trim()) {
      this.toast.warning('Please fill in all outcome fields.');
      return;
    }

    // Extract raw course code from "CS101 - Database Management Systems"
    const rawCourse = this.currentOutcome.course.split('-')[0].trim();

    const payload = {
      id: this.currentOutcome.id > 0 ? this.currentOutcome.id : null,
      course: rawCourse,
      co: this.currentOutcome.co.trim().toUpperCase(),
      description: this.currentOutcome.description.trim()
    };

    this.http.post<CourseOutcome>('http://localhost:8080/api/copo/co', payload).subscribe({
      next: (saved) => {
        this.toast.success(`Course Outcome ${payload.co} saved successfully.`);
        this.loadOutcomes();
        this.resetForm();
        this.showForm = false;
      },
      error: () => {
        if (this.editingIndex >= 0) {
          this.courseOutcomes[this.editingIndex] = { ...this.currentOutcome, course: rawCourse, co: payload.co };
          this.toast.success(`Course Outcome ${payload.co} updated.`);
        } else {
          const nextId = this.courseOutcomes.length ? Math.max(...this.courseOutcomes.map(o => o.id)) + 1 : 1;
          this.courseOutcomes = [...this.courseOutcomes, { ...this.currentOutcome, id: nextId, course: rawCourse, co: payload.co }];
          this.toast.success(`Course Outcome ${payload.co} created.`);
        }
        this.saveOutcomes();
        this.resetForm();
        this.showForm = false;
        this.cdr.detectChanges();
      }
    });
  }

  editOutcome(outcome: CourseOutcome, index: number): void {
    this.editingIndex = index;
    // Find matching dropdown string
    const match = this.courses.find(c => c.toLowerCase().includes(outcome.course.toLowerCase())) || outcome.course;
    this.currentOutcome = { ...outcome, course: match };
    this.showForm = true;
  }

  deleteOutcome(id: number): void {
    this.http.delete('http://localhost:8080/api/copo/co/' + id).subscribe({
      next: () => {
        this.toast.info('Course Outcome removed.');
        this.loadOutcomes();
      },
      error: () => {
        this.courseOutcomes = this.courseOutcomes.filter(o => o.id !== id);
        this.saveOutcomes();
        this.toast.info('Course Outcome removed.');
        this.cdr.detectChanges();
      }
    });
    if (this.editingIndex >= 0 && this.courseOutcomes[this.editingIndex]?.id !== id) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.editingIndex = -1;
    this.currentOutcome = this.createEmptyOutcome();
  }
}
