import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { SyncService } from './sync.service';

export interface StorageCourse {
  id: number | string;
  code: string;
  title: string;
  faculty?: string;
  semester?: string;
}

export interface FacultyAllocation {
  id: string;
  facultyId: string;
  facultyName: string;
  courseId: string;
  courseName: string;
  subjectId: string;
  subjectName: string;
  semester: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  semester: string;
  faculty: string;
  studentCount: number;
  averageAttainment: number;
  averageAttendance: number;
}

export interface StudentProgress {
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  attendance: number;
  coAttainment: number;
  totalAssessments: number;
  lastUpdate: Date;
}

export interface Assessment {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  type: string;
  maxMarks: number;
  dueDate: Date | null;
  submittedCount: number;
  totalCount: number;
  status: 'pending' | 'ongoing' | 'completed';
  averageScore: number;
}

export interface AtRiskStudent {
  studentName: string;
  courseName: string;
  attainmentPercentage: number;
  attendancePercentage: number;
  riskReasons: string[];
  severity: 'High' | 'Medium';
}

export interface CourseCOAttainmentSummary {
  courseName: string;
  coCode: string;
  description: string;
  targetPercentage: number;
  attainmentPercentage: number;
  status: 'Achieved' | 'Partial' | 'Not Achieved';
  assessedStudentsCount: number;
}

export interface GradeDistribution {
  distinction: number; // >= 75%
  firstClass: number;  // 60% - 74%
  pass: number;        // 40% - 59%
  fail: number;        // < 40%
  totalEvaluated: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'announcement' | 'update' | 'alert';
  date: Date;
  read: boolean;
}

export interface SyllabusUnit {
  unitNumber: number;
  title: string;
  mappedCO: string;
  plannedLectures: number;
  completedLectures: number;
  status: 'Completed' | 'In Progress' | 'Planned';
}

export interface LectureLog {
  id: string;
  courseName: string;
  unitNumber: number;
  topic: string;
  mappedCO: string;
  date: string;
  durationMinutes: number;
}

export interface CourseFileDossier {
  course: Course;
  courseOutcomes: CourseCOAttainmentSummary[];
  assessments: Assessment[];
  studentCount: number;
  overallAttainment: number;
  averageAttendance: number;
  gradeDistribution: GradeDistribution;
  cqiActions: CqiAction[];
}

export interface FacultyDashboardData {
  courses: Course[];
  activeAssessments: Assessment[];
  studentProgressSummary: StudentProgress[];
  atRiskStudents: AtRiskStudent[];
  courseCOAttainments: CourseCOAttainmentSummary[];
  gradeDistribution: GradeDistribution;
  notifications: Notification[];
  syllabusUnits: SyllabusUnit[];
  totalCourses: number;
  totalStudents: number;
  overallAttainment: number;
  averageAttendance: number;
  activeAssessmentsCount: number;
  atRiskCount: number;
}

