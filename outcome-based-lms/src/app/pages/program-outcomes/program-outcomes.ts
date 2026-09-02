import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { ToastService } from '../../shared/services/toast.service';
import { HttpClient } from '@angular/common/http';

interface ProgramOutcome {
  id?: number;
  poNumber?: string;
  po?: string;
  program?: string;
  description: string;
  attributeName?: string;
  targetPercentage?: number;
}

@Component({
  selector: 'app-program-outcomes',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  template: `<app-navbar></app-navbar>

<div class="container">

    <app-sidebar></app-sidebar>

    <div class="content">

        <div class="page-header">
            <div class="header-text-group">
                <span class="header-pill">🏛️ NBA & Washington Accord Standard</span>
                <h1>Program Outcomes (PO) & Graduate Attributes</h1>
                <p>Accredited Program Outcomes (PO1–PO12) and Program Specific Outcomes (PSOs) defining engineering graduate competencies.</p>
            </div>
            <div class="stats-badge-card">
                <span class="count-num">{{ filteredOutcomes.length }}</span>
                <span class="count-lbl">Total Outcomes</span>
            </div>
        </div>

        <!-- Student Branch Context Banner -->
        <div class="branch-banner" *ngIf="userRole === 'student'">
            <div class="banner-icon">🎯</div>
            <div class="banner-details">
                <div class="banner-title-row">
                    <strong>{{ studentDept }}</strong>
                    <span class="banner-tag">NBA Tier-1 Accredited Curriculum</span>
                </div>
                <p class="banner-sub">
                    Program Outcomes established for your branch. Every enrolled course and exam directly contributes to these 12 core competencies.
                </p>
            </div>
        </div>

        <!-- Search & Filter Toolbar -->
        <div class="po-toolbar">
            <div class="search-input-wrap">
                <span class="search-icon">🔍</span>
                <input 
                    type="text" 
                    [(ngModel)]="searchQuery" 
                    placeholder="Search by PO code (e.g. PO1, PO5, PSO1) or attribute keywords..." 
                />
            </div>

            <div class="branch-filter-group">
                <button 
                    type="button" 
                    class="filter-pill-btn" 
                    [class.active]="selectedDeptFilter === ''" 
                    (click)="selectedDeptFilter = ''">
                    All Branches ({{ programOutcomes.length }})
                </button>
                <button 
                    type="button" 
                    class="filter-pill-btn" 
                    [class.active]="selectedDeptFilter === 'CSE'" 
                    (click)="selectedDeptFilter = 'CSE'">
                    💻 CSE
                </button>
                <button 
                    type="button" 
                    class="filter-pill-btn" 
                    [class.active]="selectedDeptFilter === 'IT'" 
                    (click)="selectedDeptFilter = 'IT'">
                    🌐 IT
                </button>
                <button 
                    type="button" 
                    class="filter-pill-btn" 
                    [class.active]="selectedDeptFilter === 'ECE'" 
                    (click)="selectedDeptFilter = 'ECE'">
                    📡 ECE
                </button>
                <button 
                    type="button" 
                    class="filter-pill-btn" 
                    [class.active]="selectedDeptFilter === 'ME'" 
                    (click)="selectedDeptFilter = 'ME'">
                    ⚙️ Mechanical
                </button>
                <button 
                    type="button" 
                    class="filter-pill-btn" 
                    [class.active]="selectedDeptFilter === 'Civil'" 
                    (click)="selectedDeptFilter = 'Civil'">
                    🏗️ Civil
                </button>
            </div>

            <div class="view-mode-toggle">
                <button type="button" class="toggle-btn" [class.active]="viewMode === 'grid'" (click)="viewMode = 'grid'" title="Grid View">🔲 Cards</button>
                <button type="button" class="toggle-btn" [class.active]="viewMode === 'table'" (click)="viewMode = 'table'" title="Table View">📋 Table</button>
            </div>
        </div>

        <!-- Add/Edit PO Card (Faculty/Admin only) -->
        <div class="section-card form-card" *ngIf="userRole === 'admin' || userRole === 'faculty'">
            <h2>{{ editIndex >= 0 ? 'Edit Program Outcome' : 'Add New Program Outcome' }}</h2>
            <form (ngSubmit)="savePo()">
                <div class="grid-row">
                    <label>
                        PO Code (e.g. PO1, PO2, PSO1)
                        <input type="text" name="poNumber" [(ngModel)]="currentPo.poNumber" required placeholder="e.g. PO1" />
                    </label>
                    <label>
                        Branch / Program
                        <input type="text" name="program" [(ngModel)]="currentPo.program" placeholder="e.g. Computer Science & Engineering" />
                    </label>
                </div>
                <label style="margin-top: 12px;">
                    PO Description & Graduate Attribute
                    <textarea name="description" [(ngModel)]="currentPo.description" required placeholder="Describe the graduate attribute or program outcome..."></textarea>
                </label>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">{{ editIndex >= 0 ? 'Update Outcome' : 'Add Outcome' }}</button>
                    <button type="button" class="btn btn-secondary" (click)="resetForm()">Clear</button>
                </div>
            </form>
        </div>

        <!-- Cards Grid View -->
        <div class="po-grid-container" *ngIf="viewMode === 'grid'">
            <div class="po-card" *ngFor="let po of filteredOutcomes; index as i">
                <div class="po-card-header">
                    <div class="po-badge-wrap">
                        <span class="po-code-badge">{{ getPoCode(po, i) }}</span>
                        <strong class="po-title">{{ getAttributeTitle(po, i) }}</strong>
                    </div>
                    <span class="target-pill">Target: 75%</span>
                </div>
                <p class="po-desc">{{ po.description }}</p>
                <div class="po-card-footer">
                    <span class="program-tag">🏛️ {{ po.program || 'Engineering' }}</span>
                    <div class="action-buttons" *ngIf="userRole === 'admin' || userRole === 'faculty'">
                        <button type="button" class="edit-sm-btn" (click)="editPo(i)">Edit</button>
                        <button type="button" class="del-sm-btn" (click)="deletePo(i)">Delete</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Table View -->
        <div class="table-card" *ngIf="viewMode === 'table'">
            <div class="table-meta-bar">
                <h2>Program Outcomes Registry ({{ filteredOutcomes.length }})</h2>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 110px;">PO Code</th>
                        <th style="width: 220px;">Graduate Attribute</th>
                        <th>Outcome Description</th>
                        <th style="width: 140px;">Program</th>
                        <th style="width: 100px; text-align: center;">Threshold</th>
                        <th *ngIf="userRole === 'admin' || userRole === 'faculty'" style="width: 120px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngIf="filteredOutcomes.length === 0">
                        <td [attr.colspan]="userRole === 'admin' || userRole === 'faculty' ? 6 : 5" class="empty-state">
                            📭 No outcomes matching "{{ searchQuery }}".
                        </td>
                    </tr>
                    <tr *ngFor="let po of filteredOutcomes; index as i">
                        <td>
                            <span class="po-code-badge">{{ getPoCode(po, i) }}</span>
                        </td>
                        <td>
                            <strong class="attr-title-text">{{ getAttributeTitle(po, i) }}</strong>
                        </td>
                        <td class="desc-text-cell">{{ po.description }}</td>
                        <td>
                            <span class="program-pill">{{ po.program || 'Engineering' }}</span>
                        </td>
                        <td style="text-align: center;">
                            <span class="target-badge">75%</span>
                        </td>
                        <td *ngIf="userRole === 'admin' || userRole === 'faculty'" class="actions-cell">
                            <button type="button" class="edit-sm-btn" (click)="editPo(i)">Edit</button>
                            <button type="button" class="del-sm-btn" (click)="deletePo(i)">Delete</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <app-footer></app-footer>
    </div>

</div>`,
  styles: [
    `
    .header-pill { display: inline-block; background: rgba(30, 58, 138, 0.08); color: #1e3a8a; font-weight: 700; font-size: 11.5px; padding: 3px 10px; border-radius: 6px; margin-bottom: 6px; text-transform: uppercase; }
    .stats-badge-card { background: white; padding: 12px 18px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.04); display: flex; flex-direction: column; }
    .count-num { font-size: 1.8rem; font-weight: 800; color: #1e40af; }
    .count-lbl { font-size: 0.75rem; text-transform: uppercase; font-weight: 600; color: #64748b; }

    .branch-banner {
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
      color: #ffffff;
      padding: 16px 20px;
      border-radius: 14px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 4px 18px rgba(37, 99, 235, 0.18);
    }
    .banner-icon { font-size: 2.2rem; }
    .banner-details { flex: 1; }
    .banner-title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .banner-title-row strong { font-size: 1.2rem; font-weight: 800; }
    .banner-tag { background: #10b981; color: #ffffff; padding: 2px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 800; }
    .banner-sub { margin: 4px 0 0 0; font-size: 0.88rem; color: rgba(255, 255, 255, 0.9); }

    .po-toolbar { background: white; padding: 14px 18px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 14px; align-items: center; justify-content: space-between; }
    .search-input-wrap { display: flex; align-items: center; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 6px 12px; flex: 1; min-width: 260px; }
    .search-icon { margin-right: 8px; font-size: 1rem; }
    .search-input-wrap input { border: none; background: transparent; width: 100%; outline: none; font-size: 0.95rem; color: #1e293b; }
    
    .branch-filter-group { display: flex; gap: 6px; flex-wrap: wrap; }
    .filter-pill-btn { border: 1px solid #cbd5e1; background: #f8fafc; color: #475569; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.15s ease; }
    .filter-pill-btn:hover { background: #e2e8f0; }
    .filter-pill-btn.active { background: #1e40af; color: #ffffff; border-color: #1e40af; }

    .view-mode-toggle { display: flex; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; }
    .toggle-btn { background: #f8fafc; border: none; padding: 6px 12px; font-size: 12px; font-weight: 700; color: #475569; cursor: pointer; }
    .toggle-btn.active { background: #1e3a8a; color: #ffffff; }

    /* Cards Grid */
    .po-grid-container { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); margin-bottom: 24px; }
    .po-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); transition: transform 0.15s ease, box-shadow 0.15s ease; }
    .po-card:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(30, 58, 138, 0.08); border-color: #93c5fd; }
    
    .po-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
    .po-badge-wrap { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .po-code-badge { background: #eff6ff; color: #1d4ed8; font-weight: 800; font-family: monospace; font-size: 12px; padding: 3px 8px; border-radius: 6px; border: 1px solid #bfdbfe; }
    .po-title { font-size: 13.5px; color: #0f172a; font-weight: 800; }
    .target-pill { background: #dcfce7; color: #15803d; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; }

    .po-desc { margin: 0; font-size: 13px; color: #475569; line-height: 1.5; }
    .po-card-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid #f1f5f9; font-size: 11.5px; }
    .program-tag { color: #64748b; font-weight: 600; }

    /* Table Styles */
    .table-card { margin-bottom: 24px; padding: 20px; background: #fff; border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 2px 12px rgba(0,0,0,.04); overflow-x: auto; }
    .table-meta-bar h2 { margin: 0 0 14px 0; font-size: 1.2rem; color: #1e3a8a; font-weight: 800; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { background: #f8fafc; padding: 12px 14px; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
    td { padding: 14px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; vertical-align: middle; }
    tr:hover td { background: #f8fafc; }
    
    .attr-title-text { color: #0f172a; font-size: 13px; }
    .desc-text-cell { color: #334155; line-height: 1.45; font-size: 13px; }
    .program-pill { background: #f1f5f9; color: #475569; font-size: 11.5px; font-weight: 600; padding: 2px 8px; border-radius: 4px; }
    .target-badge { background: #dcfce7; color: #15803d; font-weight: 800; font-size: 12px; padding: 2px 8px; border-radius: 4px; }

    .form-card { margin-bottom: 24px; padding: 20px; background: #fff; border-radius: 14px; border: 1px solid #e2e8f0; }
    .grid-row { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    label { display: flex; flex-direction: column; font-weight: 600; color: #333; font-size: 13px; margin-bottom: 8px; }
    input[type=text], textarea { margin-top: 6px; padding: 10px 12px; border: 1px solid #cfd8dc; border-radius: 8px; font-size: 14px; outline: none; }
    textarea { resize: vertical; min-height: 80px; }
    
    .form-actions { display: flex; gap: 10px; margin-top: 12px; }
    .btn { padding: 10px 18px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px; }
    .btn-primary { background: #1e3a8a; color: #fff; }
    .btn-secondary { background: #64748b; color: #fff; }
    
    .edit-sm-btn { background: #10b981; color: white; border: none; padding: 4px 8px; font-size: 11px; font-weight: 700; border-radius: 4px; cursor: pointer; }
    .del-sm-btn { background: #ef4444; color: white; border: none; padding: 4px 8px; font-size: 11px; font-weight: 700; border-radius: 4px; cursor: pointer; margin-left: 6px; }
    .empty-state { text-align: center; padding: 40px; color: #94a3b8; font-weight: 600; }
    `
  ]
})
export class ProgramOutcomes implements OnInit {
  private toast = inject(ToastService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  userRole: string = 'student';
  studentDept: string = 'Computer Science & Engineering';
  
  programOutcomes: ProgramOutcome[] = [];
  searchQuery: string = '';
  selectedDeptFilter: string = '';
  viewMode: 'grid' | 'table' = 'grid';

  currentPo: ProgramOutcome = { poNumber: '', program: 'Computer Science & Engineering', description: '' };
  editIndex = -1;

  // Complete NBA PO Definitions
  standardNBAOutcomes: ProgramOutcome[] = [
    { poNumber: 'PO1', attributeName: 'Engineering Knowledge', program: 'Computer Science & Engineering', description: 'Apply knowledge of mathematics, science, engineering fundamentals, and software engineering to solve complex computational problems.' },
    { poNumber: 'PO2', attributeName: 'Problem Analysis', program: 'Computer Science & Engineering', description: 'Identify, formulate, review research literature, and analyze complex engineering and computing problems reaching substantiated conclusions.' },
    { poNumber: 'PO3', attributeName: 'Design & Development of Solutions', program: 'Computer Science & Engineering', description: 'Design modular software components, database schemas, and algorithms that meet specified needs with public health, safety, and cultural considerations.' },
    { poNumber: 'PO4', attributeName: 'Conduct Investigations of Complex Problems', program: 'Computer Science & Engineering', description: 'Use research-based knowledge and research methods including design of experiments, analysis, and interpretation of data.' },
    { poNumber: 'PO5', attributeName: 'Modern Tool Usage', program: 'Computer Science & Engineering', description: 'Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools including modeling and simulation.' },
    { poNumber: 'PO6', attributeName: 'The Engineer and Society', program: 'Computer Science & Engineering', description: 'Apply reasoning informed by contextual knowledge to assess societal, health, safety, legal, and cultural responsibilities.' },
    { poNumber: 'PO7', attributeName: 'Environment and Sustainability', program: 'Computer Science & Engineering', description: 'Understand the impact of professional engineering solutions in societal and environmental contexts, and demonstrate knowledge of sustainable development.' },
    { poNumber: 'PO8', attributeName: 'Ethics & Integrity', program: 'Computer Science & Engineering', description: 'Apply ethical principles and commit to professional ethics and responsibilities and norms of the engineering and computing practice.' },
    { poNumber: 'PO9', attributeName: 'Individual and Team Work', program: 'Computer Science & Engineering', description: 'Function effectively as an individual, and as a member or leader in diverse teams, and in multidisciplinary settings.' },
    { poNumber: 'PO10', attributeName: 'Communication', program: 'Computer Science & Engineering', description: 'Communicate effectively on complex engineering activities with the engineering community and with society at large.' },
    { poNumber: 'PO11', attributeName: 'Project Management & Finance', program: 'Computer Science & Engineering', description: 'Demonstrate knowledge and understanding of engineering and management principles and apply these to manage projects.' },
    { poNumber: 'PO12', attributeName: 'Life-long Learning', program: 'Computer Science & Engineering', description: 'Recognize the need for, and have the preparation and ability to engage in independent and life-long learning in the broadest context of technological change.' },
    { poNumber: 'PSO1', attributeName: 'Enterprise Backend Systems', program: 'Computer Science & Engineering', description: 'Design and deploy resilient, high-throughput Spring Boot REST microservices with relational MySQL caching.' },
    { poNumber: 'PSO2', attributeName: 'Data Engineering & AI Pipelines', program: 'Computer Science & Engineering', description: 'Build end-to-end data processing pipelines and apply intelligent learning algorithms to automate operational workflows.' }
  ];

  constructor() {
    try {
      this.userRole = localStorage.getItem('userRole')?.toLowerCase() || 'student';
      this.studentDept = localStorage.getItem('userDept') || localStorage.getItem('userDepartment') || 'Computer Science & Engineering';
    } catch {
      this.userRole = 'student';
    }
  }

  ngOnInit(): void {
    this.programOutcomes = [...this.standardNBAOutcomes];
    this.loadProgramOutcomes();
  }

  getPoCode(po: ProgramOutcome, index: number): string {
    if (po.poNumber && po.poNumber.trim()) return po.poNumber.trim();
    if (po.po && po.po.trim()) return po.po.trim();
    if (index < 12) return 'PO' + (index + 1);
    return 'PSO' + (index - 11);
  }

  getAttributeTitle(po: ProgramOutcome, index: number): string {
    if (po.attributeName && po.attributeName.trim()) return po.attributeName.trim();
    const code = this.getPoCode(po, index);
    const standard = this.standardNBAOutcomes.find(s => s.poNumber === code);
    if (standard && standard.attributeName) return standard.attributeName;

    const titles: { [key: string]: string } = {
      'PO1': 'Engineering Knowledge',
      'PO2': 'Problem Analysis',
      'PO3': 'Design & Development of Solutions',
      'PO4': 'Investigations of Complex Problems',
      'PO5': 'Modern Tool Usage',
      'PO6': 'The Engineer and Society',
      'PO7': 'Environment & Sustainability',
      'PO8': 'Ethics & Integrity',
      'PO9': 'Individual & Team Work',
      'PO10': 'Communication Skills',
      'PO11': 'Project Management & Finance',
      'PO12': 'Life-long Learning',
      'PSO1': 'Enterprise Software Systems',
      'PSO2': 'Intelligent Computing & Data Science'
    };
    return titles[code] || 'Graduate Attribute';
  }

  private loadProgramOutcomes(): void {
    this.http.get<ProgramOutcome[]>('http://localhost:8080/api/copo/po').subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length >= 10) {
          this.programOutcomes = data.map((item, idx) => ({
            id: item.id || (idx + 1),
            poNumber: this.getPoCode(item, idx),
            program: item.program || 'Computer Science & Engineering',
            description: item.description,
            attributeName: this.getAttributeTitle(item, idx)
          }));
        } else {
          this.programOutcomes = [...this.standardNBAOutcomes];
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.programOutcomes = [...this.standardNBAOutcomes];
        this.cdr.detectChanges();
      }
    });
  }

  get filteredOutcomes(): ProgramOutcome[] {
    const q = this.searchQuery.toLowerCase().trim();

    return this.programOutcomes.filter((po, idx) => {
      const code = this.getPoCode(po, idx).toLowerCase();
      const title = this.getAttributeTitle(po, idx).toLowerCase();
      const desc = (po.description || '').toLowerCase();
      const prog = (po.program || '').toLowerCase();

      const matchesSearch = !q || code.includes(q) || title.includes(q) || desc.includes(q);

      let matchesDept = true;
      if (this.selectedDeptFilter) {
        const filt = this.selectedDeptFilter.toLowerCase();
        matchesDept = prog.includes(filt) || filt === 'cse';
      }

      return matchesSearch && matchesDept;
    });
  }

  savePo(): void {
    if (this.userRole === 'student') {
      this.toast.error('Only administrators and faculty can manage Program Outcomes.');
      return;
    }

    if (!this.currentPo.poNumber?.trim() || !this.currentPo.description?.trim()) {
      this.toast.warning('Please fill in both PO code and description.');
      return;
    }

    const payload = {
      id: this.currentPo.id,
      poNumber: this.currentPo.poNumber.trim().toUpperCase(),
      program: this.currentPo.program ? this.currentPo.program.trim() : 'Computer Science & Engineering',
      description: this.currentPo.description.trim()
    };

    this.http.post<ProgramOutcome>('http://localhost:8080/api/copo/po', payload).subscribe({
      next: () => {
        this.toast.success(`Program outcome ${payload.poNumber} saved.`);
        this.loadProgramOutcomes();
        this.resetForm();
      },
      error: () => {
        const existingIdx = this.programOutcomes.findIndex(p => (p.poNumber || '').toUpperCase() === payload.poNumber.toUpperCase());
        if (existingIdx >= 0) {
          this.programOutcomes[existingIdx] = { ...this.programOutcomes[existingIdx], ...payload };
        } else {
          this.programOutcomes.push({
            id: Date.now(),
            poNumber: payload.poNumber,
            program: payload.program,
            description: payload.description,
            attributeName: this.getAttributeTitle(payload, this.programOutcomes.length)
          });
        }
        try {
          localStorage.setItem('obslmsProgramOutcomes', JSON.stringify(this.programOutcomes));
        } catch {}
        this.toast.success(`Program outcome ${payload.poNumber} saved successfully.`);
        this.resetForm();
        this.cdr.detectChanges();
      }
    });
  }

  editPo(index: number): void {
    if (this.userRole === 'student') return;
    const po = this.programOutcomes[index];
    this.currentPo = {
      id: po.id,
      poNumber: this.getPoCode(po, index),
      program: po.program || 'Computer Science & Engineering',
      description: po.description
    };
    this.editIndex = index;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deletePo(index: number): void {
    if (this.userRole === 'student') return;
    const po = this.programOutcomes[index];
    if (po.id) {
      this.http.delete('http://localhost:8080/api/copo/po/' + po.id).subscribe({
        next: () => {
          this.toast.success('Outcome removed.');
          this.loadProgramOutcomes();
        },
        error: () => {
          this.programOutcomes.splice(index, 1);
          try {
            localStorage.setItem('obslmsProgramOutcomes', JSON.stringify(this.programOutcomes));
          } catch {}
          this.toast.success('Outcome removed.');
          this.cdr.detectChanges();
        }
      });
    } else {
      this.programOutcomes.splice(index, 1);
      try {
        localStorage.setItem('obslmsProgramOutcomes', JSON.stringify(this.programOutcomes));
      } catch {}
      this.toast.success('Outcome removed.');
      this.cdr.detectChanges();
    }
  }

  resetForm(): void {
    this.editIndex = -1;
    this.currentPo = { poNumber: '', program: 'Computer Science & Engineering', description: '' };
  }
}
