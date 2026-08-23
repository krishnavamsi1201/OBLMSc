import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';

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

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {
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
    console.log("Calling loadCourses API...");
    this.http.get<Course[]>('http://localhost:8080/api/courses').subscribe({
      next: (data) => {
        console.log("Fetched courses successfully:", data);
        this.courses = data;
        try {
          localStorage.setItem('obslmsCourses', JSON.stringify(data));
        } catch {}
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Failed to fetch courses:", err);
        this.courses = [];
        this.cdr.detectChanges();
      }
    });
  }

  saveCourses(): void {}

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

    const payload = {
      id: this.currentCourse.id > 0 ? this.currentCourse.id : null,
      code: this.currentCourse.code,
      title: this.currentCourse.title,
      faculty: this.currentCourse.faculty,
      semester: this.currentCourse.semester
    };

    this.http.post<Course>('http://localhost:8080/api/courses', payload).subscribe({
      next: () => {
        this.loadCourses();
        this.resetCourseForm();
      },
      error: () => {
        alert('Failed to save course.');
      }
    });
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
    this.http.delete('http://localhost:8080/api/courses/' + course.id).subscribe({
      next: () => {
        this.loadCourses();
      },
      error: () => {
        alert('Failed to delete course.');
      }
    });
  }

  assignFaculty(course: Course): void {
    if (this.role !== 'admin') {
      alert('Only admins can assign faculty.');
      return;
    }
    const faculty = prompt('Enter faculty name for this course:', course.faculty || '');
    if (faculty !== null) {
      course.faculty = faculty.trim();
      this.http.post<Course>('http://localhost:8080/api/courses', course).subscribe({
        next: () => {
          this.loadCourses();
        },
        error: () => {
          alert('Failed to assign faculty.');
        }
      });
    }
  }

  resetCourseForm(): void {
    this.showCourseForm = false;
    this.editingIndex = -1;
    this.currentCourse = this.createEmptyCourse();
  }
}
