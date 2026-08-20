import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../../shared/navbar/navbar';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { Footer } from '../../../shared/footer/footer';

interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  courses: string[];
}

@Component({
  selector: 'app-faculty-management',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  templateUrl: './faculty-management.html',
  styleUrls: ['./faculty-management.css'],
})
export class FacultyManagement implements OnInit {
  facultyList: Faculty[] = [];
  filteredFacultyList: Faculty[] = [];
  
  // Form fields
  showForm = false;
  isEditMode = false;
  currentId: string | null = null;
  
  // Form data
  formData = {
    name: '',
    email: '',
    department: '',
    designation: '',
    courses: ''
  };

  // Filter and search
  searchQuery = '';
  filterDepartment = '';
  
  departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical'];
  designations = ['Assistant Professor', 'Associate Professor', 'Professor', 'Lecturer'];
  courses: string[] = [];

  ngOnInit(): void {
    this.loadFaculty();
    this.loadCourses();
  }

  private loadFaculty(): void {
    try {
      const stored = localStorage.getItem('obslmsFaculty');
      this.facultyList = stored ? JSON.parse(stored) : [];
      this.filterFaculty();
    } catch {
      this.facultyList = [];
    }
  }

  private loadCourses(): void {
    try {
      const stored = localStorage.getItem('obslmsCourses');
      if (stored) {
        const coursesList = JSON.parse(stored);
        this.courses = coursesList.map((c: any) => c.name || c.code);
      }
    } catch {
      this.courses = [];
    }
  }

  private filterFaculty(): void {
    this.filteredFacultyList = this.facultyList.filter(f => {
      const matchSearch = f.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                         f.email.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchDept = this.filterDepartment === '' || f.department === this.filterDepartment;
      return matchSearch && matchDept;
    });
  }

  onSearchChange(): void {
    this.filterFaculty();
  }

  onFilterChange(): void {
    this.filterFaculty();
  }

  openAddForm(): void {
    this.showForm = true;
    this.isEditMode = false;
    this.resetForm();
  }

  openEditForm(faculty: Faculty): void {
    this.showForm = true;
    this.isEditMode = true;
    this.currentId = faculty.id;
    this.formData = {
      name: faculty.name,
      email: faculty.email,
      department: faculty.department,
      designation: faculty.designation,
      courses: faculty.courses.join(', ')
    };
  }

  closeForm(): void {
    this.showForm = false;
    this.resetForm();
  }

  private resetForm(): void {
    this.formData = {
      name: '',
      email: '',
      department: '',
      designation: '',
      courses: ''
    };
    this.currentId = null;
  }

  saveFaculty(): void {
    if (!this.validateForm()) {
      alert('Please fill all required fields');
      return;
    }

    const courseList = this.formData.courses
      .split(',')
      .map(c => c.trim())
      .filter(c => c);

    if (this.isEditMode && this.currentId) {
      // Update existing faculty
      const index = this.facultyList.findIndex(f => f.id === this.currentId);
      if (index !== -1) {
        this.facultyList[index] = {
          id: this.currentId,
          name: this.formData.name,
          email: this.formData.email,
          department: this.formData.department,
          designation: this.formData.designation,
          courses: courseList
        };
      }
    } else {
      // Add new faculty
      const newFaculty: Faculty = {
        id: this.generateId(),
        name: this.formData.name,
        email: this.formData.email,
        department: this.formData.department,
        designation: this.formData.designation,
        courses: courseList
      };
      this.facultyList.push(newFaculty);
    }

    this.saveFacultyToStorage();
    this.closeForm();
  }

  deleteFaculty(id: string): void {
    if (confirm('Are you sure you want to delete this faculty member?')) {
      this.facultyList = this.facultyList.filter(f => f.id !== id);
      this.saveFacultyToStorage();
    }
  }

  private validateForm(): boolean {
    return !!(
      this.formData.name.trim() &&
      this.formData.email.trim() &&
      this.formData.department &&
      this.formData.designation
    );
  }

  private saveFacultyToStorage(): void {
    try {
      localStorage.setItem('obslmsFaculty', JSON.stringify(this.facultyList));
      this.filterFaculty();
    } catch {
      alert('Error saving faculty data');
    }
  }

  private generateId(): string {
    return 'FAC-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }

  getCoursesDisplay(courses: string[]): string {
    return courses.length > 0 ? courses.slice(0, 2).join(', ') + (courses.length > 2 ? `... +${courses.length - 2}` : '') : 'None';
  }
}
