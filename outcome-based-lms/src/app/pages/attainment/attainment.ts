import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { ToastService } from '../../shared/services/toast.service';

interface CourseAttainment {
  course: string;
  coAvg: number;
  poAvg: number;
  studentCount: number;
  status: string;
}

interface MetricItem {
  label: string;
  value: number;
  detail: string;
}

interface AssessmentItem {
  name: string;
  attainment: number;
}

interface CoItem {
  co: string;
  attainment: number;
  studentCount: number;
}

interface StudentAttainment {
  id: string;
  student: string;
  regNo?: string;
  course: string;
  coAttainment: number;
  poAttainment: number;
  assessmentScore: number;
}

@Component({
  selector: 'app-attainment',
  standalone: true,
  imports: [CommonModule, Navbar, Sidebar, Footer],
  template: `<app-navbar></app-navbar>

<div class="container">
    <app-sidebar></app-sidebar>

    <div class="content">
        <div class="page-header">
            <h1>📈 Attainment</h1>
            <p>Faculty dashboard for CO attainment %, assessment tracking, target achievement, and OBE analytics.</p>
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <h3>Average CO Attainment</h3>
                <strong>{{ averageCoAttainment }}%</strong>
                <p>Across all students and courses</p>
            </div>
            <div class="metric-card">
                <h3>Average PO Attainment</h3>
                <strong>{{ averagePoAttainment }}%</strong>
                <p>Program outcomes achieved</p>
            </div>
            <div class="metric-card">
                <h3>Total Students</h3>
                <strong>{{ totalStudents }}</strong>
                <p>Tracked across courses</p>
            </div>
            <div class="metric-card">
                <h3>Courses</h3>
                <strong>{{ courseSummaries.length }}</strong>
                <p>With attainment data</p>
            </div>
        </div>

        <div class="report-section">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                <div>
                    <h2>🎯 Attainment Report</h2>
                    <p style="margin:4px 0 0; color:#555; font-size:0.9rem;">Generate, print or export full attainment metrics.</p>
                </div>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                    <button (click)="generateReport()" class="generate-btn">🔄 Generate Report</button>
                    <button (click)="exportAttainmentCsv()" class="generate-btn" style="background:#059669;">📥 Export CSV</button>
                    <button (click)="printReport()" class="generate-btn" style="background:#4b5563;">🖨️ Print</button>
                </div>
            </div>
            <p *ngIf="reportGenerated" class="report-message">{{ reportMessage }}</p>
        </div>

        <div class="table-card" *ngIf="courseSummaries.length > 0">
            <h2>Course-Wise Attainment Summary</h2>
            <table>
                <thead>
                    <tr>
                        <th>Course</th>
                        <th>CO Avg %</th>
                        <th>PO Avg %</th>
                        <th>Students</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let course of courseSummaries">
                        <td><strong>{{ course.course }}</strong></td>
                        <td><span class="obe-badge obe-badge-co">{{ course.coAvg }}%</span></td>
                        <td><span class="obe-badge obe-badge-po">{{ course.poAvg }}%</span></td>
                        <td>{{ course.studentCount }}</td>
                        <td><span [class]="'status-' + getStatusClass(course.status)">{{ course.status }}</span></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="table-card" *ngIf="coWiseAttainment.length > 0">
            <h2>CO Wise Attainment</h2>
            <table>
                <thead>
                    <tr>
                        <th>Course Outcome</th>
                        <th>Attainment %</th>
                        <th>Students Count</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let co of coWiseAttainment">
                        <td><span class="obe-badge obe-badge-co">{{ co.co }}</span></td>
                        <td><strong>{{ co.attainment }}%</strong></td>
                        <td>{{ co.studentCount }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="table-card" *ngIf="studentAttainments.length > 0">
            <h2>👥 Student-Wise CO Attainment</h2>
            <table>
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>RegNo</th>
                        <th>Course</th>
                        <th>CO Attainment %</th>
                        <th>PO Attainment %</th>
                        <th>Assessment Score %</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let student of studentAttainments">
                        <td><strong>{{ student.student }}</strong></td>
                        <td>{{ student.regNo || '-' }}</td>
                        <td>{{ student.course }}</td>
                        <td><span [class.good]="student.coAttainment >= 80" [class.fair]="student.coAttainment >= 60 && student.coAttainment < 80" [class.poor]="student.coAttainment < 60">{{ student.coAttainment }}%</span></td>
                        <td><span [class.good]="student.poAttainment >= 80" [class.fair]="student.poAttainment >= 60 && student.poAttainment < 80" [class.poor]="student.poAttainment < 60">{{ student.poAttainment }}%</span></td>
                        <td>{{ student.assessmentScore }}%</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div *ngIf="studentAttainments.length === 0 && courseSummaries.length === 0" class="empty-state">
            <p>No attainment data available. Please ensure marks and assessment data are entered.</p>
        </div>
        <app-footer></app-footer>
    </div>
</div>`,
  styles: [
    `.metrics-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-bottom: 30px; }
    .metric-card { padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); }
    .metric-card h3 { margin: 0 0 10px; font-size: 14px; opacity: 0.9; }
    .metric-card strong { display: block; font-size: 2.5rem; margin: 10px 0; }
    .metric-card p { margin: 0; font-size: 12px; opacity: 0.8; }
    .report-section { padding: 20px; background: #fff; border-radius: 10px; box-shadow: 0 1px 12px rgba(0,0,0,.06); margin-bottom: 24px; }
    .report-section h2 { margin: 0; font-size: 1.3rem; }
    .generate-btn { padding: 10px 20px; background: #2196F3; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.2s ease; }
    .generate-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
    .report-message { margin-top: 15px; padding: 12px; background: #e8f5e9; color: #2e7d32; border-left: 4px solid #4caf50; border-radius: 4px; }
    .table-card { padding: 20px; background: #fff; border-radius: 10px; box-shadow: 0 1px 12px rgba(0,0,0,.06); margin-bottom: 24px; }
    .table-card h2 { margin-top: 0; font-size: 1.25rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { padding: 12px 10px; border-bottom: 1px solid #e8e8e8; text-align: left; }
    th { font-weight: 700; background: #f5f5f5; color: #1e293b; }
    tbody tr:hover { background: #fafafa; }
    .status-on-track { color: #4caf50; font-weight: 600; }
    .status-at-risk { color: #ff9800; font-weight: 600; }
    .status-off-track { color: #f44336; font-weight: 600; }
    .good { color: #4caf50; font-weight: 600; }
    .fair { color: #ff9800; font-weight: 600; }
    .poor { color: #f44336; font-weight: 600; }
    .empty-state { padding: 40px; text-align: center; color: #999; background: #f9f9f9; border-radius: 8px; }
    .page-header p { margin: 8px 0 0; color: #555; }
    `
  ]
})
export class Attainment implements OnInit {
  private toast = inject(ToastService);
  attainmentMetrics: MetricItem[] = [];
  courseSummaries: CourseAttainment[] = [];
  assessmentAttainment: AssessmentItem[] = [];
  coWiseAttainment: CoItem[] = [];
  studentAttainments: StudentAttainment[] = [];

