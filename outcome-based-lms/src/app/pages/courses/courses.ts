import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../shared/services/toast.service';
import { CourseService, AppCourse } from '../../shared/services/course.service';

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
export class Courses implements OnInit {
  private toast = inject(ToastService);
  private courseService = inject(CourseService);
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
      const matchesSearch = !q || c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || (c.faculty && c.faculty.toLowerCase().includes(q));
      const matchesSem = !this.selectedSemester || c.semester === this.selectedSemester;
      return matchesSearch && matchesSem;
    });
  }

  // Student Syllabus Tracker bindings
  selectedSyllabusCourse: Course | null = null;
  completedUnits: string[] = [];

  facultyList: any[] = [];
  showAssignModal = false;
  assigningCourse: Course | null = null;
  selectedFacultyName = '';
  showAddFacultyModal = false;
  newFacultyForm = { name: '', department: 'Computer Science' };
  activeFacultySource: 'courseForm' | 'assignModal' = 'courseForm';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {
    try {
      this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
    } catch (e) {
      this.role = null;
    }
  }

  ngOnInit(): void {
    this.loadCourses();
    this.loadCompletion();
    this.loadFacultyList();
  }

  createEmptyCourse(): Course {
    return { id: 0, code: '', title: '', faculty: '', semester: '' };
  }

  loadCourses(): void {
    this.courses = this.courseService.getCoursesSync();
    this.cdr.detectChanges();

    this.courseService.getCourses().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.courses = data;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.courses = this.courseService.getCoursesSync();
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

    const payload = {
      id: this.currentCourse.id > 0 ? this.currentCourse.id : Date.now(),
      code: this.currentCourse.code.trim().toUpperCase(),
      title: this.currentCourse.title.trim(),
      faculty: this.currentCourse.faculty ? this.currentCourse.faculty.trim() : (this.role === 'faculty' ? (localStorage.getItem('userName') || 'Faculty') : 'Faculty Board'),
      semester: this.currentCourse.semester.trim()
    };

    this.courseService.saveCourse(payload).subscribe({
      next: () => {
        this.courses = this.courseService.getCoursesSync();
        this.toast.success(`Course "${payload.title}" saved successfully.`);
        this.resetCourseForm();
        this.cdr.detectChanges();
      },
      error: () => {
        this.courses = this.courseService.getCoursesSync();
        this.resetCourseForm();
        this.cdr.detectChanges();
      }
    });
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
    this.courseService.deleteCourse(course.id).subscribe({
      next: () => {
        this.courses = this.courseService.getCoursesSync();
        this.toast.success(`Course "${course.title}" removed.`);
        this.cdr.detectChanges();
      },
      error: () => {
        this.courses = this.courseService.getCoursesSync();
        this.cdr.detectChanges();
      }
    });
  }

  loadFacultyList(): void {
    try {
      const stored = localStorage.getItem('obslmsFaculty');
      this.facultyList = stored ? JSON.parse(stored) : [];
    } catch {
      this.facultyList = [];
    }
  }

  assignFaculty(course: Course): void {
    if (this.role !== 'admin') {
      this.toast.error('Only admins can assign faculty.');
      return;
    }
    this.assigningCourse = course;
    this.selectedFacultyName = course.faculty || 'Faculty Board';
    this.showAssignModal = true;
  }

  saveFacultyAssignment(): void {
    if (!this.assigningCourse) return;
    
    this.assigningCourse.faculty = this.selectedFacultyName;
    this.courseService.assignFaculty(this.assigningCourse, this.selectedFacultyName).subscribe({
      next: () => {
        this.courses = this.courseService.getCoursesSync();
        this.closeAssignModal();
        this.toast.success(`Assigned ${this.selectedFacultyName} to ${this.assigningCourse?.title}.`);
        this.cdr.detectChanges();
      },
      error: () => {
        this.courses = this.courseService.getCoursesSync();
        this.closeAssignModal();
        this.cdr.detectChanges();
      }
    });
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
    this.assigningCourse = null;
    this.selectedFacultyName = '';
  }

  onFacultySelectChange(value: string, source: 'courseForm' | 'assignModal'): void {
    if (value === 'ADD_NEW') {
      this.activeFacultySource = source;
      this.newFacultyForm = { name: '', department: 'Computer Science' };
      this.showAddFacultyModal = true;
      
      if (source === 'courseForm') {
        this.currentCourse.faculty = '';
      } else {
        this.selectedFacultyName = '';
      }
    }
  }

  saveNewFacultyFromCourses(): void {
    if (!this.newFacultyForm.name.trim()) {
      this.toast.warning('Please enter faculty name.');
      return;
    }

    const rawId = 'FAC-' + Date.now();
    const payload = {
      id: rawId,
      name: this.newFacultyForm.name.trim(),
      email: this.newFacultyForm.name.toLowerCase().replace(/[^a-z]/g, '') + '@oblms.edu',
      password: 'password',
      role: 'FACULTY',
      department: this.newFacultyForm.department
    };

    this.http.post('http://localhost:8080/api/users', payload).subscribe({
      next: () => {
        this.http.get<any[]>('http://localhost:8080/api/users').subscribe({
          next: (users) => {
            const faculty = users.filter(u => u.role?.toUpperCase() === 'FACULTY').map(u => ({
              id: u.id,
              name: u.name,
              email: u.email,
              department: u.department || 'Computer Science',
              designation: 'Assistant Professor',
              courses: []
            }));
            localStorage.setItem('obslmsFaculty', JSON.stringify(faculty));
            this.loadFacultyList();

            if (this.activeFacultySource === 'courseForm') {
              this.currentCourse.faculty = payload.name;
            } else {
              this.selectedFacultyName = payload.name;
            }
            this.closeAddFacultyModal();
            this.toast.success(`Faculty member "${payload.name}" created and selected.`);
          }
        });
      },
      error: () => {
        this.toast.error('Failed to create new faculty.');
      }
    });
  }

  closeAddFacultyModal(): void {
    this.showAddFacultyModal = false;
    this.newFacultyForm = { name: '', department: 'Computer Science' };
  }

  resetCourseForm(): void {
    this.showCourseForm = false;
    this.editingIndex = -1;
    this.currentCourse = this.createEmptyCourse();
  }

  isEnrolled(courseCode: string): boolean {
    const storedStudentCourses = localStorage.getItem('obslmsStudentCourses');
    const studentCourses = storedStudentCourses ? JSON.parse(storedStudentCourses) : [];
    const currentStudentName = localStorage.getItem('userName') || 'Student';
    return studentCourses.some((sc: any) => 
      sc.studentName.toLowerCase() === currentStudentName.toLowerCase() && 
      sc.courseCode.toLowerCase() === courseCode.toLowerCase()
    );
  }

  isRequestPending(courseCode: string): boolean {
    const storedRequests = localStorage.getItem('obslmsCourseRequests');
    const requests = storedRequests ? JSON.parse(storedRequests) : [];
    const currentStudentName = localStorage.getItem('userName') || 'Student';
    return requests.some((r: any) => 
      r.studentName.toLowerCase() === currentStudentName.toLowerCase() && 
      r.courseCode.toLowerCase() === courseCode.toLowerCase() && 
      r.status === 'Pending'
    );
  }

  isRequestRejected(courseCode: string): boolean {
    const storedRequests = localStorage.getItem('obslmsCourseRequests');
    const requests = storedRequests ? JSON.parse(storedRequests) : [];
    const currentStudentName = localStorage.getItem('userName') || 'Student';
    return requests.some((r: any) => 
      r.studentName.toLowerCase() === currentStudentName.toLowerCase() && 
      r.courseCode.toLowerCase() === courseCode.toLowerCase() && 
      r.status === 'Rejected'
    );
  }

  requestEnrollment(course: Course): void {
    const storedRequests = localStorage.getItem('obslmsCourseRequests');
    const requests = storedRequests ? JSON.parse(storedRequests) : [];
    const currentStudentName = localStorage.getItem('userName') || 'Student';

    const newRequest = {
      id: 'REQ-' + Date.now(),
      studentName: currentStudentName,
      courseCode: course.code,
      courseTitle: course.title,
      status: 'Pending',
      requestedAt: new Date().toISOString()
    };

    requests.push(newRequest);
    localStorage.setItem('obslmsCourseRequests', JSON.stringify(requests));
    this.toast.success(`Enrollment request sent for course "${course.title}".`);
    this.cdr.detectChanges();
  }
}
