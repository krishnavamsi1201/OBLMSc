import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../../shared/navbar/navbar';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { Footer } from '../../../shared/footer/footer';
import { ToastService } from '../../../shared/services/toast.service';
import { CourseService, AppCourse, DEFAULT_DATABASE_COURSES } from '../../../shared/services/course.service';
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
  email?: string;
  department?: string;
  courses?: string[];
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
  semester?: string;
}

interface CourseSubject {
  id: string;
  courseId: string;
  courseName: string;
  subjectId: string;
  subjectName: string;
  semester?: string;
}

const DEFAULT_FACULTY_ROSTER: Faculty[] = [
  { id: 'FAC001', name: 'Dr. Ramesh Babu', department: 'Computer Science & Engineering', courses: ['CS101', 'CS102', 'CS103'] },
  { id: 'FAC002', name: 'Prof. Sunita Sharma', department: 'Computer Science & Engineering', courses: ['CS102', 'CS202'] },
  { id: 'FAC003', name: 'Dr. Amit Patel', department: 'Electronics & Communication Engineering', courses: ['CS201', 'CS303', 'EC201'] },
  { id: 'FAC004', name: 'Dr. Priya Nair', department: 'Information Technology', courses: ['CS301', 'IT201', 'IT301'] },
  { id: 'FAC005', name: 'Prof. Rajesh Verma', department: 'Computer Science & Engineering', courses: ['CS302', 'CS402'] },
  { id: 'FAC006', name: 'Dr. Suresh Kumar', department: 'Civil Engineering', courses: ['CE111', 'CE201', 'CE301'] },
  { id: 'FAC007', name: 'Dr. Ananya Mishra', department: 'Mechanical Engineering', courses: ['ME111', 'ME201', 'ME301'] },
  { id: 'FAC008', name: 'Prof. Deepa Reddy', department: 'Electronics & Communication Engineering', courses: ['EC111', 'EC201', 'EC301'] },
  { id: 'FAC009', name: 'Dr. V. C. Reddy', department: 'Information Technology', courses: ['IT111', 'IT201', 'IT401'] },
  { id: 'FAC010', name: 'Prof. Meenakshi Iyer', department: 'Computer Science & Engineering', courses: ['CS111', 'CS121'] },
  { id: 'FAC011', name: 'Dr. Alok Nath', department: 'Civil Engineering', courses: ['CE201', 'CE301', 'CE401'] },
  { id: 'FAC012', name: 'Prof. Snehalata Das', department: 'Electronics & Communication Engineering', courses: ['EC201', 'EC301', 'EC401'] },
  { id: 'FAC013', name: 'Dr. Manoj Joshi', department: 'Computer Science & Engineering', courses: ['CS101', 'CS201'] },
  { id: 'FAC014', name: 'Dr. Kavita Menon', department: 'Computer Science & Engineering', courses: ['CS401', 'CS402'] },
  { id: 'FAC015', name: 'Prof. Arun Roy', department: 'Mechanical Engineering', courses: ['ME201', 'ME301', 'ME401'] },
  { id: 'FAC-1788427317827-699', name: 'Dr.Prasanth Kumar', department: 'Computer Science & Engineering', courses: ['CS101', 'CS102', 'CS103'] }
];

