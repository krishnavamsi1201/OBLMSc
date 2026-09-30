import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Navbar } from '../../../shared/navbar/navbar';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { Footer } from '../../../shared/footer/footer';
import { ToastService } from '../../../shared/services/toast.service';

interface CourseSubject {
  id: string;
  courseId: string;
  courseName: string; // Academic Program e.g. B.Tech - Computer Science & Engineering
  subjectId: string;   // Subject Code e.g. CS101, IT111
  subjectName: string; // Subject Title e.g. Database Management Systems
  credits: number;
}

interface AcademicProgram {
  id: string;
  name: string;
  code: string;
  department: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
  department?: string;
  semester?: string;
}

@Component({
  selector: 'app-course-subject-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  templateUrl: './course-subject-assignment.html',
  styleUrls: ['./course-subject-assignment.css'],
})
export class CourseSubjectAssignment implements OnInit {
  private toast = inject(ToastService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  courseSubjectList: CourseSubject[] = [];
  filteredCourseSubjectList: CourseSubject[] = [];
  
  // Department / Branch Names
  courseList: AcademicProgram[] = [
    { id: 'PRG_CSE', name: 'Computer Science & Engineering', code: 'CSE', department: 'Computer Science & Engineering' },
    { id: 'PRG_IT', name: 'Information Technology', code: 'IT', department: 'Information Technology' },
    { id: 'PRG_ECE', name: 'Electronics & Communication Engineering', code: 'ECE', department: 'Electronics & Communication Engineering' },
    { id: 'PRG_ME', name: 'Mechanical Engineering', code: 'ME', department: 'Mechanical Engineering' },
    { id: 'PRG_CE', name: 'Civil Engineering', code: 'CE', department: 'Civil Engineering' },
    { id: 'PRG_EEE', name: 'Electrical & Electronics Engineering', code: 'EEE', department: 'Electrical & Electronics Engineering' },
    { id: 'PRG_MTECH', name: 'Data Science & AI', code: 'M.Tech', department: 'Computer Science & Engineering' }
  ];

  subjectList: Subject[] = [];
  
  // Pagination
  currentPage = 1;
  pageSize = 25;
  pageSizeOptions = [10, 25, 50, 100, 250];

  get totalPages(): number {
    return Math.ceil(this.filteredCourseSubjectList.length / this.pageSize) || 1;
  }

  get pagedCourseSubjectList(): CourseSubject[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCourseSubjectList.slice(start, start + this.pageSize);
  }

  get startIndex(): number {
    return this.filteredCourseSubjectList.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredCourseSubjectList.length);
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
    courseId: 'PRG_CSE',
    subjectId: '',
    credits: 4
  };

  // Filter and search
  searchQuery = '';
  filterCourse = '';

  ngOnInit(): void {
    this.loadSubjectsAndAssignments();
  }

  private inferProgramForSubject(code: string, title: string): AcademicProgram {
    const c = (code || '').toUpperCase().trim();
    const t = (title || '').toLowerCase().trim();

    if (c.startsWith('IT') || c.startsWith('INF') || t.includes('information technology')) {
      return this.courseList[1]; // IT
    }
    if (c.startsWith('EC') || c.startsWith('ECE') || t.includes('electronics') || t.includes('communication') || t.includes('vlsi') || t.includes('dsp')) {
      return this.courseList[2]; // ECE
    }
    if ((c.startsWith('ME') || c.startsWith('MEC')) && !c.startsWith('MES')) {
      return this.courseList[3]; // ME
    }
    if (c.startsWith('CE') || c.startsWith('CIV') || t.includes('civil') || t.includes('structural') || t.includes('concrete')) {
      return this.courseList[4]; // CE
    }
    if (c.startsWith('EE') || c.startsWith('EEE') || t.includes('electrical machines') || t.includes('power systems')) {
      return this.courseList[5]; // EEE
    }
    // Default CSE
    return this.courseList[0]; // CSE
  }

  private loadSubjectsAndAssignments(): void {
    this.http.get<any[]>('http://localhost:8080/api/courses').subscribe({
      next: (courses) => {
        if (Array.isArray(courses) && courses.length > 0) {
          this.buildAssignmentsFromCourses(courses);
        } else {
          this.buildDefaultFallback();
        }
      },
      error: () => {
        this.buildDefaultFallback();
      }
    });
  }

  private sanitizeCourseSubjects(): void {
    for (const item of this.courseSubjectList) {
      const prog = this.inferProgramForSubject(item.subjectId, item.subjectName);
      item.courseName = prog.name;
      item.courseId = prog.id;
    }
  }

