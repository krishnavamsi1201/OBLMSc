import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../../shared/navbar/navbar';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { Footer } from '../../../shared/footer/footer';
import { ToastService } from '../../../shared/services/toast.service';
import { SyncService } from '../../../shared/services/sync.service';

interface ApprovalItem {
  id: string;
  type: string; // 'assessment-co-mapping', 'copo-mapping', 'course-enrollment', 'course-subject-assignment', 'faculty-allocation'
  title: string;
  description: string;
  createdBy: string;
  createdDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  details: any;
}

interface AssessmentCOMapping {
  id: string;
  assessmentName: string;
  assessmentType: string;
  courseName: string;
  courseOutcomes: string[];
  maxMarks: number;
  approvalStatus?: 'Pending' | 'Approved' | 'Rejected';
  approvalDate?: string;
  approvedBy?: string;
  rejectionReason?: string;
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
  approvalItems: ApprovalItem[] = [];
  filteredItems: ApprovalItem[] = [];
  filterStatus: string = 'Pending';
  filterType: string = '';
  searchQuery: string = '';

  approvalTypes = [
    { value: '', label: 'All Types' },
    { value: 'course-enrollment', label: '🎓 Student Course Enrollments' },
    { value: 'assessment-co-mapping', label: '🎯 Assessment-CO Mappings' },
    { value: 'copo-mapping', label: '📐 CO-PO Curriculum Mappings' },
    { value: 'course-subject-assignment', label: '📚 Course-Subject Assignments' },
    { value: 'faculty-allocation', label: '👨‍🏫 Faculty Allocations' }
  ];

  statusOptions = ['Pending', 'Approved', 'Rejected'];
  selectedApprovalId: string = '';
  showRejectReason: boolean = false;
  rejectionReasonText: string = '';

  constructor() {
    this.loadApprovalItems();
  }

  ngOnInit(): void {
    this.filterApprovals();
  }

