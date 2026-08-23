import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';

interface Assessment {
  id: number;
  course: string;
  type: string;
  questions: number;
  maxMarks: number;
  dueDate: string;
  status: string;
}

interface MarkEntry {
  id: number;
  student: string;
  assessment: string;
  obtained: number;
  maxMarks: number;
}

@Component({
  selector: 'app-assessments',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  templateUrl: './assessments.html',
  styleUrls: ['./assessments.css'],
})
export class Assessments {
  Math = Math;
  assessmentTypes = ['Assignment', 'Quiz', 'Mid Exam', 'Final Exam'];

  role: string | null = null;
  userName = 'Student';

  assessments: Assessment[] = [];
  markEntries: MarkEntry[] = [];

  // Search & Filters
  searchAssessment = '';
  typeFilter = '';
  searchMarks = '';

  currentAssessment: Assessment = { id: 0, course: '', type: 'Assignment', questions: 0, maxMarks: 0, dueDate: '', status: 'Planned' };
  currentMark: MarkEntry = { id: 0, student: '', assessment: 'Assignment', obtained: 0, maxMarks: 0 };
  editAssessmentIndex = -1;

  get filteredAssessments(): Assessment[] {
    let list = this.assessments;
    if (this.typeFilter) {
      list = list.filter(a => a.type === this.typeFilter);
    }
    if (this.searchAssessment.trim()) {
      const q = this.searchAssessment.toLowerCase();
      list = list.filter(a => 
        a.course.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) ||
        a.status.toLowerCase().includes(q)
      );
    }
    return list;
  }

  get filteredMarkEntries(): MarkEntry[] {
    let list = this.markEntries;
    if (this.role === 'student') {
      const uname = (this.userName || localStorage.getItem('userName') || 'Student').toLowerCase();
      list = list.filter(m => 
        m.student.toLowerCase() === uname ||
        m.student.toLowerCase() === 'student' ||
        m.student.toLowerCase() === 'raj kumar'
      );
    }
    if (!this.searchMarks.trim()) return list;
    const q = this.searchMarks.toLowerCase();
    return list.filter(m => 
      m.student.toLowerCase().includes(q) ||
      m.assessment.toLowerCase().includes(q)
    );
  }

  constructor() {
    this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
    this.userName = localStorage.getItem('userName') || 'Student';
    this.loadAssessments();
    this.loadMarks();
  }

  loadAssessments(): void {
    try {
      const stored = localStorage.getItem('obslmsAssessments');
      this.assessments = stored ? JSON.parse(stored) as Assessment[] : [];
    } catch {
      this.assessments = [];
    }
  }

  saveAssessments(): void {
    try {
      localStorage.setItem('obslmsAssessments', JSON.stringify(this.assessments));
    } catch {}
  }

  loadMarks(): void {
    try {
      const stored = localStorage.getItem('obslmsMarkEntries');
      this.markEntries = stored ? JSON.parse(stored) as MarkEntry[] : [];
    } catch {
      this.markEntries = [];
    }
  }

  saveMarksEntries(): void {
    try {
      localStorage.setItem('obslmsMarkEntries', JSON.stringify(this.markEntries));
    } catch {}
  }

  saveAssessment() {
    if (!this.currentAssessment.course || !this.currentAssessment.type || this.currentAssessment.questions <= 0 || this.currentAssessment.maxMarks <= 0 || !this.currentAssessment.dueDate) {
      return;
    }

    if (this.role !== 'admin' && this.role !== 'faculty') {
      alert('Only admins and faculty can create assessments.');
      return;
    }

    if (this.editAssessmentIndex >= 0) {
      this.assessments[this.editAssessmentIndex] = { ...this.currentAssessment, id: this.assessments[this.editAssessmentIndex].id };
    } else {
      this.assessments = [...this.assessments, { ...this.currentAssessment, id: Date.now() }];
    }

    this.saveAssessments();
    this.resetAssessmentForm();
  }

  editAssessment(index: number) {
    this.editAssessmentIndex = index;
    this.currentAssessment = { ...this.assessments[index] };
  }

  deleteAssessment(index: number) {
    if (this.role !== 'admin' && this.role !== 'faculty') {
      alert('Only admins and faculty can delete assessments.');
      return;
    }
    this.assessments.splice(index, 1);
    this.saveAssessments();
    this.resetAssessmentForm();
  }

  resetAssessmentForm() {
    this.editAssessmentIndex = -1;
    this.currentAssessment = { id: 0, course: '', type: 'Assignment', questions: 0, maxMarks: 0, dueDate: '', status: 'Planned' };
  }

  saveMarks() {
    if (!this.currentMark.student || !this.currentMark.assessment || this.currentMark.obtained < 0 || this.currentMark.maxMarks <= 0) {
      return;
    }

    this.markEntries = [...this.markEntries, { ...this.currentMark, id: Date.now() }];
    this.saveMarksEntries();
    this.resetMarksForm();
  }

  resetMarksForm() {
    this.currentMark = { id: 0, student: '', assessment: 'Assignment', obtained: 0, maxMarks: 0 };
  }
}



