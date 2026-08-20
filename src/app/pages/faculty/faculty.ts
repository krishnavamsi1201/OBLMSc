import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { FacultyDataService, Course, Assessment, StudentProgress, Notification } from '../../shared/services/faculty-data.service';

interface ExaminationItem {
  title: string;
  course: string;
  date: string;
  room: string;
  status: 'Scheduled' | 'Ongoing' | 'Completed';
}

interface GrievanceItem {
  title: string;
  student: string;
  type: string;
  status: 'Open' | 'In Review' | 'Resolved';
  lastUpdated: string;
}

interface QuestionBankItem {
  title: string;
  type: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  marks: number;
}

@Component({
  selector: 'app-faculty',
  standalone: true,
  imports: [RouterModule, CommonModule, Navbar, Sidebar, Footer],
  templateUrl: './faculty.html',
  styleUrls: ['./faculty.css'],
})
export class Faculty implements OnInit {
  // Dashboard data
  courses: Course[] = [];
  activeAssessments: Assessment[] = [];
  studentProgressList: StudentProgress[] = [];
  notifications: Notification[] = [];
  
  // Summary statistics
  totalCourses = 0;
  totalStudents = 0;
  activeAssessmentsCount = 0;
  pendingNotificationsCount = 0;
  averageAttendance = 0;

  // Faculty task widgets
  examinationItems: ExaminationItem[] = [];
  grievanceItems: GrievanceItem[] = [];
  questionBankItems: QuestionBankItem[] = [];
  
  // Loading state
  isLoading = true;
  error: string | null = null;

  constructor(
    private facultyDataService: FacultyDataService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  /**
   * Load all faculty dashboard data
   */
  private loadDashboardData(): void {
    this.isLoading = true;
    this.error = null;
    
    this.facultyDataService.getFacultyDashboardData().subscribe({
      next: (data) => {
        this.courses = data.courses;
        this.activeAssessments = data.activeAssessments;
        this.studentProgressList = data.studentProgressSummary;
        this.notifications = data.notifications;
        
        // Calculate summary statistics
        this.totalCourses = this.courses.length;
        this.totalStudents = data.totalStudents;
        this.activeAssessmentsCount = this.activeAssessments.filter(a => a.status === 'ongoing' || a.status === 'pending').length;
        this.pendingNotificationsCount = this.notifications.filter(n => !n.read).length;
        this.averageAttendance = data.averageAttendance;
        
        // Load widgets data from localStorage
        try {
          const storedExams = localStorage.getItem('obslmsExams');
          this.examinationItems = storedExams ? JSON.parse(storedExams) : [];

          const storedGrievances = localStorage.getItem('obslmsGrievances');
          this.grievanceItems = storedGrievances ? JSON.parse(storedGrievances) : [];

          const storedQB = localStorage.getItem('obslmsQuestionBank');
          this.questionBankItems = storedQB ? JSON.parse(storedQB) : [];
        } catch (e) {
          console.error('Error loading workbench widget data', e);
        }
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
        this.error = 'Failed to load dashboard data. Please try again.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Navigate to courses page
   */
  goToCourses(): void {
    this.router.navigate(['/courses']);
  }

  /**
   * Navigate to student progress/performance page
   */
  goToStudentProgress(): void {
    this.router.navigate(['/performance']);
  }

  /**
   * Navigate to assessments page
   */
  goToAssessments(): void {
    this.router.navigate(['/assessments']);
  }

  /**
   * Navigate to notifications page
   */
  goToNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  /**
   * Get percentage of submitted assessments
   */
  getSubmissionPercentage(assessment: Assessment): number {
    return (assessment.submittedCount / assessment.totalCount) * 100;
  }

  /**
   * Get status badge color
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'ongoing':
        return '#2196F3';
      case 'pending':
        return '#FF9800';
      default:
        return '#999';
    }
  }
}



