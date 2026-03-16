import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { HistoriqueService, HistoriqueMouvement, HistoriqueResponse } from '../../services/historique.service';

@Component({
  selector: 'app-historique',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './historique.page.html',
  styleUrl: './historique.page.css'
})
export class HistoriquePage implements OnInit {
  historiques: HistoriqueMouvement[] = [];
  loading = signal(true);
  error = signal('');

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private historiqueService: HistoriqueService
  ) {
    this.form = this.fb.group({
      type: ['ALL'],
      search: ['']
    });
  }

  ngOnInit(): void {
    this.loadHistorique();
  }

  loadHistorique(): void {
    this.loading.set(true);
    this.error.set('');

    const filters = {
      type: this.form.value.type || 'ALL',
      search: String(this.form.value.search || '').trim()
    };

    this.historiqueService.getHistorique(filters).subscribe({
      next: (res: HistoriqueResponse) => {
        this.historiques = res.historiques || [];
        this.loading.set(false);
      },
      error: (_err: HttpErrorResponse) => {
        this.error.set('Impossible de charger l’historique.');
        this.loading.set(false);
      }
    });
  }

  onFilter(): void {
    this.loadHistorique();
  }

  resetFilters(): void {
    this.form.reset({
      type: 'ALL',
      search: ''
    });
    this.loadHistorique();
  }
}