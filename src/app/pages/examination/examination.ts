import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';

interface ExamSchedule {
  id: number;
  title: string;
  course: string;
  date: string;
  room: string;
  status: 'Scheduled' | 'Ongoing' | 'Completed';
  marks: number;
}

@Component({
  selector: 'app-examination',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, Navbar, Sidebar, Footer],
  templateUrl: './examination.html',
  styleUrls: ['./examination.css'],
})
export class Examination implements OnInit {
  role: string | null = null;
  examinationItems: ExamSchedule[] = [];
  filteredExams: ExamSchedule[] = [];
  isLoading = true;

  // Form bindings
  currentExam: ExamSchedule = this.createEmptyExam();
  editIndex = -1;
  showExamForm = false;

  // Filters
  searchTerm = '';
  statusFilter = '';

  constructor() {
    try {
      this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
    } catch {
      this.role = null;
    }
  }

  ngOnInit(): void {
    this.loadData();
    this.applyFilters();
  }

  createEmptyExam(): ExamSchedule {
    return { id: 0, title: '', course: '', date: '', room: '', status: 'Scheduled', marks: 100 };
  }

  private loadData(): void {
    try {
      const stored = localStorage.getItem('obslmsExams');
      this.examinationItems = stored ? JSON.parse(stored) as ExamSchedule[] : [];
    } catch {
      this.examinationItems = [];
    }
    this.isLoading = false;
  }

  private saveExams(): void {
    try {
      localStorage.setItem('obslmsExams', JSON.stringify(this.examinationItems));
    } catch {}
  }

  applyFilters(): void {
    let results = this.examinationItems;

    if (this.statusFilter) {
      results = results.filter(e => e.status === this.statusFilter);
    }

    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      results = results.filter(e => 
        e.title.toLowerCase().includes(q) || 
        e.course.toLowerCase().includes(q) ||
        e.room.toLowerCase().includes(q)
      );
    }

    this.filteredExams = results;
  }

  openExamForm(): void {
    if (this.role !== 'admin' && this.role !== 'faculty') {
      alert('Only admins and faculty can manage examinations.');
      return;
    }
    this.showExamForm = true;
    this.editIndex = -1;
    this.currentExam = this.createEmptyExam();
  }

  saveExam(): void {
    if (!this.currentExam.title || !this.currentExam.course || !this.currentExam.date || !this.currentExam.room) {
      alert('Please fill all required exam details.');
      return;
    }

    if (this.editIndex >= 0) {
      const targetId = this.examinationItems[this.editIndex].id;
      this.examinationItems[this.editIndex] = { ...this.currentExam, id: targetId };
    } else {
      const nextId = this.examinationItems.length ? Math.max(...this.examinationItems.map(e => e.id)) + 1 : 1;
      this.examinationItems = [...this.examinationItems, { ...this.currentExam, id: nextId }];
    }

    this.saveExams();
    this.closeExamForm();
    this.applyFilters();
  }

  editExam(exam: ExamSchedule): void {
    const idx = this.examinationItems.findIndex(e => e.id === exam.id);
    if (idx >= 0) {
      this.editIndex = idx;
      this.currentExam = { ...exam };
      this.showExamForm = true;
    }
  }

  deleteExam(exam: ExamSchedule): void {
    if (confirm('Are you sure you want to delete this examination?')) {
      this.examinationItems = this.examinationItems.filter(e => e.id !== exam.id);
      this.saveExams();
      this.applyFilters();
    }
  }

  closeExamForm(): void {
    this.showExamForm = false;
    this.editIndex = -1;
    this.currentExam = this.createEmptyExam();
  }
}