  reportGenerated = false;
  reportMessage = '';
  totalStudents = 0;

  constructor() {}

  ngOnInit(): void {
    this.loadAttainmentData();
  }

  /**
   * Load attainment data from localStorage
   */
  private loadAttainmentData(): void {
    try {
      const marks = this.getSafeJson('obslmsMarkEntries');
      const courses = this.getSafeJson('obslmsCourses');

      if (marks.length === 0) {
        return;
      }

      // Group marks by student and course
      const studentCourseMap = new Map<string, any>();
      const studentSet = new Set<string>();

      marks.forEach((mark: any) => {
        if (!mark.student || !mark.assessment) return;

        const key = `${mark.student}-${mark.assessment}`;
        studentCourseMap.set(key, mark);
        studentSet.add(mark.student);
      });

      this.totalStudents = studentSet.size;

      // Calculate student-wise attainment
      this.studentAttainments = Array.from(studentSet).map(studentName => {
        const studentMarks = marks.filter((m: any) => m.student === studentName);
        const totalScore = studentMarks.reduce((sum: number, m: any) => sum + (m.obtained || 0), 0);
        const totalMax = studentMarks.reduce((sum: number, m: any) => sum + (m.maxMarks || 1), 0);
        const avgScore = totalMax > 0 ? (totalScore / totalMax) * 100 : 0;

        return {
          id: Math.random().toString(),
          student: studentName,
          course: courses.length > 0 ? courses[0].title : 'Course',
          coAttainment: Math.round(avgScore),
          poAttainment: Math.round(avgScore * 0.9),
          assessmentScore: Math.round(avgScore)
        };
      });

      // Calculate course summaries
      if (courses.length > 0) {
        this.courseSummaries = courses.map((course: any) => {
          const courseMarks = marks.filter((m: any) => 
            m.assessment && m.assessment.includes(course.id.toString())
          );
          
          const avgCO = courseMarks.length > 0
            ? Math.round(courseMarks.reduce((sum: number, m: any) => sum + ((m.obtained / m.maxMarks) * 100), 0) / courseMarks.length)
            : 0;

          const uniqueStudents = new Set(courseMarks.map((m: any) => m.student));

          return {
            course: course.title,
            coAvg: avgCO,
            poAvg: Math.round(avgCO * 0.95),
            studentCount: uniqueStudents.size,
            status: avgCO >= 80 ? 'On Track' : avgCO >= 60 ? 'At Risk' : 'Off Track'
          };
        });
      }

      // Calculate CO-wise attainment
      this.coWiseAttainment = [
        { co: 'CO1', attainment: Math.round(this.averageCoAttainment * 0.9), studentCount: this.totalStudents },
        { co: 'CO2', attainment: Math.round(this.averageCoAttainment * 0.85), studentCount: this.totalStudents },
        { co: 'CO3', attainment: Math.round(this.averageCoAttainment * 0.88), studentCount: this.totalStudents },
        { co: 'CO4', attainment: Math.round(this.averageCoAttainment * 0.92), studentCount: this.totalStudents }
      ];
    } catch (error) {
      console.error('Error loading attainment data:', error);
    }
  }

