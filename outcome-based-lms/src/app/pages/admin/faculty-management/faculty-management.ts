import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../../shared/navbar/navbar';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { Footer } from '../../../shared/footer/footer';
import { ToastService } from '../../../shared/services/toast.service';
import { CourseService, AppCourse } from '../../../shared/services/course.service';
import { SyncService } from '../../../shared/services/sync.service';
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
  private courseService = inject(CourseService);
  private syncService = inject(SyncService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  facultyList: Faculty[] = [];
  filteredFacultyList: Faculty[] = [];
  allAvailableCourses: AppCourse[] = [];
  
  // Form fields
  showForm = false;
  isEditMode = false;
  currentId: string | null = null;
  
  // Form data
  formData = {
    name: '',
    email: '',
    password: '',
    department: 'Computer Science & Engineering',
    designation: 'Assistant Professor',
    selectedCourses: [] as string[]
  };

  // Filter and search
  searchQuery = '';
  filterDepartment = '';
  
  departments = [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication Engineering', 
    'Mechanical Engineering', 
    'Civil Engineering', 
    'Electrical & Electronics Engineering'
  ];
  
  designations = [
    'Assistant Professor', 
    'Associate Professor', 
    'Professor', 
    'Head of Department (HOD)',
    'Dean of Academics',
    'Lecturer'
  ];

  ngOnInit(): void {
    this.loadFaculty();
    this.loadCourses();
  }

  private loadFaculty(): void {
    this.facultyList = this.getSafeJson('obslmsFaculty') || [];
    this.filterFaculty();

    this.http.get<any[]>('http://localhost:8080/api/users').subscribe({
      next: (users) => {
        if (Array.isArray(users) && users.length > 0) {
          const backendFaculty = users
            .filter(u => u.role?.toUpperCase() === 'FACULTY')
            .map(u => {
              let courseList: string[] = [];
              if (u.enrolledCourses && typeof u.enrolledCourses === 'string') {
                courseList = u.enrolledCourses.split(',').map((s: string) => s.trim()).filter(Boolean);
              } else if (Array.isArray(u.assignedCourses)) {
                courseList = u.assignedCourses;
              }
              const dept = (u.department === 'Computer Science' || !u.department) ? 'Computer Science & Engineering' : u.department;
              return {
                id: u.id,
                name: u.name,
                email: u.email,
                department: dept,
                designation: u.designation || 'Assistant Professor',
                courses: courseList
              };
            });
          
          if (backendFaculty.length > 0) {
            this.facultyList = backendFaculty;
            try {
              localStorage.setItem('obslmsFaculty', JSON.stringify(this.facultyList));
            } catch {}
            this.filterFaculty();
            this.cdr.detectChanges();
          }
        }
      },
      error: () => {}
    });
  }

  private loadCourses(): void {
    this.allAvailableCourses = this.courseService.ensureCoursesInitialized();
    this.cdr.detectChanges();
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
    this.formData.password = 'Welcome@123';
  }

  openEditForm(faculty: Faculty): void {
    this.showForm = true;
    this.isEditMode = true;
    this.currentId = faculty.id;
    this.formData = {
      name: faculty.name,
      email: faculty.email,
      password: 'password',
      department: faculty.department,
      designation: faculty.designation,
      selectedCourses: faculty.courses ? [...faculty.courses] : []
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
      password: '',
      department: 'Computer Science & Engineering',
      designation: 'Assistant Professor',
      selectedCourses: []
    };
    this.currentId = null;
  }

  isCourseSelected(course: any): boolean {
    if (!course) return false;
    const title = typeof course === 'string' ? course : (course.title || '');
    const code = typeof course === 'string' ? course : (course.code || '');
    return this.formData.selectedCourses.some(sc => 
      (sc && title && sc.trim().toLowerCase() === title.trim().toLowerCase()) || 
      (sc && code && sc.trim().toLowerCase() === code.trim().toLowerCase())
    );
  }

  toggleCourseSelection(course: any): void {
    if (!course) return;
    const title = typeof course === 'string' ? course : (course.title || '');
    const code = typeof course === 'string' ? course : (course.code || '');
    const key = code || title;

    const idx = this.formData.selectedCourses.findIndex(sc => 
      (sc && title && sc.trim().toLowerCase() === title.trim().toLowerCase()) || 
      (sc && code && sc.trim().toLowerCase() === code.trim().toLowerCase())
    );

    if (idx !== -1) {
      this.formData.selectedCourses.splice(idx, 1);
    } else {
      this.formData.selectedCourses.push(key);
    }
  }

  saveFaculty(): void {
    if (!this.validateForm()) {
      this.toast.warning('Please fill all required fields (Name, Email, Department, Designation)');
      return;
    }

    const facultyId = this.currentId || this.generateId();
    const facultyName = this.formData.name.trim();
    const facultyEmail = this.formData.email.trim();
    const facultyPassword = this.formData.password.trim() || 'Welcome@123';
    const assignedCourses = [...this.formData.selectedCourses];

    const facultyObj: Faculty = {
      id: facultyId,
      name: facultyName,
      email: facultyEmail,
      department: this.formData.department.trim(),
      designation: this.formData.designation.trim(),
      courses: assignedCourses
    };

    // 1. Update Faculty List in state & localStorage
    if (this.isEditMode) {
      const idx = this.facultyList.findIndex(f => f.id === facultyId);
      if (idx !== -1) {
        this.facultyList[idx] = facultyObj;
      }
    } else {
      this.facultyList.unshift(facultyObj);
    }

    try {
      localStorage.setItem('obslmsFaculty', JSON.stringify(this.facultyList));
    } catch {}

    // 2. Save / Update User in Login Authentication Database (`obslmsUsersDatabase`)
    try {
      const storedUsers = localStorage.getItem('obslmsUsersDatabase');
      const usersList = storedUsers ? JSON.parse(storedUsers) : [];
      const userIdx = usersList.findIndex((u: any) => u.email?.toLowerCase() === facultyEmail.toLowerCase());

      const userRecord = {
        id: facultyId,
        name: facultyName,
        email: facultyEmail,
        password: facultyPassword,
        role: 'FACULTY',
        department: this.formData.department.trim(),
        designation: this.formData.designation.trim(),
        assignedCourses: assignedCourses
      };

      if (userIdx !== -1) {
        usersList[userIdx] = userRecord;
      } else {
        usersList.push(userRecord);
      }
      localStorage.setItem('obslmsUsersDatabase', JSON.stringify(usersList));
    } catch {}

    // 3. Update Course Allocations in `obslmsCourses` & `obslmsFacultyAllocations`
    try {
      const courses = this.courseService.getCoursesSync();
      let updatedCourses = false;

      courses.forEach(c => {
        if (assignedCourses.includes(c.title)) {
          c.faculty = facultyName;
          updatedCourses = true;
        } else if (c.faculty === facultyName && !assignedCourses.includes(c.title)) {
          c.faculty = 'Faculty Board';
          updatedCourses = true;
        }
      });

      if (updatedCourses) {
        localStorage.setItem('obslmsCourses', JSON.stringify(courses));
      }

      // Also record allocations
      const allocations = this.formData.selectedCourses.map((cTitle, idx) => ({
        id: `${facultyId}-${idx}`,
        facultyId: facultyId,
        facultyName: facultyName,
        courseId: facultyId,
        courseName: cTitle,
        subjectId: facultyId,
        subjectName: cTitle,
        semester: 'Semester 3'
      }));
      localStorage.setItem('obslmsFacultyAllocations', JSON.stringify(allocations));
      this.syncService.emit('COURSES_CHANGED');
    } catch {}

    this.filterFaculty();
    this.closeForm();
    this.toast.success(`Faculty account for "${facultyName}" saved with login credentials! 🎉`);
    this.cdr.detectChanges();

    // 4. Background Sync to Spring Boot Backend
    const payload = {
      id: facultyId,
      name: facultyName,
      email: facultyEmail,
      password: facultyPassword,
      role: 'FACULTY',
      department: this.formData.department.trim(),
      designation: this.formData.designation.trim(),
      assignedCourses: assignedCourses
    };

    this.http.post('http://localhost:8080/api/users', payload).subscribe({
      next: () => {
        this.loadFaculty();
      },
      error: () => {}
    });
  }

  deleteFaculty(id: string): void {
    const facultyToDelete = this.facultyList.find(f => f.id === id);
    this.facultyList = this.facultyList.filter(f => f.id !== id);
    
    try {
      localStorage.setItem('obslmsFaculty', JSON.stringify(this.facultyList));

      // Remove from users database
      const storedUsers = localStorage.getItem('obslmsUsersDatabase');
      if (storedUsers) {
        const usersList = JSON.parse(storedUsers);
        const filtered = usersList.filter((u: any) => u.id !== id && u.email !== facultyToDelete?.email);
        localStorage.setItem('obslmsUsersDatabase', JSON.stringify(filtered));
      }

      // Reset faculty on courses
      if (facultyToDelete) {
        const courses = this.courseService.getCoursesSync();
        courses.forEach(c => {
          if (c.faculty === facultyToDelete.name) {
            c.faculty = 'Faculty Board';
          }
        });
        localStorage.setItem('obslmsCourses', JSON.stringify(courses));
        this.syncService.emit('COURSES_CHANGED');
      }
    } catch {}

    this.filterFaculty();
    this.toast.info('Faculty member and credentials removed.');
    this.cdr.detectChanges();

    this.http.delete('http://localhost:8080/api/users/' + id).subscribe({
      next: () => {},
      error: () => {}
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

  private generateId(): string {
    return 'FAC-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }

  getCoursesDisplay(courses: string[]): string {
    return courses && courses.length > 0 ? courses.slice(0, 2).join(', ') + (courses.length > 2 ? `... +${courses.length - 2}` : '') : 'None';
  }
}
