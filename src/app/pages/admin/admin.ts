import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { ToastService } from '../../shared/services/toast.service';

export interface DeptStats {
  name: string;
  studentCount: number;
  facultyCount: number;
}

export interface ActivityItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  time: string;
  type: 'success' | 'info' | 'warning' | 'alert';
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, Navbar, Sidebar, Footer, RouterModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css'],
})
export class Admin {
  private toast = inject(ToastService);

  counts = {
    faculty: 0,
    students: 0,
    courses: 0,
    subjects: 0,
    assessments: 0,
    pendingApprovals: 0,
    copoMappings: 0,
    approvedMappings: 0,
    openGrievances: 0,
    programOutcomes: 0,
    courseOutcomes: 0
  };

  // OBE Accreditation Compliance Indicators
  obeHealth = {
    curriculumMappingPct: 0,
    assessmentAlignmentPct: 0,
    accreditationReadinessPct: 0,
    complianceStatus: 'Initial Setup'
  };

  departmentStats: DeptStats[] = [];
  recentActivities: ActivityItem[] = [];

  constructor() {
    this.loadAdminData();
  }

  private loadAdminData(): void {
    try {
      this.counts.faculty = this.safeLoadCount('obslmsFaculty');
      this.counts.students = this.safeLoadCount('obslmsStudents');
      this.counts.courses = this.safeLoadCount('obslmsCourses');
      this.counts.subjects = this.safeLoadCount('obslmsSubjects');
      this.counts.assessments = this.safeLoadCount('obslmsAssessments');
      this.counts.programOutcomes = this.safeLoadCount('obslmsProgramOutcomes');
      this.counts.courseOutcomes = this.safeLoadCount('obslmsCourseOutcomes');

      const copoMappings = this.safeLoadArray('obslmsCoMappings');
      this.counts.copoMappings = copoMappings.length;
      this.counts.approvedMappings = copoMappings.filter((m: any) => m.status === 'Approved').length;

      const assessmentMappings = this.safeLoadArray('obslmsAssessmentCOMappings');
      const pendingAssessments = assessmentMappings.filter((m: any) => m.approvalStatus === 'Pending' || !m.approvalStatus).length;
      const pendingCopo = copoMappings.filter((m: any) => m.status === 'Pending').length;
      this.counts.pendingApprovals = pendingAssessments + pendingCopo;

      const grievances = this.safeLoadArray('obslmsGrievances');
      this.counts.openGrievances = grievances.filter((g: any) => g.status === 'Open' || g.status === 'In Review').length;

      // 1. Calculate OBE Accreditation Metrics
      const mappingPct = this.counts.courseOutcomes > 0
        ? Math.min(100, Math.round((this.counts.approvedMappings / this.counts.courseOutcomes) * 100))
        : 0;
      const alignPct = this.counts.assessments > 0
        ? Math.min(100, Math.round((assessmentMappings.length / this.counts.assessments) * 100))
        : 0;
      
      const overallReadiness = (this.counts.courseOutcomes > 0 || this.counts.assessments > 0)
        ? Math.round((mappingPct * 0.6) + (alignPct * 0.4))
        : 0;

      let status = 'Setup In Progress';
      if (this.counts.courseOutcomes === 0 && this.counts.assessments === 0 && this.counts.students === 0) {
        status = 'Awaiting Curriculum Data';
      } else if (overallReadiness >= 75) {
        status = 'Accreditation Ready (NBA Compliant)';
      } else if (overallReadiness >= 40) {
        status = 'On Track (Mappings in Progress)';
      } else if (this.counts.pendingApprovals > 0) {
        status = 'Action Required: Pending Approvals';
      }

      this.obeHealth = {
        curriculumMappingPct: mappingPct,
        assessmentAlignmentPct: alignPct,
        accreditationReadinessPct: overallReadiness,
        complianceStatus: status
      };

      // 2. Compute Departmental Distribution Dynamically from Real Records
      const students = this.safeLoadArray('obslmsStudents');
      const faculty = this.safeLoadArray('obslmsFaculty');
      const deptMap = new Map<string, { studentCount: number; facultyCount: number }>();

      students.forEach((s: any) => {
        if (s.department && s.department.trim()) {
          const dept = s.department.trim();
          const existing = deptMap.get(dept) || { studentCount: 0, facultyCount: 0 };
          existing.studentCount++;
          deptMap.set(dept, existing);
        }
      });

      faculty.forEach((f: any) => {
        if (f.department && f.department.trim()) {
          const dept = f.department.trim();
          const existing = deptMap.get(dept) || { studentCount: 0, facultyCount: 0 };
          existing.facultyCount++;
          deptMap.set(dept, existing);
        }
      });

      this.departmentStats = Array.from(deptMap.entries()).map(([name, stat]) => ({
        name,
        studentCount: stat.studentCount,
        facultyCount: stat.facultyCount
      }));

      // 3. Build Real System Activity Log
      const notifs = this.safeLoadArray('obslmsNotifications');
      if (notifs && notifs.length > 0) {
        this.recentActivities = notifs.slice(0, 5).map((n: any) => ({
          id: (n.id || Math.random()).toString(),
          icon: n.type === 'success' ? '✅' : n.type === 'warning' ? '⚠️' : n.type === 'error' ? '❌' : 'ℹ️',
          title: n.title || 'System Event',
          description: n.message || '',
          time: n.timestamp ? new Date(n.timestamp).toLocaleDateString() : 'Recent',
          type: n.type || 'info'
        }));
      } else {
        this.recentActivities = [];
      }

    } catch (e) {
      console.error('Error loading admin dashboard data:', e);
    }
  }

