import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Chatbot } from './pages/chatbot/chatbot';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Chatbot],
  templateUrl: './app.html'
})
export class App {
}