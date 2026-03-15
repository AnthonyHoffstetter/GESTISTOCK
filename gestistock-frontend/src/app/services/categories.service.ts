import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
  constructor(private http: HttpClient) {}

  getCategories(): Observable<CategoriesResponse> {
    return this.http.get<CategoriesResponse>(`${environment.apiUrl}/categories`);
  }

  createCategory(nom_categorie: string): Observable<CreateCategoryResponse> {
    return this.http.post<CreateCategoryResponse>(`${environment.apiUrl}/categories`, {
      nom_categorie
    });
  }

  deleteCategory(id: number): Observable<DeleteCategoryResponse> {
    return this.http.delete<DeleteCategoryResponse>(`${environment.apiUrl}/categories/${id}`);
  }
}