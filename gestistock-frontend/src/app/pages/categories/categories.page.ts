import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoriesService, Category } from '../../services/categories.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categories.page.html',
  styleUrl: './categories.page.css'
})
export class CategoriesPage implements OnInit {
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  success = signal('');
  isAdmin = false;

  categories: Category[] = [];
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private categoriesService: CategoriesService,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      nom_categorie: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  ngOnInit(): void {
    this.isAdmin = this.authService.hasRole('Admin');
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.error.set('');

    this.categoriesService.getCategories().subscribe({
      next: (response) => {
        this.categories = response.categories;
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les catégories.');
        this.loading.set(false);
      }
    });
  }

  addCategory(): void {
    this.error.set('');
    this.success.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const nom = this.form.value.nom_categorie?.trim();

    if (!nom) {
      return;
    }

    this.saving.set(true);

    this.categoriesService.createCategory(nom).subscribe({
      next: (response) => {
        this.success.set(response.message);
        this.form.reset();
        this.loadCategories();
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Impossible d’ajouter la catégorie.');
        this.saving.set(false);
      }
    });
  }

  deleteCategory(category: Category): void {
    this.error.set('');
    this.success.set('');

    const confirmed = window.confirm(`Supprimer la catégorie "${category.nom_categorie}" ?`);
    if (!confirmed) {
      return;
    }

    this.categoriesService.deleteCategory(category.id_categorie).subscribe({
      next: (response) => {
        this.success.set(response.message);
        this.loadCategories();
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Impossible de supprimer la catégorie.');
      }
    });
  }

  isFieldInvalid(field: 'nom_categorie'): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }
}
