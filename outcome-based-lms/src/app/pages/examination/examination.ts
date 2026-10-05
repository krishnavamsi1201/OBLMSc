import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../shared/services/toast.service';
import { NavigationService } from '../../shared/services/navigation.service';

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
  private navService = inject(NavigationService);

  goBack(): void {
    if (this.showExamForm) {
      this.closeExamForm();
      return;
    }
    this.navService.goBack();
  }

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

  formatForDateTimeLocal(dateStr: string): string {
    if (!dateStr) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T09:00`;
    }
    const trimmed = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return `${trimmed}T09:00`;
    }
    if (trimmed.includes('T')) {
      return trimmed.substring(0, 16);
    }
    if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(trimmed)) {
      return trimmed.replace(' ', 'T').substring(0, 16);
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    return trimmed;
  }

  private toastService = inject(ToastService);

  openExamForm(): void {
    if (this.role !== 'admin' && this.role !== 'faculty') {
      this.toastService.warning('Only admins and faculty can manage examinations.');
      return;
    }
    this.editIndex = -1;
    this.currentExam = this.createEmptyExam();
    this.currentExam.date = this.formatForDateTimeLocal('');
    this.showExamForm = true;
    this.cdr.detectChanges();
  }

  saveExam(): void {
    if (!this.currentExam.title?.trim() || !this.currentExam.course?.trim() || !this.currentExam.date || !this.currentExam.room?.trim()) {
      this.toastService.warning('Please fill in all required exam details.');
      return;
    }

    const payload = {
      id: this.currentExam.id && Number(this.currentExam.id) > 0 ? Number(this.currentExam.id) : null,
      title: this.currentExam.title.trim(),
      course: this.currentExam.course.trim(),
      date: this.currentExam.date,
      room: this.currentExam.room.trim(),
      status: this.currentExam.status,
      marks: Number(this.currentExam.marks) || 100
    };

    this.http.post<ExamSchedule>('http://localhost:8080/api/exams', payload).subscribe({
      next: () => {
        this.loadData();
        this.closeExamForm();
        this.toastService.success(this.editIndex >= 0 ? 'Examination schedule updated successfully! 📝' : 'Examination scheduled successfully! 🎉');
      },
      error: () => {
        // Fallback for offline / local updates
        if (this.editIndex >= 0 && this.currentExam.id) {
          const idx = this.examinationItems.findIndex(e => String(e.id) === String(this.currentExam.id));
          if (idx >= 0) {
            this.examinationItems[idx] = { ...this.currentExam };
            this.applyFilters();
          }
        } else {
          this.examinationItems.unshift({ ...this.currentExam, id: Date.now() });
          this.applyFilters();
        }
        try {
          localStorage.setItem('obslmsExams', JSON.stringify(this.examinationItems));
        } catch {}
        this.closeExamForm();
        this.toastService.success('Examination schedule saved locally! 📝');
        this.cdr.detectChanges();
      }
    });
  }

  editExam(exam: ExamSchedule): void {
    if (this.role !== 'admin' && this.role !== 'faculty') {
      this.toastService.warning('Only admins and faculty can edit examinations.');
      return;
    }
    const idx = this.examinationItems.findIndex(e => String(e.id) === String(exam.id));
    this.editIndex = idx >= 0 ? idx : 0;
    this.currentExam = {
      id: exam.id,
      title: exam.title || '',
      course: exam.course || '',
      date: this.formatForDateTimeLocal(exam.date),
      room: exam.room || '',
      status: exam.status || 'Scheduled',
      marks: exam.marks || 100
    };
    this.showExamForm = true;
    this.cdr.detectChanges();
  }

  deleteExam(exam: ExamSchedule): void {
    if (this.role !== 'admin' && this.role !== 'faculty') {
      this.toastService.warning('Only admins and faculty can delete examinations.');
      return;
    }
    if (!confirm(`Are you sure you want to delete the examination schedule for "${exam.title}"?`)) {
      return;
    }
    this.http.delete('http://localhost:8080/api/exams/' + exam.id).subscribe({
      next: () => {
        this.examinationItems = this.examinationItems.filter(e => String(e.id) !== String(exam.id));
        this.applyFilters();
        this.toastService.info('Examination schedule deleted.');
        this.cdr.detectChanges();
      },
      error: () => {
        this.examinationItems = this.examinationItems.filter(e => String(e.id) !== String(exam.id));
        this.applyFilters();
        try {
          localStorage.setItem('obslmsExams', JSON.stringify(this.examinationItems));
        } catch {}
        this.toastService.info('Examination schedule deleted locally.');
        this.cdr.detectChanges();
      }
    });
  }

  closeExamForm(): void {
    this.showExamForm = false;
    this.editIndex = -1;
    this.currentExam = this.createEmptyExam();
    this.cdr.detectChanges();
  }

  onBackdropClick(event: MouseEvent): void {
    this.closeExamForm();
  }
}
