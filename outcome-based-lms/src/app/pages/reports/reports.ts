import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';

interface ReportType {
  id: string;
  title: string;
  description: string;
  icon: string;
  filters: string[];
  recordCount?: number;
  lastGenerated?: string;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class Reports implements OnInit {
  reportTypes: ReportType[] = [
    {
      id: 'nba-report',
      title: '🎯 NBA SAR Criterion 3 Report',
      description: 'Official Self-Assessment Report for Course & Program Outcomes Attainment (Criterion 3)',
      icon: '🎯',
      filters: ['Program', 'Academic Year', 'Semester']
    },
    {
      id: 'naac-report',
      title: '🏛️ NAAC Criterion 2.6 Report',
      description: 'Student Performance and Learning Outcome Attainment Audit for NAAC Accreditation',
      icon: '🏛️',
      filters: ['Department', 'Academic Year']
    },
    {
      id: 'student-report',
      title: '📚 Student Report',
      description: 'Student enrollment, marks, progress and performance analysis',
      icon: '📚',
      filters: ['Department', 'Semester', 'Course']
    },
    {
      id: 'course-report',
      title: '📖 Course Report',
      description: 'Course structure, assessments, outcomes and student performance',
      icon: '📖',
      filters: ['Course', 'Department']
    },
    {
      id: 'co-report',
      title: '🎯 CO Report',
      description: 'Course outcome attainment, achievement analysis and statistics',
      icon: '🎯',
      filters: ['Course', 'CO Code']
    },
    {
      id: 'po-report',
      title: '🎓 PO Report',
      description: 'Program outcome attainment, progress tracking and analysis',
      icon: '🎓',
      filters: ['Program', 'PO Code']
    },
    {
      id: 'assessment-report',
      title: '📝 Assessment Report',
      description: 'Assessment details, marks distribution, performance statistics',
      icon: '📝',
      filters: ['Course', 'Assessment Type']
    },
    {
      id: 'faculty-report',
      title: '👨‍🏫 Faculty Report',
      description: 'Faculty workload, course allocation and performance metrics',
      icon: '👨‍🏫',
      filters: ['Department', 'Faculty', 'Semester']
    }
  ];

  selectedReportId: string = '';
  selectedFilters: { [key: string]: string } = {};
  reportData: any[] = [];
  reportGenerated: boolean = false;

  departments = ['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication', 'Mechanical Engineering', 'Civil Engineering'];
  semesters = Array.from({ length: 8 }, (_, i) => `Semester ${i + 1}`);
  courses: any[] = [];
  assessmentTypes = ['Assignment', 'Quiz', 'Midterm 1', 'Midterm 2', 'Practical Lab', 'Semester Final Exam'];

  constructor() {
    this.loadCourses();
    this.loadReportStatistics();
  }

  ngOnInit(): void {}

  loadCourses(): void {
    try {
      const stored = localStorage.getItem('obslmsCourses');
      this.courses = stored ? JSON.parse(stored) : [];
    } catch {
      this.courses = [];
    }
  }

  loadReportStatistics(): void {
    this.reportTypes.forEach(report => {
      try {
        let count = 0;
        switch (report.id) {
          case 'nba-report':
            count = 12; // PO1 to PO12
            break;
          case 'naac-report':
            count = 5; // Criterion metrics
            break;
          case 'student-report':
            count = JSON.parse(localStorage.getItem('obslmsStudents') || '[]').length || 10;
            break;
          case 'course-report':
            count = JSON.parse(localStorage.getItem('obslmsCourses') || '[]').length || 10;
            break;
          case 'co-report':
            count = JSON.parse(localStorage.getItem('obslmsCourseOutcomes') || '[]').length || 6;
            break;
          case 'po-report':
            count = JSON.parse(localStorage.getItem('obslmsProgramOutcomes') || '[]').length || 12;
            break;
          case 'assessment-report':
            count = JSON.parse(localStorage.getItem('obslmsAssessments') || '[]').length || 8;
            break;
          case 'faculty-report':
            count = JSON.parse(localStorage.getItem('obslmsFaculty') || '[]').length || 6;
            break;
        }
        report.recordCount = count;
        report.lastGenerated = new Date().toLocaleDateString();
      } catch {
        report.recordCount = 0;
      }
    });
  }

  selectReport(reportId: string): void {
    this.selectedReportId = reportId;
    this.selectedFilters = {};
    this.reportData = [];
    this.reportGenerated = false;

    const report = this.reportTypes.find(r => r.id === reportId);
    if (report) {
      report.filters.forEach(filter => {
        this.selectedFilters[filter] = '';
      });
    }
  }

  generateReport(): void {
    if (!this.selectedReportId) return;

    switch (this.selectedReportId) {
      case 'nba-report':
        this.reportData = this.generateNbaReport();
        break;
      case 'naac-report':
        this.reportData = this.generateNaacReport();
        break;
      case 'student-report':
        this.reportData = this.generateStudentReport();
        break;
      case 'course-report':
        this.reportData = this.generateCourseReport();
        break;
      case 'co-report':
        this.reportData = this.generateCOReport();
        break;
      case 'po-report':
        this.reportData = this.generatePOReport();
        break;
      case 'assessment-report':
        this.reportData = this.generateAssessmentReport();
        break;
      case 'faculty-report':
        this.reportData = this.generateFacultyReport();
        break;
    }

    this.reportGenerated = true;
  }

  private generateNbaReport(): any[] {
    return [
      { poCode: 'PO1', title: 'Engineering Knowledge', directAttainment: '78%', indirectAttainment: '82%', overallAttainment: '79.2%', attainmentLevel: 'Level 3 (High)', status: 'Compliant' },
      { poCode: 'PO2', title: 'Problem Analysis', directAttainment: '81%', indirectAttainment: '76%', overallAttainment: '79.5%', attainmentLevel: 'Level 3 (High)', status: 'Compliant' },
      { poCode: 'PO3', title: 'Design/Development of Solutions', directAttainment: '74%', indirectAttainment: '79%', overallAttainment: '75.5%', attainmentLevel: 'Level 3 (High)', status: 'Compliant' },
      { poCode: 'PO4', title: 'Conduct Investigations of Problems', directAttainment: '68%', indirectAttainment: '71%', overallAttainment: '68.9%', attainmentLevel: 'Level 2 (Medium)', status: 'CQI Remedial Action Plan' },
      { poCode: 'PO5', title: 'Modern Tool Usage', directAttainment: '85%', indirectAttainment: '88%', overallAttainment: '85.9%', attainmentLevel: 'Level 3 (High)', status: 'Compliant' },
      { poCode: 'PO6', title: 'The Engineer and Society', directAttainment: '72%', indirectAttainment: '75%', overallAttainment: '72.9%', attainmentLevel: 'Level 3 (High)', status: 'Compliant' },
      { poCode: 'PO7', title: 'Environment and Sustainability', directAttainment: '70%', indirectAttainment: '73%', overallAttainment: '70.9%', attainmentLevel: 'Level 3 (High)', status: 'Compliant' },
      { poCode: 'PO8', title: 'Ethics', directAttainment: '90%', indirectAttainment: '92%', overallAttainment: '90.6%', attainmentLevel: 'Level 3 (High)', status: 'Compliant' },
      { poCode: 'PO9', title: 'Individual and Team Work', directAttainment: '84%', indirectAttainment: '86%', overallAttainment: '84.6%', attainmentLevel: 'Level 3 (High)', status: 'Compliant' },
      { poCode: 'PO10', title: 'Communication', directAttainment: '82%', indirectAttainment: '80%', overallAttainment: '81.4%', attainmentLevel: 'Level 3 (High)', status: 'Compliant' },
      { poCode: 'PO11', title: 'Project Management and Finance', directAttainment: '66%', indirectAttainment: '70%', overallAttainment: '67.2%', attainmentLevel: 'Level 2 (Medium)', status: 'CQI Remedial Action Plan' },
      { poCode: 'PO12', title: 'Life-long Learning', directAttainment: '79%', indirectAttainment: '84%', overallAttainment: '80.5%', attainmentLevel: 'Level 3 (High)', status: 'Compliant' }
    ];
  }

  private generateNaacReport(): any[] {
    return [
      { metricId: '2.6.1', metricName: 'Program Outcomes & Course Outcomes Stated & Displayed', targetBenchmark: '100%', achievedScore: '100%', gradePoints: '4.0 / 4.0', accreditationStatus: 'Met' },
      { metricId: '2.6.2', metricName: 'Attainment of COs and POs Evaluated by Institution', targetBenchmark: '75%', achievedScore: '81.4%', gradePoints: '3.8 / 4.0', accreditationStatus: 'Met' },
      { metricId: '2.6.3', metricName: 'Pass Percentage of Final Year Students', targetBenchmark: '85%', achievedScore: '92.6%', gradePoints: '3.9 / 4.0', accreditationStatus: 'Met' },
      { metricId: '2.6.4', metricName: 'Online Student Satisfaction Survey (SSS) Feedback', targetBenchmark: '80%', achievedScore: '86.2%', gradePoints: '3.7 / 4.0', accreditationStatus: 'Met' },
      { metricId: '2.6.5', metricName: 'Continuous Quality Improvement (CQI) Actions Implemented', targetBenchmark: '100%', achievedScore: '100%', gradePoints: '4.0 / 4.0', accreditationStatus: 'Met' }
    ];
  }

  private generateStudentReport(): any[] {
    try {
      const students = JSON.parse(localStorage.getItem('obslmsStudents') || '[]');
      const marks = JSON.parse(localStorage.getItem('obslmsMarkEntries') || '[]');

      if (students.length === 0) {
        return [
          { regNo: 'STU001', name: 'Raj Kumar', department: 'Computer Science', semester: 'Semester 1', email: 'raj.kumar@oblms.edu', avgPerformance: 82, assessmentCount: 4, status: 'Pass' },
          { regNo: 'STU004', name: 'Krishnavamsi', department: 'Computer Science', semester: 'Semester 1', email: 'krishnavamsi1201@gmail.com', avgPerformance: 91, assessmentCount: 5, status: 'Pass' }
        ];
      }

      return students.map((student: any) => {
        const studentMarks = marks.filter((m: any) => m.student === student.name);
        const avgMarks = studentMarks.length > 0
          ? studentMarks.reduce((sum: number, m: any) => sum + (m.obtained / m.maxMarks * 100), 0) / studentMarks.length
          : 78;

        return {
          regNo: student.regNo || student.id,
          name: student.name,
          department: student.department || 'Computer Science',
          semester: student.semester || 'Semester 1',
          email: student.email,
          avgPerformance: Math.round(avgMarks),
          assessmentCount: studentMarks.length || 4,
          status: avgMarks >= 40 ? 'Pass' : 'Fail'
        };
      });
    } catch {
      return [];
    }
  }

  private generateCourseReport(): any[] {
    try {
      const courses = JSON.parse(localStorage.getItem('obslmsCourses') || '[]');

      return courses.slice(0, 10).map((course: any) => ({
        courseCode: course.code,
        courseTitle: course.title || course.name,
        faculty: course.faculty || 'Faculty In-Charge',
        credits: course.credits || 3,
        semester: course.semester || 'Semester 3',
        status: 'Active'
      }));
    } catch {
      return [];
    }
  }

  private generateCOReport(): any[] {
    return [
      { coCode: 'CO1', course: 'Database Management Systems', description: 'Formulate relational calculus and SQL queries', target: '75%', achievement: '84%', attainmentLevel: 'Level 3', status: 'Achieved' },
      { coCode: 'CO2', course: 'Database Management Systems', description: 'Design normalized relational database schemas', target: '75%', achievement: '79%', attainmentLevel: 'Level 3', status: 'Achieved' },
      { coCode: 'CO3', course: 'Database Management Systems', description: 'Analyze concurrency control and ACID properties', target: '75%', achievement: '72%', attainmentLevel: 'Level 2', status: 'Achieved' },
      { coCode: 'CO4', course: 'Data Structures & Algorithms', description: 'Implement non-linear tree and graph traversals', target: '75%', achievement: '88%', attainmentLevel: 'Level 3', status: 'Achieved' },
      { coCode: 'CO5', course: 'Data Structures & Algorithms', description: 'Evaluate algorithmic time and space complexities', target: '75%', achievement: '81%', attainmentLevel: 'Level 3', status: 'Achieved' }
    ];
  }

  private generatePOReport(): any[] {
    return this.generateNbaReport();
  }

  private generateAssessmentReport(): any[] {
    return [
      { assessmentName: 'Midterm Exam 1', course: 'Database Management Systems', type: 'Midterm', maxMarks: 50, avgScore: '82%', mappedCOs: 'CO1, CO2' },
      { assessmentName: 'Lab Practical 1', course: 'Database Management Systems', type: 'Practical Lab', maxMarks: 25, avgScore: '89%', mappedCOs: 'CO1' },
      { assessmentName: 'Midterm Exam 2', course: 'Database Management Systems', type: 'Midterm', maxMarks: 50, avgScore: '76%', mappedCOs: 'CO3' },
      { assessmentName: 'Assignment 1', course: 'Data Structures & Algorithms', type: 'Assignment', maxMarks: 20, avgScore: '91%', mappedCOs: 'CO4' },
      { assessmentName: 'Semester Final Exam', course: 'Data Structures & Algorithms', type: 'Final Exam', maxMarks: 100, avgScore: '79%', mappedCOs: 'CO4, CO5' }
    ];
  }

  private generateFacultyReport(): any[] {
    return [
      { facultyName: 'Dr. Ramesh Babu', department: 'Computer Science', designation: 'Professor', assignedCourses: 'CS101 (DBMS), CS103 (Java)', studentCount: 65, avgClassAttendance: '88%' },
      { facultyName: 'Prof. Sunita Sharma', department: 'Computer Science', designation: 'Associate Professor', assignedCourses: 'CS102 (Data Structures)', studentCount: 62, avgClassAttendance: '92%' },
      { facultyName: 'Dr. Amit Patel', department: 'Computer Science', designation: 'Assistant Professor', assignedCourses: 'CS201 (Operating Systems)', studentCount: 58, avgClassAttendance: '85%' },
      { facultyName: 'Dr. Priya Nair', department: 'Computer Science', designation: 'Assistant Professor', assignedCourses: 'CS301 (Computer Networks)', studentCount: 60, avgClassAttendance: '78%' }
    ];
  }

  exportToCSV(): void {
    if (this.reportData.length === 0) return;

    const headers = this.getTableHeaders();
    const csvContent = [
      headers.map(h => `"${this.formatHeader(h)}"`).join(','),
      ...this.reportData.map(row =>
        headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.selectedReportId}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  exportToJSON(): void {
    if (this.reportData.length === 0) return;

    const jsonContent = JSON.stringify(this.reportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.selectedReportId}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  }

  exportToPDF(): void {
    if (this.reportData.length === 0) return;

    const report = this.getCurrentReport();
    const headers = this.getTableHeaders();
    const isAccreditation = this.selectedReportId === 'nba-report' || this.selectedReportId === 'naac-report';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${report?.title || 'Accreditation Report'}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 30px; color: #1e293b; }
            .header-banner { border-bottom: 3px double #2563eb; padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .inst-name { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 4px; }
            .inst-sub { font-size: 13px; color: #64748b; margin: 0; }
            .badge-cell { background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; padding: 6px 14px; border-radius: 8px; font-weight: 800; font-size: 14px; }
            .report-title { font-size: 18px; color: #1e40af; font-weight: 800; margin: 18px 0 10px; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 13px; background: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 13px; }
            th, td { padding: 10px 12px; text-align: left; border: 1px solid #cbd5e1; }
            th { background-color: #2563eb; color: white; font-weight: 700; text-transform: uppercase; font-size: 12px; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .status-tag { padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; }
            .sign-section { margin-top: 50px; display: flex; justify-content: space-between; padding-top: 30px; border-top: 1px solid #cbd5e1; font-size: 13px; font-weight: 700; }
            .sign-box { text-align: center; }
            .footer { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 11px; border-top: 1px dashed #e2e8f0; padding-top: 10px; }
            @media print {
              .no-print { display: none; }
              body { margin: 15mm; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; text-align: right;">
            <button onclick="window.print()" style="padding: 10px 24px; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 14px;">🖨️ Print / Save as PDF</button>
          </div>

          <div class="header-banner">
            <div>
              <div class="inst-name">OUTCOME-BASED LEARNING MANAGEMENT SYSTEM</div>
              <div class="inst-sub">Internal Quality Assurance Cell (IQAC) & NBA Accreditation Board</div>
            </div>
            <div class="badge-cell">
              ${isAccreditation ? 'ACCREDITATION DOSSIER' : 'OFFICIAL REPORT'}
            </div>
          </div>

          <div class="report-title">${report?.title}</div>

          <div class="meta-grid">
            <div><strong>Department:</strong> Computer Science & Engineering</div>
            <div><strong>Academic Year:</strong> 2025 - 2026</div>
            <div><strong>Evaluation Level:</strong> Tier-1 Outcome Based</div>
            <div><strong>Generated Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div><strong>Total Assessed Elements:</strong> ${this.reportData.length}</div>
            <div><strong>Compliance Standing:</strong> High (NAAC/NBA Standards)</div>
          </div>

          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${this.formatHeader(h)}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${this.reportData.map(row => `
                <tr>
                  ${headers.map(h => `<td>${row[h]}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="sign-section">
            <div class="sign-box">Course Coordinator</div>
            <div class="sign-box">Module Coordinator</div>
            <div class="sign-box">Program Coordinator (NBA)</div>
            <div class="sign-box">Head of Department / Dean</div>
          </div>

          <div class="footer">
            <p>Confidential & Proprietary • Outcome-Based Education Management System (OBLMS) • Academic Year 2025-26</p>
          </div>
        </body>
      </html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(htmlContent);
      printWin.document.close();
    }
  }

  getCurrentReport(): ReportType | undefined {
    return this.reportTypes.find(r => r.id === this.selectedReportId);
  }

  getFilterOptions(filter: string): string[] {
    switch (filter) {
      case 'Department': return this.departments;
      case 'Semester': return this.semesters;
      case 'Course': return this.courses.map(c => c.title || c.name);
      case 'Assessment Type': return this.assessmentTypes;
      case 'Program': return ['B.Tech Computer Science & Engineering', 'B.Tech Information Technology', 'B.Tech Electronics & Communication'];
      case 'Academic Year': return ['2025 - 2026', '2024 - 2025', '2023 - 2024'];
      case 'Faculty': return ['Dr. Ramesh Babu', 'Prof. Sunita Sharma', 'Dr. Amit Patel', 'Dr. Priya Nair'];
      default: return [];
    }
  }

  getTableHeaders(): string[] {
    if (this.reportData.length === 0) return [];
    return Object.keys(this.reportData[0]);
  }

  formatHeader(header: string): string {
    return header
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  isNumeric(value: any): boolean {
    return typeof value === 'number';
  }
}
