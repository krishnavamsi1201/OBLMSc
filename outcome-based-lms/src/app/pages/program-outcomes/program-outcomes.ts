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
  role: string | null = null;

  currentPo: ProgramOutcome = { id: 0, poNumber: '', description: '' };
  editIndex = -1;

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

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
    this.http.get<ProgramOutcome[]>('http://localhost:8080/api/copo/po').subscribe({
      next: (data) => {
        this.programOutcomes = data;
        try {
          localStorage.setItem('obslmsProgramOutcomes', JSON.stringify(data));
        } catch {}
        this.cdr.detectChanges();
      },
      error: () => {
        this.programOutcomes = [];
      }
    });
  }

  private saveProgramOutcomes(): void {}

  savePo() {
    if (this.role === 'student') {
      alert('Only admins and faculty can manage Program Outcomes.');
      return;
    }

    if (!this.currentPo.poNumber.trim() || !this.currentPo.description.trim()) {
      this.toast.warning('Please fill in both PO number and description.');
      return;
    }

    const payload = {
      id: this.currentPo.id > 0 ? this.currentPo.id : null,
      poNumber: this.currentPo.poNumber.trim(),
      description: this.currentPo.description.trim()
    };

    this.http.post<ProgramOutcome>('http://localhost:8080/api/copo/po', payload).subscribe({
      next: () => {
        this.loadProgramOutcomes();
        this.resetForm();
        this.toast.success('Program Outcome saved successfully.');
      },
      error: () => {
        this.toast.error('Failed to save Program Outcome.');
      }
    });
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
    const target = this.programOutcomes[index];
    this.http.delete('http://localhost:8080/api/copo/po/' + target.id).subscribe({
      next: () => {
        this.loadProgramOutcomes();
        if (this.editIndex === index) {
          this.resetForm();
        }
        this.toast.success('Program Outcome deleted.');
      },
      error: () => {
        this.toast.error('Failed to delete Program Outcome.');
      }
    });
  }

  resetForm() {
    this.editIndex = -1;
    this.currentPo = { id: 0, poNumber: '', description: '' };
  }
}
