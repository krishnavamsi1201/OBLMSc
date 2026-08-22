import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';

interface FeedbackEntry {
  id: number;
  course: string;
  type: 'Positive' | 'Suggestion' | 'Issue';
  comment: string;
  date: string;
}

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, Navbar, Sidebar, Footer],
  template: `<app-navbar></app-navbar>

<div class="container">

    <app-sidebar></app-sidebar>

    <div class="content">

        <div class="page-header">
            <h1>💬 Feedback</h1>
            <p>Review student feedback and improvement suggestions for your courses.</p>
        </div>

        <div class="summary-grid">
            <div class="section-card">
                <h3>New Feedback</h3>
                <strong>{{ newFeedbackCount }}</strong>
                <p>Feedback items awaiting faculty review.</p>
            </div>
            <div class="section-card">
                <h3>Positive</h3>
                <strong>{{ positiveRate }}%</strong>
                <p>Positive feedback percentage for available responses.</p>
            </div>
            <div class="section-card">
                <h3>Improvement Requests</h3>
                <strong>{{ improvementCount }}</strong>
                <p>Feedback entries identifying action items.</p>
            </div>
        </div>

        <div class="table-card">
            <h2>Recent Feedback</h2>
            <table *ngIf="feedbackEntries.length; else noFeedback">
                <thead>
                    <tr>
                        <th>Course</th>
                        <th>Type</th>
                        <th>Comment</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let entry of feedbackEntries">
                        <td>{{ entry.course }}</td>
                        <td>{{ entry.type }}</td>
                        <td>{{ entry.comment }}</td>
                        <td>{{ entry.date }}</td>
                    </tr>
                </tbody>
            </table>
            <ng-template #noFeedback>
                <div class="empty-state">No feedback has been submitted yet.</div>
            </ng-template>
        </div>

        <app-footer></app-footer>
    </div>

</div>`,
  styles: [`.page{padding:24px}.empty-state{padding:18px 14px;border:1px dashed #90a4ae;border-radius:10px;color:#546e7a;}`]
})
export class Feedback {
  feedbackEntries: FeedbackEntry[] = [];

  get newFeedbackCount(): number {
    return this.feedbackEntries.length;
  }

  get positiveRate(): number {
    if (!this.feedbackEntries.length) {
      return 0;
    }
    const positive = this.feedbackEntries.filter(entry => entry.type === 'Positive').length;
    return Math.round((positive / this.feedbackEntries.length) * 100);
  }

  get improvementCount(): number {
    return this.feedbackEntries.filter(entry => entry.type === 'Suggestion' || entry.type === 'Issue').length;
  }
}
