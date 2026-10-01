import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../../shared/navbar/navbar';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { Footer } from '../../../shared/footer/footer';
import { ToastService } from '../../../shared/services/toast.service';
import { SyncService } from '../../../shared/services/sync.service';
import { HttpClient } from '@angular/common/http';

interface Student {
  id: string;
  regNo: string;
  name: string;
  email: string;
  password?: string;
  department: string;
  semester: string;
}

interface FacultyUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  department: string;
  designation?: string;
}

@Component({
  selector: 'app-student-management',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  templateUrl: './student-management.html',
  styleUrls: ['./student-management.css'],
})
export class StudentManagement implements OnInit {
  private toast = inject(ToastService);
  private syncService = inject(SyncService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  activeTab: 'students' | 'requests' = 'students';

  studentList: Student[] = [];
  filteredStudentList: Student[] = [];

  courseRequests: any[] = [];
  
  // Student Form fields
  showForm = false;
  isEditMode = false;
  currentId: string | null = null;
  
  // Form data
  formData = {
    regNo: '',
    name: '',
    email: '',
    password: 'password',
    department: 'Computer Science & Engineering',
    semester: 'Semester 3'
  };

  // Filter and search
  searchQuery = '';
  filterDepartment = '';
  filterSemester = '';
  
  departments = [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical & Electronics Engineering'
  ];
  semesters = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'];

  // Pagination
  currentPage = 1;
  pageSize = 25;
  pageSizeOptions = [10, 25, 50, 100, 250];

  get totalPages(): number {
    return Math.ceil(this.filteredStudentList.length / this.pageSize) || 1;
  }

  get pagedStudentList(): Student[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredStudentList.slice(start, start + this.pageSize);
  }

  get startIndex(): number {
    return this.filteredStudentList.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredStudentList.length);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
  }

  private generateAllDefaultStudents(): Student[] {
    const list: Student[] = [];
    const branches = [
      { code: 'CSE', name: 'Computer Science & Engineering' },
      { code: 'IT', name: 'Information Technology' },
      { code: 'ECE', name: 'Electronics & Communication Engineering' },
      { code: 'ME', name: 'Mechanical Engineering' },
      { code: 'CE', name: 'Civil Engineering' },
      { code: 'EEE', name: 'Electrical & Electronics Engineering' }
    ];

    const firstNames = [
      'Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Ananya', 'Rohan', 'Divya', 
      'Aditya', 'Meera', 'Karthik', 'Pooja', 'Suresh', 'Harish', 'Aarav', 'Bhavya', 
      'Chaitanya', 'Deepak', 'Gautam', 'Ishaan', 'Kalyan', 'Kavya', 'Keerthi', 'Madhuri', 
      'Manoj', 'Naveen', 'Neha', 'Nikhil', 'Pranav', 'Prashanth', 'Rajesh', 'Rakesh', 
      'Riya', 'Rohit', 'Sai', 'Sameer', 'Sanjay', 'Santosh', 'Shreya', 'Sowmya', 
      'Srikanth', 'Surya', 'Swathi', 'Tarun', 'Varun', 'Venkatesh', 'Vikas', 'Vinay'
    ];

    const lastNames = [
      'Sharma', 'Patel', 'Reddy', 'Nair', 'Singh', 'Roy', 'Gupta', 'Sri',
      'Verma', 'Hegde', 'Rao', 'Kalyan', 'Pillai', 'Mishra', 'Joshi', 'Bhat',
      'Choudhury', 'Das', 'Menon', 'Prasad', 'Naidu', 'Babu', 'Sundaram', 'Sen'
    ];

    let nameIndex = 0;
    let globalCounter = 1;

    for (const b of branches) {
      for (let sem = 1; sem <= 8; sem++) {
        const semName = `Semester ${sem}`;
        for (let stuNum = 1; stuNum <= 5; stuNum++) {
          let stuId = '';
          let fullName = '';
          let email = '';

          if (b.code === 'CSE' && sem === 3 && stuNum === 1) {
            stuId = 'STU004';
            fullName = 'Krishna Vamsi';
            email = 'krishnavamsi1201@gmail.com';
          } else {
            if (globalCounter === 4) {
              globalCounter++; // Reserve STU004 for Krishna Vamsi
            }
            stuId = `STU${String(globalCounter).padStart(3, '0')}`;
            globalCounter++;

            const f = firstNames[nameIndex % firstNames.length];
            const l = lastNames[Math.floor(nameIndex / firstNames.length) % lastNames.length];
            nameIndex++;
            fullName = `${f} ${l}`;
            email = `${f.toLowerCase()}.${l.toLowerCase()}.${b.code.toLowerCase()}.s${sem}@oblms.edu`;
          }

          list.push({
            id: stuId,
            regNo: stuId,
            name: fullName,
            email: email,
            password: 'password',
            department: b.name,
            semester: semName
          });
        }
      }
    }
    return list;
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadCourseRequests();
  }

