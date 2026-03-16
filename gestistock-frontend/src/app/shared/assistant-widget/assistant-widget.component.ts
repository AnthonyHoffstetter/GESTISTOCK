import { Component, ChangeDetectorRef, ElementRef, ViewChild, AfterViewChecked, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssistantService, ChatMessage } from '../../services/assistant.service';

@Component({
  selector: 'app-assistant-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assistant-widget.component.html',
  styleUrl: './assistant-widget.component.css'
})
export class AssistantWidgetComponent implements AfterViewChecked, OnInit {
  isOpen = false;
  isLoading = false;
  input = '';
  messages: ChatMessage[] = [
    {
      role: 'assistant',
      content: 'Bonjour ! Je suis l’assistant GESTISTOCK. Comment puis-je vous aider ?'
    }
  ];
  quickSuggestions: string[] = [];

  constructor(
    private assistantService: AssistantService,
    private cdr: ChangeDetectorRef
  ) {}

  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLDivElement>;

  ngOnInit(): void {
    this.assistantService.getSuggestions().subscribe({
      next: (res) => {
        if (res?.ok && Array.isArray(res.suggestions)) {
          this.quickSuggestions = res.suggestions;
        }
      },
      error: () => {
        this.quickSuggestions = [];
      }
    });
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.scrollToBottom();
    }
  }

  send(): void {
    const content = this.input.trim();
    if (!content || this.isLoading) return;

    this.messages.push({ role: 'user', content });
    this.input = '';
    this.isLoading = true;

    const history = this.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-10);

    this.assistantService.chat(content, history).subscribe({
      next: (res) => {
        if (res?.ok && res.message) {
          this.messages.push({ role: 'assistant', content: res.message });
        } else {
          this.messages.push({ role: 'assistant', content: "Je n'ai pas pu repondre pour le moment." });
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.messages.push({ role: 'assistant', content: "Le service local n'est pas disponible." });
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  sendSuggestion(suggestion: string): void {
    if (this.isLoading) return;
    this.input = suggestion;
    this.send();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    if (!this.messagesContainer) return;
    const el = this.messagesContainer.nativeElement;
    el.scrollTop = el.scrollHeight;
  }

  trackByIndex(index: number): number {
    return index;
  }
}
