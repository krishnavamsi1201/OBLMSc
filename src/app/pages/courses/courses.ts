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

  // Student Syllabus Tracker bindings
  selectedSyllabusCourse: Course | null = null;
  completedUnits: string[] = [];

  constructor() {
    try {
      this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
    } catch (e) {
      this.role = null;
    }
    this.loadCourses();
    this.loadCompletion();
  }

  createEmptyCourse(): Course {
    return { id: 0, code: '', title: '', faculty: '', semester: '' };
  }

  loadCourses(): void {
    try {
      const stored = localStorage.getItem('obslmsCourses');
      this.courses = stored ? JSON.parse(stored) as Course[] : [];
      
      if (this.courses.length === 0) {
        // Seed default courses for demo if empty
        this.courses = [
          { id: 1, code: 'CS101', title: 'Database Management Systems', faculty: 'Dr. Ramesh Babu', semester: 'Fall 2026' },
          { id: 2, code: 'CS202', title: 'Machine Learning', faculty: 'Prof. Anitha Sen', semester: 'Fall 2026' },
          { id: 3, code: 'CS303', title: 'Cloud Computing', faculty: 'Dr. Vikram Seth', semester: 'Fall 2026' }
        ];
        this.saveCourses();
      }
    } catch {
      this.courses = [];
    }
  }

  saveCourses(): void {
    try {
      localStorage.setItem('obslmsCourses', JSON.stringify(this.courses));
    } catch {}
  }

  // Syllabus tracker methods
  loadCompletion(): void {
    try {
      const userName = localStorage.getItem('userName') || 'User';
      const stored = localStorage.getItem(`obslmsSyllabus_${userName}`);
      this.completedUnits = stored ? JSON.parse(stored) : [];
    } catch {
      this.completedUnits = [];
    }
  }

  isCompleted(courseCode: string, co: string): boolean {
    return this.completedUnits.includes(`${courseCode}_${co}`);
  }

  toggleCompletion(courseCode: string, co: string): void {
    const key = `${courseCode}_${co}`;
    const idx = this.completedUnits.indexOf(key);
    if (idx >= 0) {
      this.completedUnits.splice(idx, 1);
    } else {
      this.completedUnits.push(key);
    }
    const userName = localStorage.getItem('userName') || 'User';
    localStorage.setItem(`obslmsSyllabus_${userName}`, JSON.stringify(this.completedUnits));
  }

  getCourseCOs(): any[] {
    return [
      { code: 'CO1', title: 'Recall & Outline Concepts', desc: 'Unit 1: Fundamentals of computational design, terminology, and core frameworks.' },
      { code: 'CO2', title: 'Demonstrate Schema Mapping', desc: 'Unit 2: Entity relationships, relational model mapping, and schema structure design.' },
      { code: 'CO3', title: 'Solve Structured Algorithms', desc: 'Unit 3: Implementation of analysis algorithms, sorting, and complexity calculations.' },
      { code: 'CO4', title: 'Evaluate Infrastructure', desc: 'Unit 4: Platform configurations, load metrics evaluation, and system availability.' },
      { code: 'CO5', title: 'Optimize Containers', desc: 'Unit 5: Orchestration principles, microservices lifecycle, and container scaling.' }
    ];
  }

  trackSyllabus(course: Course): void {
    this.selectedSyllabusCourse = course;
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