export interface CqiAction {
  id: string;
  courseName: string;
  coCode: string;
  issueDescription: string;
  actionPlan: string;
  targetDate: string;
  status: 'Planned' | 'In Progress' | 'Completed';
  loggedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class FacultyDataService {

  private http = inject(HttpClient);
  private syncService = inject(SyncService);

  constructor() {}

  /**
   * Fetch complete real-time dashboard analytics for currently logged in faculty
   */
  getFacultyDashboardData(): Observable<FacultyDashboardData> {
    const facultyName = this.getCurrentFacultyName();
    const courses = this.getRealTimeCourses(facultyName);
    const assessments = this.getRealTimeAssessments(courses);
    const studentProgressSummary = this.getRealTimeStudentProgress(courses);
    const atRiskStudents = this.calculateAtRiskStudents(courses, studentProgressSummary);
    const courseCOAttainments = this.calculateCourseCOAttainments(courses);
    const gradeDistribution = this.calculateGradeDistribution(courses);
    const notifications = this.generateRealTimeNotifications(courses, assessments, atRiskStudents, courseCOAttainments);
    const syllabusUnits = this.getSyllabusUnitsForCourses(courses);

    // Compute unique total students across faculty courses
    const uniqueStudents = new Set<string>();
    studentProgressSummary.forEach(sp => uniqueStudents.add(sp.studentName.toLowerCase()));
    
    // Also include students enrolled in these courses
    const allStudents = this.getSafeJson('obslmsStudents');
    allStudents.forEach((st: any) => {
      if (st.course && courses.some(c => c.name.toLowerCase().includes(st.course.toLowerCase()) || c.code.toLowerCase().includes(st.course.toLowerCase()))) {
        uniqueStudents.add((st.name || st.studentName || '').toLowerCase());
      }
    });

    const totalStudents = uniqueStudents.size || courses.reduce((sum, c) => sum + c.studentCount, 0);

    // Calculate overall averages
    const validAttainments = courseCOAttainments.filter(co => co.attainmentPercentage > 0);
    const overallAttainment = validAttainments.length > 0
      ? Math.round(validAttainments.reduce((sum, co) => sum + co.attainmentPercentage, 0) / validAttainments.length)
      : (studentProgressSummary.length > 0
          ? Math.round(studentProgressSummary.reduce((sum, sp) => sum + sp.coAttainment, 0) / studentProgressSummary.length)
          : 0);

    const validAttendances = studentProgressSummary.filter(sp => sp.attendance > 0);
    const averageAttendance = validAttendances.length > 0
      ? Math.round(validAttendances.reduce((sum, sp) => sum + sp.attendance, 0) / validAttendances.length)
      : this.calculateOverallAttendanceForCourses(courses);

    const activeAssessmentsCount = assessments.filter(a => a.status === 'ongoing' || a.status === 'pending').length;

    const data: FacultyDashboardData = {
      courses,
      activeAssessments: assessments,
      studentProgressSummary,
      atRiskStudents,
      courseCOAttainments,
      gradeDistribution,
      notifications,
      syllabusUnits,
      totalCourses: courses.length,
      totalStudents,
      overallAttainment,
      averageAttendance,
      activeAssessmentsCount,
      atRiskCount: atRiskStudents.length
    };

    return of(data);
  }

  /**
   * Get name of currently logged-in faculty
   */
  getCurrentFacultyName(): string {
    try {
      const name = localStorage.getItem('userName') || '';
      return name.trim();
    } catch {
      return '';
    }
  }

  /**
   * Get real-time courses for faculty (allocated or all stored if no specific allocation)
   */
  private getRealTimeCourses(facultyName: string): Course[] {
    try {
      let allCourses = this.getSafeJson('obslmsCourses') as StorageCourse[];
      if (!allCourses || allCourses.length === 0) {
        allCourses = [
          { id: 1, code: 'CS101', title: 'Database Management Systems', faculty: 'Dr. Ramesh Babu', semester: 'Semester 3' },
          { id: 2, code: 'CS102', title: 'Data Structures & Algorithms', faculty: 'Prof. Sunita Sharma', semester: 'Semester 3' },
          { id: 3, code: 'CS103', title: 'Object-Oriented Programming with Java', faculty: 'Dr. Ramesh Babu', semester: 'Semester 3' },
          { id: 4, code: 'CS201', title: 'Operating Systems', faculty: 'Dr. Amit Patel', semester: 'Semester 4' },
          { id: 5, code: 'CS202', title: 'Machine Learning & Data Science', faculty: 'Prof. Sunita Sharma', semester: 'Semester 5' },
          { id: 6, code: 'CS301', title: 'Computer Networks', faculty: 'Dr. Priya Nair', semester: 'Semester 5' },
          { id: 7, code: 'CS302', title: 'Software Engineering & Agile Methodologies', faculty: 'Prof. Rajesh Verma', semester: 'Semester 6' },
          { id: 8, code: 'CS303', title: 'Cloud Computing & DevOps', faculty: 'Dr. Amit Patel', semester: 'Semester 6' },
          { id: 9, code: 'CS401', title: 'Artificial Intelligence', faculty: 'Dr. Ramesh Babu', semester: 'Semester 7' },
          { id: 10, code: 'CS402', title: 'Cyber Security & Cryptography', faculty: 'Prof. Rajesh Verma', semester: 'Semester 7' }
        ];
        try {
          localStorage.setItem('obslmsCourses', JSON.stringify(allCourses));
        } catch {}
      }

      const allocations = this.getSafeJson('obslmsFacultyAllocations') as FacultyAllocation[];
      const marks = this.getSafeJson('obslmsMarkEntries');
      const attendance = this.getSafeJson('obslmsAttendance');

      let filteredCourses: Array<{ id: string; name: string; code: string; semester: string; faculty: string }> = [];

      // Check if this faculty has specific allocations
      if (facultyName && facultyName.toLowerCase() !== 'faculty' && facultyName.toLowerCase() !== 'faculty member') {
        const matchingAllocations = allocations.filter(a =>
          (a.facultyName && a.facultyName.toLowerCase().includes(facultyName.toLowerCase())) ||
          (facultyName.toLowerCase().includes(a.facultyName ? a.facultyName.toLowerCase() : ''))
        );

        if (matchingAllocations.length > 0) {
          filteredCourses = matchingAllocations.map(a => ({
            id: a.courseId || `ALLOC-${a.id}`,
            name: a.subjectName ? `${a.courseName} - ${a.subjectName}` : a.courseName,
            code: a.subjectId || a.courseId || 'CRS',
            semester: a.semester || 'Semester 1',
            faculty: a.facultyName
          }));
        } else {
          // Check matching faculty field on course object
          const matchingCourses = allCourses.filter(c =>
            c.faculty && (c.faculty.toLowerCase().includes(facultyName.toLowerCase()) || facultyName.toLowerCase().includes(c.faculty.toLowerCase()))
          );

          if (matchingCourses.length > 0) {
            filteredCourses = matchingCourses.map(c => ({
              id: c.id.toString(),
              name: c.title,
              code: c.code,
              semester: c.semester || 'Semester 1',
              faculty: c.faculty || facultyName
            }));
          }
        }
      }

      // If no faculty-specific filtered courses found (or general/all view), return all existing courses from database
      if (filteredCourses.length === 0) {
        filteredCourses = allCourses.map(c => ({
          id: c.id.toString(),
          name: c.title,
          code: c.code,
          semester: c.semester || 'Semester 1',
          faculty: c.faculty || 'Faculty Board'
        }));
      }

      // Calculate real-time dynamic stats per course
      return filteredCourses.map(course => {
        // Find unique students with marks or attendance for this course
        const courseStudentSet = new Set<string>();

        marks.forEach((m: any) => {
          if (m.student && m.assessment && (
            m.assessment.toLowerCase().includes(course.name.toLowerCase()) ||
            m.assessment.toLowerCase().includes(course.code.toLowerCase()) ||
            m.assessment.toLowerCase().includes(course.id.toLowerCase())
          )) {
            courseStudentSet.add(m.student.toLowerCase());
          }
        });

        attendance.forEach((a: any) => {
          if (a.student && a.course && (
            a.course.toLowerCase().includes(course.name.toLowerCase()) ||
            a.course.toLowerCase().includes(course.code.toLowerCase()) ||
            course.name.toLowerCase().includes(a.course.toLowerCase())
          )) {
            courseStudentSet.add(a.student.toLowerCase());
          }
        });

        const studentCount = courseStudentSet.size;

        // Calculate course average attainment from marks
        const courseMarks = marks.filter((m: any) =>
          m.assessment && (
            m.assessment.toLowerCase().includes(course.name.toLowerCase()) ||
            m.assessment.toLowerCase().includes(course.code.toLowerCase()) ||
            m.assessment.toLowerCase().includes(course.id.toLowerCase())
          )
        );

        let avgAttainment = 0;
        if (courseMarks.length > 0) {
          const totalObtained = courseMarks.reduce((sum: number, m: any) => sum + (Number(m.obtained) || 0), 0);
          const totalMax = courseMarks.reduce((sum: number, m: any) => sum + (Number(m.maxMarks) || 100), 0);
          avgAttainment = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
        }

        // Calculate course average attendance
        const courseAttendance = attendance.filter((a: any) =>
          a.course && (
            a.course.toLowerCase().includes(course.name.toLowerCase()) ||
            a.course.toLowerCase().includes(course.code.toLowerCase()) ||
            course.name.toLowerCase().includes(a.course.toLowerCase())
          )
        );

        let avgAttendance = 0;
        if (courseAttendance.length > 0) {
          const present = courseAttendance.filter((a: any) => a.status === 'Present').length;
          avgAttendance = Math.round((present / courseAttendance.length) * 100);
        }

        return {
          id: course.id,
          name: course.name,
          code: course.code,
          semester: course.semester,
          faculty: course.faculty,
          studentCount,
          averageAttainment: avgAttainment,
          averageAttendance: avgAttendance
        };
      });

    } catch (error) {
      console.error('Error loading real-time courses:', error);
      return [];
    }
  }

  /**
   * Get real-time assessments calculated from stored assessments & marks
   */
  private getRealTimeAssessments(courses: Course[]): Assessment[] {
    try {
      const storedAssessments = this.getSafeJson('obslmsAssessments');
      const marks = this.getSafeJson('obslmsMarkEntries');
      const allStudents = this.getSafeJson('obslmsStudents');

      if (storedAssessments.length === 0) {
        return [];
      }

      return storedAssessments.map((a: any) => {
        const courseMatch = courses.find(c =>
          c.id.toString() === (a.course || '').toString() ||
          c.name.toLowerCase() === (a.course || '').toLowerCase() ||
          c.code.toLowerCase() === (a.course || '').toLowerCase()
        );

        const courseName = courseMatch ? courseMatch.name : (a.course || 'General Assessment');
        const assessmentType = a.type || 'Assignment';
        const maxMarks = Number(a.maxMarks) || 100;

        // Count submitted marks for this assessment
        const submittedMarks = marks.filter((m: any) =>
          m.assessment && (
            m.assessment.toLowerCase() === assessmentType.toLowerCase() ||
            m.assessment.toLowerCase().includes(assessmentType.toLowerCase()) ||
            (courseMatch && m.assessment.toLowerCase().includes(courseMatch.code.toLowerCase()))
          )
        );

        const submittedCount = submittedMarks.length;

        // Total count = enrolled students for this course or submittedCount if greater
        const totalCount = courseMatch && courseMatch.studentCount > 0
          ? Math.max(courseMatch.studentCount, submittedCount)
          : (allStudents.length > 0 ? allStudents.length : Math.max(submittedCount, 0));

        // Average score
        let averageScore = 0;
        if (submittedMarks.length > 0) {
          const totalObt = submittedMarks.reduce((sum: number, m: any) => sum + (Number(m.obtained) || 0), 0);
          const totalMax = submittedMarks.reduce((sum: number, m: any) => sum + (Number(m.maxMarks) || maxMarks), 0);
          averageScore = totalMax > 0 ? Math.round((totalObt / totalMax) * 100) : 0;
        }

        // Real-time status based on due date and submissions
        let dueDateObj: Date | null = null;
        let status: 'pending' | 'ongoing' | 'completed' = 'pending';

        if (a.dueDate) {
          dueDateObj = new Date(a.dueDate);
          const now = new Date();
          if (dueDateObj < now && submittedCount > 0) {
            status = 'completed';
          } else if (submittedCount > 0) {
            status = 'ongoing';
          } else {
            status = 'pending';
          }
        } else if (submittedCount > 0) {
          status = 'ongoing';
        }

        return {
          id: a.id ? a.id.toString() : `ASM-${Math.random()}`,
          courseId: a.course || '',
          courseName,
          title: a.title || assessmentType,
          type: assessmentType.toLowerCase(),
          maxMarks,
          dueDate: dueDateObj,
          submittedCount,
          totalCount,
          status,
          averageScore
        };
      });

    } catch (error) {
      console.error('Error loading real-time assessments:', error);
      return [];
    }
  }

  /**
   * Calculate real student progress per student from actual marks and attendance
   */
  private getRealTimeStudentProgress(courses: Course[]): StudentProgress[] {
    try {
      const marks = this.getSafeJson('obslmsMarkEntries');
      const attendance = this.getSafeJson('obslmsAttendance');

      if (marks.length === 0 && attendance.length === 0) {
        return [];
      }

      const studentMap = new Map<string, {
        studentName: string;
        coursesSet: Set<string>;
        obtainedTotal: number;
        maxMarksTotal: number;
        assessmentCount: number;
        lastUpdate: Date;
      }>();

      // Aggregate marks
      marks.forEach((mark: any) => {
        if (!mark.student) return;
        const sKey = mark.student.trim().toLowerCase();

        if (!studentMap.has(sKey)) {
          studentMap.set(sKey, {
            studentName: mark.student.trim(),
            coursesSet: new Set(),
            obtainedTotal: 0,
            maxMarksTotal: 0,
            assessmentCount: 0,
            lastUpdate: new Date()
          });
        }

        const record = studentMap.get(sKey)!;
        record.obtainedTotal += Number(mark.obtained) || 0;
        record.maxMarksTotal += Number(mark.maxMarks) || 100;
        record.assessmentCount += 1;

        if (mark.assessment) {
          courses.forEach(c => {
            if (mark.assessment.toLowerCase().includes(c.name.toLowerCase()) || mark.assessment.toLowerCase().includes(c.code.toLowerCase())) {
              record.coursesSet.add(c.name);
            }
          });
        }
      });

      // Aggregate attendance into student map as well
      attendance.forEach((att: any) => {
        if (!att.student) return;
        const sKey = att.student.trim().toLowerCase();
        if (!studentMap.has(sKey)) {
          studentMap.set(sKey, {
            studentName: att.student.trim(),
            coursesSet: new Set(att.course ? [att.course] : []),
            obtainedTotal: 0,
            maxMarksTotal: 0,
            assessmentCount: 0,
            lastUpdate: new Date()
          });
        } else if (att.course) {
          studentMap.get(sKey)!.coursesSet.add(att.course);
        }
      });

      return Array.from(studentMap.values()).map(s => {
        // Calculate CO attainment %
        const coAttainment = s.maxMarksTotal > 0
          ? Math.round((s.obtainedTotal / s.maxMarksTotal) * 100)
          : 0;

        // Calculate student attendance %
        const studentAtt = attendance.filter((a: any) => a.student && a.student.trim().toLowerCase() === s.studentName.toLowerCase());
        let attendancePct = 0;
        if (studentAtt.length > 0) {
          const presentCount = studentAtt.filter((a: any) => a.status === 'Present').length;
          attendancePct = Math.round((presentCount / studentAtt.length) * 100);
        }

        const courseName = Array.from(s.coursesSet).join(', ') || (courses.length > 0 ? courses[0].name : 'Course');

        return {
          studentId: `STU-${s.studentName.replace(/\s+/g, '-').toUpperCase()}`,
          studentName: s.studentName,
          courseId: courses[0]?.id || 'C1',
          courseName,
          attendance: attendancePct,
          coAttainment,
          totalAssessments: s.assessmentCount,
          lastUpdate: s.lastUpdate
        };
      });

    } catch (error) {
      console.error('Error calculating real-time student progress:', error);
      return [];
    }
  }

  /**
   * Identify At-Risk students failing thresholds (Attainment < 60% or Attendance < 75%)
   */
  private calculateAtRiskStudents(courses: Course[], progressList: StudentProgress[]): AtRiskStudent[] {
    const atRisk: AtRiskStudent[] = [];

    progressList.forEach(sp => {
      const riskReasons: string[] = [];

      // Check attainment if assessments exist
      if (sp.totalAssessments > 0 && sp.coAttainment < 60) {
        riskReasons.push(`Low CO Attainment (${sp.coAttainment}% < 60%)`);
      }

      // Check attendance if attendance records exist
      if (sp.attendance > 0 && sp.attendance < 75) {
        riskReasons.push(`Low Attendance (${sp.attendance}% < 75%)`);
      }

      if (riskReasons.length > 0) {
        atRisk.push({
          studentName: sp.studentName,
          courseName: sp.courseName,
          attainmentPercentage: sp.coAttainment,
          attendancePercentage: sp.attendance,
          riskReasons,
          severity: riskReasons.length > 1 || sp.coAttainment < 40 ? 'High' : 'Medium'
        });
      }
    });

    return atRisk;
  }

  /**
   * Calculate real-time Course Outcome (CO) Attainments for courses
   */
  private calculateCourseCOAttainments(courses: Course[]): CourseCOAttainmentSummary[] {
    try {
      const coList = this.getSafeJson('obslmsCourseOutcomes');
      const coMappings = this.getSafeJson('obslmsAssessmentCOMappings');
      const marks = this.getSafeJson('obslmsMarkEntries');

      if (coList.length === 0) {
        return [];
      }

      // Filter coList to only include Course Outcomes for courses assigned to this faculty
      const facultyCourseCodes = new Set(courses.map(c => c.code.toLowerCase()));
      const facultyCourseNames = courses.map(c => c.name.toLowerCase());

      const filteredCoList = coList.filter((co: any) => {
        const coCourseLower = (co.course || '').toLowerCase().trim();
        if (!coCourseLower) return false;
        
        // Direct code match (e.g. "cs101" === "cs101")
        if (facultyCourseCodes.has(coCourseLower)) return true;

        // Code matches parts of the course name or vice versa
        return facultyCourseNames.some(name => 
          name.includes(coCourseLower) || coCourseLower.includes(name)
        );
      });

      return filteredCoList.map((co: any) => {
        const coCode = co.code || co.co || 'CO1';
        const description = co.description || '';
        const targetPercentage = Number(co.targetPercentage) || 75;
        
        // Find matching course to get full title
        const coCourseLower = (co.course || '').toLowerCase().trim();
        const matchedCourse = courses.find(c => 
          c.code.toLowerCase() === coCourseLower || 
          c.name.toLowerCase().includes(coCourseLower) || 
          coCourseLower.includes(c.name.toLowerCase())
        );
        const courseName = matchedCourse ? matchedCourse.name : (co.course || 'Course');

        // Find assessment mappings linked to this CO
        const linkedMappings = coMappings.filter((m: any) =>
          m.courseOutcomes && Array.isArray(m.courseOutcomes) && m.courseOutcomes.includes(coCode)
        );

        let totalObtained = 0;
        let totalMax = 0;
        const studentSet = new Set<string>();

        if (linkedMappings.length > 0) {
          linkedMappings.forEach((mapping: any) => {
            const mappedMarks = marks.filter((m: any) =>
              m.assessment && m.assessment.toLowerCase().includes(mapping.assessmentName.toLowerCase())
            );

            mappedMarks.forEach((m: any) => {
              totalObtained += Number(m.obtained) || 0;
              totalMax += Number(m.maxMarks) || mapping.maxMarks || 100;
              if (m.student) studentSet.add(m.student.toLowerCase());
            });
          });
        } else {
          // General mark calculation for this course if no explicit mapping
          const courseMarks = marks.filter((m: any) =>
            m.assessment && (m.assessment.toLowerCase().includes(courseName.toLowerCase()) || m.assessment.toLowerCase().includes(coCode.toLowerCase()))
          );

          courseMarks.forEach((m: any) => {
            totalObtained += Number(m.obtained) || 0;
            totalMax += Number(m.maxMarks) || 100;
            if (m.student) studentSet.add(m.student.toLowerCase());
          });
        }

        const attainmentPercentage = totalMax > 0
          ? Math.round((totalObtained / totalMax) * 100)
          : 0;

        let status: 'Achieved' | 'Partial' | 'Not Achieved' = 'Not Achieved';
        if (attainmentPercentage >= targetPercentage) {
          status = 'Achieved';
        } else if (attainmentPercentage >= 50) {
          status = 'Partial';
        }

        return {
          courseName,
          coCode,
          description,
          targetPercentage,
          attainmentPercentage,
          status,
          assessedStudentsCount: studentSet.size
        };
      });

    } catch (error) {
      console.error('Error calculating CO attainments:', error);
      return [];
    }
  }

  /**
   * Calculate grade distribution across all marks
   */
  private calculateGradeDistribution(courses: Course[]): GradeDistribution {
    const marks = this.getSafeJson('obslmsMarkEntries');
    
    let distinction = 0;
    let firstClass = 0;
    let pass = 0;
    let fail = 0;
    let totalEvaluated = 0;

    marks.forEach((m: any) => {
      if (m.obtained !== undefined && m.maxMarks) {
        const pct = (Number(m.obtained) / Number(m.maxMarks)) * 100;
        totalEvaluated++;
        if (pct >= 75) distinction++;
        else if (pct >= 60) firstClass++;
        else if (pct >= 40) pass++;
        else fail++;
      }
    });

    return {
      distinction,
      firstClass,
      pass,
      fail,
      totalEvaluated
    };
  }

  /**
   * Calculate overall attendance across courses
   */
  private calculateOverallAttendanceForCourses(courses: Course[]): number {
    const attendance = this.getSafeJson('obslmsAttendance');
    if (attendance.length === 0) return 0;

    const present = attendance.filter((a: any) => a.status === 'Present').length;
    return Math.round((present / attendance.length) * 100);
  }

  /**
   * Syllabus units & lecture logs
   */
  private getSyllabusUnitsForCourses(courses: Course[]): SyllabusUnit[] {
    const storedLogs = this.getSafeJson('obslmsLectureLogs') as LectureLog[];
    
    const defaultUnits: SyllabusUnit[] = [
      { unitNumber: 1, title: 'Unit 1: Foundations & Architecture', mappedCO: 'CO1', plannedLectures: 9, completedLectures: 0, status: 'Planned' },
      { unitNumber: 2, title: 'Unit 2: Relational Model & SQL Queries', mappedCO: 'CO2', plannedLectures: 10, completedLectures: 0, status: 'Planned' },
      { unitNumber: 3, title: 'Unit 3: Normalization & Indexing', mappedCO: 'CO3', plannedLectures: 10, completedLectures: 0, status: 'Planned' },
      { unitNumber: 4, title: 'Unit 4: Transaction & Concurrency Control', mappedCO: 'CO4', plannedLectures: 8, completedLectures: 0, status: 'Planned' },
      { unitNumber: 5, title: 'Unit 5: Advanced & Distributed Systems', mappedCO: 'CO5', plannedLectures: 8, completedLectures: 0, status: 'Planned' },
    ];

    return defaultUnits.map(unit => {
      const logsForUnit = storedLogs.filter(l => Number(l.unitNumber) === unit.unitNumber);
      const completed = logsForUnit.length;
      let status: 'Completed' | 'In Progress' | 'Planned' = 'Planned';
      if (completed >= unit.plannedLectures) {
        status = 'Completed';
      } else if (completed > 0) {
        status = 'In Progress';
      }

      return {
        ...unit,
        completedLectures: completed,
        status
      };
    });
  }

  saveLectureLog(log: Omit<LectureLog, 'id'>): void {
    try {
      const logs = this.getSafeJson('obslmsLectureLogs');
      logs.push({
        ...log,
        id: `LEC-${Date.now()}`
      });
      localStorage.setItem('obslmsLectureLogs', JSON.stringify(logs));
      this.syncService.emit('LECTURES_CHANGED', log);
    } catch (e) {
      console.error('Error saving lecture log:', e);
    }
  }

  /**
   * Generate real-time actionable notifications based on actual dates & thresholds
   */
  private generateRealTimeNotifications(
    courses: Course[],
    assessments: Assessment[],
    atRiskStudents: AtRiskStudent[],
    coAttainments: CourseCOAttainmentSummary[]
  ): Notification[] {
    const notifications: Notification[] = [];
    const now = new Date();

    // 1. Upcoming deadlines (within next 7 days)
    assessments.forEach(a => {
      if (a.dueDate) {
        const diffMs = a.dueDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 7) {
          notifications.push({
            id: `NOTIF-DUE-${a.id}`,
            title: `Assessment Deadline Soon: ${a.title}`,
            message: `${a.title} for ${a.courseName} is due in ${diffDays === 0 ? 'today' : diffDays + ' day(s)'}.`,
            type: 'alert',
            date: new Date(),
            read: false
          });
        }
      }
    });

    // 2. Pending submissions alert
    assessments.forEach(a => {
      if (a.status === 'ongoing' && a.submittedCount < a.totalCount && a.totalCount > 0) {
        const pending = a.totalCount - a.submittedCount;
        notifications.push({
          id: `NOTIF-PEND-${a.id}`,
          title: `Pending Submissions: ${a.title}`,
          message: `${pending} of ${a.totalCount} student submissions remain un-graded for ${a.courseName}.`,
          type: 'update',
          date: new Date(),
          read: false
        });
      }
    });

    // 3. At-Risk Alert
    if (atRiskStudents.length > 0) {
      notifications.push({
        id: `NOTIF-ATRISK-${Date.now()}`,
        title: `Academic Intervention Required`,
        message: `${atRiskStudents.length} student(s) are currently flagged At-Risk due to low attainment or attendance.`,
        type: 'alert',
        date: new Date(),
        read: false
      });
    }

    // 4. Low CO Attainment Alert
    const unachievedCOs = coAttainments.filter(co => co.status === 'Not Achieved' && co.attainmentPercentage > 0);
    if (unachievedCOs.length > 0) {
      notifications.push({
        id: `NOTIF-CO-${unachievedCOs[0].coCode}`,
        title: `CQI Review: ${unachievedCOs[0].coCode} Attainment Low`,
        message: `${unachievedCOs[0].coCode} attainment is currently ${unachievedCOs[0].attainmentPercentage}% (Target: ${unachievedCOs[0].targetPercentage}%). Continuous Quality Improvement plan needed.`,
        type: 'update',
        date: new Date(),
        read: false
      });
    }

    return notifications.slice(0, 5);
  }

