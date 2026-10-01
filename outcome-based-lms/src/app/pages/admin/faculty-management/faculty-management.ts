import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../../shared/navbar/navbar';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { Footer } from '../../../shared/footer/footer';
import { ToastService } from '../../../shared/services/toast.service';
import { CourseService, AppCourse } from '../../../shared/services/course.service';
import { SyncService } from '../../../shared/services/sync.service';
import { HttpClient } from '@angular/common/http';

export interface Faculty {
  id: string;
  name: string;
  email: string;
  password?: string;
  department: string;
  designation: string;
  courses: string[];
}

export const DEFAULT_FACULTY_ROSTER: Faculty[] = [
  {
    id: 'FAC001',
    name: 'Dr. Ramesh Babu',
    email: 'ramesh.babu@oblms.edu',
    password: 'password',
    department: 'Computer Science & Engineering',
    designation: 'Head of Department (HOD)',
    courses: ['CS101', 'CS102', 'CS103']
  },
  {
    id: 'FAC002',
    name: 'Prof. Sunita Sharma',
    email: 'sunita.sharma@oblms.edu',
    password: 'password',
    department: 'Computer Science & Engineering',
    designation: 'Associate Professor',
    courses: ['CS102', 'CS202']
  },
  {
    id: 'FAC003',
    name: 'Dr. Amit Patel',
    email: 'amit.patel@oblms.edu',
    password: 'password',
    department: 'Electronics & Communication Engineering',
    designation: 'Associate Professor',
    courses: ['EC201', 'EC303', 'CS201']
  },
  {
    id: 'FAC004',
    name: 'Dr. Priya Nair',
    email: 'priya.nair@oblms.edu',
    password: 'password',
    department: 'Information Technology',
    designation: 'Professor',
    courses: ['IT201', 'IT301', 'CS301']
  },
  {
    id: 'FAC005',
    name: 'Prof. Rajesh Verma',
    email: 'rajesh.verma@oblms.edu',
    password: 'password',
    department: 'Computer Science & Engineering',
    designation: 'Associate Professor',
    courses: ['CS302', 'CS402']
  },
  {
    id: 'FAC006',
    name: 'Dr. Suresh Kumar',
    email: 'suresh.kumar@oblms.edu',
    password: 'password',
    department: 'Civil Engineering',
    designation: 'Head of Department (HOD)',
    courses: ['CE111', 'CE201', 'CE301']
  },
  {
    id: 'FAC007',
    name: 'Dr. Ananya Mishra',
    email: 'ananya.mishra@oblms.edu',
    password: 'password',
    department: 'Mechanical Engineering',
    designation: 'Associate Professor',
    courses: ['ME111', 'ME201', 'ME301']
  },
  {
    id: 'FAC008',
    name: 'Prof. Deepa Reddy',
    email: 'deepa.reddy@oblms.edu',
    password: 'password',
    department: 'Electronics & Communication Engineering',
    designation: 'Associate Professor',
    courses: ['EC111', 'EC201', 'EC301']
  },
  {
    id: 'FAC009',
    name: 'Dr. V. C. Reddy',
    email: 'vc.reddy@oblms.edu',
    password: 'password',
    department: 'Information Technology',
    designation: 'Head of Department (HOD)',
    courses: ['IT111', 'IT201', 'IT401']
  },
  {
    id: 'FAC010',
    name: 'Prof. Meenakshi Iyer',
    email: 'meenakshi.iyer@oblms.edu',
    password: 'password',
    department: 'Computer Science & Engineering',
    designation: 'Assistant Professor',
    courses: ['CS111', 'CS121']
  },
  {
    id: 'FAC011',
    name: 'Dr. Alok Nath',
    email: 'alok.nath@oblms.edu',
    password: 'password',
    department: 'Civil Engineering',
    designation: 'Associate Professor',
    courses: ['CE201', 'CE301', 'CE401']
  },
  {
    id: 'FAC012',
    name: 'Prof. Snehalata Das',
    email: 'snehalata.das@oblms.edu',
    password: 'password',
    department: 'Electronics & Communication Engineering',
    designation: 'Assistant Professor',
    courses: ['EC201', 'EC301', 'EC401']
  },
  {
    id: 'FAC013',
    name: 'Dr. Manoj Joshi',
    email: 'manoj.joshi@oblms.edu',
    password: 'password',
    department: 'Computer Science & Engineering',
    designation: 'Associate Professor',
    courses: ['CS101', 'CS201']
  },
  {
    id: 'FAC014',
    name: 'Dr. Kavita Menon',
    email: 'kavita.menon@oblms.edu',
    password: 'password',
    department: 'Computer Science & Engineering',
    designation: 'Assistant Professor',
    courses: ['CS401', 'CS402']
  },
  {
    id: 'FAC015',
    name: 'Prof. Arun Roy',
    email: 'arun.roy@oblms.edu',
    password: 'password',
    department: 'Mechanical Engineering',
    designation: 'Associate Professor',
    courses: ['ME201', 'ME301', 'ME401']
  },
  {
    id: 'FAC-1788427317827-699',
    name: 'Dr. Prasanth Kumar',
    email: 'prasanth.kumar@oblms.edu',
    password: 'password',
    department: 'Computer Science & Engineering',
    designation: 'Professor',
    courses: ['CS101', 'CS102', 'CS103']
  }
];

