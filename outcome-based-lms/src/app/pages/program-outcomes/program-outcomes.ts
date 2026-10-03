import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { ToastService } from '../../shared/services/toast.service';
import { HttpClient } from '@angular/common/http';
import { DEFAULT_DATABASE_COURSES } from '../../shared/services/course.service';
import { MASTER_COURSE_OUTCOMES } from '../course-outcomes/course-outcomes';

interface ProgramOutcome {
  id?: number;
  poNumber?: string;
  po?: string;
  program?: string;
  description: string;
  attributeName?: string;
  targetPercentage?: number;
}

export interface MappedPO {
  poCode: string;
  attributeName: string;
  level: number; // 1 = Slight, 2 = Moderate, 3 = Substantial
  contribution: number; // percentage, e.g. 85
  justification?: string;
}

export interface COItemWithPOs {
  coCode: string;
  description: string;
  mappedPos: MappedPO[];
  isPoExpanded: boolean;
}

export interface SubjectHierarchyGroup {
  courseCode: string;
  courseTitle: string;
  department: string;
  cos: COItemWithPOs[];
  isExpanded: boolean;
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
                <h1>Program Outcomes (PO) & CO-PO Articulation</h1>
                <p>Accredited Program Outcomes (PO1–PO12) and subject-wise CO-PO mapping articulating how course competencies meet engineering graduate attributes.</p>
            </div>
            <div class="stats-badge-group">
                <div class="stats-badge-card">
                    <span class="count-num">{{ filteredHierarchySubjects.length }}</span>
                    <span class="count-lbl">Subjects Mapped</span>
                </div>
                <div class="stats-badge-card gold-border">
                    <span class="count-num">{{ filteredOutcomes.length }}</span>
                    <span class="count-lbl">NBA Outcomes</span>
                </div>
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

        <!-- Faculty Context Banner -->
        <div class="branch-banner faculty-banner" *ngIf="userRole === 'faculty'">
            <div class="banner-icon">👨‍🏫</div>
            <div class="banner-details">
                <div class="banner-title-row">
                    <strong>{{ facultyDept }} — {{ facultyName }}</strong>
                    <span class="banner-tag faculty-tag">Faculty Assigned Subjects & Articulation</span>
                </div>
                <p class="banner-sub">
                    Showing Program Outcomes (PO1–PO12) and subject-wise CO-PO articulation for your department subjects: 
                    <span class="assigned-chips">{{ facultyAssignedCoursesDisplay }}</span>.
                </p>
            </div>
        </div>

        <!-- Search & View Mode Switcher Toolbar -->
        <div class="po-toolbar">
            <div class="search-input-wrap">
                <span class="search-icon">🔍</span>
                <input 
                    type="text" 
                    [(ngModel)]="searchQuery" 
                    placeholder="Search by subject code, name, PO code (e.g. PO1, PO3), or graduate attributes..." 
                />
                <button *ngIf="searchQuery" type="button" class="clear-btn" (click)="searchQuery=''">✕</button>
            </div>

            <!-- View Switcher Pills -->
            <div class="view-mode-toggle">
                <button 
                    type="button" 
                    class="toggle-btn" 
                    [class.active]="viewMode === 'hierarchy'" 
                    (click)="viewMode = 'hierarchy'" 
                    title="Subject-wise CO to PO Hierarchy">
                    🌳 Subject ➔ CO ➔ PO Tree
                </button>
                <button 
                    type="button" 
                    class="toggle-btn" 
                    [class.active]="viewMode === 'grid'" 
                    (click)="viewMode = 'grid'" 
                    title="NBA PO1-PO12 Standard Cards">
                    🔲 NBA PO1–PO12 Cards
                </button>
                <button 
                    type="button" 
                    class="toggle-btn" 
                    [class.active]="viewMode === 'table'" 
                    (click)="viewMode = 'table'" 
                    title="Tabular Outcome Registry">
                    📋 Table
                </button>
            </div>
        </div>

        <!-- ========================================================= -->
        <!-- VIEW MODE 1: SUBJECT -> CO -> PO HIERARCHY TREE (DEFAULT)  -->
        <!-- ========================================================= -->
        <div *ngIf="viewMode === 'hierarchy'" class="hierarchy-container">
            <div class="hierarchy-header-meta">
                <div class="guide-note">
                    <span>💡 <strong>Tip:</strong> Click on any subject card to view its Course Outcomes (CO1–CO5). Click the <strong>▶ Arrow</strong> next to any CO to expand its linked Program Outcomes (POs/PSOs) with correlation levels.</span>
                </div>
                <button type="button" class="expand-all-btn" (click)="toggleAllSubjects()">
                    {{ allExpanded ? '▲ Collapse All Subjects' : '▼ Expand All Subjects' }}
                </button>
            </div>

            <div class="subject-tree-list">
                <div *ngFor="let subject of filteredHierarchySubjects" class="subject-hierarchy-card">
                    <!-- Subject Card Header -->
                    <div class="subject-card-header" (click)="subject.isExpanded = !subject.isExpanded">
                        <div class="subject-left-info">
                            <span class="course-code-pill">{{ subject.courseCode }}</span>
                            <div class="subject-titles">
                                <h3 class="subject-name">{{ subject.courseTitle }}</h3>
                                <span class="subject-dept-sub">{{ subject.department }}</span>
                            </div>
                        </div>
                        <div class="subject-right-info">
                            <span class="co-count-badge">🎯 {{ subject.cos.length }} Course Outcomes</span>
                            <span class="expand-indicator-pill">
                                {{ subject.isExpanded ? '▲ Hide COs' : '▼ View COs' }}
                            </span>
                        </div>
                    </div>

                    <!-- Subject Card Body: CO List -->
                    <div class="subject-card-body" *ngIf="subject.isExpanded">
                        <div class="co-hierarchy-list">
                            <div *ngFor="let coItem of subject.cos" class="co-hierarchy-row" [class.po-open]="coItem.isPoExpanded">
                                <!-- CO Row Header -->
                                <div class="co-row-main" (click)="coItem.isPoExpanded = !coItem.isPoExpanded">
                                    <div class="co-badge-wrapper">
                                        <span class="co-code-badge">{{ coItem.coCode }}</span>
                                    </div>
                                    <div class="co-statement-wrapper">
                                        <p class="co-statement-text">{{ coItem.description }}</p>
                                    </div>
                                    <div class="co-toggle-wrapper">
                                        <span class="mapped-po-count-tag" [class.has-pos]="coItem.mappedPos.length > 0">
                                            🔗 {{ coItem.mappedPos.length }} POs Mapped
                                        </span>
                                        <button type="button" class="arrow-extension-btn" [class.expanded]="coItem.isPoExpanded" title="Click to show/hide mapped Program Outcomes">
                                            <span class="arrow-icon">{{ coItem.isPoExpanded ? '▼' : '▶' }}</span>
                                            <span class="arrow-label">{{ coItem.isPoExpanded ? 'Hide POs' : 'View POs' }}</span>
                                        </button>
                                    </div>
                                </div>