  private buildAssignmentsFromCourses(courses: any[]): void {
    this.subjectList = courses.map((c, idx) => ({
      id: c.code || `SUB${idx}`,
      name: c.title || 'Curriculum Subject',
      code: c.code || '',
      credits: (c.code && c.code.endsWith('L')) ? 2 : (c.code && (c.code.includes('P') || c.code.includes('498') || c.code.includes('499'))) ? 6 : 4,
      semester: c.semester || 'Semester 1'
    }));

    this.courseSubjectList = courses.map((c, idx) => {
      const prog = this.inferProgramForSubject(c.code, c.title);
      const code = c.code || `SUB${idx}`;
      const credits = (code.endsWith('L')) ? 2 : (code.includes('P') || code.includes('498') || code.includes('499')) ? 6 : 4;
      return {
        id: `CSA-${code}-${idx}`,
        courseId: prog.id,
        courseName: prog.name,
        subjectId: code,
        subjectName: c.title || 'Curriculum Subject',
        credits: credits
      };
    });

    this.sanitizeCourseSubjects();

    try {
      localStorage.setItem('obslmsCourseSubjects', JSON.stringify(this.courseSubjectList));
    } catch {}

    this.filterCourseSubjects();
    this.cdr.detectChanges();
  }

  private buildDefaultFallback(): void {
    try {
      const stored = localStorage.getItem('obslmsCourseSubjects');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.courseSubjectList = parsed.filter(cs => {
            const id = (cs.subjectId || '').toUpperCase();
            const name = (cs.subjectName || '').toUpperCase();
            return !id.includes('MCA') && !name.includes('MCA') && !id.startsWith('INMCA') && !id.startsWith('RLMCA');
          });
        }
        this.sanitizeCourseSubjects();
      }
    } catch {}

    if (this.courseSubjectList.length === 0) {
      // Build from default accredited courses
      const defaultData = [
        { code: 'CS101', title: 'Database Management Systems', credits: 4 },
        { code: 'CS102', title: 'Data Structures & Algorithms', credits: 4 },
        { code: 'CS103', title: 'Object-Oriented Programming with Java', credits: 4 },
        { code: 'CS201', title: 'Operating Systems & Kernel Architecture', credits: 4 },
        { code: 'CS202', title: 'Machine Learning & Data Science', credits: 4 },
        { code: 'CS301', title: 'Computer Networks & Protocols', credits: 4 },
        { code: 'IT201', title: 'Data Structures using C++', credits: 4 },
        { code: 'EC201', title: 'Electronic Devices & Circuits', credits: 4 },
        { code: 'ME201', title: 'Engineering Thermodynamics', credits: 4 },
        { code: 'CE201', title: 'Strength of Materials & Mechanics', credits: 4 }
      ];

      this.courseSubjectList = defaultData.map((d, idx) => {
        const prog = this.inferProgramForSubject(d.code, d.title);
        return {
          id: `CSA-${d.code}-${idx}`,
          courseId: prog.id,
          courseName: prog.name,
          subjectId: d.code,
          subjectName: d.title,
          credits: d.credits
        };
      });
    }

    this.sanitizeCourseSubjects();

    try {
      localStorage.setItem('obslmsCourseSubjects', JSON.stringify(this.courseSubjectList));
    } catch {}

    this.filterCourseSubjects();
    this.cdr.detectChanges();
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
      this.toast.warning('Please select both course and subject');
      return;
    }

    // Check if this course-subject combo already exists (when adding new)
    if (!this.isEditMode) {
      const exists = this.courseSubjectList.some(
        cs => cs.courseId === this.formData.courseId && cs.subjectId === this.formData.subjectId
      );
      if (exists) {
        this.toast.error('This subject is already assigned to this course!');
        return;
      }
    }

    const course = this.courseList.find(c => c.id === this.formData.courseId);
    const subject = this.subjectList.find(s => s.id === this.formData.subjectId);

    if (!course || !subject) {
      this.toast.error('Invalid course or subject selection');
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
        this.toast.success(`Subject "${subject.name}" assignment updated.`);
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
      this.toast.success(`Subject "${subject.name}" assigned to "${course.name}".`);
    }

    this.saveCourseSubjectsToStorage();
    this.closeForm();
  }

  deleteAssignment(id: string): void {
    const cs = this.courseSubjectList.find(item => item.id === id);
    this.courseSubjectList = this.courseSubjectList.filter(item => item.id !== id);
    this.saveCourseSubjectsToStorage();
    this.toast.info(`Assignment ${cs ? cs.subjectName + ' → ' + cs.courseName : ''} unassigned.`);
  }

  private validateForm(): boolean {
    return !!(this.formData.courseId && this.formData.subjectId);
  }

  private saveCourseSubjectsToStorage(): void {
    try {
      localStorage.setItem('obslmsCourseSubjects', JSON.stringify(this.courseSubjectList));
      this.filterCourseSubjects();
    } catch {
      this.toast.error('Error saving assignment data');
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