@Component({
  selector: 'app-faculty-management',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  templateUrl: './faculty-management.html',
  styleUrls: ['./faculty-management.css'],
})
export class FacultyManagement implements OnInit {
  private toast = inject(ToastService);
  private courseService = inject(CourseService);
  private syncService = inject(SyncService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  facultyList: Faculty[] = [];
  filteredFacultyList: Faculty[] = [];
  pagedFacultyList: Faculty[] = [];
  allAvailableCourses: AppCourse[] = [];
  
  // Pagination
  currentPage = 1;
  pageSize = 20;
  pageSizeOptions = [10, 20, 50, 100];
  totalPages = 1;
  startIndex = 1;
  endIndex = 1;

  // Form fields
  showForm = false;
  isEditMode = false;
  currentId: string | null = null;
  
  // Form data (includes editable ID)
  formData = {
    id: '',
    name: '',
    email: '',
    password: '',
    department: 'Computer Science & Engineering',
    designation: 'Assistant Professor',
    selectedCourses: [] as string[]
  };

  // Filter and search
  searchQuery = '';
  filterDepartment = '';
  filterDesignation = '';
  
  departments = [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication Engineering', 
    'Mechanical Engineering', 
    'Civil Engineering', 
    'Electrical & Electronics Engineering'
  ];
  
  designations = [
    'Assistant Professor', 
    'Associate Professor', 
    'Professor', 
    'Head of Department (HOD)',
    'Dean of Academics',
    'Lecturer'
  ];

  // Dedicated Allot Subjects Modal
  showAllotModal = false;
  allottingFaculty: Faculty | null = null;
  selectedAllotCourses: string[] = [];
  allotSearchQuery = '';
  allotSemesterFilter = '';

  // KPI Metrics
  get totalFacultyCount(): number {
    return this.facultyList.length;
  }

  get totalDepartmentsCovered(): number {
    const set = new Set(this.facultyList.map(f => f.department).filter(Boolean));
    return set.size;
  }

  get totalAllocatedCoursesCount(): number {
    return this.facultyList.reduce((acc, f) => acc + (f.courses ? f.courses.length : 0), 0);
  }

  isCourseInDept(course: any, dept: string): boolean {
    if (!dept) return true;
    const d = dept.toLowerCase().trim();
    const code = (course?.code || '').toUpperCase().trim();
    const title = (course?.title || '').toLowerCase().trim();
    const courseDept = (course?.department || '').toLowerCase().trim();

    if (courseDept) {
      if (courseDept.includes('comp') || courseDept.includes('cse') || courseDept.includes('cs')) {
        if (d.includes('comp') || d.includes('cse') || d.includes('cs')) return true;
      }
      if (courseDept.includes('info') || courseDept.includes('it')) {
        if (d.includes('info') || d.includes('it')) return true;
      }
      if (courseDept.includes('electr') && (courseDept.includes('comm') || courseDept.includes('ece'))) {
        if (d.includes('electr') && (d.includes('comm') || d.includes('ece'))) return true;
      }
      if (courseDept.includes('mech') || courseDept.includes('me')) {
        if (d.includes('mech') || d.includes('me')) return true;
      }
      if (courseDept.includes('civil') || courseDept.includes('ce')) {
        if (d.includes('civil') || d.includes('ce')) return true;
      }
      if (courseDept.includes('electr') || courseDept.includes('eee')) {
        if (d.includes('electr') || d.includes('eee')) return true;
      }
    }

    if (d.includes('comp') || d.includes('cse') || d.includes('computer')) {
      return (code.startsWith('CS') && !code.startsWith('CE')) || title.includes('computer') || title.includes('database') || title.includes('java') || title.includes('python') || title.includes('operating systems') || title.includes('machine learning');
    }
    if (d.includes('info') || d.includes('it')) {
      return code.startsWith('IT') || code.startsWith('INF');
    }
    if (d.includes('electr') && (d.includes('comm') || d.includes('ece'))) {
      return code.startsWith('EC') || code.startsWith('ECE');
    }
    if (d.includes('mech') || d.includes('me')) {
      return (code.startsWith('ME') || code.startsWith('MEC')) && !code.startsWith('MES');
    }
    if (d.includes('civil') || d.includes('ce')) {
      return code.startsWith('CE') || code.startsWith('CIV');
    }
    if (d.includes('electr') || d.includes('eee')) {
      return code.startsWith('EE') || code.startsWith('EEE');
    }

    return true;
  }

  get filteredAllotCourses(): any[] {
    const q = this.allotSearchQuery.toLowerCase().trim();
    const sem = this.allotSemesterFilter;
    const targetDept = this.allottingFaculty ? this.allottingFaculty.department : '';

    return this.allAvailableCourses.filter(c => {
      const matchDept = !targetDept || this.isCourseInDept(c, targetDept);
      const matchSearch = !q || (c.title && c.title.toLowerCase().includes(q)) || (c.code && c.code.toLowerCase().includes(q));
      const matchSem = !sem || c.semester === sem;
      return matchDept && matchSearch && matchSem;
    });
  }

  getAvailableCoursesForDept(dept: string): any[] {
    if (!dept) return this.allAvailableCourses;
    return this.allAvailableCourses.filter(c => this.isCourseInDept(c, dept));
  }

  ngOnInit(): void {
    this.loadFaculty();
    this.loadCourses();
  }

  openAllotModal(faculty: Faculty): void {
    this.allottingFaculty = faculty;
    this.selectedAllotCourses = faculty.courses ? [...faculty.courses] : [];
    this.allotSearchQuery = '';
    this.allotSemesterFilter = '';
    this.showAllotModal = true;
    this.loadCourses();
  }

  closeAllotModal(): void {
    this.showAllotModal = false;
    this.allottingFaculty = null;
    this.selectedAllotCourses = [];
  }

  isAllotCourseSelected(course: any): boolean {
    if (!course) return false;
    const title = course.title || '';
    const code = course.code || '';
    return this.selectedAllotCourses.some(sc => 
      (sc && title && sc.trim().toLowerCase() === title.trim().toLowerCase()) ||
      (sc && code && sc.trim().toLowerCase() === code.trim().toLowerCase())
    );
  }

  toggleAllotCourse(course: any): void {
    if (!course) return;
    const key = course.code || course.title;
    const title = course.title || '';
    const code = course.code || '';

    const idx = this.selectedAllotCourses.findIndex(sc => 
      (sc && title && sc.trim().toLowerCase() === title.trim().toLowerCase()) ||
      (sc && code && sc.trim().toLowerCase() === code.trim().toLowerCase())
    );

    if (idx !== -1) {
      this.selectedAllotCourses.splice(idx, 1);
    } else {
      this.selectedAllotCourses.push(key);
    }
  }

  saveSubjectAllotment(): void {
    if (!this.allottingFaculty) return;

    const faculty = this.allottingFaculty;
    const assigned = [...this.selectedAllotCourses];
    faculty.courses = assigned;

    // 1. Update in local facultyList
    const idx = this.facultyList.findIndex(f => f.id === faculty.id || f.name.toLowerCase().trim() === faculty.name.toLowerCase().trim());
    if (idx !== -1) {
      this.facultyList[idx].courses = assigned;
    }
    try {
      localStorage.setItem('obslmsFaculty', JSON.stringify(this.facultyList));
    } catch {}

    // 2. Update obslmsUsersDatabase
    try {
      const storedUsers = localStorage.getItem('obslmsUsersDatabase');
      if (storedUsers) {
        const usersList = JSON.parse(storedUsers);
        if (Array.isArray(usersList)) {
          const uIdx = usersList.findIndex((u: any) => u.id === faculty.id || u.email?.toLowerCase() === faculty.email?.toLowerCase());
          if (uIdx !== -1) {
            usersList[uIdx].assignedCourses = assigned;
            localStorage.setItem('obslmsUsersDatabase', JSON.stringify(usersList));
          }
        }
      }
    } catch {}

    // 3. Update obslmsFacultyAllocations
    try {
      const storedAlloc = localStorage.getItem('obslmsFacultyAllocations');
      let allocList: any[] = storedAlloc ? JSON.parse(storedAlloc) : [];
      if (!Array.isArray(allocList)) allocList = [];
      
      allocList = allocList.filter(a => a.facultyId !== faculty.id && a.facultyName?.toLowerCase().trim() !== faculty.name.toLowerCase().trim());
      
      assigned.forEach((subCode, i) => {
        allocList.push({
          id: `FAL-${faculty.id}-${i}-${Date.now()}`,
          facultyId: faculty.id,
          facultyName: faculty.name,
          courseId: faculty.id,
          courseName: faculty.department,
          subjectId: subCode,
          subjectName: subCode,
          semester: 'Semester 3'
        });
      });
      localStorage.setItem('obslmsFacultyAllocations', JSON.stringify(allocList));
    } catch {}

    // 4. Update obslmsCourses
    try {
      const courses = this.courseService.getCoursesSync();
      let updatedCourses = false;
      courses.forEach(c => {
        if (assigned.includes(c.title) || assigned.includes(c.code)) {
          c.faculty = faculty.name;
          updatedCourses = true;
        }
      });
      if (updatedCourses) {
        localStorage.setItem('obslmsCourses', JSON.stringify(courses));
      }
    } catch {}

    this.syncService.emit('FACULTY_CHANGED', faculty);
    this.syncService.emit('COURSES_CHANGED');

    const payload = {
      id: faculty.id,
      name: faculty.name,
      email: faculty.email,
      role: 'FACULTY',
      department: faculty.department,
      designation: faculty.designation,
      assignedCourses: assigned
    };

    this.http.post('http://localhost:8080/api/users', payload).subscribe({
      next: () => {
        this.toast.success(`Subjects updated successfully for "${faculty.name}"! 🎉`);
        this.closeAllotModal();
        this.filterFaculty();
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.info(`Updated local allotment for "${faculty.name}".`);
        this.closeAllotModal();
        this.filterFaculty();
        this.cdr.detectChanges();
      }
    });
  }

  private loadFaculty(): void {
    // 1. Build lookup map from DEFAULT_FACULTY_ROSTER
    const defaultMap = new Map<string, Faculty>();
    DEFAULT_FACULTY_ROSTER.forEach(f => {
      defaultMap.set(f.id.toUpperCase(), f);
      defaultMap.set(f.name.toLowerCase().trim(), f);
    });

    // 2. Read existing allocations from obslmsFacultyAllocations
    const facultyAllocationsMap = new Map<string, string[]>();
    try {
      const storedAlloc = localStorage.getItem('obslmsFacultyAllocations');
      if (storedAlloc) {
        const parsed = JSON.parse(storedAlloc);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item.facultyName && item.subjectId) {
              const nameKey = item.facultyName.trim().toLowerCase();
              const idKey = (item.facultyId || '').trim().toUpperCase();
              const subCode = (item.subjectId || '').trim();
              if (subCode) {
                if (!facultyAllocationsMap.has(nameKey)) facultyAllocationsMap.set(nameKey, []);
                const l1 = facultyAllocationsMap.get(nameKey)!;
                if (!l1.includes(subCode)) l1.push(subCode);

                if (idKey) {
                  if (!facultyAllocationsMap.has(idKey)) facultyAllocationsMap.set(idKey, []);
                  const l2 = facultyAllocationsMap.get(idKey)!;
                  if (!l2.includes(subCode)) l2.push(subCode);
                }
              }
            }
          }
        }
      }
    } catch {}

    // 3. Read local storage
    const local = this.getSafeJson('obslmsFaculty');
    if (Array.isArray(local) && local.length > 0) {
      this.facultyList = local.map((f: any) => {
        const def = defaultMap.get((f.id || '').toUpperCase()) || defaultMap.get((f.name || '').toLowerCase().trim());
        const allocCourses = facultyAllocationsMap.get((f.name || '').toLowerCase().trim()) || facultyAllocationsMap.get((f.id || '').toUpperCase());
        
        let courses: string[] = [];
        if (Array.isArray(f.courses) && f.courses.length > 0) {
          courses = f.courses;
        } else if (allocCourses && allocCourses.length > 0) {
          courses = allocCourses;
        } else if (def && def.courses && def.courses.length > 0) {
          courses = [...def.courses];
        }

        return {
          id: f.id,
          name: f.name,
          email: f.email || def?.email || `${(f.name || 'faculty').toLowerCase().replace(/[^a-z0-9]/g, '.')}@oblms.edu`,
          password: f.password || def?.password || 'password',
          department: f.department || def?.department || 'Computer Science & Engineering',
          designation: f.designation || def?.designation || 'Assistant Professor',
          courses: courses
        };
      });
    } else {
      this.facultyList = DEFAULT_FACULTY_ROSTER.map(f => ({ ...f }));
    }

    // Ensure all default faculty are represented with valid courses
    DEFAULT_FACULTY_ROSTER.forEach(df => {
      const exists = this.facultyList.find(f => (f.id && f.id.toUpperCase() === df.id.toUpperCase()) || (f.name && f.name.toLowerCase().trim() === df.name.toLowerCase().trim()));
      if (!exists) {
        this.facultyList.push({ ...df });
      } else if (!exists.courses || exists.courses.length === 0) {
        exists.courses = [...df.courses];
      }
    });

    try {
      localStorage.setItem('obslmsFaculty', JSON.stringify(this.facultyList));
    } catch {}
    this.filterFaculty();

    // 4. Hydrate from backend API
    this.http.get<any[]>('http://localhost:8080/api/users').subscribe({
      next: (users) => {
        if (Array.isArray(users) && users.length > 0) {
          const backendFaculty = users
            .filter(u => u.role?.toUpperCase() === 'FACULTY')
            .map(u => {
              let courseList: string[] = [];
              if (u.enrolledCourses && typeof u.enrolledCourses === 'string') {
                courseList = u.enrolledCourses.split(',').map((s: string) => s.trim()).filter(Boolean);
              } else if (Array.isArray(u.assignedCourses) && u.assignedCourses.length > 0) {
                courseList = u.assignedCourses;
              }
              const dept = (u.department === 'Computer Science' || !u.department) ? 'Computer Science & Engineering' : u.department;
              return {
                id: u.id,
                name: u.name,
                email: u.email,
                password: u.password || 'password',
                department: dept,
                designation: u.designation || 'Assistant Professor',
                courses: courseList
              };
            });
          
          if (backendFaculty.length > 0) {
            const mergedMap = new Map<string, Faculty>();
            this.facultyList.forEach(f => {
              if (f.id) mergedMap.set(f.id.toUpperCase(), { ...f });
              if (f.name) mergedMap.set(f.name.toLowerCase().trim(), { ...f });
            });

            backendFaculty.forEach(bf => {
              const existing = mergedMap.get((bf.id || '').toUpperCase()) || mergedMap.get((bf.name || '').toLowerCase().trim());
              const def = defaultMap.get((bf.id || '').toUpperCase()) || defaultMap.get((bf.name || '').toLowerCase().trim());
              const allocCourses = facultyAllocationsMap.get((bf.name || '').toLowerCase().trim()) || facultyAllocationsMap.get((bf.id || '').toUpperCase());

              let finalCourses: string[] = [];
              if (bf.courses && bf.courses.length > 0) {
                finalCourses = bf.courses;
              } else if (existing && existing.courses && existing.courses.length > 0) {
                finalCourses = existing.courses;
              } else if (allocCourses && allocCourses.length > 0) {
                finalCourses = allocCourses;
              } else if (def && def.courses && def.courses.length > 0) {
                finalCourses = [...def.courses];
              }

              const mergedFaculty: Faculty = {
                id: bf.id || existing?.id || def?.id || `FAC${Date.now()}`,
                name: bf.name || existing?.name || def?.name || 'Faculty Member',
                email: bf.email || existing?.email || def?.email || 'faculty@oblms.edu',
                password: bf.password || existing?.password || def?.password || 'password',
                department: bf.department || existing?.department || def?.department || 'Computer Science & Engineering',
                designation: bf.designation || existing?.designation || def?.designation || 'Assistant Professor',
                courses: finalCourses
              };

              mergedMap.set(mergedFaculty.id.toUpperCase(), mergedFaculty);
            });

            DEFAULT_FACULTY_ROSTER.forEach(df => {
              if (!mergedMap.has(df.id.toUpperCase())) {
                mergedMap.set(df.id.toUpperCase(), { ...df });
              }
            });

            this.facultyList = Array.from(mergedMap.values());
            try {
              localStorage.setItem('obslmsFaculty', JSON.stringify(this.facultyList));
            } catch {}
            this.filterFaculty();
            this.cdr.detectChanges();
          }
        }
      },
      error: () => {
        // Fallback remains safely displayed
      }
    });
  }

  copyCredentials(faculty: Faculty): void {
    const pwd = faculty.password || 'password';
    const text = `Institutional Faculty Account Details:\nFaculty ID: ${faculty.id}\nName: ${faculty.name}\nDepartment: ${faculty.department}\nUsername/Email: ${faculty.email}\nPassword: ${pwd}`;
    
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.toast.success(`Copied login credentials for "${faculty.name}" (ID: ${faculty.id})! 📋`);
      }).catch(() => {
        this.toast.info(`ID: ${faculty.id} | Email: ${faculty.email} | Password: ${pwd}`);
      });
    } else {
      this.toast.info(`ID: ${faculty.id} | Email: ${faculty.email} | Password: ${pwd}`);
    }
  }

  private loadCourses(): void {
    const defaultCourses = this.courseService.ensureCoursesInitialized();
    this.http.get<any[]>('http://localhost:8080/api/courses').subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          const courseMap = new Map<string, any>();
          for (const c of defaultCourses) {
            courseMap.set(c.code.toUpperCase(), c);
          }
          for (const c of data) {
            if (c.code) {
              courseMap.set(c.code.toUpperCase(), c);
            }
          }
          this.allAvailableCourses = Array.from(courseMap.values());
          this.cdr.detectChanges();
        } else {
          this.allAvailableCourses = defaultCourses;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.allAvailableCourses = defaultCourses;
        this.cdr.detectChanges();
      }
    });
  }

  filterFaculty(): void {
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredFacultyList = this.facultyList.filter(f => {
      const matchSearch = !q ||
        f.name.toLowerCase().includes(q) ||
        f.email.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q);
      const matchDept = !this.filterDepartment || f.department === this.filterDepartment;
      const matchDesig = !this.filterDesignation || f.designation === this.filterDesignation;
      return matchSearch && matchDept && matchDesig;
    });

    this.currentPage = 1;
    this.updatePagination();
  }

  onSearchChange(): void {
    this.filterFaculty();
  }

  onFilterChange(): void {
    this.filterFaculty();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  private updatePagination(): void {
    this.totalPages = Math.max(1, Math.ceil(this.filteredFacultyList.length / this.pageSize));
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedFacultyList = this.filteredFacultyList.slice(start, end);
    this.startIndex = this.filteredFacultyList.length === 0 ? 0 : start + 1;
    this.endIndex = Math.min(end, this.filteredFacultyList.length);
    this.cdr.detectChanges();
  }

  openAddForm(): void {
    this.showForm = true;
    this.isEditMode = false;
    this.resetForm();
    this.formData.id = this.generateId();
    this.formData.password = 'Welcome@123';
  }

  openEditForm(faculty: Faculty): void {
    this.showForm = true;
    this.isEditMode = true;
    this.currentId = faculty.id;
    this.formData = {
      id: faculty.id,
      name: faculty.name,
      email: faculty.email,
      password: faculty.password || 'password',
      department: faculty.department,
      designation: faculty.designation,
      selectedCourses: faculty.courses ? [...faculty.courses] : []
    };
  }

  closeForm(): void {
    this.showForm = false;
    this.resetForm();
  }

  private resetForm(): void {
    this.formData = {
      id: '',
      name: '',
      email: '',
      password: '',
      department: 'Computer Science & Engineering',
      designation: 'Assistant Professor',
      selectedCourses: []
    };
    this.currentId = null;
  }

  isCourseSelected(course: any): boolean {
    if (!course) return false;
    const title = typeof course === 'string' ? course : (course.title || '');
    const code = typeof course === 'string' ? course : (course.code || '');
    return this.formData.selectedCourses.some(sc => 
      (sc && title && sc.trim().toLowerCase() === title.trim().toLowerCase()) || 
      (sc && code && sc.trim().toLowerCase() === code.trim().toLowerCase())
    );
  }

  toggleCourseSelection(course: any): void {
    if (!course) return;
    const title = typeof course === 'string' ? course : (course.title || '');
    const code = typeof course === 'string' ? course : (course.code || '');
    const key = code || title;

    const idx = this.formData.selectedCourses.findIndex(sc => 
      (sc && title && sc.trim().toLowerCase() === title.trim().toLowerCase()) || 
      (sc && code && sc.trim().toLowerCase() === code.trim().toLowerCase())
    );

    if (idx !== -1) {
      this.formData.selectedCourses.splice(idx, 1);
    } else {
      this.formData.selectedCourses.push(key);
    }
  }

  saveFaculty(): void {
    if (!this.validateForm()) {
      this.toast.warning('Please fill all required fields (Faculty ID, Name, Email, Department, Designation)');
      return;
    }

    const originalId = this.currentId;
    const newFacultyId = this.formData.id.trim().toUpperCase();
    const facultyName = this.formData.name.trim();
    const facultyEmail = this.formData.email.trim();
    const facultyPassword = this.formData.password.trim() || 'Welcome@123';

    const existingFaculty = originalId ? this.facultyList.find(f => f.id === originalId) : null;
    const assignedCourses = existingFaculty?.courses ? [...existingFaculty.courses] : [];

    // Check if new ID already exists on a different faculty profile
    if (!this.isEditMode || (originalId && originalId.toUpperCase() !== newFacultyId)) {
      const exists = this.facultyList.some(f => f.id.toUpperCase() === newFacultyId && f.id !== originalId);
      if (exists) {
        this.toast.error(`Faculty ID "${newFacultyId}" is already assigned to another faculty member.`);
        return;
      }
    }

    const facultyObj: Faculty = {
      id: newFacultyId,
      name: facultyName,
      email: facultyEmail,
      password: facultyPassword,
      department: this.formData.department.trim(),
      designation: this.formData.designation.trim(),
      courses: assignedCourses
    };

    // 1. Update Faculty List in state & localStorage
    if (this.isEditMode && originalId) {
      const idx = this.facultyList.findIndex(f => f.id === originalId);
      if (idx !== -1) {
        this.facultyList[idx] = facultyObj;
      } else {
        this.facultyList.unshift(facultyObj);
      }
    } else {
      this.facultyList.unshift(facultyObj);
    }

    try {
      localStorage.setItem('obslmsFaculty', JSON.stringify(this.facultyList));
    } catch {}

    // 2. Save / Update User in Login Authentication Database (`obslmsUsersDatabase`)
    try {
      const storedUsers = localStorage.getItem('obslmsUsersDatabase');
      const usersList = storedUsers ? JSON.parse(storedUsers) : [];
      
      const filtered = usersList.filter((u: any) => 
        (originalId ? u.id !== originalId : true) && u.email?.toLowerCase() !== facultyEmail.toLowerCase()
      );

      const userRecord = {
        id: newFacultyId,
        name: facultyName,
        email: facultyEmail,
        password: facultyPassword,
        role: 'FACULTY',
        department: this.formData.department.trim(),
        designation: this.formData.designation.trim(),
        assignedCourses: assignedCourses
      };

      filtered.push(userRecord);
      localStorage.setItem('obslmsUsersDatabase', JSON.stringify(filtered));
    } catch {}

    // 3. Update Course Allocations in `obslmsCourses` & `obslmsFacultyAllocations`
    try {
      const courses = this.courseService.getCoursesSync();
      let updatedCourses = false;

      courses.forEach(c => {
        if (assignedCourses.includes(c.title) || assignedCourses.includes(c.code)) {
          c.faculty = facultyName;
          updatedCourses = true;
        } else if (c.faculty === facultyName && !assignedCourses.includes(c.title) && !assignedCourses.includes(c.code)) {
          c.faculty = 'Faculty Board';
          updatedCourses = true;
        }
      });

      if (updatedCourses) {
        localStorage.setItem('obslmsCourses', JSON.stringify(courses));
      }

      const storedAlloc = localStorage.getItem('obslmsFacultyAllocations');
      let allocList: any[] = storedAlloc ? JSON.parse(storedAlloc) : [];
      if (!Array.isArray(allocList)) allocList = [];
      allocList = allocList.filter(a => a.facultyId !== newFacultyId && a.facultyId !== originalId && a.facultyName?.toLowerCase().trim() !== facultyName.toLowerCase().trim());

      this.formData.selectedCourses.forEach((cTitle, idx) => {
        allocList.push({
          id: `${newFacultyId}-${idx}-${Date.now()}`,
          facultyId: newFacultyId,
          facultyName: facultyName,
          courseId: newFacultyId,
          courseName: this.formData.department.trim(),
          subjectId: cTitle,
          subjectName: cTitle,
          semester: 'Semester 3'
        });
      });
      localStorage.setItem('obslmsFacultyAllocations', JSON.stringify(allocList));
      this.syncService.emit('COURSES_CHANGED');
    } catch {}

    this.filterFaculty();
    this.closeForm();
    this.toast.success(`Faculty profile "${facultyName}" (ID: ${newFacultyId}) saved! 🎉`);
    this.cdr.detectChanges();

    // 4. If ID changed in edit mode, delete old ID in backend first
    if (this.isEditMode && originalId && originalId !== newFacultyId) {
      this.http.delete('http://localhost:8080/api/users/' + originalId).subscribe({
        next: () => {},
        error: () => {}
      });
    }

    // 5. Background Sync to Spring Boot Backend
    const payload = {
      id: newFacultyId,
      name: facultyName,
      email: facultyEmail,
      password: facultyPassword,
      role: 'FACULTY',
      department: this.formData.department.trim(),
      designation: this.formData.designation.trim(),
      assignedCourses: assignedCourses
    };

    this.http.post('http://localhost:8080/api/users', payload).subscribe({
      next: () => {
        this.loadFaculty();
        this.syncService.emit('FACULTY_CHANGED', payload);
        this.syncService.emit('COURSES_CHANGED');
      },
      error: () => {}
    });
  }

  deleteFaculty(id: string): void {
    if (!confirm('Are you sure you want to remove this faculty profile and login credentials?')) {
      return;
    }
    const facultyToDelete = this.facultyList.find(f => f.id === id);
    this.facultyList = this.facultyList.filter(f => f.id !== id);
    
    try {
      localStorage.setItem('obslmsFaculty', JSON.stringify(this.facultyList));

      const storedUsers = localStorage.getItem('obslmsUsersDatabase');
      if (storedUsers) {
        const usersList = JSON.parse(storedUsers);
        const filtered = usersList.filter((u: any) => u.id !== id && u.email !== facultyToDelete?.email);
        localStorage.setItem('obslmsUsersDatabase', JSON.stringify(filtered));
      }

      if (facultyToDelete) {
        const courses = this.courseService.getCoursesSync();
        courses.forEach(c => {
          if (c.faculty === facultyToDelete.name) {
            c.faculty = 'Faculty Board';
          }
        });
        localStorage.setItem('obslmsCourses', JSON.stringify(courses));
        this.syncService.emit('COURSES_CHANGED');
      }
    } catch {}

    this.filterFaculty();
    this.toast.info('Faculty member and credentials removed.');
    this.cdr.detectChanges();

    this.http.delete('http://localhost:8080/api/users/' + id).subscribe({
      next: () => {
        this.syncService.emit('FACULTY_CHANGED', { id });
        this.syncService.emit('COURSES_CHANGED');
      },
      error: () => {}
    });
  }

  downloadFacultyCsv(): void {
    if (this.facultyList.length === 0) {
      this.toast.warning('No faculty records to export.');
      return;
    }

    const headers = ['Faculty ID', 'Name', 'Email', 'Password', 'Department', 'Designation', 'Assigned Courses'];
    const rows = this.facultyList.map(f => [
      `"${f.id}"`,
      `"${f.name}"`,
      `"${f.email}"`,
      `"${f.password || 'password'}"`,
      `"${f.department}"`,
      `"${f.designation}"`,
      `"${(f.courses || []).join('; ')}"`
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Faculty_Institutional_Roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toast.success('Faculty roster CSV exported successfully.');
  }

  private validateForm(): boolean {
    return !!(
      this.formData.id.trim() &&
      this.formData.name.trim() &&
      this.formData.email.trim() &&
      this.formData.department &&
      this.formData.designation
    );
  }

  private generateId(): string {
    const existingNums = this.facultyList
      .map(f => f.id)
      .filter(id => id && id.toUpperCase().startsWith('FAC'))
      .map(id => {
        const digits = id.replace(/[^0-9]/g, '');
        return digits ? parseInt(digits, 10) : 0;
      })
      .filter(num => !isNaN(num) && num > 0 && num < 10000);

    const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 0;
    const nextNum = maxNum + 1;
    return 'FAC' + String(nextNum).padStart(3, '0');
  }

  getCoursesDisplay(courses: string[]): string {
    return courses && courses.length > 0 ? courses.slice(0, 2).join(', ') + (courses.length > 2 ? `... +${courses.length - 2}` : '') : 'None';
  }

  private getSafeJson(key: string): any {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }
}
