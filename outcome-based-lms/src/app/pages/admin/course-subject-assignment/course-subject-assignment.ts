import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Navbar } from '../../../shared/navbar/navbar';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { Footer } from '../../../shared/footer/footer';
import { ToastService } from '../../../shared/services/toast.service';
import { DEFAULT_DATABASE_COURSES } from '../../../shared/services/course.service';
import { NavigationService } from '../../../shared/services/navigation.service';

export type SubjectCategory = 'PC' | 'BS' | 'ES' | 'PE' | 'OE' | 'LC' | 'PR' | 'HS' | 'MC';

export interface ProgramSchemeSubject {
  id: string;
  programId: string;     // e.g. PRG_CSE
  programName: string;   // e.g. B.Tech Computer Science & Engineering
  semester: string;      // e.g. Semester 1 to Semester 8
  subjectCode: string;   // e.g. CS101
  subjectTitle: string;  // e.g. Database Management Systems
  category: SubjectCategory;
  categoryName: string;  // e.g. Professional Core (PC)
  ltp: string;           // e.g. 3-0-0, 3-0-2, 0-0-4
  contactHours: number;  // e.g. 4
  credits: number;       // e.g. 4
  evaluationSchema: string; // e.g. 40 CIE / 60 SEE
}

export interface AcademicProgram {
  id: string;
  name: string;
  code: string;
  department: string;
  totalCredits: number;
  icon: string;
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
  private navService = inject(NavigationService);

  goBack(): void {
    if ((this as any).showAddModal) {
      (this as any).closeModal();
      return;
    }
    this.navService.goBack();
  }

  // Available Degree Programs
  programs: AcademicProgram[] = [
    { id: 'PRG_CSE', name: 'B.Tech Computer Science & Engineering', code: 'CSE', department: 'Computer Science & Engineering', totalCredits: 160, icon: '💻' },
    { id: 'PRG_IT', name: 'B.Tech Information Technology', code: 'IT', department: 'Information Technology', totalCredits: 160, icon: '🌐' },
    { id: 'PRG_ECE', name: 'B.Tech Electronics & Communication', code: 'ECE', department: 'Electronics & Communication Engineering', totalCredits: 160, icon: '📡' },
    { id: 'PRG_ME', name: 'B.Tech Mechanical Engineering', code: 'ME', department: 'Mechanical Engineering', totalCredits: 160, icon: '⚙️' },
    { id: 'PRG_CE', name: 'B.Tech Civil Engineering', code: 'CE', department: 'Civil Engineering', totalCredits: 160, icon: '🏗️' }
  ];

  protected Math = Math;

  selectedProgramId: string = 'PRG_CSE';
  selectedSemester: string = ''; // '' for All Semesters
  selectedCategory: string = '';
  searchQuery: string = '';

  semesters: string[] = [
    'Semester 1', 'Semester 2', 'Semester 3', 'Semester 4',
    'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'
  ];

  categoryOptions: { code: SubjectCategory; label: string; desc: string; color: string }[] = [
    { code: 'PC', label: 'Professional Core (PC)', desc: 'Core Engineering Subjects', color: '#38bdf8' },
    { code: 'BS', label: 'Basic Science (BS)', desc: 'Math, Physics, Chemistry', color: '#a78bfa' },
    { code: 'ES', label: 'Engineering Science (ES)', desc: 'Foundational Engineering & CAD', color: '#34d399' },
    { code: 'PE', label: 'Program Elective (PE)', desc: 'Specialized Advanced Tracks', color: '#fde68a' },
    { code: 'OE', label: 'Open Elective (OE)', desc: 'Inter-disciplinary Minors', color: '#fb923c' },
    { code: 'LC', label: 'Laboratory Course (LC)', desc: 'Practical Lab Work', color: '#4ade80' },
    { code: 'PR', label: 'Project & Internship (PR)', desc: 'Capstone & Industrial Training', color: '#f43f5e' },
    { code: 'HS', label: 'Humanities & Social (HS)', desc: 'Ethics, Management, English', color: '#ec4899' },
    { code: 'MC', label: 'Mandatory Audit (MC)', desc: 'Non-credit Mandatory Courses', color: '#94a3b8' }
  ];

