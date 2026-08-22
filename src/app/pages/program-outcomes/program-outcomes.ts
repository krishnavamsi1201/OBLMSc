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

@Component({
  selector: 'app-program-outcomes',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  template: `<app-navbar></app-navbar>

<div class="container">

    <app-sidebar></app-sidebar>

    <div class="content">

        <div class="page-header">
            <h1>Program Outcomes (PO)</h1>
            <p>{{ role === 'student' ? 'View the list of Program Outcomes (PO) established for this curriculum.' : 'Manage your PO list and add descriptions for faculty planning.' }}</p>
        </div>

        <!-- Add/Edit PO Card (Faculty/Admin only, hidden from students) -->
        <div class="section-card form-card" *ngIf="role !== 'student'">
            <h2>{{ editIndex >= 0 ? 'Edit PO' : 'Add New PO' }}</h2>
            <form (ngSubmit)="savePo()">
                <label>
                    PO Number
                    <input type="text" name="poNumber" [(ngModel)]="currentPo.poNumber" required placeholder="e.g. PO1" />
                </label>
                <label>
                    PO Description
                    <textarea name="description" [(ngModel)]="currentPo.description" required placeholder="Describe the program outcome"></textarea>
                </label>
                <div class="form-actions">
                    <button type="submit">{{ editIndex >= 0 ? 'Update PO' : 'Add PO' }}</button>
                    <button type="button" class="secondary" (click)="resetForm()">Clear</button>
                </div>
            </form>
        </div>

        <div class="table-card">
            <h2>PO List</h2>
            <table>
                <thead>
                    <tr>
                        <th>PO Number</th>
                        <th>Description</th>
                        <th *ngIf="role !== 'student'">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngIf="programOutcomes.length === 0">
                        <td [attr.colspan]="role !== 'student' ? 3 : 2">No program outcomes defined yet.</td>
                    </tr>
                    <tr *ngFor="let po of programOutcomes; index as i">
                        <td><strong>{{ po.poNumber }}</strong></td>
                        <td>{{ po.description }}</td>
                        <td *ngIf="role !== 'student'">
                            <button type="button" (click)="editPo(i)">Edit</button>
                            <button type="button" class="danger" (click)="deletePo(i)" style="margin-left: 8px;">Delete</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

    </div>

</div>

<app-footer></app-footer>`,
  styles: [
    `.page { padding: 24px; }
    .form-card, .table-card { margin-bottom: 24px; padding: 20px; background: #fff; border-radius: 10px; box-shadow: 0 1px 8px rgba(0,0,0,.08); }
    .form-card h2, .table-card h2 { margin-top: 0; }
    form label { display: block; margin-bottom: 16px; font-weight: 600; }
    input[type=text], textarea { width: 100%; padding: 10px 12px; margin-top: 8px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px; }
    textarea { resize: vertical; min-height: 100px; }
    .form-actions { display: flex; gap: 10px; margin-top: 8px; }
    button { padding: 10px 16px; border: none; border-radius: 6px; cursor: pointer; background: #1565c0; color: #fff; }
    button.secondary { background: #777; }
    button.danger { background: #d32f2f; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 12px 10px; border-bottom: 1px solid #e0e0e0; }
    th { color: #333; font-weight: 700; }
    tbody tr:hover { background: #f9f9f9; }
    `
  ]
})
export class ProgramOutcomes implements OnInit {
  programOutcomes: ProgramOutcome[] = [];
  role: string | null = null;

  currentPo: ProgramOutcome = { id: 0, poNumber: '', description: '' };
  editIndex = -1;

  constructor() {
    try {
      this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
    } catch {
      this.role = null;
    }
  }

  ngOnInit(): void {
    this.loadProgramOutcomes();
  }

  private loadProgramOutcomes(): void {
    try {
      const stored = localStorage.getItem('obslmsProgramOutcomes');
      if (stored) {
        this.programOutcomes = JSON.parse(stored) as ProgramOutcome[];
      } else {
        // Seed default program outcomes for demo if empty
        this.programOutcomes = [
          { id: 1, poNumber: 'PO1', description: 'Apply knowledge of mathematics, science, engineering fundamentals, and computer science specialization to solve complex engineering problems.' },
          { id: 2, poNumber: 'PO2', description: 'Identify, formulate, and analyze complex problems reaching substantiated conclusions using computational concepts.' },
          { id: 3, poNumber: 'PO3', description: 'Design solutions for complex engineering problems and design system components or processes that meet specific needs.' },
          { id: 4, poNumber: 'PO4', description: 'Conduct investigations of complex problems using research-based knowledge and methods including design of experiments.' }
        ];
        this.saveProgramOutcomes();
      }
    } catch {
      this.programOutcomes = [];
    }
  }

  private saveProgramOutcomes(): void {
    try {
      localStorage.setItem('obslmsProgramOutcomes', JSON.stringify(this.programOutcomes));
    } catch {}
  }

  savePo() {
    if (this.role === 'student') {
      alert('Only admins and faculty can manage Program Outcomes.');
      return;
    }

    if (!this.currentPo.poNumber.trim() || !this.currentPo.description.trim()) {
      return;
    }

    if (this.editIndex >= 0) {
      this.programOutcomes[this.editIndex] = { ...this.currentPo, id: this.programOutcomes[this.editIndex].id };
    } else {
      this.programOutcomes = [
        ...this.programOutcomes,
        { id: Date.now(), poNumber: this.currentPo.poNumber.trim(), description: this.currentPo.description.trim() }
      ];
    }

    this.saveProgramOutcomes();
    this.resetForm();
  }

  editPo(index: number) {
    if (this.role === 'student') {
      alert('Only admins and faculty can manage Program Outcomes.');
      return;
    }
    this.editIndex = index;
    this.currentPo = { ...this.programOutcomes[index] };
  }

  deletePo(index: number) {
    if (this.role === 'student') {
      alert('Only admins and faculty can manage Program Outcomes.');
      return;
    }
    this.programOutcomes = this.programOutcomes.filter((_, i) => i !== index);
    this.saveProgramOutcomes();
    if (this.editIndex === index) {
      this.resetForm();
    }
  }

  resetForm() {
    this.editIndex = -1;
    this.currentPo = { id: 0, poNumber: '', description: '' };
  }
}
