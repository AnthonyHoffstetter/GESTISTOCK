import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Category {
  id_categorie: number;
  nom_categorie: string;
}

interface CategoriesResponse {
  ok: boolean;
  categories: Category[];
}

interface CreateCategoryResponse {
  ok: boolean;
  message: string;
  category: Category;
}

interface DeleteCategoryResponse {
  ok: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken() || '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  getCategories(): Observable<CategoriesResponse> {
    return this.http.get<CategoriesResponse>(`${environment.apiUrl}/categories`, {
      headers: this.getAuthHeaders()
    });
  }

  createCategory(nom_categorie: string): Observable<CreateCategoryResponse> {
    return this.http.post<CreateCategoryResponse>(`${environment.apiUrl}/categories`, {
      nom_categorie
    }, {
      headers: this.getAuthHeaders()
    });
  }

  deleteCategory(id: number): Observable<DeleteCategoryResponse> {
    return this.http.delete<DeleteCategoryResponse>(`${environment.apiUrl}/categories/${id}`, {
      headers: this.getAuthHeaders()
    });
  }
}