  allSchemeSubjects: ProgramSchemeSubject[] = [];
  filteredSchemeSubjects: ProgramSchemeSubject[] = [];

  // Form fields
  showForm: boolean = false;
  isEditMode: boolean = false;
  currentEditId: string | null = null;

  formData = {
    programId: 'PRG_CSE',
    semester: 'Semester 3',
    subjectCode: '',
    subjectTitle: '',
    category: 'PC' as SubjectCategory,
    ltp: '3-0-0',
    contactHours: 3,
    credits: 3,
    evaluationSchema: '40 CIE / 60 SEE'
  };

  get currentProgram(): AcademicProgram {
    return this.programs.find(p => p.id === this.selectedProgramId) || this.programs[0];
  }

  // Program Credit Category KPIs
  get totalCurriculumCredits(): number {
    return this.getProgramSubjects(this.selectedProgramId).reduce((sum, s) => sum + s.credits, 0);
  }

  getCreditsByCategory(cat: SubjectCategory): number {
    return this.getProgramSubjects(this.selectedProgramId)
      .filter(s => s.category === cat)
      .reduce((sum, s) => sum + s.credits, 0);
  }

  get groupedSemesters(): { semester: string; subjects: ProgramSchemeSubject[]; totalCredits: number; totalHours: number }[] {
    const list = this.filteredSchemeSubjects;
    const sems = this.selectedSemester ? [this.selectedSemester] : this.semesters;

    return sems.map(sem => {
      const semSubs = list.filter(s => s.semester === sem);
      const totalCredits = semSubs.reduce((acc, s) => acc + s.credits, 0);
      const totalHours = semSubs.reduce((acc, s) => acc + (s.contactHours || s.credits), 0);
      return {
        semester: sem,
        subjects: semSubs,
        totalCredits,
        totalHours
      };
    }).filter(g => g.subjects.length > 0 || this.selectedSemester === g.semester);
  }

  ngOnInit(): void {
    this.loadSchemeData();
  }

  selectProgram(progId: string): void {
    this.selectedProgramId = progId;
    this.filterScheme();
  }

  selectSemesterFilter(sem: string): void {
    this.selectedSemester = sem;
    this.filterScheme();
  }

  selectCategoryFilter(cat: string): void {
    this.selectedCategory = cat;
    this.filterScheme();
  }

