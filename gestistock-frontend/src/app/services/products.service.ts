import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Product {
  id_produit: number;
  reference: string;
  nom_produit: string;
  description: string | null;
  prix: number;
  quantite_stock: number;
  stock_minimum: number;
  id_categorie: number;
  nom_categorie: string;
}

export interface ProductsResponse {
  ok: boolean;
  products: Product[];
}

export interface CreateProductResponse {
  ok: boolean;
  message: string;
  productId: number;
}

export interface DeleteProductResponse {
  ok: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken() || '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  getProducts(): Observable<ProductsResponse> {
    return this.http.get<ProductsResponse>(`${environment.apiUrl}/products`, {
      headers: this.getAuthHeaders()
    });
  }

  createProduct(payload: {
    reference: string;
    nom_produit: string;
    description: string;
    prix: number;
    quantite_stock: number;
    stock_minimum: number;
    id_categorie: number;
  }): Observable<CreateProductResponse> {
    return this.http.post<CreateProductResponse>(
      `${environment.apiUrl}/products`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  deleteProduct(id: number): Observable<DeleteProductResponse> {
    return this.http.delete<DeleteProductResponse>(`${environment.apiUrl}/products/${id}`, {
      headers: this.getAuthHeaders()
    });
  }
}
