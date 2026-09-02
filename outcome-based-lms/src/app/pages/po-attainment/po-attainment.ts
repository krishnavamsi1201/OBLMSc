import { Component, OnInit, inject } from '@angular/core';
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

  constructor(private http: HttpClient) {
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
    this.calculatePOAttainment();
  }

  ngOnInit(): void {
    this.filterAttainments();
  }

  calculatePOAttainment(): void {
    const facultyParam = (this.role === 'faculty' && this.studentName) ? `&faculty=${encodeURIComponent(this.studentName)}` : '';
    this.http.get<POAttainment[]>(`http://localhost:8080/api/obe/po-attainment?target=${this.targetPercentage}${facultyParam}`).subscribe({
      next: (data) => {
        this.poAttainments = data;
        if (data.length > 0) {
          this.overallAchievement = Math.round(
            data.reduce((sum, po) => sum + po.achievement, 0) / data.length
          );
          this.overallDirectScore = Math.round(
            data.reduce((sum, po) => sum + (po.directScore || po.achievement), 0) / data.length
          );
          this.overallIndirectScore = Math.round(
            data.reduce((sum, po) => sum + (po.indirectScore || 80), 0) / data.length
          );
        }
        this.computeRadarChart();
        this.filterAttainments();
      },
      error: () => {
        this.poAttainments = [];
        this.computeRadarChart();
        this.filterAttainments();
      }
    });
  }

  computeRadarChart(): void {
    const list = this.poAttainments && this.poAttainments.length > 0 ? this.poAttainments : [];
    const count = Math.max(list.length, 12);
    const cx = 220;
    const cy = 220;
    const maxRadius = 150;

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

      // Label positions slightly further out
      const labelX = cx + (maxRadius + 22) * Math.cos(angle);
      const labelY = cy + (maxRadius + 18) * Math.sin(angle);
      const textAnchor = Math.abs(Math.cos(angle)) < 0.1 ? 'middle' : (Math.cos(angle) > 0 ? 'start' : 'end');

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
      po.mappedCOs.join(';'),
      po.coCount.toString()
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

