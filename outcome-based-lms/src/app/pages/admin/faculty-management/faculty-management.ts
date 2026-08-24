import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../../shared/navbar/navbar';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { Footer } from '../../../shared/footer/footer';
import { ToastService } from '../../../shared/services/toast.service';
import { HttpClient } from '@angular/common/http';

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
  private toast = inject(ToastService);
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

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  private loadFaculty(): void {
    this.http.get<any[]>('http://localhost:8080/api/users').subscribe({
      next: (users) => {
        this.facultyList = users
          .filter(u => u.role?.toUpperCase() === 'FACULTY')
          .map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            department: u.department || 'Computer Science',
            designation: 'Assistant Professor',
            courses: []
          }));
        this.filterFaculty();
        this.cdr.detectChanges();
      },
      error: () => {
        this.facultyList = [];
        this.filterFaculty();
      }
    });
  }

  private loadCourses(): void {
    this.http.get<any[]>('http://localhost:8080/api/courses').subscribe({
      next: (data) => {
        this.courses = data.map((c: any) => `${c.code ? c.code + ' - ' : ''}${c.title || c.name || 'Course'}`);
        this.cdr.detectChanges();
      },
      error: () => {
        this.courses = [];
      }
    });
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
      courses: (faculty.courses || []).join(', ')
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
      this.toast.warning('Please fill all required fields');
      return;
    }

    const payload = {
      id: this.currentId || this.generateId(),
      name: this.formData.name,
      email: this.formData.email,
      password: 'password',
      role: 'FACULTY',
      department: this.formData.department
    };

    this.http.post('http://localhost:8080/api/users', payload).subscribe({
      next: () => {
        this.loadFaculty();
        this.closeForm();
        this.toast.success(`Faculty member "${this.formData.name}" saved successfully.`);
      },
      error: () => {
        this.toast.error('Failed to save faculty to database.');
      }
    });
  }

  deleteFaculty(id: string): void {
    this.http.delete('http://localhost:8080/api/users/' + id).subscribe({
      next: () => {
        this.loadFaculty();
        this.toast.info('Faculty member removed.');
      },
      error: () => {
        this.toast.error('Failed to delete faculty member.');
      }
    });
  }

  downloadFacultyCsv(): void {
    if (this.facultyList.length === 0) {
      this.toast.warning('No faculty records to export.');
      return;
    }

    const headers = ['Faculty ID', 'Name', 'Email', 'Department', 'Designation', 'Assigned Courses'];
    const rows = this.facultyList.map(f => [
      `"${f.id}"`,
      `"${f.name}"`,
      `"${f.email}"`,
      `"${f.department}"`,
      `"${f.designation}"`,
      `"${(f.courses || []).join('; ')}"`
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Faculty_Roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toast.success('Faculty roster CSV downloaded successfully.');
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
      this.toast.error('Error saving faculty data');
    }
  }

  private generateId(): string {
    return 'FAC-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }

  getCoursesDisplay(courses: string[]): string {
    return courses && courses.length > 0 ? courses.slice(0, 2).join(', ') + (courses.length > 2 ? `... +${courses.length - 2}` : '') : 'None';
  }
}
