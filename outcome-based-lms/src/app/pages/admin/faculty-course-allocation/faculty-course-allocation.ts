import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../../shared/navbar/navbar';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { Footer } from '../../../shared/footer/footer';
import { ToastService } from '../../../shared/services/toast.service';
import { CourseService, AppCourse, DEFAULT_DATABASE_COURSES } from '../../../shared/services/course.service';
import { HttpClient } from '@angular/common/http';

export interface FacultyAllocation {
  id: string;
  facultyId: string;
  facultyName: string;
  courseId: string;
  courseName: string;
  subjectId: string;
  subjectName: string;
  semester: string;
  credits?: number;
  ltp?: string;
  contactHours?: number;
}

export interface Faculty {
  id: string;
  name: string;
  email?: string;
  department?: string;
  designation?: string;
  courses?: string[];
}

export interface Course {
  id: string;
  name: string;
  code: string;
  icon?: string;
}

export interface CourseSubject {
  id: string;
  courseId: string;
  courseName: string;
  subjectId: string;
  subjectName: string;
  semester?: string;
  credits?: number;
  ltp?: string;
  contactHours?: number;
}

export interface FacultyWorkloadGroup {
  facultyId: string;
  facultyName: string;
  department: string;
  designation: string;
  email: string;
  allocations: FacultyAllocation[];
  totalSubjects: number;
  totalCredits: number;
  totalHours: number;
  semestersCovered: string[];
}

export interface SemesterMatrixGroup {
  semester: string;
  subjects: {
    code: string;
    title: string;
    credits: number;
    ltp: string;
    contactHours: number;
    department: string;
    facultyName: string;
    facultyId: string;
    allocationId?: string;
  }[];
  totalCredits: number;
  totalHours: number;
}

