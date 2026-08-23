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
      filters: ['Course', 'Assessment Type', 'Date Range']
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

  departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical'];
  semesters = Array.from({ length: 8 }, (_, i) => `Semester ${i + 1}`);
  courses: any[] = [];
  assessmentTypes = ['Assignment', 'Quiz', 'Midterm', 'Practical', 'Project', 'Lab', 'Exam'];

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
          case 'student-report':
            count = JSON.parse(localStorage.getItem('obslmsStudents') || '[]').length;
            break;
          case 'course-report':
            count = JSON.parse(localStorage.getItem('obslmsCourses') || '[]').length;
            break;
          case 'co-report':
            count = JSON.parse(localStorage.getItem('obslmsCourseOutcomes') || '[]').length;
            break;
          case 'po-report':
            count = JSON.parse(localStorage.getItem('obslmsProgramOutcomes') || '[]').length;
            break;
          case 'assessment-report':
            count = JSON.parse(localStorage.getItem('obslmsAssessments') || '[]').length;
            break;
          case 'faculty-report':
            count = JSON.parse(localStorage.getItem('obslmsFaculty') || '[]').length;
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

  private generateStudentReport(): any[] {
    try {
      const students = JSON.parse(localStorage.getItem('obslmsStudents') || '[]');
      const marks = JSON.parse(localStorage.getItem('obslmsMarkEntries') || '[]');

      return students.map((student: any) => {
        const studentMarks = marks.filter((m: any) => m.student === student.name);
        const avgMarks = studentMarks.length > 0
          ? studentMarks.reduce((sum: number, m: any) => sum + (m.obtained / m.maxMarks * 100), 0) / studentMarks.length
          : 0;

        return {
          regNo: student.regNo,
          name: student.name,
          department: student.department,
          semester: student.semester,
          email: student.email,
          avgPerformance: Math.round(avgMarks),
          assessmentCount: studentMarks.length,
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
      const courseSubjects = JSON.parse(localStorage.getItem('obslmsCourseSubjects') || '[]');
      const assessments = JSON.parse(localStorage.getItem('obslmsAssessments') || '[]');

      return courses.map((course: any) => {
        const subjects = courseSubjects.filter((cs: any) => cs.courseId === course.id);
        const courseAssessments = assessments.filter((a: any) => a.course === (course.title || course.name));

        return {
          courseId: course.id,
          courseName: course.title || course.name,
          code: course.code,
          credits: course.credits || 0,
          subjectCount: subjects.length,
          assessmentCount: courseAssessments.length,
          status: 'Active'
        };
      });
    } catch {
      return [];
    }
  }

  private generateCOReport(): any[] {
    try {
      const cos = JSON.parse(localStorage.getItem('obslmsCourseOutcomes') || '[]');
      const mappings = JSON.parse(localStorage.getItem('obslmsAssessmentCOMappings') || '[]');
      const marks = JSON.parse(localStorage.getItem('obslmsMarkEntries') || '[]');

      return cos.map((co: any) => {
        const coMappings = mappings.filter((m: any) => m.courseOutcomes.includes(co.code));
        let totalScore = 0;
        let scoreCount = 0;

        coMappings.forEach((mapping: any) => {
          const assessmentMarks = marks.filter((m: any) =>
            m.assessment.toLowerCase().includes(mapping.assessmentName.toLowerCase())
          );
          assessmentMarks.forEach((mark: any) => {
            const percentage = (mark.obtained / mark.maxMarks) * 100;
            totalScore += percentage;
            scoreCount++;
          });
        });

        const avgScore = scoreCount > 0 ? totalScore / scoreCount : 0;

        return {
          coCode: co.code,
          description: co.description,
          achievement: Math.round(avgScore),
          targetPercentage: 75,
          status: avgScore >= 75 ? 'Achieved' : avgScore >= 50 ? 'Partial' : 'Not Achieved',
          assessmentCount: coMappings.length,
          studentCount: new Set(marks.map((m: any) => m.student)).size
        };
      });
    } catch {
      return [];
    }
  }

  private generatePOReport(): any[] {
    try {
      const pos = JSON.parse(localStorage.getItem('obslmsProgramOutcomes') || '[]');
      const mappings = JSON.parse(localStorage.getItem('obslmsCOPOMappings') || '[]');
      const cos = JSON.parse(localStorage.getItem('obslmsCourseOutcomes') || '[]');
      const assessmentMappings = JSON.parse(localStorage.getItem('obslmsAssessmentCOMappings') || '[]');
      const marks = JSON.parse(localStorage.getItem('obslmsMarkEntries') || '[]');

      return pos.map((po: any) => {
        const poMappings = mappings.filter((m: any) => m.poCode === po.code);
        let totalScore = 0;
        let scoreCount = 0;

        poMappings.forEach((mapping: any) => {
          const coAssessments = assessmentMappings.filter((am: any) =>
            am.courseOutcomes.includes(mapping.coCode)
          );
          coAssessments.forEach((assessment: any) => {
            const assessmentMarks = marks.filter((m: any) =>
              m.assessment.toLowerCase().includes(assessment.assessmentName.toLowerCase())
            );
            assessmentMarks.forEach((mark: any) => {
              const percentage = (mark.obtained / mark.maxMarks) * 100;
              totalScore += percentage;
              scoreCount++;
            });
          });
        });

        const avgScore = scoreCount > 0 ? totalScore / scoreCount : 0;

        return {
          poCode: po.code,
          description: po.description,
          achievement: Math.round(avgScore),
          targetPercentage: 75,
          status: avgScore >= 75 ? 'Achieved' : avgScore >= 50 ? 'Partial' : 'Not Achieved',
          mappedCOCount: poMappings.length
        };
      });
    } catch {
      return [];
    }
  }

  private generateAssessmentReport(): any[] {
    try {
      const assessments = JSON.parse(localStorage.getItem('obslmsAssessments') || '[]');
      const marks = JSON.parse(localStorage.getItem('obslmsMarkEntries') || '[]');

      return assessments.map((assessment: any) => {
        const assessmentMarks = marks.filter((m: any) =>
          m.assessment.toLowerCase().includes(assessment.name?.toLowerCase())
        );

        const scores = assessmentMarks.map((m: any) => (m.obtained / m.maxMarks) * 100);
        const avgScore = scores.length > 0
          ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length
          : 0;

        return {
          assessmentId: assessment.id,
          assessmentName: assessment.name,
          type: assessment.type,
          course: assessment.course,
          maxMarks: assessment.maxMarks,
          studentCount: assessmentMarks.length,
          avgScore: Math.round(avgScore),
          minScore: scores.length > 0 ? Math.round(Math.min(...scores)) : 0,
          maxScore: scores.length > 0 ? Math.round(Math.max(...scores)) : 0
        };
      });
    } catch {
      return [];
    }
  }

  private generateFacultyReport(): any[] {
    try {
      const faculty = JSON.parse(localStorage.getItem('obslmsFaculty') || '[]');
      const allocations = JSON.parse(localStorage.getItem('obslmsFacultyAllocations') || '[]');

      return faculty.map((fac: any) => {
        const facultyAllocations = allocations.filter((a: any) => a.facultyId === fac.id);
        const courseSet = new Set(facultyAllocations.map((a: any) => a.courseName));

        return {
          facultyId: fac.id,
          name: fac.name,
          email: fac.email,
          department: fac.department,
          designation: fac.designation,
          courseCount: courseSet.size,
          allocationCount: facultyAllocations.length,
          status: 'Active'
        };
      });
    } catch {
      return [];
    }
  }

  exportToCSV(): void {
    if (this.reportData.length === 0) return;

    const report = this.reportTypes.find(r => r.id === this.selectedReportId);
    const headers = Object.keys(this.reportData[0]);
    const rows = this.reportData.map(item => headers.map(h => item[h]));

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report?.id}-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  exportToJSON(): void {
    if (this.reportData.length === 0) return;

    const report = this.reportTypes.find(r => r.id === this.selectedReportId);
    const json = JSON.stringify(this.reportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report?.id}-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  }

  exportToPDF(): void {
    if (this.reportData.length === 0) return;

    const report = this.reportTypes.find(r => r.id === this.selectedReportId);
    const headers = Object.keys(this.reportData[0]);
    
    let htmlContent = `
      <html>
        <head>
          <title>${report?.title || 'Report'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2c3e50; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
            th { background-color: #3b82f6; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f8f9fa; }
            .footer { margin-top: 30px; text-align: center; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>${report?.title || 'Report'}</h1>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Total Records:</strong> ${this.reportData.length}</p>
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
          <div class="footer">
            <p>Generated by Outcome-Based LMS | ${new Date().getFullYear()}</p>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report?.id}-report-${new Date().toISOString().split('T')[0]}.html`;
    link.click();
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
      case 'Program': return ['B.Tech CSE', 'B.Tech ECE', 'B.Tech ME'];
      case 'Faculty': return [];
      case 'CO Code': return [];
      case 'PO Code': return [];
      case 'Date Range': return [];
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