  /**
   * Save a student mark entry into obslmsMarkEntries
   */
  saveStudentMark(mark: { student: string; assessment: string; obtained: number; maxMarks: number }): void {
    try {
      const marks = this.getSafeJson('obslmsMarkEntries');
      const existingIdx = marks.findIndex(
        (m: any) => m.student.toLowerCase() === mark.student.toLowerCase() && m.assessment.toLowerCase() === mark.assessment.toLowerCase()
      );

      let existingItem: any = null;
      if (existingIdx >= 0) {
        marks[existingIdx] = { ...marks[existingIdx], obtained: mark.obtained, maxMarks: mark.maxMarks };
        existingItem = marks[existingIdx];
      } else {
        existingItem = {
          student: mark.student.trim(),
          assessment: mark.assessment.trim(),
          obtained: Number(mark.obtained),
          maxMarks: Number(mark.maxMarks)
        };
        marks.push(existingItem);
      }
      localStorage.setItem('obslmsMarkEntries', JSON.stringify(marks));
      this.syncService.emit('MARKS_CHANGED', mark);

      const payload = {
        id: (existingItem.id && existingItem.id < 1000000000) ? existingItem.id : null,
        student: existingItem.student,
        assessment: existingItem.assessment,
        obtained: Number(existingItem.obtained),
        maxMarks: Number(existingItem.maxMarks)
      };
      this.http.post('http://localhost:8080/api/obe/marks', payload).subscribe();
    } catch (e) {
      console.error('Error saving student mark:', e);
    }
  }