  exportInstitutionAuditCsv(): void {
    const studentToFacultyRatio = this.counts.faculty > 0
      ? `${(this.counts.students / this.counts.faculty).toFixed(1)}:1`
      : 'N/A';

    const headers = ['Metric', 'Value', 'Status / Detail'];
    const rows = [
      ['Institution Compliance Status', `"${this.obeHealth.complianceStatus}"`, 'OBE / NBA Assessment'],
      ['Accreditation Readiness Index', `"${this.obeHealth.accreditationReadinessPct}%"`, 'Target Threshold >= 75%'],
      ['Total Enrolled Students', `"${this.counts.students}"`, 'Registered across departments'],
      ['Total Faculty Members', `"${this.counts.faculty}"`, `Student-to-Faculty Ratio: ${studentToFacultyRatio}`],
      ['Curriculum Courses Defined', `"${this.counts.courses}"`, `${this.counts.subjects} total subjects`],
      ['Course Outcomes (CO) Created', `"${this.counts.courseOutcomes}"`, 'Defined learning goals'],
      ['Program Outcomes (PO) Defined', `"${this.counts.programOutcomes}"`, 'Institutional graduate attributes'],
      ['Approved CO-PO Mappings', `"${this.counts.approvedMappings} of ${this.counts.copoMappings}"`, `${this.obeHealth.curriculumMappingPct}% outcome coverage`],
      ['Pending Approvals Queue', `"${this.counts.pendingApprovals}"`, 'Requires Admin Sign-off'],
      ['Open Student Grievances', `"${this.counts.openGrievances}"`, 'Academic & attendance issues']
    ];

    rows.push(['\n--- Department Breakdown ---', '', '']);
    rows.push(['Department Name', 'Students', 'Faculty']);
    this.departmentStats.forEach(d => {
      rows.push([`"${d.name}"`, `"${d.studentCount}"`, `"${d.facultyCount}"`]);
    });

    const csvContent = headers.join(',') + '\n' + rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Institution_OBE_Accreditation_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toast.success('Institution Accreditation Summary CSV exported successfully.');
  }

  private safeLoadCount(key: string): number {
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as any[]).length : 0;
    } catch {
      return 0;
    }
  }

  private safeLoadArray(key: string): any[] {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}




