import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../../shared/navbar/navbar';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { Footer } from '../../../shared/footer/footer';
import { ToastService } from '../../../shared/services/toast.service';

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

  ngOnInit(): void {
    this.loadAssessments();
    this.loadCourses();
    this.loadCourseOutcomes();
    this.loadMappings();
  }

  private loadAssessments(): void {
    try {
      const stored = localStorage.getItem('obslmsAssessments');
      const assessments = stored ? JSON.parse(stored) : [];
      this.assessmentList = assessments.map((a: any) => ({
        id: (a.id || '').toString(),
        name: a.name || a.title || `${a.type || 'Assessment'} - ${a.course || ''}`,
        type: a.type || 'Exam'
      }));
    } catch {
      this.assessmentList = [];
    }
  }

  private loadCourses(): void {
    try {
      const stored = localStorage.getItem('obslmsCourses');
      const courses = stored ? JSON.parse(stored) : [];
      this.courseList = courses.map((c: any) => ({
        id: (c.id || '').toString(),
        name: c.title || c.name || c.code || 'Course',
        code: c.code || ''
      }));
    } catch {
      this.courseList = [];
    }
  }

  private loadCourseOutcomes(): void {
    try {
      const stored = localStorage.getItem('obslmsCourseOutcomes');
      const outcomes = stored ? JSON.parse(stored) : [];
      this.courseOutcomeList = outcomes.map((co: any) => ({
        id: (co.id || '').toString(),
        code: co.code || co.co || 'CO',
        description: co.description || '',
        course: co.course || ''
      }));
    } catch {
      this.courseOutcomeList = [];
    }
  }

  private loadMappings(): void {
    try {
      const stored = localStorage.getItem('obslmsAssessmentCOMappings');
      this.mappingList = stored ? JSON.parse(stored) : [];
      this.filterMappings();
    } catch {
      this.mappingList = [];
    }
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

    // Check if this mapping already exists
    if (!this.isEditMode) {
      const exists = this.mappingList.some(
        m => m.assessmentId === this.formData.assessmentId && m.courseId === this.formData.courseId
      );
      if (exists) {
        this.toast.error('This assessment is already mapped to this course!');
        return;
      }
    }

    const assessment = this.assessmentList.find(a => a.id === this.formData.assessmentId);
    const course = this.courseList.find(c => c.id === this.formData.courseId);

    if (!assessment || !course) {
      this.toast.error('Invalid assessment or course selection');
      return;
    }

    if (this.isEditMode && this.currentId) {
      const index = this.mappingList.findIndex(m => m.id === this.currentId);
      if (index !== -1) {
        this.mappingList[index] = {
          id: this.currentId,
          assessmentId: assessment.id,
          assessmentName: assessment.name,
          assessmentType: assessment.type,
          courseId: course.id,
          courseName: course.name,
          courseOutcomes: [...this.formData.courseOutcomes],
          maxMarks: this.formData.maxMarks
        };
        this.toast.success(`Assessment-CO mapping updated for "${assessment.name}".`);
      }
    } else {
      const newMapping: AssessmentCOMappingModel = {
        id: this.generateId(),
        assessmentId: assessment.id,
        assessmentName: assessment.name,
        assessmentType: assessment.type,
        courseId: course.id,
        courseName: course.name,
        courseOutcomes: [...this.formData.courseOutcomes],
        maxMarks: this.formData.maxMarks
      };
      this.mappingList.push(newMapping);
      this.toast.success(`Assessment "${assessment.name}" mapped to ${this.formData.courseOutcomes.join(', ')}.`);
    }

    this.saveMappingsToStorage();
    this.closeForm();
  }

  deleteMapping(id: string): void {
    const mapping = this.mappingList.find(m => m.id === id);
    this.mappingList = this.mappingList.filter(m => m.id !== id);
    this.saveMappingsToStorage();
    this.toast.info(`Assessment mapping for "${mapping?.assessmentName || 'Assessment'}" removed.`);
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