  private loadSchemeData(): void {
    const stored = localStorage.getItem('obslmsProgramSchemes');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.allSchemeSubjects = parsed;
          this.filterScheme();
          return;
        }
      } catch {}
    }

    // Initialize Default Accredited Curriculum Scheme across all 5 Programs
    this.allSchemeSubjects = this.generateAccreditedScheme();
    try {
      localStorage.setItem('obslmsProgramSchemes', JSON.stringify(this.allSchemeSubjects));
    } catch {}
    this.filterScheme();
  }

  private getProgramSubjects(progId: string): ProgramSchemeSubject[] {
    return this.allSchemeSubjects.filter(s => s.programId === progId);
  }

  filterScheme(): void {
    const q = this.searchQuery.toLowerCase().trim();
    const progId = this.selectedProgramId;
    const sem = this.selectedSemester;
    const cat = this.selectedCategory;

    this.filteredSchemeSubjects = this.allSchemeSubjects.filter(s => {
      const matchProg = s.programId === progId;
      const matchSem = !sem || s.semester === sem;
      const matchCat = !cat || s.category === cat;
      const matchQuery = !q ||
        s.subjectCode.toLowerCase().includes(q) ||
        s.subjectTitle.toLowerCase().includes(q) ||
        s.categoryName.toLowerCase().includes(q);

      return matchProg && matchSem && matchCat && matchQuery;
    });

    this.cdr.detectChanges();
  }

  onSearchChange(): void {
    this.filterScheme();
  }

  openAddForm(): void {
    this.showForm = true;
    this.isEditMode = false;
    this.currentEditId = null;
    this.formData = {
      programId: this.selectedProgramId,
      semester: this.selectedSemester || 'Semester 1',
      subjectCode: '',
      subjectTitle: '',
      category: 'PC',
      ltp: '3-0-0',
      contactHours: 3,
      credits: 3,
      evaluationSchema: '40 CIE / 60 SEE'
    };
  }

  openEditForm(subject: ProgramSchemeSubject): void {
    this.showForm = true;
    this.isEditMode = true;
    this.currentEditId = subject.id;
    this.formData = {
      programId: subject.programId,
      semester: subject.semester,
      subjectCode: subject.subjectCode,
      subjectTitle: subject.subjectTitle,
      category: subject.category,
      ltp: subject.ltp,
      contactHours: subject.contactHours,
      credits: subject.credits,
      evaluationSchema: subject.evaluationSchema
    };
  }

  closeForm(): void {
    this.showForm = false;
    this.currentEditId = null;
  }

  saveSubjectScheme(): void {
    if (!this.formData.subjectCode.trim() || !this.formData.subjectTitle.trim()) {
      this.toast.warning('Please enter Subject Code and Subject Title.');
      return;
    }

    const catObj = this.categoryOptions.find(c => c.code === this.formData.category);
    const catLabel = catObj ? catObj.label : 'Professional Core (PC)';
    const prog = this.programs.find(p => p.id === this.formData.programId) || this.currentProgram;

    const item: ProgramSchemeSubject = {
      id: this.currentEditId || `SCHEME-${this.formData.programId}-${this.formData.subjectCode.trim().toUpperCase()}-${Date.now()}`,
      programId: this.formData.programId,
      programName: prog.name,
      semester: this.formData.semester,
      subjectCode: this.formData.subjectCode.trim().toUpperCase(),
      subjectTitle: this.formData.subjectTitle.trim(),
      category: this.formData.category,
      categoryName: catLabel,
      ltp: this.formData.ltp.trim(),
      contactHours: Number(this.formData.contactHours) || 3,
      credits: Number(this.formData.credits) || 3,
      evaluationSchema: this.formData.evaluationSchema
    };

    if (this.isEditMode && this.currentEditId) {
      const idx = this.allSchemeSubjects.findIndex(s => s.id === this.currentEditId);
      if (idx !== -1) {
        this.allSchemeSubjects[idx] = item;
      }
    } else {
      this.allSchemeSubjects.unshift(item);
    }

    try {
      localStorage.setItem('obslmsProgramSchemes', JSON.stringify(this.allSchemeSubjects));
    } catch {}

    this.filterScheme();
    this.closeForm();
    this.toast.success(`Curriculum scheme updated for "${item.subjectCode} - ${item.subjectTitle}"! 🎓`);
  }

  deleteSubjectScheme(id: string): void {
    if (!confirm('Are you sure you want to remove this subject from the degree program scheme?')) {
      return;
    }

    this.allSchemeSubjects = this.allSchemeSubjects.filter(s => s.id !== id);
    try {
      localStorage.setItem('obslmsProgramSchemes', JSON.stringify(this.allSchemeSubjects));
    } catch {}
    this.filterScheme();
    this.toast.info('Subject removed from degree curriculum scheme.');
  }

  exportSchemeCsv(): void {
    const list = this.getProgramSubjects(this.selectedProgramId);
    if (list.length === 0) {
      this.toast.warning('No scheme subjects to export.');
      return;
    }

    const headers = ['Program', 'Semester', 'Course Code', 'Subject Title', 'Category', 'L-T-P', 'Contact Hours', 'Credits', 'Evaluation Scheme'];
    const rows = list.map(s => [
      `"${s.programName}"`,
      `"${s.semester}"`,
      `"${s.subjectCode}"`,
      `"${s.subjectTitle}"`,
      `"${s.categoryName}"`,
      `"${s.ltp}"`,
      `"${s.contactHours}"`,
      `"${s.credits}"`,
      `"${s.evaluationSchema}"`
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Curriculum_Scheme_${this.currentProgram.code}_160Credits.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toast.success('Curriculum Scheme of Instruction exported successfully! 📄');
  }

  getCategoryColor(cat: SubjectCategory): string {
    const found = this.categoryOptions.find(c => c.code === cat);
    return found ? found.color : '#38bdf8';
  }

  // Generate complete 160-Credit AICTE Model Curriculum Scheme for all 5 Programs
  private generateAccreditedScheme(): ProgramSchemeSubject[] {
    const list: ProgramSchemeSubject[] = [];

    this.programs.forEach(prog => {
      const pCode = prog.code;
      const pName = prog.name;

      // Semester 1 (Common Foundation)
      list.push(
        { id: `${prog.id}-MA101`, programId: prog.id, programName: pName, semester: 'Semester 1', subjectCode: 'MA101', subjectTitle: 'Engineering Mathematics I (Calculus & Linear Algebra)', category: 'BS', categoryName: 'Basic Science (BS)', ltp: '3-1-0', contactHours: 4, credits: 4, evaluationSchema: '40 CIE / 60 SEE' },
        { id: `${prog.id}-PH101`, programId: prog.id, programName: pName, semester: 'Semester 1', subjectCode: 'PH101', subjectTitle: 'Engineering Physics & Quantum Mechanics', category: 'BS', categoryName: 'Basic Science (BS)', ltp: '3-0-0', contactHours: 3, credits: 3, evaluationSchema: '40 CIE / 60 SEE' },
        { id: `${prog.id}-EE101`, programId: prog.id, programName: pName, semester: 'Semester 1', subjectCode: 'EE101', subjectTitle: 'Basic Electrical & Electronics Engineering', category: 'ES', categoryName: 'Engineering Science (ES)', ltp: '3-0-0', contactHours: 3, credits: 3, evaluationSchema: '40 CIE / 60 SEE' },
        { id: `${prog.id}-${pCode}101`, programId: prog.id, programName: pName, semester: 'Semester 1', subjectCode: `${pCode}101`, subjectTitle: `Introduction to ${prog.department}`, category: 'PC', categoryName: 'Professional Core (PC)', ltp: '3-0-0', contactHours: 3, credits: 3, evaluationSchema: '40 CIE / 60 SEE' },
        { id: `${prog.id}-HS101`, programId: prog.id, programName: pName, semester: 'Semester 1', subjectCode: 'HS101', subjectTitle: 'Professional Communication & English Language', category: 'HS', categoryName: 'Humanities & Social (HS)', ltp: '2-0-0', contactHours: 2, credits: 2, evaluationSchema: '40 CIE / 60 SEE' },
        { id: `${prog.id}-PH101L`, programId: prog.id, programName: pName, semester: 'Semester 1', subjectCode: 'PH101L', subjectTitle: 'Physics & Optical Measurements Laboratory', category: 'LC', categoryName: 'Laboratory Course (LC)', ltp: '0-0-3', contactHours: 3, credits: 1.5, evaluationSchema: '50 CIE / 50 SEE' },
        { id: `${prog.id}-${pCode}101L`, programId: prog.id, programName: pName, semester: 'Semester 1', subjectCode: `${pCode}101L`, subjectTitle: `${prog.code} Domain Foundation Laboratory`, category: 'LC', categoryName: 'Laboratory Course (LC)', ltp: '0-0-3', contactHours: 3, credits: 1.5, evaluationSchema: '50 CIE / 50 SEE' },
        { id: `${prog.id}-MC101`, programId: prog.id, programName: pName, semester: 'Semester 1', subjectCode: 'MC101', subjectTitle: 'Induction Program & Human Values', category: 'MC', categoryName: 'Mandatory Audit (MC)', ltp: '2-0-0', contactHours: 2, credits: 0, evaluationSchema: 'Satisfactory / Non-Credit' }
      );

      // Semester 2 (Foundational Engineering)
      list.push(
        { id: `${prog.id}-MA102`, programId: prog.id, programName: pName, semester: 'Semester 2', subjectCode: 'MA102', subjectTitle: 'Engineering Mathematics II (Differential Equations)', category: 'BS', categoryName: 'Basic Science (BS)', ltp: '3-1-0', contactHours: 4, credits: 4, evaluationSchema: '40 CIE / 60 SEE' },
        { id: `${prog.id}-CH101`, programId: prog.id, programName: pName, semester: 'Semester 2', subjectCode: 'CH101', subjectTitle: 'Engineering Chemistry & Material Science', category: 'BS', categoryName: 'Basic Science (BS)', ltp: '3-0-0', contactHours: 3, credits: 3, evaluationSchema: '40 CIE / 60 SEE' },
        { id: `${prog.id}-ME101`, programId: prog.id, programName: pName, semester: 'Semester 2', subjectCode: 'ME101', subjectTitle: 'Engineering Graphics & Computer-Aided Design (CAD)', category: 'ES', categoryName: 'Engineering Science (ES)', ltp: '1-0-4', contactHours: 5, credits: 3, evaluationSchema: '50 CIE / 50 SEE' },
        { id: `${prog.id}-${pCode}102`, programId: prog.id, programName: pName, semester: 'Semester 2', subjectCode: `${pCode}102`, subjectTitle: `${prog.code} Problem Solving & Algorithmic Methods`, category: 'PC', categoryName: 'Professional Core (PC)', ltp: '3-0-0', contactHours: 3, credits: 3, evaluationSchema: '40 CIE / 60 SEE' },
        { id: `${prog.id}-CH101L`, programId: prog.id, programName: pName, semester: 'Semester 2', subjectCode: 'CH101L', subjectTitle: 'Chemistry & Environmental Testing Lab', category: 'LC', categoryName: 'Laboratory Course (LC)', ltp: '0-0-3', contactHours: 3, credits: 1.5, evaluationSchema: '50 CIE / 50 SEE' },
        { id: `${prog.id}-${pCode}102L`, programId: prog.id, programName: pName, semester: 'Semester 2', subjectCode: `${pCode}102L`, subjectTitle: `${prog.code} Computing & Workshop Practices Lab`, category: 'LC', categoryName: 'Laboratory Course (LC)', ltp: '0-0-3', contactHours: 3, credits: 1.5, evaluationSchema: '50 CIE / 50 SEE' },
        { id: `${prog.id}-MC102`, programId: prog.id, programName: pName, semester: 'Semester 2', subjectCode: 'MC102', subjectTitle: 'Environmental Studies & Sustainability', category: 'MC', categoryName: 'Mandatory Audit (MC)', ltp: '2-0-0', contactHours: 2, credits: 0, evaluationSchema: 'Satisfactory / Non-Credit' }
      );

      // Semester 3 (Core Discipline Initiation)
      list.push(
        { id: `${prog.id}-${pCode}201`, programId: prog.id, programName: pName, semester: 'Semester 3', subjectCode: `${pCode}201`, subjectTitle: `${prog.code} Core Engineering Principles I`, category: 'PC', categoryName: 'Professional Core (PC)', ltp: '3-1-0', contactHours: 4, credits: 4, evaluationSchema: '40 CIE / 60 SEE' },
        { id: `${prog.id}-${pCode}202`, programId: prog.id, programName: pName, semester: 'Semester 3', subjectCode: `${pCode}202`, subjectTitle: `${prog.code} Design & Analysis of Structures / Circuits`, category: 'PC', categoryName: 'Professional Core (PC)', ltp: '3-0-0', contactHours: 3, credits: 3, evaluationSchema: '40 CIE / 60 SEE' },
        { id: `${prog.id}-MA201`, programId: prog.id, programName: pName, semester: 'Semester 3', subjectCode: 'MA201', subjectTitle: 'Discrete Mathematics, Probability & Statistics', category: 'BS', categoryName: 'Basic Science (BS)', ltp: '3-1-0', contactHours: 4, credits: 4, evaluationSchema: '40 CIE / 60 SEE' },
        { id: `${prog.id}-HS201`, programId: prog.id, programName: pName, semester: 'Semester 3', subjectCode: 'HS201', subjectTitle: 'Engineering Economics & Financial Management', category: 'HS', categoryName: 'Humanities & Social (HS)', ltp: '3-0-0', contactHours: 3, credits: 3, evaluationSchema: '40 CIE / 60 SEE' },
        { id: `${prog.id}-${pCode}201L`, programId: prog.id, programName: pName, semester: 'Semester 3', subjectCode: `${pCode}201L`, subjectTitle: `${prog.code} Core Engineering Lab I`, category: 'LC', categoryName: 'Laboratory Course (LC)', ltp: '0-0-3', contactHours: 3, credits: 1.5, evaluationSchema: '50 CIE / 50 SEE' },
        { id: `${prog.id}-${pCode}202L`, programId: prog.id, programName: pName, semester: 'Semester 3', subjectCode: `${pCode}202L`, subjectTitle: `${prog.code} Digital & Simulation Tools Lab`, category: 'LC', categoryName: 'Laboratory Course (LC)', ltp: '0-0-3', contactHours: 3, credits: 1.5, evaluationSchema: '50 CIE / 50 SEE' }
      );

      // Semester 4 (Intermediate Core & Systems)
      list.push(
        { id: `${prog.id}-${pCode}203`, programId: prog.id, programName: pName, semester: 'Semester 4', subjectCode: `${pCode}203`, subjectTitle: `${prog.code} Systems Engineering & Architecture`, category: 'PC', categoryName: 'Professional Core (PC)', ltp: '3-1-0', contactHours: 4, credits: 4, evaluationSchema: '40 CIE / 60 SEE' },
        { id: `${prog.id}-${pCode}204`, programId: prog.id, programName: pName, semester: 'Semester 4', subjectCode: `${pCode}204`, subjectTitle: `${prog.code} Applied Modeling & Instrumentation`, category: 'PC', categoryName: 'Professional Core (PC)', ltp: '3-0-0', contactHours: 3, credits: 3, evaluationSchema: '40 CIE / 60 SEE' },
        { id: `${prog.id}-OE201`, programId: prog.id, programName: pName, semester: 'Semester 4', subjectCode: 'OE201', subjectTitle: 'Open Elective I: Cross-Disciplinary Innovations', category: 'OE', categoryName: 'Open Elective (OE)', ltp: '3-0-0', contactHours: 3, credits: 3, evaluationSchema: '40 CIE / 60 SEE' },
        { id: `${prog.id}-${pCode}205`, programId: prog.id, programName: pName, semester: 'Semester 4', subjectCode: `${pCode}205`, subjectTitle: `${prog.code} Micro-Systems & Control Automation`, category: 'PC', categoryName: 'Professional Core (PC)', ltp: '3-0-0', contactHours: 3, credits: 3, evaluationSchema: '40 CIE / 60 SEE' },
        { id: `${prog.id}-${pCode}203L`, programId: prog.id, programName: pName, semester: 'Semester 4', subjectCode: `${pCode}203L`, subjectTitle: `${prog.code} Systems & Modeling Laboratory`, category: 'LC', categoryName: 'Laboratory Course (LC)', ltp: '0-0-3', contactHours: 3, credits: 1.5, evaluationSchema: '50 CIE / 50 SEE' },
        { id: `${prog.id}-MC201`, programId: prog.id, programName: pName, semester: 'Semester 4', subjectCode: 'MC201', subjectTitle: 'Constitution of India & Professional Ethics', category: 'MC', categoryName: 'Mandatory Audit (MC)', ltp: '2-0-0', contactHours: 2, credits: 0, evaluationSchema: 'Satisfactory / Non-Credit' }
      );

      // Semester 5 (Advanced Core & Professional Electives)
      list.push(
        { id: `${prog.id}-${pCode}301`, programId: prog.id, programName: pName, semester: 'Semester 5', subjectCode: `${pCode}301`, subjectTitle: `${prog.code} Advanced Networks & Dynamic Systems`, category: 'PC', categoryName: 'Professional Core (PC)', ltp: '3-1-0', contactHours: 4, credits: 4, evaluationSchema: '40 CIE / 60 SEE' },
        { id: `${prog.id}-${pCode}302`, programId: prog.id, programName: pName, semester: 'Semester 5', subjectCode: `${pCode}302`, subjectTitle: `${prog.code} Software Design & Process Methodologies`, category: 'PC', categoryName: 'Professional Core (PC)', ltp: '3-0-0', contactHours: 3, credits: 3, evaluationSchema: '40 CIE / 60 SEE' },
        { id: `${prog.id}-PE301`, programId: prog.id, programName: pName, semester: 'Semester 5', subjectCode: `PE301`, subjectTitle: `Program Elective I: Advanced Domain Track`, category: 'PE', categoryName: 'Program Elective (PE)', ltp: '3-0-0', contactHours: 3, credits: 3, evaluationSchema: '40 CIE / 60 SEE' },
        { id: `${prog.id}-OE301`, programId: prog.id, programName: pName, semester: 'Semester 5', subjectCode: `OE301`, subjectTitle: `Open Elective II: AI & Robotics Foundations`, category: 'OE', categoryName: 'Open Elective (OE)', ltp: '3-0-0', contactHours: 3, credits: 3, evaluationSchema: '40 CIE / 60 SEE' },
        { id: `${prog.id}-${pCode}301L`, programId: prog.id, programName: pName, semester: 'Semester 5', subjectCode: `${pCode}301L`, subjectTitle: `${prog.code} Advanced Applications & Design Lab`, category: 'LC', categoryName: 'Laboratory Course (LC)', ltp: '0-0-3', contactHours: 3, credits: 1.5, evaluationSchema: '50 CIE / 50 SEE' },
        { id: `${prog.id}-PR301`, programId: prog.id, programName: pName, semester: 'Semester 5', subjectCode: `PR301`, subjectTitle: 'Social Internship / Community Engagement Project', category: 'PR', categoryName: 'Project & Internship (PR)', ltp: '0-0-4', contactHours: 4, credits: 2, evaluationSchema: '100 Internal Viva' }
      );

      // Semester 6 (Domain Electives & Applied Intelligence)
      list.push(
        { id: `${prog.id}-${pCode}303`, programId: prog.id, programName: pName, semester: 'Semester 6', subjectCode: `${pCode}303`, subjectTitle: `${prog.code} Machine Learning & Intelligent Automation`, category: 'PC', categoryName: 'Professional Core (PC)', ltp: '3-1-0', contactHours: 4, credits: 4, evaluationSchema: '40 CIE / 60 SEE' },
        { id: `${prog.id}-PE302`, programId: prog.id, programName: pName, semester: 'Semester 6', subjectCode: `PE302`, subjectTitle: `Program Elective II: Cloud & Distributed Infrastructures`, category: 'PE', categoryName: 'Program Elective (PE)', ltp: '3-0-0', contactHours: 3, credits: 3, evaluationSchema: '40 CIE / 60 SEE' },
        { id: `${prog.id}-PE303`, programId: prog.id, programName: pName, semester: 'Semester 6', subjectCode: `PE303`, subjectTitle: `Program Elective III: Security & Information Assurance`, category: 'PE', categoryName: 'Program Elective (PE)', ltp: '3-0-0', contactHours: 3, credits: 3, evaluationSchema: '40 CIE / 60 SEE' },
        { id: `${prog.id}-OE302`, programId: prog.id, programName: pName, semester: 'Semester 6', subjectCode: `OE302`, subjectTitle: `Open Elective III: Industrial IoT & Smart Sensors`, category: 'OE', categoryName: 'Open Elective (OE)', ltp: '3-0-0', contactHours: 3, credits: 3, evaluationSchema: '40 CIE / 60 SEE' },
        { id: `${prog.id}-${pCode}303L`, programId: prog.id, programName: pName, semester: 'Semester 6', subjectCode: `${pCode}303L`, subjectTitle: `${prog.code} Machine Learning & Systems Lab`, category: 'LC', categoryName: 'Laboratory Course (LC)', ltp: '0-0-3', contactHours: 3, credits: 1.5, evaluationSchema: '50 CIE / 50 SEE' },
        { id: `${prog.id}-PR302`, programId: prog.id, programName: pName, semester: 'Semester 6', subjectCode: `PR302`, subjectTitle: 'Mini Project / Industrial Internship Phase I', category: 'PR', categoryName: 'Project & Internship (PR)', ltp: '0-0-4', contactHours: 4, credits: 2, evaluationSchema: '50 CIE / 50 External Viva' }
      );

      // Semester 7 (Specialized Electives & Major Project I)
      list.push(
        { id: `${prog.id}-PE401`, programId: prog.id, programName: pName, semester: 'Semester 7', subjectCode: `PE401`, subjectTitle: `Program Elective IV: Big Data & High Performance Compute`, category: 'PE', categoryName: 'Program Elective (PE)', ltp: '3-0-0', contactHours: 3, credits: 3, evaluationSchema: '40 CIE / 60 SEE' },
        { id: `${prog.id}-PE402`, programId: prog.id, programName: pName, semester: 'Semester 7', subjectCode: `PE402`, subjectTitle: `Program Elective V: Quantum Computing / Advanced Track`, category: 'PE', categoryName: 'Program Elective (PE)', ltp: '3-0-0', contactHours: 3, credits: 3, evaluationSchema: '40 CIE / 60 SEE' },
        { id: `${prog.id}-OE401`, programId: prog.id, programName: pName, semester: 'Semester 7', subjectCode: `OE401`, subjectTitle: `Open Elective IV: Intellectual Property & Patents`, category: 'OE', categoryName: 'Open Elective (OE)', ltp: '3-0-0', contactHours: 3, credits: 3, evaluationSchema: '40 CIE / 60 SEE' },
        { id: `${prog.id}-HS401`, programId: prog.id, programName: pName, semester: 'Semester 7', subjectCode: `HS401`, subjectTitle: 'Principles of Management & Entrepreneurship', category: 'HS', categoryName: 'Humanities & Social (HS)', ltp: '3-0-0', contactHours: 3, credits: 3, evaluationSchema: '40 CIE / 60 SEE' },
        { id: `${prog.id}-PR401`, programId: prog.id, programName: pName, semester: 'Semester 7', subjectCode: `PR401`, subjectTitle: 'Capstone Major Project - Phase I (Problem Formulation)', category: 'PR', categoryName: 'Project & Internship (PR)', ltp: '0-0-8', contactHours: 8, credits: 4, evaluationSchema: '50 CIE / 50 External Viva' }
      );

      // Semester 8 (Major Project II & Industry Dissertation)
      list.push(
        { id: `${prog.id}-PE403`, programId: prog.id, programName: pName, semester: 'Semester 8', subjectCode: `PE403`, subjectTitle: `Program Elective VI: Blockchain & Web3 Architecture`, category: 'PE', categoryName: 'Program Elective (PE)', ltp: '3-0-0', contactHours: 3, credits: 3, evaluationSchema: '40 CIE / 60 SEE' },
        { id: `${prog.id}-PR402`, programId: prog.id, programName: pName, semester: 'Semester 8', subjectCode: `PR402`, subjectTitle: 'Capstone Major Project - Phase II & Final Dissertation', category: 'PR', categoryName: 'Project & Internship (PR)', ltp: '0-0-16', contactHours: 16, credits: 8, evaluationSchema: '100 External Board Viva' },
        { id: `${prog.id}-PR403`, programId: prog.id, programName: pName, semester: 'Semester 8', subjectCode: `PR403`, subjectTitle: 'Comprehensive Technical Viva Voce & Portfolio Defense', category: 'PR', categoryName: 'Project & Internship (PR)', ltp: '0-0-2', contactHours: 2, credits: 2, evaluationSchema: '100 University Board' }
      );
    });

    return list;
  }
}
