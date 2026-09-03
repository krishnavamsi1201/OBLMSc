import { Component, ChangeDetectorRef, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../shared/services/toast.service';
import { CourseService, AppCourse } from '../../shared/services/course.service';
import { SyncService } from '../../shared/services/sync.service';
import { Subscription } from 'rxjs';

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
export class Courses implements OnInit, OnDestroy {
  private toast = inject(ToastService);
  private courseService = inject(CourseService);
  private syncService = inject(SyncService);
  private syncSub?: Subscription;
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

      // Student Role: ONLY show subjects belonging to their branch or already enrolled
      if (this.role === 'student') {
        const matchesBranch = this.isCourseMatchingStudentBranch(c);
        if (!matchesBranch && !this.isEnrolled(c.code)) {
          return false;
        }
      }

      // Faculty Role: ONLY show subjects registered/assigned to this specific faculty
      if (this.role === 'faculty') {
        const matchesFaculty = this.isCourseAssignedToCurrentFaculty(c);
        if (!matchesFaculty) {
          return false;
        }
      }

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
    if (this.role === 'student') {
      this.loadStudentEnrollments();
    } else if (this.role === 'faculty') {
      this.loadFacultyAssignedCourses();
    }

    this.syncSub = this.syncService.events$.subscribe((event) => {
      if (event.type === 'COURSES_CHANGED' || event.type === 'ENROLLMENTS_CHANGED') {
        this.loadCourses();
        this.loadCompletion();
        if (this.role === 'student') {
          this.loadStudentEnrollments();
        } else if (this.role === 'faculty') {
          this.loadFacultyAssignedCourses();
        }
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.syncSub?.unsubscribe();
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
  currentCourseCOs: any[] = [];

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
    this.cdr.detectChanges();
  }

  trackSyllabus(course: Course): void {
    this.selectedSyllabusCourse = course;
    this.loadCourseCOs(course);
  }

  loadCourseCOs(course: Course): void {
    const code = course.code;
    this.currentCourseCOs = this.getFallbackCOs(course);

    this.http.get<any[]>(`http://localhost:8080/api/dataset/cos?course=${code}`).subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          this.currentCourseCOs = data.map((item, idx) => ({
            code: item.co || `CO${idx + 1}`,
            title: `Unit ${idx + 1}: ${item.bloomsLevel || 'Analyze & Implement'}`,
            level: item.bloomsLevel || 'Apply',
            desc: item.description || `Understand and master the core curriculum outcomes for ${course.title}.`
          }));
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.currentCourseCOs = this.getFallbackCOs(course);
        this.cdr.detectChanges();
      }
    });
  }

  getFallbackCOs(course: Course): any[] {
    const title = course.title;
    return [
      { code: 'CO1', title: 'Unit 1: Fundamentals & Theoretical Concepts', level: 'Remember', desc: `Outline essential foundations, notations, and core architectures of ${title}.` },
      { code: 'CO2', title: 'Unit 2: System Analysis & Design Modeling', level: 'Understand', desc: `Analyze requirements, design logical models, and schema abstractions for ${title}.` },
      { code: 'CO3', title: 'Unit 3: Algorithmic Implementation & Practical Tools', level: 'Apply', desc: `Apply practical frameworks, coding constructs, and execution strategies in ${title}.` },
      { code: 'CO4', title: 'Unit 4: Quality Assessment & Performance Optimization', level: 'Analyze', desc: `Evaluate performance metrics, computational trade-offs, and integrity constraints.` },
      { code: 'CO5', title: 'Unit 5: Advanced Industry Applications & Project Engineering', level: 'Evaluate', desc: `Synthesize end-to-end applications, real-world case studies, and modern standards.` }
    ];
  }

  getCompletedCOsCount(): number {
    if (!this.selectedSyllabusCourse) return 0;
    const code = this.selectedSyllabusCourse.code;
    return this.currentCourseCOs.filter(co => this.isCompleted(code, co.code)).length;
  }

  getProgressPercentage(): number {
    const total = this.currentCourseCOs.length || 5;
    const completed = this.getCompletedCOsCount();
    return Math.round((completed / total) * 100);
  }

  markAllCOsComplete(): void {
    if (!this.selectedSyllabusCourse) return;
    const code = this.selectedSyllabusCourse.code;
    for (const co of this.currentCourseCOs) {
      const key = `${code}_${co.code}`;
      if (!this.completedUnits.includes(key)) {
        this.completedUnits.push(key);
      }
    }
    const userName = localStorage.getItem('userName') || 'User';
    localStorage.setItem(`obslmsSyllabus_${userName}`, JSON.stringify(this.completedUnits));
    this.toast.success(`Marked all Course Outcomes as completed for ${this.selectedSyllabusCourse.title}!`);
    this.cdr.detectChanges();
  }

  resetCOsProgress(): void {
    if (!this.selectedSyllabusCourse) return;
    const code = this.selectedSyllabusCourse.code;
    this.completedUnits = this.completedUnits.filter(k => !k.startsWith(`${code}_`));
    const userName = localStorage.getItem('userName') || 'User';
    localStorage.setItem(`obslmsSyllabus_${userName}`, JSON.stringify(this.completedUnits));
    this.toast.info(`Reset progress for ${this.selectedSyllabusCourse.title}.`);
    this.cdr.detectChanges();
  }

  openCourseForm(): void {
    if (this.role !== 'admin') {
      this.toast.error('Only administrators can create courses.');
      return;
    }
    this.showCourseForm = true;
    this.editingIndex = -1;
    this.currentCourse = this.createEmptyCourse();
  }

  saveCourse(): void {
    if (this.role !== 'admin') {
      this.toast.error('Only administrators can save courses.');
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
      faculty: this.currentCourse.faculty ? this.currentCourse.faculty.trim() : 'Faculty Board',
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

    const facultyName = this.newFacultyForm.name.trim();
    const department = this.newFacultyForm.department || 'Computer Science';
    const emailName = facultyName.toLowerCase().replace(/[^a-z0-9]/g, '.');
    const email = `${emailName}@oblms.edu`;
    const rawId = 'FAC-' + Date.now();

    const newFaculty = {
      id: rawId,
      name: facultyName,
      email: email,
      department: department,
      designation: 'Assistant Professor',
      courses: []
    };

    // 1. Immediately save to localStorage and refresh facultyList
    try {
      const stored = localStorage.getItem('obslmsFaculty');
      const list = stored ? JSON.parse(stored) : [];
      list.push(newFaculty);
      localStorage.setItem('obslmsFaculty', JSON.stringify(list));
      this.loadFacultyList();
    } catch {}

    // 2. Select in the active form
    if (this.activeFacultySource === 'courseForm') {
      this.currentCourse.faculty = facultyName;
    } else {
      this.selectedFacultyName = facultyName;
    }

    this.closeAddFacultyModal();
    this.toast.success(`Faculty member "${facultyName}" created and selected.`);
    this.cdr.detectChanges();

    // 3. Background sync to backend database
    const payload = {
      id: rawId,
      name: facultyName,
      email: email,
      password: 'password',
      role: 'FACULTY',
      department: department
    };

    this.http.post('http://localhost:8080/api/users', payload).subscribe({
      next: () => {
        // Background sync succeeded
      },
      error: () => {
        // Backend offline or local fallback, already persisted locally
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

  pendingRequests: string[] = [];
  enrolledCourseCodes: string[] = [];

  loadStudentEnrollments(): void {
    const studentId = localStorage.getItem('userId') || localStorage.getItem('userEmail');
    if (studentId) {
      this.http.get<any>(`http://localhost:8080/api/users/${encodeURIComponent(studentId)}`).subscribe({
        next: (u) => {
          if (u && u.enrolledCourses) {
            this.enrolledCourseCodes = u.enrolledCourses.split(',').map((s: string) => s.trim().toUpperCase());
          } else {
            this.enrolledCourseCodes = [];
          }
          this.cdr.detectChanges();
        }
      });

      this.http.get<any[]>(`http://localhost:8080/api/courses/requests/student/${encodeURIComponent(studentId)}`).subscribe({
        next: (reqs) => {
          this.pendingRequests = (reqs || [])
            .filter(r => r.status?.toLowerCase() === 'pending')
            .map(r => (r.courseCode || '').toUpperCase().trim());
          this.cdr.detectChanges();
        }
      });
    }
  }

  isCourseMatchingStudentBranch(course: Course): boolean {
    const code = (course.code || '').toUpperCase().trim();
    const title = (course.title || '').toLowerCase().trim();
    const dept = (localStorage.getItem('userDepartment') || localStorage.getItem('userDept') || '').toLowerCase();

    // 1. Mechanical Engineering
    if (dept.includes('mech') || dept.includes('me')) {
      return code.startsWith('ME') || code.startsWith('AU') || code === 'KM' || code === 'IC' || code === '04ME6512' || code === 'SMSE' || code === 'EM IV' ||
             title.includes('metallurgy') || title.includes('kinematics') || title.includes('combustion') || title.includes('engine') || title.includes('cad') || title.includes('chassis') || title.includes('mechanical') || title.includes('automobile');
    }

    // 2. Civil Engineering
    if (dept.includes('civil') || dept.includes('ce')) {
      return code.startsWith('CE') || code === 'FMHM' || code === 'SMSE' || code === 'EMII' || code === 'HS300' || code === 'ECS' ||
             title.includes('fluid') || title.includes('survey') || title.includes('structural') || title.includes('civil') || title.includes('hydraulic') || title.includes('concrete');
    }

    // 3. Electronics & Communication Engineering (ECE)
    if (dept.includes('elect') || dept.includes('ece') || dept.includes('eee')) {
      return code.startsWith('EC') || code.startsWith('EE') || code === 'MES' || code === 'DSLD' || code === 'CS203' || code === 'CS207' || code === 'AMP' || code === 'HARDWARE LAB' || code === 'LD LAB' || code === 'EE233' || code === 'EE407' ||
             title.includes('microprocessor') || title.includes('logic design') || title.includes('signal') || title.includes('electronics') || title.includes('embedded') || title.includes('switching theory');
    }

    // 4. Information Technology (IT)
    if (dept.includes('info') || dept.includes('it')) {
      return code.startsWith('IT') || code === 'LINUX' || code === 'WT' || code === 'CS361' || code === 'RLMCA108' || code === 'LINUX LAB' || code === 'OPEN LAB' ||
             title.includes('linux') || title.includes('shell') || title.includes('web tech') || title.includes('cloud') || title.includes('devops') || title.includes('soft computing') || title.includes('operations research');
    }

    // 5. Computer Science & Engineering (CSE)
    return code.startsWith('CS') || code === 'DS' || code === 'OOP' || code === 'CC' || code === 'OOMD' || code === 'HPC' || code === 'DS LAB' || code === 'C++ LAB' || code === 'RLMCA101' || code === 'RLMCA201' || code === 'RLMCA205' || code === 'RLMCA231' ||
           title.includes('data structure') || title.includes('database') || title.includes('algorithm') || title.includes('compiler') || title.includes('networks') || title.includes('computer') || title.includes('machine learning') || title.includes('artificial intelligence') || title.includes('software engineering');
  }

  isEnrolled(courseCode: string): boolean {
    if (!courseCode) return false;
    const c = courseCode.toUpperCase().trim();
    if (this.enrolledCourseCodes.includes(c)) return true;

    try {
      const storedStudentCourses = localStorage.getItem('obslmsStudentCourses');
      const studentCourses = storedStudentCourses ? JSON.parse(storedStudentCourses) : [];
      const currentStudentName = localStorage.getItem('userName') || 'Student';
      return studentCourses.some((sc: any) => 
        sc.studentName.toLowerCase() === currentStudentName.toLowerCase() && 
        sc.courseCode.toUpperCase().trim() === c
      );
    } catch {
      return false;
    }
  }

  isRequestPending(courseCode: string): boolean {
    if (!courseCode) return false;
    const c = courseCode.toUpperCase().trim();
    if (this.pendingRequests.includes(c)) return true;

    try {
      const storedRequests = localStorage.getItem('obslmsCourseRequests');
      const requests = storedRequests ? JSON.parse(storedRequests) : [];
      const currentStudentName = localStorage.getItem('userName') || 'Student';
      return requests.some((r: any) => 
        r.studentName.toLowerCase() === currentStudentName.toLowerCase() && 
        (r.courseCode || '').toUpperCase().trim() === c && 
        r.status === 'Pending'
      );
    } catch {
      return false;
    }
  }

  isRequestRejected(courseCode: string): boolean {
    try {
      const storedRequests = localStorage.getItem('obslmsCourseRequests');
      const requests = storedRequests ? JSON.parse(storedRequests) : [];
      const currentStudentName = localStorage.getItem('userName') || 'Student';
      return requests.some((r: any) => 
        r.studentName.toLowerCase() === currentStudentName.toLowerCase() && 
        (r.courseCode || '').toLowerCase() === (courseCode || '').toLowerCase() && 
        r.status === 'Rejected'
      );
    } catch {
      return false;
    }
  }

  requestEnrollment(course: Course): void {
    const currentStudentName = localStorage.getItem('userName') || 'Student';
    const currentStudentId = localStorage.getItem('userId') || localStorage.getItem('userEmail') || 'STUDENT';
    const currentStudentEmail = localStorage.getItem('userEmail') || '';
    const currentStudentDept = localStorage.getItem('userDepartment') || localStorage.getItem('userDept') || 'Mechanical Engineering';

    const payload = {
      studentId: currentStudentId,
      studentName: currentStudentName,
      studentEmail: currentStudentEmail,
      regNo: localStorage.getItem('userRoll') || currentStudentId,
      department: currentStudentDept,
      courseCode: course.code,
      courseTitle: course.title,
      semester: course.semester || 'Semester 6',
      status: 'Pending'
    };

    this.http.post('http://localhost:8080/api/courses/requests', payload).subscribe({
      next: () => {
        this.pendingRequests.push(course.code.toUpperCase().trim());
        this.syncService.emit('ENROLLMENTS_CHANGED', payload);
        this.toast.success(`Enrollment request sent for "${course.title}". ⏳`);
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.error('Failed to submit enrollment request to database.');
      }
    });
  }

  facultyAssignedCodes: string[] = [];

  loadFacultyAssignedCourses(): void {
    const facId = localStorage.getItem('userId') || localStorage.getItem('userEmail') || '';
    const facName = (localStorage.getItem('userName') || '').trim().toLowerCase();

    this.http.get<any[]>(`http://localhost:8080/api/users`).subscribe({
      next: (users) => {
        if (Array.isArray(users)) {
          const currentFac = users.find(u => 
            (u.id && u.id.toLowerCase() === facId.toLowerCase()) ||
            (u.email && u.email.toLowerCase() === facId.toLowerCase()) ||
            (u.name && u.name.toLowerCase() === facName)
          );
          if (currentFac && currentFac.enrolledCourses) {
            this.facultyAssignedCodes = currentFac.enrolledCourses.split(',').map((s: string) => s.trim().toUpperCase());
            this.cdr.detectChanges();
          }
        }
      }
    });
  }

  isCourseAssignedToCurrentFaculty(course: Course): boolean {
    const currentFacName = (localStorage.getItem('userName') || '').trim().toLowerCase();
    const currentFacEmail = (localStorage.getItem('userEmail') || '').trim().toLowerCase();
    const courseFaculty = (course.faculty || '').trim().toLowerCase();
    const code = (course.code || '').trim().toUpperCase();
    const title = (course.title || '').trim().toLowerCase();

    // 1. Match assigned faculty name
    if (currentFacName && courseFaculty && (courseFaculty.includes(currentFacName) || currentFacName.includes(courseFaculty))) {
      return true;
    }

    // 2. Match email
    if (currentFacEmail && courseFaculty && courseFaculty.includes(currentFacEmail)) {
      return true;
    }

    // 3. Match from backend enrolled courses
    if (this.facultyAssignedCodes.includes(code) || this.facultyAssignedCodes.some(ac => title.includes(ac.toLowerCase()))) {
      return true;
    }

    // 4. Match local assigned list
    try {
      const assigned = JSON.parse(localStorage.getItem('userAssignedCourses') || '[]');
      if (Array.isArray(assigned)) {
        if (assigned.some((a: string) => a.toUpperCase() === code || a.toLowerCase() === title)) {
          return true;
        }
      }
    } catch {}

    return false;
  }
}
