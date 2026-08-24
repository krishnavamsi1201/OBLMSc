import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';
import { HttpClient } from '@angular/common/http';

interface ProgramOutcome {
  id: string;
  code: string;
  description: string;
  targetPercentage?: number;
}

interface COPOMapping {
  id: string;
  coCode: string;
  poCode: string;
  weight?: number;
}

interface COAttainment {
  code: string;
  achievement: number;
}

interface POAttainment {
  code: string;
  description: string;
  achievement: number;
  targetPercentage: number;
  status: 'Achieved' | 'Partial' | 'Not Achieved';
  mappedCOs: string[];
  coCount: number;
}

@Component({
  selector: 'app-po-attainment',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  templateUrl: './po-attainment.html',
  styleUrls: ['./po-attainment.css']
})
export class PoAttainment implements OnInit {
  programOutcomes: ProgramOutcome[] = [];
  poAttainments: POAttainment[] = [];
  filteredAttainments: POAttainment[] = [];
  
  filterStatus: string = '';
  searchQuery: string = '';
  
  overallAchievement: number = 0;
  targetPercentage: number = 75;

  constructor(private http: HttpClient) {
    try {
      const savedSettings = localStorage.getItem('systemSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.obeTarget !== undefined) {
          this.targetPercentage = Number(parsed.obeTarget);
        }
      }
    } catch {}
    this.calculatePOAttainment();
  }

  ngOnInit(): void {
    this.filterAttainments();
  }

  calculatePOAttainment(): void {
    this.http.get<POAttainment[]>('http://localhost:8080/api/obe/po-attainment?target=' + this.targetPercentage).subscribe({
      next: (data) => {
        this.poAttainments = data;
        if (data.length > 0) {
          this.overallAchievement = Math.round(
            data.reduce((sum, po) => sum + po.achievement, 0) / data.length
          );
        }
        this.filterAttainments();
      },
      error: () => {
        this.poAttainments = [];
        this.filterAttainments();
      }
    });
  }

  filterAttainments(): void {
    this.filteredAttainments = this.poAttainments.filter(attainment => {
      const matchSearch = this.searchQuery === '' ||
        attainment.code.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        attainment.description.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchStatus = this.filterStatus === '' || attainment.status === this.filterStatus;

      return matchSearch && matchStatus;
    });
  }

  onFilterChange(): void {
    this.filterAttainments();
  }

  onSearchChange(): void {
    this.filterAttainments();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Achieved': return '#10b981';
      case 'Partial': return '#f59e0b';
      case 'Not Achieved': return '#ef4444';
      default: return '#6b7280';
    }
  }

  getStatusBgColor(status: string): string {
    switch (status) {
      case 'Achieved': return 'rgba(16, 185, 129, 0.1)';
      case 'Partial': return 'rgba(245, 158, 11, 0.1)';
      case 'Not Achieved': return 'rgba(239, 68, 68, 0.1)';
      default: return 'rgba(107, 114, 128, 0.1)';
    }
  }

  getAchievedCount(): number {
    return this.poAttainments.filter(po => po.status === 'Achieved').length;
  }

  getPartialCount(): number {
    return this.poAttainments.filter(po => po.status === 'Partial').length;
  }

  getNotAchievedCount(): number {
    return this.poAttainments.filter(po => po.status === 'Not Achieved').length;
  }

  getProgressWidth(achievement: number): number {
    return Math.min((achievement / 100) * 100, 100);
  }

  exportToCSV(): void {
    const headers = ['PO Code', 'Description', 'Achievement (%)', 'Target (%)', 'Status', 'Mapped COs', 'CO Count'];
    const rows = this.poAttainments.map(po => [
      po.code,
      po.description,
      po.achievement.toString(),
      po.targetPercentage.toString(),
      po.status,
      po.mappedCOs.join(';'),
      po.coCount.toString()
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `po-attainment-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }
}

