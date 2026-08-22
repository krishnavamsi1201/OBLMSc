import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { MatButtonModule } from '@angular/material/button';
import { ToastService } from '../../shared/services/toast.service';

interface Course {
  id: number;
  code: string;
  title: string;
  faculty: string;
  semester: string;
}

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer, MatButtonModule],
  templateUrl: './courses.html',
  styleUrls: ['./courses.css'],
})
export class Courses {
  private toast = inject(ToastService);
  courses: Course[] = [];

  role: string | null = null;
  showCourseForm = false;
  editingIndex = -1;
  currentCourse: Course = this.createEmptyCourse();

  // Search & Filter
  searchQuery = '';
  selectedSemester = '';

  get semesters(): string[] {
    const sems = new Set(this.courses.map(c => c.semester).filter(Boolean));
    return Array.from(sems).sort();
  }

  get filteredCourses(): Course[] {
    return this.courses.filter(c => {
      const q = this.searchQuery.toLowerCase().trim();
      const matchesSearch = !q || c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || c.faculty.toLowerCase().includes(q);
      const matchesSem = !this.selectedSemester || c.semester === this.selectedSemester;
      return matchesSearch && matchesSem;
    });
  }

  constructor() {
    try {
      this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
    } catch (e) {
      this.role = null;
    }
    this.loadCourses();
  }

  createEmptyCourse(): Course {
    return { id: 0, code: '', title: '', faculty: '', semester: '' };
  }

  loadCourses(): void {
    try {
      const stored = localStorage.getItem('obslmsCourses');
      this.courses = stored ? JSON.parse(stored) as Course[] : [];
    } catch {
      this.courses = [];
    }
  }

  saveCourses(): void {
    try {
      localStorage.setItem('obslmsCourses', JSON.stringify(this.courses));
    } catch {}
  }

  openCourseForm(): void {
    if (this.role !== 'admin' && this.role !== 'faculty') {
      this.toast.error('Only admins and faculty can create courses.');
      return;
    }
    this.showCourseForm = true;
    this.editingIndex = -1;
    this.currentCourse = this.createEmptyCourse();
  }

  saveCourse(): void {
    if (this.role !== 'admin' && this.role !== 'faculty') {
      this.toast.error('Only admins and faculty can save courses.');
      return;
    }
    if (!this.currentCourse.code.trim() || !this.currentCourse.title.trim() || !this.currentCourse.semester.trim()) {
      this.toast.warning('Please fill in the course code, title, and semester.');
      return;
    }

    if (this.editingIndex >= 0) {
      this.courses[this.editingIndex] = { ...this.currentCourse };
      this.toast.success(`Course "${this.currentCourse.code}" updated successfully.`);
    } else {
      const nextId = this.courses.length ? Math.max(...this.courses.map(c => c.id)) + 1 : 1;
      this.courses = [...this.courses, { ...this.currentCourse, id: nextId }];
      this.toast.success(`Course "${this.currentCourse.code}" created successfully.`);
    }

    this.saveCourses();
    this.resetCourseForm();
  }

  editCourse(course: Course, index: number): void {
    if (this.role !== 'admin') {
      this.toast.error('Only admins can edit courses.');
      return;
    }
    this.currentCourse = { ...course };
    this.editingIndex = index;
    this.showCourseForm = true;
  }

  deleteCourse(course: Course): void {
    if (this.role !== 'admin') {
      this.toast.error('Only admins can delete courses.');
      return;
    }
    this.courses = this.courses.filter(c => c.id !== course.id);
    this.saveCourses();
    this.toast.info(`Course "${course.code}" removed.`);
  }

  assignFaculty(course: Course): void {
    if (this.role !== 'admin') {
      this.toast.error('Only admins can assign faculty.');
      return;
    }
    const faculty = prompt('Enter faculty name for this course:', course.faculty || '');
    if (faculty !== null) {
      course.faculty = faculty.trim();
      this.saveCourses();
      this.toast.success(`Faculty assigned to ${course.code}.`);
    }
  }

  resetCourseForm(): void {
    this.showCourseForm = false;
    this.editingIndex = -1;
    this.currentCourse = this.createEmptyCourse();
  }
}