                                <!-- MAPPED POs EXTENSION CONTAINER -->
                                <div class="mapped-pos-container" *ngIf="coItem.isPoExpanded">
                                    <div class="mapped-pos-header">
                                        <span class="mapped-pos-heading">
                                            🏛️ Program Outcomes Mapped to <strong>{{ coItem.coCode }}</strong>
                                        </span>
                                        <span class="mapping-scale-legend">
                                            <span class="scale-dot lvl-3"></span> Level 3 (High) &nbsp;|&nbsp;
                                            <span class="scale-dot lvl-2"></span> Level 2 (Med) &nbsp;|&nbsp;
                                            <span class="scale-dot lvl-1"></span> Level 1 (Low)
                                        </span>
                                    </div>

                                    <div class="mapped-pos-grid">
                                        <div *ngFor="let poMap of coItem.mappedPos" class="po-mapping-card" [class.lvl-3-border]="poMap.level === 3" [class.lvl-2-border]="poMap.level === 2" [class.lvl-1-border]="poMap.level === 1">
                                            <div class="po-map-top">
                                                <div class="po-code-attribute">
                                                    <span class="po-badge-mini">{{ poMap.poCode }}</span>
                                                    <strong class="po-attr-name">{{ poMap.attributeName }}</strong>
                                                </div>
                                                <div class="po-level-badge" [ngClass]="'level-' + poMap.level">
                                                    <span *ngIf="poMap.level === 3">★★★ Level 3 (Substantial)</span>
                                                    <span *ngIf="poMap.level === 2">★★☆ Level 2 (Moderate)</span>
                                                    <span *ngIf="poMap.level === 1">★☆☆ Level 1 (Slight)</span>
                                                </div>
                                            </div>

                                            <p class="po-justification" *ngIf="poMap.justification">
                                                {{ poMap.justification }}
                                            </p>

                                            <div class="po-map-bottom">
                                                <span class="contribution-metric">
                                                    Weight: <strong>{{ poMap.contribution }}%</strong>
                                                </span>
                                                <span class="nba-tag">NBA Criteria 3</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div *ngIf="filteredHierarchySubjects.length === 0" class="empty-state-card">
                    <span style="font-size: 2.5rem; margin-bottom: 8px;">🔍</span>
                    <h3>No subjects or outcomes match "{{ searchQuery }}"</h3>
                    <p>Try searching with another keyword, course code, or PO code.</p>
                </div>
            </div>
        </div>

        <!-- ========================================================= -->
        <!-- VIEW MODE 2: NBA STANDARD PO1-PO12 CARDS GRID             -->
        <!-- ========================================================= -->
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
                    <span class="program-tag">🏛️ {{ po.program || targetDepartmentName }}</span>
                    <div class="action-buttons" *ngIf="userRole === 'admin' || userRole === 'faculty'">
                        <button type="button" class="edit-sm-btn" (click)="editPo(i)">Edit</button>
                        <button type="button" class="del-sm-btn" (click)="deletePo(i)">Delete</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- ========================================================= -->
        <!-- VIEW MODE 3: TABULAR REGISTRY                              -->
        <!-- ========================================================= -->
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
                        <th style="width: 160px;">Program</th>
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
                            <span class="program-pill">{{ po.program || targetDepartmentName }}</span>
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

        <!-- Add/Edit PO Card (Faculty/Admin only) -->
        <div class="section-card form-card" *ngIf="(userRole === 'admin' || userRole === 'faculty') && (viewMode === 'grid' || viewMode === 'table')">
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
                    <button type="button" class="btn-secondary" (click)="resetForm()">Clear</button>
                </div>
            </form>
        </div>

