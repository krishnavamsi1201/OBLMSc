import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../../shared/navbar/navbar';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { Footer } from '../../../shared/footer/footer';
import { ToastService } from '../../../shared/services/toast.service';

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
  }

  private loadStudents(): void {
    try {
      const stored = localStorage.getItem('obslmsStudents');
      this.studentList = stored ? JSON.parse(stored) : [];
      this.filterStudents();
    } catch {
      this.studentList = [];
    }
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

    if (this.isEditMode && this.currentId) {
      // Update existing student
      const index = this.studentList.findIndex(s => s.id === this.currentId);
      if (index !== -1) {
        this.studentList[index] = {
          id: this.currentId,
          regNo: this.formData.regNo,
          name: this.formData.name,
          email: this.formData.email,
          department: this.formData.department,
          semester: this.formData.semester
        };
        this.toast.success(`Student "${this.formData.name}" updated successfully.`);
      }
    } else {
      // Add new student
      const newStudent: Student = {
        id: this.generateId(),
        regNo: this.formData.regNo,
        name: this.formData.name,
        email: this.formData.email,
        department: this.formData.department,
        semester: this.formData.semester
      };
      this.studentList.push(newStudent);
      this.toast.success(`Student "${this.formData.name}" added successfully.`);
    }

    this.saveStudentToStorage();
    this.closeForm();
  }

  deleteStudent(id: string): void {
    const student = this.studentList.find(s => s.id === id);
    this.studentList = this.studentList.filter(s => s.id !== id);
    this.saveStudentToStorage();
    this.toast.info(`Student ${student ? student.name : ''} removed.`);
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
}
