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

  // Accredited Default Students across all branches
  private defaultAccreditedStudents: Student[] = [
    { id: 'STU004', regNo: 'STU004', name: 'Krishna Vamsi', email: 'krishnavamsi1201@gmail.com', password: 'password', department: 'Computer Science & Engineering', semester: 'Semester 3' },
    { id: 'STU001', regNo: 'STU001', name: 'Rahul Sharma', email: 'rahul.sharma@oblms.edu', password: 'password', department: 'Computer Science & Engineering', semester: 'Semester 1' },
    { id: 'STU013', regNo: 'STU013', name: 'Aditya Verma', email: 'aditya.verma@oblms.edu', password: 'password', department: 'Computer Science & Engineering', semester: 'Semester 5' },
    { id: 'STU002', regNo: 'STU002', name: 'Priya Patel', email: 'priya.patel@oblms.edu', password: 'password', department: 'Information Technology', semester: 'Semester 3' },
    { id: 'STU005', regNo: 'STU005', name: 'Sneha Reddy', email: 'sneha.reddy@oblms.edu', password: 'password', department: 'Information Technology', semester: 'Semester 4' },
    { id: 'STU014', regNo: 'STU014', name: 'Rohan Sharma', email: 'rohan.it@oblms.edu', password: 'password', department: 'Information Technology', semester: 'Semester 6' },
    { id: 'STU003', regNo: 'STU003', name: 'Amit Kumar', email: 'amit.kumar@oblms.edu', password: 'password', department: 'Electronics & Communication Engineering', semester: 'Semester 3' },
    { id: 'STU006', regNo: 'STU006', name: 'Rajesh Varma', email: 'rajesh.ece@oblms.edu', password: 'password', department: 'Electronics & Communication Engineering', semester: 'Semester 2' },
    { id: 'STU015', regNo: 'STU015', name: 'Meera Nair', email: 'meera.ece@oblms.edu', password: 'password', department: 'Electronics & Communication Engineering', semester: 'Semester 7' },
    { id: 'STU007', regNo: 'STU007', name: 'Vikram Singh', email: 'vikram.singh@oblms.edu', password: 'password', department: 'Mechanical Engineering', semester: 'Semester 4' },
    { id: 'STU010', regNo: 'STU010', name: 'Manoj Kumar', email: 'manoj.mech@oblms.edu', password: 'password', department: 'Mechanical Engineering', semester: 'Semester 6' },
    { id: 'STU016', regNo: 'STU016', name: 'Suresh Pillai', email: 'suresh.mech@oblms.edu', password: 'password', department: 'Mechanical Engineering', semester: 'Semester 2' },
    { id: 'STU008', regNo: 'STU008', name: 'Ananya Roy', email: 'ananya.roy@oblms.edu', password: 'password', department: 'Civil Engineering', semester: 'Semester 5' },
    { id: 'STU011', regNo: 'STU011', name: 'Karthik Rao', email: 'karthik.civil@oblms.edu', password: 'password', department: 'Civil Engineering', semester: 'Semester 1' },
    { id: 'STU017', regNo: 'STU017', name: 'Pooja Hegde', email: 'pooja.civil@oblms.edu', password: 'password', department: 'Civil Engineering', semester: 'Semester 8' },
    { id: 'STU009', regNo: 'STU009', name: 'Rohan Gupta', email: 'rohan.gupta@oblms.edu', password: 'password', department: 'Electrical & Electronics Engineering', semester: 'Semester 2' },
    { id: 'STU012', regNo: 'STU012', name: 'Divya Sri', email: 'divya.eee@oblms.edu', password: 'password', department: 'Electrical & Electronics Engineering', semester: 'Semester 3' },
    { id: 'STU018', regNo: 'STU018', name: 'Harish Kalyan', email: 'harish.eee@oblms.edu', password: 'password', department: 'Electrical & Electronics Engineering', semester: 'Semester 4' }
  ];

  ngOnInit(): void {
    this.loadUsers();
    this.loadCourseRequests();
  }

  loadUsers(): void {
    this.http.get<any[]>('http://localhost:8080/api/users').subscribe({
      next: (users) => {
        const fetchedStudents: Student[] = users
          .filter(u => u.role?.toUpperCase() === 'STUDENT')
          .map((u, idx) => ({
            id: u.id || `STU${100 + idx}`,
            regNo: u.id || `STU${100 + idx}`,
            name: u.name || 'Student User',
            email: u.email || `${u.id || 'student'}@oblms.edu`,
            password: u.password || 'password',
            department: this.normalizeDept(u.department),
            semester: u.semester || this.inferSemester(u.id, idx)
          }));

        // Merge fetched students with default branch students if any branch is missing
        const combined = [...fetchedStudents];
        for (const def of this.defaultAccreditedStudents) {
          if (!combined.some(s => s.id.toUpperCase() === def.id.toUpperCase() || s.email.toLowerCase() === def.email.toLowerCase())) {
            combined.push(def);
          }
        }

        this.studentList = combined;

        try {
          localStorage.setItem('obslmsStudents', JSON.stringify(this.studentList));
        } catch {}

        this.filterUsers();
        this.cdr.detectChanges();
      },
      error: () => {
        try {
          const stored = localStorage.getItem('obslmsStudents');
          this.studentList = stored ? JSON.parse(stored) : [...this.defaultAccreditedStudents];
        } catch {
          this.studentList = [...this.defaultAccreditedStudents];
        }
        if (this.studentList.length === 0) {
          this.studentList = [...this.defaultAccreditedStudents];
        }
        this.filterUsers();
        this.cdr.detectChanges();
      }
    });
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

    this.http.post('http://localhost:8080/api/users', payload).subscribe({
      next: () => {
        this.loadUsers();
        this.closeForm();
        this.syncService.emit('STUDENTS_CHANGED', payload);
        this.toast.success(`Student "${this.formData.name}" saved with login credentials! 🎉`);
      },
      error: () => {
        this.toast.error('Failed to save student to database.');
      }
    });
  }

  deleteStudent(id: string): void {
    this.http.delete('http://localhost:8080/api/users/' + id).subscribe({
      next: () => {
        this.loadUsers();
        this.syncService.emit('STUDENTS_CHANGED', { id });
        this.toast.info('Student removed.');
      },
      error: () => {
        this.toast.error('Failed to delete student.');
      }
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