  loadUsers(): void {
    this.http.get<any[]>('http://localhost:8080/api/users').subscribe({
      next: (users) => {
        if (Array.isArray(users)) {
          const fetched = users.filter(u => u.role?.toUpperCase() === 'STUDENT');
          if (fetched.length > 0) {
            this.studentList = fetched.map((u, idx) => {
              const id = (u.id || `STU${100 + idx}`).toUpperCase();
              return {
                id: u.id || id,
                regNo: u.id || id,
                name: u.name || 'Student User',
                email: u.email || `${id.toLowerCase()}@oblms.edu`,
                password: u.password || 'password',
                department: this.normalizeDept(u.department),
                semester: this.parseStudentSemester(u)
              };
            });
            try {
              localStorage.setItem('obslmsStudents', JSON.stringify(this.studentList));
            } catch {}
            this.filterUsers();
            this.cdr.detectChanges();
            return;
          }
        }
        this.studentList = this.generateAllDefaultStudents();
        this.filterUsers();
        this.cdr.detectChanges();
      },
      error: () => {
        const defaultStudents = this.generateAllDefaultStudents();
        const studentMap = new Map<string, Student>();
        for (const def of defaultStudents) {
          studentMap.set(def.id.toUpperCase(), { ...def });
        }

        try {
          const stored = localStorage.getItem('obslmsStudents');
          const parsed = stored ? JSON.parse(stored) : null;
          if (Array.isArray(parsed) && parsed.length >= 240) {
            for (const s of parsed) {
              const id = (s.id || s.regNo || '').toUpperCase();
              if (id) {
                studentMap.set(id, {
                  ...s,
                  semester: this.parseStudentSemester(s),
                  department: this.normalizeDept(s.department)
                });
              }
            }
          }
        } catch {}

        this.studentList = Array.from(studentMap.values());

        try {
          localStorage.setItem('obslmsStudents', JSON.stringify(this.studentList));
        } catch {}

        this.filterUsers();
        this.cdr.detectChanges();
      }
    });
  }

  private parseStudentSemester(u: any): string {
    if (u && u.semester && typeof u.semester === 'string' && u.semester.trim().toLowerCase().startsWith('semester')) {
      return u.semester.trim();
    }
    const id = ((u?.id || u?.regNo || '') + '').toUpperCase();
    const match = id.match(/_S([1-8])_/);
    if (match) {
      return `Semester ${match[1]}`;
    }
    if (id === 'STU004') return 'Semester 3';
    if (id === 'STU001') return 'Semester 1';
    if (id === 'STU002') return 'Semester 3';
    if (id === 'STU003') return 'Semester 3';
    if (id === 'STU005') return 'Semester 4';
    if (id === 'STU006') return 'Semester 2';
    if (id === 'STU007') return 'Semester 4';
    if (id === 'STU008') return 'Semester 5';
    if (id === 'STU009') return 'Semester 2';
    if (id === 'STU010') return 'Semester 6';
    if (id === 'STU011') return 'Semester 1';
    if (id === 'STU012') return 'Semester 3';

    // Check enrolled courses
    const courses = ((u?.enrolledCourses || '') + '').toUpperCase();
    if (courses.includes('111') || courses.includes('112') || courses.includes('113')) return 'Semester 1';
    if (courses.includes('121') || courses.includes('122') || courses.includes('123')) return 'Semester 2';
    if (courses.includes('101') || courses.includes('102') || courses.includes('203')) return 'Semester 3';
    if (courses.includes('201') || courses.includes('205') || courses.includes('211')) return 'Semester 4';
    if (courses.includes('301') || courses.includes('202') || courses.includes('304')) return 'Semester 5';
    if (courses.includes('302') || courses.includes('303') || courses.includes('311')) return 'Semester 6';
    if (courses.includes('401') || courses.includes('402')) return 'Semester 7';
    if (courses.includes('411') || courses.includes('498') || courses.includes('412')) return 'Semester 8';

    return 'Semester 1';
  }

  private normalizeDept(deptName?: string): string {
    if (!deptName) return 'Computer Science & Engineering';
    const d = deptName.toLowerCase().trim();
    if (d.includes('info') || d === 'it') return 'Information Technology';
    if (d.includes('electr') && (d.includes('comm') || d.includes('ece'))) return 'Electronics & Communication Engineering';
    if (d.includes('mech') || d === 'me') return 'Mechanical Engineering';
    if (d.includes('civil') || d === 'ce') return 'Civil Engineering';
    if (d.includes('electr') || d === 'eee') return 'Electrical & Electronics Engineering';
    if (d.includes('comp') || d.includes('cse') || d.includes('cs')) return 'Computer Science & Engineering';
    return deptName;
  }