@Component({
  selector: 'app-faculty-course-allocation',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  templateUrl: './faculty-course-allocation.html',
  styleUrls: ['./faculty-course-allocation.css'],
})
export class FacultyCourseAllocation implements OnInit {
  private toast = inject(ToastService);
  private courseService = inject(CourseService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  allocationList: FacultyAllocation[] = [];
  filteredAllocationList: FacultyAllocation[] = [];
  
  facultyList: Faculty[] = [];
  courseList: Course[] = [
    { id: 'PRG_CSE', name: 'Computer Science & Engineering', code: 'CSE' },
    { id: 'PRG_IT', name: 'Information Technology', code: 'IT' },
    { id: 'PRG_ECE', name: 'Electronics & Communication Engineering', code: 'ECE' },
    { id: 'PRG_ME', name: 'Mechanical Engineering', code: 'ME' },
    { id: 'PRG_CE', name: 'Civil Engineering', code: 'CE' },
    { id: 'PRG_EEE', name: 'Electrical & Electronics Engineering', code: 'EEE' }
  ];
  courseSubjectList: CourseSubject[] = [];
  allRawCourses: AppCourse[] = [];
  
  // Filtered subjects based on selected course
  availableSubjects: CourseSubject[] = [];
  
  // Pagination
  currentPage = 1;
  pageSize = 25;
  pageSizeOptions = [10, 25, 50, 100, 200];

  get totalPages(): number {
    return Math.ceil(this.filteredAllocationList.length / this.pageSize) || 1;
  }

  get pagedAllocationList(): FacultyAllocation[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAllocationList.slice(start, start + this.pageSize);
  }

  get startIndex(): number {
    return this.filteredAllocationList.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredAllocationList.length);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
  }

  // Form fields
  showForm = false;
  isEditMode = false;
  currentId: string | null = null;
  
  // Form data
  formData = {
    facultyId: '',
    courseId: 'PRG_CSE',
    subjectId: '',
    semester: 'Semester 1'
  };

  // Filter and search
  searchQuery = '';
  filterCourse = '';
  filterFaculty = '';

  semesters = [
    'Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 
    'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'
  ];

  ngOnInit(): void {
    this.loadAllData();
  }

  private inferProgram(code: string, title: string): { id: string; name: string } {
    const c = (code || '').toUpperCase().trim();
    const t = (title || '').toLowerCase().trim();

    if (c.startsWith('IT') || c.startsWith('INF') || t.includes('information technology')) {
      return { id: 'PRG_IT', name: 'Information Technology' };
    }
    if (c.startsWith('EC') || c.startsWith('ECE') || t.includes('electronics') || t.includes('communication') || t.includes('vlsi') || t.includes('dsp')) {
      return { id: 'PRG_ECE', name: 'Electronics & Communication Engineering' };
    }
    if ((c.startsWith('ME') || c.startsWith('MEC')) && !c.startsWith('MES')) {
      return { id: 'PRG_ME', name: 'Mechanical Engineering' };
    }
    if (c.startsWith('CE') || c.startsWith('CIV') || t.includes('civil') || t.includes('structural') || t.includes('concrete')) {
      return { id: 'PRG_CE', name: 'Civil Engineering' };
    }
    if (c.startsWith('EE') || c.startsWith('EEE') || t.includes('electrical machines') || t.includes('power systems')) {
      return { id: 'PRG_EEE', name: 'Electrical & Electronics Engineering' };
    }
    return { id: 'PRG_CSE', name: 'Computer Science & Engineering' };
  }

