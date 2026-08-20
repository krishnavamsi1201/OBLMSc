import { Component } from '@angular/core';
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
            <p>Manage your PO list and add descriptions for faculty planning.</p>
        </div>

        <div class="section-card form-card">
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
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngIf="programOutcomes.length === 0">
                        <td colspan="3">No program outcomes defined yet.</td>
                    </tr>
                    <tr *ngFor="let po of programOutcomes; index as i">
                        <td>{{ po.poNumber }}</td>
                        <td>{{ po.description }}</td>
                        <td>
                            <button type="button" (click)="editPo(i)">Edit</button>
                            <button type="button" class="danger" (click)="deletePo(i)">Delete</button>
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
export class ProgramOutcomes {
  programOutcomes: ProgramOutcome[] = [];

  currentPo: ProgramOutcome = { id: 0, poNumber: '', description: '' };
  editIndex = -1;

  savePo() {
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

    this.resetForm();
  }

  editPo(index: number) {
    this.editIndex = index;
    this.currentPo = { ...this.programOutcomes[index] };
  }

  deletePo(index: number) {
    this.programOutcomes = this.programOutcomes.filter((_, i) => i !== index);
    if (this.editIndex === index) {
      this.resetForm();
    }
  }

  resetForm() {
    this.editIndex = -1;
    this.currentPo = { id: 0, poNumber: '', description: '' };
  }
}
