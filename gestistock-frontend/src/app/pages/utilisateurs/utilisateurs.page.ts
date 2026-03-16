import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { UtilisateursService, Utilisateur } from '../../services/utilisateurs.service';

@Component({
  selector: 'app-utilisateurs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './utilisateurs.page.html',
  styleUrl: './utilisateurs.page.css'
})
export class UtilisateursPage implements OnInit {
  utilisateurs: Utilisateur[] = [];

  loading = signal(true);
  saving = signal(false);
  success = signal('');
  error = signal('');

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private utilisateursService: UtilisateursService
  ) {
    this.form = this.fb.group({
      nom_complet: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      mot_de_passe: ['', [Validators.required, Validators.minLength(6)]],
      role: ['Mag', [Validators.required]],
      statut: [true]
    });
  }

  ngOnInit(): void {
    this.loadUtilisateurs();
  }

  loadUtilisateurs(): void {
    this.loading.set(true);
    this.error.set('');

    this.utilisateursService.getUtilisateurs().subscribe({
      next: (res: { utilisateurs: Utilisateur[] }) => {
        this.utilisateurs = res.utilisateurs || [];
        this.loading.set(false);
      },
      error: (_err: HttpErrorResponse) => {
        this.error.set('Impossible de charger les utilisateurs.');
        this.loading.set(false);
      }
    });
  }

  addUtilisateur(): void {
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
      mot_de_passe: String(this.form.value.mot_de_passe || '').trim(),
      role: this.form.value.role as 'Admin' | 'Mag',
      statut: !!this.form.value.statut
    };

    this.utilisateursService.createUtilisateur(payload).subscribe({
      next: (_res: unknown) => {
        this.success.set('Utilisateur ajouté');
        this.form.reset({
          nom_complet: '',
          email: '',
          mot_de_passe: '',
          role: 'Mag',
          statut: true
        });
        this.loadUtilisateurs();
        this.saving.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.message || 'Impossible d’ajouter l’utilisateur.');
        this.saving.set(false);
      }
    });
  }

  deleteUtilisateur(u: Utilisateur): void {
    this.error.set('');
    this.success.set('');

    const confirmed = window.confirm(`Supprimer ${u.nom_complet} ?`);
    if (!confirmed) {
      return;
    }

    this.utilisateursService.deleteUtilisateur(u.id_utilisateur).subscribe({
      next: (_res: unknown) => {
        this.success.set('Utilisateur supprimé');
        this.loadUtilisateurs();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.message || 'Impossible de supprimer l’utilisateur.');
      }
    });
  }
}
