import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
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
  status: 'Active' | 'Review';
}

@Component({
  selector: 'app-outcomes',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer, MatFormFieldModule, MatInputModule, MatButtonModule, MatSelectModule],
  templateUrl: './outcomes.html',
  styleUrls: ['./outcomes.css'],
})
export class Outcomes {
  role: string | null = null;
  showList = true;
  outcomes: Outcome[] = [];

  courses: string[] = [];
  bloomLevels = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];

  currentOutcome: Outcome = this.createEmptyOutcome();
  editing = false;

  constructor() {
    this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
    this.loadCourses();
    this.loadOutcomes();
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
      const stored = localStorage.getItem('obslmsOutcomes');
      this.outcomes = stored ? JSON.parse(stored) as Outcome[] : [];
    } catch {
      this.outcomes = [];
    }
  }

  saveOutcomes(): void {
    try {
      localStorage.setItem('obslmsOutcomes', JSON.stringify(this.outcomes));
    } catch {}
  }

  get activeCount(): number {
    return this.outcomes.filter(o => o.status === 'Active').length;
  }

  get reviewCount(): number {
    return this.outcomes.filter(o => o.status === 'Review').length;
  }

  createEmptyOutcome(): Outcome {
    return {
      id: 0,
      type: 'CO',
      code: '',
      description: '',
      bloomsLevel: 'Apply',
      course: '',
      status: 'Active'
    };
  }

  toggleList(): void {
    this.showList = !this.showList;
  }

  startAdd(type: 'CO' | 'PO'): void {
    this.editing = false;
    this.loadCourses();
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

    if (this.editing) {
      const index = this.outcomes.findIndex(o => o.id === this.currentOutcome.id);
      if (index !== -1) {
        this.outcomes[index] = { ...this.currentOutcome };
      }
    } else {
      const nextId = this.outcomes.length ? Math.max(...this.outcomes.map(o => o.id)) + 1 : 1;
      const nextCodeIndex = this.outcomes.filter(o => o.type === this.currentOutcome.type).length + 1;
      this.currentOutcome.code = `${this.currentOutcome.type}${nextCodeIndex}`;
      this.outcomes.push({ ...this.currentOutcome, id: nextId });
    }

    this.saveOutcomes();
    this.currentOutcome = this.createEmptyOutcome();
    this.editing = false;
  }

  deleteOutcome(id: number): void {
    if (!confirm('Delete this outcome?')) {
      return;
    }
    this.outcomes = this.outcomes.filter(o => o.id !== id);
    this.saveOutcomes();
  }

  resetForm(): void {
    this.currentOutcome = this.createEmptyOutcome();
    this.editing = false;
  }
}



