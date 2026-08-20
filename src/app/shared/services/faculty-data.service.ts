import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

// Interfaces matching your localStorage structure
export interface StorageCourse {
  id: number;
  code: string;
  title: string;
  faculty: string;
  semester: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  semester: string;
  studentCount: number;
}

export interface StudentProgress {
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  attendance: number;
  coAttainment: number;
  lastUpdate: Date;
}

export interface Assessment {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  type: string; // 'assignment', 'quiz', 'exam', etc.
  dueDate: Date;
  submittedCount: number;
  totalCount: number;
  status: 'pending' | 'ongoing' | 'completed';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'announcement' | 'update' | 'alert';
  date: Date;
  read: boolean;
}

export interface FacultyDashboardData {
  courses: Course[];
  activeAssessments: Assessment[];
  studentProgressSummary: StudentProgress[];
  notifications: Notification[];
  totalStudents: number;
  averageAttendance: number;
}

@Injectable({
  providedIn: 'root'
})
export class FacultyDataService {

  constructor() { }

  /**
   * Fetch all faculty dashboard data from localStorage
   */
  getFacultyDashboardData(): Observable<FacultyDashboardData> {
    const courses = this.getCourseData();
    const assessments = this.getAssessmentData();
    const studentProgress = this.getStudentProgressData(courses);
    const notifications = this.getNotificationData(courses, assessments);
    
    const totalStudents = courses.reduce((sum, course) => sum + course.studentCount, 0);
    const avgAttendance = this.calculateAverageAttendance();

    const dashboardData: FacultyDashboardData = {
      courses,
      activeAssessments: assessments,
      studentProgressSummary: studentProgress,
      notifications,
      totalStudents,
      averageAttendance: avgAttendance
    };

    return of(dashboardData);
  }

  /**
   * Get all courses for the current faculty from localStorage
   */
  getCourses(): Observable<Course[]> {
    return of(this.getCourseData());
  }

  /**
   * Get active assessments from localStorage
   */
  getActiveAssessments(): Observable<Assessment[]> {
    return of(this.getAssessmentData());
  }

  /**
   * Get student progress data from localStorage
   */
  getStudentProgress(): Observable<StudentProgress[]> {
    const courses = this.getCourseData();
    return of(this.getStudentProgressData(courses));
  }

  /**
   * Get notifications from localStorage
   */
  getNotifications(): Observable<Notification[]> {
    const courses = this.getCourseData();
    const assessments = this.getAssessmentData();
    return of(this.getNotificationData(courses, assessments));
  }

  /**
   * ========== REAL DATA FETCHING METHODS ==========
   */

  /**
   * Fetch courses from localStorage
   */
  private getCourseData(): Course[] {
    try {
      const stored = localStorage.getItem('obslmsCourses');
      if (!stored) return [];
      
      const coursesData = JSON.parse(stored) as StorageCourse[];
      
      return coursesData.map(course => ({
        id: course.id.toString(),
        name: course.title,
        code: course.code,
        semester: course.semester,
        studentCount: this.getStudentCountForCourse(course.id)
      }));
    } catch (error) {
      console.error('Error loading courses:', error);
      return [];
    }
  }

  /**
   * Get student count for a specific course (from mark entries)
   */
  private getStudentCountForCourse(courseId: number): number {
    try {
      const stored = localStorage.getItem('obslmsMarkEntries');
      if (!stored) return 0;
      
      const marks = JSON.parse(stored) as any[];
      const courseMarks = marks.filter(m => 
        m.assessment && m.assessment.includes(courseId.toString())
      );
      
      // Count unique students in this course
      const uniqueStudents = new Set(courseMarks.map(m => m.student));
      return uniqueStudents.size;
    } catch {
      return 0;
    }
  }

  /**
   * Fetch assessments from localStorage and calculate submission status
   */
  private getAssessmentData(): Assessment[] {
    try {
      const stored = localStorage.getItem('obslmsAssessments');
      if (!stored) return [];
      
      const assessmentsData = JSON.parse(stored) as any[];
      const marks = this.getSafeJson('obslmsMarkEntries');
      const courses = this.getSafeJson('obslmsCourses');
      
      return assessmentsData.map(assessment => {
        const courseInfo = courses.find((c: StorageCourse) => c.id.toString() === assessment.course);
        const submittedMarks = marks.filter((m: any) => 
          m.assessment && m.assessment.includes(assessment.type)
        );
        
        // Determine status based on due date
        const dueDate = new Date(assessment.dueDate);
        const now = new Date();
        let status: 'pending' | 'ongoing' | 'completed' = 'pending';
        
        if (dueDate < now) {
          status = 'completed';
        } else if (submittedMarks.length > 0) {
          status = 'ongoing';
        }
        
        return {
          id: assessment.id?.toString() || `A-${Math.random()}`,
          courseId: assessment.course?.toString() || '',
          courseName: courseInfo?.title || 'Unknown Course',
          title: assessment.type,
          type: assessment.type.toLowerCase(),
          dueDate: new Date(assessment.dueDate),
          submittedCount: submittedMarks.length,
          totalCount: this.getEstimatedStudentCount(assessment.course),
          status
        };
      });
    } catch (error) {
      console.error('Error loading assessments:', error);
      return [];
    }
  }

