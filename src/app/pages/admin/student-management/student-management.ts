import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../../shared/navbar/navbar';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { Footer } from '../../../shared/footer/footer';

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
      alert('Please fill all required fields');
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
    }

    this.saveStudentToStorage();
    this.closeForm();
  }

  deleteStudent(id: string): void {
    if (confirm('Are you sure you want to delete this student?')) {
      this.studentList = this.studentList.filter(s => s.id !== id);
      this.saveStudentToStorage();
    }
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
      alert('Error saving student data');
    }
  }

  private generateId(): string {
    return 'STU-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }
}
