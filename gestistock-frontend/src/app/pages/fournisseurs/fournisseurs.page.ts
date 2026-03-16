import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { FournisseursService, Fournisseur } from '../../services/fournisseurs.service';

@Component({
  selector: 'app-fournisseurs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './fournisseurs.page.html',
  styleUrl: './fournisseurs.page.css'
})
export class FournisseursPage implements OnInit {
  fournisseurs: Fournisseur[] = [];

  loading = signal(true);
  saving = signal(false);
  success = signal('');
  error = signal('');

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private fournisseursService: FournisseursService
  ) {
    this.form = this.fb.group({
      nom_complet: ['', [Validators.required]],
      email: [''],
      telephone: [''],
      adresse: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadFournisseurs();
  }

  loadFournisseurs(): void {
    this.loading.set(true);
    this.error.set('');

    this.fournisseursService.getFournisseurs().subscribe({
      next: (res: { fournisseurs: Fournisseur[] }) => {
        this.fournisseurs = res.fournisseurs || [];
        this.loading.set(false);
      },
      error: (_err: HttpErrorResponse) => {
        this.error.set('Impossible de charger les fournisseurs.');
        this.loading.set(false);
      }
    });
  }

  addFournisseur(): void {
    this.error.set('');
    this.success.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    const payload = {
      nom_complet: String(this.form.value.nom_complet || '').trim(),
      email: String(this.form.value.email || '').trim(),
      telephone: String(this.form.value.telephone || '').trim(),
      adresse: String(this.form.value.adresse || '').trim(),
      notes: String(this.form.value.notes || '').trim()
    };

    this.fournisseursService.createFournisseur(payload).subscribe({
      next: (_res: unknown) => {
        this.success.set('Fournisseur ajouté');
        this.form.reset({
          nom_complet: '',
          email: '',
          telephone: '',
          adresse: '',
          notes: ''
        });
        this.loadFournisseurs();
        this.saving.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.message || 'Impossible d’ajouter le fournisseur.');
        this.saving.set(false);
      }
    });
  }

  deleteFournisseur(f: Fournisseur): void {
    this.error.set('');
    this.success.set('');

    const confirmed = window.confirm(`Supprimer ${f.nom_complet} ?`);
    if (!confirmed) {
      return;
    }

    this.fournisseursService.deleteFournisseur(f.id_fournisseur).subscribe({
      next: (_res: unknown) => {
        this.success.set('Fournisseur supprimé');
        this.loadFournisseurs();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.message || 'Impossible de supprimer le fournisseur.');
      }
    });
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }
}