  private loadAllData(): void {
    // 1. Initialize Courses
    const localCourses = this.courseService.ensureCoursesInitialized();
    this.allRawCourses = (localCourses && localCourses.length > 0) ? localCourses : [...DEFAULT_DATABASE_COURSES];

    // Try fetching from backend courses
    this.http.get<any[]>('http://localhost:8080/api/courses').subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          const map = new Map<string, any>();
          this.allRawCourses.forEach(c => map.set((c.code || '').toUpperCase(), c));
          data.forEach(c => {
            if (c.code) map.set((c.code || '').toUpperCase(), c);
          });
          this.allRawCourses = Array.from(map.values());
        }
        this.buildCourseSubjectList();
        this.fetchFacultyAndBuildAllocations();
      },
      error: () => {
        this.buildCourseSubjectList();
        this.fetchFacultyAndBuildAllocations();
      }
    });
  }

  private buildCourseSubjectList(): void {
    this.courseSubjectList = this.allRawCourses.map((c, idx) => {
      const prog = this.inferProgram(c.code, c.title);
      return {
        id: (c.id || idx).toString(),
        courseId: prog.id,
        courseName: prog.name,
        subjectId: c.code || `SUB-${idx}`,
        subjectName: c.title || 'Course Subject',
        semester: c.semester || 'Semester 1'
      };
    });
  }

  private fetchFacultyAndBuildAllocations(): void {
    this.http.get<any[]>('http://localhost:8080/api/users').subscribe({
      next: (users) => {
        if (Array.isArray(users) && users.length > 0) {
          const facultyUsers = users
            .filter(u => u.role?.toUpperCase() === 'FACULTY')
            .map(u => {
              let courseArr: string[] = [];
              if (u.enrolledCourses && typeof u.enrolledCourses === 'string') {
                courseArr = u.enrolledCourses.split(',').map((s: string) => s.trim()).filter(Boolean);
              } else if (Array.isArray(u.assignedCourses)) {
                courseArr = u.assignedCourses;
              }
              return {
                id: u.id,
                name: u.name,
                email: u.email,
                department: u.department || 'Computer Science & Engineering',
                courses: courseArr
              };
            });
          
          if (facultyUsers.length > 0) {
            this.facultyList = facultyUsers;
          } else {
            this.loadFallbackFaculty();
          }
        } else {
          this.loadFallbackFaculty();
        }
        this.compileAllAllocations();
      },
      error: () => {
        this.loadFallbackFaculty();
        this.compileAllAllocations();
      }
    });
  }

  private loadFallbackFaculty(): void {
    try {
      const stored = localStorage.getItem('obslmsFaculty');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.facultyList = parsed;
          return;
        }
      }
    } catch {}

    try {
      const storedUsers = localStorage.getItem('obslmsUsersDatabase');
      if (storedUsers) {
        const parsedUsers = JSON.parse(storedUsers);
        const facs = parsedUsers.filter((u: any) => u.role?.toUpperCase() === 'FACULTY');
        if (facs.length > 0) {
          this.facultyList = facs.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            department: u.department,
            courses: Array.isArray(u.assignedCourses) ? u.assignedCourses : []
          }));
          return;
        }
      }
    } catch {}

    this.facultyList = [...DEFAULT_FACULTY_ROSTER];
  }

  private normalizeSemester(sem: string | undefined, subjectCode?: string): string {
    if (!sem) {
      if (subjectCode) {
        const found = this.allRawCourses.find(c => c.code && c.code.toLowerCase() === subjectCode.toLowerCase());
        if (found && found.semester) return found.semester;
      }
      return 'Semester 1';
    }
    const clean = sem.trim();
    if (/fall|spring|summer|winter|2026|2025/i.test(clean)) {
      if (subjectCode) {
        const found = this.allRawCourses.find(c => c.code && c.code.toLowerCase() === subjectCode.toLowerCase());
        if (found && found.semester) return found.semester;
      }
      return 'Semester 1';
    }
    return clean;
  }

  private compileAllAllocations(): void {
    const allocationsMap = new Map<string, FacultyAllocation>();

    // 1. Add from Course dataset where faculty is assigned
    for (const c of this.allRawCourses) {
      if (c.faculty && c.faculty !== 'Faculty Board' && c.faculty.trim() !== '') {
        const prog = this.inferProgram(c.code, c.title);
        const fac = this.facultyList.find(f => f.name.toLowerCase() === c.faculty.toLowerCase());
        const facId = fac ? fac.id : 'FAC-' + c.faculty.replace(/\s+/g, '-');
        const key = `${c.faculty.trim().toLowerCase()}__${(c.code || c.title).trim().toLowerCase()}`;

        allocationsMap.set(key, {
          id: `FAL-${c.code || c.id}-${c.faculty.replace(/\s+/g, '')}`,
          facultyId: facId,
          facultyName: c.faculty,
          courseId: prog.id,
          courseName: prog.name,
          subjectId: c.code || '',
          subjectName: c.title || 'Course Subject',
          semester: this.normalizeSemester(c.semester, c.code)
        });
      }
    }

    // 2. Add from Faculty user roster (assigned courses)
    for (const fac of this.facultyList) {
      if (fac.courses && Array.isArray(fac.courses)) {
        for (const courseRef of fac.courses) {
          if (!courseRef) continue;
          const refClean = courseRef.trim().toLowerCase();
          
          // Purge any MCA references
          if (refClean.includes('mca') || refClean.startsWith('inmca') || refClean.startsWith('rlmca')) {
            continue;
          }

          // Find matching course in catalog
          const matchedCourse = this.allRawCourses.find(c => 
            (c.code && c.code.toLowerCase() === refClean) || 
            (c.title && c.title.toLowerCase() === refClean)
          );

          const subjectCode = matchedCourse ? matchedCourse.code : courseRef;
          const subjectTitle = matchedCourse ? matchedCourse.title : courseRef;
          const semester = matchedCourse ? matchedCourse.semester : 'Semester 3';
          const prog = this.inferProgram(subjectCode, subjectTitle);
          const key = `${fac.name.trim().toLowerCase()}__${subjectCode.trim().toLowerCase()}`;

          if (!allocationsMap.has(key)) {
            allocationsMap.set(key, {
              id: `FAL-${fac.id}-${subjectCode}`,
              facultyId: fac.id,
              facultyName: fac.name,
              courseId: prog.id,
              courseName: prog.name,
              subjectId: subjectCode,
              subjectName: subjectTitle,
              semester: this.normalizeSemester(semester, subjectCode)
            });
          }
        }
      }
    }

    // 3. Add any saved in localStorage with strict sanitization
    try {
      const storedAllocations = localStorage.getItem('obslmsFacultyAllocations');
      if (storedAllocations) {
        const parsed = JSON.parse(storedAllocations);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item.facultyName && item.subjectId) {
              const subCode = (item.subjectId || '').trim().toUpperCase();
              const subTitle = (item.subjectName || '').trim().toUpperCase();

              // Completely purge MCA allocations
              if (subCode.includes('MCA') || subTitle.includes('MCA') || subCode.startsWith('INMCA') || subCode.startsWith('RLMCA')) {
                continue;
              }

              const prog = this.inferProgram(item.subjectId, item.subjectName);
              const key = `${item.facultyName.trim().toLowerCase()}__${item.subjectId.trim().toLowerCase()}`;
              if (!allocationsMap.has(key)) {
                allocationsMap.set(key, {
                  id: item.id || `FAL-${Date.now()}-${Math.random()}`,
                  facultyId: item.facultyId || item.facultyName,
                  facultyName: item.facultyName,
                  courseId: prog.id,
                  courseName: prog.name,
                  subjectId: item.subjectId,
                  subjectName: item.subjectName || item.subjectId,
                  semester: this.normalizeSemester(item.semester, item.subjectId)
                });
              }
            }
          }
        }
      }
    } catch {}

    this.allocationList = Array.from(allocationsMap.values());

    try {
      localStorage.setItem('obslmsFacultyAllocations', JSON.stringify(this.allocationList));
    } catch {}

    this.filterAllocations();
    this.cdr.detectChanges();
  }

  private filterAllocations(): void {
    this.filteredAllocationList = this.allocationList.filter(a => {
      const matchSearch = a.facultyName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                         a.courseName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                         a.subjectName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                         a.subjectId.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchCourse = this.filterCourse === '' || a.courseId === this.filterCourse;
      const matchFaculty = this.filterFaculty === '' || a.facultyId === this.filterFaculty || a.facultyName === this.filterFaculty;
      return matchSearch && matchCourse && matchFaculty;
    });
    this.currentPage = 1;
  }

  onCourseChange(): void {
    if (this.formData.courseId) {
      this.availableSubjects = this.courseSubjectList.filter(
        cs => cs.courseId === this.formData.courseId
      );
      if (this.availableSubjects.length > 0 && !this.isEditMode) {
        this.formData.subjectId = this.availableSubjects[0].subjectId;
        this.formData.semester = this.availableSubjects[0].semester || 'Semester 1';
      }
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
    this.formData.courseId = this.courseList[0].id;
    this.onCourseChange();
  }

  openEditForm(allocation: FacultyAllocation): void {
    this.showForm = true;
    this.isEditMode = true;
    this.currentId = allocation.id;
    this.formData = {
      facultyId: allocation.facultyId,
      courseId: allocation.courseId,
      subjectId: allocation.subjectId,
      semester: this.normalizeSemester(allocation.semester, allocation.subjectId)
    };
    this.onCourseChange();
    this.formData.subjectId = allocation.subjectId;
  }

  closeForm(): void {
    this.showForm = false;
    this.resetForm();
  }

  private resetForm(): void {
    this.formData = {
      facultyId: this.facultyList.length > 0 ? this.facultyList[0].id : '',
      courseId: 'PRG_CSE',
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

    const faculty = this.facultyList.find(f => f.id === this.formData.facultyId || f.name === this.formData.facultyId);
    const course = this.courseList.find(c => c.id === this.formData.courseId);
    const subject = this.courseSubjectList.find(s => s.subjectId === this.formData.subjectId);

    if (!faculty || !course) {
      this.toast.error('Invalid selection. Please check your choices.');
      return;
    }

    const subjectCode = this.formData.subjectId;
    const subjectTitle = subject ? subject.subjectName : this.formData.subjectId;

    if (this.isEditMode && this.currentId) {
      const idx = this.allocationList.findIndex(a => a.id === this.currentId);
      if (idx !== -1) {
        this.allocationList[idx] = {
          id: this.currentId,
          facultyId: faculty.id,
          facultyName: faculty.name,
          courseId: course.id,
          courseName: course.name,
          subjectId: subjectCode,
          subjectName: subjectTitle,
          semester: this.formData.semester
        };
      }
      this.toast.success(`Allocation updated for "${faculty.name}"!`);
    } else {
      const newAlloc: FacultyAllocation = {
        id: 'FAL-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        facultyId: faculty.id,
        facultyName: faculty.name,
        courseId: course.id,
        courseName: course.name,
        subjectId: subjectCode,
        subjectName: subjectTitle,
        semester: this.formData.semester
      };
      this.allocationList.unshift(newAlloc);
      this.toast.success(`Faculty "${faculty.name}" allocated to ${subjectCode}! 🎉`);
    }

    // Update faculty assigned subjects in list & storage
    if (faculty.courses && !faculty.courses.includes(subjectCode)) {
      faculty.courses.push(subjectCode);
    }
    try {
      localStorage.setItem('obslmsFaculty', JSON.stringify(this.facultyList));
      localStorage.setItem('obslmsFacultyAllocations', JSON.stringify(this.allocationList));
    } catch {}

    this.filterAllocations();
    this.closeForm();

    // Background sync to backend
    const payload = {
      code: subjectCode,
      title: subjectTitle,
      faculty: faculty.name,
      semester: this.formData.semester
    };
    this.http.post('http://localhost:8080/api/courses', payload).subscribe({
      next: () => {},
      error: () => {}
    });
  }

  deleteAllocation(id: string): void {
    const allocation = this.allocationList.find(a => a.id === id);
    this.allocationList = this.allocationList.filter(a => a.id !== id);
    
    try {
      localStorage.setItem('obslmsFacultyAllocations', JSON.stringify(this.allocationList));
    } catch {}

    this.filterAllocations();
    this.toast.info(`Allocation ${allocation ? allocation.facultyName + ' - ' + allocation.subjectId : ''} removed.`);

    if (allocation) {
      const payload = {
        code: allocation.subjectId,
        title: allocation.subjectName,
        faculty: 'Faculty Board',
        semester: allocation.semester
      };
      this.http.post('http://localhost:8080/api/courses', payload).subscribe({
        next: () => {},
        error: () => {}
      });
    }
  }

  private validateForm(): boolean {
    return !!(
      this.formData.facultyId &&
      this.formData.courseId &&
      this.formData.subjectId &&
      this.formData.semester
    );
  }
}
