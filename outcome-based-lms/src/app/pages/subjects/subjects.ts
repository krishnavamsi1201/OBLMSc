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
            <p>Accredited syllabus subjects, lecture/lab types, credits, and semester associations from MySQL database.</p>
          </div>
          <div class="stats-badge-card" *ngIf="subjects.length > 0">
            <span class="count-num">{{ subjects.length }}</span>
            <span class="count-lbl">Total Subjects</span>
          </div>
        </div>

        <!-- Filter and Search Toolbar -->
        <div class="subjects-toolbar">
          <div class="search-input-wrap">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              placeholder="Search by code (e.g. DS, IT305, INMCA202) or subject name..." 
            />
          </div>

          <div class="filter-group">
            <button 
              type="button" 
              class="filter-pill-btn" 
              [class.active]="selectedType === ''" 
              (click)="selectedType = ''">
              All Types ({{ subjects.length }})
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
            <button 
              type="button" 
              class="filter-pill-btn" 
              [class.active]="selectedType === 'Elective'" 
              (click)="selectedType = 'Elective'">
              🎯 Electives
            </button>
          </div>
        </div>

        <!-- Subjects Master Table -->
        <div class="subjects-table-card">
          <div class="table-meta-bar">
            <span class="showing-text">
              Showing <strong>{{ paginatedSubjects.length }}</strong> of <strong>{{ filteredSubjects.length }}</strong> filtered subjects
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
                  <th style="width: 80px;">ID</th>
                  <th style="width: 150px;">Subject Code</th>
                  <th>Subject Title & Curriculum Name</th>
                  <th style="width: 140px;">Type</th>
                  <th style="width: 100px; text-align: center;">Credits</th>
                  <th style="width: 120px; text-align: center;">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="filteredSubjects.length === 0">
                  <td colspan="6" class="empty-state">
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
                    <span class="type-badge" [ngClass]="getTypeClass(subject.type)">
                      {{ subject.type || 'Theory' }}
                    </span>
                  </td>
                  <td style="text-align: center;">
                    <span class="credits-badge">{{ subject.credits }}</span>
                  </td>
                  <td style="text-align: center;">
                    <span class="status-badge active">Accredited</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Bottom Pagination -->
          <div class="table-bottom-bar" *ngIf="totalPages > 1">
            <span class="showing-text">Showing page {{ currentPage }} of {{ totalPages }}</span>
            <div class="pagination-controls">
              <button 
                type="button" 
                class="page-btn" 
                [disabled]="currentPage === 1" 
                (click)="currentPage = 1">
                ⏮ First
              </button>
              <button 
                type="button" 
                class="page-btn" 
                [disabled]="currentPage === 1" 
                (click)="currentPage = currentPage - 1">
                ◀ Prev
              </button>
              <span class="page-indicator">Page {{ currentPage }} / {{ totalPages }}</span>
              <button 
                type="button" 
                class="page-btn" 
                [disabled]="currentPage === totalPages" 
                (click)="currentPage = currentPage + 1">
                Next ▶
              </button>
              <button 
                type="button" 
                class="page-btn" 
                [disabled]="currentPage === totalPages" 
                (click)="currentPage = totalPages">
                Last ⏭
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <app-footer></app-footer>
  `,
  styles: [
    `.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }`,
    `.header-pill { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 999px; font-size: 0.8rem; font-weight: 700; margin-bottom: 6px; }`,
    `.page-header h1 { margin: 0 0 6px; font-size: 1.8rem; color: #0f172a; }`,
    `.page-header p { margin: 0; color: #64748b; font-size: 0.95rem; }`,
    `.stats-badge-card { background: linear-gradient(135deg, #1e3a8a, #2563eb); color: white; padding: 14px 22px; border-radius: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); }`,
    `.count-num { font-size: 1.8rem; font-weight: 800; line-height: 1; }`,
    `.count-lbl { font-size: 0.75rem; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; opacity: 0.9; margin-top: 4px; }`,
    `.subjects-toolbar { background: white; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 16px; align-items: center; justify-content: space-between; }`,
    `.search-input-wrap { display: flex; align-items: center; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 6px 12px; flex: 1; min-width: 280px; }`,
    `.search-icon { margin-right: 8px; font-size: 1rem; }`,
    `.search-input-wrap input { border: none; background: transparent; width: 100%; outline: none; font-size: 0.95rem; color: #1e293b; }`,
    `.filter-group { display: flex; gap: 8px; flex-wrap: wrap; }`,
    `.filter-pill-btn { border: 1px solid #cbd5e1; background: white; color: #475569; padding: 6px 14px; border-radius: 999px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }`,
    `.filter-pill-btn:hover { background: #f1f5f9; border-color: #94a3b8; }`,
    `.filter-pill-btn.active { background: #1e3a8a; color: white; border-color: #1e3a8a; }`,
    `.subjects-table-card { background: white; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); }`,
    `.table-meta-bar { padding: 14px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }`,
    `.table-bottom-bar { padding: 14px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }`,
    `.showing-text { font-size: 0.85rem; color: #64748b; }`,
    `.pagination-controls { display: flex; align-items: center; gap: 8px; }`,
    `.page-btn { background: white; border: 1px solid #cbd5e1; color: #334155; padding: 4px 10px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background 0.15s; }`,
    `.page-btn:hover:not(:disabled) { background: #e2e8f0; }`,
    `.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }`,
    `.page-indicator { font-size: 0.85rem; font-weight: 600; color: #1e293b; padding: 0 4px; }`,
    `.table-responsive { overflow-x: auto; }`,
    `table { width: 100%; border-collapse: collapse; text-align: left; }`,
    `th { background: #f8fafc; padding: 12px 18px; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; font-weight: 700; border-bottom: 1px solid #e2e8f0; }`,
    `td { padding: 14px 18px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; vertical-align: middle; }`,
    `tr:hover td { background: #f8fafc; }`,
    `.sub-id-cell { color: #94a3b8; font-weight: 600; font-family: monospace; }`,
    `.code-badge { background: #eff6ff; color: #1d4ed8; font-weight: 700; font-family: monospace; padding: 4px 8px; border-radius: 6px; border: 1px solid #bfdbfe; }`,
    `.subject-title { color: #0f172a; font-weight: 600; }`,
    `.type-badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; text-transform: capitalize; }`,
    `.type-theory { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }`,
    `.type-lab { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }`,
    `.type-elective { background: #f3e8ff; color: #7e22ce; border: 1px solid #e9d5ff; }`,
    `.credits-badge { background: #f1f5f9; color: #334155; font-weight: 700; padding: 2px 8px; border-radius: 6px; display: inline-block; }`,
    `.status-badge { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }`,
    `.status-badge.active { background: #dcfce7; color: #15803d; }`,
    `.empty-state { text-align: center; padding: 40px; color: #64748b; font-size: 1rem; }`
  ]
})
export class Subjects implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  subjects: SubjectRecord[] = [];
  searchQuery = '';
  selectedType = '';
  currentPage = 1;
  pageSize = 25;

  ngOnInit(): void {
    this.loadSubjectsFromBackend();
  }

  loadSubjectsFromBackend(): void {
    this.http.get<any[]>('http://localhost:8080/api/dataset/subjects').subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          this.subjects = data.map(item => ({
            id: item.subId || 0,
            code: item.subCode || '',
            name: item.subjectName || '',
            type: item.subjectType || 'Theory',
            credits: item.subjectType === 'Lab' ? 2 : (item.subjectType === 'Elective' ? 3 : 4),
            semester: 'Accredited'
          }));
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
    try {
      const stored = localStorage.getItem('obslmsSubjects');
      this.subjects = stored ? JSON.parse(stored) : [];
    } catch {
      this.subjects = [];
    }
  }

  get filteredSubjects(): SubjectRecord[] {
    const q = this.searchQuery.toLowerCase().trim();
    return this.subjects.filter(s => {
      const matchesSearch = !q || s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
      const matchesType = !this.selectedType || s.type.toLowerCase() === this.selectedType.toLowerCase();
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