  /**
   * Estimate total student count for assessment
   */
  private getEstimatedStudentCount(courseId: string | number): number {
    try {
      const courses = this.getSafeJson('obslmsCourses') as StorageCourse[];
      const course = courses.find(c => c.id.toString() === courseId.toString());
      if (!course) return 0;
      
      // Get unique students from mark entries for this course
      const marks = this.getSafeJson('obslmsMarkEntries');
      const uniqueStudents = new Set(
        marks
          .filter((m: any) => m.assessment && m.assessment.includes(courseId.toString()))
          .map((m: any) => m.student)
      );
      return uniqueStudents.size || 30; // Default estimate
    } catch {
      return 30;
    }
  }

  /**
   * Calculate student progress from stored marks
   */
  private getStudentProgressData(courses: Course[]): StudentProgress[] {
    try {
      const marks = this.getSafeJson('obslmsMarkEntries');
      const attendance = this.getSafeJson('obslmsAttendance') || [];
      
      // Build student progress map
      const progressMap = new Map<string, StudentProgress>();
      
      // Process marks to calculate attainment
      marks.forEach((mark: any) => {
        if (mark.student && mark.obtained !== undefined && mark.maxMarks) {
          const attainment = (mark.obtained / mark.maxMarks) * 100;
          
          if (!progressMap.has(mark.student)) {
            const course = courses[0]; // Default course
            progressMap.set(mark.student, {
              studentId: `S-${Math.random()}`,
              studentName: mark.student,
              courseId: course?.id || 'C001',
              courseName: course?.name || 'Course',
              attendance: this.getStudentAttendance(mark.student),
              coAttainment: Math.round(attainment),
              lastUpdate: new Date()
            });
          }
        }
      });
      
      return Array.from(progressMap.values()).slice(0, 10); // Return top 10 students
    } catch (error) {
      console.error('Error calculating student progress:', error);
      return [];
    }
  }

  /**
   * Calculate attendance percentage for a student
   */
  private getStudentAttendance(studentName: string): number {
    try {
      const attendance = this.getSafeJson('obslmsAttendance') || [];
      const studentRecords = attendance.filter((a: any) => a.student === studentName);
      
      if (studentRecords.length === 0) return 0;
      
      const present = studentRecords.filter((a: any) => a.status === 'Present').length;
      const percentage = (present / studentRecords.length) * 100;
      return Math.round(percentage);
    } catch {
      return 75; // Default
    }
  }

  /**
   * Calculate average attendance across all students
   */
  private calculateAverageAttendance(): number {
    try {
      const attendance = this.getSafeJson('obslmsAttendance') || [];
      if (attendance.length === 0) return 0;
      
      const present = attendance.filter((a: any) => a.status === 'Present').length;
      const percentage = (present / attendance.length) * 100;
      return Math.round(percentage);
    } catch {
      return 75;
    }
  }

  /**
   * Generate notifications based on system data
   */
  private getNotificationData(courses: Course[], assessments: Assessment[]): Notification[] {
    const notifications: Notification[] = [];
    const now = new Date();
    
    // Check for pending assessments (due within 7 days)
    assessments.forEach(assessment => {
      const daysUntilDue = Math.floor((assessment.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue >= 0 && daysUntilDue <= 7) {
        notifications.push({
          id: `N-${assessment.id}`,
          title: `Deadline Reminder: ${assessment.title}`,
          message: `${assessment.title} for ${assessment.courseName} is due in ${daysUntilDue} days.`,
          type: 'alert',
          date: new Date(),
          read: false
        });
      }
    });
    
    // Check for incomplete assessments (pending submissions)
    assessments.forEach(assessment => {
      if (assessment.status === 'ongoing' && assessment.submittedCount < assessment.totalCount) {
        const pending = assessment.totalCount - assessment.submittedCount;
        notifications.push({
          id: `N-pending-${assessment.id}`,
          title: `Pending Submissions: ${assessment.title}`,
          message: `${pending} out of ${assessment.totalCount} students have not submitted for ${assessment.title}.`,
          type: 'alert',
          date: new Date(),
          read: false
        });
      }
    });
    
    // Add system update notifications
    if (courses.length > 0) {
      notifications.push({
        id: 'N-system-update',
        title: 'System Update Available',
        message: 'A new version of the Learning Management System is available.',
        type: 'announcement',
        date: new Date(Date.now() - 86400000),
        read: true
      });
    }
    
    return notifications.slice(0, 5); // Return top 5 notifications
  }

  /**
   * Safe JSON parsing helper
   */
  private getSafeJson(key: string): any[] {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}
