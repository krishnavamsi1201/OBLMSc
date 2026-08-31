import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { ToastService } from '../../shared/services/toast.service';
import { HttpClient } from '@angular/common/http';

interface ProgramOutcome {
  id: number;
  poNumber: string;
  description: string;
}

interface CourseOutcome {
  id: number;
  course: string;
  co: string;
  description?: string;
}

interface CoMapping {
  id: number;
  course: string;
  co: string;
  po: string;
  contribution: number;
  mappingLevel: number;
  status: 'Pending' | 'Approved';
}

@Component({
  selector: 'app-copo-mapping',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  templateUrl: './copo-mapping.html',
  styleUrls: ['./copo-mapping.css']
})
export class CopoMapping implements OnInit {
  private toast = inject(ToastService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  role: string | null = null;

  programOutcomes: ProgramOutcome[] = [];
  courseOutcomes: CourseOutcome[] = [];
  courses: string[] = [];
  selectedCourseOutcomeKey = '';

  newPoNumber = '';
  newPoDescription = '';
  newCoCourse = '';
  newCoCode = '';
  newCoDescription = '';

  mappingLevels = [
    { value: 1, label: '1 - Low (Slight focus <30%)' },
    { value: 2, label: '2 - Medium (Moderate focus 30-60%)' },
    { value: 3, label: '3 - High (Substantial focus >60%)' }
  ];

  showMatrix = true;
  mappings: CoMapping[] = [];

  currentMapping: CoMapping = { id: 0, course: '', co: '', po: '', contribution: 0, mappingLevel: 0, status: 'Pending' };
  editIndex = -1;

  constructor() {
    try {
      this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
    } catch {
      this.role = null;
    }
  }

  ngOnInit(): void {
    this.loadData();
    this.loadCourses();
    this.resetMapping();
  }

  loadData() {
    this.loadProgramOutcomes();
    this.loadCourseOutcomes();
    this.loadMappings();
  }

  private loadProgramOutcomes() {
    this.http.get<ProgramOutcome[]>('http://localhost:8080/api/copo/po').subscribe({
      next: (data) => {
        this.programOutcomes = data;
        this.cdr.detectChanges();
      }
    });
  }

  private loadCourseOutcomes() {
    this.http.get<CourseOutcome[]>('http://localhost:8080/api/copo/co').subscribe({
      next: (data) => {
        let list = data;
        if (this.role === 'faculty') {
          let assigned: string[] = [];
          try {
            const stored = localStorage.getItem('userAssignedCourses');
            if (stored) assigned = JSON.parse(stored);
          } catch {}
          if (assigned.length > 0) {
            list = data.filter(item => 
              assigned.includes(item.course) || 
              assigned.some(a => item.course && item.course.toLowerCase().includes(a.toLowerCase()))
            );
          }
        }
        this.courseOutcomes = list;
        this.cdr.detectChanges();
      }
    });
  }

  private loadMappings() {
    this.http.get<CoMapping[]>('http://localhost:8080/api/copo/mappings').subscribe({
      next: (data) => {
        let list = data;
        if (this.role === 'faculty') {
          let assigned: string[] = [];
          try {
            const stored = localStorage.getItem('userAssignedCourses');
            if (stored) assigned = JSON.parse(stored);
          } catch {}
          if (assigned.length > 0) {
            list = data.filter(item => 
              assigned.includes(item.course) || 
              assigned.some(a => item.course && item.course.toLowerCase().includes(a.toLowerCase()))
            );
          }
        }
        this.mappings = list;
        this.cdr.detectChanges();
      }
    });
  }

  private saveMappings() {}

  private safeLoadJson<T>(key: string): T[] {
    return [];
  }

  private uniqueBy<T>(items: T[], selector: (item: T) => string): T[] {
    const seen = new Set<string>();
    return items.filter(item => {
      const key = selector(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  saveMapping() {
    if (this.role === 'student') {
      alert('Only admins and faculty can manage CO-PO mappings.');
      return;
    }

    if (!this.currentMapping.co || !this.currentMapping.po || this.currentMapping.contribution <= 0 || this.currentMapping.mappingLevel <= 0) {
      this.toast.warning('Please select both CO and PO and enter valid mapping details.');
      return;
    }

    const payload = {
      id: this.currentMapping.id > 0 ? this.currentMapping.id : null,
      course: this.currentMapping.course,
      co: this.currentMapping.co,
      po: this.currentMapping.po,
      contribution: this.currentMapping.contribution,
      mappingLevel: this.currentMapping.mappingLevel,
      status: this.currentMapping.status
    };

    this.http.post<CoMapping>('http://localhost:8080/api/copo/mappings', payload).subscribe({
      next: () => {
        this.loadMappings();
        this.resetMapping();
        this.toast.success('CO-PO mapping saved successfully.');
      },
      error: () => {
        this.toast.error('Failed to save mapping.');
      }
    });
  }

  editMapping(index: number) {
    if (this.role === 'student') {
      alert('Only admins and faculty can manage CO-PO mappings.');
      return;
    }
    this.editIndex = index;
    this.currentMapping = { ...this.mappings[index] };
    this.selectedCourseOutcomeKey = `${this.currentMapping.course}::${this.currentMapping.co}`;
  }

  approveMapping(index: number) {
    if (this.role !== 'admin') {
      this.toast.error('Only admins can approve mappings.');
      return;
    }
    const mapping = { ...this.mappings[index] };
    mapping.status = 'Approved';
    this.http.post<CoMapping>('http://localhost:8080/api/copo/mappings', mapping).subscribe({
      next: () => {
        this.loadMappings();
        this.toast.success('Mapping approved successfully.');
      },
      error: () => {
        this.toast.error('Failed to approve mapping.');
      }
    });
  }

  toggleMappingView() {
    this.showMatrix = !this.showMatrix;
  }

  deleteMapping(index: number) {
    if (this.role === 'student') {
      alert('Only admins and faculty can manage CO-PO mappings.');
      return;
    }
    const target = this.mappings[index];
    this.http.delete('http://localhost:8080/api/copo/mappings/' + target.id).subscribe({
      next: () => {
        this.loadMappings();
        this.toast.info('Mapping removed.');
        if (this.editIndex === index) {
          this.resetMapping();
        }
      },
      error: () => {
        this.toast.error('Failed to delete mapping.');
      }
    });
  }

  onCoChange(selectionKey: string) {
    const [course, co] = selectionKey.split('::');
    this.currentMapping.co = co || '';
    this.currentMapping.course = course || '';
  }

  getCourseOutcomeDescription(course: string, co: string): string {
    return this.courseOutcomes.find(item => item.course === course && item.co === co)?.description || '';
  }

  getProgramOutcomeDescription(poNumber: string): string {
    return this.programOutcomes.find(item => item.poNumber === poNumber)?.description || '';
  }

  addProgramOutcome() {
    if (this.role === 'student') {
      alert('Only admins and faculty can manage Program Outcomes.');
      return;
    }

    if (!this.newPoDescription.trim()) {
      this.toast.warning('Enter a PO description.');
      return;
    }

    const index = this.programOutcomes.filter(po => po.poNumber.startsWith('PO')).length + 1;
    const poNumber = this.newPoNumber.trim() || `PO${index}`;

    if (this.programOutcomes.some(po => po.poNumber === poNumber)) {
      this.toast.error('This PO already exists.');
      return;
    }

    const payload = {
      id: null,
      poNumber: poNumber,
      description: this.newPoDescription.trim()
    };

    this.http.post<ProgramOutcome>('http://localhost:8080/api/copo/po', payload).subscribe({
      next: () => {
        this.loadProgramOutcomes();
        this.toast.success(`Program Outcome ${poNumber} added.`);
        this.resetPoForm();
      },
      error: () => {
        this.toast.error('Failed to add PO.');
      }
    });
  }

  addCourseOutcome() {
    if (this.role === 'student') {
      alert('Only admins and faculty can manage Course Outcomes.');
      return;
    }

    if (!this.newCoCourse.trim()) {
      this.toast.warning('Enter the course for this CO.');
      return;
    }

    const nextCoIndex = this.courseOutcomes.filter(item => item.course === this.newCoCourse.trim()).length + 1;
    const coCode = this.newCoCode.trim() || `CO${nextCoIndex}`;

    if (this.courseOutcomes.some(item => item.course === this.newCoCourse.trim() && item.co === coCode)) {
      this.toast.error('This course outcome already exists.');
      return;
    }

    const payload = {
      id: null,
      course: this.newCoCourse.trim(),
      co: coCode,
      description: this.newCoDescription.trim()
    };

    this.http.post<CourseOutcome>('http://localhost:8080/api/copo/co', payload).subscribe({
      next: () => {
        this.loadCourseOutcomes();
        this.toast.success(`Course Outcome ${coCode} created.`);
        this.resetCoForm();
      },
      error: () => {
        this.toast.error('Failed to create CO.');
      }
    });
  }

  private saveProgramOutcomes() {}

  private saveCourseOutcomes() {}

  private loadCourses() {
    this.http.get<Array<{ code: string; title: string }>>('http://localhost:8080/api/courses').subscribe({
      next: (data) => {
        let list = data;
        if (this.role === 'faculty') {
          let assigned: string[] = [];
          try {
            const stored = localStorage.getItem('userAssignedCourses');
            if (stored) assigned = JSON.parse(stored);
          } catch {}
          if (assigned.length > 0) {
            list = data.filter(c => 
              assigned.includes(c.title) || 
              assigned.includes(c.code)
            );
          }
        }
        this.courses = list.map(c => c.code).filter(Boolean);
        this.cdr.detectChanges();
      },
      error: () => {
        this.courses = [];
      }
    });
  }

  resetPoForm() {
    this.newPoNumber = '';
    this.newPoDescription = '';
  }

  resetCoForm() {
    this.newCoCourse = '';
    this.newCoCode = '';
    this.newCoDescription = '';
  }

  getMappingLevelLabel(level: number): string {
    return this.mappingLevels.find(item => item.value === level)?.label ?? 'Unknown';
  }

  getMatrixLevel(course: string, co: string, po: string): number | undefined {
    return this.mappings.find(mapping => mapping.course === course && mapping.co === co && mapping.po === po)?.mappingLevel;
  }

  exportMatrixCsv(): void {
    if (this.programOutcomes.length === 0 || this.courseOutcomes.length === 0) {
      this.toast.warning('No matrix data available to export.');
      return;
    }
    const headers = ['Course - CO', ...this.programOutcomes.map(po => po.poNumber)];
    const rows = this.courseOutcomes.map(outcome => {
      const row = [`"${outcome.course} - ${outcome.co}"`];
      this.programOutcomes.forEach(po => {
        const level = this.getMatrixLevel(outcome.course, outcome.co, po.poNumber);
        row.push(level !== undefined ? `"${level}"` : '""');
      });
      return row.join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `CO_PO_Mapping_Matrix_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toast.success('CO-PO Matrix exported to CSV.');
  }

  printMatrix(): void {
    window.print();
  }

  resetMapping() {
    this.editIndex = -1;
    this.selectedCourseOutcomeKey = '';
    this.currentMapping = {
      id: 0,
      course: '',
      co: '',
      po: '',
      contribution: 0,
      mappingLevel: 0,
      status: 'Pending'
    };
  }
}
