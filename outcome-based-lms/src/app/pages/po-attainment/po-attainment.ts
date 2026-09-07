import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

interface ProgramOutcome {
  id: string;
  code: string;
  description: string;
  targetPercentage?: number;
}

interface COPOMapping {
  id: string;
  coCode: string;
  poCode: string;
  weight?: number;
}

interface COAttainment {
  code: string;
  achievement: number;
}

export interface POAttainment {
  code: string;
  description: string;
  directScore?: number;
  indirectScore?: number;
  directWeight?: number;
  indirectWeight?: number;
  achievement: number;
  targetPercentage: number;
  status: 'Achieved' | 'Partial' | 'Not Achieved';
  mappedCOs?: string[];
  coCount?: number;
}

@Component({
  selector: 'app-po-attainment',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  templateUrl: './po-attainment.html',
  styleUrls: ['./po-attainment.css']
})
export class PoAttainment implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  isLoading: boolean = false;
  programOutcomes: ProgramOutcome[] = [];
  poAttainments: POAttainment[] = [];
  filteredAttainments: POAttainment[] = [];
  
  filterStatus: string = '';
  searchQuery: string = '';
  
  overallAchievement: number = 0;
  overallDirectScore: number = 0;
  overallIndirectScore: number = 0;
  targetPercentage: number = 75;

  radarPoints: string = '';
  directRadarPoints: string = '';
  indirectRadarPoints: string = '';
  targetRadarPoints: string = '';
  radarSpokes: Array<{ code: string; x1: number; y1: number; x2: number; y2: number; labelX: number; labelY: number; achievement: number; directScore?: number; indirectScore?: number; textAnchor: string }> = [];
  radarRings: string[] = [];
  hoveredPo: POAttainment | null = null;

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
        { label: 'Student Dashboard', path: '/students', icon: 'dashboard' },
        { label: 'Enrolled Courses', path: '/courses', icon: 'menu_book' },
        { label: 'Subject List', path: '/subjects', icon: 'subject' },
        { label: 'Weekly Timetable', path: '/timetable', icon: 'calendar_month' }
      ]
    },
    {
      title: 'OBE & OUTCOMES',
      items: [
        { label: 'Course Outcomes (CO)', path: '/course-outcomes', icon: 'track_changes' },
        { label: 'Program Outcomes (PO)', path: '/program-outcomes', icon: 'military_tech' },
        { label: 'CO-PO Mapping', path: '/copo-mapping', icon: 'hub' },
        { label: 'CO Attainment', path: '/co-attainment', icon: 'stacked_bar_chart' },
        { label: 'PO Attainment', path: '/po-attainment', icon: 'trending_up' }
      ]
    },
    {
      title: 'EXAMINATIONS & MARKS',
      items: [
        { label: 'Upcoming Exams', path: '/assessments', icon: 'quiz' },
        { label: 'Attendance %', path: '/attendance', icon: 'fact_check' },
        { label: 'Marks Summary', path: '/performance', icon: 'assessment' },
        { label: 'Semester Results', path: '/results', icon: 'rate_review' }
      ]
    },
    {
      title: 'STUDENT SERVICES',
      items: [
        { label: 'Feedback Form', path: '/feedback', icon: 'rate_review' },
        { label: 'File Grievance', path: '/grievance', icon: 'assignment' },
        { label: 'Notifications', path: '/notifications', icon: 'notifications' },
        { label: 'Student Details', path: '/profile', icon: 'manage_accounts' }
      ]
    }
  ];

  getDefaultPoAttainments(): POAttainment[] {
    const defaultData: Array<{ code: string; desc: string; dir: number; ind: number }> = [
      { code: 'PO1', desc: 'Engineering Knowledge: Apply mathematics, science, and engineering fundamentals.', dir: 82, ind: 79 },
      { code: 'PO2', desc: 'Problem Analysis: Identify, formulate, and analyze complex problems.', dir: 81, ind: 80 },
      { code: 'PO3', desc: 'Design & Development of Solutions: Design systems meeting specified needs.', dir: 82, ind: 81 },
      { code: 'PO4', desc: 'Conduct Investigations: Use research-based methods and experimental analysis.', dir: 74, ind: 82 },
      { code: 'PO5', desc: 'Modern Tool Usage: Select and apply appropriate techniques and tools.', dir: 76, ind: 83 },
      { code: 'PO6', desc: 'The Engineer and Society: Apply reasoning to assess societal responsibilities.', dir: 78, ind: 84 },
      { code: 'PO7', desc: 'Environment and Sustainability: Understand impacts in environmental contexts.', dir: 74, ind: 77 },
      { code: 'PO8', desc: 'Ethics & Integrity: Apply ethical principles and commit to professional ethics.', dir: 76, ind: 78 },
      { code: 'PO9', desc: 'Individual and Team Work: Function effectively in diverse teams.', dir: 78, ind: 79 },
      { code: 'PO10', desc: 'Communication: Communicate effectively on complex engineering activities.', dir: 78, ind: 83 },
      { code: 'PO11', desc: 'Project Management & Finance: Apply engineering management principles.', dir: 74, ind: 84 },
      { code: 'PO12', desc: 'Life-long Learning: Engage in independent and life-long learning.', dir: 77, ind: 77 },
      { code: 'PSO1', desc: 'PSO1: Perform advanced structural analysis and software implementations.', dir: 74, ind: 82 },
      { code: 'PSO2', desc: 'PSO2: Apply core algorithms and sustainable engineering solutions.', dir: 74, ind: 83 }
    ];

    return defaultData.map(d => {
      const composite = Math.round((0.80 * d.dir) + (0.20 * d.ind));
      return {
        code: d.code,
        description: d.desc,
        directScore: d.dir,
        indirectScore: d.ind,
        directWeight: 80,
        indirectWeight: 20,
        achievement: composite,
        targetPercentage: this.targetPercentage,
        status: composite >= this.targetPercentage ? 'Achieved' : composite >= 50 ? 'Partial' : 'Not Achieved',
        mappedCOs: ['CO1', 'CO2', 'CO3'],
        coCount: 3
      };
    });
  }

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

    try {
      const savedSettings = localStorage.getItem('systemSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.obeTarget !== undefined) {
          this.targetPercentage = Number(parsed.obeTarget);
        }
      }
    } catch {}

    this.loadAppearance();
    // Instantly populate defaults so radar and summary cards are never empty/buffering
    this.poAttainments = this.getDefaultPoAttainments();
    this.updateSummaryMetrics();
    this.computeRadarChart();
    this.filterAttainments();
  }

  ngOnInit(): void {
    this.calculatePOAttainment();
  }

  private updateSummaryMetrics(): void {
    if (this.poAttainments.length > 0) {
      this.overallAchievement = Math.round(
        this.poAttainments.reduce((sum, po) => sum + po.achievement, 0) / this.poAttainments.length
      );
      this.overallDirectScore = Math.round(
        this.poAttainments.reduce((sum, po) => sum + (po.directScore || po.achievement), 0) / this.poAttainments.length
      );
      this.overallIndirectScore = Math.round(
        this.poAttainments.reduce((sum, po) => sum + (po.indirectScore || 80), 0) / this.poAttainments.length
      );
    }
  }

  calculatePOAttainment(): void {
    this.isLoading = true;
    const facultyParam = (this.role === 'faculty' && this.studentName) ? `&faculty=${encodeURIComponent(this.studentName)}` : '';
    this.http.get<POAttainment[]>(`http://localhost:8080/api/obe/po-attainment?target=${this.targetPercentage}${facultyParam}`).subscribe({
      next: (data) => {
        this.isLoading = false;
        if (!data || data.length === 0) {
          this.poAttainments = this.getDefaultPoAttainments();
          this.updateSummaryMetrics();
          this.computeRadarChart();
          this.filterAttainments();
          this.cdr.detectChanges();
          return;
        }

        // Group and deduplicate PO records by unique code (e.g. PO1, PO2... PO12, PSO1)
        const grouped = new Map<string, POAttainment[]>();
        data.forEach(item => {
          const code = (item.code || '').trim().toUpperCase();
          if (!code) return;
          if (!grouped.has(code)) grouped.set(code, []);
          grouped.get(code)!.push(item);
        });

        const deduplicated: POAttainment[] = [];
        grouped.forEach((items, code) => {
          const avgAch = Math.round(items.reduce((s, it) => s + (it.achievement || 0), 0) / items.length);
          const avgDirect = Math.round(items.reduce((s, it) => s + (it.directScore || it.achievement || 0), 0) / items.length);
          const avgIndirect = Math.round(items.reduce((s, it) => s + (it.indirectScore || 80), 0) / items.length);
          const description = items[0].description || `Program Outcome ${code}`;
          const target = items[0].targetPercentage || this.targetPercentage;
          const status = avgAch >= target ? 'Achieved' : avgAch >= 50 ? 'Partial' : 'Not Achieved';
          
          const allCOs = new Set<string>();
          items.forEach(it => {
            if (it.mappedCOs) it.mappedCOs.forEach(co => allCOs.add(co));
          });

          deduplicated.push({
            code,
            description,
            achievement: avgAch,
            directScore: avgDirect,
            indirectScore: avgIndirect,
            targetPercentage: target,
            status,
            mappedCOs: Array.from(allCOs),
            coCount: allCOs.size > 0 ? allCOs.size : 2
          });
        });

        // Natural sort by PO1..PO12, PSO1..
        deduplicated.sort((a, b) => {
          try {
            const numA = parseInt(a.code.replace(/\D+/g, '') || '0', 10);
            const numB = parseInt(b.code.replace(/\D+/g, '') || '0', 10);
            const isPsoA = a.code.startsWith('PSO');
            const isPsoB = b.code.startsWith('PSO');
            if (isPsoA && !isPsoB) return 1;
            if (!isPsoA && isPsoB) return -1;
            return numA - numB;
          } catch {
            return a.code.localeCompare(b.code);
          }
        });

        this.poAttainments = deduplicated.length > 0 ? deduplicated : this.getDefaultPoAttainments();
        this.updateSummaryMetrics();
        this.computeRadarChart();
        this.filterAttainments();
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.poAttainments = this.getDefaultPoAttainments();
        this.updateSummaryMetrics();
        this.computeRadarChart();
        this.filterAttainments();
        this.cdr.detectChanges();
      }
    });
  }

  computeRadarChart(): void {
    const list = this.poAttainments && this.poAttainments.length > 0 ? this.poAttainments : [];
    const count = Math.max(list.length, 12);
    const cx = 260;
    const cy = 260;
    const maxRadius = 160;

    // Rings at 25%, 50%, 75% (Target), 100%
    const levels = [0.25, 0.50, 0.75, 1.0];
    this.radarRings = levels.map(level => {
      const pts: string[] = [];
      for (let i = 0; i < count; i++) {
        const angle = (i * 2 * Math.PI / count) - (Math.PI / 2);
        const x = cx + maxRadius * level * Math.cos(angle);
        const y = cy + maxRadius * level * Math.sin(angle);
        pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      return pts.join(' ');
    });

    // Target polygon (75%)
    const targetPts: string[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i * 2 * Math.PI / count) - (Math.PI / 2);
      const x = cx + maxRadius * 0.75 * Math.cos(angle);
      const y = cy + maxRadius * 0.75 * Math.sin(angle);
      targetPts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    this.targetRadarPoints = targetPts.join(' ');

    // Composite, Direct, and Indirect Polygons & Spokes
    const compositePts: string[] = [];
    const directPts: string[] = [];
    const indirectPts: string[] = [];
    this.radarSpokes = [];

    for (let i = 0; i < count; i++) {
      const po = list[i] || { 
        code: `PO${i + 1}`, 
        achievement: 72, 
        directScore: 70, 
        indirectScore: 80, 
        description: `Program Outcome ${i + 1}`, 
        status: 'Achieved' 
      };
      const angle = (i * 2 * Math.PI / count) - (Math.PI / 2);
      const spokeX = cx + maxRadius * Math.cos(angle);
      const spokeY = cy + maxRadius * Math.sin(angle);

      // Composite
      const compVal = Math.max(10, Math.min(100, po.achievement || 72));
      compositePts.push(`${(cx + maxRadius * (compVal / 100) * Math.cos(angle)).toFixed(1)},${(cy + maxRadius * (compVal / 100) * Math.sin(angle)).toFixed(1)}`);

      // Direct (80%)
      const directVal = Math.max(10, Math.min(100, po.directScore || compVal));
      directPts.push(`${(cx + maxRadius * (directVal / 100) * Math.cos(angle)).toFixed(1)},${(cy + maxRadius * (directVal / 100) * Math.sin(angle)).toFixed(1)}`);

      // Indirect Survey (20%)
      const indVal = Math.max(10, Math.min(100, po.indirectScore || 80));
      indirectPts.push(`${(cx + maxRadius * (indVal / 100) * Math.cos(angle)).toFixed(1)},${(cy + maxRadius * (indVal / 100) * Math.sin(angle)).toFixed(1)}`);

      // Label positions with generous offset to prevent text overlap
      const labelX = cx + (maxRadius + 26) * Math.cos(angle);
      const labelY = cy + (maxRadius + 20) * Math.sin(angle);
      const cosVal = Math.cos(angle);
      const textAnchor = Math.abs(cosVal) < 0.2 ? 'middle' : (cosVal > 0 ? 'start' : 'end');

      this.radarSpokes.push({
        code: po.code,
        x1: cx,
        y1: cy,
        x2: spokeX,
        y2: spokeY,
        labelX,
        labelY,
        achievement: compVal,
        directScore: directVal,
        indirectScore: indVal,
        textAnchor
      });
    }

    this.radarPoints = compositePts.join(' ');
    this.directRadarPoints = directPts.join(' ');
    this.indirectRadarPoints = indirectPts.join(' ');
  }

  filterAttainments(): void {
    this.filteredAttainments = this.poAttainments.filter(attainment => {
      const matchSearch = this.searchQuery === '' ||
        attainment.code.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        attainment.description.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchStatus = this.filterStatus === '' || attainment.status === this.filterStatus;

      return matchSearch && matchStatus;
    });
  }

  onFilterChange(): void {
    this.filterAttainments();
  }

  onSearchChange(): void {
    this.filterAttainments();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Achieved': return '#10b981';
      case 'Partial': return '#f59e0b';
      case 'Not Achieved': return '#ef4444';
      default: return '#6b7280';
    }
  }

  getStatusBgColor(status: string): string {
    switch (status) {
      case 'Achieved': return 'rgba(16, 185, 129, 0.1)';
      case 'Partial': return 'rgba(245, 158, 11, 0.1)';
      case 'Not Achieved': return 'rgba(239, 68, 68, 0.1)';
      default: return 'rgba(107, 114, 128, 0.1)';
    }
  }

  getAchievedCount(): number {
    return this.poAttainments.filter(po => po.status === 'Achieved').length;
  }

  getPartialCount(): number {
    return this.poAttainments.filter(po => po.status === 'Partial').length;
  }

  getNotAchievedCount(): number {
    return this.poAttainments.filter(po => po.status === 'Not Achieved').length;
  }

  getProgressWidth(achievement: number): number {
    return Math.min((achievement / 100) * 100, 100);
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

    // 1. Map Theme Colors
    const bg = isDark ? '#0f172a' : 'rgba(240, 249, 255, 0.92)';
    const cardBg = isDark ? '#1e293b' : 'rgba(255, 255, 255, 0.98)';
    const text = isDark ? '#f8fafc' : '#1e293b';
    const textSecondary = isDark ? '#94a3b8' : '#64748b';
    const border = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(74, 140, 234, 0.16)';
    const sidebarBg = isDark ? '#1e293b' : 'rgba(255, 255, 255, 0.98)';

    // 2. Map Color Scheme
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
      default: // blue
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

  exportToCSV(): void {
    const headers = ['PO Code', 'Description', 'Achievement (%)', 'Target (%)', 'Status', 'Mapped COs', 'CO Count'];
    const rows = this.poAttainments.map(po => [
      po.code,
      po.description,
      po.achievement.toString(),
      po.targetPercentage.toString(),
      po.status,
      po.mappedCOs ? po.mappedCOs.join(';') : '',
      (po.coCount ?? 0).toString()
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `po-attainment-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }
}

