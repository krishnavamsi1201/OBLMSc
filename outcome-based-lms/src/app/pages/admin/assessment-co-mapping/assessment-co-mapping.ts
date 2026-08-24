import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../../shared/navbar/navbar';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { Footer } from '../../../shared/footer/footer';
import { ToastService } from '../../../shared/services/toast.service';
import { HttpClient } from '@angular/common/http';

interface AssessmentCOMappingModel {
  id: string;
  assessmentId: string;
  assessmentName: string;
  assessmentType: string;
  courseId: string;
  courseName: string;
  courseOutcomes: string[]; // Array of CO IDs (CO1, CO2, etc.)
  maxMarks: number;
}

interface Assessment {
  id: string;
  name: string;
  type: string;
}

interface Course {
  id: string;
  name: string;
  code: string;
}

interface CourseOutcome {
  id: string;
  code: string;
  description: string;
  course?: string;
}

@Component({
  selector: 'app-assessment-co-mapping',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  templateUrl: './assessment-co-mapping.html',
  styleUrls: ['./assessment-co-mapping.css'],
})
export class AssessmentCOMapping implements OnInit {
  private toast = inject(ToastService);
  mappingList: AssessmentCOMappingModel[] = [];
  filteredMappingList: AssessmentCOMappingModel[] = [];
  
  assessmentList: Assessment[] = [];
  courseList: Course[] = [];
  courseOutcomeList: CourseOutcome[] = [];
  
  // Form fields
  showForm = false;
  isEditMode = false;
  currentId: string | null = null;
  
  // Form data
  formData = {
    assessmentId: '',
    courseId: '',
    courseOutcomes: [] as string[],
    maxMarks: 10
  };

  // Filter and search
  searchQuery = '';
  filterCourse = '';
  filterAssessmentType = '';

