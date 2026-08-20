import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';

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
            <h1>Course Outcomes (CO)</h1>
            <p>Define and manage course outcomes to align teaching and assessment.</p>
        </div>

        <div class="page-actions" *ngIf="role === 'admin'">
            <button type="button" class="primary-button" (click)="toggleForm()">{{ showForm ? 'Hide Form' : 'Add Course Outcome' }}</button>
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
                    CO Code
                    <input type="text" [(ngModel)]="currentOutcome.co" name="co" required />
                </label>
                <label>
                    Description
                    <textarea rows="4" [(ngModel)]="currentOutcome.description" name="description" required></textarea>
                </label>
                <div class="form-actions">
                    <button type="submit" class="primary-button">{{ editingIndex >= 0 ? 'Save Changes' : 'Save Outcome' }}</button>
                    <button type="button" class="secondary-button" (click)="resetForm()">Cancel</button>
                </div>
            </form>
        </div>

        <div class="table-card">
            <h2>Course Outcome List</h2>
            <table>
                <thead>
                    <tr>
                        <th>Course</th>
                        <th>CO</th>
                        <th>Description</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngIf="courseOutcomes.length === 0">
                        <td colspan="4">No course outcomes defined yet. Create a new outcome to get started.</td>
                    </tr>
                    <tr *ngFor="let outcome of courseOutcomes; index as i">
                        <td>{{ outcome.course }}</td>
                        <td>{{ outcome.co }}</td>
                        <td>{{ outcome.description }}</td>
                        <td class="actions-cell">
                            <button type="button" class="small-button" (click)="editOutcome(outcome, i)">Edit</button>
                            <button type="button" class="danger-button" (click)="deleteOutcome(outcome.id)">Delete</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

    </div>

</div>

<app-footer></app-footer>`,
  styles: [
    `.page { padding: 24px; }`,
    `.page-actions { margin-bottom: 24px; display: flex; justify-content: flex-end; }`,
    `.form-card, .table-card { background: #fff; border-radius: 18px; padding: 24px; box-shadow: 0 16px 40px rgba(23, 58, 113, 0.08); margin-bottom: 24px; }`,
    `.form-card label, .form-card textarea, .form-card select, .form-card input { width: 100%; display: block; margin-bottom: 16px; }`,
    `.form-card input, .form-card select, .form-card textarea { padding: 10px 12px; border: 1px solid #d8e3f1; border-radius: 10px; font-size: 14px; }`,
    `.form-actions { display: flex; flex-wrap: wrap; gap: 12px; }`,
    `.primary-button { background: #1565c0; color: #fff; border: none; padding: 12px 24px; border-radius: 999px; cursor: pointer; }`,
    `.secondary-button { background: #e3eaf7; color: #1d3f76; border: none; padding: 12px 24px; border-radius: 999px; cursor: pointer; }`,
    `.danger-button { background: #d32f2f; color: #fff; border: none; padding: 10px 16px; border-radius: 10px; cursor: pointer; }`,
    `.table-card table { width: 100%; border-collapse: collapse; }`,
    `.table-card th, .table-card td { padding: 16px 12px; border-bottom: 1px solid #eef2fb; text-align: left; }`,
    `.actions-cell { display: flex; gap: 8px; flex-wrap: wrap; }`,
    `.small-button { background: #e3eaf7; color: #1d3f76; border: none; padding: 8px 16px; border-radius: 10px; cursor: pointer; }`
  ]
})
export class CourseOutcomes {
  role: string | null = null;
  showForm = false;
  editingIndex = -1;
  courseOutcomes: CourseOutcome[] = [];
  courses: string[] = [];

  currentOutcome: CourseOutcome = this.createEmptyOutcome();

  constructor() {
    this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
    this.loadCourses();
    this.loadOutcomes();
  }

  createEmptyOutcome(): CourseOutcome {
    return { id: 0, course: '', co: '', description: '' };
  }

  loadCourses(): void {
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
    try {
      const stored = localStorage.getItem('obslmsCourseOutcomes');
      this.courseOutcomes = stored ? JSON.parse(stored) as CourseOutcome[] : [];
    } catch {
      this.courseOutcomes = [];
    }
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
      alert('Please fill all fields.');
      return;
    }

    if (this.editingIndex >= 0) {
      this.courseOutcomes[this.editingIndex] = { ...this.currentOutcome };
    } else {
      const nextId = this.courseOutcomes.length ? Math.max(...this.courseOutcomes.map(o => o.id)) + 1 : 1;
      this.courseOutcomes = [...this.courseOutcomes, { ...this.currentOutcome, id: nextId }];
    }

    this.saveOutcomes();
    this.resetForm();
    this.showForm = false;
  }

  editOutcome(outcome: CourseOutcome, index: number): void {
    this.editingIndex = index;
    this.currentOutcome = { ...outcome };
    this.showForm = true;
  }

  deleteOutcome(id: number): void {
    this.courseOutcomes = this.courseOutcomes.filter(outcome => outcome.id !== id);
    this.saveOutcomes();
    if (this.editingIndex >= 0 && this.courseOutcomes[this.editingIndex]?.id !== id) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.editingIndex = -1;
    this.currentOutcome = this.createEmptyOutcome();
  }
}
