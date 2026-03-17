import {
  Component,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  AfterViewChecked,
  OnInit
} from '@angular/core';
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
  isOnline = false;
  input = '';

  messages: ChatMessage[] = [
    {
      role: 'assistant',
      content: 'Bonjour ! Je suis l’assistant GESTISTOCK. Posez-moi une question sur le stock, les ruptures ou les mouvements.'
    }
  ];

  quickSuggestions: string[] = [];

  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLDivElement>;

  constructor(
    private assistantService: AssistantService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.checkHealth();
    this.loadSuggestions();
  }

  toggle(): void {
    this.isOpen = !this.isOpen;

    if (this.isOpen) {
      this.checkHealth();
      this.scrollToBottom();
    }
  }

  loadSuggestions(): void {
    this.assistantService.getSuggestions().subscribe({
      next: (res) => {
        if (res?.ok && Array.isArray(res.suggestions)) {
          this.quickSuggestions = res.suggestions;
        } else {
          this.quickSuggestions = [];
        }
      },
      error: () => {
        this.quickSuggestions = [];
      }
    });
  }

  send(): void {
    const content = this.input.trim();

    if (!content || this.isLoading) {
      return;
    }

    this.messages.push({
      role: 'user',
      content
    });

    this.input = '';
    this.isLoading = true;

    const history = this.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-8);

    this.assistantService.chat(content, history).subscribe({
      next: (res) => {
        if (res?.ok && res.message) {
          this.messages.push({
            role: 'assistant',
            content: res.message
          });
        } else {
          this.messages.push({
            role: 'assistant',
            content: "Je n'ai pas pu répondre correctement pour le moment."
          });
        }

        this.isLoading = false;
        this.cdr.detectChanges();
        this.checkHealth();
      },
      error: () => {
        this.messages.push({
          role: 'assistant',
          content: "Le service d'assistant n'est pas disponible pour le moment."
        });

        this.isLoading = false;
        this.cdr.detectChanges();
        this.checkHealth();
      }
    });
  }

  sendSuggestion(suggestion: string): void {
    if (this.isLoading) {
      return;
    }

    this.input = suggestion;
    this.send();
  }

  resetConversation(): void {
    if (this.isLoading) {
      return;
    }

    this.messages = [
      {
        role: 'assistant',
        content: 'Nouvelle conversation démarrée. Comment puis-je vous aider sur GESTISTOCK ?'
      }
    ];

    this.cdr.detectChanges();
    this.scrollToBottom();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  trackByIndex(index: number): number {
    return index;
  }

  private checkHealth(): void {
    this.assistantService.getHealth().subscribe({
      next: (res) => {
        this.isOnline = !!res?.ok;
      },
      error: () => {
        this.isOnline = false;
      }
    });
  }

  private scrollToBottom(): void {
    if (!this.messagesContainer) {
      return;
    }

    const el = this.messagesContainer.nativeElement;
    el.scrollTop = el.scrollHeight;
  }
}