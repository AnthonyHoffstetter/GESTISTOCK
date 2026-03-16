import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { StockInService, StockInEntry } from '../../services/stock-in.service';
import { ProductsService, Product } from '../../services/products.service';

@Component({
  selector: 'app-stock-in',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './stock-in.page.html',
  styleUrl: './stock-in.page.css'
})
export class StockInPage implements OnInit {
  loading = signal(true);
  error = signal('');
  entries: StockInEntry[] = [];
  products: Product[] = [];

  searchTerm = '';

  modalOpen = false;
  saving = signal(false);
  formError = signal('');
  formSuccess = signal('');

  lines: Array<{
    id_produit: number | null;
    quantite: number;
  }> = [{ id_produit: null, quantite: 1 }];

  constructor(
    private stockInService: StockInService,
    private productsService: ProductsService
  ) {}

  ngOnInit(): void {
    this.loadEntries();
    this.loadProducts();
  }

  loadEntries(): void {
    this.loading.set(true);
    this.error.set('');

    this.stockInService.getStockIns().subscribe({
      next: (response) => {
        this.entries = response.entries;
        this.loading.set(false);
      },
      error: (_err: HttpErrorResponse) => {
        this.error.set('Impossible de charger les entrées de stock.');
        this.loading.set(false);
      }
    });
  }

  loadProducts(): void {
    this.productsService.getProducts().subscribe({
      next: (response) => {
        this.products = response.products;
      },
      error: () => {
        this.products = [];
      }
    });
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchTerm = target?.value || '';
  }

  get filteredEntries(): StockInEntry[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.entries;
    }
    return this.entries.filter((entry) => {
      const reference = entry.reference?.toLowerCase() || '';
      const user = entry.nom_complet?.toLowerCase() || '';
      const date = entry.date_bon?.toLowerCase() || '';
      return reference.includes(term) || user.includes(term) || date.includes(term);
    });
  }

  getProductById(id: number | null): Product | null {
    if (!id) {
      return null;
    }
    return this.products.find((product) => product.id_produit === id) || null;
  }

  getUnitPrice(id: number | null): number {
    const product = this.getProductById(id);
    return product ? Number(product.prix || 0) : 0;
  }

  getLineTotal(line: { id_produit: number | null; quantite: number }): number {
    return this.getUnitPrice(line.id_produit) * Number(line.quantite || 0);
  }

  getTotal(): number {
    return this.lines.reduce((sum, line) => sum + this.getLineTotal(line), 0);
  }

  openModal(): void {
    this.modalOpen = true;
    this.formError.set('');
    this.formSuccess.set('');
  }

  closeModal(): void {
    this.modalOpen = false;
    this.formError.set('');
    this.formSuccess.set('');
  }

  addLine(): void {
    this.lines.push({ id_produit: null, quantite: 1 });
  }

  removeLine(index: number): void {
    if (this.lines.length === 1) {
      return;
    }
    this.lines.splice(index, 1);
  }

  submitEntry(): void {
    this.formError.set('');
    this.formSuccess.set('');

    const validLines = this.lines.filter((line) => line.id_produit && line.quantite > 0);

    if (validLines.length === 0) {
      this.formError.set('Ajoutez au moins un produit valide.');
      return;
    }

    this.saving.set(true);

    this.stockInService
      .createStockIn({
        lines: validLines.map((line) => ({
          id_produit: Number(line.id_produit),
          quantite: Number(line.quantite)
        }))
      })
      .subscribe({
        next: (response) => {
          this.formSuccess.set(`${response.message} (${response.reference})`);
          this.lines = [{ id_produit: null, quantite: 1 }];
          this.saving.set(false);
          this.loadEntries();
          this.closeModal();
        },
        error: (err: HttpErrorResponse) => {
          this.formError.set(err.error?.message || 'Impossible de creer le bon.');
          this.saving.set(false);
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
