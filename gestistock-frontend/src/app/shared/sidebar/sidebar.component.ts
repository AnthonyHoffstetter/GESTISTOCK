import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
menuItems = [
  { label: 'Tableau de bord', path: '/app/dashboard', icon: 'dashboard' },
  { label: 'Produits', path: '/app/products', icon: 'inventory_2' },
  { label: 'Categories', path: '/app/categories', icon: 'category' },
  { label: 'Fournisseurs', path: '/app/fournisseurs', icon: 'local_shipping' },
  { label: 'Entrees de stock', path: '/app/stock-in', icon: 'move_to_inbox' },
  { label: 'Sorties de stock', path: '/app/stock-out', icon: 'outbox' },
  { label: 'Historique', path: '/app/history', icon: 'history' },
  { label: 'Utilisateurs', path: '/app/users', icon: 'group' }
];
}
