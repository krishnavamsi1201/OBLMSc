import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';

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
  role: string | null = null;

  programOutcomes: ProgramOutcome[] = [];
  courseOutcomes: CourseOutcome[] = [];
  courses: string[] = [];
  selectedCourseOutcomeKey = '';

  newPoNumber = '';
  newPoDescription = '';
  newCoCourse = '';
  newCoCode = '';

  mappingLevels = [
    { value: 1, label: '1 - Low' },
    { value: 2, label: '2 - Medium' },
    { value: 3, label: '3 - High' }
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
    this.loadData();
    this.loadCourses();
    this.resetMapping();
  }

  ngOnInit(): void {
    // Standard initialization if needed
  }

  loadData() {
    this.programOutcomes = this.getProgramOutcomes();
    this.courseOutcomes = this.getCourseOutcomes();
    this.loadMappings();
  }

  private getProgramOutcomes(): ProgramOutcome[] {
    const stored = this.safeLoadJson<ProgramOutcome>('obslmsProgramOutcomes');
    const outcomeSource = this.safeLoadJson<any>('obslmsOutcomes')
      .filter(item => item.type === 'PO')
      .map(item => ({ id: item.id, poNumber: item.code, description: item.description }));
    return this.uniqueBy([...stored, ...outcomeSource], item => item.poNumber);
  }

  private getCourseOutcomes(): CourseOutcome[] {
    const stored = this.safeLoadJson<CourseOutcome>('obslmsCourseOutcomes');
    const outcomeSource = this.safeLoadJson<any>('obslmsOutcomes')
      .filter(item => item.type === 'CO')
      .map(item => ({ id: item.id, course: item.course, co: item.code, description: item.description }));
    return this.uniqueBy([...stored, ...outcomeSource], item => `${item.course}::${item.co}`);
  }

  private loadMappings() {
    this.mappings = this.safeLoadJson<CoMapping>('obslmsCoMappings');
  }

  private saveMappings() {
    try {
      localStorage.setItem('obslmsCoMappings', JSON.stringify(this.mappings));
    } catch {}
  }

  private safeLoadJson<T>(key: string): T[] {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) as T[] : [];
    } catch {
      return [];
    }
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
      alert('Please select both CO and PO and enter valid mapping details.');
      return;
    }

    if (this.editIndex >= 0) {
      this.mappings[this.editIndex] = { ...this.currentMapping, id: this.mappings[this.editIndex].id };
    } else {
      this.mappings = [
        ...this.mappings,
        { ...this.currentMapping, id: Date.now() }
      ];
    }

    this.saveMappings();
    this.resetMapping();
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
      alert('Only admins can approve mappings.');
      return;
    }
    this.mappings[index].status = 'Approved';
    this.saveMappings();
  }

  toggleMappingView() {
    this.showMatrix = !this.showMatrix;
  }

  deleteMapping(index: number) {
    if (this.role === 'student') {
      alert('Only admins and faculty can manage CO-PO mappings.');
      return;
    }
    this.mappings = this.mappings.filter((_, i) => i !== index);
    this.saveMappings();
    if (this.editIndex === index) {
      this.resetMapping();
    }
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
      alert('Enter a PO description.');
      return;
    }

    const nextId = this.programOutcomes.length ? Math.max(...this.programOutcomes.map(po => po.id)) + 1 : 1;
    const codeIndex = this.programOutcomes.filter(po => po.poNumber.startsWith('PO')).length + 1;
    const poNumber = this.newPoNumber.trim() || `PO${codeIndex}`;

    if (this.programOutcomes.some(po => po.poNumber === poNumber)) {
      alert('This PO already exists.');
      return;
    }

    this.programOutcomes = [...this.programOutcomes, { id: nextId, poNumber, description: this.newPoDescription.trim() }];
    this.saveProgramOutcomes();
    this.resetPoForm();
  }

  addCourseOutcome() {
    if (this.role === 'student') {
      alert('Only admins and faculty can manage Course Outcomes.');
      return;
    }

    if (!this.newCoCourse.trim()) {
      alert('Enter the course for this CO.');
      return;
    }

    const nextCoIndex = this.courseOutcomes.filter(item => item.course === this.newCoCourse.trim()).length + 1;
    const coCode = this.newCoCode.trim() || `CO${nextCoIndex}`;

    if (this.courseOutcomes.some(item => item.course === this.newCoCourse.trim() && item.co === coCode)) {
      alert('This course outcome already exists.');
      return;
    }

    const nextId = this.courseOutcomes.length ? Math.max(...this.courseOutcomes.map(item => item.id)) + 1 : 1;
    this.courseOutcomes = [...this.courseOutcomes, { id: nextId, course: this.newCoCourse.trim(), co: coCode, description: '' }];
    this.saveCourseOutcomes();
    this.resetCoForm();
  }

  private saveProgramOutcomes() {
    try {
      localStorage.setItem('obslmsProgramOutcomes', JSON.stringify(this.programOutcomes));
    } catch {}
  }

  private saveCourseOutcomes() {
    try {
      localStorage.setItem('obslmsCourseOutcomes', JSON.stringify(this.courseOutcomes));
    } catch {}
  }

  private loadCourses() {
    try {
      const stored = localStorage.getItem('obslmsCourses');
      const courseList = stored ? JSON.parse(stored) as Array<{ code: string; title: string }> : [];
      this.courses = courseList
        .map(c => `${c.code ? c.code : ''}${c.code && c.title ? ' - ' : ''}${c.title ? c.title : ''}`)
        .filter(Boolean);
    } catch {
      this.courses = [];
    }
  }

  resetPoForm() {
    this.newPoNumber = '';
    this.newPoDescription = '';
  }

  resetCoForm() {
    this.newCoCourse = '';
    this.newCoCode = '';
  }

  getMappingLevelLabel(level: number): string {
    return this.mappingLevels.find(item => item.value === level)?.label ?? 'Unknown';
  }

  getMatrixLevel(co: string, po: string): number | undefined {
    return this.mappings.find(mapping => mapping.co === co && mapping.po === po)?.mappingLevel;
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
