import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/navbar/navbar';
import { Sidebar } from '../../shared/sidebar/sidebar';
import { Footer } from '../../shared/footer/footer';

interface QuestionItem {
  id: number;
  questionText: string;
  type: 'MCQ' | 'Short Answer' | 'Essay';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  marks: number;
  subject: string;
  coMapped: string;
}

@Component({
  selector: 'app-question-bank',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, Navbar, Sidebar, Footer],
  templateUrl: './question-bank.html',
  styleUrls: ['./question-bank.css'],
})
export class QuestionBank implements OnInit {
  role: string | null = null;
  questions: QuestionItem[] = [];
  filteredQuestions: QuestionItem[] = [];
  isLoading = true;

  // Form bindings
  currentQuestion: QuestionItem = this.createEmptyQuestion();
  editIndex = -1;
  showQuestionForm = false;

  // Filters
  searchTerm = '';
  difficultyFilter = '';
  typeFilter = '';
  subjectFilter = '';
  subjectsList: string[] = [];

  constructor() {
    try {
      this.role = localStorage.getItem('userRole')?.toLowerCase() || null;
    } catch {
      this.role = null;
    }
  }

  ngOnInit(): void {
    this.loadData();
    this.applyFilters();
  }

  createEmptyQuestion(): QuestionItem {
    return { id: 0, questionText: '', type: 'Short Answer', difficulty: 'Medium', marks: 5, subject: '', coMapped: 'CO1' };
  }

  private loadData(): void {
    try {
      const stored = localStorage.getItem('obslmsQuestionBank');
      this.questions = stored ? JSON.parse(stored) as QuestionItem[] : [];

      // Gather list of unique subjects
      const subjects = this.questions.map(q => q.subject);
      this.subjectsList = Array.from(new Set(subjects));

    } catch {
      this.questions = [];
    }
    this.isLoading = false;
  }

  private saveQuestions(): void {
    try {
      localStorage.setItem('obslmsQuestionBank', JSON.stringify(this.questions));
    } catch {}
  }

  applyFilters(): void {
    let results = this.questions;

    if (this.difficultyFilter) {
      results = results.filter(q => q.difficulty === this.difficultyFilter);
    }

    if (this.typeFilter) {
      results = results.filter(q => q.type === this.typeFilter);
    }

    if (this.subjectFilter) {
      results = results.filter(q => q.subject === this.subjectFilter);
    }

    if (this.searchTerm.trim()) {
      const query = this.searchTerm.toLowerCase();
      results = results.filter(q => 
        q.questionText.toLowerCase().includes(query) ||
        q.subject.toLowerCase().includes(query) ||
        q.coMapped.toLowerCase().includes(query)
      );
    }

    this.filteredQuestions = results;
  }

  openQuestionForm(): void {
    if (this.role !== 'admin' && this.role !== 'faculty') {
      alert('Only admins and faculty can manage the question bank.');
      return;
    }
    this.showQuestionForm = true;
    this.editIndex = -1;
    this.currentQuestion = this.createEmptyQuestion();
  }

  saveQuestion(): void {
    if (!this.currentQuestion.questionText || !this.currentQuestion.subject || !this.currentQuestion.coMapped) {
      alert('Please fill in all required question details.');
      return;
    }

    if (this.editIndex >= 0) {
      const targetId = this.questions[this.editIndex].id;
      this.questions[this.editIndex] = { ...this.currentQuestion, id: targetId };
    } else {
      const nextId = this.questions.length ? Math.max(...this.questions.map(q => q.id)) + 1 : 1;
      this.questions = [...this.questions, { ...this.currentQuestion, id: nextId }];
    }

    this.saveQuestions();
    
    // Refresh subjects list
    const subjects = this.questions.map(q => q.subject);
    this.subjectsList = Array.from(new Set(subjects));

    this.closeQuestionForm();
    this.applyFilters();
  }

  editQuestion(qItem: QuestionItem): void {
    const idx = this.questions.findIndex(q => q.id === qItem.id);
    if (idx >= 0) {
      this.editIndex = idx;
      this.currentQuestion = { ...qItem };
      this.showQuestionForm = true;
    }
  }

  deleteQuestion(qItem: QuestionItem): void {
    if (confirm('Are you sure you want to delete this question?')) {
      this.questions = this.questions.filter(q => q.id !== qItem.id);
      this.saveQuestions();
      this.applyFilters();
    }
  }

  closeQuestionForm(): void {
    this.showQuestionForm = false;
    this.editIndex = -1;
    this.currentQuestion = this.createEmptyQuestion();
  }
}
