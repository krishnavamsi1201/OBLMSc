import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { ToastService } from '../../shared/services/toast.service';

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
            <h1>🎯 Program Outcomes (PO)</h1>
            <p>Manage program-level graduate attributes, competencies, and engineering knowledge indicators for accreditation.</p>
        </div>

        <div class="section-card form-card">
            <h2>{{ editIndex >= 0 ? 'Edit Program Outcome' : 'Add New Program Outcome' }}</h2>
            <form (ngSubmit)="savePo()">
                <label>
                    PO Number (e.g. PO1, PO2)
                    <input type="text" name="poNumber" [(ngModel)]="currentPo.poNumber" required placeholder="e.g. PO1" />
                </label>
                <label>
                    PO Description
                    <textarea name="description" [(ngModel)]="currentPo.description" required placeholder="Describe the graduate attribute or program outcome..."></textarea>
                </label>
                <div class="form-actions">
                    <button type="submit">{{ editIndex >= 0 ? 'Update PO' : 'Add PO' }}</button>
                    <button type="button" class="secondary" (click)="resetForm()">Clear</button>
                </div>
            </form>
        </div>

        <div class="table-card">
            <h2>Program Outcomes Directory</h2>
            <table>
                <thead>
                    <tr>
                        <th>PO Code</th>
                        <th>Outcome Description</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngIf="programOutcomes.length === 0">
                        <td colspan="3">No program outcomes defined yet. Add a new PO above.</td>
                    </tr>
                    <tr *ngFor="let po of programOutcomes; index as i">
                        <td><span class="obe-badge obe-badge-po">{{ po.poNumber }}</span></td>
                        <td>{{ po.description }}</td>
                        <td>
                            <button type="button" (click)="editPo(i)">Edit</button>
                            <button type="button" class="danger" (click)="deletePo(i)">Delete</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <app-footer></app-footer>
    </div>

</div>`,
  styles: [
    `.page { padding: 24px; }
    .form-card, .table-card { margin-bottom: 24px; padding: 20px; background: #fff; border-radius: 12px; box-shadow: 0 1px 12px rgba(0,0,0,.08); }
    .form-card h2, .table-card h2 { margin-top: 0; }
    form label { display: block; margin-bottom: 16px; font-weight: 600; color: #1e293b; }
    input[type=text], textarea { width: 100%; padding: 10px 12px; margin-top: 6px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px; }
    textarea { resize: vertical; min-height: 100px; }
    .form-actions { display: flex; gap: 10px; margin-top: 8px; }
    button { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; background: #1565c0; color: #fff; font-weight: 600; }
    button:hover { filter: brightness(1.1); }
    button.secondary { background: #64748b; }
    button.danger { background: #ef4444; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 12px 10px; border-bottom: 1px solid #e0e0e0; }
    th { color: #1f3d7a; font-weight: 700; background: #f8fafc; }
    tbody tr:hover { background: #f9f9f9; }
    `
  ]
})
export class ProgramOutcomes implements OnInit {
  private toast = inject(ToastService);
  programOutcomes: ProgramOutcome[] = [];

  currentPo: ProgramOutcome = { id: 0, poNumber: '', description: '' };
  editIndex = -1;

  ngOnInit(): void {
    this.loadPos();
  }

  loadPos(): void {
    try {
      const stored = localStorage.getItem('obslmsProgramOutcomes');
      this.programOutcomes = stored ? JSON.parse(stored) : [];
    } catch {
      this.programOutcomes = [];
    }
  }

  private savePosToStorage(): void {
    try {
      localStorage.setItem('obslmsProgramOutcomes', JSON.stringify(this.programOutcomes));
    } catch {}
  }

  savePo() {
    if (!this.currentPo.poNumber.trim() || !this.currentPo.description.trim()) {
      this.toast.warning('Please fill in both PO number and description.');
      return;
    }

    if (this.editIndex >= 0) {
      this.programOutcomes[this.editIndex] = { ...this.currentPo, id: this.programOutcomes[this.editIndex].id };
      this.toast.success(`Program Outcome ${this.currentPo.poNumber} updated.`);
    } else {
      this.programOutcomes = [
        ...this.programOutcomes,
        { id: Date.now(), poNumber: this.currentPo.poNumber.trim(), description: this.currentPo.description.trim() }
      ];
      this.toast.success(`Program Outcome ${this.currentPo.poNumber} added.`);
    }

    this.savePosToStorage();
    this.resetForm();
  }

  editPo(index: number) {
    this.editIndex = index;
    this.currentPo = { ...this.programOutcomes[index] };
  }

  deletePo(index: number) {
    const po = this.programOutcomes[index];
    this.programOutcomes = this.programOutcomes.filter((_, i) => i !== index);
    this.savePosToStorage();
    this.toast.info(`Program Outcome ${po ? po.poNumber : ''} removed.`);
    if (this.editIndex === index) {
      this.resetForm();
    }
  }

  resetForm() {
    this.editIndex = -1;
    this.currentPo = { id: 0, poNumber: '', description: '' };
  }
}