        <app-footer></app-footer>
    </div>

</div>`,
  styles: [
    `
    .header-pill { display: inline-block; background: rgba(212, 175, 55, 0.15); color: #d4af37; border: 1px solid rgba(212, 175, 55, 0.3); font-weight: 700; font-size: 11.5px; padding: 3px 10px; border-radius: 6px; margin-bottom: 6px; text-transform: uppercase; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .stats-badge-group { display: flex; gap: 12px; }
    .stats-badge-card { background: #101b38; padding: 10px 18px; border-radius: 12px; border: 1px solid #1f2f54; text-align: center; box-shadow: 0 4px 16px rgba(0,0,0,0.3); display: flex; flex-direction: column; min-width: 110px; }
    .stats-badge-card.gold-border { border-color: rgba(212, 175, 55, 0.4); background: rgba(212, 175, 55, 0.06); }
    .count-num { font-size: 1.6rem; font-weight: 800; color: #ffffff; }
    .stats-badge-card.gold-border .count-num { color: #fde68a; }
    .count-lbl { font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: #94a3b8; }

    .branch-banner {
      background: linear-gradient(135deg, #101b38 0%, #18284e 100%);
      color: #ffffff;
      padding: 16px 20px;
      border-radius: 14px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      border: 1px solid #1f2f54;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    }
    .faculty-banner {
      border-left: 4px solid #d4af37;
      background: linear-gradient(135deg, #101b38 0%, #1a2a50 100%);
    }
    .banner-icon { font-size: 2.2rem; }
    .banner-details { flex: 1; }
    .banner-title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .banner-title-row strong { font-size: 1.2rem; font-weight: 800; color: #ffffff; }
    .banner-tag { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.3); padding: 2px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 800; }
    .faculty-tag { background: rgba(212, 175, 55, 0.15); color: #d4af37; border-color: rgba(212, 175, 55, 0.4); }
    .banner-sub { margin: 4px 0 0 0; font-size: 0.88rem; color: #94a3b8; line-height: 1.4; }
    .assigned-chips { color: #facc15; font-weight: 700; }

    .po-toolbar { background: #101b38; padding: 14px 18px; border-radius: 12px; border: 1px solid #1f2f54; margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 14px; align-items: center; justify-content: space-between; box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
    .search-input-wrap { display: flex; align-items: center; background: #091024; border: 1px solid #1f2f54; border-radius: 8px; padding: 6px 12px; flex: 1; min-width: 280px; }
    .search-icon { margin-right: 8px; font-size: 1rem; color: #d4af37; }
    .search-input-wrap input { border: none; background: transparent; width: 100%; outline: none; font-size: 0.95rem; color: #ffffff; }
    .clear-btn { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 13px; }
    
    .view-mode-toggle { display: flex; border: 1px solid #1f2f54; border-radius: 8px; overflow: hidden; }
    .toggle-btn { background: #091024; border: none; padding: 8px 14px; font-size: 12.5px; font-weight: 700; color: #cbd5e1; cursor: pointer; transition: all 0.2s ease; }
    .toggle-btn.active { background: linear-gradient(135deg, #d4af37 0%, #b38f28 100%); color: #0a1128; }

    /* Hierarchy Tree Layout */
    .hierarchy-container { margin-bottom: 30px; }
    .hierarchy-header-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
    .guide-note { background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.25); color: #bae6fd; padding: 8px 14px; border-radius: 8px; font-size: 12.5px; flex: 1; min-width: 280px; }
    .expand-all-btn { background: #18284e; color: #cbd5e1; border: 1px solid #1f2f54; padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; }
    .expand-all-btn:hover { background: #233876; color: #ffffff; }

    .subject-tree-list { display: flex; flex-direction: column; gap: 18px; }
    
    .subject-hierarchy-card {
      background: #101b38;
      border: 1px solid #1f2f54;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 6px 20px rgba(0,0,0,0.3);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .subject-hierarchy-card:hover {
      border-color: rgba(212, 175, 55, 0.4);
      box-shadow: 0 8px 26px rgba(0,0,0,0.4);
    }

    .subject-card-header {
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(90deg, #132247 0%, #101b38 100%);
      cursor: pointer;
      border-bottom: 1px solid transparent;
      transition: background 0.15s ease;
      user-select: none;
    }
    .subject-card-header:hover {
      background: linear-gradient(90deg, #182b59 0%, #132247 100%);
    }
    .subject-left-info { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
    .course-code-pill {
      background: linear-gradient(135deg, #d4af37 0%, #b38f28 100%);
      color: #0a1128;
      font-weight: 800;
      font-family: monospace;
      font-size: 13px;
      padding: 5px 12px;
      border-radius: 8px;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 8px rgba(212, 175, 55, 0.25);
    }
    .subject-titles { display: flex; flex-direction: column; }
    .subject-name { margin: 0; font-size: 1.15rem; color: #ffffff; font-weight: 800; }
    .subject-dept-sub { font-size: 12px; color: #94a3b8; font-weight: 600; }

    .subject-right-info { display: flex; align-items: center; gap: 12px; }
    .co-count-badge {
      background: #091024;
      color: #38bdf8;
      border: 1px solid #1f2f54;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 6px;
    }
    .expand-indicator-pill {
      background: #18284e;
      color: #e2e8f0;
      border: 1px solid #283e70;
      font-size: 12px;
      font-weight: 700;
      padding: 5px 12px;
      border-radius: 6px;
    }

    /* Subject Card Body */
    .subject-card-body {
      padding: 18px 20px;
      background: #0a1128;
      border-top: 1px solid #1f2f54;
    }

    .co-hierarchy-list { display: flex; flex-direction: column; gap: 14px; }
    
    .co-hierarchy-row {
      background: #101b38;
      border: 1px solid #1f2f54;
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.2s ease;
    }
    .co-hierarchy-row.po-open {
      border-color: #38bdf8;
      box-shadow: 0 4px 18px rgba(56, 189, 248, 0.15);
    }

    .co-row-main {
      padding: 14px 18px;
      display: flex;
      align-items: center;
      gap: 16px;
      cursor: pointer;
      user-select: none;
      transition: background 0.15s ease;
    }
    .co-row-main:hover {
      background: #152348;
    }

    .co-badge-wrapper { min-width: 60px; }
    .co-code-badge {
      display: inline-block;
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.4);
      font-weight: 800;
      font-family: monospace;
      font-size: 13px;
      padding: 4px 10px;
      border-radius: 6px;
    }

    .co-statement-wrapper { flex: 1; }
    .co-statement-text { margin: 0; font-size: 13.5px; color: #f1f5f9; line-height: 1.45; font-weight: 500; }

    .co-toggle-wrapper { display: flex; align-items: center; gap: 10px; }
    .mapped-po-count-tag {
      background: #091024;
      color: #94a3b8;
      border: 1px solid #1f2f54;
      font-size: 11.5px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 6px;
    }
    .mapped-po-count-tag.has-pos {
      color: #fde68a;
      border-color: rgba(212, 175, 55, 0.3);
      background: rgba(212, 175, 55, 0.08);
    }

    .arrow-extension-btn {
      background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
      color: #ffffff;
      border: 1px solid #3b82f6;
      border-radius: 6px;
      padding: 5px 10px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
    }
    .arrow-extension-btn.expanded {
      background: linear-gradient(135deg, #d4af37 0%, #b38f28 100%);
      color: #0a1128;
      border-color: #d4af37;
    }
    .arrow-icon { font-size: 10px; }

    /* MAPPED POs ACCORDION */
    .mapped-pos-container {
      background: #091024;
      border-top: 1px solid #1f2f54;
      padding: 16px 18px;
      animation: fadeIn 0.2s ease;
    }

    .mapped-pos-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 8px;
      border-bottom: 1px solid #162447;
      padding-bottom: 8px;
    }
    .mapped-pos-heading { font-size: 13px; color: #cbd5e1; }
    .mapped-pos-heading strong { color: #38bdf8; font-family: monospace; }
    .mapping-scale-legend { font-size: 11.5px; color: #94a3b8; display: flex; align-items: center; }
    .scale-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; }
    .scale-dot.lvl-3 { background: #4ade80; }
    .scale-dot.lvl-2 { background: #facc15; }
    .scale-dot.lvl-1 { background: #38bdf8; }

    .mapped-pos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 12px;
    }

    .po-mapping-card {
      background: #101b38;
      border: 1px solid #1f2f54;
      border-radius: 10px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .po-mapping-card.lvl-3-border { border-left: 4px solid #4ade80; }
    .po-mapping-card.lvl-2-border { border-left: 4px solid #facc15; }
    .po-mapping-card.lvl-1-border { border-left: 4px solid #38bdf8; }

    .po-map-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .po-code-attribute { display: flex; align-items: center; gap: 8px; }
    .po-badge-mini {
      background: #091024;
      color: #d4af37;
      border: 1px solid rgba(212, 175, 55, 0.4);
      font-family: monospace;
      font-weight: 800;
      font-size: 11.5px;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .po-attr-name { font-size: 12.5px; color: #ffffff; }

    .po-level-badge {
      font-size: 11px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      white-space: nowrap;
    }
    .po-level-badge.level-3 { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.3); }
    .po-level-badge.level-2 { background: rgba(234, 179, 8, 0.15); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.3); }
    .po-level-badge.level-1 { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }

    .po-justification {
      margin: 0;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.4;
    }

    .po-map-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #18284e;
      padding-top: 6px;
      font-size: 11.5px;
    }
    .contribution-metric { color: #cbd5e1; }
    .contribution-metric strong { color: #fde68a; }
    .nba-tag { color: #64748b; font-size: 10.5px; text-transform: uppercase; font-weight: 700; }

    /* Cards Grid */
    .po-grid-container { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); margin-bottom: 24px; }
    .po-card { background: #101b38; border: 1px solid #1f2f54; border-radius: 14px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.3); transition: transform 0.15s ease, box-shadow 0.15s ease; }
    .po-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(212, 175, 55, 0.15); border-color: #d4af37; }
    
    .po-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
    .po-badge-wrap { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .po-code-badge { background: #091024; color: #d4af37; font-weight: 800; font-family: monospace; font-size: 12px; padding: 3px 8px; border-radius: 6px; border: 1px solid #1f2f54; }
    .po-title { font-size: 13.5px; color: #ffffff; font-weight: 800; }
    .target-pill { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.3); font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; }

    .po-desc { margin: 0; font-size: 13px; color: #cbd5e1; line-height: 1.5; }
    .po-card-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid #1f2f54; font-size: 11.5px; }
    .program-tag { color: #94a3b8; font-weight: 600; }

    /* Table Styles */
    .table-card { margin-bottom: 24px; padding: 20px; background: #101b38; border-radius: 14px; border: 1px solid #1f2f54; box-shadow: 0 8px 24px rgba(0,0,0,.3); overflow-x: auto; }
    .table-meta-bar h2 { margin: 0 0 14px 0; font-size: 1.2rem; color: #ffffff; font-weight: 800; }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { background: #132247; padding: 12px 14px; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: #d4af37; font-weight: 700; border-bottom: 1px solid #1f2f54; }
    td { padding: 14px; border-bottom: 1px solid #1f2f54; font-size: 0.9rem; vertical-align: middle; color: #e2e8f0; }
    tr:hover td { background: #18284e; }
    
    .attr-title-text { color: #ffffff; font-size: 13px; }
    .desc-text-cell { color: #cbd5e1; line-height: 1.45; font-size: 13px; }
    .program-pill { background: #091024; color: #94a3b8; border: 1px solid #1f2f54; font-size: 11.5px; font-weight: 600; padding: 2px 8px; border-radius: 4px; }
    .target-badge { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.3); font-weight: 800; font-size: 12px; padding: 2px 8px; border-radius: 4px; }

    .form-card { margin-bottom: 24px; padding: 20px; background: #101b38; border-radius: 14px; border: 1px solid #1f2f54; }
    .grid-row { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    label { display: flex; flex-direction: column; font-weight: 600; color: #cbd5e1; font-size: 13px; margin-bottom: 8px; }
    input[type=text], textarea { margin-top: 6px; padding: 10px 12px; border: 1px solid #1f2f54; border-radius: 8px; font-size: 14px; outline: none; background: #091024; color: #ffffff; }
    textarea { resize: vertical; min-height: 80px; }
    
    .form-actions { display: flex; gap: 10px; margin-top: 12px; }
    .btn { padding: 10px 18px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px; }
    .btn-primary { background: linear-gradient(135deg, #d4af37 0%, #b38f28 100%); color: #0a1128; font-weight: 700; }
    .btn-secondary { background: #1f2f54; color: #cbd5e1; }
    
    .edit-sm-btn { background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.4); padding: 4px 8px; font-size: 11px; font-weight: 700; border-radius: 4px; cursor: pointer; }
    .del-sm-btn { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.4); padding: 4px 8px; font-size: 11px; font-weight: 700; border-radius: 4px; cursor: pointer; margin-left: 6px; }
    .empty-state, .empty-state-card { text-align: center; padding: 40px 20px; color: #94a3b8; font-weight: 600; }
    .empty-state-card { background: #101b38; border: 1px dashed #1f2f54; border-radius: 14px; }
    .empty-state-card h3 { color: #ffffff; margin: 4px 0; }
    .empty-state-card p { margin: 0; font-size: 13px; }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    `
  ]
})
export class ProgramOutcomes implements OnInit {
  private toast = inject(ToastService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  userRole: string = 'student';
  userName: string = '';
  facultyName: string = '';
  studentDept: string = 'Computer Science & Engineering';
  facultyDept: string = 'Computer Science & Engineering';
  userDept: string = 'Computer Science & Engineering';
  assignedCourses: string[] = [];

  get targetDepartmentName(): string {
    if (this.userRole === 'faculty') return this.facultyDept;
    if (this.userRole === 'student') return this.studentDept;
    return this.userDept || 'Computer Science & Engineering';
  }

  get facultyAssignedCoursesDisplay(): string {
    if (this.assignedCourses && this.assignedCourses.length > 0) {
      return this.assignedCourses.join(', ');
    }
    return 'All Department Subjects';
  }

  get shortDept(): string {
    const d = (this.targetDepartmentName || '').toLowerCase();
    if (d.includes('computer') || d.includes('cse') || d.includes('cs')) return 'CSE';
    if (d.includes('information') || d.includes('it')) return 'IT';
    if (d.includes('electronic') || d.includes('ece') || d.includes('electrical') || d.includes('eee') || d === 'ee') return 'ECE';
    if (d.includes('mechanical') || d.includes('mech')) return 'ME';
    if (d.includes('civil') || d === 'ce') return 'Civil';
    return 'CSE';
  }
  
  programOutcomes: ProgramOutcome[] = [];
  hierarchySubjects: SubjectHierarchyGroup[] = [];
  searchQuery: string = '';
  selectedDeptFilter: string = '';
  viewMode: 'hierarchy' | 'grid' | 'table' = 'hierarchy';
  allExpanded: boolean = true;

  currentPo: ProgramOutcome = { poNumber: '', program: 'Computer Science & Engineering', description: '' };
  editIndex = -1;

  // Complete NBA PO & PSO Definitions per Department
  deptStandardOutcomesMap: { [key: string]: ProgramOutcome[] } = {
    'CSE': [
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
    ],
    'IT': [
      { poNumber: 'PO1', attributeName: 'Engineering Knowledge', program: 'Information Technology', description: 'Apply mathematics, computing principles, and information technology fundamentals to design robust enterprise systems.' },
      { poNumber: 'PO2', attributeName: 'Problem Analysis', program: 'Information Technology', description: 'Analyze complex IT infrastructure problems and identify requirements for networking and cloud systems.' },
      { poNumber: 'PO3', attributeName: 'Design & Development of Solutions', program: 'Information Technology', description: 'Design full-stack web architectures, secure databases, and distributed network solutions.' },
      { poNumber: 'PO4', attributeName: 'Conduct Investigations', program: 'Information Technology', description: 'Conduct investigations using data analytics, performance benchmarking, and network testing tools.' },
      { poNumber: 'PO5', attributeName: 'Modern Tool Usage', program: 'Information Technology', description: 'Use modern web frameworks, containerization tools (Docker, K8s), and cloud platforms.' },
      { poNumber: 'PO6', attributeName: 'The Engineer and Society', program: 'Information Technology', description: 'Evaluate social, legal, and ethical impacts of IT solutions and data privacy regulations.' },
      { poNumber: 'PO7', attributeName: 'Environment & Sustainability', program: 'Information Technology', description: 'Design energy-efficient computing systems and sustainable green IT architectures.' },
      { poNumber: 'PO8', attributeName: 'Ethics & Integrity', program: 'Information Technology', description: 'Adhere to professional cybersecurity ethics, user data privacy laws, and IP standards.' },
      { poNumber: 'PO9', attributeName: 'Individual and Team Work', program: 'Information Technology', description: 'Collaborate effectively in multidisciplinary DevOps and agile scrum product teams.' },
      { poNumber: 'PO10', attributeName: 'Communication', program: 'Information Technology', description: 'Document and articulate technical architecture designs and system configurations.' },
      { poNumber: 'PO11', attributeName: 'Project Management', program: 'Information Technology', description: 'Apply agile sprint planning, continuous delivery, and IT project budgeting.' },
      { poNumber: 'PO12', attributeName: 'Life-long Learning', program: 'Information Technology', description: 'Continuously adapt to emerging tech stacks, AI capabilities, and cyber technologies.' },
      { poNumber: 'PSO1', attributeName: 'Cloud & Infrastructure Engineering', program: 'Information Technology', description: 'Architect, secure, and manage hybrid cloud infrastructure, containerized deployments, and CI/CD pipelines.' },
      { poNumber: 'PSO2', attributeName: 'Enterprise Web Platforms', program: 'Information Technology', description: 'Design enterprise web platforms and full-stack software applications with robust security protocols.' }
    ],
    'ECE': [
      { poNumber: 'PO1', attributeName: 'Engineering Knowledge', program: 'Electronics & Communication Engineering', description: 'Apply mathematics, signal analysis, semiconductor physics, and circuit theory to electronics systems.' },
      { poNumber: 'PO2', attributeName: 'Problem Analysis', program: 'Electronics & Communication Engineering', description: 'Identify and analyze signal distortion, RF propagation, and VLSI circuit timing constraints.' },
      { poNumber: 'PO3', attributeName: 'Design & Development of Solutions', program: 'Electronics & Communication Engineering', description: 'Design analog/digital circuits, embedded hardware modules, and antenna transmission systems.' },
      { poNumber: 'PO4', attributeName: 'Conduct Investigations', program: 'Electronics & Communication Engineering', description: 'Perform laboratory testing with oscilloscopes, spectrum analyzers, and circuit simulators.' },
      { poNumber: 'PO5', attributeName: 'Modern Tool Usage', program: 'Electronics & Communication Engineering', description: 'Utilize EDA tools, MATLAB/Simulink, Cadence, and FPGA design suites.' },
      { poNumber: 'PO6', attributeName: 'The Engineer and Society', program: 'Electronics & Communication Engineering', description: 'Assess electromagnetic radiation standards and societal impacts of telecommunication infrastructure.' },
      { poNumber: 'PO7', attributeName: 'Environment & Sustainability', program: 'Electronics & Communication Engineering', description: 'Develop low-power electronic designs and e-waste mitigation practices.' },
      { poNumber: 'PO8', attributeName: 'Ethics & Integrity', program: 'Electronics & Communication Engineering', description: 'Follow IEEE engineering standards, spectrum licensing regulations, and safety codes.' },
      { poNumber: 'PO9', attributeName: 'Individual and Team Work', program: 'Electronics & Communication Engineering', description: 'Work collaboratively in hardware-software co-design teams.' },
      { poNumber: 'PO10', attributeName: 'Communication', program: 'Electronics & Communication Engineering', description: 'Present electronic schematics, PCB layout documentation, and technical test reports.' },
      { poNumber: 'PO11', attributeName: 'Project Management', program: 'Electronics & Communication Engineering', description: 'Manage hardware prototyping cycles, component sourcing, and BOM costing.' },
      { poNumber: 'PO12', attributeName: 'Life-long Learning', program: 'Electronics & Communication Engineering', description: 'Keep pace with 5G/6G communication evolutions and nanoscale semiconductor devices.' },
      { poNumber: 'PSO1', attributeName: 'Embedded Firmware & IoT', program: 'Electronics & Communication Engineering', description: 'Develop real-time embedded firmware, ARM microcontroller architectures, and IoT sensor interfaces.' },
      { poNumber: 'PSO2', attributeName: 'VLSI & Digital Signal Systems', program: 'Electronics & Communication Engineering', description: 'Design digital VLSI systems, signal processing pipelines, and high-frequency communication protocols.' }
    ],
    'ME': [
      { poNumber: 'PO1', attributeName: 'Engineering Knowledge', program: 'Mechanical Engineering', description: 'Apply principles of mechanics, thermodynamics, fluid dynamics, and materials science to mechanical systems.' },
      { poNumber: 'PO2', attributeName: 'Problem Analysis', program: 'Mechanical Engineering', description: 'Formulate stress-strain equations, thermal transfer rates, and kinematic forces in mechanical structures.' },
      { poNumber: 'PO3', attributeName: 'Design & Development of Solutions', program: 'Mechanical Engineering', description: 'Design machine elements, HVAC thermal systems, and robotic automation mechanisms.' },
      { poNumber: 'PO4', attributeName: 'Conduct Investigations', program: 'Mechanical Engineering', description: 'Conduct CFD simulations, FEA structural stress testing, and vibration testing.' },
      { poNumber: 'PO5', attributeName: 'Modern Tool Usage', program: 'Mechanical Engineering', description: 'Utilize CAD/CAM software (AutoCAD, SolidWorks, ANSYS) and CNC fabrication tools.' },
      { poNumber: 'PO6', attributeName: 'The Engineer and Society', program: 'Mechanical Engineering', description: 'Comply with industrial machinery safety directives and automotive passenger safety laws.' },
      { poNumber: 'PO7', attributeName: 'Environment & Sustainability', program: 'Mechanical Engineering', description: 'Improve thermal efficiency, reduce carbon emissions, and implement renewable energy systems.' },
      { poNumber: 'PO8', attributeName: 'Ethics & Integrity', program: 'Mechanical Engineering', description: 'Uphold ASME safety codes, quality control ethics, and structural integrity guidelines.' },
      { poNumber: 'PO9', attributeName: 'Individual and Team Work', program: 'Mechanical Engineering', description: 'Function effectively in multidisciplinary manufacturing and plant operation teams.' },
      { poNumber: 'PO10', attributeName: 'Communication', program: 'Mechanical Engineering', description: 'Produce engineering fabrication blueprints, GD&T tolerancing sheets, and inspection reports.' },
      { poNumber: 'PO11', attributeName: 'Project Management', program: 'Mechanical Engineering', description: 'Manage manufacturing lead times, lean inventory, and assembly line operations.' },
      { poNumber: 'PO12', attributeName: 'Life-long Learning', program: 'Mechanical Engineering', description: 'Stay abreast of additive manufacturing, Industry 4.0 robotics, and advanced composites.' },
      { poNumber: 'PSO1', attributeName: 'Thermal & Fluid Power Systems', program: 'Mechanical Engineering', description: 'Analyze thermal systems, IC engines, fluid power dynamics, and HVAC thermodynamic cycles.' },
      { poNumber: 'PSO2', attributeName: 'Precision Machine Design & Robotics', program: 'Mechanical Engineering', description: 'Design precision machine elements, CAD/CAM kinematics, and robotic automation mechanisms.' }
    ],
    'Civil': [
      { poNumber: 'PO1', attributeName: 'Engineering Knowledge', program: 'Civil Engineering', description: 'Apply mathematics, structural engineering fundamentals, and geotechnical mechanics to infrastructure.' },
      { poNumber: 'PO2', attributeName: 'Problem Analysis', program: 'Civil Engineering', description: 'Analyze structural loads, seismic resistances, and hydraulic watershed flows.' },
      { poNumber: 'PO3', attributeName: 'Design & Development of Solutions', program: 'Civil Engineering', description: 'Design reinforced concrete structures, steel frames, water distribution grids, and transport systems.' },
      { poNumber: 'PO4', attributeName: 'Conduct Investigations', program: 'Civil Engineering', description: 'Perform soil compaction tests, concrete compressive testing, and water quality assays.' },
      { poNumber: 'PO5', attributeName: 'Modern Tool Usage', program: 'Civil Engineering', description: 'Employ STAAD.Pro, ETABS, Revit BIM, Total Station GIS, and hydrological modeling tools.' },
      { poNumber: 'PO6', attributeName: 'The Engineer and Society', program: 'Civil Engineering', description: 'Ensure public safety in civil infrastructure, bridge spans, and seismic zone shelters.' },
      { poNumber: 'PO7', attributeName: 'Environment & Sustainability', program: 'Civil Engineering', description: 'Integrate green building concepts, rainwater harvesting, and environmental impact assessments.' },
      { poNumber: 'PO8', attributeName: 'Ethics & Integrity', program: 'Civil Engineering', description: 'Adhere to national building codes (NBC), BIS guidelines, and construction safety laws.' },
      { poNumber: 'PO9', attributeName: 'Individual and Team Work', program: 'Civil Engineering', description: 'Collaborate with architects, contractors, urban planners, and site project managers.' },
      { poNumber: 'PO10', attributeName: 'Communication', program: 'Civil Engineering', description: 'Prepare structural drawings, tender estimates, and structural audit certificates.' },
      { poNumber: 'PO11', attributeName: 'Project Management', program: 'Civil Engineering', description: 'Manage site timelines, CPM/PERT scheduling, and construction billing audits.' },
      { poNumber: 'PO12', attributeName: 'Life-long Learning', program: 'Civil Engineering', description: 'Adopt smart infrastructure sensing, prefabricated modular buildings, and self-healing concrete.' },
      { poNumber: 'PSO1', attributeName: 'Structural & Geotechnical Engineering', program: 'Civil Engineering', description: 'Perform advanced structural analysis, RCC concrete designs, and geotechnical soil mechanics.' },
      { poNumber: 'PSO2', attributeName: 'Hydraulics & Sustainable Infrastructure', program: 'Civil Engineering', description: 'Apply fluid mechanics, hydraulic networks, GIS surveying, and sustainable environmental engineering.' }
    ]
  };

  get standardNBAOutcomes(): ProgramOutcome[] {
    return this.getFallbackOutcomes();
  }

  getFallbackOutcomes(): ProgramOutcome[] {
    const s = this.shortDept;
    return this.deptStandardOutcomesMap[s] || this.deptStandardOutcomesMap['CSE'];
  }

  constructor() {
    try {
      this.userRole = localStorage.getItem('userRole')?.toLowerCase() || 'student';
      this.userName = localStorage.getItem('userName') || '';
      this.facultyName = this.userName;
      this.studentDept = localStorage.getItem('userDept') || localStorage.getItem('userDepartment') || 'Computer Science & Engineering';
      this.facultyDept = localStorage.getItem('userDepartment') || localStorage.getItem('userDept') || 'Computer Science & Engineering';
      this.userDept = this.userRole === 'faculty' ? this.facultyDept : this.studentDept;

      const dept = this.shortDept;
      const storedCourses = localStorage.getItem('userAssignedCourses');
      if (storedCourses) {
        try {
          this.assignedCourses = JSON.parse(storedCourses);
        } catch {}
      }
      
      if (!this.assignedCourses || this.assignedCourses.length === 0) {
        if (dept === 'CSE') {
          this.assignedCourses = ['CS101', 'CS102', 'CS103', 'CS201', 'CS202', 'CS301', 'CS302', 'CS303', 'CS401', 'CS402'];
        } else if (dept === 'IT') {
          this.assignedCourses = ['IT113', 'IT201', 'IT211', 'IT301', 'IT305'];
        } else if (dept === 'ECE') {
          this.assignedCourses = ['EC114', 'EC201', 'EC202', 'EC211', 'EC301'];
        } else if (dept === 'ME') {
          this.assignedCourses = ['ME113', 'ME201', 'ME202', 'ME211', 'ME301'];
        } else if (dept === 'Civil') {
          this.assignedCourses = ['CE113', 'CE201', 'CE202', 'CE203', 'CE301'];
        }
      }
    } catch {
      this.userRole = 'student';
    }
  }

  ngOnInit(): void {
    this.programOutcomes = [...this.getFallbackOutcomes()];
    this.buildHierarchyTree();
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
    const standard = this.getFallbackOutcomes().find(s => s.poNumber === code);
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
      'PSO1': 'Specialized Core Systems',
      'PSO2': 'Advanced Applied Engineering'
    };
    return titles[code] || 'Graduate Attribute';
  }

  private loadProgramOutcomes(): void {
    let url = 'http://localhost:8080/api/copo/po';
    if (this.userRole === 'faculty') {
      if (this.facultyName) {
        url = `http://localhost:8080/api/copo/po?faculty=${encodeURIComponent(this.facultyName)}`;
      } else if (this.facultyDept) {
        url = `http://localhost:8080/api/copo/po?department=${encodeURIComponent(this.facultyDept)}`;
      }
    } else if (this.userRole === 'student' && this.studentDept) {
      url = `http://localhost:8080/api/copo/po?department=${encodeURIComponent(this.studentDept)}`;
    }

    this.http.get<ProgramOutcome[]>(url).subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length > 0) {
          this.programOutcomes = data.map((item, idx) => ({
            id: item.id || (idx + 1),
            poNumber: item.poNumber || item.po || this.getPoCode(item, idx),
            program: item.program || this.targetDepartmentName,
            description: item.description,
            attributeName: this.getAttributeTitle(item, idx)
          }));
        } else {
          this.programOutcomes = [...this.getFallbackOutcomes()];
        }
        this.buildHierarchyTree();
        this.cdr.detectChanges();
      },
      error: () => {
        this.programOutcomes = [...this.getFallbackOutcomes()];
        this.buildHierarchyTree();
        this.cdr.detectChanges();
      }
    });
  }

  toggleAllSubjects(): void {
    this.allExpanded = !this.allExpanded;
    this.hierarchySubjects.forEach(s => s.isExpanded = this.allExpanded);
  }

  getSavedOrMasterCOs(courseCode: string, courseTitle: string): { co: string; desc: string }[] {
    const code = courseCode.toUpperCase();

    // 1. Check if user created/edited customized COs in localStorage
    try {
      const stored = localStorage.getItem('obslmsCourseOutcomes');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const matched = parsed.filter(item => 
            item.course && (
              item.course.toUpperCase() === code || 
              item.course.toUpperCase().startsWith(code) ||
              code.startsWith(item.course.toUpperCase())
            )
          );
          if (matched.length > 0) {
            return matched.map(m => ({ co: m.co, desc: m.description }));
          }
        }
      }
    } catch {}

    // 2. Check in MASTER_COURSE_OUTCOMES
    if (MASTER_COURSE_OUTCOMES[code]) {
      return MASTER_COURSE_OUTCOMES[code];
    }

    // 3. Realistic fallback
    return [
      { co: 'CO1', desc: `Understand fundamental concepts, architectures, and theoretical foundations of ${courseTitle}.` },
      { co: 'CO2', desc: `Analyze requirements, design modular schemas, and solve engineering problems in ${courseTitle}.` },
      { co: 'CO3', desc: `Implement practical constructs, algorithms, and automated test cases for ${courseTitle}.` },
      { co: 'CO4', desc: `Evaluate performance metrics, system tradeoffs, and quality verification standards in ${courseTitle}.` },
      { co: 'CO5', desc: `Develop robust applications adhering to software engineering practices and ethical standards.` }
    ];
  }

  getMappedPosForCo(courseCode: string, coCode: string, coDesc: string, dept: string): MappedPO[] {
    const code = courseCode.toUpperCase();
    const co = coCode.toUpperCase();

    if (co === 'CO1') {
      return [
        { poCode: 'PO1', attributeName: 'Engineering Knowledge', level: 3, contribution: 90, justification: `Directly assesses fundamental mathematical principles and core engineering concepts in ${code}.` },
        { poCode: 'PO2', attributeName: 'Problem Analysis', level: 2, contribution: 60, justification: 'Identifies operational requirements, input/output boundary conditions, and problem constraints.' },
        { poCode: 'PSO1', attributeName: 'Specialized Core Systems', level: 3, contribution: 85, justification: `Foundational core competency for accredited ${dept} engineering practice.` }
      ];
    }

    if (co === 'CO2') {
      return [
        { poCode: 'PO2', attributeName: 'Problem Analysis', level: 3, contribution: 90, justification: 'Evaluates structural complexities, architectural tradeoffs, and algorithmic formulations.' },
        { poCode: 'PO3', attributeName: 'Design & Development of Solutions', level: 3, contribution: 90, justification: `Designs modular schemas, algorithms, and system components for ${code}.` }
      ];
    }

    if (co === 'CO3') {
      return [
        { poCode: 'PO3', attributeName: 'Design & Development of Solutions', level: 2, contribution: 70, justification: 'Constructs reliable, maintainable, and secure implementations according to technical specs.' },
        { poCode: 'PO4', attributeName: 'Conduct Investigations', level: 2, contribution: 65, justification: 'Validates test datasets, benchmark edge cases, and runtime execution performance.' },
        { poCode: 'PO5', attributeName: 'Modern Tool Usage', level: 3, contribution: 90, justification: 'Utilizes modern development IDEs, Git version control, profilers, and simulation harnesses.' }
      ];
    }

    if (co === 'CO4') {
      return [
        { poCode: 'PO5', attributeName: 'Modern Tool Usage', level: 3, contribution: 80, justification: 'Applies automated build tools, container workflows, and observability frameworks.' },
        { poCode: 'PO8', attributeName: 'Ethics & Integrity', level: 1, contribution: 40, justification: 'Maintains software license compliance, safety codes, and data privacy norms.' },
        { poCode: 'PSO2', attributeName: 'Advanced Applied Engineering', level: 3, contribution: 85, justification: `Solves practical high-availability engineering challenges in ${dept}.` }
      ];
    }

    // CO5
    return [
      { poCode: 'PO9', attributeName: 'Individual & Team Work', level: 3, contribution: 90, justification: 'Executes collaborative sprint milestones in multidisciplinary team environments.' },
      { poCode: 'PO10', attributeName: 'Communication Skills', level: 3, contribution: 85, justification: 'Produces technical SRS blueprints, oral demonstrations, and comprehensive release docs.' },
      { poCode: 'PO12', attributeName: 'Life-long Learning', level: 2, contribution: 75, justification: 'Adapts to evolving open-source ecosystems, emerging tools, and modern software paradigms.' }
    ];
  }

  buildHierarchyTree(): void {
    const rawCourses = DEFAULT_DATABASE_COURSES || [];
    const getDeptFromCode = (code: string): string => {
      const c = (code || '').toUpperCase();
      if (c.startsWith('CS')) return 'CSE';
      if (c.startsWith('IT')) return 'IT';
      if (c.startsWith('EC') || c.startsWith('EE')) return 'ECE';
      if (c.startsWith('ME')) return 'ME';
      if (c.startsWith('CE') || c.startsWith('CIVIL')) return 'Civil';
      return 'CSE';
    };

    const curDept = this.shortDept;
    let relevantCourses: typeof DEFAULT_DATABASE_COURSES = [];

    if (this.assignedCourses && this.assignedCourses.length > 0) {
      relevantCourses = rawCourses.filter(c => 
        this.assignedCourses.some(assigned => 
          c.code.toLowerCase() === assigned.toLowerCase() ||
          c.title.toLowerCase().includes(assigned.toLowerCase()) ||
          assigned.toLowerCase().includes(c.code.toLowerCase())
        )
      );
    }

    if (relevantCourses.length === 0) {
      relevantCourses = rawCourses.filter(c => getDeptFromCode(c.code) === curDept);
    }

    if (relevantCourses.length === 0) {
      relevantCourses = rawCourses.filter(c => getDeptFromCode(c.code) === 'CSE');
    }

    // Deduplicate by course code
    const uniqueCourses = new Map<string, typeof DEFAULT_DATABASE_COURSES[0]>();
    relevantCourses.forEach(c => {
      if (!uniqueCourses.has(c.code)) uniqueCourses.set(c.code, c);
    });

    this.hierarchySubjects = Array.from(uniqueCourses.values()).map(course => {
      const courseDept = getDeptFromCode(course.code);
      const rawCOs = this.getSavedOrMasterCOs(course.code, course.title);

      const cos: COItemWithPOs[] = rawCOs.map((item, idx) => {
        const coCode = item.co || `CO${idx + 1}`;
        return {
          coCode: coCode,
          description: item.desc,
          isPoExpanded: idx === 0, // expand first CO by default
          mappedPos: this.getMappedPosForCo(course.code, coCode, item.desc, courseDept)
        };
      });

      return {
        courseCode: course.code,
        courseTitle: course.title,
        department: courseDept,
        cos: cos,
        isExpanded: true
      };
    });
  }

  get filteredHierarchySubjects(): SubjectHierarchyGroup[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.hierarchySubjects;

    return this.hierarchySubjects.filter(sub => {
      const codeMatch = sub.courseCode.toLowerCase().includes(q);
      const titleMatch = sub.courseTitle.toLowerCase().includes(q);
      const deptMatch = sub.department.toLowerCase().includes(q);
      
      const coMatch = sub.cos.some(co => 
        co.coCode.toLowerCase().includes(q) ||
        co.description.toLowerCase().includes(q) ||
        co.mappedPos.some(p => 
          p.poCode.toLowerCase().includes(q) || 
          p.attributeName.toLowerCase().includes(q) ||
          (p.justification && p.justification.toLowerCase().includes(q))
        )
      );

      return codeMatch || titleMatch || deptMatch || coMatch;
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
      if (this.userRole === 'faculty') {
        const targetShort = this.shortDept.toLowerCase();
        if (targetShort === 'cse') {
          const nonCse = ['civil', 'mechanical', 'ece', 'electronic', 'electrical'];
          if (nonCse.some(b => prog.includes(b))) {
            return false;
          }
          matchesDept = prog.includes('cse') || prog.includes('computer') || prog.includes('engineering') || !prog;
        } else {
          matchesDept = prog.includes(targetShort) || 
                        prog.includes((this.facultyDept || '').toLowerCase().split(' ')[0]) || 
                        (this.facultyDept || '').toLowerCase().includes(prog);
        }
      } else if (this.userRole === 'student') {
        const short = this.shortDept.toLowerCase();
        if (short === 'cse') {
          const nonCse = ['civil', 'mechanical', 'ece', 'electronic', 'electrical'];
          if (nonCse.some(b => prog.includes(b))) {
            return false;
          }
          matchesDept = prog.includes('cse') || prog.includes('computer') || prog.includes('engineering') || !prog;
        } else {
          matchesDept = prog.includes(short);
        }
      } else if (this.selectedDeptFilter) {
        const filt = this.selectedDeptFilter.toLowerCase();
        matchesDept = prog.includes(filt);
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
      program: this.currentPo.program ? this.currentPo.program.trim() : this.targetDepartmentName,
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
      program: po.program || this.targetDepartmentName,
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
    this.currentPo = { poNumber: '', program: this.targetDepartmentName, description: '' };
  }
}