const DEFAULT_FACULTY_ROSTER: Faculty[] = [
  { id: 'FAC001', name: 'Dr. Ramesh Babu', department: 'Computer Science & Engineering', designation: 'Head of Department (HOD)', courses: ['CS101', 'CS102', 'CS103'] },
  { id: 'FAC002', name: 'Prof. Sunita Sharma', department: 'Computer Science & Engineering', designation: 'Associate Professor', courses: ['CS102', 'CS202'] },
  { id: 'FAC003', name: 'Dr. Amit Patel', department: 'Electronics & Communication Engineering', designation: 'Associate Professor', courses: ['CS201', 'CS303', 'EC201'] },
  { id: 'FAC004', name: 'Dr. Priya Nair', department: 'Information Technology', designation: 'Professor', courses: ['CS301', 'IT201', 'IT301'] },
  { id: 'FAC005', name: 'Prof. Rajesh Verma', department: 'Computer Science & Engineering', designation: 'Associate Professor', courses: ['CS302', 'CS402'] },
  { id: 'FAC006', name: 'Dr. Suresh Kumar', department: 'Civil Engineering', designation: 'Head of Department (HOD)', courses: ['CE111', 'CE201', 'CE301'] },
  { id: 'FAC007', name: 'Dr. Ananya Mishra', department: 'Mechanical Engineering', designation: 'Associate Professor', courses: ['ME111', 'ME201', 'ME301'] },
  { id: 'FAC008', name: 'Prof. Deepa Reddy', department: 'Electronics & Communication Engineering', designation: 'Associate Professor', courses: ['EC111', 'EC201', 'EC301'] },
  { id: 'FAC009', name: 'Dr. V. C. Reddy', department: 'Information Technology', designation: 'Head of Department (HOD)', courses: ['IT111', 'IT201', 'IT401'] },
  { id: 'FAC010', name: 'Prof. Meenakshi Iyer', department: 'Computer Science & Engineering', designation: 'Assistant Professor', courses: ['CS111', 'CS121'] },
  { id: 'FAC011', name: 'Dr. Alok Nath', department: 'Civil Engineering', designation: 'Associate Professor', courses: ['CE201', 'CE301', 'CE401'] },
  { id: 'FAC012', name: 'Prof. Snehalata Das', department: 'Electronics & Communication Engineering', designation: 'Assistant Professor', courses: ['EC201', 'EC301', 'EC401'] },
  { id: 'FAC013', name: 'Dr. Manoj Joshi', department: 'Computer Science & Engineering', designation: 'Associate Professor', courses: ['CS101', 'CS201'] },
  { id: 'FAC014', name: 'Dr. Kavita Menon', department: 'Computer Science & Engineering', designation: 'Assistant Professor', courses: ['CS401', 'CS402'] },
  { id: 'FAC015', name: 'Prof. Arun Roy', department: 'Mechanical Engineering', designation: 'Associate Professor', courses: ['ME201', 'ME301', 'ME401'] },
  { id: 'FAC-1788427317827-699', name: 'Dr. Prasanth Kumar', department: 'Computer Science & Engineering', designation: 'Professor', courses: ['CS101', 'CS102', 'CS103'] }
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

  // Dual View Mode: 'faculty' = Faculty Workload Deck, 'matrix' = Branch & Semester Matrix
  currentView: 'faculty' | 'matrix' = 'faculty';

  // Workload Accordion State
  expandedFacultyIds = new Set<string>();

  allocationList: FacultyAllocation[] = [];
  filteredAllocationList: FacultyAllocation[] = [];
  
  facultyList: Faculty[] = [];
  courseList: Course[] = [
    { id: 'PRG_CSE', name: 'Computer Science & Engineering', code: 'CSE', icon: '💻' },
    { id: 'PRG_IT', name: 'Information Technology', code: 'IT', icon: '🌐' },
    { id: 'PRG_ECE', name: 'Electronics & Communication Engineering', code: 'ECE', icon: '📡' },
    { id: 'PRG_ME', name: 'Mechanical Engineering', code: 'ME', icon: '⚙️' },
    { id: 'PRG_CE', name: 'Civil Engineering', code: 'CE', icon: '🏗️' },
    { id: 'PRG_EEE', name: 'Electrical & Electronics Engineering', code: 'EEE', icon: '⚡' }
  ];
  courseSubjectList: CourseSubject[] = [];
  allRawCourses: AppCourse[] = [];
  
  // Matrix View State
  selectedMatrixCourseId = 'PRG_CSE';
  selectedMatrixSemester = '';

  // Filtered subjects based on selected course in modal
  availableSubjects: CourseSubject[] = [];
  
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

  // Computed KPIs
  get totalActiveFacultyCount(): number {
    return this.groupedFacultyWorkload.filter(f => f.totalSubjects > 0).length;
  }

  get totalAllocationsCount(): number {
    return this.allocationList.length;
  }

  get averageCreditsPerFaculty(): number {
    if (this.totalActiveFacultyCount === 0) return 0;
    const totalCr = this.groupedFacultyWorkload.reduce((acc, f) => acc + f.totalCredits, 0);
    return Math.round((totalCr / this.totalActiveFacultyCount) * 10) / 10;
  }

  get unassignedSubjectsCount(): number {
    const assignedCodes = new Set(this.allocationList.map(a => (a.subjectId || '').toUpperCase().trim()));
    return this.allRawCourses.filter(c => !assignedCodes.has((c.code || '').toUpperCase().trim())).length;
  }

  // Grouped Faculty Workload
  get groupedFacultyWorkload(): FacultyWorkloadGroup[] {
    const map = new Map<string, FacultyWorkloadGroup>();

    // 1. Initialize all faculty members
    for (const fac of this.facultyList) {
      const idKey = (fac.id || fac.name).toUpperCase();
      map.set(idKey, {
        facultyId: fac.id,
        facultyName: fac.name,
        department: fac.department || 'Computer Science & Engineering',
        designation: fac.designation || 'Faculty Member',
        email: fac.email || `${fac.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@oblms.edu`,
        allocations: [],
        totalSubjects: 0,
        totalCredits: 0,
        totalHours: 0,
        semestersCovered: []
      });
    }

    // 2. Map all allocations
    for (const alloc of this.allocationList) {
      const facKey = (alloc.facultyId || alloc.facultyName).toUpperCase();
      let group = map.get(facKey);
      if (!group) {
        // Try find by name
        const byName = Array.from(map.values()).find(g => g.facultyName.toLowerCase().trim() === alloc.facultyName.toLowerCase().trim());
        if (byName) {
          group = byName;
        } else {
          group = {
            facultyId: alloc.facultyId || `FAC-${Date.now()}`,
            facultyName: alloc.facultyName,
            department: alloc.courseName || 'Engineering',
            designation: 'Faculty Instructor',
            email: `${alloc.facultyName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@oblms.edu`,
            allocations: [],
            totalSubjects: 0,
            totalCredits: 0,
            totalHours: 0,
            semestersCovered: []
          };
          map.set(facKey, group);
        }
      }

      // Compute credits and hours for this allocation
      const rawCourse = this.allRawCourses.find(c => 
        (c.code && c.code.toLowerCase() === alloc.subjectId.toLowerCase()) ||
        (c.title && c.title.toLowerCase() === alloc.subjectName.toLowerCase())
      );

      const credits = rawCourse ? (rawCourse.code?.endsWith('L') ? 1.5 : (rawCourse.code?.startsWith('CS49') ? 8 : (rawCourse.code?.startsWith('CS11') ? 3 : 4))) : (alloc.subjectId?.endsWith('L') ? 1.5 : 3);
      const ltp = rawCourse?.code?.endsWith('L') ? '0-0-3' : (credits === 4 ? '3-1-0' : '3-0-0');
      const hours = rawCourse?.code?.endsWith('L') ? 3 : (credits === 4 ? 4 : 3);

      const enrichedAlloc: FacultyAllocation = {
        ...alloc,
        credits: credits,
        ltp: ltp,
        contactHours: hours
      };

      group.allocations.push(enrichedAlloc);
      group.totalSubjects += 1;
      group.totalCredits += credits;
      group.totalHours += hours;

      const semClean = alloc.semester || 'Semester 1';
      if (!group.semestersCovered.includes(semClean)) {
        group.semestersCovered.push(semClean);
      }
    }

    // Sort semesters for each group
    for (const group of map.values()) {
      group.semestersCovered.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }

    return Array.from(map.values()).sort((a, b) => b.totalSubjects - a.totalSubjects);
  }

  // Filtered Faculty Workload for Search & Department
  get filteredFacultyWorkload(): FacultyWorkloadGroup[] {
    const q = this.searchQuery.toLowerCase().trim();
    const courseF = this.filterCourse;
    const facF = this.filterFaculty;

    return this.groupedFacultyWorkload.filter(group => {
      const matchSearch = !q || 
        group.facultyName.toLowerCase().includes(q) ||
        group.department.toLowerCase().includes(q) ||
        group.designation.toLowerCase().includes(q) ||
        group.allocations.some(a => a.subjectId.toLowerCase().includes(q) || a.subjectName.toLowerCase().includes(q));

      const matchDept = !courseF || group.allocations.some(a => a.courseId === courseF) || group.department.toLowerCase().includes(this.getCourseCode(courseF).toLowerCase());
      const matchFac = !facF || group.facultyId === facF || group.facultyName === facF;

      return matchSearch && matchDept && matchFac;
    });
  }

  // Branch & Semester Matrix Grouping
  get branchSemesterMatrix(): SemesterMatrixGroup[] {
    const targetBranch = this.courseList.find(c => c.id === this.selectedMatrixCourseId) || this.courseList[0];
    const semFilter = this.selectedMatrixSemester;
    const q = this.searchQuery.toLowerCase().trim();

    const result: SemesterMatrixGroup[] = [];

    for (const sem of this.semesters) {
      if (semFilter && semFilter !== sem) continue;

      // Find all courses for this branch and semester
      const matchingRaw = this.allRawCourses.filter(c => {
        const prog = this.inferProgram(c.code, c.title);
        const matchBranch = prog.id === targetBranch.id;
        const matchSem = this.normalizeSemester(c.semester, c.code) === sem;
        const matchSearch = !q || (c.title && c.title.toLowerCase().includes(q)) || (c.code && c.code.toLowerCase().includes(q));
        return matchBranch && matchSem && matchSearch;
      });

      if (matchingRaw.length === 0 && semFilter) continue;

      const subjects = matchingRaw.map(c => {
        // Find assigned faculty from allocationList or course
        const alloc = this.allocationList.find(a => 
          a.subjectId.toUpperCase() === c.code.toUpperCase() &&
          a.courseId === targetBranch.id
        ) || this.allocationList.find(a => a.subjectId.toUpperCase() === c.code.toUpperCase());

        const facName = alloc ? alloc.facultyName : (c.faculty && c.faculty !== 'Faculty Board' ? c.faculty : 'Unassigned');
        const facId = alloc ? alloc.facultyId : '';

        const credits = c.code?.endsWith('L') ? 1.5 : (c.code?.startsWith('CS49') ? 8 : (c.code?.startsWith('CS11') ? 3 : 4));
        const ltp = c.code?.endsWith('L') ? '0-0-3' : (credits === 4 ? '3-1-0' : '3-0-0');
        const hours = c.code?.endsWith('L') ? 3 : (credits === 4 ? 4 : 3);

        return {
          code: c.code,
          title: c.title,
          credits: credits,
          ltp: ltp,
          contactHours: hours,
          department: targetBranch.name,
          facultyName: facName,
          facultyId: facId,
          allocationId: alloc?.id
        };
      });

      const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
      const totalHours = subjects.reduce((sum, s) => sum + s.contactHours, 0);

      result.push({
        semester: sem,
        subjects: subjects,
        totalCredits: Math.round(totalCredits * 10) / 10,
        totalHours: totalHours
      });
    }

    return result;
  }

  get currentMatrixProgram(): Course {
    return this.courseList.find(c => c.id === this.selectedMatrixCourseId) || this.courseList[0];
  }

  ngOnInit(): void {
    this.loadAllData();
  }

  // View Switcher
  switchView(view: 'faculty' | 'matrix'): void {
    this.currentView = view;
    this.searchQuery = '';
    this.filterCourse = '';
    this.filterFaculty = '';
  }

  selectMatrixCourse(courseId: string): void {
    this.selectedMatrixCourseId = courseId;
  }

  selectMatrixSemester(sem: string): void {
    this.selectedMatrixSemester = sem;
  }

  // Accordion Expand / Collapse
  toggleExpandFaculty(facultyId: string): void {
    if (this.expandedFacultyIds.has(facultyId)) {
      this.expandedFacultyIds.delete(facultyId);
    } else {
      this.expandedFacultyIds.add(facultyId);
    }
  }

  isFacultyExpanded(facultyId: string): boolean {
    // By default, if fewer than 5 faculty, expand the first 2, or check set
    return this.expandedFacultyIds.has(facultyId);
  }

  expandAllFaculty(): void {
    this.groupedFacultyWorkload.forEach(f => this.expandedFacultyIds.add(f.facultyId));
  }

  collapseAllFaculty(): void {
    this.expandedFacultyIds.clear();
  }

  private getCourseCode(courseId: string): string {
    const found = this.courseList.find(c => c.id === courseId);
    return found ? found.code : '';
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
    const localCourses = this.courseService.ensureCoursesInitialized();
    this.allRawCourses = (localCourses && localCourses.length > 0) ? localCourses : [...DEFAULT_DATABASE_COURSES];

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
                designation: u.designation || 'Associate Professor',
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
            designation: u.designation || 'Assistant Professor',
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
        const fac = this.facultyList.find(f => f.name.toLowerCase().trim() === c.faculty.toLowerCase().trim());
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
          
          if (refClean.includes('mca') || refClean.startsWith('inmca') || refClean.startsWith('rlmca')) {
            continue;
          }

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

    // 3. Add any saved in localStorage
    try {
      const storedAllocations = localStorage.getItem('obslmsFacultyAllocations');
      if (storedAllocations) {
        const parsed = JSON.parse(storedAllocations);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item.facultyName && item.subjectId) {
              const subCode = (item.subjectId || '').trim().toUpperCase();
              const subTitle = (item.subjectName || '').trim().toUpperCase();

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

    // Initially expand first 3 faculty for quick visibility
    this.groupedFacultyWorkload.slice(0, 3).forEach(f => this.expandedFacultyIds.add(f.facultyId));

    this.cdr.detectChanges();
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

  onSearchChange(): void {}
  onFilterChange(): void {}

  openAddForm(): void {
    this.showForm = true;
    this.isEditMode = false;
    this.resetForm();
    this.formData.courseId = this.courseList[0].id;
    this.onCourseChange();
  }

  openAddForFaculty(fac: FacultyWorkloadGroup): void {
    this.showForm = true;
    this.isEditMode = false;
    this.resetForm();
    this.formData.facultyId = fac.facultyId;
    
    // Find department id matching faculty
    const matchCourse = this.courseList.find(c => fac.department.toLowerCase().includes(c.code.toLowerCase()));
    if (matchCourse) {
      this.formData.courseId = matchCourse.id;
    } else {
      this.formData.courseId = this.courseList[0].id;
    }
    this.onCourseChange();
  }

  openAssignModalForSubject(subjectCode: string, sem: string, branchId: string): void {
    this.showForm = true;
    this.isEditMode = false;
    this.resetForm();
    this.formData.courseId = branchId;
    this.onCourseChange();
    this.formData.subjectId = subjectCode;
    this.formData.semester = sem;
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
      this.toast.success(`Allocation updated for "${faculty.name}"! 🎉`);
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

    // Auto-expand this faculty's card to show the newly added subject
    this.expandedFacultyIds.add(faculty.id);

    // Update faculty assigned subjects in list & storage
    if (faculty.courses && !faculty.courses.includes(subjectCode)) {
      faculty.courses.push(subjectCode);
    }
    try {
      localStorage.setItem('obslmsFaculty', JSON.stringify(this.facultyList));
      localStorage.setItem('obslmsFacultyAllocations', JSON.stringify(this.allocationList));
    } catch {}

    this.closeForm();
    this.cdr.detectChanges();

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
    if (!allocation) return;

    if (!confirm(`Are you sure you want to remove ${allocation.subjectId} (${allocation.subjectName}) from ${allocation.facultyName}?`)) {
      return;
    }

    this.allocationList = this.allocationList.filter(a => a.id !== id);
    
    // Also remove from faculty.courses
    const fac = this.facultyList.find(f => f.id === allocation.facultyId || f.name.toLowerCase() === allocation.facultyName.toLowerCase());
    if (fac && fac.courses) {
      fac.courses = fac.courses.filter(c => c.toUpperCase() !== allocation.subjectId.toUpperCase());
    }

    try {
      localStorage.setItem('obslmsFaculty', JSON.stringify(this.facultyList));
      localStorage.setItem('obslmsFacultyAllocations', JSON.stringify(this.allocationList));
    } catch {}

    this.toast.info(`Subject ${allocation.subjectId} removed from "${allocation.facultyName}".`);
    this.cdr.detectChanges();

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

  private validateForm(): boolean {
    return !!(
      this.formData.facultyId &&
      this.formData.courseId &&
      this.formData.subjectId &&
      this.formData.semester
    );
  }
}
