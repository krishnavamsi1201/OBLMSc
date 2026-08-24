import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { HttpClient } from '@angular/common/http';

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

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    try {
      this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
      this.userName = localStorage.getItem('userName') || 'Student';
    } catch {
      this.role = null;
    }
    this.loadAssessments();
    this.loadMarks();
  }

  loadAssessments(): void {
    this.http.get<any[]>('http://localhost:8080/api/obe/assessments').subscribe({
      next: (data) => {
        // Map from backend AssessmentCOMapping to frontend Assessment model
        this.assessments = data.map(item => ({
          id: item.id,
          course: item.courseName || item.courseId,
          type: item.type,
          questions: 5,
          maxMarks: item.maxMarks || 100,
          dueDate: '2026-12-01',
          status: 'Active'
        }));
        this.cdr.detectChanges();
      },
      error: () => {
        this.assessments = [];
      }
    });
  }

  saveAssessments(): void {}

  loadMarks(): void {
    this.http.get<MarkEntry[]>('http://localhost:8080/api/obe/marks').subscribe({
      next: (data) => {
        this.markEntries = data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.markEntries = [];
      }
    });
  }

  saveMarksEntries(): void {}

  saveAssessment() {
    if (!this.currentAssessment.course || !this.currentAssessment.type || this.currentAssessment.questions <= 0 || this.currentAssessment.maxMarks <= 0 || !this.currentAssessment.dueDate) {
      return;
    }

    if (this.role !== 'admin' && this.role !== 'faculty') {
      alert('Only admins and faculty can create assessments.');
      return;
    }

    const payload = {
      id: this.currentAssessment.id > 0 ? this.currentAssessment.id : null,
      name: `${this.currentAssessment.type} - ${this.currentAssessment.course}`,
      type: this.currentAssessment.type,
      courseId: this.currentAssessment.course,
      courseName: this.currentAssessment.course,
      courseOutcomes: 'CO1',
      maxMarks: this.currentAssessment.maxMarks
    };

    this.http.post('http://localhost:8080/api/obe/assessments', payload).subscribe({
      next: () => {
        this.loadAssessments();
        this.resetAssessmentForm();
      },
      error: () => {
        alert('Failed to save assessment.');
      }
    });
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
    const target = this.assessments[index];
    this.http.delete('http://localhost:8080/api/obe/assessments/' + target.id).subscribe({
      next: () => {
        this.loadAssessments();
        this.resetAssessmentForm();
      },
      error: () => {
        alert('Failed to delete assessment.');
      }
    });
  }

  resetAssessmentForm() {
    this.editAssessmentIndex = -1;
    this.currentAssessment = { id: 0, course: '', type: 'Assignment', questions: 0, maxMarks: 0, dueDate: '', status: 'Planned' };
  }

  saveMarks() {
    if (!this.currentMark.student || !this.currentMark.assessment || this.currentMark.obtained < 0 || this.currentMark.maxMarks <= 0) {
      return;
    }

    const payload = {
      id: null,
      student: this.currentMark.student,
      assessment: this.currentMark.assessment,
      obtained: this.currentMark.obtained,
      maxMarks: this.currentMark.maxMarks
    };

    this.http.post('http://localhost:8080/api/obe/marks', payload).subscribe({
      next: () => {
        this.loadMarks();
        this.resetMarksForm();
      },
      error: () => {
        alert('Failed to save mark entry.');
      }
    });
  }

  resetMarksForm() {
    this.currentMark = { id: 0, student: '', assessment: 'Assignment', obtained: 0, maxMarks: 0 };
  }
}



