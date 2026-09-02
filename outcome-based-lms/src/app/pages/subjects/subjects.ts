import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { ToastService } from '../../shared/services/toast.service';

interface SubjectRecord {
  id: number;
  code: string;
  name: string;
  type: string;
  credits: number;
  semester: string;
  department?: string;
  isRegistered?: boolean;
}

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer, MatButtonModule],
  template: `
    <app-navbar></app-navbar>

    <div class="container">
      <app-sidebar></app-sidebar>

      <div class="content">
        <div class="page-header">
          <div class="header-text-group">
            <span class="header-pill">📚 Master Curriculum Registry</span>
            <h1>Curriculum Subjects Repository</h1>
            <p>Accredited syllabus subjects tailored to student registered courses and academic branch.</p>
          </div>
          <div class="stats-badge-card" *ngIf="subjects.length > 0">
            <span class="count-num">{{ filteredSubjects.length }}</span>
            <span class="count-lbl">{{ viewMode === 'registered' ? 'Registered' : (viewMode === 'branch' ? 'Branch Subjects' : 'Total Subjects') }}</span>
          </div>
        </div>

        <!-- Student Context Banner -->
        <div class="student-context-card" *ngIf="userRole === 'student'">
          <div class="context-avatar">👨‍🎓</div>
          <div class="context-details">
            <div class="context-title">
              <strong>{{ userName }}</strong>
              <span class="role-chip">Active Student</span>
              <span class="branch-chip">{{ userDept }}</span>
            </div>
            <p class="context-sub">
              Showing curriculum subjects registered for your profile across <strong>{{ userDept }}</strong> (Semester 6).
            </p>
          </div>
          <div class="context-actions">
            <button type="button" class="switch-view-btn" [class.active]="viewMode === 'registered'" (click)="setViewMode('registered')">
              🌟 My Registered Subjects ({{ registeredCount }})
            </button>
            <button type="button" class="switch-view-btn" [class.active]="viewMode === 'branch'" (click)="setViewMode('branch')">
              🏛️ {{ shortDept }} Curriculum
            </button>
            <button type="button" class="switch-view-btn" [class.active]="viewMode === 'all'" (click)="setViewMode('all')">
              🌐 All Branches
            </button>
          </div>
        </div>

        <!-- Filter and Search Toolbar -->
        <div class="subjects-toolbar">
          <div class="search-input-wrap">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              placeholder="Search by code (e.g. CS101, IT305, DSLD) or subject title..." 
            />
          </div>

          <!-- Branch Filter Pills (Always Accessible) -->
          <div class="dept-filter-group">
            <button 
              type="button" 
              class="dept-pill" 
              [class.active]="selectedDeptFilter === ''" 
              (click)="selectDepartmentFilter('')">
              All Branches
            </button>
            <button 
              type="button" 
              class="dept-pill" 
              [class.active]="selectedDeptFilter === 'CSE'" 
              (click)="selectDepartmentFilter('CSE')">
              💻 CSE
            </button>
            <button 
              type="button" 
              class="dept-pill" 
              [class.active]="selectedDeptFilter === 'IT'" 
              (click)="selectDepartmentFilter('IT')">
              🌐 IT
            </button>
            <button 
              type="button" 
              class="dept-pill" 
              [class.active]="selectedDeptFilter === 'ECE'" 
              (click)="selectDepartmentFilter('ECE')">
              📡 ECE
            </button>
            <button 
              type="button" 
              class="dept-pill" 
              [class.active]="selectedDeptFilter === 'ME'" 
              (click)="selectDepartmentFilter('ME')">
              ⚙️ Mechanical
            </button>
            <button 
              type="button" 
              class="dept-pill" 
              [class.active]="selectedDeptFilter === 'Civil'" 
              (click)="selectDepartmentFilter('Civil')">
              🏗️ Civil
            </button>
          </div>

          <div class="filter-group">
            <button 
              type="button" 
              class="filter-pill-btn" 
              [class.active]="selectedType === ''" 
              (click)="selectedType = ''">
              All Types
            </button>
            <button 
              type="button" 
              class="filter-pill-btn" 
              [class.active]="selectedType === 'Theory'" 
              (click)="selectedType = 'Theory'">
              📖 Theory
            </button>
            <button 
              type="button" 
              class="filter-pill-btn" 
              [class.active]="selectedType === 'Lab'" 
              (click)="selectedType = 'Lab'">
              🔬 Lab / Practical
            </button>
          </div>
        </div>

        <!-- Subjects Master Table -->
        <div class="subjects-table-card">
          <div class="table-meta-bar">
            <span class="showing-text">
              Showing <strong>{{ paginatedSubjects.length }}</strong> of <strong>{{ filteredSubjects.length }}</strong> subjects 
              <span *ngIf="viewMode === 'registered'" class="registered-tag">● Student Enrolled</span>
            </span>
            <div class="pagination-controls" *ngIf="totalPages > 1">
              <button 
                type="button" 
                class="page-btn" 
                [disabled]="currentPage === 1" 
                (click)="currentPage = currentPage - 1">
                ◀ Prev
              </button>
              <span class="page-indicator">Page {{ currentPage }} of {{ totalPages }}</span>
              <button 
                type="button" 
                class="page-btn" 
                [disabled]="currentPage === totalPages" 
                (click)="currentPage = currentPage + 1">
                Next ▶
              </button>
            </div>
          </div>

          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th style="width: 70px;">ID</th>
                  <th style="width: 140px;">Subject Code</th>
                  <th>Subject Title & Curriculum Name</th>
                  <th style="width: 150px;">Department</th>
                  <th style="width: 130px;">Type</th>
                  <th style="width: 90px; text-align: center;">Credits</th>
                  <th style="width: 140px; text-align: center;">Registration</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="filteredSubjects.length === 0">
                  <td colspan="7" class="empty-state">
                    📭 No subjects found matching "<strong>{{ searchQuery }}</strong>"
                  </td>
                </tr>
                <tr *ngFor="let subject of paginatedSubjects">
                  <td class="sub-id-cell">#{{ subject.id }}</td>
                  <td>
                    <span class="obe-badge code-badge">{{ subject.code }}</span>
                  </td>
                  <td>
                    <strong class="subject-title">{{ subject.name }}</strong>
                  </td>
                  <td>
                    <span class="dept-label">{{ getDepartmentName(subject.code, subject.name) }}</span>
                  </td>
                  <td>
                    <span class="type-badge" [ngClass]="getTypeClass(subject.type)">
                      {{ subject.type || 'Theory' }}
                    </span>
                  </td>
                  <td style="text-align: center;">
                    <span class="credits-badge">{{ subject.credits }}</span>
                  </td>
                  <td style="text-align: center;">
                    <span *ngIf="isCourseEnrolled(subject.code, subject.name)" class="status-badge enrolled">
                      ✓ Registered
                    </span>
                    <span *ngIf="!isCourseEnrolled(subject.code, subject.name)" class="status-badge accredited">
                      Accredited
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="table-bottom-bar" *ngIf="filteredSubjects.length > 0">
            <span class="showing-text">
              Total Credits: <strong>{{ totalCreditsCount }}</strong>
            </span>
          </div>
        </div>

        <app-footer></app-footer>
      </div>
    </div>
  `,
  styles: [
    `
    .student-context-card {
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
      color: #ffffff;
      padding: 18px 22px;
      border-radius: 14px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      box-shadow: 0 4px 18px rgba(37, 99, 235, 0.18);
    }
    .context-avatar { font-size: 2.2rem; }
    .context-details { flex: 1; min-width: 260px; }
    .context-title { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .context-title strong { font-size: 1.2rem; font-weight: 800; }
    .role-chip { background: rgba(255, 255, 255, 0.2); padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .branch-chip { background: #10b981; color: #ffffff; padding: 2px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 800; }
    .context-sub { margin: 4px 0 0 0; font-size: 0.88rem; color: rgba(255, 255, 255, 0.88); }
    
    .context-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .switch-view-btn {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: #ffffff;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .switch-view-btn:hover { background: rgba(255, 255, 255, 0.25); }
    .switch-view-btn.active { background: #ffffff; color: #1e3a8a; font-weight: 800; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }

    .header-pill { display: inline-block; background: rgba(30, 58, 138, 0.08); color: #1e3a8a; font-weight: 700; font-size: 11.5px; padding: 3px 10px; border-radius: 6px; margin-bottom: 6px; text-transform: uppercase; }
    .stats-badge-card { background: white; padding: 12px 18px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.04); display: flex; flex-direction: column; }
    .count-num { font-size: 1.8rem; font-weight: 800; color: #1e40af; }
    .count-lbl { font-size: 0.75rem; text-transform: uppercase; font-weight: 600; color: #64748b; }
    
    .subjects-toolbar { background: white; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 14px; align-items: center; justify-content: space-between; }
    .search-input-wrap { display: flex; align-items: center; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 6px 12px; flex: 1; min-width: 260px; }
    .search-icon { margin-right: 8px; font-size: 1rem; }
    .search-input-wrap input { border: none; background: transparent; width: 100%; outline: none; font-size: 0.95rem; color: #1e293b; }
    
    .dept-filter-group { display: flex; gap: 6px; flex-wrap: wrap; }
    .dept-pill { border: 1px solid #cbd5e1; background: #f8fafc; color: #475569; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.15s ease; }
    .dept-pill:hover { background: #e2e8f0; }
    .dept-pill.active { background: #1e40af; color: #ffffff; border-color: #1e40af; }

    .filter-group { display: flex; gap: 8px; flex-wrap: wrap; }
    .filter-pill-btn { border: 1px solid #cbd5e1; background: white; color: #475569; padding: 6px 14px; border-radius: 999px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
    .filter-pill-btn:hover { background: #f1f5f9; }
    .filter-pill-btn.active { background: #1e3a8a; color: white; border-color: #1e3a8a; }

    .subjects-table-card { background: white; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); }
    .table-meta-bar { padding: 14px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
    .table-bottom-bar { padding: 14px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .showing-text { font-size: 0.85rem; color: #64748b; }
    .registered-tag { background: #dcfce7; color: #15803d; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-left: 6px; }

    .pagination-controls { display: flex; align-items: center; gap: 8px; }
    .page-btn { background: white; border: 1px solid #cbd5e1; color: #334155; padding: 4px 10px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
    .page-btn:hover:not(:disabled) { background: #e2e8f0; }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-indicator { font-size: 0.85rem; font-weight: 600; color: #1e293b; padding: 0 4px; }
    
    .table-responsive { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { background: #f8fafc; padding: 12px 16px; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
    td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; vertical-align: middle; }
    tr:hover td { background: #f8fafc; }
    
    .sub-id-cell { color: #94a3b8; font-weight: 600; font-family: monospace; }
    .code-badge { background: #eff6ff; color: #1d4ed8; font-weight: 700; font-family: monospace; padding: 4px 8px; border-radius: 6px; border: 1px solid #bfdbfe; }
    .subject-title { color: #0f172a; font-weight: 600; }
    .dept-label { font-size: 12px; font-weight: 600; color: #475569; }
    
    .type-badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; }
    .type-theory { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .type-lab { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    .type-elective { background: #f3e8ff; color: #7e22ce; border: 1px solid #e9d5ff; }
    
    .credits-badge { background: #f1f5f9; color: #334155; font-weight: 700; padding: 2px 8px; border-radius: 6px; display: inline-block; }
    .status-badge { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
    .status-badge.enrolled { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .status-badge.accredited { background: #f1f5f9; color: #64748b; }
    .empty-state { text-align: center; padding: 40px; color: #64748b; font-size: 1rem; }
    `
  ]
})
export class Subjects implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  userRole: string = 'student';
  userName: string = 'Krishnavamsi';
  userEmail: string = 'krishnavamsi@gmail.com';
  userDept: string = 'Computer Science & Engineering';
  enrolledCourseCodes: string[] = ['CS101', 'CS102', 'CS103', 'CS301', 'CS302'];

  subjects: SubjectRecord[] = [];
  searchQuery = '';
  selectedType = '';
  selectedDeptFilter = '';
  viewMode: 'registered' | 'branch' | 'all' = 'registered';
  currentPage = 1;
  pageSize = 25;

  get shortDept(): string {
    const d = this.userDept.toLowerCase();
    if (d.includes('computer') || d.includes('cse')) return 'CSE';
    if (d.includes('information') || d.includes('it')) return 'IT';
    if (d.includes('electronic') || d.includes('ece')) return 'ECE';
    if (d.includes('mechanical') || d.includes('me')) return 'ME';
    if (d.includes('civil') || d.includes('ce')) return 'Civil';
    return 'Engineering';
  }

  get registeredCount(): number {
    return this.subjects.filter(s => this.isCourseEnrolled(s.code, s.name)).length;
  }

  get totalCreditsCount(): number {
    return this.filteredSubjects.reduce((sum, s) => sum + (s.credits || 3), 0);
  }

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadSubjectsFromBackend();
  }

  loadUserProfile(): void {
    try {
      this.userRole = localStorage.getItem('userRole')?.toLowerCase() || 'student';
      this.userName = localStorage.getItem('userName') || 'Krishnavamsi';
      this.userEmail = localStorage.getItem('userEmail') || 'krishnavamsi@gmail.com';
      this.userDept = localStorage.getItem('userDept') || localStorage.getItem('userDepartment') || 'Computer Science & Engineering';

      const storedAssigned = localStorage.getItem('userAssignedCourses');
      if (storedAssigned) {
        this.enrolledCourseCodes = JSON.parse(storedAssigned);
      } else {
        const d = this.userDept.toLowerCase();
        if (d.includes('computer') || d.includes('cse')) {
          this.enrolledCourseCodes = ['CS101', 'CS102', 'CS103', 'CS301', 'CS302'];
        } else if (d.includes('information') || d.includes('it')) {
          this.enrolledCourseCodes = ['IT305', 'CS303', 'Linux', 'WT', 'CS361'];
        } else if (d.includes('electronic') || d.includes('ece')) {
          this.enrolledCourseCodes = ['MES', 'DSLD', 'EC206', 'EE407', 'CS203'];
        } else if (d.includes('mechanical') || d.includes('me')) {
          this.enrolledCourseCodes = ['ME210', 'KM', 'SMSE', '04ME6512', 'IC'];
        } else if (d.includes('civil') || d.includes('ce')) {
          this.enrolledCourseCodes = ['FMHM', 'SMSE', 'HS300', 'CE234', 'EMII'];
        }
      }

      if (this.userRole !== 'student') {
        this.viewMode = 'all';
      }
    } catch {}
  }

  setViewMode(mode: 'registered' | 'branch' | 'all'): void {
    this.viewMode = mode;
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  loadSubjectsFromBackend(): void {
    this.http.get<any[]>('http://localhost:8080/api/dataset/subjects').subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          this.subjects = data.map(item => {
            const code = item.subCode || '';
            const name = item.subjectName || '';
            const type = item.subjectType || 'Theory';
            const isReg = this.isCourseEnrolled(code, name);
            return {
              id: item.subId || 0,
              code: code,
              name: name,
              type: type,
              credits: type.toLowerCase().includes('lab') ? 2 : (type.toLowerCase().includes('elective') ? 3 : 4),
              semester: 'Semester 6',
              department: this.getDepartmentName(code, name),
              isRegistered: isReg
            };
          });
          this.cdr.detectChanges();
        } else {
          this.loadFallbackSubjects();
        }
      },
      error: () => {
        this.loadFallbackSubjects();
      }
    });
  }

  private loadFallbackSubjects(): void {
    const fallbackList: SubjectRecord[] = [
      { id: 1, code: 'CS101', name: 'Database Management Systems', type: 'Theory', credits: 4, semester: 'Semester 6', department: 'Computer Science & Engineering', isRegistered: true },
      { id: 2, code: 'CS102', name: 'Java & OOPs Programming', type: 'Theory', credits: 4, semester: 'Semester 6', department: 'Computer Science & Engineering', isRegistered: true },
      { id: 3, code: 'CS103', name: 'Data Structures & Algorithms', type: 'Theory', credits: 4, semester: 'Semester 6', department: 'Computer Science & Engineering', isRegistered: true },
      { id: 4, code: 'CS301', name: 'Operating Systems', type: 'Theory', credits: 4, semester: 'Semester 6', department: 'Computer Science & Engineering', isRegistered: true },
      { id: 5, code: 'CS302', name: 'Computer Networks', type: 'Theory', credits: 4, semester: 'Semester 6', department: 'Computer Science & Engineering', isRegistered: true },
      { id: 6, code: 'CS102L', name: 'Database & SQL Laboratory', type: 'Lab', credits: 2, semester: 'Semester 6', department: 'Computer Science & Engineering', isRegistered: true },
      { id: 7, code: 'IT305', name: 'Web Technology & Frameworks', type: 'Theory', credits: 4, semester: 'Semester 6', department: 'Information Technology', isRegistered: false },
      { id: 8, code: 'CS303', name: 'Cloud Computing & DevOps', type: 'Theory', credits: 4, semester: 'Semester 6', department: 'Information Technology', isRegistered: false },
      { id: 9, code: 'MES', name: 'Microprocessors & Embedded Systems', type: 'Theory', credits: 4, semester: 'Semester 6', department: 'Electronics & Communication Engineering', isRegistered: false },
      { id: 10, code: 'DSLD', name: 'Digital Signal & Logic Design', type: 'Theory', credits: 4, semester: 'Semester 6', department: 'Electronics & Communication Engineering', isRegistered: false },
      { id: 11, code: 'ME210', name: 'Kinematics & Machine Dynamics', type: 'Theory', credits: 4, semester: 'Semester 6', department: 'Mechanical Engineering', isRegistered: false },
      { id: 12, code: 'FMHM', name: 'Fluid Mechanics & Hydraulic Machines', type: 'Theory', credits: 4, semester: 'Semester 6', department: 'Civil Engineering', isRegistered: false }
    ];
    this.subjects = fallbackList;
    this.cdr.detectChanges();
  }

  isCourseEnrolled(code: string, name: string): boolean {
    const c = (code || '').toLowerCase();
    const n = (name || '').toLowerCase();
    return this.enrolledCourseCodes.some(ec => {
      const e = ec.toLowerCase().trim();
      return c === e || c.includes(e) || e.includes(c) || n.includes(e);
    });
  }

  selectDepartmentFilter(dept: string): void {
    this.selectedDeptFilter = dept;
    if (dept !== '') {
      this.viewMode = 'all';
    }
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  getDepartmentName(code: string, name: string): string {
    const c = (code || '').toUpperCase().trim();
    const n = (name || '').toLowerCase().trim();

    // 1. Civil Engineering
    if (c === 'FMHM' || c === 'SMSE' || c === 'CE234' || c === 'EMII' || c.startsWith('CE') || 
        n.includes('fluid mechanics') || n.includes('strength of materials') || 
        n.includes('structural') || n.includes('civil') || n.includes('survey')) {
      return 'Civil Engineering';
    }

    // 2. Mechanical Engineering
    if (c === 'ME210' || c === 'KM' || c === 'IC' || c === '04ME6512' || c === 'AU203' || c.startsWith('ME') || c.startsWith('AU') ||
        n.includes('kinematics') || n.includes('i c engine') || n.includes('metallurgy') || 
        n.includes('manufacturing') || n.includes('auto chassis') || n.includes('cad') || n.includes('mechanical')) {
      return 'Mechanical Engineering';
    }

    // 3. Electronics & Communication Engineering (ECE)
    if (c === 'MES' || c === 'DSLD' || c === 'CS203' || c === 'CS207' || c === 'EC206' || c === 'EE407' || c === 'AMP' || c === 'HARDWARE LAB' || c === 'EE233' || c === 'LD LAB' || c.startsWith('EC') || c.startsWith('EE') ||
        n.includes('microprocessor') || n.includes('logic design') || n.includes('switching theory') || 
        n.includes('electronics') || n.includes('digital signal') || n.includes('hardware & microprocessor')) {
      return 'Electronics & Communication Engineering';
    }

    // 4. Information Technology (IT)
    if (c === 'IT305' || c === 'CS303' || c === 'LINUX' || c === 'LINUX LAB' || c === 'OPEN LAB' || c === 'WT' || c === 'RLMCA108' || c.startsWith('IT') ||
        n.includes('web tech') || n.includes('shell programming') || n.includes('linux') || 
        n.includes('cloud') || n.includes('devops') || n.includes('open source') || n.includes('operations research')) {
      return 'Information Technology';
    }

    // 5. Computer Science & Engineering (CSE)
    if (c.startsWith('CS') || c === 'DS' || c === 'DS LAB' || c === 'OOP' || c === 'C++ LAB' || c === 'OOMD' || c === 'CC' || c === 'C' || c === 'COMPUTER LAB' || c === 'HPC' || c === 'RLMCA101' || c === 'RLMCA201' || c === 'RLMCA205' || c === 'RLMCA231' ||
        n.includes('data structure') || n.includes('database') || n.includes('algorithm') || 
        n.includes('c++') || n.includes('compiler') || n.includes('computer networks') || 
        n.includes('programming in c') || n.includes('object oriented') || n.includes('soft computing') || n.includes('high performance')) {
      return 'Computer Science & Engineering';
    }

    // 6. Foundation / General Engineering (INMCA202 Probability & Statistics, etc.)
    if (c === 'INMCA202' || c === 'STATISTICS' || c === 'EM IV' || c === 'INMCA102' || c === 'ECS' || c === 'HS300' || c === 'OTHER') {
      return 'General Engineering';
    }

    return 'Computer Science & Engineering';
  }

  get filteredSubjects(): SubjectRecord[] {
    const q = this.searchQuery.toLowerCase().trim();

    return this.subjects.filter(s => {
      const sDept = (s.department || this.getDepartmentName(s.code, s.name)).toLowerCase();

      // 1. Department Filter Pill (if chosen by user e.g. CSE, IT, ECE, ME, Civil)
      if (this.selectedDeptFilter) {
        const filt = this.selectedDeptFilter.toLowerCase();
        let matches = false;
        if (filt === 'cse' || filt === 'computer') {
          matches = sDept.includes('computer') || sDept.includes('cse');
        } else if (filt === 'it' || filt === 'information') {
          matches = sDept.includes('information') || sDept.includes('it');
        } else if (filt === 'ece' || filt === 'electronics') {
          matches = sDept.includes('electronic') || sDept.includes('ece') || sDept.includes('electrical');
        } else if (filt === 'me' || filt === 'mechanical') {
          matches = sDept.includes('mechanical') || sDept.includes('me') || sDept.includes('auto');
        } else if (filt === 'civil' || filt === 'ce') {
          matches = sDept.includes('civil') || sDept.includes('ce') || sDept.includes('structural');
        } else {
          matches = sDept.includes(filt);
        }
        if (!matches) return false;
      } else {
        // Only apply registered/branch view mode restriction when NO specific department pill is selected
        if (this.viewMode === 'registered') {
          if (!this.isCourseEnrolled(s.code, s.name)) {
            return false;
          }
        } else if (this.viewMode === 'branch') {
          const uDept = this.userDept.toLowerCase();
          if (!sDept.includes(this.shortDept.toLowerCase()) && !uDept.includes(sDept.split(' ')[0])) {
            return false;
          }
        }
      }

      // 2. Search Query Filter
      const matchesSearch = !q || s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || sDept.includes(q);

      // 3. Type Filter
      const matchesType = !this.selectedType || s.type.toLowerCase().includes(this.selectedType.toLowerCase());

      return matchesSearch && matchesType;
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredSubjects.length / this.pageSize) || 1;
  }

  get paginatedSubjects(): SubjectRecord[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredSubjects.slice(startIndex, startIndex + this.pageSize);
  }

  getTypeClass(type: string): string {
    const t = (type || '').toLowerCase();
    if (t.includes('lab') || t.includes('practical')) return 'type-lab';
    if (t.includes('elective')) return 'type-elective';
    return 'type-theory';
  }
}