  assessmentTypes = ['Assignment', 'Quiz', 'Midterm', 'Practical', 'Project', 'Lab', 'Exam'];

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadAssessments();
    this.loadCourses();
    this.loadCourseOutcomes();
    this.loadMappings();
  }

  private loadAssessments(): void {
    this.http.get<any[]>('http://localhost:8080/api/obe/assessments').subscribe({
      next: (data) => {
        this.assessmentList = data.map((a: any) => ({
          id: (a.id || '').toString(),
          name: a.name || `${a.type} - ${a.courseName}`,
          type: a.type || 'Exam'
        }));
        this.cdr.detectChanges();
      },
      error: () => {
        this.assessmentList = [];
      }
    });
  }

  private loadCourses(): void {
    this.http.get<any[]>('http://localhost:8080/api/courses').subscribe({
      next: (data) => {
        this.courseList = data.map((c: any) => ({
          id: (c.id || '').toString(),
          name: c.title || c.name || c.code || 'Course',
          code: c.code || ''
        }));
        this.cdr.detectChanges();
      },
      error: () => {
        this.courseList = [];
      }
    });
  }

  private loadCourseOutcomes(): void {
    this.http.get<any[]>('http://localhost:8080/api/copo/co').subscribe({
      next: (data) => {
        this.courseOutcomeList = data.map((co: any) => ({
          id: (co.id || '').toString(),
          code: co.co || 'CO',
          description: co.description || '',
          course: co.course || ''
        }));
        this.cdr.detectChanges();
      },
      error: () => {
        this.courseOutcomeList = [];
      }
    });
  }

  private loadMappings(): void {
    this.http.get<any[]>('http://localhost:8080/api/obe/assessments').subscribe({
      next: (data) => {
        this.mappingList = data.map((item: any) => ({
          id: (item.id || '').toString(),
          assessmentId: (item.id || '').toString(),
          assessmentName: item.name || `${item.type} - ${item.courseName}`,
          assessmentType: item.type,
          courseId: item.courseId,
          courseName: item.courseName,
          courseOutcomes: (item.courseOutcomes || 'CO1').split(','),
          maxMarks: item.maxMarks || 100
        }));
        this.filterMappings();
        this.cdr.detectChanges();
      },
      error: () => {
        this.mappingList = [];
        this.filterMappings();
      }
    });
  }

  private filterMappings(): void {
    this.filteredMappingList = this.mappingList.filter(m => {
      const matchSearch = m.assessmentName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                         m.courseName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                         (m.courseOutcomes || []).join(',').includes(this.searchQuery.toUpperCase());
      const matchCourse = this.filterCourse === '' || m.courseId === this.filterCourse;
      const matchType = this.filterAssessmentType === '' || m.assessmentType === this.filterAssessmentType;
      return matchSearch && matchCourse && matchType;
    });
  }

  onSearchChange(): void {
    this.filterMappings();
  }

  onFilterChange(): void {
    this.filterMappings();
  }

  openAddForm(): void {
    this.showForm = true;
    this.isEditMode = false;
    this.resetForm();
  }

  openEditForm(mapping: AssessmentCOMappingModel): void {
    this.showForm = true;
    this.isEditMode = true;
    this.currentId = mapping.id;
    this.formData = {
      assessmentId: mapping.assessmentId,
      courseId: mapping.courseId,
      courseOutcomes: [...mapping.courseOutcomes],
      maxMarks: mapping.maxMarks
    };
  }

  closeForm(): void {
    this.showForm = false;
    this.resetForm();
  }

  private resetForm(): void {
    this.formData = {
      assessmentId: '',
      courseId: '',
      courseOutcomes: [],
      maxMarks: 10
    };
    this.currentId = null;
  }

  toggleCOSelection(coId: string): void {
    const index = this.formData.courseOutcomes.indexOf(coId);
    if (index > -1) {
      this.formData.courseOutcomes.splice(index, 1);
    } else {
      this.formData.courseOutcomes.push(coId);
    }
  }

  isCOSelected(coId: string): boolean {
    return this.formData.courseOutcomes.includes(coId);
  }

  saveMapping(): void {
    if (!this.validateForm()) {
      this.toast.warning('Please select assessment, course, and at least one course outcome');
      return;
    }

    const assessment = this.assessmentList.find(a => a.id === this.formData.assessmentId);
    const course = this.courseList.find(c => c.id === this.formData.courseId);

    if (!assessment || !course) {
      this.toast.error('Invalid assessment or course selection');
      return;
    }

    const payload = {
      id: (this.isEditMode && this.currentId) ? Number(this.currentId) : null,
      name: assessment.name,
      type: assessment.type,
      courseId: course.code,
      courseName: course.name,
      courseOutcomes: this.formData.courseOutcomes.join(','),
      maxMarks: this.formData.maxMarks
    };

    this.http.post('http://localhost:8080/api/obe/assessments', payload).subscribe({
      next: () => {
        this.loadMappings();
        this.closeForm();
        this.toast.success(`Assessment-CO mapping saved successfully.`);
      },
      error: () => {
        this.toast.error('Failed to save mapping to backend.');
      }
    });
  }

  deleteMapping(id: string): void {
    this.http.delete('http://localhost:8080/api/obe/assessments/' + id).subscribe({
      next: () => {
        this.loadMappings();
        this.toast.info('Assessment mapping removed.');
      },
      error: () => {
        this.toast.error('Failed to delete mapping.');
      }
    });
  }

  private validateForm(): boolean {
    return !!(
      this.formData.assessmentId &&
      this.formData.courseId &&
      this.formData.courseOutcomes.length > 0
    );
  }

  private saveMappingsToStorage(): void {
    try {
      localStorage.setItem('obslmsAssessmentCOMappings', JSON.stringify(this.mappingList));
      this.filterMappings();
    } catch {
      this.toast.error('Error saving mapping data');
    }
  }

  private generateId(): string {
    return 'ACM-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }

  getCOsByAssessment(assessmentName: string): string {
    const mappings = this.mappingList.filter(m => m.assessmentName === assessmentName);
    if (mappings.length === 0) return 'Not mapped';
    const cos = new Set<string>();
    mappings.forEach(m => (m.courseOutcomes || []).forEach(co => cos.add(co)));
    return Array.from(cos).join(', ');
  }

  getAvailableOutcomes(): CourseOutcome[] {
    if (!this.formData.courseId) return this.courseOutcomeList;
    const course = this.courseList.find(c => c.id === this.formData.courseId);
    return this.courseOutcomeList.filter(co => 
      !co.course || !course || co.course.toLowerCase().includes(course.name.toLowerCase()) || co.course.toLowerCase().includes(course.code.toLowerCase())
    );
  }
}
