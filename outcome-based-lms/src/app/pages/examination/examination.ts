import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../shared/services/toast.service';

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

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {
    try {
      this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
    } catch {
      this.role = null;
    }
  }

  ngOnInit(): void {
    this.loadData();
  }

  createEmptyExam(): ExamSchedule {
    return { id: 0, title: '', course: '', date: '', room: '', status: 'Scheduled', marks: 100 };
  }

  private loadData(): void {
    this.http.get<ExamSchedule[]>('http://localhost:8080/api/exams').subscribe({
      next: (data) => {
        this.examinationItems = data;
        try {
          localStorage.setItem('obslmsExams', JSON.stringify(data));
        } catch {}
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.examinationItems = [];
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private saveExams(): void {}

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

  private toastService = inject(ToastService);

  openExamForm(): void {
    if (this.role !== 'admin' && this.role !== 'faculty') {
      this.toastService.warning('Only admins and faculty can manage examinations.');
      return;
    }
    this.showExamForm = true;
    this.editIndex = -1;
    this.currentExam = this.createEmptyExam();
  }

  saveExam(): void {
    if (!this.currentExam.title || !this.currentExam.course || !this.currentExam.date || !this.currentExam.room) {
      this.toastService.warning('Please fill in all required exam details.');
      return;
    }

    const payload = {
      id: this.currentExam.id > 0 ? this.currentExam.id : null,
      title: this.currentExam.title,
      course: this.currentExam.course,
      date: this.currentExam.date,
      room: this.currentExam.room,
      status: this.currentExam.status,
      marks: this.currentExam.marks
    };

    this.http.post<ExamSchedule>('http://localhost:8080/api/exams', payload).subscribe({
      next: () => {
        this.loadData();
        this.closeExamForm();
        this.toastService.success('Examination schedule saved successfully! 📝');
      },
      error: () => {
        this.toastService.error('Failed to save examination schedule.');
      }
    });
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
    this.http.delete('http://localhost:8080/api/exams/' + exam.id).subscribe({
      next: () => {
        this.loadData();
        this.toastService.info('Examination schedule deleted.');
      },
      error: () => {
        this.toastService.error('Failed to delete examination.');
      }
    });
  }

  closeExamForm(): void {
    this.showExamForm = false;
    this.editIndex = -1;
    this.currentExam = this.createEmptyExam();
  }
}
