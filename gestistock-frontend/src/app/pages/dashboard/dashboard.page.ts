import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardResponse } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css'
})
export class DashboardPage implements OnInit {
  loading = signal(true);
  error = signal('');

  data: DashboardResponse | null = null;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set('');

    this.dashboardService.getStats().subscribe({
      next: (response) => {
        this.data = response;
        this.loading.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('Impossible de charger les statistiques du dashboard.');
        this.loading.set(false);
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }
}