  /**
   * Bulk save marks
   */
  bulkSaveMarks(marksList: Array<{ student: string; assessment: string; obtained: number; maxMarks: number }>): void {
    try {
      const existing = this.getSafeJson('obslmsMarkEntries');
      marksList.forEach(newMark => {
        const idx = existing.findIndex(
          (m: any) => m.student.toLowerCase() === newMark.student.toLowerCase() && m.assessment.toLowerCase() === newMark.assessment.toLowerCase()
        );
        let itemToSave: any = null;
        if (idx >= 0) {
          existing[idx].obtained = Number(newMark.obtained);
          existing[idx].maxMarks = Number(newMark.maxMarks);
          itemToSave = existing[idx];
        } else {
          itemToSave = {
            student: newMark.student.trim(),
            assessment: newMark.assessment.trim(),
            obtained: Number(newMark.obtained),
            maxMarks: Number(newMark.maxMarks)
          };
          existing.push(itemToSave);
        }

        const payload = {
          id: (itemToSave.id && itemToSave.id < 1000000000) ? itemToSave.id : null,
          student: itemToSave.student,
          assessment: itemToSave.assessment,
          obtained: Number(itemToSave.obtained),
          maxMarks: Number(itemToSave.maxMarks)
        };
        this.http.post('http://localhost:8080/api/obe/marks', payload).subscribe();
      });

      localStorage.setItem('obslmsMarkEntries', JSON.stringify(existing));
      this.syncService.emit('MARKS_CHANGED', marksList);
    } catch (e) {
      console.error('Error bulk saving marks:', e);
    }
  }

