import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';

interface CourseOutcome {
  id: string;
  code: string;
  description: string;
  targetPercentage?: number;
}

interface AssessmentCOMapping {
  id: string;
  assessmentName: string;
  assessmentType: string;
  courseId: string;
  courseName: string;
  courseOutcomes: string[];
  maxMarks: number;
}

interface StudentMark {
  id: number;
  student: string;
  assessment: string;
  obtained: number;
  maxMarks: number;
}

interface COAttainment {
  code: string;
  description: string;
  achievement: number;
  targetPercentage: number;
  status: 'Achieved' | 'Partial' | 'Not Achieved';
  assessmentCount: number;
  studentCount: number;
}

@Component({
  selector: 'app-co-attainment',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Sidebar, Footer],
  templateUrl: './co-attainment.html',
  styleUrls: ['./co-attainment.css']
})
export class CoAttainment implements OnInit {
  courseOutcomes: CourseOutcome[] = [];
  coAttainments: COAttainment[] = [];
  filteredAttainments: COAttainment[] = [];
  
  filterStatus: string = '';
  searchQuery: string = '';
  
  courses: any[] = [];
  selectedCourse: string = '';
  
  overallAchievement: number = 0;
  targetPercentage: number = 75;

  constructor() {
    this.loadCourses();
    this.calculateCOAttainment();
  }

  ngOnInit(): void {
    this.filterAttainments();
  }

  loadCourses(): void {
    try {
      const stored = localStorage.getItem('obslmsCourses');
      this.courses = stored ? JSON.parse(stored) : [];
    } catch {
      this.courses = [];
    }
  }

  calculateCOAttainment(): void {
    try {
      const courseOutcomesData = JSON.parse(localStorage.getItem('obslmsCourseOutcomes') || '[]');
      const mappingsData = JSON.parse(localStorage.getItem('obslmsAssessmentCOMappings') || '[]') as AssessmentCOMapping[];
      const marksData = JSON.parse(localStorage.getItem('obslmsMarkEntries') || '[]') as StudentMark[];

      const coMap = new Map<string, CourseOutcome>();
      courseOutcomesData.forEach((co: any) => {
        const code = co.code || co.co || '';
        if (code) {
          coMap.set(code, {
            id: (co.id || '').toString(),
            code: code,
            description: co.description || '',
            targetPercentage: 75
          });
        }
      });

      const coAttainmentMap = new Map<string, {
        scores: number[];
        maxMarks: number;
        assessments: string[];
        students: Set<string>;
      }>();

      coMap.forEach((co, code) => {
        coAttainmentMap.set(code, {
          scores: [],
          maxMarks: 0,
          assessments: [],
          students: new Set()
        });
      });

      mappingsData.forEach((mapping: AssessmentCOMapping) => {
        const assessmentMarks = marksData.filter(m => 
          mapping.assessmentName && m.assessment && m.assessment.toLowerCase().includes(mapping.assessmentName.toLowerCase())
        );

        const cos = mapping.courseOutcomes || [];
        cos.forEach((coCode: string) => {
          const coData = coAttainmentMap.get(coCode);
          if (coData) {
            assessmentMarks.forEach(mark => {
              if (mark.maxMarks > 0) {
                const percentage = (mark.obtained / mark.maxMarks) * 100;
                coData.scores.push(percentage);
                coData.students.add(mark.student);
              }
            });

            if (mapping.assessmentName && !coData.assessments.includes(mapping.assessmentName)) {
              coData.assessments.push(mapping.assessmentName);
            }
            coData.maxMarks = mapping.maxMarks;
          }
        });
      });

      this.coAttainments = Array.from(coAttainmentMap.entries()).map(([code, data]) => {
        const avgAchievement = data.scores.length > 0
          ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length
          : 0;

        const status = avgAchievement >= this.targetPercentage
          ? 'Achieved'
          : avgAchievement >= 50
          ? 'Partial'
          : 'Not Achieved';

        const coDetails = coMap.get(code);
        return {
          code,
          description: coDetails?.description || '',
          achievement: Math.round(avgAchievement * 100) / 100,
          targetPercentage: this.targetPercentage,
          status,
          assessmentCount: data.assessments.length,
          studentCount: data.students.size
        };
      });

      if (this.coAttainments.length > 0) {
        this.overallAchievement = Math.round(
          (this.coAttainments.reduce((sum, co) => sum + co.achievement, 0) / this.coAttainments.length) * 100
        ) / 100;
      }

    } catch (error) {
      console.error('Error calculating CO attainment:', error);
      this.coAttainments = [];
    }
  }

  filterAttainments(): void {
    this.filteredAttainments = this.coAttainments.filter(attainment => {
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
    return this.coAttainments.filter(co => co.status === 'Achieved').length;
  }

  getPartialCount(): number {
    return this.coAttainments.filter(co => co.status === 'Partial').length;
  }

  getNotAchievedCount(): number {
    return this.coAttainments.filter(co => co.status === 'Not Achieved').length;
  }

  getProgressWidth(achievement: number): number {
    return Math.min((achievement / 100) * 100, 100);
  }

  exportToCSV(): void {
    const headers = ['CO Code', 'Description', 'Achievement (%)', 'Target (%)', 'Status', 'Assessment Count', 'Student Count'];
    const rows = this.coAttainments.map(co => [
      co.code,
      co.description,
      co.achievement.toString(),
      co.targetPercentage.toString(),
      co.status,
      co.assessmentCount.toString(),
      co.studentCount.toString()
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `co-attainment-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }
}

