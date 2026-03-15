import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardResponse {
  ok: boolean;
  stats: {
    totalProduits: number;
    totalStockFaible: number;
    valeurStock: number;
    totalMouvementsMois: number;
  };
  recentMovements: {
    id_mouvement: number;
    type_mouvement: string;
    quantite: number;
    date_mouvement: string;
    nom_produit: string;
    nom_complet: string;
  }[];
  lowStockProducts: {
    id_produit: number;
    nom_produit: string;
    quantite_stock: number;
    stock_minimum: number;
  }[];
  categoryDistribution: {
    nom_categorie: string;
    total: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardResponse> {
    const token = localStorage.getItem('gestistock_token') || '';

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<DashboardResponse>(
      `${environment.apiUrl}/dashboard/stats`,
      { headers }
    );
  }
}