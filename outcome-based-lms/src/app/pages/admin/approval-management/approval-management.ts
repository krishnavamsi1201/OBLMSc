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
      const courseRequests = JSON.parse(localStorage.getItem('obslmsCourseRequests') || '[]');
      courseRequests.forEach((req: any) => {
        items.push({
          id: req.id,
          type: 'course-enrollment',
          title: `Enrollment: ${req.studentName} → ${req.courseTitle || req.courseCode}`,
          description: `Student: ${req.studentName} requested enrollment in ${req.courseTitle || req.courseCode} (${req.courseCode})`,
          createdBy: req.studentName || 'Student',
          createdDate: req.requestedAt ? req.requestedAt.split('T')[0] : new Date().toISOString().split('T')[0],
          status: req.status || 'Pending',
          details: req
        });
      });

      // 2. Assessment-CO Mappings
      const assessmentMappings = JSON.parse(localStorage.getItem('obslmsAssessmentCOMappings') || '[]') as AssessmentCOMapping[];
      assessmentMappings.forEach((mapping: AssessmentCOMapping) => {
        items.push({
          id: mapping.id,
          type: 'assessment-co-mapping',
          title: `${mapping.assessmentName} → ${(mapping.courseOutcomes || []).join(', ')}`,
          description: `Assessment: ${mapping.assessmentName} (${mapping.assessmentType}) | Course: ${mapping.courseName} | CO(s): ${(mapping.courseOutcomes || []).join(', ')}`,
          createdBy: 'Faculty',
          createdDate: mapping.approvalDate || new Date().toISOString().split('T')[0],
          status: mapping.approvalStatus || 'Pending',
          details: mapping
        });
      });

      // 3. CO-PO Curriculum Mappings
      const copoMappings = JSON.parse(localStorage.getItem('obslmsCoMappings') || '[]');
      copoMappings.forEach((mapping: any) => {
        items.push({
          id: (mapping.id || `${mapping.course}-${mapping.co}-${mapping.po}`).toString(),
          type: 'copo-mapping',
          title: `Curriculum: ${mapping.co} → ${mapping.po} (${mapping.course})`,
          description: `Course: ${mapping.course} | CO: ${mapping.co} mapped to ${mapping.po} | Contribution: ${mapping.contribution}%`,
          createdBy: 'Faculty',
          createdDate: new Date().toISOString().split('T')[0],
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
