import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { AssistantWidgetComponent } from '../../shared/assistant-widget/assistant-widget.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, AssistantWidgetComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent implements OnInit {
  isEcoMode = false;
  isAdmin = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.hasRole('Admin');
    const ecoMode = localStorage.getItem('eco_mode');

    if (ecoMode === 'true') {
      document.body.classList.add('eco-mode');
      this.isEcoMode = true;
    } else {
      document.body.classList.remove('eco-mode');
      this.isEcoMode = false;
    }

    window.addEventListener('eco-mode-changed', (event: Event) => {
      const customEvent = event as CustomEvent<boolean>;
      this.isEcoMode = Boolean(customEvent.detail);
    });
  }

  get showAssistantWidget(): boolean {
    return this.isAdmin && !this.isEcoMode;
  }
}
