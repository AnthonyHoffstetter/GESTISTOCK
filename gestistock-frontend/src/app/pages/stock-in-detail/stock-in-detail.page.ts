import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import {
  StockInService,
  StockInDetail,
  StockInLine
} from '../../services/stock-in.service';

@Component({
  selector: 'app-stock-in-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './stock-in-detail.page.html',
  styleUrl: './stock-in-detail.page.css'
})
export class StockInDetailPage implements OnInit {
  loading = signal(true);
  error = signal('');
  canceling = signal(false);
  success = signal('');

  bon: StockInDetail | null = null;
  lines: StockInLine[] = [];

  constructor(
    private route: ActivatedRoute,
    private stockInService: StockInService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error.set('Bon introuvable.');
      this.loading.set(false);
      return;
    }
    this.loadDetail(id);
  }

  loadDetail(id: number): void {
    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    this.stockInService.getStockInDetail(id).subscribe({
      next: (response) => {
        this.bon = response.bon;
        this.lines = response.lines;
        this.loading.set(false);
      },
      error: (_err: HttpErrorResponse) => {
        this.error.set('Impossible de charger le detail.');
        this.loading.set(false);
      }
    });
  }

  cancelEntry(): void {
    if (!this.bon) {
      return;
    }

    const confirmed = window.confirm(`Annuler l entree ${this.bon.reference} ?`);
    if (!confirmed) {
      return;
    }

    this.canceling.set(true);
    this.error.set('');
    this.success.set('');

    this.stockInService.cancelStockIn(this.bon.id_bon).subscribe({
      next: (response) => {
        this.success.set(response.message);
        this.canceling.set(false);
        this.loadDetail(this.bon!.id_bon);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.message || 'Impossible d annuler le bon.');
        this.canceling.set(false);
      }
    });
  }

  formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  formatMoney(value: number): string {
    const formatted = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
    return `${formatted} EUR`;
  }

  getStatusClass(statut: string): string {
    return statut === 'Valide' ? 'status validated' : 'status cancelled';
  }
}
