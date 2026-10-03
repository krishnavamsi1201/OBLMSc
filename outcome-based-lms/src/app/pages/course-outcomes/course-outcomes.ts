import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { ToastService } from '../../shared/services/toast.service';

interface CourseOutcome {
  id: number;
  course: string;
  co: string;
  description: string;
}

export interface GroupedSubjectCOs {
  courseCode: string;
  courseTitle: string;
  fullCourseName: string;
  cos: CourseOutcome[];
  isExpanded: boolean;
}

@Component({
  selector: 'app-course-outcomes',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  template: `<app-navbar></app-navbar>

<div class="container">

    <app-sidebar></app-sidebar>

    <div class="content">

        <div class="page-header">
            <div class="header-title-group">
                <span class="header-pill">🎯 NBA Criteria-3 Compliant</span>
                <h1>Course Outcomes (CO) Directory</h1>
                <p>Subject-wise Course Outcomes (CO1–CO5) articulating specific skills, knowledge, and competencies acquired by students.</p>
            </div>
            <div class="header-actions" *ngIf="role === 'admin' || role === 'faculty'">
                <button type="button" class="primary-button" (click)="toggleForm()">
                    {{ showForm ? '✕ Close Form' : '+ Define New CO' }}
                </button>
            </div>
        </div>

        <!-- Search and Summary Bar -->
        <div class="co-search-toolbar">
            <div class="search-box">
                <span class="search-icon">🔍</span>
                <input 
                    type="text" 
                    [(ngModel)]="searchQuery" 
                    (ngModelChange)="filterGroups()" 
                    placeholder="Search by subject name, course code (e.g. CS101, DSLD), or outcome keywords..." 
                />
                <button *ngIf="searchQuery" type="button" class="clear-search" (click)="searchQuery=''; filterGroups()">✕</button>
            </div>
            <div class="stats-pills">
                <span class="stat-badge">📚 <strong>{{ filteredGroups.length }}</strong> Subjects</span>
                <span class="stat-badge gold">🎯 <strong>{{ totalCOsCount }}</strong> Defined COs</span>
            </div>
        </div>

        <!-- Create / Edit Outcome Form Card -->
        <div class="form-card" *ngIf="showForm">
            <div class="form-header">
                <h2>{{ editingIndex >= 0 ? 'Edit Course Outcome' : 'Define New Course Outcome' }}</h2>
                <button type="button" class="close-form-btn" (click)="toggleForm()">✕</button>
            </div>
            <form (ngSubmit)="saveOutcome()">
                <div class="form-grid">
                    <label>
                        Target Subject / Course
                        <select [(ngModel)]="currentOutcome.course" name="course" required>
                            <option value="" disabled selected>Select course</option>
                            <option *ngFor="let course of courses" [value]="course">{{ course }}</option>
                        </select>
                    </label>
                    <label>
                        CO Code
                        <input type="text" [(ngModel)]="currentOutcome.co" name="co" placeholder="e.g. CO1, CO2, CO3" required />
                    </label>
                </div>
                <label class="full-width">
                    Outcome Statement & Competency Description
                    <textarea rows="3" [(ngModel)]="currentOutcome.description" name="description" placeholder="Students will be able to design, analyze, and implement..." required></textarea>
                </label>
                <div class="form-actions">
                    <button type="submit" class="primary-button">{{ editingIndex >= 0 ? 'Save Changes' : 'Save Course Outcome' }}</button>
                    <button type="button" class="secondary-button" (click)="resetForm(); showForm=false">Cancel</button>
                </div>
            </form>
        </div>

        <!-- SUBJECT-WISE CARDS CONTAINER -->
        <div class="subject-cards-list">
            <div *ngFor="let group of filteredGroups" class="subject-co-card">
                <!-- Subject Card Header -->
                <div class="subject-card-header" (click)="toggleGroup(group)">
                    <div class="subject-meta-left">
                        <span class="course-code-badge">{{ group.courseCode }}</span>
                        <h2 class="subject-name-title">{{ group.courseTitle }}</h2>
                        <span class="co-count-tag">{{ group.cos.length }} COs Registered</span>
                    </div>
                    <div class="subject-meta-right">
                        <button *ngIf="role === 'admin' || role === 'faculty'" 
                                type="button" 
                                class="add-co-mini-btn" 
                                (click)="$event.stopPropagation(); openAddCoModal(group)">
                            + Add CO
                        </button>
                        <button type="button" class="toggle-arrow-btn">
                            {{ group.isExpanded ? '▲ Hide COs' : '▼ View COs' }}
                        </button>
                    </div>
                </div>

                <!-- Subject Card Body: Expandable COs List -->
                <div class="subject-card-body" *ngIf="group.isExpanded">
                    <div *ngIf="group.cos.length === 0" class="empty-co-msg">
                        No Course Outcomes defined for this subject yet.
                    </div>

                    <div class="co-items-table" *ngIf="group.cos.length > 0">
                        <div *ngFor="let outcome of group.cos; index as i" class="co-item-card">
                            <div class="co-badge-col">
                                <span class="co-pill-label">{{ outcome.co }}</span>
                            </div>
                            <div class="co-desc-col">
                                <p class="co-desc-text">{{ outcome.description }}</p>
                            </div>
                            <div class="co-action-col" *ngIf="role === 'admin' || role === 'faculty'">
                                <button type="button" class="btn-action edit" (click)="editOutcome(outcome, i)">
                                    ✏️ Edit
                                </button>
                                <button type="button" class="btn-action delete" (click)="deleteOutcome(outcome.id)">
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div *ngIf="filteredGroups.length === 0" class="empty-state-card">
                <span style="font-size: 2.5rem; margin-bottom: 8px;">🔍</span>
                <h3>No subjects match your search criteria.</h3>
                <p>Try searching with another keyword or course code.</p>
            </div>
        </div>

        <app-footer></app-footer>
    </div>

</div>`,
  styles: [
    `.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }`,
    `.header-pill { display: inline-block; padding: 4px 10px; background: rgba(212, 175, 55, 0.15); color: #fde68a; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 6px; font-size: 0.75rem; font-weight: 700; margin-bottom: 6px; text-transform: uppercase; }`,
    `.co-search-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }`,
    `.search-box { position: relative; display: flex; align-items: center; background: #091024; border: 1px solid #1f2f54; border-radius: 10px; padding: 0 14px; flex: 1; min-width: 280px; height: 44px; }`,
    `.search-box:focus-within { border-color: #38bdf8; box-shadow: 0 0 12px rgba(56, 189, 248, 0.25); }`,
    `.search-box .search-icon { font-size: 16px; color: #64748b; margin-right: 8px; }`,
    `.search-box input { background: transparent !important; border: none !important; color: #ffffff !important; font-size: 13.5px !important; width: 100% !important; outline: none !important; }`,
    `.clear-search { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 13px; }`,
    `.stats-pills { display: flex; gap: 10px; }`,
    `.stat-badge { background: #101b38; border: 1px solid #1f2f54; border-radius: 8px; padding: 8px 14px; font-size: 13px; color: #cbd5e1; }`,
    `.stat-badge.gold { border-color: rgba(212, 175, 55, 0.35); color: #fde68a; background: rgba(212, 175, 55, 0.1); }`,
    `.form-card { background: #101b38; border: 1.5px solid #d4af37; border-radius: 14px; padding: 22px; box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4); margin-bottom: 24px; animation: fadeIn 0.25s ease; }`,
    `.form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid #1f2f54; padding-bottom: 10px; }`,
    `.form-header h2 { margin: 0; font-size: 1.2rem; color: #ffffff; }`,
    `.close-form-btn { background: none; border: none; color: #94a3b8; font-size: 16px; cursor: pointer; }`,
    `.form-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 14px; }`,
    `.form-card label { width: 100%; display: block; margin-bottom: 14px; font-weight: 600; color: #cbd5e1; font-size: 13px; }`,
    `.form-card input, .form-card select, .form-card textarea { width: 100%; padding: 10px 12px; border: 1px solid #1f2f54; border-radius: 8px; font-size: 13.5px; margin-top: 6px; background: #091024; color: #ffffff; box-sizing: border-box; }`,
    `.form-actions { display: flex; gap: 12px; margin-top: 14px; }`,
    `.primary-button { background: linear-gradient(135deg, #d4af37 0%, #b38f28 100%); color: #0a1128; border: none; padding: 9px 20px; border-radius: 8px; cursor: pointer; font-weight: 800; font-size: 13px; transition: all 0.2s ease; box-shadow: 0 4px 14px rgba(212,175,55,0.3); }`,
    `.primary-button:hover { filter: brightness(1.1); transform: translateY(-1px); }`,
    `.secondary-button { background: #1f2f54; color: #cbd5e1; border: none; padding: 9px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px; }`,
    `.subject-cards-list { display: flex; flex-direction: column; gap: 16px; }`,
    `.subject-co-card { background: #101b38; border: 1px solid #1f2f54; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25); transition: border-color 0.2s ease; }`,
    `.subject-co-card:hover { border-color: rgba(212, 175, 55, 0.4); }`,
    `.subject-card-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: #0c152c; cursor: pointer; user-select: none; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid transparent; }`,
    `.subject-co-card:has(.subject-card-body) .subject-card-header { border-bottom-color: #1f2f54; }`,
    `.subject-meta-left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }`,
    `.course-code-badge { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); font-family: monospace; font-size: 0.85rem; font-weight: 800; padding: 4px 8px; border-radius: 6px; }`,
    `.subject-name-title { margin: 0; font-size: 1.1rem; color: #ffffff; font-weight: 700; }`,
    `.co-count-tag { background: rgba(212, 175, 55, 0.15); color: #fde68a; border: 1px solid rgba(212, 175, 55, 0.3); font-size: 0.75rem; font-weight: 700; padding: 3px 8px; border-radius: 6px; }`,
    `.subject-meta-right { display: flex; align-items: center; gap: 10px; }`,
    `.add-co-mini-btn { background: rgba(212, 175, 55, 0.15); color: #fde68a; border: 1px solid rgba(212, 175, 55, 0.35); padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; }`,
    `.add-co-mini-btn:hover { background: #d4af37; color: #0a1128; }`,
    `.toggle-arrow-btn { background: #1a294c; color: #cbd5e1; border: 1px solid #1f2f54; padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }`,
    `.subject-card-body { padding: 18px 20px; background: #091024; }`,
    `.co-items-table { display: flex; flex-direction: column; gap: 10px; }`,
    `.co-item-card { display: flex; align-items: center; gap: 16px; background: #101b38; border: 1px solid #1f2f54; border-radius: 10px; padding: 14px 16px; transition: all 0.2s ease; }`,
    `.co-item-card:hover { border-color: #38bdf8; background: #132247; }`,
    `.co-badge-col { width: 70px; flex-shrink: 0; }`,
    `.co-pill-label { display: inline-block; width: 100%; text-align: center; background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%); color: #ffffff; font-weight: 800; font-size: 0.85rem; padding: 6px 10px; border-radius: 6px; box-shadow: 0 2px 6px rgba(30, 64, 175, 0.3); }`,
    `.co-desc-col { flex: 1; }`,
    `.co-desc-text { margin: 0; font-size: 0.92rem; color: #e2e8f0; line-height: 1.5; }`,
    `.co-action-col { display: flex; gap: 8px; flex-shrink: 0; }`,
    `.btn-action { padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid; transition: all 0.2s ease; }`,
    `.btn-action.edit { background: rgba(56, 189, 248, 0.12); color: #38bdf8; border-color: rgba(56, 189, 248, 0.3); }`,
    `.btn-action.edit:hover { background: rgba(56, 189, 248, 0.25); color: #ffffff; }`,
    `.btn-action.delete { background: rgba(239, 68, 68, 0.12); color: #f87171; border-color: rgba(239, 68, 68, 0.3); }`,
    `.btn-action.delete:hover { background: rgba(239, 68, 68, 0.25); color: #ffffff; }`,
    `.empty-state-card { text-align: center; padding: 40px; background: #101b38; border: 1px dashed #1f2f54; border-radius: 14px; color: #94a3b8; }`,
    `@keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`
  ]
})
export class CourseOutcomes {
  private toast = inject(ToastService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  role: string | null = null;
  facultyName = '';
  showForm = false;
  editingIndex = -1;
  courseOutcomes: CourseOutcome[] = [];
  courses: string[] = [];
  searchQuery = '';

  groupedSubjectOutcomes: GroupedSubjectCOs[] = [];
  filteredGroups: GroupedSubjectCOs[] = [];

  currentOutcome: CourseOutcome = this.createEmptyOutcome();

  get totalCOsCount(): number {
    return this.groupedSubjectOutcomes.reduce((sum, g) => sum + g.cos.length, 0);
  }

  constructor() {
    this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
    this.facultyName = localStorage.getItem('userName') || '';
    this.loadCourses();
    this.loadOutcomes();
  }

  createEmptyOutcome(): CourseOutcome {
    return { id: 0, course: '', co: '', description: '' };
  }

  courseFullNameMap: { [key: string]: string } = {
    'CS101': 'CS101 - Database Management Systems',
    'CS102': 'CS102 - Data Structures & Algorithms',
    'CS103': 'CS103 - Object-Oriented Programming with Java',
    'CS201': 'CS201 - Operating Systems',
    'CS202': 'CS202 - Machine Learning & Data Science',
    'CS301': 'CS301 - Computer Networks & Protocols',
    'CS302': 'CS302 - Software Engineering & Agile Methodology',
    'CS303': 'CS303 - Cloud Computing & DevOps',
    'CS401': 'CS401 - Artificial Intelligence',
    'CS402': 'CS402 - Cyber Security & Cryptography',
    'IT111': 'IT111 - Calculus & Linear Algebra',
    'IT201': 'IT201 - Data Structures & Algorithms',
    'IT301': 'IT301 - Database Management Systems',
    'EC111': 'EC111 - Linear Algebra & Transform Calculus',
    'EC201': 'EC201 - Electronic Devices and Circuit Theory',
    'EE111': 'EE111 - Calculus & Differential Equations',
    'EE201': 'EE201 - Electric Circuit Analysis',
    'ME111': 'ME111 - Calculus & Linear Algebra',
    'ME201': 'ME201 - Engineering Thermodynamics',
    'CE111': 'CE111 - Calculus & Linear Algebra',
    'CE201': 'CE201 - Strength of Materials I'
  };

  getFullCourseName(courseStr: string): string {
    if (!courseStr) return '';
    const trimmed = courseStr.trim();
    if (this.courseFullNameMap[trimmed]) return this.courseFullNameMap[trimmed];
    
    for (const [k, v] of Object.entries(this.courseFullNameMap)) {
      if (trimmed.toLowerCase() === k.toLowerCase() || trimmed.toLowerCase().startsWith(k.toLowerCase())) {
        return v;
      }
    }
    const found = this.courses.find(c => c.toLowerCase().includes(trimmed.toLowerCase()) || trimmed.toLowerCase().includes(c.toLowerCase()));
    if (found) return found;

    return trimmed;
  }

  getRelevantCoursesForUser(): string[] {
    let assigned: string[] = [];
    try {
      const storedAssigned = localStorage.getItem('userAssignedCourses');
      if (storedAssigned) assigned = JSON.parse(storedAssigned);
    } catch {}

    if (this.role === 'faculty' || this.role === 'student') {
      const studentName = (localStorage.getItem('userName') || '').toLowerCase();
      try {
        const studentCourses = JSON.parse(localStorage.getItem('obslmsStudentCourses') || '[]');
        studentCourses.forEach((sc: any) => {
          const scName = (sc.studentName || '').toLowerCase();
          if (scName.includes(studentName) || studentName.includes(scName)) {
            if (sc.courseCode && !assigned.includes(sc.courseCode)) assigned.push(sc.courseCode);
            if (sc.courseTitle && !assigned.includes(sc.courseTitle)) assigned.push(sc.courseTitle);
          }
        });
      } catch {}

      if (assigned.length === 0) {
        const dept = (localStorage.getItem('userDept') || localStorage.getItem('userDepartment') || 'CSE').toLowerCase();
        if (dept.includes('computer') || dept.includes('cse')) {
          assigned = ['CS101', 'CS102', 'CS103', 'CS201', 'CS202', 'CS301', 'CS302', 'CS401', 'CS402'];
        } else if (dept.includes('information') || dept.includes('it')) {
          assigned = ['IT111', 'IT121', 'IT201', 'IT211', 'IT301', 'IT311', 'IT401', 'IT411'];
        } else if (dept.includes('electronic') || dept.includes('ece')) {
          assigned = ['EC111', 'EC121', 'EC201', 'EC211', 'EC301', 'EC311', 'EC401', 'EC411'];
        } else if (dept.includes('electrical') || dept.includes('eee')) {
          assigned = ['EE111', 'EE121', 'EE201', 'EE211', 'EE301', 'EE311', 'EE401', 'EE411'];
        } else if (dept.includes('mechanical') || dept.includes('me')) {
          assigned = ['ME111', 'ME121', 'ME201', 'ME211', 'ME301', 'ME311', 'ME401', 'ME411'];
        } else if (dept.includes('civil') || dept === 'ce') {
          assigned = ['CE111', 'CE121', 'CE201', 'CE211', 'CE301', 'CE311', 'CE401', 'CE411'];
        }
      }
    }
    return assigned;
  }

  loadCourses(): void {
    const facultyParam = (this.role === 'faculty' && this.facultyName) ? encodeURIComponent(this.facultyName) : '';
    const url = facultyParam ? `http://localhost:8080/api/courses?faculty=${facultyParam}` : 'http://localhost:8080/api/courses';

    this.http.get<Array<{ code: string; title: string }>>(url).subscribe({
      next: (courseList: Array<{ code: string; title: string }>) => {
        let list = courseList;
        const assigned = this.getRelevantCoursesForUser();
        if (assigned.length > 0 && (this.role === 'faculty' || this.role === 'student')) {
          list = courseList.filter((c: any) => 
            assigned.some(a => 
              a.toLowerCase() === (c.code || '').toLowerCase() ||
              a.toLowerCase() === (c.title || '').toLowerCase() ||
              (c.title && c.title.toLowerCase().includes(a.toLowerCase())) ||
              (c.code && a.toLowerCase().includes(c.code.toLowerCase()))
            )
          );
        }
        this.courses = list
          .map((c: any) => `${c.code ? c.code : ''}${c.code && c.title ? ' - ' : ''}${c.title ? c.title : ''}`)
          .filter(Boolean);
        this.groupOutcomesBySubject();
        this.cdr.detectChanges();
      },
      error: () => {
        try {
          const stored = localStorage.getItem('obslmsCourses');
          const courseList = stored ? JSON.parse(stored) as Array<{ code: string; title: string }> : [];
          this.courses = courseList
            .map((c: any) => `${c.code ? c.code : ''}${c.code && c.title ? ' - ' : ''}${c.title ? c.title : ''}`)
            .filter(Boolean);
        } catch {
          this.courses = [];
        }
        this.groupOutcomesBySubject();
      }
    });
  }

  getStandardFallbackCOs(courseCode: string, courseTitle: string): CourseOutcome[] {
    const code = courseCode.toUpperCase();
    const t = courseTitle.toLowerCase();
    
    if (code.startsWith('CS') || t.includes('program') || t.includes('c ') || t.includes('problem')) {
      return [
        { id: Math.floor(Math.random() * 90000) + 1000, course: courseCode, co: 'CO1', description: `Recall and outline fundamental syntax, operators, control flow constructs, and data types of ${courseTitle}.` },
        { id: Math.floor(Math.random() * 90000) + 1000, course: courseCode, co: 'CO2', description: `Design modular algorithms, flowcharts, and structured functions to solve computational problems in ${courseTitle}.` },
        { id: Math.floor(Math.random() * 90000) + 1000, course: courseCode, co: 'CO3', description: `Implement arrays, pointers, dynamic memory allocation, and file handling constructs effectively.` },
        { id: Math.floor(Math.random() * 90000) + 1000, course: courseCode, co: 'CO4', description: `Analyze algorithm efficiency, time-space complexity trade-offs, and debug runtime errors.` },
        { id: Math.floor(Math.random() * 90000) + 1000, course: courseCode, co: 'CO5', description: `Develop robust end-to-end applications adhering to standard coding guidelines and software engineering practices.` }
      ];
    }
    
    return [
      { id: Math.floor(Math.random() * 90000) + 1000, course: courseCode, co: 'CO1', description: `Understand and outline fundamental concepts, principles, and theoretical foundations of ${courseTitle}.` },
      { id: Math.floor(Math.random() * 90000) + 1000, course: courseCode, co: 'CO2', description: `Analyze technical specifications, model domain requirements, and evaluate solution constraints in ${courseTitle}.` },
      { id: Math.floor(Math.random() * 90000) + 1000, course: courseCode, co: 'CO3', description: `Apply practical frameworks, design constructs, and problem-solving methodologies for ${courseTitle}.` },
      { id: Math.floor(Math.random() * 90000) + 1000, course: courseCode, co: 'CO4', description: `Evaluate performance metrics, system tradeoffs, and quality verification standards.` },
      { id: Math.floor(Math.random() * 90000) + 1000, course: courseCode, co: 'CO5', description: `Synthesize comprehensive case studies, industrial applications, and engineering project deliverables.` }
    ];
  }

  groupOutcomesBySubject(): void {
    const groupMap = new Map<string, GroupedSubjectCOs>();

    // 1. Initialize groups from available assigned courses
    this.courses.forEach(fullCourseStr => {
      const parts = fullCourseStr.split(' - ');
      const code = parts[0]?.trim() || fullCourseStr;
      const title = parts.length > 1 ? parts.slice(1).join(' - ').trim() : code;

      groupMap.set(code.toLowerCase(), {
        courseCode: code,
        courseTitle: title,
        fullCourseName: fullCourseStr,
        cos: [],
        isExpanded: true
      });
    });

    // 2. Map existing Course Outcomes into respective subject groups
    this.courseOutcomes.forEach(co => {
      const rawCode = (co.course || '').split(' - ')[0].trim();
      const key = rawCode.toLowerCase();

      if (!groupMap.has(key)) {
        const full = this.getFullCourseName(co.course);
        const parts = full.split(' - ');
        const code = parts[0]?.trim() || co.course;
        const title = parts.length > 1 ? parts.slice(1).join(' - ').trim() : code;

        groupMap.set(key, {
          courseCode: code,
          courseTitle: title,
          fullCourseName: full,
          cos: [],
          isExpanded: true
        });
      }

      const grp = groupMap.get(key)!;
      if (!grp.cos.some(c => c.co.toLowerCase() === co.co.toLowerCase())) {
        grp.cos.push(co);
      }
    });

    // 3. For any assigned course with 0 COs, populate standard fallback COs
    groupMap.forEach(grp => {
      if (grp.cos.length === 0) {
        grp.cos = this.getStandardFallbackCOs(grp.courseCode, grp.courseTitle);
      }
      grp.cos.sort((a, b) => (a.co || '').localeCompare(b.co || '', undefined, { numeric: true }));
    });

    this.groupedSubjectOutcomes = Array.from(groupMap.values());
    this.filterGroups();
  }

  filterGroups(): void {
    if (!this.searchQuery.trim()) {
      this.filteredGroups = [...this.groupedSubjectOutcomes];
      return;
    }

    const q = this.searchQuery.trim().toLowerCase();
    this.filteredGroups = this.groupedSubjectOutcomes.filter(g =>
      g.courseCode.toLowerCase().includes(q) ||
      g.courseTitle.toLowerCase().includes(q) ||
      g.cos.some(co => co.co.toLowerCase().includes(q) || co.description.toLowerCase().includes(q))
    );
  }

  toggleGroup(group: GroupedSubjectCOs): void {
    group.isExpanded = !group.isExpanded;
  }

  openAddCoModal(group: GroupedSubjectCOs): void {
    this.resetForm();
    this.currentOutcome.course = group.fullCourseName;
    this.currentOutcome.co = 'CO' + (group.cos.length + 1);
    this.showForm = true;
    window.scrollTo({ top: 100, behavior: 'smooth' });
  }

  loadOutcomes(): void {
    const facultyParam = (this.role === 'faculty' && this.facultyName) ? encodeURIComponent(this.facultyName) : '';
    const url = facultyParam ? `http://localhost:8080/api/copo/co?faculty=${facultyParam}` : 'http://localhost:8080/api/copo/co';

    this.http.get<CourseOutcome[]>(url).subscribe({
      next: (data: CourseOutcome[]) => {
        let list = data;
        const assigned = this.getRelevantCoursesForUser();
        if (assigned.length > 0 && (this.role === 'faculty' || this.role === 'student')) {
          list = data.filter((co: CourseOutcome) => 
            assigned.some(a => 
              a.toLowerCase() === (co.course || '').toLowerCase() ||
              (co.course && (co.course.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(co.course.toLowerCase())))
            )
          );
        }
        this.courseOutcomes = list;
        try {
          localStorage.setItem('obslmsCourseOutcomes', JSON.stringify(this.courseOutcomes));
        } catch {}
        this.groupOutcomesBySubject();
        this.cdr.detectChanges();
      },
      error: () => {
        try {
          const stored = localStorage.getItem('obslmsCourseOutcomes');
          let list = stored ? JSON.parse(stored) as CourseOutcome[] : [];
          const assigned = this.getRelevantCoursesForUser();
          if (assigned.length > 0 && (this.role === 'faculty' || this.role === 'student')) {
            list = list.filter(co => 
              assigned.some(a => 
                a.toLowerCase() === (co.course || '').toLowerCase() ||
                (co.course && (co.course.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(co.course.toLowerCase())))
              )
            );
          }
          this.courseOutcomes = list;
        } catch {
          this.courseOutcomes = [];
        }
        this.groupOutcomesBySubject();
      }
    });
  }

  saveOutcomes(): void {
    try {
      localStorage.setItem('obslmsCourseOutcomes', JSON.stringify(this.courseOutcomes));
    } catch {}
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.resetForm();
    }
  }

