import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Navbar } from '../../../shared/navbar/navbar';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { Footer } from '../../../shared/footer/footer';
import { ToastService } from '../../../shared/services/toast.service';
import { SyncService } from '../../../shared/services/sync.service';
import { NavigationService } from '../../../shared/services/navigation.service';

export interface ApprovalItem {
  id: string;
  type: string; // 'assessment-co-mapping', 'copo-mapping', 'course-enrollment', 'course-subject-assignment', 'faculty-allocation'
  title: string;
  description: string;
  createdBy: string;
  requesterId?: string;
  requesterRole?: 'Student' | 'Faculty' | 'Admin';
  requesterEmail?: string;
  department?: string;
  createdDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  details: any;
}

@Component({
  selector: 'app-approval-management',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  templateUrl: './approval-management.html',
  styleUrls: ['./approval-management.css']
})
export class ApprovalManagement implements OnInit {
  private toast = inject(ToastService);
  private syncService = inject(SyncService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private navService = inject(NavigationService);

  goBack(): void {
    if (this.showRejectReason) {
      this.showRejectReason = false;
      return;
    }
    if (this.selectedApprovalId) {
      this.selectedApprovalId = '';
      return;
    }
    this.navService.goBack();
  }

  approvalItems: ApprovalItem[] = [];
  filteredItems: ApprovalItem[] = [];
  
  // Tab-based Card Filtering (defaults to Pending)
  activeTab: 'Pending' | 'Approved' | 'Rejected' | 'All' = 'Pending';
  filterStatus: string = 'Pending';
  filterType: string = '';
  searchQuery: string = '';

  approvalTypes = [
    { value: '', label: 'All Categories' },
    { value: 'course-enrollment', label: '🎓 Student Course Enrollments' },
    { value: 'assessment-co-mapping', label: '🎯 Assessment-CO Mappings' },
    { value: 'copo-mapping', label: '📐 CO-PO Curriculum Mappings' },
    { value: 'course-subject-assignment', label: '📚 Course-Subject Assignments' },
    { value: 'faculty-allocation', label: '👨‍🏫 Faculty Allocations' }
  ];

  selectedApprovalId: string = '';
  showRejectReason: boolean = false;
  rejectionReasonText: string = '';

  constructor() {
    this.loadApprovalItems();
  }

  ngOnInit(): void {
    this.loadApprovalItems();
    this.syncService.events$.subscribe(e => {
      if (e.type === 'ENROLLMENTS_CHANGED' || e.type === 'ASSESSMENTS_CHANGED') {
        this.loadApprovalItems();
      }
    });
  }

  selectTab(tab: 'Pending' | 'Approved' | 'Rejected' | 'All'): void {
    this.activeTab = tab;
    this.filterStatus = tab === 'All' ? '' : tab;
    this.filterApprovals();
  }

  loadApprovalItems(): void {
    this.http.get<any[]>('http://localhost:8080/api/courses/requests').subscribe({
      next: (courseRequests) => {
        this.buildApprovalList(courseRequests || []);
      },
      error: () => {
        let courseRequests: any[] = [];
        try {
          courseRequests = JSON.parse(localStorage.getItem('obslmsCourseRequests') || '[]');
        } catch {}
        this.buildApprovalList(courseRequests);
      }
    });
  }

  private buildApprovalList(courseRequests: any[]): void {
    try {
      const items: ApprovalItem[] = [];

      // 1. Student Course Enrollment Requests
      courseRequests.forEach((req: any) => {
        const sName = req.studentName || req.student || 'Student';
        const sId = req.studentId || req.regNo || '';
        const sEmail = req.studentEmail || '';
        const sDept = req.department || 'Computer Science & Engineering';
        const cTitle = req.courseTitle || req.courseName || req.courseCode || req.course || 'Course';
        const cCode = req.courseCode || req.course || '';

        items.push({
          id: (req.id || Math.random()).toString(),
          type: 'course-enrollment',
          title: `Enrollment: ${sName} → ${cTitle}`,
          description: `Student ${sName} (${sId}) requested formal enrollment for course ${cTitle} ${cCode ? '[' + cCode + ']' : ''}.`,
          createdBy: sName,
          requesterId: sId,
          requesterRole: 'Student',
          requesterEmail: sEmail,
          department: sDept,
          createdDate: req.requestedAt ? req.requestedAt.split('T')[0] : new Date().toISOString().split('T')[0],
          status: req.status || 'Pending',
          details: req
        });
      });

      // 2. Assessment-CO Mappings (Faculty Proposals)
      let rawAssessmentMappings: any[] = [];
      try {
        rawAssessmentMappings = JSON.parse(localStorage.getItem('obslmsAssessmentCOMappings') || '[]');
      } catch {}

      if (!Array.isArray(rawAssessmentMappings) || rawAssessmentMappings.length === 0) {
        rawAssessmentMappings = [
          { id: '1', assessmentName: 'CS101 - Midterm 1', assessmentType: 'Midterm', courseName: 'Database Management Systems', courseOutcomes: ['CO1', 'CO2'], approvalStatus: 'Pending', facultyName: 'Dr. Ramesh Babu', facultyId: 'FAC001', department: 'Computer Science & Engineering', email: 'Loukika310306@gmail.com' },
          { id: '2', assessmentName: 'CS102 - Practical Lab Exam', assessmentType: 'Practical', courseName: 'Data Structures & Algorithms', courseOutcomes: ['CO1'], approvalStatus: 'Pending', facultyName: 'Prof. Sunita Sharma', facultyId: 'FAC002', department: 'Computer Science & Engineering', email: 'sunita.sharma@oblms.edu' },
          { id: '3', assessmentName: 'CS103 - Quiz 1', assessmentType: 'Quiz', courseName: 'Object-Oriented Programming with Java', courseOutcomes: ['CO1', 'CO2'], approvalStatus: 'Pending', facultyName: 'Dr. Ramesh Babu', facultyId: 'FAC001', department: 'Computer Science & Engineering', email: 'Loukika310306@gmail.com' },
          { id: '4', assessmentName: 'CS201 - Assignment 1', assessmentType: 'Assignment', courseName: 'Operating Systems & Kernel Architecture', courseOutcomes: ['CO1', 'CO2', 'CO3'], approvalStatus: 'Pending', facultyName: 'Dr. Amit Patel', facultyId: 'FAC003', department: 'Computer Science & Engineering', email: 'amit.patel@oblms.edu' },
          { id: '5', assessmentName: 'CS301 - Practical Exam', assessmentType: 'Practical', courseName: 'Computer Networks & Protocols', courseOutcomes: ['CO1'], approvalStatus: 'Pending', facultyName: 'Dr. Priya Nair', facultyId: 'FAC004', department: 'Computer Science & Engineering', email: 'priya.nair@oblms.edu' }
        ];
        try {
          localStorage.setItem('obslmsAssessmentCOMappings', JSON.stringify(rawAssessmentMappings));
        } catch {}
      }

      // Faculty mapping helper lookup
      const facultyMap: { [course: string]: { name: string; id: string; email: string; dept: string } } = {
        'Database Management Systems': { name: 'Dr. Ramesh Babu', id: 'FAC001', email: 'Loukika310306@gmail.com', dept: 'Computer Science & Engineering' },
        'Data Structures & Algorithms': { name: 'Prof. Sunita Sharma', id: 'FAC002', email: 'sunita.sharma@oblms.edu', dept: 'Computer Science & Engineering' },
        'Object-Oriented Programming with Java': { name: 'Dr. Ramesh Babu', id: 'FAC001', email: 'Loukika310306@gmail.com', dept: 'Computer Science & Engineering' },
        'Operating Systems & Kernel Architecture': { name: 'Dr. Amit Patel', id: 'FAC003', email: 'amit.patel@oblms.edu', dept: 'Computer Science & Engineering' },
        'Computer Networks & Protocols': { name: 'Dr. Priya Nair', id: 'FAC004', email: 'priya.nair@oblms.edu', dept: 'Computer Science & Engineering' }
      };

      rawAssessmentMappings.forEach((mapping: any) => {
        let aType = mapping.assessmentType || mapping.type || 'Assessment';
        let cName = mapping.courseName || mapping.course || mapping.courseTitle || 'Curriculum Course';
        let aName = mapping.assessmentName || mapping.name || mapping.assessment || mapping.title || '';

        if (!aName || aName.toLowerCase().includes('undefined')) {
          aName = `${cName} - ${aType !== 'Assessment' ? aType : 'Midterm / Evaluation'}`;
        }
        if (aType.toLowerCase().includes('undefined')) {
          aType = 'Assessment';
        }

        const coList = Array.isArray(mapping.courseOutcomes)
          ? mapping.courseOutcomes.join(', ')
          : (typeof mapping.courseOutcomes === 'string' && mapping.courseOutcomes.length > 0 && !mapping.courseOutcomes.toLowerCase().includes('undefined') ? mapping.courseOutcomes : 'CO1, CO2');

        const fac = facultyMap[cName] || {
          name: mapping.facultyName || mapping.createdBy || 'Dr. Ramesh Babu',
          id: mapping.facultyId || 'FAC001',
          email: mapping.email || 'Loukika310306@gmail.com',
          dept: mapping.department || 'Computer Science & Engineering'
        };

        items.push({
          id: (mapping.id || Math.random()).toString(),
          type: 'assessment-co-mapping',
          title: `${aName} → ${coList}`,
          description: `Assessment: ${aName} (${aType}) | Course: ${cName} | CO(s): ${coList}`,
          createdBy: fac.name,
          requesterId: fac.id,
          requesterRole: 'Faculty',
          requesterEmail: fac.email,
          department: fac.dept,
          createdDate: mapping.approvalDate || mapping.createdDate || new Date().toISOString().split('T')[0],
          status: mapping.approvalStatus || mapping.status || 'Pending',
          details: mapping
        });
      });

      // 3. CO-PO Curriculum Mappings
      let copoMappings: any[] = [];
      try {
        copoMappings = JSON.parse(localStorage.getItem('obslmsCoMappings') || '[]');
      } catch {}

      copoMappings.forEach((mapping: any) => {
        const co = mapping.co || mapping.coCode || 'CO1';
        const po = mapping.po || mapping.poCode || 'PO1';
        const course = mapping.course || mapping.courseName || 'Course';
        const contrib = mapping.contribution || mapping.weight || '3';

        const fac = facultyMap[course] || {
          name: mapping.facultyName || mapping.createdBy || 'Dr. Ramesh Babu',
          id: mapping.facultyId || 'FAC001',
          email: mapping.email || 'Loukika310306@gmail.com',
          dept: mapping.department || 'Computer Science & Engineering'
        };

        items.push({
          id: (mapping.id || `${course}-${co}-${po}`).toString(),
          type: 'copo-mapping',
          title: `Curriculum: ${co} → ${po} (${course})`,
          description: `Course: ${course} | CO: ${co} mapped to ${po} | Contribution Weight: ${contrib}`,
          createdBy: fac.name,
          requesterId: fac.id,
          requesterRole: 'Faculty',
          requesterEmail: fac.email,
          department: fac.dept,
          createdDate: mapping.createdDate || new Date().toISOString().split('T')[0],
          status: mapping.status || 'Pending',
          details: mapping
        });
      });

      this.approvalItems = items;
      this.filterApprovals();
      this.cdr.detectChanges();

    } catch (error) {
      console.error('Error loading approval items:', error);
      this.approvalItems = [];
      this.filterApprovals();
      this.cdr.detectChanges();
    }
  }

  filterApprovals(): void {
    this.filteredItems = this.approvalItems.filter(item => {
      const matchStatus = this.filterStatus === '' || item.status === this.filterStatus;
      const matchType = this.filterType === '' || item.type === this.filterType;
      const matchSearch = this.searchQuery === '' || 
        item.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        item.createdBy.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (item.requesterId && item.requesterId.toLowerCase().includes(this.searchQuery.toLowerCase()));

      return matchStatus && matchType && matchSearch;
    });
    this.cdr.detectChanges();
  }

  onSearchChange(): void {
    this.filterApprovals();
  }

  onFilterChange(): void {
    if (this.filterStatus === '') {
      this.activeTab = 'All';
    } else if (this.filterStatus === 'Pending' || this.filterStatus === 'Approved' || this.filterStatus === 'Rejected') {
      this.activeTab = this.filterStatus;
    }
    this.filterApprovals();
  }

  approveItem(item: ApprovalItem): void {
    item.status = 'Approved';

    if (item.type === 'course-enrollment') {
      try {
        const studentName = item.details?.studentName || item.createdBy;
        const studentId = item.details?.studentId || item.requesterId || 'STU004';
        const studentEmail = item.details?.studentEmail || item.requesterEmail || '';
        const courseCode = item.details?.courseCode || item.details?.courseTitle || '';

        // Save in approved course enrollments
        const storedEnrollments = localStorage.getItem('obslmsEnrollments');
        const enrollments = storedEnrollments ? JSON.parse(storedEnrollments) : [];
        const exists = enrollments.some((e: any) => e.studentId === studentId && (e.courseCode === courseCode || e.courseTitle === courseCode));
        
        if (!exists) {
          enrollments.push({
            id: 'enr-' + Date.now(),
            studentId,
            studentName,
            studentEmail,
            courseCode: item.details?.courseCode || courseCode,
            courseTitle: item.details?.courseTitle || courseCode,
            department: item.department || 'Computer Science & Engineering',
            enrolledDate: new Date().toISOString().split('T')[0],
            status: 'Active'
          });
          localStorage.setItem('obslmsEnrollments', JSON.stringify(enrollments));
        }

        // Update course request status
        const storedReqs = localStorage.getItem('obslmsCourseRequests');
        if (storedReqs) {
          const reqs = JSON.parse(storedReqs);
          const r = reqs.find((req: any) => req.id === item.details?.id);
          if (r) {
            r.status = 'Approved';
            localStorage.setItem('obslmsCourseRequests', JSON.stringify(reqs));
          }
        }
        this.syncService.emit('ENROLLMENTS_CHANGED', item.details);
      } catch (err) {
        console.error('Error recording approval:', err);
      }
    } else if (item.type === 'assessment-co-mapping') {
      try {
        const stored = localStorage.getItem('obslmsAssessmentCOMappings');
        if (stored) {
          const list = JSON.parse(stored);
          const mapping = list.find((m: any) => m.id === item.details?.id);
          if (mapping) {
            mapping.approvalStatus = 'Approved';
            localStorage.setItem('obslmsAssessmentCOMappings', JSON.stringify(list));
          }
        }
        this.syncService.emit('ASSESSMENTS_CHANGED', item.details);
      } catch (err) {
        console.error('Error approving mapping:', err);
      }
    }

    this.toast.success(`"${item.title}" successfully approved! ✅`);
    this.filterApprovals();
  }

  rejectItem(item: ApprovalItem): void {
    this.selectedApprovalId = item.id;
    this.rejectionReasonText = '';
    this.showRejectReason = true;
  }

  confirmReject(): void {
    const item = this.approvalItems.find(i => i.id === this.selectedApprovalId);
    if (item) {
      item.status = 'Rejected';
      if (!item.details) item.details = {};
      item.details.rejectionReason = this.rejectionReasonText;

      if (item.type === 'course-enrollment') {
        try {
          const stored = localStorage.getItem('obslmsCourseRequests');
          if (stored) {
            const list = JSON.parse(stored);
            const req = list.find((r: any) => r.id === item.details?.id);
            if (req) {
              req.status = 'Rejected';
              req.rejectionReason = this.rejectionReasonText;
              localStorage.setItem('obslmsCourseRequests', JSON.stringify(list));
            }
          }
          this.syncService.emit('ENROLLMENTS_CHANGED', item.details);
        } catch {}
      } else if (item.type === 'assessment-co-mapping') {
        try {
          const stored = localStorage.getItem('obslmsAssessmentCOMappings');
          if (stored) {
            const list = JSON.parse(stored);
            const mapping = list.find((m: any) => m.id === item.details?.id);
            if (mapping) {
              mapping.approvalStatus = 'Rejected';
              mapping.rejectionReason = this.rejectionReasonText;
              localStorage.setItem('obslmsAssessmentCOMappings', JSON.stringify(list));
            }
          }
        } catch {}
      }

      this.toast.info(`"${item.title}" was rejected.`);
    }

    this.showRejectReason = false;
    this.selectedApprovalId = '';
    this.rejectionReasonText = '';
    this.filterApprovals();
  }

  cancelReject(): void {
    this.showRejectReason = false;
    this.selectedApprovalId = '';
    this.rejectionReasonText = '';
  }

  getPendingCount(): number {
    return this.approvalItems.filter(i => i.status === 'Pending').length;
  }

  getApprovedCount(): number {
    return this.approvalItems.filter(i => i.status === 'Approved').length;
  }

  getRejectedCount(): number {
    return this.approvalItems.filter(i => i.status === 'Rejected').length;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Approved': return '#10b981';
      case 'Rejected': return '#ef4444';
      default: return '#f59e0b';
    }
  }

  getStatusBgColor(status: string): string {
    switch (status) {
      case 'Approved': return 'rgba(16, 185, 129, 0.15)';
      case 'Rejected': return 'rgba(239, 68, 68, 0.15)';
      default: return 'rgba(245, 158, 11, 0.15)';
    }
  }
}
