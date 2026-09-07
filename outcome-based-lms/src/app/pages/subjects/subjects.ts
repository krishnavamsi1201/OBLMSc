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
          <div style="display: flex; gap: 12px; align-items: center;">
            <div class="stats-badge-card" *ngIf="subjects.length > 0">
              <span class="count-num">{{ filteredSubjects.length }}</span>
              <span class="count-lbl">{{ viewMode === 'registered' ? 'Registered' : (viewMode === 'branch' ? 'Branch Subjects' : 'Total Subjects') }}</span>
            </div>
            <button *ngIf="userRole === 'admin'" type="button" class="btn-add-subject" (click)="openAddSubjectModal()" style="background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%); color: #0a1128; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 800; font-size: 0.92rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(212, 175, 55, 0.35);">
              <span class="material-icons" style="font-size: 18px;">add</span> Add Subject
            </button>
          </div>
        </div>

        <!-- Add/Edit Subject Modal for Admin -->
        <div class="modal-overlay" *ngIf="showSubjectModal && userRole === 'admin'">
          <div class="modal-card">
            <div class="modal-header">
              <h2 style="margin: 0; font-size: 1.3rem; color: #ffffff; display: flex; align-items: center; gap: 8px;">
                <span class="material-icons" style="color: #d4af37;">menu_book</span>
                {{ editingSubjectIndex >= 0 ? 'Edit Curriculum Subject' : 'Add New Curriculum Subject' }}
              </h2>
              <button type="button" class="close-btn" (click)="closeSubjectModal()">✕</button>
            </div>
            <form (ngSubmit)="saveSubject()" style="display: flex; flex-direction: column; gap: 14px; padding: 20px 0 0 0;">
              <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px;">
                <label style="display: flex; flex-direction: column; font-size: 0.85rem; font-weight: 700; color: #cbd5e1;">
                  Subject Code *
                  <input type="text" [(ngModel)]="currentSubject.code" name="code" placeholder="e.g. CS403, IT306" required style="margin-top: 6px; padding: 10px 12px; background: #091024; border: 1px solid #1f2f54; border-radius: 8px; color: #ffffff; outline: none;" />
                </label>
                <label style="display: flex; flex-direction: column; font-size: 0.85rem; font-weight: 700; color: #cbd5e1;">
                  Credits *
                  <input type="number" [(ngModel)]="currentSubject.credits" name="credits" min="1" max="8" required style="margin-top: 6px; padding: 10px 12px; background: #091024; border: 1px solid #1f2f54; border-radius: 8px; color: #ffffff; outline: none;" />
                </label>
              </div>
              <label style="display: flex; flex-direction: column; font-size: 0.85rem; font-weight: 700; color: #cbd5e1;">
                Subject Title *
                <input type="text" [(ngModel)]="currentSubject.name" name="name" placeholder="e.g. Advanced Operating Systems" required style="margin-top: 6px; padding: 10px 12px; background: #091024; border: 1px solid #1f2f54; border-radius: 8px; color: #ffffff; outline: none;" />
              </label>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <label style="display: flex; flex-direction: column; font-size: 0.85rem; font-weight: 700; color: #cbd5e1;">
                  Department *
                  <select [(ngModel)]="currentSubject.department" name="department" required style="margin-top: 6px; padding: 10px 12px; background: #091024; border: 1px solid #1f2f54; border-radius: 8px; color: #ffffff; outline: none;">
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Communication Engineering">Electronics & Communication Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="General Engineering">General Engineering</option>
                  </select>
                </label>
                <label style="display: flex; flex-direction: column; font-size: 0.85rem; font-weight: 700; color: #cbd5e1;">
                  Subject Type *
                  <select [(ngModel)]="currentSubject.type" name="type" required style="margin-top: 6px; padding: 10px 12px; background: #091024; border: 1px solid #1f2f54; border-radius: 8px; color: #ffffff; outline: none;">
                    <option value="Theory">Theory</option>
                    <option value="Lab">Lab / Practical</option>
                    <option value="Elective">Elective</option>
                  </select>
                </label>
              </div>
              <label style="display: flex; flex-direction: column; font-size: 0.85rem; font-weight: 700; color: #cbd5e1;">
                Curriculum Semester
                <select [(ngModel)]="currentSubject.semester" name="semester" style="margin-top: 6px; padding: 10px 12px; background: #091024; border: 1px solid #1f2f54; border-radius: 8px; color: #ffffff; outline: none;">
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                  <option value="Semester 3">Semester 3</option>
                  <option value="Semester 4">Semester 4</option>
                  <option value="Semester 5">Semester 5</option>
                  <option value="Semester 6">Semester 6</option>
                  <option value="Semester 7">Semester 7</option>
                  <option value="Semester 8">Semester 8</option>
                </select>
              </label>
              <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; border-top: 1px solid #1f2f54; padding-top: 14px;">
                <button type="button" class="btn btn-secondary" (click)="closeSubjectModal()" style="background: #16244a; color: #cbd5e1; border: 1px solid #1f2f54; padding: 9px 18px; border-radius: 8px; font-weight: 700; cursor: pointer;">Cancel</button>
                <button type="submit" class="btn btn-primary" style="background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%); color: #0a1128; border: none; padding: 9px 20px; border-radius: 8px; font-weight: 800; cursor: pointer;">{{ editingSubjectIndex >= 0 ? '💾 Save Changes' : '➕ Save Subject' }}</button>
              </div>
            </form>
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
          </div>
        </div>

        <!-- Filter and Search Toolbar -->
        <div class="subjects-toolbar">
          <div class="search-input-wrap">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              placeholder="Search by code (e.g. CS101, IT305) or subject title..." 
            />
          </div>

          <!-- Branch Filter Pills: Only All Branches/Multi-Dept for Admin/Faculty; Single Department Badge for Student -->
          <div class="dept-filter-group" *ngIf="userRole !== 'student'">
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

          <!-- Student View: Dedicated Department Badge -->
          <div class="dept-filter-group" *ngIf="userRole === 'student'">
            <div class="dept-pill active" style="cursor: default; display: flex; align-items: center; gap: 6px; background: #1e40af; color: #fff; border-color: #1e40af;">
              <span>💻 {{ userDept }}</span>
            </div>
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
                  <th style="width: 160px; text-align: center;">{{ userRole === 'admin' ? 'Actions' : 'Registration' }}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="filteredSubjects.length === 0">
                  <td colspan="7" class="empty-state" style="padding: 30px 20px; text-align: center;">
                    <div *ngIf="viewMode === 'registered'" style="max-width: 500px; margin: 0 auto;">
                      <span style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem;">📚</span>
                      <h3 style="color: #1e293b; margin-bottom: 0.5rem; font-size: 1.15rem; font-weight: 700;">No Subjects Registered Yet</h3>
                      <p style="color: #64748b; margin-bottom: 1.2rem; font-size: 0.92rem; line-height: 1.5;">
                        You have not registered for any subjects yet. Switch to your <strong>{{ userDept }}</strong> curriculum to view and request enrollment for your branch subjects!
                      </p>
                      <button type="button" (click)="setViewMode('branch')" style="background: #2563eb; color: #ffffff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 0.95rem; cursor: pointer; box-shadow: 0 4px 12px rgba(37,99,235,0.25); display: inline-flex; align-items: center; gap: 8px;">
                        🏛️ View {{ userDept }} Curriculum Subjects →
                      </button>
                    </div>
                    <div *ngIf="viewMode !== 'registered'">
                      📭 No subjects found matching "<strong>{{ searchQuery }}</strong>"
                    </div>
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
                    <!-- Admin Actions -->
                    <div *ngIf="userRole === 'admin'" style="display: flex; gap: 6px; justify-content: center;">
                      <button type="button" (click)="openEditSubjectModal(subject)" style="background: #16244a; color: #d4af37; border: 1px solid #1f2f54; padding: 4px 8px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;" title="Edit Subject">
                        <span class="material-icons" style="font-size: 14px;">edit</span> Edit
                      </button>
                      <button type="button" (click)="deleteSubject(subject)" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); padding: 4px 8px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;" title="Delete Subject">
                        <span class="material-icons" style="font-size: 14px;">delete</span>
                      </button>
                    </div>

                    <!-- Student Actions -->
                    <ng-container *ngIf="userRole === 'student'">
                      <span *ngIf="isCourseEnrolled(subject.code, subject.name)" class="status-badge enrolled">
                        ✓ Registered
                      </span>
                      <span *ngIf="!isCourseEnrolled(subject.code, subject.name) && isPending(subject.code)" class="status-badge pending" style="background: #fef3c7; color: #b45309; border: 1px solid #fde68a;">
                        ⏳ Pending
                      </span>
                      <button *ngIf="!isCourseEnrolled(subject.code, subject.name) && !isPending(subject.code)" 
                              class="request-enroll-btn" 
                              (click)="requestEnrollment(subject)"
                              style="background: linear-gradient(135deg, #d4af37 0%, #b38f28 100%); color: #0a1128; border: none; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.2s;"
                              title="Request enrollment for this subject">
                        + Enroll
                      </button>
                    </ng-container>

                    <!-- Faculty Actions -->
                    <span *ngIf="userRole === 'faculty'" class="status-badge accredited">
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
      background: linear-gradient(135deg, #101b38 0%, #18284e 100%);
      color: #ffffff;
      padding: 18px 22px;
      border-radius: 14px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      border: 1px solid #1f2f54;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    }
    .context-avatar { font-size: 2.2rem; }
    .context-details { flex: 1; min-width: 260px; }
    .context-title { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .context-title strong { font-size: 1.2rem; font-weight: 800; color: #ffffff; }
    .role-chip { background: rgba(212, 175, 55, 0.15); color: #d4af37; border: 1px solid rgba(212, 175, 55, 0.3); padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .branch-chip { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.3); padding: 2px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 800; }
    .context-sub { margin: 4px 0 0 0; font-size: 0.88rem; color: #94a3b8; }
    
    .context-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .switch-view-btn {
      background: #091024;
      border: 1px solid #1f2f54;
      color: #cbd5e1;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .switch-view-btn:hover { background: #18284e; color: #ffffff; border-color: #d4af37; }
    .switch-view-btn.active { background: linear-gradient(135deg, #d4af37 0%, #b38f28 100%); color: #0a1128; font-weight: 800; border-color: #d4af37; box-shadow: 0 4px 14px rgba(212,175,55,0.3); }

    .header-pill { display: inline-block; background: rgba(212, 175, 55, 0.15); color: #d4af37; border: 1px solid rgba(212, 175, 55, 0.3); font-weight: 700; font-size: 11.5px; padding: 3px 10px; border-radius: 6px; margin-bottom: 6px; text-transform: uppercase; }
    .stats-badge-card { background: #101b38; padding: 12px 18px; border-radius: 12px; border: 1px solid #1f2f54; text-align: center; box-shadow: 0 4px 16px rgba(0,0,0,0.3); display: flex; flex-direction: column; }
    .count-num { font-size: 1.8rem; font-weight: 800; color: #ffffff; }
    .count-lbl { font-size: 0.75rem; text-transform: uppercase; font-weight: 600; color: #94a3b8; }
    
    .subjects-toolbar { background: #101b38; padding: 16px; border-radius: 12px; border: 1px solid #1f2f54; margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 14px; align-items: center; justify-content: space-between; box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
    .search-input-wrap { display: flex; align-items: center; background: #091024; border: 1px solid #1f2f54; border-radius: 8px; padding: 6px 12px; flex: 1; min-width: 260px; }
    .search-icon { margin-right: 8px; font-size: 1rem; color: #d4af37; }
    .search-input-wrap input { border: none; background: transparent; width: 100%; outline: none; font-size: 0.95rem; color: #ffffff; }
    
    .dept-filter-group { display: flex; gap: 6px; flex-wrap: wrap; }
    .dept-pill { border: 1px solid #1f2f54; background: #091024; color: #cbd5e1; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.15s ease; }
    .dept-pill:hover { background: #18284e; color: #ffffff; border-color: #d4af37; }
    .dept-pill.active { background: linear-gradient(135deg, #d4af37 0%, #b38f28 100%); color: #0a1128; border-color: #d4af37; }

    .filter-group { display: flex; gap: 8px; flex-wrap: wrap; }
    .filter-pill-btn { border: 1px solid #1f2f54; background: #091024; color: #cbd5e1; padding: 6px 14px; border-radius: 999px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
    .filter-pill-btn:hover { background: #18284e; color: #ffffff; border-color: #d4af37; }
    .filter-pill-btn.active { background: linear-gradient(135deg, #d4af37 0%, #b38f28 100%); color: #0a1128; border-color: #d4af37; }

    .subjects-table-card { background: #101b38; border-radius: 14px; border: 1px solid #1f2f54; overflow: hidden; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35); }
    .table-meta-bar { padding: 14px 20px; background: #091024; border-bottom: 1px solid #1f2f54; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
    .table-bottom-bar { padding: 14px 20px; background: #091024; border-top: 1px solid #1f2f54; display: flex; justify-content: space-between; align-items: center; }
    .showing-text { font-size: 0.85rem; color: #94a3b8; }
    .showing-text strong { color: #ffffff; }
    .registered-tag { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.3); font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-left: 6px; }

    .pagination-controls { display: flex; align-items: center; gap: 8px; }
    .page-btn { background: #091024; border: 1px solid #1f2f54; color: #cbd5e1; padding: 4px 10px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
    .page-btn:hover:not(:disabled) { background: #18284e; color: #ffffff; border-color: #d4af37; }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-indicator { font-size: 0.85rem; font-weight: 600; color: #ffffff; padding: 0 4px; }
    
    .table-responsive { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { background: #132247; padding: 12px 16px; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: #d4af37; font-weight: 700; border-bottom: 1px solid #1f2f54; }
    td { padding: 14px 16px; border-bottom: 1px solid #1f2f54; font-size: 0.9rem; vertical-align: middle; color: #e2e8f0; }
    tr:hover td { background: #18284e; }
    
    .sub-id-cell { color: #64748b; font-weight: 600; font-family: monospace; }
    .code-badge { background: #091024; color: #d4af37; font-weight: 700; font-family: monospace; padding: 4px 8px; border-radius: 6px; border: 1px solid #1f2f54; }
    .subject-title { color: #ffffff; font-weight: 600; }
    .dept-label { font-size: 12px; font-weight: 600; color: #94a3b8; }
    
    .type-badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; }
    .type-theory { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.3); }
    .type-lab { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.3); }
    .type-elective { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(192, 132, 252, 0.3); }
    
    .credits-badge { background: #091024; color: #cbd5e1; border: 1px solid #1f2f54; font-weight: 700; padding: 2px 8px; border-radius: 6px; display: inline-block; }
    .status-badge { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
    .empty-state { text-align: center; padding: 40px; color: #94a3b8; font-size: 1rem; }
    
    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(5, 10, 25, 0.85);
      backdrop-filter: blur(8px);
      display: flex;
      justify-content: center;
      align-items: flex-start;
      z-index: 10000;
      padding: 50px 20px 40px;
      overflow-y: auto;
    }
    .modal-card {
      background: #101b38;
      border: 1px solid #1f2f54;
      border-radius: 16px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
      padding: 24px;
      width: 100%;
      max-width: 540px;
      margin-bottom: 40px;
      animation: modalSlideDown 0.2s ease-out;
    }
    @keyframes modalSlideDown {
      from { opacity: 0; transform: translateY(-15px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #1f2f54;
      padding-bottom: 14px;
    }
    .close-btn {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 1.3rem;
      cursor: pointer;
      padding: 4px;
      line-height: 1;
    }
    .close-btn:hover { color: #f87171; }
    `
  ]
})
export class Subjects implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  userRole: string = 'student';
  userName: string = 'Student';
  userEmail: string = '';
  userDept: string = 'Engineering';
  enrolledCourseCodes: string[] = [];
  pendingCourseCodes: string[] = [];

  subjects: SubjectRecord[] = [];
  searchQuery = '';
  selectedType = '';
  selectedDeptFilter = '';
  viewMode: 'registered' | 'branch' | 'all' = 'branch';
  currentPage = 1;
  pageSize = 25;

  // Admin Subject Modal State
  showSubjectModal = false;
  editingSubjectIndex = -1;
  currentSubject: SubjectRecord = this.createEmptySubject();

  createEmptySubject(): SubjectRecord {
    return {
      id: Date.now(),
      code: '',
      name: '',
      type: 'Theory',
      credits: 4,
      semester: 'Semester 6',
      department: 'Computer Science & Engineering',
      isRegistered: false
    };
  }

  openAddSubjectModal(): void {
    if (this.userRole !== 'admin') {
      this.toast.error('Only administrators can add subjects.');
      return;
    }
    this.editingSubjectIndex = -1;
    this.currentSubject = this.createEmptySubject();
    this.showSubjectModal = true;
  }

  openEditSubjectModal(sub: SubjectRecord): void {
    if (this.userRole !== 'admin') {
      this.toast.error('Only administrators can edit subjects.');
      return;
    }
    this.currentSubject = { ...sub };
    this.editingSubjectIndex = this.subjects.findIndex(s => s.id === sub.id || s.code === sub.code);
    this.showSubjectModal = true;
  }

  closeSubjectModal(): void {
    this.showSubjectModal = false;
    this.editingSubjectIndex = -1;
    this.currentSubject = this.createEmptySubject();
  }

  saveSubject(): void {
    if (this.userRole !== 'admin') return;
    if (!this.currentSubject.code.trim() || !this.currentSubject.name.trim()) {
      this.toast.warning('Please enter both Subject Code and Title.');
      return;
    }

    const formatted: SubjectRecord = {
      ...this.currentSubject,
      code: this.currentSubject.code.trim().toUpperCase(),
      name: this.currentSubject.name.trim(),
      credits: Number(this.currentSubject.credits) || 3
    };

    if (this.editingSubjectIndex >= 0) {
      this.subjects[this.editingSubjectIndex] = formatted;
      this.toast.success(`Subject "${formatted.name}" updated successfully.`);
    } else {
      this.subjects.unshift(formatted);
      this.toast.success(`Subject "${formatted.name}" (${formatted.code}) added to catalog.`);
    }

    try {
      localStorage.setItem('obslmsSubjects', JSON.stringify(this.subjects));
    } catch {}

    this.closeSubjectModal();
    this.cdr.detectChanges();
  }

  deleteSubject(sub: SubjectRecord): void {
    if (this.userRole !== 'admin') return;
    if (confirm(`Are you sure you want to remove subject "${sub.name}" (${sub.code}) from the catalog?`)) {
      this.subjects = this.subjects.filter(s => s.id !== sub.id && s.code !== sub.code);
      try {
        localStorage.setItem('obslmsSubjects', JSON.stringify(this.subjects));
      } catch {}
      this.toast.info(`Subject "${sub.name}" removed from catalog.`);
      this.cdr.detectChanges();
    }
  }

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
    this.loadStudentPendingRequests();
  }

  loadUserProfile(): void {
    try {
      this.userRole = localStorage.getItem('userRole')?.toLowerCase() || 'student';
      this.userName = localStorage.getItem('userName') || 'Student';
      this.userEmail = localStorage.getItem('userEmail') || '';
      this.userDept = localStorage.getItem('userDepartment') || localStorage.getItem('userDept') || 'Mechanical Engineering';

      const studentId = localStorage.getItem('userId') || this.userEmail;
      if (studentId) {
        this.http.get<any>(`http://localhost:8080/api/users/${encodeURIComponent(studentId)}`).subscribe({
          next: (u) => {
            if (u && u.department) {
              this.userDept = u.department;
            }
            if (u && u.enrolledCourses && u.enrolledCourses.trim().length > 0) {
              this.enrolledCourseCodes = u.enrolledCourses.split(',').map((s: string) => s.trim().toUpperCase());
              this.viewMode = 'registered';
            } else {
              this.enrolledCourseCodes = [];
              // If student has 0 registered subjects, immediately show branch curriculum so they can enroll!
              this.viewMode = 'branch';
            }
            this.cdr.detectChanges();
          },
          error: () => {
            this.viewMode = this.enrolledCourseCodes.length > 0 ? 'registered' : 'branch';
            this.cdr.detectChanges();
          }
        });
      } else {
        this.viewMode = 'branch';
      }

      if (this.userRole !== 'student') {
        this.viewMode = 'all';
      }
    } catch {}
  }

  loadStudentPendingRequests(): void {
    const studentId = localStorage.getItem('userId') || this.userEmail;
    if (studentId) {
      this.http.get<any[]>(`http://localhost:8080/api/courses/requests/student/${encodeURIComponent(studentId)}`).subscribe({
        next: (reqs) => {
          this.pendingCourseCodes = (reqs || [])
            .filter(r => r.status?.toLowerCase() === 'pending')
            .map(r => (r.courseCode || '').toUpperCase().trim());
          this.cdr.detectChanges();
        }
      });
    }
  }

  isPending(code: string): boolean {
    if (!code) return false;
    return this.pendingCourseCodes.includes(code.toUpperCase().trim());
  }

  requestEnrollment(subject: SubjectRecord): void {
    const studentId = localStorage.getItem('userId') || this.userEmail || 'STUDENT';
    const payload = {
      studentId: studentId,
      studentName: this.userName,
      studentEmail: this.userEmail,
      regNo: localStorage.getItem('userRoll') || studentId,
      department: this.userDept,
      courseCode: subject.code,
      courseTitle: subject.name,
      semester: subject.semester || 'Semester 6',
      status: 'Pending'
    };

    this.http.post('http://localhost:8080/api/courses/requests', payload).subscribe({
      next: (res: any) => {
        this.pendingCourseCodes.push(subject.code.toUpperCase().trim());
        this.toast.success(`Enrollment request submitted for "${subject.name}" (${subject.code})! Awaiting Admin approval. ⏳`);
        this.cdr.detectChanges();
      },
      error: () => {
        this.toast.error('Failed to submit enrollment request to database.');
      }
    });
  }

  setViewMode(mode: 'registered' | 'branch' | 'all'): void {
    this.viewMode = mode;
    this.currentPage = 1;
    this.cdr.detectChanges();
  }

  loadSubjectsFromBackend(): void {
    this.http.get<any[]>('http://localhost:8080/api/courses').subscribe({
      next: (courses) => {
        if (Array.isArray(courses) && courses.length > 0) {
          const backendSubs: SubjectRecord[] = courses.map((item, idx) => {
            const code = (item.code || '').trim();
            const name = (item.title || item.name || '').trim();
            const type = (name.toLowerCase().includes('lab') || code.toLowerCase().includes('lab')) ? 'Lab' : (name.toLowerCase().includes('elective') ? 'Elective' : 'Theory');
            const dept = item.department || this.getDepartmentName(code, name);
            const credits = type === 'Lab' ? 2 : (type === 'Elective' ? 3 : 4);
            const isReg = this.isCourseEnrolled(code, name);
            return {
              id: item.id || (idx + 1),
              code: code,
              name: name,
              type: type,
              credits: credits,
              semester: item.semester || 'Semester 6',
              department: dept,
              isRegistered: isReg
            };
          });

          // Retrieve custom subjects added by admin if any
          const stored = localStorage.getItem('obslmsCustomSubjects');
          let customSubs: SubjectRecord[] = [];
          if (stored) {
            try {
              customSubs = JSON.parse(stored);
            } catch {}
          }

          const existingCodes = new Set(backendSubs.map(s => s.code.toUpperCase()));
          const extraCustom = customSubs.filter(c => !existingCodes.has(c.code.toUpperCase()));

          this.subjects = [...extraCustom, ...backendSubs];
          try {
            localStorage.setItem('obslmsSubjects', JSON.stringify(this.subjects));
          } catch {}
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
      // Computer Science & Engineering
      { id: 1, code: 'CS101', name: 'Database Management Systems', type: 'Theory', credits: 4, semester: 'Semester 3', department: 'Computer Science & Engineering', isRegistered: true },
      { id: 2, code: 'CS102', name: 'Data Structures & Algorithms', type: 'Theory', credits: 4, semester: 'Semester 3', department: 'Computer Science & Engineering', isRegistered: true },
      { id: 3, code: 'CS103', name: 'Object-Oriented Programming with Java', type: 'Theory', credits: 4, semester: 'Semester 3', department: 'Computer Science & Engineering', isRegistered: true },
      { id: 4, code: 'CS201', name: 'Operating Systems', type: 'Theory', credits: 4, semester: 'Semester 4', department: 'Computer Science & Engineering', isRegistered: true },
      { id: 5, code: 'CS202', name: 'Machine Learning & Data Science', type: 'Theory', credits: 4, semester: 'Semester 5', department: 'Computer Science & Engineering', isRegistered: false },
      { id: 6, code: 'CS301', name: 'Computer Networks', type: 'Theory', credits: 4, semester: 'Semester 5', department: 'Computer Science & Engineering', isRegistered: true },
      { id: 7, code: 'CS302', name: 'Software Engineering & Agile Methodologies', type: 'Theory', credits: 4, semester: 'Semester 6', department: 'Computer Science & Engineering', isRegistered: true },
      { id: 8, code: 'CS401', name: 'Artificial Intelligence & Neural Networks', type: 'Theory', credits: 4, semester: 'Semester 7', department: 'Computer Science & Engineering', isRegistered: false },
      { id: 9, code: 'CS402', name: 'Cyber Security & Cryptography', type: 'Theory', credits: 4, semester: 'Semester 7', department: 'Computer Science & Engineering', isRegistered: false },
      { id: 10, code: 'CS101L', name: 'DBMS & SQL Practical Laboratory', type: 'Lab', credits: 2, semester: 'Semester 3', department: 'Computer Science & Engineering', isRegistered: true },
      { id: 11, code: 'CS102L', name: 'Data Structures Practical Lab', type: 'Lab', credits: 2, semester: 'Semester 3', department: 'Computer Science & Engineering', isRegistered: true },

      // Information Technology
      { id: 12, code: 'IT305', name: 'Web Technology & Modern Frameworks', type: 'Theory', credits: 4, semester: 'Semester 6', department: 'Information Technology', isRegistered: false },
      { id: 13, code: 'CS303', name: 'Cloud Computing & DevOps Architecture', type: 'Theory', credits: 4, semester: 'Semester 6', department: 'Information Technology', isRegistered: false },
      { id: 14, code: 'LINUX', name: 'Linux System Administration & Shell Scripting', type: 'Theory', credits: 4, semester: 'Semester 5', department: 'Information Technology', isRegistered: false },
      { id: 15, code: 'OPEN LAB', name: 'Open Source Software Laboratory', type: 'Lab', credits: 2, semester: 'Semester 5', department: 'Information Technology', isRegistered: false },

      // Electronics & Communication Engineering
      { id: 16, code: 'MES', name: 'Microprocessors & Embedded Systems', type: 'Theory', credits: 4, semester: 'Semester 5', department: 'Electronics & Communication Engineering', isRegistered: false },
      { id: 17, code: 'DSLD', name: 'Digital Signal & Logic Design', type: 'Theory', credits: 4, semester: 'Semester 4', department: 'Electronics & Communication Engineering', isRegistered: false },
      { id: 18, code: 'EC206', name: 'VLSI Design & Embedded Systems', type: 'Theory', credits: 4, semester: 'Semester 6', department: 'Electronics & Communication Engineering', isRegistered: false },
      { id: 19, code: 'HARDWARE LAB', name: 'Microprocessor & Hardware Lab', type: 'Lab', credits: 2, semester: 'Semester 5', department: 'Electronics & Communication Engineering', isRegistered: false },

      // Mechanical Engineering
      { id: 20, code: 'ME210', name: 'Kinematics & Dynamics of Machines', type: 'Theory', credits: 4, semester: 'Semester 4', department: 'Mechanical Engineering', isRegistered: false },
      { id: 21, code: '04ME6512', name: 'Computer Aided Design and Manufacturing (CAD/CAM)', type: 'Theory', credits: 4, semester: 'Semester 6', department: 'Mechanical Engineering', isRegistered: false },
      { id: 22, code: 'AU203', name: 'Automobile Chassis & Powertrain Engineering', type: 'Theory', credits: 4, semester: 'Semester 5', department: 'Mechanical Engineering', isRegistered: false },

      // Civil Engineering
      { id: 23, code: 'FMHM', name: 'Fluid Mechanics and Hydraulic Machinery', type: 'Theory', credits: 4, semester: 'Semester 4', department: 'Civil Engineering', isRegistered: false },
      { id: 24, code: 'SMSE', name: 'Strength of Materials and Structural Engineering', type: 'Theory', credits: 4, semester: 'Semester 5', department: 'Civil Engineering', isRegistered: false },
      { id: 25, code: 'CE234', name: 'Fluid Mechanics & Hydraulics Practical Lab', type: 'Lab', credits: 2, semester: 'Semester 4', department: 'Civil Engineering', isRegistered: false }
    ];
    this.subjects = fallbackList;
    try {
      localStorage.setItem('obslmsSubjects', JSON.stringify(this.subjects));
    } catch {}
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

      // Student Role: strictly restricted to their department and registered courses
      if (this.userRole === 'student') {
        if (this.viewMode === 'registered') {
          if (!this.isCourseEnrolled(s.code, s.name)) {
            return false;
          }
        } else {
          // Branch curriculum mode: only student's department subjects
          const uDept = this.userDept.toLowerCase();
          let matchesStudentDept = false;
          if (uDept.includes('mech') || uDept.includes('me')) {
            matchesStudentDept = sDept.includes('mech') || sDept.includes('me') || sDept.includes('auto');
          } else if (uDept.includes('civil') || uDept.includes('ce')) {
            matchesStudentDept = sDept.includes('civil') || sDept.includes('ce');
          } else if (uDept.includes('elect') || uDept.includes('ece')) {
            matchesStudentDept = sDept.includes('elect') || sDept.includes('ece');
          } else if (uDept.includes('info') || uDept.includes('it')) {
            matchesStudentDept = sDept.includes('info') || sDept.includes('it');
          } else {
            matchesStudentDept = sDept.includes('comp') || sDept.includes('cse');
          }
          if (!matchesStudentDept && !this.isCourseEnrolled(s.code, s.name)) {
            return false;
          }
        }
      } else {
        // Admin / Faculty Role: filter by chosen department pill
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
