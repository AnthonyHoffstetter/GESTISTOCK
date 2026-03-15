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
    { label: 'Tableau de bord', path: '/app/dashboard', icon: '▦' },
    { label: 'Produits', path: '/app/products', icon: '◈' },
    { label: 'Categories', path: '/app/categories', icon: '▤' },
    { label: 'Fournisseurs', path: '/app/suppliers', icon: '◫' },
    { label: 'Entrees de stock', path: '/app/stock-in', icon: '↓' },
    { label: 'Sorties de stock', path: '/app/stock-out', icon: '↑' },
    { label: 'Historique', path: '/app/history', icon: '↺' },
    { label: 'Utilisateurs', path: '/app/users', icon: '👥' }
  ];
}