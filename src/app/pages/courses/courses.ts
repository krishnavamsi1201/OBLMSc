import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { MatButtonModule } from '@angular/material/button';

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
  courses: Course[] = [];

  role: string | null = null;
  showCourseForm = false;
  editingIndex = -1;
  currentCourse: Course = this.createEmptyCourse();

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
      alert('Only admins and faculty can create courses.');
      return;
    }
    this.showCourseForm = true;
    this.editingIndex = -1;
    this.currentCourse = this.createEmptyCourse();
  }

  saveCourse(): void {
    if (this.role !== 'admin' && this.role !== 'faculty') {
      alert('Only admins and faculty can save courses.');
      return;
    }
    if (!this.currentCourse.code.trim() || !this.currentCourse.title.trim() || !this.currentCourse.semester.trim()) {
      alert('Please fill in the course code, title, and semester.');
      return;
    }

    if (this.editingIndex >= 0) {
      this.courses[this.editingIndex] = { ...this.currentCourse };
    } else {
      const nextId = this.courses.length ? Math.max(...this.courses.map(c => c.id)) + 1 : 1;
      this.courses = [...this.courses, { ...this.currentCourse, id: nextId }];
    }

    this.saveCourses();
    this.resetCourseForm();
  }

  editCourse(course: Course, index: number): void {
    if (this.role !== 'admin') {
      alert('Only admins can edit courses.');
      return;
    }
    this.currentCourse = { ...course };
    this.editingIndex = index;
    this.showCourseForm = true;
  }

  deleteCourse(course: Course): void {
    if (this.role !== 'admin') {
      alert('Only admins can delete courses.');
      return;
    }
    this.courses = this.courses.filter(c => c.id !== course.id);
    this.saveCourses();
  }

  assignFaculty(course: Course): void {
    if (this.role !== 'admin') {
      alert('Only admins can assign faculty.');
      return;
    }
    const faculty = prompt('Enter faculty name for this course:', course.faculty || '');
    if (faculty !== null) {
      course.faculty = faculty.trim();
      this.saveCourses();
    }
  }

  resetCourseForm(): void {
    this.showCourseForm = false;
    this.editingIndex = -1;
    this.currentCourse = this.createEmptyCourse();
  }
}