  private inferSemester(id?: string, index: number = 0): string {
    const sems = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'];
    return sems[index % sems.length];
  }

  private isMatchingDept(studentDept: string, filterDept: string): boolean {
    const s = (studentDept || '').toLowerCase().trim();
    const f = (filterDept || '').toLowerCase().trim();
    if (s === f) return true;
    if (s.includes(f) || f.includes(s)) return true;

    // Abbreviations
    if ((f.includes('computer') || f === 'cse') && (s.includes('computer') || s.includes('cse'))) return true;
    if ((f.includes('information') || f === 'it') && (s.includes('information') || s.includes('it'))) return true;
    if ((f.includes('communication') || f === 'ece') && (s.includes('communication') || s.includes('ece'))) return true;
    if ((f.includes('mech') || f === 'me') && (s.includes('mech') || s.includes('me'))) return true;
    if ((f.includes('civil') || f === 'ce') && (s.includes('civil') || s.includes('ce'))) return true;
    if ((f.includes('electrical') || f === 'eee') && (s.includes('electrical') || s.includes('eee'))) return true;

    return false;
  }

  filterUsers(): void {
    const q = this.searchQuery ? this.searchQuery.toLowerCase().trim() : '';
    const targetDept = this.filterDepartment ? this.filterDepartment.trim() : '';
    const targetSem = this.filterSemester ? this.filterSemester.trim() : '';

    this.filteredStudentList = this.studentList.filter(s => {
      // 1. Search filter: Matches Name, Email, RegNo, Department, Semester
      const matchSearch = !q ||
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.regNo && s.regNo.toLowerCase().includes(q)) ||
        (s.id && s.id.toLowerCase().includes(q)) ||
        (s.department && s.department.toLowerCase().includes(q)) ||
        (s.semester && s.semester.toLowerCase().includes(q));

      // 2. Department filter: If empty or "All Departments" / "All", match everything
      let matchDept = true;
      if (targetDept && targetDept !== '' && !targetDept.toLowerCase().includes('all')) {
        matchDept = this.isMatchingDept(s.department, targetDept);
      }

      // 3. Semester filter: If empty or "All Semesters" / "All", match everything
      let matchSem = true;
      if (targetSem && targetSem !== '' && !targetSem.toLowerCase().includes('all')) {
        const studentSem = (s.semester || '').toLowerCase().trim();
        const fSem = targetSem.toLowerCase().trim();
        matchSem = studentSem === fSem || studentSem.includes(fSem) || fSem.includes(studentSem);
      }

      return matchSearch && matchDept && matchSem;
    });
  }

  onSearchChange(): void {
    this.filterUsers();
  }

  onFilterChange(): void {
    this.filterUsers();
  }

  switchTab(tab: 'students' | 'requests'): void {
    this.activeTab = tab;
    this.filterUsers();
  }

  copyCredentials(id: string, email: string, role: string, password?: string): void {
    const pwd = password || 'password';
    const text = `User ID: ${id}\nEmail: ${email}\nRole: ${role}\nPassword: ${pwd}`;
    navigator.clipboard.writeText(text).then(() => {
      this.toast.success(`Copied credentials for ${id}! 📋`);
    }).catch(() => {
      this.toast.info(`ID: ${id} | Email: ${email} | Password: ${pwd}`);
    });
  }

  openAddForm(): void {
    this.showForm = true;
    this.isEditMode = false;
    this.resetForm();
  }

  openEditForm(student: Student): void {
    this.showForm = true;
    this.isEditMode = true;
    this.currentId = student.id;
    this.formData = {
      regNo: student.regNo,
      name: student.name,
      email: student.email,
      password: student.password || 'password',
      department: student.department,
      semester: student.semester
    };
  }

  closeForm(): void {
    this.showForm = false;
    this.resetForm();
  }

  private resetForm(): void {
    this.formData = {
      regNo: '',
      name: '',
      email: '',
      password: 'password',
      department: 'Computer Science & Engineering',
      semester: 'Semester 1'
    };
    this.currentId = null;
  }

  saveStudent(): void {
    if (!this.validateStudentForm()) {
      this.toast.warning('Please fill all required student fields');
      return;
    }

    const studentId = (this.isEditMode && this.currentId) ? this.currentId : this.formData.regNo.trim();
    const payload = {
      id: studentId,
      name: this.formData.name.trim(),
      email: this.formData.email.trim(),
      password: this.formData.password.trim() || 'password',
      role: 'STUDENT',
      department: this.formData.department
    };

    const newStudent: Student = {
      id: studentId,
      regNo: studentId,
      name: this.formData.name.trim(),
      email: this.formData.email.trim(),
      password: this.formData.password.trim() || 'password',
      department: this.formData.department,
      semester: this.formData.semester || 'Semester 1'
    };

    if (this.isEditMode && this.currentId) {
      const idx = this.studentList.findIndex(s => s.id === this.currentId);
      if (idx !== -1) {
        this.studentList[idx] = newStudent;
      } else {
        this.studentList.unshift(newStudent);
      }
    } else {
      this.studentList.unshift(newStudent);
    }

    try {
      localStorage.setItem('obslmsStudents', JSON.stringify(this.studentList));

      const storedUsers = localStorage.getItem('obslmsUsersDatabase');
      const usersList = storedUsers ? JSON.parse(storedUsers) : [];
      const filteredUsers = usersList.filter((u: any) => u.id !== studentId && u.email !== payload.email);
      filteredUsers.push(payload);
      localStorage.setItem('obslmsUsersDatabase', JSON.stringify(filteredUsers));
    } catch {}

    this.filterUsers();
    this.closeForm();
    this.syncService.emit('STUDENTS_CHANGED', payload);
    this.toast.success(`Student "${this.formData.name}" saved with login credentials! 🎉`);
    this.cdr.detectChanges();

    this.http.post('http://localhost:8080/api/users', payload).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: () => {}
    });
  }

  deleteStudent(id: string): void {
    if (!confirm('Are you sure you want to remove this student profile?')) {
      return;
    }

    // 1. Remove from local memory and storage
    this.studentList = this.studentList.filter(s => s.id !== id && s.regNo !== id);
    try {
      localStorage.setItem('obslmsStudents', JSON.stringify(this.studentList));

      const storedUsers = localStorage.getItem('obslmsUsersDatabase');
      if (storedUsers) {
        const usersList = JSON.parse(storedUsers);
        if (Array.isArray(usersList)) {
          const filtered = usersList.filter((u: any) => u.id !== id && u.regNo !== id);
          localStorage.setItem('obslmsUsersDatabase', JSON.stringify(filtered));
        }
      }
    } catch {}

    this.filterUsers();
    this.cdr.detectChanges();
    this.toast.info('Student removed.');
    this.syncService.emit('STUDENTS_CHANGED', { id });

    // 2. Persist deletion in Spring Boot Database
    this.http.delete('http://localhost:8080/api/users/' + id).subscribe({
      next: () => {
        this.loadUsers();
      },
      error: () => {}
    });
  }



  loadCourseRequests(): void {
    this.http.get<any[]>('http://localhost:8080/api/courses/requests').subscribe({
      next: (requests) => {
        this.courseRequests = requests || [];
        this.cdr.detectChanges();
      },
      error: () => {
        try {
          const stored = localStorage.getItem('obslmsCourseRequests');
          this.courseRequests = stored ? JSON.parse(stored) : [];
        } catch {
          this.courseRequests = [];
        }
      }
    });
  }

  approveEnrollment(request: any): void {
    if (request.id && typeof request.id === 'number') {
      this.http.put(`http://localhost:8080/api/courses/requests/${request.id}/approve`, {}).subscribe({
        next: () => {
          request.status = 'Approved';
          this.toast.success(`Enrollment approved & recorded in database for ${request.studentName}! 🎉`);
          this.loadCourseRequests();
          this.loadUsers();
          this.cdr.detectChanges();
        },
        error: () => {
          this.toast.error('Failed to update approval in database.');
        }
      });
    } else {
      request.status = 'Approved';
      this.toast.success(`Enrollment approved for ${request.studentName}`);
    }
  }

  rejectEnrollment(request: any): void {
    if (request.id && typeof request.id === 'number') {
      this.http.put(`http://localhost:8080/api/courses/requests/${request.id}/reject`, { remarks: 'Rejected by Administrator' }).subscribe({
        next: () => {
          request.status = 'Rejected';
          this.toast.info(`Enrollment rejected in database for ${request.studentName}`);
          this.loadCourseRequests();
          this.cdr.detectChanges();
        },
        error: () => {
          this.toast.error('Failed to reject request in database.');
        }
      });
    } else {
      request.status = 'Rejected';
      this.toast.info(`Enrollment rejected for ${request.studentName}`);
    }
  }

  downloadUserListCsv(): void {
    const list = this.studentList;
    if (list.length === 0) {
      this.toast.warning('No student records to export.');
      return;
    }

    const headers = ['User ID', 'Full Name', 'Department', 'Email Address', 'Login Password'];
    const rows = list.map(s => [
      `"${s.id}"`,
      `"${s.name}"`,
      `"${s.department}"`,
      `"${s.email}"`,
      `"${s.password || 'password'}"`
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Student_Roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toast.success('Student roster CSV downloaded successfully.');
  }

  private validateStudentForm(): boolean {
    return !!(
      this.formData.regNo.trim() &&
      this.formData.name.trim() &&
      this.formData.email.trim() &&
      this.formData.department &&
      this.formData.semester
    );
  }
}
