import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';

interface SubjectRecord {
  id: number;
  code: string;
  name: string;
  credits: number;
  semester: string;
}

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer, MatButtonModule],
  template: `<app-navbar></app-navbar>

<div class="container">

    <app-sidebar></app-sidebar>

    <div class="content">

        <div class="page-header">
            <h1>Subjects</h1>
            <p>Manage subject definitions, credits, and curriculum links for your program.</p>
        </div>

        <div class="subject-actions" *ngIf="role === 'admin'">
            <button mat-raised-button color="primary" (click)="openSubjectForm()">Add Subject</button>
        </div>

        <div class="subject-form-card" *ngIf="showSubjectForm">
            <h2>{{ editingIndex >= 0 ? 'Edit Subject' : 'Add Subject' }}</h2>
            <form (ngSubmit)="saveSubject()" class="subject-form">
                <label>
                    Subject Code
                    <input type="text" [(ngModel)]="currentSubject.code" name="code" required />
                </label>
                <label>
                    Subject Name
                    <input type="text" [(ngModel)]="currentSubject.name" name="name" required />
                </label>
                <label>
                    Credits
                    <input type="number" min="0" [(ngModel)]="currentSubject.credits" name="credits" required />
                </label>
                <label>
                    Semester
                    <input type="text" [(ngModel)]="currentSubject.semester" name="semester" required />
                </label>
                <div class="form-actions">
                    <button mat-raised-button color="primary" type="submit">{{ editingIndex >= 0 ? 'Save Subject' : 'Create Subject' }}</button>
                    <button mat-button type="button" (click)="resetSubjectForm()">Cancel</button>
                </div>
            </form>
        </div>

        <div class="subjects-table-card">
            <table>
                <thead>
                    <tr>
                        <th>Subject Code</th>
                        <th>Subject Name</th>
                        <th>Credits</th>
                        <th>Semester</th>
                        <th *ngIf="role === 'admin'">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngIf="subjects.length === 0">
                        <td [attr.colspan]="role === 'admin' ? 5 : 4">No subjects created yet.</td>
                    </tr>
                    <tr *ngFor="let subject of subjects; index as i">
                        <td>{{ subject.code }}</td>
                        <td>{{ subject.name }}</td>
                        <td>{{ subject.credits }}</td>
                        <td>{{ subject.semester }}</td>
                        <td class="actions-cell" *ngIf="role === 'admin'">
                            <button mat-button color="primary" (click)="editSubject(subject, i)">Edit</button>
                            <button mat-button color="warn" (click)="deleteSubject(subject)">Delete</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

    </div>

</div>

<app-footer></app-footer>`,
  styles: [
    `.page{padding:24px}`,
    `.subject-actions { display: flex; justify-content: flex-end; margin-bottom: 24px; }`,
    `.subject-form-card, .subjects-table-card { background: rgba(255, 255, 255, 0.96); border: 1px solid rgba(174, 202, 241, 0.34); border-radius: 22px; box-shadow: 0 18px 40px rgba(47, 101, 195, 0.10); padding: 24px; margin-bottom:24px; }`,
    `.subjects-table-card table { width: 100%; border-collapse: collapse; }`,
    `.subjects-table-card th, .subjects-table-card td { padding: 16px 12px; text-align: left; border-bottom: 1px solid rgba(72, 101, 145, 0.12); }`,
    `.subjects-table-card th { color: #1f3d7a; font-weight: 700; }`,
    `.subjects-table-card td { color: #455d82; }`,
    `.actions-cell button { margin-right: 8px; }`,
    `.subject-form { display: grid; gap: 20px; max-width: 820px; }`,
    `.subject-form label { display: grid; gap: 6px; font-weight: 600; }`,
    `.subject-form input { padding: 10px 12px; border: 1px solid #d8e3f1; border-radius: 8px; }`,
    `.form-actions { display: flex; gap: 12px; flex-wrap: wrap; }`
  ]
})
export class Subjects {
  role: string | null = null;

  subjects: SubjectRecord[] = [];
  showSubjectForm = false;
  editingIndex = -1;
  currentSubject: SubjectRecord = this.createEmptySubject();

  constructor() {
    try {
      this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
    } catch {
      this.role = null;
    }
    this.loadSubjects();
  }

  createEmptySubject(): SubjectRecord {
    return { id: 0, code: '', name: '', credits: 0, semester: '' };
  }

  loadSubjects(): void {
    try {
      const stored = localStorage.getItem('obslmsSubjects');
      this.subjects = stored ? JSON.parse(stored) as SubjectRecord[] : [];
    } catch {
      this.subjects = [];
    }
  }

  saveSubjects(): void {
    try {
      localStorage.setItem('obslmsSubjects', JSON.stringify(this.subjects));
    } catch {}
  }

  openSubjectForm(): void {
    if (this.role !== 'admin') {
      alert('Only admins can add subjects.');
      return;
    }
    this.showSubjectForm = true;
    this.editingIndex = -1;
    this.currentSubject = this.createEmptySubject();
  }

  saveSubject(): void {
    if (this.role !== 'admin') {
      alert('Only admins can save subjects.');
      return;
    }

    if (!this.currentSubject.code.trim() || !this.currentSubject.name.trim() || !this.currentSubject.semester.trim()) {
      alert('Please fill all required subject fields.');
      return;
    }

    if (this.editingIndex >= 0) {
      this.subjects[this.editingIndex] = { ...this.currentSubject };
    } else {
      const nextId = this.subjects.length ? Math.max(...this.subjects.map(s => s.id)) + 1 : 1;
      this.subjects = [...this.subjects, { ...this.currentSubject, id: nextId }];
    }

    this.saveSubjects();
    this.resetSubjectForm();
  }

  editSubject(subject: SubjectRecord, index: number): void {
    if (this.role !== 'admin') {
      alert('Only admins can edit subjects.');
      return;
    }
    this.currentSubject = { ...subject };
    this.editingIndex = index;
    this.showSubjectForm = true;
  }

  deleteSubject(subject: SubjectRecord): void {
    if (this.role !== 'admin') {
      alert('Only admins can delete subjects.');
      return;
    }
    this.subjects = this.subjects.filter(s => s.id !== subject.id);
    this.saveSubjects();
  }

  resetSubjectForm(): void {
    this.showSubjectForm = false;
    this.editingIndex = -1;
    this.currentSubject = this.createEmptySubject();
  }
}