  saveOutcome(): void {
    if (!this.currentOutcome.course || !this.currentOutcome.co.trim() || !this.currentOutcome.description.trim()) {
      this.toast.warning('Please fill in all outcome fields.');
      return;
    }

    // Extract raw course code from "CS101 - Database Management Systems"
    const rawCourse = this.currentOutcome.course.split('-')[0].trim();

    const payload = {
      id: this.currentOutcome.id > 0 ? this.currentOutcome.id : null,
      course: rawCourse,
      co: this.currentOutcome.co.trim().toUpperCase(),
      description: this.currentOutcome.description.trim()
    };

    this.http.post<CourseOutcome>('http://localhost:8080/api/copo/co', payload).subscribe({
      next: (saved: CourseOutcome) => {
        this.toast.success(`Course Outcome ${payload.co} saved successfully.`);
        this.loadOutcomes();
        this.resetForm();
        this.showForm = false;
      },
      error: () => {
        if (this.editingIndex >= 0) {
          this.courseOutcomes[this.editingIndex] = { ...this.currentOutcome, course: rawCourse, co: payload.co };
          this.toast.success(`Course Outcome ${payload.co} updated.`);
        } else {
          const nextId = this.courseOutcomes.length ? Math.max(...this.courseOutcomes.map(o => o.id)) + 1 : 1;
          this.courseOutcomes = [...this.courseOutcomes, { ...this.currentOutcome, id: nextId, course: rawCourse, co: payload.co }];
          this.toast.success(`Course Outcome ${payload.co} created.`);
        }
        this.saveOutcomes();
        this.resetForm();
        this.showForm = false;
        this.cdr.detectChanges();
      }
    });
  }

  editOutcome(outcome: CourseOutcome, index: number): void {
    this.editingIndex = index;
    // Find matching dropdown string
    const match = this.courses.find(c => c.toLowerCase().includes(outcome.course.toLowerCase())) || outcome.course;
    this.currentOutcome = { ...outcome, course: match };
    this.showForm = true;
  }

  deleteOutcome(id: number): void {
    this.http.delete('http://localhost:8080/api/copo/co/' + id).subscribe({
      next: () => {
        this.toast.info('Course Outcome removed.');
        this.loadOutcomes();
      },
      error: () => {
        this.courseOutcomes = this.courseOutcomes.filter(o => o.id !== id);
        this.saveOutcomes();
        this.toast.info('Course Outcome removed.');
        this.cdr.detectChanges();
      }
    });
    if (this.editingIndex >= 0 && this.courseOutcomes[this.editingIndex]?.id !== id) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.editingIndex = -1;
    this.currentOutcome = this.createEmptyOutcome();
  }
}
