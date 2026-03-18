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

  menuItems: Array<{
    label: string;
    path: string;
    icon: string;
    roles?: Array<'Admin' | 'Mag'>;
  }> = [
    { label: 'Tableau de bord', path: '/app/dashboard', icon: 'space_dashboard', roles: ['Admin', 'Mag'] },
    { label: 'Produits', path: '/app/products', icon: 'inventory_2', roles: ['Admin', 'Mag'] },
    { label: 'Categories', path: '/app/categories', icon: 'category', roles: ['Admin', 'Mag'] },
    { label: 'Fournisseurs', path: '/app/fournisseurs', icon: 'local_shipping', roles: ['Admin', 'Mag'] },
    { label: 'Entrees de stock', path: '/app/stock-in', icon: 'move_to_inbox', roles: ['Admin', 'Mag'] },
    { label: 'Sorties de stock', path: '/app/stock-out', icon: 'outbox', roles: ['Admin', 'Mag'] },
    { label: 'Historique', path: '/app/history', icon: 'history', roles: ['Admin', 'Mag'] }
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

    window.dispatchEvent(
      new CustomEvent('eco-mode-changed', { detail: this.isEcoMode })
    );
  }

  canShowMenuItem(item: { roles?: Array<'Admin' | 'Mag'> }): boolean {
    if (!item.roles || item.roles.length === 0) {
      return true;
    }

    const user = this.authService.getUser();
    return !!user && item.roles.includes(user.role);
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/';
  }
}
