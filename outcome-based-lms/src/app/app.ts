import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Chatbot } from './pages/chatbot/chatbot';
import { ToastService } from './shared/services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Chatbot],
  templateUrl: './app.html'
})
export class App implements OnInit {
  private toastService = inject(ToastService);
  toasts$ = this.toastService.getToasts();

  ngOnInit(): void {
    this.purgeLegacyDummyData();
  }

  /**
   * One-time automated purge of legacy dummy cache in browser localStorage
   */
  private purgeLegacyDummyData(): void {
    try {
      const cleanKey = 'obslms_zero_dummy_v1';
      if (localStorage.getItem(cleanKey) !== 'true') {
        const dummyKeys = [
          'obslmsOutcomes',
          'obslmsProgramOutcomes',
          'obslmsCourseOutcomes',
          'obslmsCoMappings',
          'obslmsAssessmentCOMappings',
          'obslmsMarkEntries',
          'obslmsAssessments',
          'obslmsExams',
          'obslmsQuestionBank',
          'obslmsGrievances',
          'obslmsNotifications',
          'obslmsAttendance',
          'obslmsCourses',
          'obslmsTimetable',
          'obslmsCourseSubjects',
          'obslmsFacultyAllocations'
        ];

        dummyKeys.forEach(k => localStorage.removeItem(k));
        localStorage.setItem(cleanKey, 'true');
      }
    } catch (e) {
      console.warn('Could not auto-purge legacy cache:', e);
    }
  }

  removeToast(id: string): void {
    this.toastService.remove(id);
  }
}