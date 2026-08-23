import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../../shared/navbar/navbar';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { Footer } from '../../../shared/footer/footer';
import { ToastService } from '../../../shared/services/toast.service';

interface FacultyAllocation {
  id: string;
  facultyId: string;
  facultyName: string;
  courseId: string;
  courseName: string;
  subjectId: string;
  subjectName: string;
  semester: string;
}

interface Faculty {
  id: string;
  name: string;
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
}

interface CourseSubject {
  id: string;
  courseId: string;
  courseName: string;
  subjectId: string;
  subjectName: string;
}

@Component({
  selector: 'app-faculty-course-allocation',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  templateUrl: './faculty-course-allocation.html',
  styleUrls: ['./faculty-course-allocation.css'],
})
export class FacultyCourseAllocation implements OnInit {
  private toast = inject(ToastService);
  allocationList: FacultyAllocation[] = [];
  filteredAllocationList: FacultyAllocation[] = [];
  
  facultyList: Faculty[] = [];
  courseList: Course[] = [];
  courseSubjectList: CourseSubject[] = [];
  
  // Filtered subjects based on selected course
  availableSubjects: CourseSubject[] = [];
  
  // Form fields
  showForm = false;
  isEditMode = false;
  currentId: string | null = null;
  
  // Form data
  formData = {
    facultyId: '',
    courseId: '',
    subjectId: '',
    semester: 'Semester 1'
  };

  // Filter and search
  searchQuery = '';
  filterCourse = '';
  filterFaculty = '';

  semesters = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 
               'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'];

  ngOnInit(): void {
    this.loadFaculty();
    this.loadCourses();
    this.loadCourseSubjects();
    this.loadAllocations();
  }

  private loadFaculty(): void {
    try {
      const stored = localStorage.getItem('obslmsFaculty');
      this.facultyList = stored ? JSON.parse(stored) : [];
    } catch {
      this.facultyList = [];
    }
  }

  private loadCourses(): void {
    try {
      const stored = localStorage.getItem('obslmsCourses');
      const courses = stored ? JSON.parse(stored) : [];
      this.courseList = courses.map((c: any) => ({
        id: (c.id || '').toString(),
        name: c.title || c.name || c.code || 'Course',
        code: c.code || ''
      }));
    } catch {
      this.courseList = [];
    }
  }

  private loadCourseSubjects(): void {
    try {
      const stored = localStorage.getItem('obslmsCourseSubjects');
      this.courseSubjectList = stored ? JSON.parse(stored) : [];
    } catch {
      this.courseSubjectList = [];
    }
  }

  private loadAllocations(): void {
    try {
      const stored = localStorage.getItem('obslmsFacultyAllocations');
      this.allocationList = stored ? JSON.parse(stored) : [];
      this.filterAllocations();
    } catch {
      this.allocationList = [];
    }
  }

  private filterAllocations(): void {
    this.filteredAllocationList = this.allocationList.filter(a => {
      const matchSearch = a.facultyName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                         a.courseName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                         a.subjectName.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchCourse = this.filterCourse === '' || a.courseId === this.filterCourse;
      const matchFaculty = this.filterFaculty === '' || a.facultyId === this.filterFaculty;
      return matchSearch && matchCourse && matchFaculty;
    });
  }

  onCourseChange(): void {
    if (this.formData.courseId) {
      this.availableSubjects = this.courseSubjectList.filter(
        cs => cs.courseId === this.formData.courseId
      );
      this.formData.subjectId = ''; // Reset subject selection
    } else {
      this.availableSubjects = [];
    }
  }

  onSearchChange(): void {
    this.filterAllocations();
  }

  onFilterChange(): void {
    this.filterAllocations();
  }

  openAddForm(): void {
    this.showForm = true;
    this.isEditMode = false;
    this.resetForm();
    this.availableSubjects = [];
  }

  openEditForm(allocation: FacultyAllocation): void {
    this.showForm = true;
    this.isEditMode = true;
    this.currentId = allocation.id;
    this.formData = {
      facultyId: allocation.facultyId,
      courseId: allocation.courseId,
      subjectId: allocation.subjectId,
      semester: allocation.semester
    };
    this.onCourseChange(); // Load subjects for selected course
  }

  closeForm(): void {
    this.showForm = false;
    this.resetForm();
  }

  private resetForm(): void {
    this.formData = {
      facultyId: '',
      courseId: '',
      subjectId: '',
      semester: 'Semester 1'
    };
    this.currentId = null;
    this.availableSubjects = [];
  }

  saveAllocation(): void {
    if (!this.validateForm()) {
      this.toast.warning('Please fill all required fields');
      return;
    }

    // Check if this allocation already exists
    if (!this.isEditMode) {
      const exists = this.allocationList.some(
        a => a.facultyId === this.formData.facultyId && 
             a.courseId === this.formData.courseId && 
             a.subjectId === this.formData.subjectId
      );
      if (exists) {
        this.toast.error('This faculty is already allocated to this course-subject combination!');
        return;
      }
    }

    const faculty = this.facultyList.find(f => f.id === this.formData.facultyId);
    const course = this.courseList.find(c => c.id === this.formData.courseId);
    const subject = this.courseSubjectList.find(
      cs => cs.subjectId === this.formData.subjectId && cs.courseId === this.formData.courseId
    );

    if (!faculty || !course || !subject) {
      this.toast.error('Invalid selection. Please check your choices.');
      return;
    }

    if (this.isEditMode && this.currentId) {
      const index = this.allocationList.findIndex(a => a.id === this.currentId);
      if (index !== -1) {
        this.allocationList[index] = {
          id: this.currentId,
          facultyId: faculty.id,
          facultyName: faculty.name,
          courseId: course.id,
          courseName: course.name,
          subjectId: subject.subjectId,
          subjectName: subject.subjectName,
          semester: this.formData.semester
        };
        this.toast.success(`Allocation for "${faculty.name}" updated successfully.`);
      }
    } else {
      const newAllocation: FacultyAllocation = {
        id: this.generateId(),
        facultyId: faculty.id,
        facultyName: faculty.name,
        courseId: course.id,
        courseName: course.name,
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
        semester: this.formData.semester
      };
      this.allocationList.push(newAllocation);
      this.toast.success(`Faculty "${faculty.name}" allocated to "${subject.subjectName}" (${course.name}).`);
    }

    this.saveAllocationsToStorage();
    this.closeForm();
  }

  deleteAllocation(id: string): void {
    const allocation = this.allocationList.find(a => a.id === id);
    this.allocationList = this.allocationList.filter(a => a.id !== id);
    this.saveAllocationsToStorage();
    this.toast.info(`Allocation for "${allocation?.facultyName || 'Faculty'}" revoked.`);
  }

  private validateForm(): boolean {
    return !!(
      this.formData.facultyId &&
      this.formData.courseId &&
      this.formData.subjectId &&
      this.formData.semester
    );
  }

  private saveAllocationsToStorage(): void {
    try {
      localStorage.setItem('obslmsFacultyAllocations', JSON.stringify(this.allocationList));
      this.filterAllocations();
    } catch {
      this.toast.error('Error saving allocation data');
    }
  }

  private generateId(): string {
    return 'FAL-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }

  getFacultyAllocations(facultyName: string): string {
    const allocations = this.allocationList
      .filter(a => a.facultyName === facultyName)
      .map(a => `${a.courseName}-${a.subjectName}`);
    return allocations.length > 0 ? allocations.join(', ') : 'No allocations';
  }
}