  /**
   * Bulk save attendance
   */
  saveBulkAttendance(records: Array<{ student: string; course: string; date: string; status: 'Present' | 'Absent' }>): void {
    try {
      const existing = this.getSafeJson('obslmsAttendance');
      records.forEach(rec => {
        const idx = existing.findIndex(
          (a: any) => a.student.toLowerCase() === rec.student.toLowerCase() && a.course.toLowerCase() === rec.course.toLowerCase() && a.date === rec.date
        );
        if (idx >= 0) {
          existing[idx].status = rec.status;
        } else {
          existing.push({
            id: Date.now() + Math.floor(Math.random() * 1000),
            student: rec.student.trim(),
            course: rec.course.trim(),
            date: rec.date,
            status: rec.status
          });
        }
      });
      localStorage.setItem('obslmsAttendance', JSON.stringify(existing));
      this.syncService.emit('ATTENDANCE_CHANGED', records);

      const payloads = records.map(rec => ({
        student: rec.student.trim(),
        courseCode: rec.course.trim(),
        date: rec.date,
        status: rec.status
      }));

      this.http.post('http://localhost:8080/api/attendance/bulk', payloads).subscribe({
        next: () => {
          console.log('Attendance bulk entries saved to MySQL.');
        },
        error: (err) => {
          console.error('Failed to save attendance to MySQL:', err);
        }
      });
    } catch (e) {
      console.error('Error saving bulk attendance:', e);
    }
  }

  /**
   * Continuous Quality Improvement (CQI) Actions
   */
  saveCqiAction(action: Omit<CqiAction, 'id' | 'loggedAt'>): void {
    try {
      const cqiList = this.getSafeJson('obslmsCqiActions');
      const newAction: CqiAction = {
        ...action,
        id: `CQI-${Date.now()}`,
        loggedAt: new Date().toISOString()
      };
      cqiList.push(newAction);
      localStorage.setItem('obslmsCqiActions', JSON.stringify(cqiList));
      this.syncService.emit('MARKS_CHANGED', newAction);
    } catch (e) {
      console.error('Error saving CQI action:', e);
    }
  }

  getCqiActions(): CqiAction[] {
    return this.getSafeJson('obslmsCqiActions');
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
