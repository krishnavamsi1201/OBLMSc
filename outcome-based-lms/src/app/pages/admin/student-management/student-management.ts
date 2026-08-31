import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../../shared/navbar/navbar';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { Footer } from '../../../shared/footer/footer';
import { ToastService } from '../../../shared/services/toast.service';
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

  ngOnInit(): void {
    this.loadUsers();
    this.loadCourseRequests();
  }

  loadUsers(): void {
    this.http.get<any[]>('http://localhost:8080/api/users').subscribe({
      next: (users) => {
        this.studentList = users
          .filter(u => u.role?.toUpperCase() === 'STUDENT')
          .map(u => ({
            id: u.id,
            regNo: u.id,
            name: u.name,
            email: u.email,
            password: u.password || 'password',
            department: u.department || 'Computer Science & Engineering',
            semester: 'Semester 3'
          }));

        this.filterUsers();
        this.cdr.detectChanges();
      },
      error: () => {
        this.studentList = [];
        this.filterUsers();
      }
    });
  }

  filterUsers(): void {
    const q = this.searchQuery.toLowerCase().trim();

    this.filteredStudentList = this.studentList.filter(s => {
      const matchSearch = !q || s.name.toLowerCase().includes(q) ||
                         s.email.toLowerCase().includes(q) ||
                         s.regNo.toLowerCase().includes(q);
      const matchDept = !this.filterDepartment || s.department === this.filterDepartment;
      const matchSem = !this.filterSemester || s.semester === this.filterSemester;
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

    const payload = {
      id: this.formData.regNo.trim(),
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
        this.toast.info('Student removed.');
      },
      error: () => {
        this.toast.error('Failed to delete student.');
      }
    });
  }



  loadCourseRequests(): void {
    try {
      const stored = localStorage.getItem('obslmsCourseRequests');
      this.courseRequests = stored ? JSON.parse(stored) : [];
    } catch {
      this.courseRequests = [];
    }
  }

  approveEnrollment(request: any): void {
    request.status = 'Approved';
    try {
      localStorage.setItem('obslmsCourseRequests', JSON.stringify(this.courseRequests));

      const storedStudentCourses = localStorage.getItem('obslmsStudentCourses');
      const studentCourses = storedStudentCourses ? JSON.parse(storedStudentCourses) : [];
      if (!studentCourses.some((sc: any) => sc.studentName === request.studentName && sc.courseCode === request.courseCode)) {
        studentCourses.push({
          studentName: request.studentName,
          courseCode: request.courseCode,
          enrolledAt: new Date().toISOString()
        });
        localStorage.setItem('obslmsStudentCourses', JSON.stringify(studentCourses));
      }
      this.toast.success(`Enrollment approved for ${request.studentName}`);
    } catch {}
  }

  rejectEnrollment(request: any): void {
    request.status = 'Rejected';
    try {
      localStorage.setItem('obslmsCourseRequests', JSON.stringify(this.courseRequests));
      this.toast.info(`Enrollment rejected for ${request.studentName}`);
    } catch {}
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
