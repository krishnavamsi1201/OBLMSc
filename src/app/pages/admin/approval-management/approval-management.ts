import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../../shared/navbar/navbar';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { Footer } from '../../../shared/footer/footer';

interface ApprovalItem {
  id: string;
  type: string; // 'assessment-co-mapping', 'course-subject-assignment', 'faculty-allocation'
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
  approvalItems: ApprovalItem[] = [];
  filteredItems: ApprovalItem[] = [];
  filterStatus: string = 'Pending';
  filterType: string = '';
  searchQuery: string = '';

  approvalTypes = [
    { value: '', label: 'All Types' },
    { value: 'assessment-co-mapping', label: 'Assessment-CO Mappings' },
    { value: 'course-subject-assignment', label: 'Course-Subject Assignments' },
    { value: 'faculty-allocation', label: 'Faculty Allocations' }
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
      const assessmentMappings = JSON.parse(localStorage.getItem('obslmsAssessmentCOMappings') || '[]') as AssessmentCOMapping[];
      
      this.approvalItems = assessmentMappings.map((mapping: AssessmentCOMapping) => ({
        id: mapping.id,
        type: 'assessment-co-mapping',
        title: `${mapping.assessmentName} → ${mapping.courseOutcomes.join(', ')}`,
        description: `Assessment: ${mapping.assessmentName} (${mapping.assessmentType}) | Course: ${mapping.courseName} | CO(s): ${mapping.courseOutcomes.join(', ')}`,
        createdBy: 'System',
        createdDate: mapping.approvalDate || new Date().toISOString().split('T')[0],
        status: mapping.approvalStatus || 'Pending',
        details: mapping
      }));

      // Load course-subject assignments if they have approval workflow
      try {
        const courseSubjects = JSON.parse(localStorage.getItem('obslmsCourseSubjects') || '[]');
        // Add course-subject assignments to approvals if needed
      } catch {}

      // Load faculty allocations if they have approval workflow
      try {
        const facultyAllocations = JSON.parse(localStorage.getItem('obslmsFacultyAllocations') || '[]');
        // Add faculty allocations to approvals if needed
      } catch {}

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
    if (confirm(`Approve this ${item.type}?`)) {
      item.status = 'Approved';
      this.updateApprovalInStorage(item);
      this.showNotification(`✅ Approved: ${item.title}`, 'success');
      this.filterApprovals();
    }
  }

  rejectItem(item: ApprovalItem): void {
    this.selectedApprovalId = item.id;
    this.showRejectReason = true;
    this.rejectionReasonText = '';
  }

  confirmReject(): void {
    if (!this.rejectionReasonText.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    const item = this.approvalItems.find(i => i.id === this.selectedApprovalId);
    if (item) {
      item.status = 'Rejected';
      if (item.details) {
        item.details.rejectionReason = this.rejectionReasonText;
      }
      this.updateApprovalInStorage(item);
      this.showNotification(`❌ Rejected: ${item.title} - Reason: ${this.rejectionReasonText}`, 'error');
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
    if (item.type === 'assessment-co-mapping') {
      try {
        const mappings = JSON.parse(localStorage.getItem('obslmsAssessmentCOMappings') || '[]');
        const index = mappings.findIndex((m: any) => m.id === item.id);
        if (index !== -1) {
          mappings[index].approvalStatus = item.status;
          mappings[index].approvalDate = new Date().toISOString().split('T')[0];
          mappings[index].approvedBy = localStorage.getItem('userName') || 'Admin';
          if (item.details.rejectionReason) {
            mappings[index].rejectionReason = item.details.rejectionReason;
          }
          localStorage.setItem('obslmsAssessmentCOMappings', JSON.stringify(mappings));
        }
      } catch (error) {
        console.error('Error updating approval:', error);
      }
    }
  }

  showNotification(message: string, type: string): void {
    // Simple notification - in production use a proper notification service
    console.log(`[${type.toUpperCase()}] ${message}`);
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
