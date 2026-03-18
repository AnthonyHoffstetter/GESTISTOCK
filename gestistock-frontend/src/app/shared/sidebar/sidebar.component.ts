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
    { label: 'Tableau de bord', path: '/app/dashboard', icon: 'space_dashboard' },
    { label: 'Produits', path: '/app/products', icon: 'inventory_2' },
    { label: 'Categories', path: '/app/categories', icon: 'category' },
    { label: 'Fournisseurs', path: '/app/fournisseurs', icon: 'local_shipping' },
    { label: 'Entrees de stock', path: '/app/stock-in', icon: 'move_to_inbox' },
    { label: 'Sorties de stock', path: '/app/stock-out', icon: 'outbox' },
    { label: 'Historique', path: '/app/history', icon: 'history' }
  ];

  adminItems = [
    { label: 'Utilisateurs', path: '/app/users', icon: 'group' }
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