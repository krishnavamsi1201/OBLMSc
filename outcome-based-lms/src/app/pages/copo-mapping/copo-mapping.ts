import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { ToastService } from '../../shared/services/toast.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface ProgramOutcome {
  id: number;
  poNumber: string;
  description: string;
}

interface CourseOutcome {
  id: number;
  course: string;
  co: string;
  description?: string;
}

interface CoMapping {
  id: number;
  course: string;
  co: string;
  po: string;
  contribution: number;
  mappingLevel: number;
  status: 'Pending' | 'Approved';
}

@Component({
  selector: 'app-copo-mapping',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  templateUrl: './copo-mapping.html',
  styleUrls: ['./copo-mapping.css']
})
export class CopoMapping implements OnInit {
  private toast = inject(ToastService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  role: string | null = null;

  studentName = 'Student';
  studentEmail = '';
  studentPhoto: string | null = null;
  studentRoll = 'CUTM2026CSE042';
  studentDept = 'Computer Science & Engineering';

  appearance = {
    theme: 'light',
    colorScheme: 'blue',
    layout: 'comfortable',
    showSidebar: true,
    fontSize: 'medium'
  };

  themeStyles: { [key: string]: string } = {};

  studentNavGroups = [
    {
      title: 'ACADEMICS',
      items: [
        { label: 'Student Dashboard', path: '/students', icon: '🏠' },
        { label: 'Enrolled Courses', path: '/courses', icon: '📚' },
        { label: 'Subject List', path: '/subjects', icon: '📖' },
        { label: 'Weekly Timetable', path: '/timetable', icon: '📆' }
      ]
    },
    {
      title: 'OBE & OUTCOMES',
      items: [
        { label: 'Course Outcomes (CO)', path: '/course-outcomes', icon: '🎯' },
        { label: 'Program Outcomes (PO)', path: '/program-outcomes', icon: '🎯' },
        { label: 'CO-PO Mapping', path: '/copo-mapping', icon: '🔗' },
        { label: 'CO Attainment', path: '/co-attainment', icon: '📊' },
        { label: 'PO Attainment', path: '/po-attainment', icon: '📈' }
      ]
    },
    {
      title: 'EXAMINATIONS & MARKS',
      items: [
        { label: 'Upcoming Exams', path: '/assessments', icon: '📝' },
        { label: 'Attendance %', path: '/attendance', icon: '📅' },
        { label: 'Marks Summary', path: '/performance', icon: '📈' },
        { label: 'Semester Results', path: '/results', icon: '📄' }
      ]
    },
    {
      title: 'STUDENT SERVICES',
      items: [
        { label: 'Feedback Form', path: '/feedback', icon: '💬' },
        { label: 'File Grievance', path: '/grievance', icon: '📩' },
        { label: 'Notifications', path: '/notifications', icon: '🔔' },
        { label: 'Student Details', path: '/profile', icon: '👤' }
      ]
    }
  ];

  programOutcomes: ProgramOutcome[] = [];
  courseOutcomes: CourseOutcome[] = [];
  courses: string[] = [];
  selectedCourseOutcomeKey = '';

  newPoNumber = '';
  newPoDescription = '';
  newCoCourse = '';
  newCoCode = '';
  newCoDescription = '';

  selectedBranch: string = 'MY_BRANCH';

  branchCoursesMap: { [key: string]: string[] } = {
    'CSE': ['CS101', 'CS102', 'CS103', 'CS301', 'CS302', 'CS102L', 'RLMCA205', 'CC', 'OOP'],
    'IT': ['IT305', 'CS303', 'Linux', 'WT', 'CS361', 'Linux Lab', 'Open Lab'],
    'ECE': ['MES', 'DSLD', 'EC206', 'EE407', 'CS203', 'CS207', 'AMP', 'LD LAB'],
    'ME': ['ME210', 'KM', 'SMSE', '04ME6512', 'IC', 'AU203', 'EM IV'],
    'Civil': ['FMHM', 'SMSE', 'HS300', 'CE234', 'EMII', 'ECS']
  };

  get currentActiveBranch(): string {
    if (this.selectedBranch === 'MY_BRANCH') {
      const d = (this.studentDept || '').toLowerCase();
      if (d.includes('computer') || d.includes('cse')) return 'CSE';
      if (d.includes('information') || d.includes('it')) return 'IT';
      if (d.includes('electronic') || d.includes('ece')) return 'ECE';
      if (d.includes('mechanical') || d.includes('me')) return 'ME';
      if (d.includes('civil') || d.includes('ce')) return 'Civil';
      return 'CSE';
    }
    return this.selectedBranch;
  }

  get filteredGroupedMappings() {
    if (this.selectedBranch === 'ALL') return this.groupedMappings;
    const allowed = this.branchCoursesMap[this.currentActiveBranch] || [];
    return this.groupedMappings.filter(g => 
      allowed.some(ac => g.courseName.toLowerCase().includes(ac.toLowerCase()))
    );
  }

  get filteredCourseOutcomes() {
    if (this.selectedBranch === 'ALL') return this.courseOutcomes;
    const allowed = this.branchCoursesMap[this.currentActiveBranch] || [];
    return this.courseOutcomes.filter(co => 
      allowed.some(ac => (co.course || '').toLowerCase().includes(ac.toLowerCase()))
    );
  }

  mappingLevels = [
    { value: 1, label: '1 - Low (Slight focus <30%)' },
    { value: 2, label: '2 - Medium (Moderate focus 30-60%)' },
    { value: 3, label: '3 - High (Substantial focus >60%)' }
  ];

  showMatrix = true;
  mappings: CoMapping[] = [];
  groupedMappings: Array<{ courseName: string; mappings: CoMapping[] }> = [];
  collapsedGroups: { [courseName: string]: boolean } = {};

  currentMapping: CoMapping = { id: 0, course: '', co: '', po: '', contribution: 0, mappingLevel: 0, status: 'Pending' };
  editIndex = -1;

  constructor() {
    try {
      this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
      this.studentName = localStorage.getItem('userName') || 'Student';
      this.studentEmail = localStorage.getItem('userEmail') || 'student@centurionuniv.edu.in';
      this.studentPhoto = localStorage.getItem('userProfilePicture') || null;
      this.studentDept = localStorage.getItem('userDepartment') || 'Computer Science & Engineering';
      this.studentRoll = localStorage.getItem('userRoll') || 'CUTM2026CSE042';
    } catch {
      this.role = null;
    }
    this.loadAppearance();
  }

  ngOnInit(): void {
    this.loadData();
    this.loadCourses();
    this.resetMapping();
  }

  loadData() {
    this.loadProgramOutcomes();
    this.loadCourseOutcomes();
    this.loadMappings();
  }

  private loadProgramOutcomes() {
    const facultyParam = (this.role === 'faculty' && this.studentName) ? encodeURIComponent(this.studentName) : '';
    const url = facultyParam ? `http://localhost:8080/api/copo/po?faculty=${facultyParam}` : 'http://localhost:8080/api/copo/po';

    this.http.get<ProgramOutcome[]>(url).subscribe({
      next: (data) => {
        this.programOutcomes = data;
        this.cdr.detectChanges();
      }
    });
  }

  private loadCourseOutcomes() {
    const facultyParam = (this.role === 'faculty' && this.studentName) ? encodeURIComponent(this.studentName) : '';
    const url = facultyParam ? `http://localhost:8080/api/copo/co?faculty=${facultyParam}` : 'http://localhost:8080/api/copo/co';

    this.http.get<CourseOutcome[]>(url).subscribe({
      next: (data) => {
        let list = data;
        if (this.role === 'faculty') {
          let assigned: string[] = [];
          try {
            const stored = localStorage.getItem('userAssignedCourses');
            if (stored) assigned = JSON.parse(stored);
          } catch {}
          if (assigned.length > 0) {
            list = data.filter(item => 
              assigned.includes(item.course) || 
              assigned.some(a => item.course && item.course.toLowerCase().includes(a.toLowerCase()))
            );
          }
        }
        this.courseOutcomes = list;
        this.cdr.detectChanges();
      }
    });
  }

  private loadMappings() {
    const facultyParam = (this.role === 'faculty' && this.studentName) ? encodeURIComponent(this.studentName) : '';
    const url = facultyParam ? `http://localhost:8080/api/copo/mappings?faculty=${facultyParam}` : 'http://localhost:8080/api/copo/mappings';

    this.http.get<CoMapping[]>(url).subscribe({
      next: (data) => {
        let list = data;
        if (this.role === 'faculty') {
          let assigned: string[] = [];
          try {
            const stored = localStorage.getItem('userAssignedCourses');
            if (stored) assigned = JSON.parse(stored);
          } catch {}
          if (assigned.length > 0) {
            list = data.filter(item => 
              assigned.includes(item.course) || 
              assigned.some(a => item.course && item.course.toLowerCase().includes(a.toLowerCase()))
            );
          }
        }
        this.mappings = list;
        this.groupMappings();
        this.cdr.detectChanges();
      }
    });
  }

  private saveMappings() {}

  private safeLoadJson<T>(key: string): T[] {
    return [];
  }

  private uniqueBy<T>(items: T[], selector: (item: T) => string): T[] {
    const seen = new Set<string>();
    return items.filter(item => {
      const key = selector(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  saveMapping() {
    if (this.role === 'student') {
      alert('Only admins and faculty can manage CO-PO mappings.');
      return;
    }

    if (!this.currentMapping.co || !this.currentMapping.po || this.currentMapping.contribution <= 0 || this.currentMapping.mappingLevel <= 0) {
      this.toast.warning('Please select both CO and PO and enter valid mapping details.');
      return;
    }

    const payload = {
      id: this.currentMapping.id > 0 ? this.currentMapping.id : null,
      course: this.currentMapping.course,
      co: this.currentMapping.co,
      po: this.currentMapping.po,
      contribution: this.currentMapping.contribution,
      mappingLevel: this.currentMapping.mappingLevel,
      status: this.currentMapping.status
    };

    this.http.post<CoMapping>('http://localhost:8080/api/copo/mappings', payload).subscribe({
      next: () => {
        this.loadMappings();
        this.resetMapping();
        this.toast.success('CO-PO mapping saved successfully.');
      },
      error: () => {
        this.toast.error('Failed to save mapping.');
      }
    });
  }

  editMapping(index: number) {
    if (this.role === 'student') {
      alert('Only admins and faculty can manage CO-PO mappings.');
      return;
    }
    this.editIndex = index;
    this.currentMapping = { ...this.mappings[index] };
    this.selectedCourseOutcomeKey = `${this.currentMapping.course}::${this.currentMapping.co}`;
  }

  approveMapping(index: number) {
    if (this.role !== 'admin') {
      this.toast.error('Only admins can approve mappings.');
      return;
    }
    const mapping = { ...this.mappings[index] };
    mapping.status = 'Approved';
    this.http.post<CoMapping>('http://localhost:8080/api/copo/mappings', mapping).subscribe({
      next: () => {
        this.loadMappings();
        this.toast.success('Mapping approved successfully.');
      },
      error: () => {
        this.toast.error('Failed to approve mapping.');
      }
    });
  }

  toggleMappingView() {
    this.showMatrix = !this.showMatrix;
  }

  deleteMapping(index: number) {
    if (this.role === 'student') {
      alert('Only admins and faculty can manage CO-PO mappings.');
      return;
    }
    const target = this.mappings[index];
    this.http.delete('http://localhost:8080/api/copo/mappings/' + target.id).subscribe({
      next: () => {
        this.loadMappings();
        this.toast.info('Mapping removed.');
        if (this.editIndex === index) {
          this.resetMapping();
        }
      },
      error: () => {
        this.toast.error('Failed to delete mapping.');
      }
    });
  }

  onCoChange(selectionKey: string) {
    const [course, co] = selectionKey.split('::');
    this.currentMapping.co = co || '';
    this.currentMapping.course = course || '';
  }

  getCourseOutcomeDescription(course: string, co: string): string {
    return this.courseOutcomes.find(item => item.course === course && item.co === co)?.description || '';
  }

  getProgramOutcomeDescription(poNumber: string): string {
    return this.programOutcomes.find(item => item.poNumber === poNumber)?.description || '';
  }

  addProgramOutcome() {
    if (this.role === 'student') {
      alert('Only admins and faculty can manage Program Outcomes.');
      return;
    }

    if (!this.newPoDescription.trim()) {
      this.toast.warning('Enter a PO description.');
      return;
    }

    const index = this.programOutcomes.filter(po => po.poNumber.startsWith('PO')).length + 1;
    const poNumber = this.newPoNumber.trim() || `PO${index}`;

    if (this.programOutcomes.some(po => po.poNumber === poNumber)) {
      this.toast.error('This PO already exists.');
      return;
    }

    const payload = {
      id: null,
      poNumber: poNumber,
      description: this.newPoDescription.trim()
    };

    this.http.post<ProgramOutcome>('http://localhost:8080/api/copo/po', payload).subscribe({
      next: () => {
        this.loadProgramOutcomes();
        this.toast.success(`Program Outcome ${poNumber} added.`);
        this.resetPoForm();
      },
      error: () => {
        this.toast.error('Failed to add PO.');
      }
    });
  }

  addCourseOutcome() {
    if (this.role === 'student') {
      alert('Only admins and faculty can manage Course Outcomes.');
      return;
    }

    if (!this.newCoCourse.trim()) {
      this.toast.warning('Enter the course for this CO.');
      return;
    }

    const nextCoIndex = this.courseOutcomes.filter(item => item.course === this.newCoCourse.trim()).length + 1;
    const coCode = this.newCoCode.trim() || `CO${nextCoIndex}`;

    if (this.courseOutcomes.some(item => item.course === this.newCoCourse.trim() && item.co === coCode)) {
      this.toast.error('This course outcome already exists.');
      return;
    }

    const payload = {
      id: null,
      course: this.newCoCourse.trim(),
      co: coCode,
      description: this.newCoDescription.trim()
    };

    this.http.post<CourseOutcome>('http://localhost:8080/api/copo/co', payload).subscribe({
      next: () => {
        this.loadCourseOutcomes();
        this.toast.success(`Course Outcome ${coCode} created.`);
        this.resetCoForm();
      },
      error: () => {
        this.toast.error('Failed to create CO.');
      }
    });
  }

  private saveProgramOutcomes() {}

  private saveCourseOutcomes() {}

  private loadCourses() {
    this.http.get<Array<{ code: string; title: string }>>('http://localhost:8080/api/courses').subscribe({
      next: (data) => {
        let list = data;
        if (this.role === 'faculty') {
          let assigned: string[] = [];
          try {
            const stored = localStorage.getItem('userAssignedCourses');
            if (stored) assigned = JSON.parse(stored);
          } catch {}
          if (assigned.length > 0) {
            list = data.filter(c => 
              assigned.includes(c.title) || 
              assigned.includes(c.code)
            );
          }
        }
        this.courses = list.map(c => c.code).filter(Boolean);
        this.cdr.detectChanges();
      },
      error: () => {
        this.courses = [];
      }
    });
  }

  resetPoForm() {
    this.newPoNumber = '';
    this.newPoDescription = '';
  }

  resetCoForm() {
    this.newCoCourse = '';
    this.newCoCode = '';
    this.newCoDescription = '';
  }

  getMappingLevelLabel(level: number): string {
    return this.mappingLevels.find(item => item.value === level)?.label ?? 'Unknown';
  }

  getMatrixLevel(course: string, co: string, po: string): number | undefined {
    return this.mappings.find(mapping => mapping.course === course && mapping.co === co && mapping.po === po)?.mappingLevel;
  }

  exportMatrixCsv(): void {
    if (this.programOutcomes.length === 0 || this.courseOutcomes.length === 0) {
      this.toast.warning('No matrix data available to export.');
      return;
    }
    const headers = ['Course - CO', ...this.programOutcomes.map(po => po.poNumber)];
    const rows = this.courseOutcomes.map(outcome => {
      const row = [`"${outcome.course} - ${outcome.co}"`];
      this.programOutcomes.forEach(po => {
        const level = this.getMatrixLevel(outcome.course, outcome.co, po.poNumber);
        row.push(level !== undefined ? `"${level}"` : '""');
      });
      return row.join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CO_PO_Mapping_Matrix_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toast.success('CO-PO Matrix exported to CSV.');
  }

  printMatrix(): void {
    window.print();
  }

  getCourseFullName(courseCode: string): string {
    try {
      const stored = localStorage.getItem('obslmsCourses');
      const storedCourses = stored ? JSON.parse(stored) : [];
      const found = storedCourses.find((c: any) => 
        c.code?.toLowerCase() === courseCode?.toLowerCase() || 
        c.title?.toLowerCase() === courseCode?.toLowerCase()
      );
      return found ? `${found.code} - ${found.title}` : courseCode;
    } catch {
      return courseCode;
    }
  }

  groupMappings() {
    const groups = new Map<string, CoMapping[]>();
    this.mappings.forEach(m => {
      const rawName = m.course || 'General';
      const cName = this.getCourseFullName(rawName);
      if (!groups.has(cName)) {
        groups.set(cName, []);
      }
      groups.get(cName)!.push(m);
    });
    this.groupedMappings = Array.from(groups.keys()).map(cName => ({
      courseName: cName,
      mappings: groups.get(cName)!
    }));
  }

  toggleGroup(courseName: string) {
    this.collapsedGroups[courseName] = !this.collapsedGroups[courseName];
  }

  resetMapping() {
    this.editIndex = -1;
    this.selectedCourseOutcomeKey = '';
    this.currentMapping = {
      id: 0,
      course: '',
      co: '',
      po: '',
      contribution: 0,
      mappingLevel: 0,
      status: 'Pending'
    };
  }

  loadAppearance(): void {
    try {
      const stored = localStorage.getItem('oblmsAppearance');
      if (stored) {
        this.appearance = JSON.parse(stored);
      }
    } catch {}
    this.applyThemeStyleMapping();
  }

  private applyThemeStyleMapping(): void {
    const isDark = this.appearance.theme === 'dark' || 
      (this.appearance.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const bg = isDark ? '#0f172a' : 'rgba(240, 249, 255, 0.92)';
    const cardBg = isDark ? '#1e293b' : 'rgba(255, 255, 255, 0.98)';
    const text = isDark ? '#f8fafc' : '#1e293b';
    const textSecondary = isDark ? '#94a3b8' : '#64748b';
    const border = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(74, 140, 234, 0.16)';
    const sidebarBg = isDark ? '#1e293b' : 'rgba(255, 255, 255, 0.98)';

    let primary = '#1976d2';
    let primaryRgb = '25, 118, 210';
    let heroBg = 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)';

    switch (this.appearance.colorScheme) {
      case 'purple':
        primary = '#8b5cf6';
        primaryRgb = '139, 92, 246';
        heroBg = 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 50%, #7c3aed 100%)';
        break;
      case 'green':
        primary = '#10b981';
        primaryRgb = '16, 185, 129';
        heroBg = 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #10b981 100%)';
        break;
      case 'red':
        primary = '#ef4444';
        primaryRgb = '239, 68, 68';
        heroBg = 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #ef4444 100%)';
        break;
      case 'orange':
        primary = '#f97316';
        primaryRgb = '249, 115, 22';
        heroBg = 'linear-gradient(135deg, #7c2d12 0%, #9a3412 50%, #f97316 100%)';
        break;
      default:
        primary = '#1976d2';
        primaryRgb = '25, 118, 210';
        heroBg = 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)';
    }

    this.themeStyles = {
      '--student-primary': primary,
      '--student-primary-rgb': primaryRgb,
      '--student-hero-bg': heroBg,
      '--student-bg': bg,
      '--student-card-bg': cardBg,
      '--student-text': text,
      '--student-text-secondary': textSecondary,
      '--student-border': border,
      '--student-sidebar-bg': sidebarBg
    };
  }

  logout(): void {
    try {
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
    } catch {}
    this.router.navigate(['/login']);
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }
}
