import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';

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

  constructor() {
    this.calculatePOAttainment();
  }

  ngOnInit(): void {
    this.filterAttainments();
  }

  calculatePOAttainment(): void {
    try {
      // Load all data
      const programOutcomesData = JSON.parse(localStorage.getItem('obslmsProgramOutcomes') || '[]');
      const coPOMappingsData = JSON.parse(localStorage.getItem('obslmsCOPOMappings') || '[]') as COPOMapping[];
      
      // Calculate CO attainments
      const courseOutcomesData = JSON.parse(localStorage.getItem('obslmsCourseOutcomes') || '[]');
      const assessmentMappingsData = JSON.parse(localStorage.getItem('obslmsAssessmentCOMappings') || '[]');
      const marksData = JSON.parse(localStorage.getItem('obslmsMarkEntries') || '[]');

      const coAttainmentMap = new Map<string, number>();
      
      // Calculate CO achievements
      courseOutcomesData.forEach((co: any) => {
        const coKey = co.code || co.co || '';
        if (!coKey) return;

        const mappings = assessmentMappingsData.filter((m: any) => (m.courseOutcomes || []).includes(coKey));
        let totalScore = 0;
        let scoreCount = 0;

        mappings.forEach((mapping: any) => {
          const assessmentMarks = marksData.filter((m: any) => 
            mapping.assessmentName && m.assessment && m.assessment.toLowerCase().includes(mapping.assessmentName.toLowerCase())
          );

          assessmentMarks.forEach((mark: any) => {
            if (mark.maxMarks > 0) {
              const percentage = (mark.obtained / mark.maxMarks) * 100;
              totalScore += percentage;
              scoreCount++;
            }
          });
        });

        const avgScore = scoreCount > 0 ? totalScore / scoreCount : 0;
        coAttainmentMap.set(coKey, avgScore);
      });

      // Build PO map for easy access
      const poMap = new Map<string, ProgramOutcome>();
      programOutcomesData.forEach((po: any) => {
        const poKey = po.code || po.poNumber || '';
        if (poKey) {
          poMap.set(poKey, {
            id: (po.id || '').toString(),
            code: poKey,
            description: po.description || '',
            targetPercentage: 75
          });
        }
      });

      // Calculate PO achievements
      const poAttainmentMap = new Map<string, {
        scores: number[];
        mappedCOs: string[];
      }>();

      // Initialize PO map
      poMap.forEach((po, code) => {
        poAttainmentMap.set(code, {
          scores: [],
          mappedCOs: []
        });
      });

      // Process CO-PO mappings
      coPOMappingsData.forEach((mapping: any) => {
        const coCode = mapping.coCode || mapping.co || '';
        const poCode = mapping.poCode || mapping.po || '';
        const coAchievement = coAttainmentMap.get(coCode) || 0;
        const poData = poAttainmentMap.get(poCode);
        
        if (poData) {
          const weight = mapping.weight || (mapping.mappingLevel ? mapping.mappingLevel / 3 : 1);
          poData.scores.push(coAchievement * weight);
          if (coCode && !poData.mappedCOs.includes(coCode)) {
            poData.mappedCOs.push(coCode);
          }
        }
      });

      // Calculate final PO attainment
      this.poAttainments = Array.from(poAttainmentMap.entries()).map(([code, data]) => {
        const avgAchievement = data.scores.length > 0
          ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length
          : 0;

        const status = avgAchievement >= this.targetPercentage
          ? 'Achieved'
          : avgAchievement >= 50
          ? 'Partial'
          : 'Not Achieved';

        const poDetails = poMap.get(code);
        return {
          code,
          description: poDetails?.description || '',
          achievement: Math.round(avgAchievement * 100) / 100,
          targetPercentage: this.targetPercentage,
          status,
          mappedCOs: data.mappedCOs,
          coCount: data.mappedCOs.length
        };
      });

      // Calculate overall achievement
      if (this.poAttainments.length > 0) {
        this.overallAchievement = Math.round(
          (this.poAttainments.reduce((sum, po) => sum + po.achievement, 0) / this.poAttainments.length) * 100
        ) / 100;
      }

    } catch (error) {
      console.error('Error calculating PO attainment:', error);
      this.poAttainments = [];
    }
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

