import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { ProductsService, Product } from '../../services/products.service';
import { CategoriesService, Category } from '../../services/categories.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './products.page.html',
  styleUrl: './products.page.css'
})
export class ProductsPage implements OnInit {

  loading = signal(true);
  saving = signal(false);
  error = signal('');
  success = signal('');

  products: Product[] = [];
  categories: Category[] = [];

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private productsService: ProductsService,
    private categoriesService: CategoriesService
  ) {

    this.form = this.fb.group({
      reference: ['', Validators.required],
      nom_produit: ['', Validators.required],
      description: [''],
      prix: [0, [Validators.required, Validators.min(0)]],
      quantite_stock: [0, [Validators.required, Validators.min(0)]],
      stock_minimum: [0, [Validators.required, Validators.min(0)]],
      id_categorie: ['', Validators.required]
    });

  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.categoriesService.getCategories().subscribe({
      next: (response: any) => {
        this.categories = response.categories;
      },
      error: (_err: HttpErrorResponse) => {
        this.error.set('Impossible de charger les catégories.');
      }
    });
  }

  loadProducts(): void {

    this.loading.set(true);
    this.error.set('');

    this.productsService.getProducts().subscribe({

      next: (response: any) => {
        this.products = response.products;
        this.loading.set(false);
      },

      error: (_err: HttpErrorResponse) => {
        this.error.set('Impossible de charger les produits.');
        this.loading.set(false);
      }

    });

  }

  addProduct(): void {

    this.error.set('');
    this.success.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    const payload = {
      reference: String(this.form.value.reference || '').trim(),
      nom_produit: String(this.form.value.nom_produit || '').trim(),
      description: String(this.form.value.description || '').trim(),
      prix: Number(this.form.value.prix),
      quantite_stock: Number(this.form.value.quantite_stock),
      stock_minimum: Number(this.form.value.stock_minimum),
      id_categorie: Number(this.form.value.id_categorie)
    };

    this.productsService.createProduct(payload).subscribe({

      next: (response: any) => {

        this.success.set(response.message);

        this.form.reset({
          reference: '',
          nom_produit: '',
          description: '',
          prix: 0,
          quantite_stock: 0,
          stock_minimum: 0,
          id_categorie: ''
        });

        this.loadProducts();
        this.saving.set(false);
      },

      error: (err: HttpErrorResponse) => {

        this.error.set(err.error?.message || 'Impossible d’ajouter le produit.');
        this.saving.set(false);

      }

    });

  }

  deleteProduct(product: Product): void {

    this.error.set('');
    this.success.set('');

    const confirmed = window.confirm(`Supprimer le produit "${product.nom_produit}" ?`);

    if (!confirmed) {
      return;
    }

    this.productsService.deleteProduct(product.id_produit).subscribe({

      next: (response: any) => {
        this.success.set(response.message);
        this.loadProducts();
      },

      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.message || 'Impossible de supprimer le produit.');
      }

    });

  }

  isFieldInvalid(field: string): boolean {

    const ctrl = this.form.get(field);

    return !!(
      ctrl &&
      ctrl.invalid &&
      (ctrl.dirty || ctrl.touched)
    );

  }

}