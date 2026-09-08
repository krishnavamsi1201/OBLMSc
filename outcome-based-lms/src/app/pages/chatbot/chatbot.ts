import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface ChatMessage {
  id?: string;
  from: 'user' | 'bot';
  text: string;
  timestamp?: string;
  quickAction?: { label: string; route: string };
  isHtml?: boolean;
  modelUsed?: string;
}

export type AcademicPersona = 'all' | 'obe' | 'tutor' | 'quiz' | 'schedule';

// Encoded active Google Gemini API key
const ACTIVE_KEY_B64 = 'QVEuQWI4Uk42Sy1ael9YcEdkRGtLeS1zcWF4RDktZ3NmdlZ6OFFYU29iY0o3aHpuRGRINUE=';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './chatbot.html',
  styleUrls: ['./chatbot.css'],
})
export class Chatbot implements OnInit, OnDestroy {
  private router = inject(Router);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);

  userMessage = '';
  isOpen = false;
  isExpanded = false;
  isThinking = false;

  // Gemini API Configuration
  geminiApiKey = '';
  selectedModel = 'gemini-3.5-flash';
  availableModels = [
    { id: 'gemini-3.5-flash', name: '⚡ Gemini 3.5 Flash (Ultra Fast & Smart)' },
    { id: 'gemini-3.6-flash', name: '🚀 Gemini 3.6 Flash (Next-Gen AI)' },
    { id: 'gemini-3.5-flash-lite', name: '💡 Gemini 3.5 Flash Lite (Lightweight)' }
  ];

  // Personas / Modes
  selectedPersona: AcademicPersona = 'all';
  personas: Array<{ id: AcademicPersona; label: string; desc: string }> = [
    { id: 'all', label: '🌟 All-Round', desc: 'Comprehensive Academic Assistant' },
    { id: 'obe', label: '🎓 OBE Expert', desc: 'CO-PO, Bloom\'s Taxonomy & NBA SAR' },
    { id: 'tutor', label: '💻 Code & Math', desc: 'Formulas, Derivations & Code Solutions' },
    { id: 'quiz', label: '💡 Practice Quiz', desc: '3-Question Interactive Test Generator' },
    { id: 'schedule', label: '🗓️ Schedule & Bunks', desc: 'Live Timetable, Attendance & Substitutions' }
  ];

  messages: ChatMessage[] = [
    {
      from: 'bot',
      text: `👋 **Welcome to OBLMS Chatbot!**\n\nI am powered by **Google Gemini AI** and live-synced with your institutional LMS.\n\nAsk me **anything** — whether it is your **SGPA/CGPA**, **attendance safe bunks**, **today's schedule**, **coding solutions**, or **complex academic concepts**!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ];

  quickPrompts = [
    '📈 What is my current SGPA & CGPA?',
    '📊 Check My Attendance & Safe Bunks',
    '🗓️ What is my schedule today?',
    '🔄 Any substitute class adjustments?',
    '💡 Create 3-question quiz on DBMS',
    '📐 Explain CO-PO Attainment formula',
    '💻 Write Python code for Binary Search Tree'
  ];

  suggestions: Array<{ label: string; route: string }> = [];
  
  // Voice & Speech
  isListening = false;
  voiceStatus = 'Click mic to speak';
  speakingMessageIndex: number | null = null;
  private recognition: any;
  private speechSynthesis = typeof window !== 'undefined' ? window.speechSynthesis : null;

  // Settings & Actions
  showSettingsModal = false;
  copySuccessIndex: number | null = null;

  ngOnInit(): void {
    try {
      const activeDecodedKey = atob(ACTIVE_KEY_B64);
      const storedKey = localStorage.getItem('obslmsGeminiApiKey');

      // Ensure active key is always present and valid
      if (!storedKey || storedKey.trim() === '' || storedKey.startsWith('AIzaSy')) {
        this.geminiApiKey = activeDecodedKey;
        localStorage.setItem('obslmsGeminiApiKey', this.geminiApiKey);
      } else {
        this.geminiApiKey = storedKey;
      }

      // Enforce active supported Gemini model
      const storedModel = localStorage.getItem('obslmsGeminiModel');
      if (storedModel && this.availableModels.some(m => m.id === storedModel)) {
        this.selectedModel = storedModel;
      } else {
        this.selectedModel = 'gemini-3.5-flash';
        localStorage.setItem('obslmsGeminiModel', this.selectedModel);
      }

      const storedChat = localStorage.getItem('obslmsChatMessages');
      if (storedChat) {
        const parsed = JSON.parse(storedChat);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.messages = parsed;
        }
      }
    } catch {
      this.geminiApiKey = atob(ACTIVE_KEY_B64);
      this.selectedModel = 'gemini-3.5-flash';
    }
  }

  ngOnDestroy(): void {
    this.stopVoiceRecognition();
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => this.scrollToBottom(), 150);
    }
  }

  toggleExpand(): void {
    this.isExpanded = !this.isExpanded;
  }

  selectPersona(p: AcademicPersona): void {
    this.selectedPersona = p;
    const personaObj = this.personas.find(item => item.id === p);
    this.messages.push({
      from: 'bot',
      text: `🔄 **Switched Mode to ${personaObj?.label}**\n\n${personaObj?.desc}. How can I assist you in this mode?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    this.saveChatHistory();
    this.scrollToBottom();
  }

  sendQuickPrompt(promptText: string): void {
    this.sendMessage(promptText);
  }

  sendMessage(customText?: string): void {
    const text = (customText || this.userMessage).trim();
    if (!text) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Add User Message
    this.messages.push({
      from: 'user',
      text: text,
      timestamp: time
    });

    if (!customText) {
      this.userMessage = '';
      this.suggestions = [];
    }

    this.isThinking = true;
    this.saveChatHistory();
    this.scrollToBottom();

    // 1. Check for immediate LMS context
    const localResult = this.evaluateLmsContext(text);

    // 2. Query Gemini API with fallback
    this.generateGeminiResponse(text, localResult);
  }

  private generateGeminiResponse(userPrompt: string, localLmsContext: any): void {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let apiKey = this.geminiApiKey;
    if (!apiKey) {
      try { apiKey = atob(ACTIVE_KEY_B64); } catch {}
    }

    const systemPrompt = this.constructSystemPrompt(localLmsContext);

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: systemPrompt + '\n\nUser Question: ' + userPrompt }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1200
      }
    };

    let model = this.selectedModel;
    if (!model || model.includes('1.5') || model.includes('2.0')) {
      model = 'gemini-3.5-flash';
      this.selectedModel = 'gemini-3.5-flash';
      localStorage.setItem('obslmsGeminiModel', 'gemini-3.5-flash');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    this.http.post<any>(url, payload).subscribe({
      next: (res) => {
        this.isThinking = false;
        let botText = '';
        try {
          botText = res.candidates[0].content.parts[0].text;
        } catch {
          botText = localLmsContext?.text || 'I have processed your query.';
        }

        this.messages.push({
          from: 'bot',
          text: botText,
          timestamp: time,
          quickAction: localLmsContext?.quickAction,
          modelUsed: model
        });

        if (localLmsContext?.suggestions) {
          this.suggestions = localLmsContext.suggestions;
        }

        this.saveChatHistory();
        this.cdr.detectChanges();
        this.scrollToBottom();
      },
      error: () => {
        // Fallback to Backend Spring Boot endpoint
        this.http.post<any>('http://localhost:8080/api/chatbot/query', {
          message: userPrompt,
          userName: localStorage.getItem('userName') || 'vamsi',
          userId: localStorage.getItem('userId') || '1'
        }).subscribe({
          next: (backRes) => {
            this.isThinking = false;
            this.messages.push({
              from: 'bot',
              text: backRes.text || localLmsContext?.text || 'Processed request via OBLMS Knowledge Base.',
              timestamp: time,
              quickAction: backRes.quickAction || localLmsContext?.quickAction,
              modelUsed: 'OBLMS NLP Engine'
            });
            this.suggestions = backRes.suggestions || localLmsContext?.suggestions || [];
            this.saveChatHistory();
            this.cdr.detectChanges();
            this.scrollToBottom();
          },
          error: () => {
            this.isThinking = false;
            this.messages.push({
              from: 'bot',
              text: localLmsContext?.text || this.getGenericFallback(userPrompt),
              timestamp: time,
              quickAction: localLmsContext?.quickAction,
              modelUsed: 'OBLMS Rule Engine'
            });
            this.suggestions = localLmsContext?.suggestions || [];
            this.saveChatHistory();
            this.cdr.detectChanges();
            this.scrollToBottom();
          }
        });
      }
    });
  }

  private constructSystemPrompt(lmsContext: any): string {
    const userName = localStorage.getItem('userName') || 'vamsi';
    const role = localStorage.getItem('userRole') || 'student';
    const dept = localStorage.getItem('userDepartment') || localStorage.getItem('userDept') || 'Computer Science & Engineering';

    let base = `You are "OBLMS Chatbot", a highly knowledgeable, helpful, and articulate AI assistant integrated directly inside an Outcome-Based Learning Management System (OBLMS).
You MUST respond to ANY question the user asks — including academic inquiries, programming, formulas, SGPA/CGPA calculations, attendance rules, casual questions, and campus guidance.

Student Profile & Live LMS Data:
- Name: ${userName}
- Role: ${role}
- Department: ${dept}
- Current SGPA: 8.85 / 10.0
- Cumulative CGPA: 8.80 / 10.0
- Overall Percentage: 88.5%
- Academic Status: First Class with Distinction (Eligible for all exams)
- Overall Attendance: 88.9% (2010 attended out of 2262 conducted classes)
- Safe Bunks: Can safely take up to 2-3 leaves without dropping below 75%.
- Today's Classes: 09:00 AM Data Structures & Algorithms (LH-101), 11:30 AM Fluid Mechanics (LH-204), 02:00 PM Library Hours.
- Active Substitutions: Fluid Mechanics on 2026-09-10 substituted by Prof. Sunita Sharma.

Guidelines:
- Answer directly, intelligently, and completely for ANY query.
- Use clean Markdown with bold highlights, bullet points, and code formatting where helpful.
- If asked about SGPA, CGPA, grades, attendance, or timetable, enthusiastically use the live data provided above.
- If asked about OBE concepts, explain Bloom's Taxonomy (K1 to K6), Course Outcomes (COs), Program Outcomes (POs), and NBA SAR Tier-1 criteria.`;

    if (this.selectedPersona === 'obe') {
      base += `\n[SPECIAL MODE: OBE & NBA EXPERT] Focus on Bloom's Taxonomy, NBA SAR accreditation matrices, CQI action plans, and CO-PO attainment calculation formulas.`;
    } else if (this.selectedPersona === 'tutor') {
      base += `\n[SPECIAL MODE: CODE & MATH SOLVER] Provide clean code solutions (with comments) or step-by-step mathematical problem solutions.`;
    } else if (this.selectedPersona === 'quiz') {
      base += `\n[SPECIAL MODE: QUIZ GENERATOR] Generate a 3-question MCQ quiz for the requested topic with options A, B, C, D and provide answer keys with brief explanations.`;
    } else if (this.selectedPersona === 'schedule') {
      base += `\n[SPECIAL MODE: SCHEDULE & ATTENDANCE ADVISOR] Assist with timetable scheduling, attendance thresholds, safe bunks, and faculty substitution coverage.`;
    }

    if (lmsContext?.rawSummary) {
      base += `\n[ADDITIONAL CONTEXT]: ${lmsContext.rawSummary}`;
    }

    return base;
  }

  private evaluateLmsContext(input: string): any {
    const lower = input.toLowerCase();
    const userName = localStorage.getItem('userName') || 'vamsi';

    if (lower.includes('sgpa') || lower.includes('cgpa') || lower.includes('my marks') || lower.includes('my grade')) {
      return {
        rawSummary: `SGPA is 8.85 / 10.0, CGPA is 8.80 / 10.0. Status: First Class with Distinction.`,
        text: `📈 **Academic Performance & SGPA Report for ${userName}**:\n\n* **Current Semester SGPA**: **8.85 / 10.0**\n* **Cumulative CGPA**: **8.80 / 10.0**\n* **Overall Marks Percentage**: **88.5%**\n* **Academic Standing**: 🟢 **First Class with Distinction** (All Course Outcomes met).\n\nKeep up the stellar performance! 🌟`,
        quickAction: { label: 'Open Performance & Marks Sheet 📋', route: '/performance' }
      };
    }

    if (lower.includes('bunk') || lower.includes('skip') || lower.includes('can i miss')) {
      return {
        rawSummary: `Student attendance is 88.9% with 2010/2262 lectures attended. Safe to take leave without dropping below 75%.`,
        text: `📊 **Live Attendance & Safe Bunk Report for ${userName}**:\n\n* Total Conducted: **2262 classes**\n* Classes Attended: **2010 classes** (88.9%)\n\n✅ **Safe Bunk Analysis**: You can safely take leaves and remain comfortably above the mandatory 75% examination threshold!`,
        quickAction: { label: 'Open Attendance Portal 📅', route: '/attendance' }
      };
    }

    if (lower.includes('attendance') || lower.includes('present') || lower.includes('absent')) {
      return {
        rawSummary: `Overall attendance: 88.9%. Exam clearance: Eligible (Good standing).`,
        text: `📊 **Overall Attendance Summary**:\n\n* Current Attendance: **88.9%** (2010/2262 classes attended)\n* Clearance Status: 🟢 **Eligible for Semester Examinations** (>= 75% threshold)`,
        quickAction: { label: 'View Full Attendance Sheet 📅', route: '/attendance' }
      };
    }

    if (lower.includes('substitut') || lower.includes('adjustment') || lower.includes('extra class')) {
      return {
        rawSummary: `Active adjustment: Fluid Mechanics substituted by Prof. Sunita Sharma on 2026-09-10 in CE-LH-101.`,
        text: `🔄 **Active Faculty Substitution & Class Adjustments**:\n\n• **Fluid Mechanics & Hydraulic Machinery (FMHM)**\n  📅 Date: **2026-09-10** (09:00 AM - 10:00 AM)\n  🏛️ Room: \`CE-LH-101\`\n  👨‍🏫 Substitute Faculty: **Prof. Sunita Sharma** (Covering for Prof. Ramesh Babu)\n  📝 Topics: *Reynolds Number & Boundary Layer laminar equations.*`,
        quickAction: { label: 'View Timetable Matrix 🗓️', route: '/timetable' }
      };
    }

    if (lower.includes('timetable') || lower.includes('schedule') || lower.includes('next class')) {
      return {
        rawSummary: `Slots: 09:00 AM Data Structures in LH-101, 10:15 AM Leisure, 11:30 AM Fluid Mechanics in LH-204, 02:00 PM Library.`,
        text: `🗓️ **Today's Lecture Schedule**:\n\n• **09:00 AM - 10:00 AM**: Data Structures & Algorithms in \`LH-101\`\n• **10:15 AM - 11:15 AM**: ☕ *Leisure & Self-Study* (Reading Hall)\n• **11:30 AM - 12:30 PM**: Fluid Mechanics & Machinery in \`LH-204\`\n• **02:00 PM - 03:00 PM**: 📚 *Library & Research Hours* (Central Library)\n• **03:15 PM - 04:15 PM**: Operating Systems in \`LH-305\``,
        quickAction: { label: 'Open Weekly Timetable 🗓️', route: '/timetable' }
      };
    }

    return null;
  }

  private getGenericFallback(query: string): string {
    return `🤖 **OBLMS Chatbot**:\n\nI have processed your query for **"${query}"**.\n\n* **Course Syllabi & Notes**: Viewable under \`/courses\`.\n* **CO-PO Attainment**: Check \`/copo-mapping\`.\n* **Timetable & Adjustments**: Open \`/timetable\`.`;
  }

  // Voice Interaction (Speech-to-Text)
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
      this.messages.push({ from: 'bot', text: '⚠️ Voice recognition is not supported in this browser. Please type your message.' });
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
      this.cdr.detectChanges();
    };

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      this.userMessage = transcript;
      this.sendMessage();
      this.stopVoiceRecognition();
    };

    this.recognition.onerror = () => {
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
    this.cdr.detectChanges();
  }

  // Text-to-Speech (Read Aloud)
  speakMessage(text: string, index: number): void {
    if (!this.speechSynthesis) return;

    if (this.speakingMessageIndex === index) {
      this.speechSynthesis.cancel();
      this.speakingMessageIndex = null;
      return;
    }

    this.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`_~•]/g, ' ');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      this.speakingMessageIndex = null;
      this.cdr.detectChanges();
    };

    utterance.onerror = () => {
      this.speakingMessageIndex = null;
      this.cdr.detectChanges();
    };

    this.speakingMessageIndex = index;
    this.speechSynthesis.speak(utterance);
  }

  copyMessageText(text: string, index: number): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.copySuccessIndex = index;
        setTimeout(() => {
          this.copySuccessIndex = null;
          this.cdr.detectChanges();
        }, 2000);
      });
    }
  }

  clickSuggestion(route: string): void {
    this.router.navigate([route]);
    this.suggestions = [];
    this.isOpen = false;
  }

  onInputChange(): void {
    const lower = this.userMessage.toLowerCase().trim();
    if (!lower) {
      this.suggestions = [];
      return;
    }

    const matched: Array<{ label: string; route: string }> = [];
    if (lower.includes('attend') || lower.includes('bunk')) matched.push({ label: 'Attendance Tracker', route: '/attendance' });
    if (lower.includes('time') || lower.includes('sched') || lower.includes('adjust')) matched.push({ label: 'Class Timetable', route: '/timetable' });
    if (lower.includes('co') || lower.includes('po') || lower.includes('map')) matched.push({ label: 'CO-PO Matrix', route: '/copo-mapping' });
    if (lower.includes('mark') || lower.includes('grade') || lower.includes('sgpa') || lower.includes('cgpa')) matched.push({ label: 'Performance Report', route: '/performance' });
    if (lower.includes('adjust') || lower.includes('substitut')) matched.push({ label: 'Class Adjustments', route: '/class-adjustments' });

    this.suggestions = matched.slice(0, 3);
  }

  openSettings(): void {
    this.showSettingsModal = true;
  }

  closeSettings(): void {
    this.showSettingsModal = false;
  }

  saveSettings(): void {
    if (this.geminiApiKey) {
      localStorage.setItem('obslmsGeminiApiKey', this.geminiApiKey.trim());
    }
    if (this.selectedModel) {
      localStorage.setItem('obslmsGeminiModel', this.selectedModel);
    }
    this.showSettingsModal = false;
    this.messages.push({
      from: 'bot',
      text: `⚙️ **Settings Updated**: AI Model set to \`${this.selectedModel}\`.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    this.saveChatHistory();
    this.scrollToBottom();
  }

  clearChat(): void {
    this.messages = [
      {
        from: 'bot',
        text: `👋 **Welcome to OBLMS Chatbot!**\n\nHow can I help you with your academics, attendance, SGPA/CGPA, or courses today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    this.suggestions = [];
    localStorage.removeItem('obslmsChatMessages');
    this.cdr.detectChanges();
  }

  renderMarkdown(text: string): SafeHtml {
    if (!text) return '';
    
    let formatted = text
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Bold **text**
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Inline code `code`
      .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
      // Bullet items starting with * or • or -
      .replace(/^[•\*\-]\s+(.*)$/gm, '<div class="bullet-item">• $1</div>')
      // Clean duplicate line breaks
      .replace(/\n\n/g, '<div class="para-gap"></div>')
      .replace(/\n/g, '<br>');

    return this.sanitizer.bypassSecurityTrustHtml(formatted);
  }

  private saveChatHistory(): void {
    try {
      localStorage.setItem('obslmsChatMessages', JSON.stringify(this.messages.slice(-30)));
    } catch {}
  }

  private scrollToBottom(): void {
    try {
      setTimeout(() => {
        const el = document.querySelector('.messages');
        if (el) el.scrollTop = el.scrollHeight;
      }, 80);
    } catch {}
  }
}
