import { Component, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../shared/services/toast.service';
import { CourseService } from '../../shared/services/course.service';

interface Assessment {
  id: number;
  course: string;
  type: string;
  questions: number;
  maxMarks: number;
  dueDate: string;
  status: string;
}

interface MarkEntry {
  id: number;
  student: string;
  assessment: string;
  obtained: number;
  maxMarks: number;
}

@Component({
  selector: 'app-assessments',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  templateUrl: './assessments.html',
  styleUrls: ['./assessments.css'],
})
export class Assessments implements OnInit {
  Math = Math;
  assessmentTypes = ['Assignment', 'Quiz', 'Mid Exam', 'Final Exam', 'Lab Exam'];

  role: string | null = null;
  userName = 'Student';

  assessments: Assessment[] = [];
  markEntries: MarkEntry[] = [];
  coursesList: any[] = [];
  studentsList: any[] = [];

  // Search & Filters
  searchAssessment = '';
  typeFilter = '';
  searchMarks = '';

  currentAssessment: Assessment = { id: 0, course: '', type: 'Assignment', questions: 5, maxMarks: 50, dueDate: '2026-10-15', status: 'Planned' };
  currentMark: MarkEntry = { id: 0, student: '', assessment: 'Assignment', obtained: 42, maxMarks: 50 };
  editAssessmentIndex = -1;

  normalizeType(rawType?: string, name?: string): string {
    const combined = ((rawType || '') + ' ' + (name || '')).toLowerCase();
    if (combined.includes('mid')) return 'Mid Exam';
    if (combined.includes('quiz')) return 'Quiz';
    if (combined.includes('assign')) return 'Assignment';
    if (combined.includes('final') || combined.includes('sem') || combined.includes('end')) return 'Final Exam';
    if (combined.includes('lab') || combined.includes('practic')) return 'Lab Exam';
    return rawType || 'Assignment';
  }

  countByType(type: string): number {
    return this.assessments.filter(a => this.normalizeType(a.type) === type).length;
  }

  getFacultyAssignedCourses(): string[] {
    let assigned: string[] = [];
    try {
      const stored = localStorage.getItem('userAssignedCourses');
      if (stored) assigned = JSON.parse(stored);
    } catch {}
    if (assigned.length === 0 && this.role === 'faculty') {
      const uName = (this.userName || '').toLowerCase();
      if (uName.includes('ramesh')) assigned = ['CS101', 'CS102', 'CS103'];
      else if (uName.includes('sunita')) assigned = ['CS201', 'CS202', 'CS205'];
      else if (uName.includes('amit')) assigned = ['EC201', 'EC202', 'EC203'];
      else if (uName.includes('priya')) assigned = ['IT201', 'IT202', 'IT301'];
      else if (uName.includes('rajesh')) assigned = ['CS301', 'CS302', 'CS303'];
      else if (uName.includes('suresh')) assigned = ['CE201', 'CE202', 'CE203'];
      else if (uName.includes('ananya')) assigned = ['ME201', 'ME202', 'ME203'];
      else assigned = ['CS101', 'CS102', 'CS103'];
    }
    return assigned;
  }

  get filteredAssessments(): Assessment[] {
    let list = this.assessments;
    if (this.role === 'faculty') {
      const myCourses = this.getFacultyAssignedCourses();
      list = list.filter(a =>
        myCourses.some(mc => (a.course || '').toLowerCase().includes(mc.toLowerCase()) || mc.toLowerCase().includes((a.course || '').toLowerCase()))
      );
    }
    if (this.typeFilter) {
      list = list.filter(a => this.normalizeType(a.type) === this.typeFilter);
    }
    if (this.searchAssessment.trim()) {
      const q = this.searchAssessment.toLowerCase();
      list = list.filter(a => 
        (a.course || '').toLowerCase().includes(q) ||
        (a.type || '').toLowerCase().includes(q) ||
        (a.status || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  get filteredMarkEntries(): MarkEntry[] {
    let list = this.markEntries;
    if (this.role === 'faculty') {
      const myCourses = this.getFacultyAssignedCourses();
      list = list.filter(m =>
        myCourses.some(mc => (m.assessment || '').toLowerCase().includes(mc.toLowerCase()) || mc.toLowerCase().includes((m.assessment || '').toLowerCase()))
      );
    }
    if (this.role === 'student') {
      const uname = (this.userName || localStorage.getItem('userName') || 'Student').toLowerCase();
      const specific = list.filter(m => 
        m.student.toLowerCase() === uname ||
        m.student.toLowerCase().includes(uname) ||
        uname.includes(m.student.toLowerCase())
      );
      list = specific.length > 0 ? specific : this.getDefaultMarks();
    }
    if (!this.searchMarks.trim()) return list;
    const q = this.searchMarks.toLowerCase();
    return list.filter(m => 
      m.student.toLowerCase().includes(q) ||
      m.assessment.toLowerCase().includes(q)
    );
  }

  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private courseService = inject(CourseService);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    try {
      this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
      this.userName = localStorage.getItem('userName') || 'Student';
    } catch {
      this.role = null;
    }
  }

  ngOnInit(): void {
    this.loadCourses();
    this.loadStudents();
    this.loadAssessments();
    this.loadMarks();
  }

  loadCourses(): void {
    // 1. First get sync from local cache
    let local = this.courseService.getCoursesSync();
    if (this.role === 'faculty') {
      const myCourses = this.getFacultyAssignedCourses();
      local = local.filter(c => 
        myCourses.some(mc => mc.toLowerCase() === (c.code || '').toLowerCase() || mc.toLowerCase() === (c.title || '').toLowerCase() || (c.title && c.title.toLowerCase().includes(mc.toLowerCase())))
      );
    }
    this.coursesList = local;
    if (!this.currentAssessment.course && this.coursesList.length > 0) {
      this.currentAssessment.course = this.coursesList[0].title;
    }
    this.cdr.detectChanges();

    // 2. Fetch from backend
    this.http.get<any[]>('http://localhost:8080/api/courses').subscribe({
      next: (courses) => {
        if (Array.isArray(courses) && courses.length > 0) {
          let list = courses;
          if (this.role === 'faculty') {
            const myCourses = this.getFacultyAssignedCourses();
            list = list.filter(c => 
              myCourses.some(mc => mc.toLowerCase() === (c.code || '').toLowerCase() || mc.toLowerCase() === (c.title || '').toLowerCase() || (c.title && c.title.toLowerCase().includes(mc.toLowerCase())))
            );
          }
          this.coursesList = list;
          if (!this.currentAssessment.course && this.coursesList.length > 0) {
            this.currentAssessment.course = this.coursesList[0].title;
          }
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  loadStudents(): void {
    this.http.get<any[]>('http://localhost:8080/api/users').subscribe({
      next: (users) => {
        if (Array.isArray(users) && users.length > 0) {
          this.studentsList = users.filter(u => u.role?.toUpperCase() === 'STUDENT');
          if (!this.currentMark.student && this.studentsList.length > 0) {
            this.currentMark.student = this.studentsList[0].name;
          }
          this.cdr.detectChanges();
        }
      },
      error: () => {
        try {
          const stored = localStorage.getItem('obslmsStudents');
          this.studentsList = stored ? JSON.parse(stored) : [];
          if (!this.currentMark.student && this.studentsList.length > 0) {
            this.currentMark.student = this.studentsList[0].name;
          }
        } catch {}
      }
    });
  }

  loadAssessments(): void {
    this.http.get<any[]>('http://localhost:8080/api/obe/assessments').subscribe({
      next: (data) => {
        let list: Assessment[] = [];
        if (Array.isArray(data) && data.length > 0) {
          list = data.map(item => ({
            id: item.id,
            course: item.courseName || item.courseId || item.assessmentName || 'Core Engineering Course',
            type: this.normalizeType(item.assessmentType || item.type, item.assessmentName),
            questions: item.questions || 5,
            maxMarks: item.maxMarks || 100,
            dueDate: item.dueDate || '2026-11-20',
            status: item.status || 'Active'
          }));
        }

        this.assessments = this.enrichStudentAssessments(list);
        this.cdr.detectChanges();
      },
      error: () => {
        this.assessments = this.enrichStudentAssessments([]);
        this.cdr.detectChanges();
      }
    });
  }

  enrichStudentAssessments(existing: Assessment[]): Assessment[] {
    const userDept = (localStorage.getItem('userDept') || localStorage.getItem('userDepartment') || 'CSE').toLowerCase();
    let studentAssessments: Assessment[] = [];

    if (userDept.includes('civil') || userDept === 'ce') {
      studentAssessments = [
        { id: 101, course: 'CE113 - Engineering Mechanics & Statics', type: 'Assignment', questions: 5, maxMarks: 25, dueDate: '2026-11-15', status: 'Active' },
        { id: 102, course: 'CE113 - Engineering Mechanics & Statics', type: 'Quiz', questions: 10, maxMarks: 20, dueDate: '2026-11-20', status: 'Active' },
        { id: 103, course: 'CE201 - Strength of Materials I', type: 'Mid Exam', questions: 6, maxMarks: 50, dueDate: '2026-10-25', status: 'Completed' },
        { id: 104, course: 'CE203 - Fluid Mechanics & Hydraulics', type: 'Final Exam', questions: 8, maxMarks: 100, dueDate: '2026-12-15', status: 'Planned' },
        { id: 105, course: 'CE202L - Surveying Field Practice Lab', type: 'Lab Exam', questions: 2, maxMarks: 50, dueDate: '2026-12-10', status: 'Planned' }
      ];
    } else if (userDept.includes('mech') || userDept.includes('me')) {
      studentAssessments = [
        { id: 101, course: 'ME113 - Engineering Mechanics & Statics', type: 'Assignment', questions: 5, maxMarks: 25, dueDate: '2026-11-15', status: 'Active' },
        { id: 102, course: 'ME201 - Engineering Thermodynamics', type: 'Quiz', questions: 10, maxMarks: 20, dueDate: '2026-11-20', status: 'Active' },
        { id: 103, course: 'ME202 - Strength of Materials & Solids', type: 'Mid Exam', questions: 6, maxMarks: 50, dueDate: '2026-10-25', status: 'Completed' },
        { id: 104, course: 'ME211 - Applied Thermodynamics & Steam', type: 'Final Exam', questions: 8, maxMarks: 100, dueDate: '2026-12-15', status: 'Planned' },
        { id: 105, course: 'ME211L - Thermal Engineering Lab', type: 'Lab Exam', questions: 2, maxMarks: 50, dueDate: '2026-12-10', status: 'Planned' }
      ];
    } else if (userDept.includes('elect') || userDept.includes('ece')) {
      studentAssessments = [
        { id: 101, course: 'EC114 - Basics of Electrical & Electronics', type: 'Assignment', questions: 5, maxMarks: 25, dueDate: '2026-11-15', status: 'Active' },
        { id: 102, course: 'EC201 - Electronic Devices & Physics', type: 'Quiz', questions: 10, maxMarks: 20, dueDate: '2026-11-20', status: 'Active' },
        { id: 103, course: 'EC202 - Digital Electronics & Logic Design', type: 'Mid Exam', questions: 6, maxMarks: 50, dueDate: '2026-10-25', status: 'Completed' },
        { id: 104, course: 'EC211 - Analog Circuits & Linear Amplifiers', type: 'Final Exam', questions: 8, maxMarks: 100, dueDate: '2026-12-15', status: 'Planned' },
        { id: 105, course: 'EC201L - Electronic Devices & Circuits Lab', type: 'Lab Exam', questions: 2, maxMarks: 50, dueDate: '2026-12-10', status: 'Planned' }
      ];
    } else if (userDept.includes('info') || userDept.includes('it')) {
      studentAssessments = [
        { id: 101, course: 'IT113 - Problem Solving with C', type: 'Assignment', questions: 5, maxMarks: 25, dueDate: '2026-11-15', status: 'Active' },
        { id: 102, course: 'IT201 - Data Structures using C++', type: 'Quiz', questions: 10, maxMarks: 20, dueDate: '2026-11-20', status: 'Active' },
        { id: 103, course: 'IT211 - Operating Systems Administration', type: 'Mid Exam', questions: 6, maxMarks: 50, dueDate: '2026-10-25', status: 'Completed' },
        { id: 104, course: 'IT301 - Computer Communication Networks', type: 'Final Exam', questions: 8, maxMarks: 100, dueDate: '2026-12-15', status: 'Planned' },
        { id: 105, course: 'IT201L - Data Structures Laboratory', type: 'Lab Exam', questions: 2, maxMarks: 50, dueDate: '2026-12-10', status: 'Planned' }
      ];
    } else {
      studentAssessments = [
        { id: 101, course: 'CS101 - Database Management Systems', type: 'Assignment', questions: 5, maxMarks: 25, dueDate: '2026-11-15', status: 'Active' },
        { id: 102, course: 'CS101 - Database Management Systems', type: 'Quiz', questions: 10, maxMarks: 20, dueDate: '2026-11-20', status: 'Active' },
        { id: 103, course: 'CS101 - Database Management Systems', type: 'Mid Exam', questions: 6, maxMarks: 50, dueDate: '2026-10-25', status: 'Completed' },
        { id: 104, course: 'CS101 - Database Management Systems', type: 'Final Exam', questions: 8, maxMarks: 100, dueDate: '2026-12-15', status: 'Planned' },
        { id: 105, course: 'CS102 - Data Structures & Algorithms', type: 'Assignment', questions: 4, maxMarks: 25, dueDate: '2026-11-18', status: 'Active' },
        { id: 106, course: 'CS102 - Data Structures & Algorithms', type: 'Quiz', questions: 10, maxMarks: 20, dueDate: '2026-11-22', status: 'Active' },
        { id: 107, course: 'CS102 - Data Structures & Algorithms', type: 'Mid Exam', questions: 6, maxMarks: 50, dueDate: '2026-10-28', status: 'Completed' },
        { id: 108, course: 'CS102 - Data Structures & Algorithms', type: 'Final Exam', questions: 8, maxMarks: 100, dueDate: '2026-12-18', status: 'Planned' },
        { id: 109, course: 'CS103 - Object-Oriented Programming with Java', type: 'Assignment', questions: 5, maxMarks: 25, dueDate: '2026-11-22', status: 'Active' },
        { id: 110, course: 'CS301 - Computer Networks & Protocols', type: 'Mid Exam', questions: 6, maxMarks: 50, dueDate: '2026-11-02', status: 'Completed' },
        { id: 111, course: 'CS302 - Software Engineering & Agile Methodology', type: 'Final Exam', questions: 8, maxMarks: 100, dueDate: '2026-12-24', status: 'Planned' },
        { id: 112, course: 'DS Lab - Data Structures Laboratory', type: 'Lab Exam', questions: 2, maxMarks: 50, dueDate: '2026-12-10', status: 'Planned' }
      ];
    }

    if (existing.length === 0) return studentAssessments;

    // Combine existing backend items, ensuring type is normalized
    const combined = [...existing];
    studentAssessments.forEach(sa => {
      const alreadyExists = combined.some(e => 
        (e.course || '').toLowerCase().includes(sa.course.split(' - ')[0].toLowerCase()) && 
        this.normalizeType(e.type) === sa.type
      );
      if (!alreadyExists) {
        combined.push(sa);
      }
    });
    return combined;
  }

  saveAssessments(): void {}

  loadMarks(): void {
    this.http.get<MarkEntry[]>('http://localhost:8080/api/obe/marks').subscribe({
      next: (data) => {
        let list = data;
        if (!Array.isArray(list) || list.length === 0) {
          list = this.getDefaultMarks();
        } else {
          const name = (this.userName || 'Student').toLowerCase();
          const hasUserMarks = list.some(m => m.student.toLowerCase() === name || m.student.toLowerCase().includes(name));
          if (!hasUserMarks) {
            list = [...this.getDefaultMarks(), ...list];
          }
        }
        this.markEntries = list;
        this.cdr.detectChanges();
      },
      error: () => {
        this.markEntries = this.getDefaultMarks();
        this.cdr.detectChanges();
      }
    });
  }

  getDefaultMarks(): MarkEntry[] {
    const student = this.userName || 'Student';
    const userDept = (localStorage.getItem('userDept') || localStorage.getItem('userDepartment') || 'CSE').toLowerCase();

    if (userDept.includes('civil') || userDept === 'ce') {
      return [
        { id: 1, student, assessment: 'CE113 - Engineering Mechanics Mid-Semester Examination', obtained: 44, maxMarks: 50 },
        { id: 2, student, assessment: 'CE201 - Strength of Materials I Quiz', obtained: 18, maxMarks: 20 },
        { id: 3, student, assessment: 'CE203 - Fluid Mechanics & Hydraulics Assignment', obtained: 23, maxMarks: 25 },
        { id: 4, student, assessment: 'CE202L - Surveying Field Practice Evaluation', obtained: 47, maxMarks: 50 }
      ];
    }
    if (userDept.includes('mech') || userDept.includes('me')) {
      return [
        { id: 1, student, assessment: 'ME113 - Engineering Mechanics Mid-Semester Examination', obtained: 45, maxMarks: 50 },
        { id: 2, student, assessment: 'ME201 - Engineering Thermodynamics Quiz', obtained: 18, maxMarks: 20 },
        { id: 3, student, assessment: 'ME202 - Strength of Materials & Solids Assignment', obtained: 24, maxMarks: 25 },
        { id: 4, student, assessment: 'ME211L - Thermal Engineering Practical Evaluation', obtained: 46, maxMarks: 50 }
      ];
    }
    if (userDept.includes('elect') || userDept.includes('ece')) {
      return [
        { id: 1, student, assessment: 'EC114 - Electrical & Electronics Mid-Semester Examination', obtained: 45, maxMarks: 50 },
        { id: 2, student, assessment: 'EC201 - Electronic Devices & Physics Quiz', obtained: 19, maxMarks: 20 },
        { id: 3, student, assessment: 'EC202 - Digital Electronics & Logic Design Assignment', obtained: 24, maxMarks: 25 },
        { id: 4, student, assessment: 'EC201L - Electronic Circuits Lab Evaluation', obtained: 48, maxMarks: 50 }
      ];
    }
    if (userDept.includes('info') || userDept.includes('it')) {
      return [
        { id: 1, student, assessment: 'IT113 - Problem Solving with C Mid-Semester Examination', obtained: 46, maxMarks: 50 },
        { id: 2, student, assessment: 'IT201 - Data Structures using C++ Quiz', obtained: 19, maxMarks: 20 },
        { id: 3, student, assessment: 'IT211 - Operating Systems Administration Assignment', obtained: 23, maxMarks: 25 },
        { id: 4, student, assessment: 'IT201L - Data Structures Practical Evaluation', obtained: 47, maxMarks: 50 }
      ];
    }
    return [
      { id: 1, student, assessment: 'CS101 - Mid-Semester Theory Examination', obtained: 46, maxMarks: 50 },
      { id: 2, student, assessment: 'CS101 - Relational Algebra & Normal Forms Quiz', obtained: 19, maxMarks: 20 },
      { id: 3, student, assessment: 'CS101 - ER Diagram & SQL Query Assignment', obtained: 24, maxMarks: 25 },
      { id: 4, student, assessment: 'CS102 - Mid-Semester Theory Examination', obtained: 45, maxMarks: 50 },
      { id: 5, student, assessment: 'CS102 - Time Complexity & Sorting Algorithms Quiz', obtained: 18, maxMarks: 20 },
      { id: 6, student, assessment: 'CS103 - Mid-Semester Theory Examination', obtained: 47, maxMarks: 50 },
      { id: 7, student, assessment: 'CS301 - Mid-Semester Theory Examination', obtained: 43, maxMarks: 50 },
      { id: 8, student, assessment: 'CS302 - Mid-Semester Theory Examination', obtained: 45, maxMarks: 50 },
      { id: 9, student, assessment: 'DS Lab - Continuous Practical Evaluation', obtained: 48, maxMarks: 50 }
    ];
  }

  saveMarksEntries(): void {}

  saveAssessment() {
    if (!this.currentAssessment.course || !this.currentAssessment.type || this.currentAssessment.questions <= 0 || this.currentAssessment.maxMarks <= 0 || !this.currentAssessment.dueDate) {
      return;
    }

    if (this.role !== 'faculty' && this.role !== 'admin') {
      this.toast.error('Only course faculty members and administrators can create or schedule assessments.');
      return;
    }

    const payload = {
      id: this.currentAssessment.id > 0 ? this.currentAssessment.id : null,
      assessmentName: `${this.currentAssessment.type} - ${this.currentAssessment.course}`,
      assessmentType: this.currentAssessment.type,
      courseId: this.currentAssessment.course,
      courseName: this.currentAssessment.course,
      courseOutcomes: 'CO1',
      maxMarks: this.currentAssessment.maxMarks
    };

    this.http.post('http://localhost:8080/api/obe/assessments', payload).subscribe({
      next: () => {
        this.toast.success(`Assessment for ${this.currentAssessment.course} scheduled successfully! 🎉`);
        this.loadAssessments();
        this.resetAssessmentForm();
      },
      error: () => {
        this.toast.error('Failed to save assessment.');
      }
    });
  }

  editAssessment(index: number) {
    this.editAssessmentIndex = index;
    this.currentAssessment = { ...this.assessments[index] };
  }

  deleteAssessment(index: number) {
    if (this.role !== 'faculty' && this.role !== 'admin') {
      this.toast.error('Only course faculty members and administrators can delete assessments.');
      return;
    }
    const target = this.assessments[index];
    this.http.delete('http://localhost:8080/api/obe/assessments/' + target.id).subscribe({
      next: () => {
        this.toast.info(`Assessment for ${target.course} removed.`);
        this.loadAssessments();
        this.resetAssessmentForm();
      },
      error: () => {
        this.toast.error('Failed to delete assessment.');
      }
    });
  }

  resetAssessmentForm() {
    this.editAssessmentIndex = -1;
    this.currentAssessment = { id: 0, course: '', type: 'Assignment', questions: 0, maxMarks: 0, dueDate: '', status: 'Planned' };
  }

  saveMarks() {
    if (this.role !== 'faculty' && this.role !== 'admin') {
      this.toast.error('Only course faculty members and administrators can enter or evaluate student marks.');
      return;
    }

    if (!this.currentMark.student || !this.currentMark.assessment || this.currentMark.obtained < 0 || this.currentMark.maxMarks <= 0) {
      this.toast.warning('Please select student, assessment, and valid marks.');
      return;
    }

    const payload = {
      id: null,
      student: this.currentMark.student,
      assessment: this.currentMark.assessment,
      obtained: this.currentMark.obtained,
      maxMarks: this.currentMark.maxMarks
    };

    this.http.post('http://localhost:8080/api/obe/marks', payload).subscribe({
      next: () => {
        this.toast.success(`Marks recorded for ${this.currentMark.student}! 🎉`);
        this.loadMarks();
        this.resetMarksForm();
      },
      error: () => {
        this.toast.error('Failed to save mark entry.');
      }
    });
  }

  resetMarksForm() {
    this.currentMark = { id: 0, student: '', assessment: 'Assignment', obtained: 0, maxMarks: 0 };
  }
}



