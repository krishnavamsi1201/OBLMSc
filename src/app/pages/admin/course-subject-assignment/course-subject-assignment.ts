import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../../shared/navbar/navbar';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { Footer } from '../../../shared/footer/footer';

interface CourseSubject {
  id: string;
  courseId: string;
  courseName: string;
  subjectId: string;
  subjectName: string;
  credits: number;
}

interface Course {
  id: string;
  name: string;
  code: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
}

@Component({
  selector: 'app-course-subject-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  templateUrl: './course-subject-assignment.html',
  styleUrls: ['./course-subject-assignment.css'],
})
export class CourseSubjectAssignment implements OnInit {
  courseSubjectList: CourseSubject[] = [];
  filteredCourseSubjectList: CourseSubject[] = [];
  
  courseList: Course[] = [];
  subjectList: Subject[] = [];
  
  // Form fields
  showForm = false;
  isEditMode = false;
  currentId: string | null = null;
  
  // Form data
  formData = {
    courseId: '',
    subjectId: '',
    credits: 3
  };

  // Filter and search
  searchQuery = '';
  filterCourse = '';

  ngOnInit(): void {
    this.loadCourses();
    this.loadSubjects();
    this.loadCourseSubjects();
  }

  private loadCourses(): void {
    try {
      const stored = localStorage.getItem('obslmsCourses');
      this.courseList = stored ? JSON.parse(stored) : [];
    } catch {
      this.courseList = [];
    }
  }

  private loadSubjects(): void {
    try {
      const stored = localStorage.getItem('obslmsSubjects');
      this.subjectList = stored ? JSON.parse(stored) : [];
    } catch {
      this.subjectList = [];
    }
  }

  private loadCourseSubjects(): void {
    try {
      const stored = localStorage.getItem('obslmsCourseSubjects');
      this.courseSubjectList = stored ? JSON.parse(stored) : [];
      this.filterCourseSubjects();
    } catch {
      this.courseSubjectList = [];
    }
  }

  private filterCourseSubjects(): void {
    this.filteredCourseSubjectList = this.courseSubjectList.filter(cs => {
      const matchSearch = cs.courseName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                         cs.subjectName.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchCourse = this.filterCourse === '' || cs.courseId === this.filterCourse;
      return matchSearch && matchCourse;
    });
  }

  onSearchChange(): void {
    this.filterCourseSubjects();
  }

  onFilterChange(): void {
    this.filterCourseSubjects();
  }

  openAddForm(): void {
    this.showForm = true;
    this.isEditMode = false;
    this.resetForm();
  }

  openEditForm(cs: CourseSubject): void {
    this.showForm = true;
    this.isEditMode = true;
    this.currentId = cs.id;
    this.formData = {
      courseId: cs.courseId,
      subjectId: cs.subjectId,
      credits: cs.credits
    };
  }

  closeForm(): void {
    this.showForm = false;
    this.resetForm();
  }

  private resetForm(): void {
    this.formData = {
      courseId: '',
      subjectId: '',
      credits: 3
    };
    this.currentId = null;
  }

  saveAssignment(): void {
    if (!this.validateForm()) {
      alert('Please select both course and subject');
      return;
    }

    // Check if this course-subject combo already exists (when adding new)
    if (!this.isEditMode) {
      const exists = this.courseSubjectList.some(
        cs => cs.courseId === this.formData.courseId && cs.subjectId === this.formData.subjectId
      );
      if (exists) {
        alert('This subject is already assigned to this course!');
        return;
      }
    }

    const course = this.courseList.find(c => c.id === this.formData.courseId);
    const subject = this.subjectList.find(s => s.id === this.formData.subjectId);

    if (!course || !subject) {
      alert('Invalid course or subject selection');
      return;
    }

    if (this.isEditMode && this.currentId) {
      // Update existing assignment
      const index = this.courseSubjectList.findIndex(cs => cs.id === this.currentId);
      if (index !== -1) {
        this.courseSubjectList[index] = {
          id: this.currentId,
          courseId: course.id,
          courseName: course.name,
          subjectId: subject.id,
          subjectName: subject.name,
          credits: this.formData.credits
        };
      }
    } else {
      // Add new assignment
      const newAssignment: CourseSubject = {
        id: this.generateId(),
        courseId: course.id,
        courseName: course.name,
        subjectId: subject.id,
        subjectName: subject.name,
        credits: this.formData.credits
      };
      this.courseSubjectList.push(newAssignment);
    }

    this.saveCourseSubjectsToStorage();
    this.closeForm();
  }

  deleteAssignment(id: string): void {
    if (confirm('Are you sure you want to unassign this subject from the course?')) {
      this.courseSubjectList = this.courseSubjectList.filter(cs => cs.id !== id);
      this.saveCourseSubjectsToStorage();
    }
  }

  private validateForm(): boolean {
    return !!(this.formData.courseId && this.formData.subjectId);
  }

  private saveCourseSubjectsToStorage(): void {
    try {
      localStorage.setItem('obslmsCourseSubjects', JSON.stringify(this.courseSubjectList));
      this.filterCourseSubjects();
    } catch {
      alert('Error saving assignment data');
    }
  }

  private generateId(): string {
    return 'CSA-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }

  getSubjectsByCourseName(courseName: string): string {
    const subjects = this.courseSubjectList
      .filter(cs => cs.courseName === courseName)
      .map(cs => cs.subjectName);
    return subjects.length > 0 ? subjects.join(', ') : 'No subjects assigned';
  }
}
