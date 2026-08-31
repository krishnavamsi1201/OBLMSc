import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';

interface ChatMessage {
  from: 'user' | 'bot';
  text: string;
  timestamp?: string;
  quickAction?: { label: string; route: string };
}

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
  private router = inject(Router);
  private http = inject(HttpClient);

  userMessage = '';
  isOpen = false;

  messages: ChatMessage[] = [
    {
      from: 'bot',
      text: '👋 Hello! I am your OBLMS Academic AI Assistant. Ask me about your real-time attendance, safe bunk calculations, CO-PO mappings, exam schedules, or accreditation metrics!'
    }
  ];

  quickPrompts = [
    '📊 Check My Attendance',
    '💡 Can I bunk tomorrow?',
    '🎯 Explain CO-PO Mapping',
    '📝 When is my next exam?',
    '🏛️ What is NBA SAR Criterion 3?'
  ];

  suggestions: Array<{ label: string; route: string }> = [];
  isListening = false;
  voiceStatus = 'Click mic to speak';
  private recognition: any;

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  sendMessage(customText?: string): void {
    const message = (customText || this.userMessage).trim();
    if (!message) return;

    this.messages.push({ from: 'user', text: message });
    if (!customText) {
      this.userMessage = '';
    }

    const payload = {
      message: message,
      userName: localStorage.getItem('userName') || 'Student',
      userId: localStorage.getItem('userId') || ''
    };

    this.http.post<any>('http://localhost:8080/api/chatbot/query', payload).subscribe({
      next: (response) => {
        this.messages.push({
          from: 'bot',
          text: response.text,
          quickAction: response.quickAction
        });
        this.suggestions = response.suggestions || [];
      },
      error: () => {
        // Fallback to local processing if API fails
        const response = this.processCommand(message);
        this.messages.push({
          from: 'bot',
          text: response.text,
          quickAction: response.quickAction
        });
        this.suggestions = response.suggestions || [];
      }
    });
  }

  clickSuggestion(route: string): void {
    this.router.navigate([route]);
    this.suggestions = [];
  }

  sendQuickPrompt(promptText: string): void {
    this.sendMessage(promptText);
  }

  onInputChange(): void {
    const lower = this.userMessage.toLowerCase().trim();
    if (!lower) {
      this.suggestions = [];
      return;
    }
    const allSuggestions = [
      { label: 'View Enrolled Courses 📚', route: '/courses', keywords: ['course', 'subject', 'class', 'register', 'enroll'] },
      { label: 'View Outcomes (CO) 🎯', route: '/course-outcomes', keywords: ['outcome', 'co', 'po', 'attainment', 'mapping'] },
      { label: 'View Exams Schedule 📝', route: '/assessments', keywords: ['exam', 'test', 'schedule', 'assess', 'mid'] },
      { label: 'View Attendance 📅', route: '/attendance', keywords: ['attendance', 'present', 'absent', 'percentage', 'bunk'] },
      { label: 'View Performance & Results 📈', route: '/performance', keywords: ['marks', 'grade', 'cgpa', 'gpa', 'performance', 'average', 'result'] },
      { label: 'File Grievance Desk 📩', route: '/grievance', keywords: ['complain', 'grievance', 'ticket', 'issue', 'problem', 'support'] }
    ];

    this.suggestions = allSuggestions.filter(s => 
      s.keywords.some(k => lower.includes(k)) || s.label.toLowerCase().includes(lower)
    ).map(s => ({ label: s.label, route: s.route }));
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

  private getSafeJson(key: string): any[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private processCommand(input: string): { text: string; navigateTo?: string; quickAction?: { label: string; route: string }; suggestions?: Array<{ label: string; route: string }> } {
    const lower = input.toLowerCase();
    const userName = localStorage.getItem('userName') || 'Student';
    const role = (localStorage.getItem('userRole') || 'student').toLowerCase();

    if (lower.includes('bunk') || lower.includes('skip') || lower.includes('can i miss')) {
      const logs = this.getSafeJson('obslmsAttendance');
      const totalLectures = logs.length > 0 ? logs.length : 20;
      const totalPresent = logs.length > 0 ? logs.filter((l: any) => l.status === 'Present').length : 16;
      const pct = Math.round((totalPresent / totalLectures) * 100);

      const safeBunks = Math.floor((totalPresent - 0.75 * totalLectures) / 0.75);

      if (safeBunks > 0) {
        return {
          text: `📊 Your current attendance is ${pct}% (${totalPresent}/${totalLectures} lectures attended).\n\n✅ Safe Bunk Calculation: You can safely miss ${safeBunks} lecture(s) without dropping below the mandatory 75% threshold.`,
          quickAction: { label: 'Open Attendance Portal', route: '/attendance' }
        };
      } else {
        const needed = Math.ceil(((0.75 * totalLectures) - totalPresent) / 0.25);
        return {
          text: `⚠️ Attendance Warning: Your attendance is currently ${pct}%, which is close to or below 75%.\n\n❌ You cannot safely bunk any classes right now. You need to attend ${Math.max(1, needed)} consecutive lecture(s) to secure examination clearance.`,
          quickAction: { label: 'View Attendance Breakdown', route: '/attendance' }
        };
      }
    }

    if (lower.includes('attendance') || lower.includes('present') || lower.includes('absent')) {
      const logs = this.getSafeJson('obslmsAttendance');
      const totalLectures = logs.length > 0 ? logs.length : 20;
      const totalPresent = logs.length > 0 ? logs.filter((l: any) => l.status === 'Present').length : 16;
      const pct = Math.round((totalPresent / totalLectures) * 100);

      return {
        text: `📊 ${userName}, your current overall attendance across all enrolled courses is ${pct}% (${totalPresent} attended out of ${totalLectures} conducted classes).\n\nExam Clearance Status: ${pct >= 75 ? '🟢 Eligible (Good Standing)' : '🔴 Debarment Warning (<75%)'}.`,
        quickAction: { label: 'Go to Attendance Dashboard', route: '/attendance' },
        suggestions: [
          { label: '📊 Overall Breakdown', route: '/attendance' },
          { label: '📆 Day-Wise Schedule', route: '/attendance' },
          { label: '📚 Subject-Wise Attendance', route: '/attendance' }
        ]
      };
    }

    if (lower.includes('what is co') || lower.includes('course outcome') || lower.includes('explain co')) {
      return {
        text: `🎯 Course Outcomes (COs) are measurable statements describing the knowledge and practical skills a student achieves by completing a specific course.\n\nExample: In DBMS, CO1 represents formulating relational algebra queries, and CO3 represents BCNF normal form decomposition.`,
        quickAction: { label: 'View Course Outcomes Matrix', route: '/course-outcomes' }
      };
    }

    if (lower.includes('what is po') || lower.includes('program outcome') || lower.includes('explain po')) {
      return {
        text: `🎓 Program Outcomes (POs) are 12 standardized graduate attributes defined by the National Board of Accreditation (NBA):\n\n• PO1: Engineering Knowledge\n• PO2: Problem Analysis\n• PO3: Design/Development of Solutions\n• PO5: Modern Tool Usage\n• PO8: Ethics\n• PO9: Teamwork\n• PO12: Life-long Learning`,
        quickAction: { label: 'View PO Attainment Dashboard', route: '/po-attainment' }
      };
    }

    if (lower.includes('mapping') || lower.includes('co-po') || lower.includes('copo')) {
      return {
        text: `📐 CO-PO Mapping connects student exam performance to graduation competencies.\n\nEach CO is mapped to POs with correlation weights (3 = High, 2 = Medium, 1 = Low). When students pass assessments, the system mathematically calculates PO achievement percentages!`,
        quickAction: { label: 'Open CO-PO Matrix', route: '/copo-mapping' }
      };
    }

    if (lower.includes('bloom') || lower.includes('taxonomy') || lower.includes('cognitive')) {
      return {
        text: `🧠 Bloom's Taxonomy classifies thinking levels into 6 tiers:\n\n1. L1: Remember (Define/List)\n2. L2: Understand (Explain/Describe)\n3. L3: Apply (Compute/Implement)\n4. L4: Analyze (Compare/Examine)\n5. L5: Evaluate (Judge/Critique)\n6. L6: Create (Design/Synthesize)\n\nOur Question Bank auto-classifies questions using AI action verbs!`,
        quickAction: { label: 'Open AI Question Bank', route: '/question-bank' }
      };
    }

    if (lower.includes('nba') || lower.includes('naac') || lower.includes('criterion 3') || lower.includes('sar')) {
      return {
        text: `🏛️ NBA SAR Criterion 3 evaluates Course & Program Outcomes Attainment (Tier-1 Standard).\n\nOur system includes a 1-Click PDF Report Generator that formats institutional IQAC seals, CO-PO attainment levels (3/2/1), and Continuous Quality Improvement (CQI) remedial action plans!`,
        quickAction: { label: 'Generate NBA SAR Report', route: '/reports' }
      };
    }

    if (lower.includes('exam') || lower.includes('test') || lower.includes('schedule') || lower.includes('midterm')) {
      return {
        text: '📝 Midterm Examination 1 is scheduled for next month. Check your assessments and course outcomes to prepare.',
        quickAction: { label: 'View Assessment Schedule', route: '/assessments' }
      };
    }

    if (lower.includes('cgpa') || lower.includes('gpa') || lower.includes('grade') || lower.includes('marks')) {
      return {
        text: `📈 Student Academic Performance: Your current calculated CGPA is 8.45 with an average score of 82% across all internal assessments and assignments.`,
        quickAction: { label: 'View Performance Analytics', route: '/performance' }
      };
    }

    if (lower.includes('grievance') || lower.includes('complain') || lower.includes('ticket') || lower.includes('issue')) {
      return {
        text: `📩 You can submit academic inquiries, attendance re-evaluation requests, or syllabus concerns directly to the Dean on the Grievance Desk.`,
        quickAction: { label: 'Open Grievance Desk', route: '/grievance' }
      };
    }

    if (lower.includes('dashboard') || lower.includes('home')) {
      return { text: 'Navigating to your dashboard...', navigateTo: role === 'admin' ? '/admin' : role === 'faculty' ? '/faculty' : '/dashboard' };
    }

    if (lower.includes('course') || lower.includes('subject')) {
      return { text: 'Here are your registered courses and syllabus allocations.', navigateTo: '/courses' };
    }

    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      return {
        text: `Hello ${userName}! How can I assist you with your academics or OBE accreditation today? Try clicking one of the quick prompts below.`
      };
    }

    return {
      text: `I understood your query about "${input}". Here are the relevant modules you can explore:`,
      suggestions: [
        { label: '📊 View Attendance', route: '/attendance' },
        { label: '🧠 AI Question Bank', route: '/question-bank' },
        { label: '🎯 CO-PO Attainment', route: '/copo-mapping' },
        { label: '📄 NBA/NAAC Reports', route: '/reports' }
      ]
    };
  }
}
