import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  isEcoMode = false;

  constructor(public authService: AuthService) {
    this.isEcoMode = localStorage.getItem('eco_mode') === 'true';
  }

  menuItems = [
    { label: 'Tableau de bord', path: '/app/dashboard', icon: '▦' },
    { label: 'Produits', path: '/app/products', icon: '◈' },
    { label: 'Categories', path: '/app/categories', icon: '▤' },
    { label: 'Fournisseurs', path: '/app/fournisseurs', icon: '◫' },
    { label: 'Entrees de stock', path: '/app/stock-in', icon: '↓' },
    { label: 'Sorties de stock', path: '/app/stock-out', icon: '↑' },
    { label: 'Historique', path: '/app/history', icon: '↺' }
  ];

  adminItems = [
    { label: 'Utilisateurs', path: '/app/users', icon: '👥' }
  ];

  toggleEcoMode(): void {
    this.isEcoMode = !this.isEcoMode;

    if (this.isEcoMode) {
      document.body.classList.add('eco-mode');
      localStorage.setItem('eco_mode', 'true');
    } else {
      document.body.classList.remove('eco-mode');
      localStorage.setItem('eco_mode', 'false');
    }
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/';
  }
}