  loadApprovalItems(): void {
    try {
      const items: ApprovalItem[] = [];

      // 1. Student Course Enrollment Requests
      let courseRequests: any[] = [];
      try {
        courseRequests = JSON.parse(localStorage.getItem('obslmsCourseRequests') || '[]');
      } catch {}

      courseRequests.forEach((req: any) => {
        const sName = req.studentName || req.student || 'Student';
        const cTitle = req.courseTitle || req.courseName || req.courseCode || req.course || 'Course';
        const cCode = req.courseCode || req.course || '';

        items.push({
          id: (req.id || Math.random()).toString(),
          type: 'course-enrollment',
          title: `Enrollment: ${sName} → ${cTitle}`,
          description: `Student: ${sName} requested enrollment in ${cTitle} ${cCode ? '(' + cCode + ')' : ''}`,
          createdBy: sName,
          createdDate: req.requestedAt ? req.requestedAt.split('T')[0] : new Date().toISOString().split('T')[0],
          status: req.status || 'Pending',
          details: req
        });
      });

      // 2. Assessment-CO Mappings
      let rawAssessmentMappings: any[] = [];
      try {
        rawAssessmentMappings = JSON.parse(localStorage.getItem('obslmsAssessmentCOMappings') || '[]');
      } catch {}

      if (!Array.isArray(rawAssessmentMappings) || rawAssessmentMappings.length === 0) {
        rawAssessmentMappings = [
          { id: '1', assessmentName: 'INMCA202 - Midterm 1', assessmentType: 'Midterm', courseName: 'Probability and Statistics', courseOutcomes: ['CO1', 'CO2'], approvalStatus: 'Pending' },
          { id: '2', assessmentName: 'DS - Practical Lab Exam', assessmentType: 'Practical', courseName: 'Data Structures and Analysis of Computer Algorithms', courseOutcomes: ['CO1'], approvalStatus: 'Pending' },
          { id: '3', assessmentName: 'MES - Quiz 1', assessmentType: 'Quiz', courseName: 'Microprocessors and Embedded Systems', courseOutcomes: ['CO1', 'CO2'], approvalStatus: 'Pending' },
          { id: '4', assessmentName: 'IT305 - Assignment 1', assessmentType: 'Assignment', courseName: 'Operating Systems', courseOutcomes: ['CO1', 'CO2', 'CO3'], approvalStatus: 'Pending' },
          { id: '5', assessmentName: 'OOP - Practical Exam', assessmentType: 'Practical', courseName: 'Object Oriented Programming with C++', courseOutcomes: ['CO1'], approvalStatus: 'Pending' }
        ];
        try {
          localStorage.setItem('obslmsAssessmentCOMappings', JSON.stringify(rawAssessmentMappings));
        } catch {}
      }

      rawAssessmentMappings.forEach((mapping: any) => {
        let aType = mapping.assessmentType || mapping.type || 'Assessment';
        let cName = mapping.courseName || mapping.course || mapping.courseTitle || 'Curriculum Course';
        let aName = mapping.assessmentName || mapping.name || mapping.assessment || mapping.title || '';

        // Clean out any legacy corrupted "undefined" strings
        if (!aName || aName.toLowerCase().includes('undefined')) {
          aName = `${cName} - ${aType !== 'Assessment' ? aType : 'Midterm / Evaluation'}`;
        }
        if (aType.toLowerCase().includes('undefined')) {
          aType = 'Assessment';
        }

        const coList = Array.isArray(mapping.courseOutcomes)
          ? mapping.courseOutcomes.join(', ')
          : (typeof mapping.courseOutcomes === 'string' && mapping.courseOutcomes.length > 0 && !mapping.courseOutcomes.toLowerCase().includes('undefined') ? mapping.courseOutcomes : 'CO1, CO2');

        items.push({
          id: (mapping.id || Math.random()).toString(),
          type: 'assessment-co-mapping',
          title: `${aName} → ${coList}`,
          description: `Assessment: ${aName} (${aType}) | Course: ${cName} | CO(s): ${coList}`,
          createdBy: mapping.createdBy || 'Faculty',
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

        items.push({
          id: (mapping.id || `${course}-${co}-${po}`).toString(),
          type: 'copo-mapping',
          title: `Curriculum: ${co} → ${po} (${course})`,
          description: `Course: ${course} | CO: ${co} mapped to ${po} | Contribution Level: ${contrib}`,
          createdBy: mapping.createdBy || 'Faculty',
          createdDate: mapping.createdDate || new Date().toISOString().split('T')[0],
          status: mapping.status || 'Pending',
          details: mapping
        });
      });

      this.approvalItems = items;

    } catch (error) {
      console.error('Error loading approval items:', error);
      this.approvalItems = [];
    }
  }

  filterApprovals(): void {
    this.filteredItems = this.approvalItems.filter(item => {
      const matchStatus = this.filterStatus === '' || item.status === this.filterStatus;
      const matchType = this.filterType === '' || item.type === this.filterType;
      const matchSearch = this.searchQuery === '' || 
        item.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(this.searchQuery.toLowerCase());

      return matchStatus && matchType && matchSearch;
    });
  }

  onSearchChange(): void {
    this.filterApprovals();
  }

  onFilterChange(): void {
    this.filterApprovals();
  }

  approveItem(item: ApprovalItem): void {
    item.status = 'Approved';
    this.updateApprovalInStorage(item);
    this.toast.success(`Approved: ${item.title}`);
    this.filterApprovals();
  }

  rejectItem(item: ApprovalItem): void {
    this.selectedApprovalId = item.id;
    this.showRejectReason = true;
    this.rejectionReasonText = '';
  }

  confirmReject(): void {
    if (!this.rejectionReasonText.trim()) {
      this.toast.warning('Please provide a rejection reason');
      return;
    }

    const item = this.approvalItems.find(i => i.id === this.selectedApprovalId);
    if (item) {
      item.status = 'Rejected';
      if (item.details) {
        item.details.rejectionReason = this.rejectionReasonText;
      }
      this.updateApprovalInStorage(item);
      this.toast.error(`Rejected: ${item.title}`);
      this.showRejectReason = false;
      this.rejectionReasonText = '';
      this.selectedApprovalId = '';
      this.filterApprovals();
    }
  }

  cancelReject(): void {
    this.showRejectReason = false;
    this.rejectionReasonText = '';
    this.selectedApprovalId = '';
  }

  updateApprovalInStorage(item: ApprovalItem): void {
    if (item.type === 'course-enrollment') {
      try {
        const requests = JSON.parse(localStorage.getItem('obslmsCourseRequests') || '[]');
        const reqIdx = requests.findIndex((r: any) => r.id === item.id);
        if (reqIdx !== -1) {
          requests[reqIdx].status = item.status;
          if (item.details?.rejectionReason) {
            requests[reqIdx].rejectionReason = item.details.rejectionReason;
          }
          localStorage.setItem('obslmsCourseRequests', JSON.stringify(requests));
        }

        if (item.status === 'Approved' && item.details) {
          // Add to student's enrolled courses
          const studentCourses = JSON.parse(localStorage.getItem('obslmsStudentCourses') || '[]');
          const exists = studentCourses.some((sc: any) =>
            sc.studentName.toLowerCase() === item.details.studentName.toLowerCase() &&
            sc.courseCode.toLowerCase() === item.details.courseCode.toLowerCase()
          );
          if (!exists) {
            studentCourses.push({
              studentName: item.details.studentName,
              courseCode: item.details.courseCode,
              courseTitle: item.details.courseTitle,
              enrolledAt: new Date().toISOString()
            });
            localStorage.setItem('obslmsStudentCourses', JSON.stringify(studentCourses));
          }

          // Send approval notification to student
          const notifs = JSON.parse(localStorage.getItem('obslmsNotifications') || '[]');
          notifs.unshift({
            id: 'NOTIF-' + Date.now(),
            title: 'Course Enrollment Approved! 🎉',
            message: `Your enrollment request for "${item.details.courseTitle || item.details.courseCode}" has been approved. You can now access syllabus, attendance, and study materials.`,
            type: 'announcement',
            date: new Date().toISOString(),
            read: false,
            recipient: item.details.studentName
          });
          localStorage.setItem('obslmsNotifications', JSON.stringify(notifs));
        }

        this.syncService.emit('ENROLLMENTS_CHANGED', item.details);
      } catch (error) {
        console.error('Error updating course enrollment approval:', error);
      }
    } else if (item.type === 'assessment-co-mapping') {
      try {
        const mappings = JSON.parse(localStorage.getItem('obslmsAssessmentCOMappings') || '[]');
        const index = mappings.findIndex((m: any) => m.id === item.id);
        if (index !== -1) {
          mappings[index].approvalStatus = item.status;
          mappings[index].approvalDate = new Date().toISOString().split('T')[0];
          mappings[index].approvedBy = localStorage.getItem('userName') || 'Admin';
          if (item.details?.rejectionReason) {
            mappings[index].rejectionReason = item.details.rejectionReason;
          }
          localStorage.setItem('obslmsAssessmentCOMappings', JSON.stringify(mappings));
        }
        this.syncService.emit('MARKS_CHANGED');
      } catch (error) {
        console.error('Error updating approval:', error);
      }
    } else if (item.type === 'copo-mapping') {
      try {
        const mappings = JSON.parse(localStorage.getItem('obslmsCoMappings') || '[]');
        const index = mappings.findIndex((m: any) => m.id.toString() === item.id.toString() || `${m.course}-${m.co}-${m.po}` === item.id);
        if (index !== -1) {
          mappings[index].status = item.status;
          localStorage.setItem('obslmsCoMappings', JSON.stringify(mappings));
        }
        this.syncService.emit('MARKS_CHANGED');
      } catch (error) {
        console.error('Error updating copo mapping approval:', error);
      }
    }
  }

  getTypeLabel(type: string): string {
    const found = this.approvalTypes.find(t => t.value === type);
    return found ? found.label : type;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Approved': return 'badge-approved';
      case 'Rejected': return 'badge-rejected';
      case 'Pending': return 'badge-pending';
      default: return '';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Approved': return '#10b981';
      case 'Rejected': return '#ef4444';
      case 'Pending': return '#f59e0b';
      default: return '#6b7280';
    }
  }

  getStatusBgColor(status: string): string {
    switch (status) {
      case 'Approved': return 'rgba(16, 185, 129, 0.1)';
      case 'Rejected': return 'rgba(239, 68, 68, 0.1)';
      case 'Pending': return 'rgba(245, 158, 11, 0.1)';
      default: return 'rgba(107, 114, 128, 0.1)';
    }
  }

  getPendingCount(): number {
    return this.approvalItems.filter(item => item.status === 'Pending').length;
  }

  getApprovedCount(): number {
    return this.approvalItems.filter(item => item.status === 'Approved').length;
  }

  getRejectedCount(): number {
    return this.approvalItems.filter(item => item.status === 'Rejected').length;
  }
}