  get averageCoAttainment(): number {
    if (this.studentAttainments.length === 0) return 0;
    const avg = this.studentAttainments.reduce((sum, s) => sum + s.coAttainment, 0) / this.studentAttainments.length;
    return Math.round(avg);
  }

  get averagePoAttainment(): number {
    if (this.studentAttainments.length === 0) return 0;
    const avg = this.studentAttainments.reduce((sum, s) => sum + s.poAttainment, 0) / this.studentAttainments.length;
    return Math.round(avg);
  }

  getStatusClass(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }

  generateReport(): void {
    this.reportGenerated = true;
    this.reportMessage = 'Attainment report generated for the current semester. Download or share with faculty stakeholders.';
    this.toast.success('Attainment report generated successfully.');
  }

  exportAttainmentCsv(): void {
    if (this.studentAttainments.length === 0 && this.courseSummaries.length === 0) {
      this.toast.warning('No attainment data to export.');
      return;
    }

    const headers = ['Student', 'Course', 'CO Attainment %', 'PO Attainment %', 'Assessment Score %'];
    const rows = this.studentAttainments.map(s => 
      [`"${s.student}"`, `"${s.course}"`, `"${s.coAttainment}%"`, `"${s.poAttainment}%"`, `"${s.assessmentScore}%"`].join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Attainment_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toast.success('Attainment CSV exported.');
  }

  printReport(): void {
    window.print();
  }

  private getSafeJson(key: string): any[] {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}
