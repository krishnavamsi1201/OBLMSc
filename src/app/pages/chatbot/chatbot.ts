import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatListModule
  ],
  templateUrl: './chatbot.html',
  styleUrls: ['./chatbot.css'],
})
export class Chatbot {
  userMessage = '';

  messages: Array<{ from: 'user' | 'bot'; text: string }> = [
    {
      from: 'bot',
      text: 'Hello! I am your LMS assistant. Ask me about courses, outcomes, reports, or click a recommendation below to navigate.'
    }
  ];

  isOpen = false;

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  suggestions: Array<{ label: string; route: string }> = [];
  isListening = false;
  voiceStatus = 'Click mic to speak';
  private recognition: any;

  constructor(private router: Router) {}

  sendMessage(): void {
    const message = this.userMessage.trim();
    if (!message) {
      return;
    }

    this.messages.push({ from: 'user', text: message });
    this.userMessage = '';

    const response = this.processCommand(message);
    this.messages.push({ from: 'bot', text: response.text });
    this.suggestions = response.suggestions || this.defaultSuggestions();

    if (response.navigateTo && !response.suggestions) {
      setTimeout(() => {
        this.router.navigate([response.navigateTo]);
      }, 500);
    }
  }

  clickSuggestion(route: string): void {
    this.router.navigate([route]);
    this.suggestions = [];
  }

  private defaultSuggestions(): Array<{ label: string; route: string }> {
    return [
      { label: 'Courses', route: '/courses' },
      { label: 'Outcomes', route: '/outcomes' },
      { label: 'Assessments', route: '/assessments' },
      { label: 'Dashboard', route: '/dashboard' }
    ];
  }

  toggleVoice(): void {
    if (this.isListening) {
      this.stopVoiceRecognition();
    } else {
      this.startVoiceRecognition();
    }
  }

  private startVoiceRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.messages.push({ from: 'bot', text: 'Voice recognition is not supported in this browser.' });
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;
    this.recognition.continuous = false;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.voiceStatus = 'Listening...';
    };

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.userMessage = transcript;
      this.sendMessage();
      this.stopVoiceRecognition();
    };

    this.recognition.onerror = () => {
      this.messages.push({ from: 'bot', text: 'Voice recognition failed. Please try again.' });
      this.stopVoiceRecognition();
    };

    this.recognition.onend = () => {
      this.stopVoiceRecognition();
    };

    this.recognition.start();
  }

  private stopVoiceRecognition(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
    this.isListening = false;
    this.voiceStatus = 'Click mic to speak';
  }

  private processCommand(input: string): { text: string; navigateTo?: string; suggestions?: Array<{ label: string; route: string }> } {
    const lower = input.toLowerCase();

    if (lower.includes('open') || lower.includes('go to') || lower.includes('show')) {
      if (lower.includes('assign') || lower.includes('assessment')) {
        return { text: 'Opening Assessments page for you now.', navigateTo: '/assessments' };
      }
      if (lower.includes('course')) {
        return { text: 'Opening Courses page now.', navigateTo: '/courses' };
      }
      if (lower.includes('outcome')) {
        return { text: 'Opening Outcomes page now.', navigateTo: '/outcomes' };
      }
      if (lower.includes('dashboard')) {
        return { text: 'Taking you to the Dashboard.', navigateTo: '/dashboard' };
      }
      if (lower.includes('copo') || lower.includes('co-po')) {
        return { text: 'Opening the CO-PO Mapping page.', navigateTo: '/copo-mapping' };
      }
      if (lower.includes('attain')) {
        return { text: 'Opening the Attainment page.', navigateTo: '/attainment' };
      }
      if (lower.includes('student')) {
        return { text: 'Opening the Students page.', navigateTo: '/students' };
      }
      if (lower.includes('report')) {
        return { text: 'Opening the Reports page.', navigateTo: '/reports' };
      }
      if (lower.includes('setting')) {
        return { text: 'Opening Settings.', navigateTo: '/settings' };
      }
      if (lower.includes('faculty')) {
        return { text: 'Opening the Faculty page.', navigateTo: '/faculty' };
      }
      if (lower.includes('admin')) {
        return { text: 'Opening Admin page.', navigateTo: '/admin' };
      }
    }

    if (lower.includes('course')) {
      return { text: 'To view courses, go to the Courses page.', suggestions: [
          { label: 'Courses', route: '/courses' },
          { label: 'Assessments', route: '/assessments' },
          { label: 'Dashboard', route: '/dashboard' }
        ] };
    }
    if (lower.includes('outcome')) {
      return { text: 'Outcomes are managed on the Outcomes page.' };
    }
    if (lower.includes('report')) {
      return { text: 'Reports show performance data. You can open the Reports page.' };
    }
    if (lower.includes('attendance')) {
      return { text: 'Attendance metrics are shown on the Dashboard and course pages.' };
    }
    if (lower.includes('settings')) {
      return { text: 'Settings lets you adjust preferences.' };
    }
    if (lower.includes('hello') || lower.includes('hi')) {
      return {
        text: 'Hi there! Ask me to open pages like assignments, courses, or reports.',
        suggestions: [
          { label: 'Courses', route: '/courses' },
          { label: 'Outcomes', route: '/outcomes' },
          { label: 'Assessments', route: '/assessments' }
        ]
      };
    }

    return {
      text: 'I’m here to help with the LMS. Say something like "open assignments" or "open courses".',
      suggestions: [
        { label: 'Courses', route: '/courses' },
        { label: 'Outcomes', route: '/outcomes' },
        { label: 'Dashboard', route: '/dashboard' }
      ]
    };
  }
}
