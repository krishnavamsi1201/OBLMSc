import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../../shared/navbar/navbar';
import { Sidebar } from '../../../shared/sidebar/sidebar';
import { Footer } from '../../../shared/footer/footer';

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
}

@Component({
  selector: 'app-assessment-co-mapping',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  templateUrl: './assessment-co-mapping.html',
  styleUrls: ['./assessment-co-mapping.css'],
})
export class AssessmentCOMapping implements OnInit {
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
      this.assessmentList = stored ? JSON.parse(stored) : [];
    } catch {
      this.assessmentList = [];
    }
  }

  private loadCourses(): void {
    try {
      const stored = localStorage.getItem('obslmsCourses');
      this.courseList = stored ? JSON.parse(stored) : [];
    } catch {
      this.courseList = [];
    }
  }

  private loadCourseOutcomes(): void {
    try {
      const stored = localStorage.getItem('obslmsCourseOutcomes');
      this.courseOutcomeList = stored ? JSON.parse(stored) : [];
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
                         m.courseOutcomes.join(',').includes(this.searchQuery.toUpperCase());
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
      alert('Please select assessment, course, and at least one course outcome');
      return;
    }

    // Check if this mapping already exists
    if (!this.isEditMode) {
      const exists = this.mappingList.some(
        m => m.assessmentId === this.formData.assessmentId && m.courseId === this.formData.courseId
      );
      if (exists) {
        alert('This assessment is already mapped to this course!');
        return;
      }
    }

    const assessment = this.assessmentList.find(a => a.id === this.formData.assessmentId);
    const course = this.courseList.find(c => c.id === this.formData.courseId);

    if (!assessment || !course) {
      alert('Invalid assessment or course selection');
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
    }

    this.saveMappingsToStorage();
    this.closeForm();
  }

  deleteMapping(id: string): void {
    if (confirm('Are you sure you want to remove this assessment-CO mapping?')) {
      this.mappingList = this.mappingList.filter(m => m.id !== id);
      this.saveMappingsToStorage();
    }
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
      alert('Error saving mapping data');
    }
  }

  private generateId(): string {
    return 'ACM-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  }

  getCOsByAssessment(assessmentName: string): string {
    const mappings = this.mappingList.filter(m => m.assessmentName === assessmentName);
    if (mappings.length === 0) return 'Not mapped';
    const cos = new Set<string>();
    mappings.forEach(m => m.courseOutcomes.forEach(co => cos.add(co)));
    return Array.from(cos).join(', ');
  }

  getAvailableOutcomes(): CourseOutcome[] {
    if (!this.formData.courseId) return [];
    return this.courseOutcomeList.filter(co => co.code.startsWith('CO'));
  }
}
