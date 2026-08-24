import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../../shared/navbar/navbar';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { Footer } from '../../../shared/footer/footer';
import { ToastService } from '../../../shared/services/toast.service';
import { HttpClient } from '@angular/common/http';

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

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  private loadFaculty(): void {
    this.http.get<any[]>('http://localhost:8080/api/users').subscribe({
      next: (users) => {
        this.facultyList = users
          .filter(u => u.role?.toUpperCase() === 'FACULTY')
          .map(u => ({
            id: u.id,
            name: u.name
          }));
        this.cdr.detectChanges();
      },
      error: () => {
        this.facultyList = [];
      }
    });
  }

  private loadCourses(): void {
    this.http.get<any[]>('http://localhost:8080/api/courses').subscribe({
      next: (data) => {
        this.courseList = data.map((c: any) => ({
          id: (c.id || '').toString(),
          name: c.title || c.name || c.code || 'Course',
          code: c.code || ''
        }));
        this.courseSubjectList = data.map((c: any) => ({
          id: (c.id || '').toString(),
          courseId: (c.id || '').toString(),
          courseName: c.title || c.name || c.code || 'Course',
          subjectId: (c.id || '').toString(),
          subjectName: c.code || ''
        }));
        this.cdr.detectChanges();
      },
      error: () => {
        this.courseList = [];
        this.courseSubjectList = [];
      }
    });
  }

  private loadCourseSubjects(): void {}

  private loadAllocations(): void {
    this.http.get<any[]>('http://localhost:8080/api/courses').subscribe({
      next: (courses) => {
        this.allocationList = courses
          .filter(c => c.faculty && c.faculty !== 'Faculty Board')
          .map((c, idx) => ({
            id: (c.id || idx).toString(),
            facultyId: c.faculty,
            facultyName: c.faculty,
            courseId: (c.id || idx).toString(),
            courseName: c.title,
            subjectId: (c.id || idx).toString(),
            subjectName: c.code,
            semester: c.semester || 'Semester 1'
          }));
        this.filterAllocations();
        this.cdr.detectChanges();
      },
      error: () => {
        this.allocationList = [];
        this.filterAllocations();
      }
    });
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

    const faculty = this.facultyList.find(f => f.id === this.formData.facultyId);
    const course = this.courseList.find(c => c.id === this.formData.courseId);

    if (!faculty || !course) {
      this.toast.error('Invalid selection. Please check your choices.');
      return;
    }

    const payload = {
      id: Number(course.id),
      code: course.code,
      title: course.name,
      faculty: faculty.name,
      semester: this.formData.semester
    };

    this.http.post('http://localhost:8080/api/courses', payload).subscribe({
      next: () => {
        this.loadAllocations();
        this.closeForm();
        this.toast.success(`Faculty "${faculty.name}" allocated successfully.`);
      },
      error: () => {
        this.toast.error('Failed to save allocation to database.');
      }
    });
  }

  deleteAllocation(id: string): void {
    const allocation = this.allocationList.find(a => a.id === id);
    if (!allocation) return;

    const course = this.courseList.find(c => c.id === allocation.courseId);
    if (!course) return;

    const payload = {
      id: Number(course.id),
      code: course.code,
      title: course.name,
      faculty: 'Faculty Board',
      semester: 'Semester 1'
    };

    this.http.post('http://localhost:8080/api/courses', payload).subscribe({
      next: () => {
        this.loadAllocations();
        this.toast.info('Allocation removed.');
      },
      error: () => {
        this.toast.error('Failed to delete allocation.');
      }
    });
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
