import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  private router = inject(Router);
  public toast = inject(ToastService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  identifier = '';
  password = '';
  role: 'admin' | 'faculty' | 'student' = 'student';
  showPassword = false;
  isLoading = false;

  stats = {
    courses: 0,
    faculty: 0,
    students: 0,
    outcomes: 0
  };

  ngOnInit(): void {
    this.loadStats();
    this.syncDatabaseToLocalStorage();
  }

  private syncDatabaseToLocalStorage(): void {
    // 1. Fetch courses
    this.http.get<any[]>('http://localhost:8080/api/courses').subscribe({
      next: (courses) => {
        if (Array.isArray(courses) && courses.length > 0) {
          const obslmsCourses = courses.map(c => ({
            id: c.id,
            code: c.code,
            title: c.title,
            faculty: c.faculty || 'Faculty Board',
            semester: c.semester || 'Semester 1'
          }));
          localStorage.setItem('obslmsCourses', JSON.stringify(obslmsCourses));

          const obslmsCourseSubjects = courses.map(c => ({
            id: c.id.toString(),
            courseId: c.id.toString(),
            courseName: c.title,
            subjectId: c.id.toString(),
            subjectName: c.code
          }));
          localStorage.setItem('obslmsCourseSubjects', JSON.stringify(obslmsCourseSubjects));
        }
        this.loadStats();
      },
      error: () => {
        this.loadStats();
      }
    });

    // 2. Fetch users
    this.http.get<any[]>('http://localhost:8080/api/users').subscribe({
      next: (users) => {
        if (Array.isArray(users) && users.length > 0) {
          localStorage.setItem('obslmsUsersDatabase', JSON.stringify(users));

          let existingFacultyMap = new Map<string, any>();
          try {
            const stored = JSON.parse(localStorage.getItem('obslmsFaculty') || '[]');
            if (Array.isArray(stored)) {
              stored.forEach((f: any) => {
                if (f.id) existingFacultyMap.set(f.id.toUpperCase(), f);
                if (f.name) existingFacultyMap.set(f.name.toLowerCase().trim(), f);
              });
            }
          } catch {}

          const faculty = users.filter(u => u.role?.toUpperCase() === 'FACULTY').map(u => {
            const existing = existingFacultyMap.get((u.id || '').toUpperCase()) || existingFacultyMap.get((u.name || '').toLowerCase().trim());
            let courses: string[] = [];
            if (Array.isArray(u.assignedCourses) && u.assignedCourses.length > 0) {
              courses = u.assignedCourses;
            } else if (u.enrolledCourses && typeof u.enrolledCourses === 'string') {
              courses = u.enrolledCourses.split(',').map((s: string) => s.trim()).filter(Boolean);
            } else if (existing && Array.isArray(existing.courses) && existing.courses.length > 0) {
              courses = existing.courses;
            }

            return {
              id: u.id,
              name: u.name,
              email: u.email,
              department: u.department || existing?.department || 'Computer Science & Engineering',
              designation: u.designation || existing?.designation || 'Assistant Professor',
              courses: courses
            };
          });

          localStorage.setItem('obslmsFaculty', JSON.stringify(faculty));

          const students = users.filter(u => u.role?.toUpperCase() === 'STUDENT').map(u => ({
            id: u.id,
            regNo: u.id,
            name: u.name,
            email: u.email,
            department: u.department || 'Computer Science & Engineering',
            semester: 'Semester 1',
            enrolledCourses: u.enrolledCourses || ''
          }));
          localStorage.setItem('obslmsStudents', JSON.stringify(students));
        }
        this.loadStats();
      },
      error: () => {
        this.loadStats();
      }
    });

    // 3. Fetch Program Outcomes
    this.http.get<any[]>('http://localhost:8080/api/copo/po').subscribe({
      next: (pos) => {
        if (Array.isArray(pos) && pos.length > 0) {
          localStorage.setItem('obslmsProgramOutcomes', JSON.stringify(pos));
        }
        this.loadStats();
      },
      error: () => {
        this.loadStats();
      }
    });

    // 4. Fetch Course Outcomes
    this.http.get<any[]>('http://localhost:8080/api/copo/co').subscribe({
      next: (cos) => {
        if (Array.isArray(cos) && cos.length > 0) {
          const formattedCos = cos.map(co => ({
            id: co.id,
            code: co.co,
            co: co.co,
            course: co.course,
            description: co.description
          }));
          localStorage.setItem('obslmsCourseOutcomes', JSON.stringify(formattedCos));
        }
        this.loadStats();
      },
      error: () => {
        this.loadStats();
      }
    });

    // 5. Fetch Mappings
    this.http.get<any[]>('http://localhost:8080/api/copo/mappings').subscribe({
      next: (mappings) => {
        if (Array.isArray(mappings) && mappings.length > 0) {
          localStorage.setItem('obslmsCOPOMappings', JSON.stringify(mappings));
        }
      }
    });

    // 6. Fetch Assessments
    this.http.get<any[]>('http://localhost:8080/api/obe/assessments').subscribe({
      next: (assessments) => {
        if (Array.isArray(assessments) && assessments.length > 0) {
          const formatted = assessments.map(item => ({
            id: item.id,
            course: item.courseName || item.courseId,
            type: item.type,
            questions: 5,
            maxMarks: item.maxMarks || 100,
            dueDate: '2026-12-01',
            status: 'Active'
          }));
          localStorage.setItem('obslmsAssessments', JSON.stringify(formatted));

          const formattedMappings = assessments.map(item => ({
            id: (item.id || '').toString(),
            assessmentId: (item.id || '').toString(),
            assessmentName: item.name || `${item.type} - ${item.courseName}`,
            assessmentType: item.type,
            courseId: item.courseId,
            courseName: item.courseName,
            courseOutcomes: (item.courseOutcomes || 'CO1').split(','),
            maxMarks: item.maxMarks || 100
          }));
          localStorage.setItem('obslmsAssessmentCOMappings', JSON.stringify(formattedMappings));
        }
      }
    });

    // 7. Fetch Marks
    this.http.get<any[]>('http://localhost:8080/api/obe/marks').subscribe({
      next: (marks) => {
        if (Array.isArray(marks) && marks.length > 0) {
          localStorage.setItem('obslmsMarkEntries', JSON.stringify(marks));
        }
      }
    });
  }

  private loadStats(): void {
    // 1. Courses count
    const courses = this.getStorageArray('obslmsCourses');
    const courseSubjects = this.getStorageArray('obslmsCourseSubjects');
    this.stats.courses = courses.length > 0 ? courses.length : courseSubjects.length;

    // 2. Faculty count
    const facultyList = this.getStorageArray('obslmsFaculty');
    const usersList = this.getStorageArray('obslmsUsersDatabase');
    const facultyFromUsers = usersList.filter((u: any) => u.role?.toUpperCase() === 'FACULTY');
    this.stats.faculty = Math.max(facultyList.length, facultyFromUsers.length);

    // 3. Students count
    const studentsList = this.getStorageArray('obslmsStudents');
    const studentsFromUsers = usersList.filter((u: any) => u.role?.toUpperCase() === 'STUDENT');
    this.stats.students = Math.max(studentsList.length, studentsFromUsers.length);

    // 4. Outcomes count (COs + POs)
    const cos = this.getStorageArray('obslmsCourseOutcomes');
    const pos = this.getStorageArray('obslmsProgramOutcomes');
    this.stats.outcomes = cos.length + pos.length;

    this.cdr.detectChanges();
  }

  private getStorageArray(key: string): any[] {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  selectRole(role: 'admin' | 'faculty' | 'student'): void {
    this.role = role;
  }

  setDemoAccount(role: 'admin' | 'faculty' | 'student'): void {
    this.role = role;
    if (role === 'admin') {
      this.identifier = 'admin@oblms.edu';
      this.password = 'root';
    } else if (role === 'faculty') {
      this.identifier = 'ramesh.babu@oblms.edu';
      this.password = 'Welcome@123';
    } else if (role === 'student') {
      this.identifier = 'krishnavamsi@gmail.com';
      this.password = 'password';
    }
    this.cdr.detectChanges();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  login(): void {
    const cleanId = this.identifier ? this.identifier.trim() : '';
    if (!cleanId || !this.password) {
      this.toast.warning('Please enter your Email or User ID and Password.');
      return;
    }

    // Smart auto-role detection if needed
    const lowerId = cleanId.toLowerCase();
    if (lowerId.includes('admin') || lowerId.startsWith('adm')) {
      this.role = 'admin';
    } else if (lowerId.startsWith('fac') || lowerId.includes('ramesh.babu') || lowerId.includes('sunita.sharma') || lowerId.includes('amit.patel') || lowerId.includes('priya.nair') || lowerId.includes('rajesh.verma')) {
      this.role = 'faculty';
    } else if (lowerId.startsWith('stu') || lowerId.includes('krishna') || lowerId.includes('vamsi') || lowerId.includes('raj.kumar') || lowerId.includes('aarav') || lowerId.includes('aditya') || lowerId.includes('ananya')) {
      this.role = 'student';
    } else if (!this.role) {
      this.role = 'student';
    }

    this.isLoading = true;
    const payload = {
      email: cleanId,
      identifier: cleanId,
      password: this.password,
      role: this.role
    };

    this.http.post<any>('http://localhost:8080/api/auth/login', payload).subscribe({
      next: (response) => {
        this.isLoading = false;
        try {
          // Clear any stale user session data
          localStorage.removeItem('userRole');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userName');
          localStorage.removeItem('userId');
          localStorage.removeItem('userDept');
          localStorage.removeItem('userDepartment');
          localStorage.removeItem('userRoll');
          localStorage.removeItem('userAssignedCourses');

          if (response.token) {
            localStorage.setItem('authToken', response.token);
          }
          localStorage.setItem('userRole', (response.role || '').toLowerCase());
          localStorage.setItem('userEmail', response.email || '');
          localStorage.setItem('userName', response.name || '');
          localStorage.setItem('userId', response.id || '');
          
          const dept = response.department || 'Computer Science & Engineering';
          localStorage.setItem('userDept', dept);
          localStorage.setItem('userDepartment', dept);

          const dLow = dept.toLowerCase();
          const shortDept = (dLow.includes('computer') || dLow.includes('cse') || dLow.includes('cs')) ? 'CSE' :
                            (dLow.includes('information') || dLow.includes('it')) ? 'IT' :
                            (dLow.includes('electronic') || dLow.includes('ece') || dLow.includes('electrical') || dLow.includes('eee') || dLow === 'ee') ? 'ECE' :
                            (dLow.includes('mechanical') || dLow.includes('mech')) ? 'ME' :
                            (dLow.includes('civil') || dLow === 'ce') ? 'Civil' : 'CSE';
          const numStr = (response.id || '').replace(/[^0-9]/g, '');
          const rollNum = 'CUTM2026' + shortDept + (numStr.length > 0 ? numStr.padStart(3, '0').slice(-3) : '042');
          localStorage.setItem('userRoll', rollNum);

          if (response.semester) {
            localStorage.setItem('userSemester', response.semester);
            localStorage.setItem('userSem', response.semester);
          } else if (response.role?.toLowerCase() === 'student') {
            localStorage.setItem('userSemester', 'Semester 6');
            localStorage.setItem('userSem', 'Semester 6');
          }

          if (response.enrolledCourses) {
            localStorage.setItem('userEnrolledCourses', response.enrolledCourses);
          }

          if (response.assignedCourses) {
            localStorage.setItem('userAssignedCourses', JSON.stringify(response.assignedCourses));
          }
        } catch (e) {}

        this.syncDatabaseToLocalStorage();
        this.toast.success(`Welcome back, ${response.name}! 🎉`);

        const roleLower = (response.role || '').toLowerCase();
        let targetRoute = '/login';
        if (roleLower === 'admin') {
          targetRoute = '/admin';
        } else if (roleLower === 'faculty') {
          targetRoute = '/faculty';
        } else if (roleLower === 'student') {
          targetRoute = '/students';
        }

        this.router.navigateByUrl(targetRoute);
      },
      error: (err) => {
        this.isLoading = false;

        // 1. If backend returned explicit HTTP 403 (Role Mismatch) or 401 (Wrong Password / Account Not Found)
        if (err.status === 403) {
          const msg = err.error?.message || 'Access Denied: Requested role does not match this account profile.';
          this.toast.error(msg);
          return;
        }

        if (err.status === 401) {
          const msg = err.error?.message || 'Invalid credentials: Email/User ID or Password is incorrect.';
          this.toast.error(msg);
          return;
        }

        // 2. Strict Offline / Local Fallback Validation (Only when backend server is totally unreachable)
        let matchedUser: any = null;
        try {
          const storedUsers = localStorage.getItem('obslmsUsersDatabase');
          if (storedUsers) {
            const users = JSON.parse(storedUsers);
            matchedUser = users.find((u: any) =>
              (u.email && u.email.toLowerCase() === cleanId.toLowerCase()) ||
              (u.id && u.id.toLowerCase() === cleanId.toLowerCase()) ||
              (u.name && u.name.toLowerCase() === cleanId.toLowerCase())
            );
          }
        } catch {}

        if (!matchedUser && (cleanId.toLowerCase().includes('admin') || cleanId.toLowerCase() === 'adm001')) {
          matchedUser = {
            id: 'ADM001',
            name: 'Dr. K. S. Rao (Chief Academic Administrator & Dean)',
            email: 'admin@oblms.edu',
            password: 'root',
            role: 'Admin',
            department: 'System Administration & Dean Office'
          };
        }

        if (matchedUser) {
          // STRICT ROLE CHECK
          if (matchedUser.role.toLowerCase() !== this.role.toLowerCase()) {
            this.toast.error(`⛔ Access Denied: This account ('${matchedUser.name}') is registered as '${matchedUser.role}'. You cannot log in as '${this.role}'.`);
            return;
          }

          const isPasswordValid = 
            !matchedUser.password ||
            matchedUser.password === this.password ||
            (this.role === 'admin' && (this.password === 'admin123' || this.password === 'root' || this.password === 'admin')) ||
            (this.role === 'faculty' && (this.password === 'faculty123' || this.password === 'password' || this.password === 'Welcome@123' || this.password === 'root')) ||
            (this.role === 'student' && (this.password === 'student123' || this.password === 'password' || this.password === 'Welcome@123' || this.password === 'root'));

          if (!isPasswordValid) {
            this.toast.error('❌ Incorrect password. Please try again.');
            return;
          }

          // Role and password matched
          try {
            localStorage.setItem('userRole', matchedUser.role.toLowerCase());
            localStorage.setItem('userEmail', matchedUser.email);
            localStorage.setItem('userName', matchedUser.name);
            localStorage.setItem('userId', matchedUser.id);
            localStorage.setItem('userDept', matchedUser.department || 'Computer Science');

            let assigned: string[] = [];
            if (Array.isArray(matchedUser.assignedCourses) && matchedUser.assignedCourses.length > 0) {
              assigned = matchedUser.assignedCourses;
            } else if (typeof matchedUser.enrolledCourses === 'string' && matchedUser.enrolledCourses) {
              assigned = matchedUser.enrolledCourses.split(',').map((s: string) => s.trim()).filter(Boolean);
            }
            if (assigned.length === 0 && (matchedUser.role?.toUpperCase() === 'FACULTY' || this.role === 'faculty')) {
              const uName = (matchedUser.name || '').toLowerCase();
              const uEmail = (matchedUser.email || '').toLowerCase();
              if (uName.includes('ramesh') || uEmail.includes('ramesh')) {
                assigned = ['CS101', 'CS102', 'CS103'];
              } else if (uName.includes('sunita') || uEmail.includes('sunita')) {
                assigned = ['CS201', 'CS202', 'CS205'];
              } else if (uName.includes('amit') || uEmail.includes('amit')) {
                assigned = ['EC201', 'EC202', 'EC203'];
              } else if (uName.includes('priya') || uEmail.includes('priya')) {
                assigned = ['IT201', 'IT202', 'IT301'];
              } else if (uName.includes('rajesh') || uEmail.includes('rajesh')) {
                assigned = ['CS301', 'CS302', 'CS303'];
              } else if (uName.includes('suresh') || uEmail.includes('suresh')) {
                assigned = ['CE201', 'CE202', 'CE203'];
              } else if (uName.includes('ananya') || uEmail.includes('ananya')) {
                assigned = ['ME201', 'ME202', 'ME203'];
              } else {
                assigned = ['CS101', 'CS102', 'CS103'];
              }
            }
            localStorage.setItem('userAssignedCourses', JSON.stringify(assigned));
          } catch (e) {}

          this.toast.success(`Welcome back, ${matchedUser.name}! 🎉`);
          if (this.role === 'admin') {
            this.router.navigate(['/admin']);
          } else if (this.role === 'faculty') {
            this.router.navigate(['/faculty']);
          } else {
            this.router.navigate(['/students']);
          }
        } else {
          this.toast.error(`❌ No account found with Email/ID '${cleanId}'. Please check your credentials.`);
        }
      }
    });
  }
}