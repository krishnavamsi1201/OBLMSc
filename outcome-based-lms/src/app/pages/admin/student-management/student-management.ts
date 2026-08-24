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
  department: string;
  semester: string;
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
  studentList: Student[] = [];
  filteredStudentList: Student[] = [];
  
  // Form fields
  showForm = false;
  isEditMode = false;
  currentId: string | null = null;
  
  // Form data
  formData = {
    regNo: '',
    name: '',
    email: '',
    department: '',
    semester: ''
  };

  // Filter and search
  searchQuery = '';
  filterDepartment = '';
  filterSemester = '';
  
  departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical'];
  semesters = ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4', 'Semester 5', 'Semester 6', 'Semester 7', 'Semester 8'];

  ngOnInit(): void {
    this.loadStudents();
    this.loadCourseRequests();
  }

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  private loadStudents(): void {
    this.http.get<any[]>('http://localhost:8080/api/users').subscribe({
      next: (users) => {
        this.studentList = users
          .filter(u => u.role?.toUpperCase() === 'STUDENT')
          .map(u => ({
            id: u.id,
            regNo: u.id,
            name: u.name,
            email: u.email,
            department: u.department || 'Computer Science',
            semester: 'Semester 1'
          }));
        this.filterStudents();
        this.cdr.detectChanges();
      },
      error: () => {
        this.studentList = [];
        this.filterStudents();
      }
    });
  }

  private filterStudents(): void {
    this.filteredStudentList = this.studentList.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                         s.email.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                         s.regNo.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchDept = this.filterDepartment === '' || s.department === this.filterDepartment;
      const matchSem = this.filterSemester === '' || s.semester === this.filterSemester;
      return matchSearch && matchDept && matchSem;
    });
  }

  onSearchChange(): void {
    this.filterStudents();
  }

  onFilterChange(): void {
    this.filterStudents();
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
      department: '',
      semester: ''
    };
    this.currentId = null;
  }

  saveStudent(): void {
    if (!this.validateForm()) {
      this.toast.warning('Please fill all required fields');
      return;
    }

    const payload = {
      id: this.formData.regNo,
      name: this.formData.name,
      email: this.formData.email,
      password: 'password',
      role: 'STUDENT',
      department: this.formData.department
    };

    this.http.post('http://localhost:8080/api/users', payload).subscribe({
      next: () => {
        this.loadStudents();
        this.closeForm();
        this.toast.success(`Student "${this.formData.name}" saved successfully.`);
      },
      error: () => {
        this.toast.error('Failed to save student to database.');
      }
    });
  }

  deleteStudent(id: string): void {
    this.http.delete('http://localhost:8080/api/users/' + id).subscribe({
      next: () => {
        this.loadStudents();
        this.toast.info('Student removed.');
      },
      error: () => {
        this.toast.error('Failed to delete student.');
      }
    });
  }

  downloadStudentListCsv(): void {
    if (this.studentList.length === 0) {
      this.toast.warning('No student records to export.');
      return;
    }

    const headers = ['Student ID', 'Register No', 'Full Name', 'Department', 'Semester', 'Email Address'];
    const rows = this.studentList.map(s => [
      `"${s.id}"`,
      `"${s.regNo}"`,
      `"${s.name}"`,
      `"${s.department}"`,
      `"${s.semester}"`,
      `"${s.email}"`
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

  private validateForm(): boolean {
    return !!(
      this.formData.regNo.trim() &&
      this.formData.name.trim() &&
      this.formData.email.trim() &&
      this.formData.department &&
      this.formData.semester
    );
  }

  private saveStudentToStorage(): void {
    try {
      localStorage.setItem('obslmsStudents', JSON.stringify(this.studentList));
      this.filterStudents();
    } catch {
      this.toast.error('Error saving student data');
    }
  }

  private generateId(): string {
    return 'STU-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }

  courseRequests: any[] = [];

  loadCourseRequests(): void {
    const stored = localStorage.getItem('obslmsCourseRequests');
    const allRequests = stored ? JSON.parse(stored) : [];
    this.courseRequests = allRequests.filter((r: any) => r.status === 'Pending');
  }

  approveEnrollment(req: any): void {
    const storedRequests = localStorage.getItem('obslmsCourseRequests');
    const requests = storedRequests ? JSON.parse(storedRequests) : [];
    
    const idx = requests.findIndex((r: any) => r.id === req.id);
    if (idx >= 0) {
      requests[idx].status = 'Approved';
      localStorage.setItem('obslmsCourseRequests', JSON.stringify(requests));
    }

    // Add to obslmsStudentCourses
    const storedStudentCourses = localStorage.getItem('obslmsStudentCourses');
    const studentCourses = storedStudentCourses ? JSON.parse(storedStudentCourses) : [];
    
    const exists = studentCourses.some((sc: any) => 
      sc.studentName.toLowerCase() === req.studentName.toLowerCase() && 
      sc.courseCode.toLowerCase() === req.courseCode.toLowerCase()
    );
    
    if (!exists) {
      studentCourses.push({
        studentName: req.studentName,
        courseCode: req.courseCode
      });
      localStorage.setItem('obslmsStudentCourses', JSON.stringify(studentCourses));
    }

    // Save to backend database
    const storedUsers = localStorage.getItem('obslmsUsersDatabase');
    const users = storedUsers ? JSON.parse(storedUsers) : [];
    const dbUser = users.find((u: any) => u.name.toLowerCase() === req.studentName.toLowerCase());
    if (dbUser) {
      const currentList = dbUser.enrolledCourses ? dbUser.enrolledCourses.split(',') : [];
      const codeTrimmed = req.courseCode.trim();
      if (!currentList.some((c: string) => c.trim().toLowerCase() === codeTrimmed.toLowerCase())) {
        currentList.push(codeTrimmed);
        dbUser.enrolledCourses = currentList.join(',');
        
        this.http.post('http://localhost:8080/api/users', dbUser).subscribe({
          next: () => {
            console.log('Enrolled courses saved in MySQL.');
          }
        });
      }
    }

    this.toast.success(`Enrollment request approved for student "${req.studentName}" in course "${req.courseCode}".`);
    this.loadCourseRequests();
  }

  rejectEnrollment(req: any): void {
    const storedRequests = localStorage.getItem('obslmsCourseRequests');
    const requests = storedRequests ? JSON.parse(storedRequests) : [];
    
    const idx = requests.findIndex((r: any) => r.id === req.id);
    if (idx >= 0) {
      requests[idx].status = 'Rejected';
      localStorage.setItem('obslmsCourseRequests', JSON.stringify(requests));
    }

    this.toast.info(`Enrollment request rejected for student "${req.studentName}".`);
    this.loadCourseRequests();
  }
}
