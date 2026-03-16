import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StockOutEntry {
  id_bon: number;
  reference: string;
  date_bon: string;
  nom_complet: string | null;
  lignes: number;
  total: number;
  statut: 'Valide' | 'Annule';
}

export interface StockOutLine {
  id_ligne_bon: number;
  reference: string;
  nom_produit: string;
  quantite: number;
  prix_unitaire: number;
  total_ligne: number;
}

export interface StockOutDetail {
  id_bon: number;
  reference: string;
  date_bon: string;
  nom_complet: string | null;
  total: number;
  statut: 'Valide' | 'Annule';
}

export interface StockOutResponse {
  ok: boolean;
  entries: StockOutEntry[];
}

export interface StockOutDetailResponse {
  ok: boolean;
  bon: StockOutDetail;
  lines: StockOutLine[];
}

export interface CreateStockOutResponse {
  ok: boolean;
  message: string;
  id_bon: number;
  reference: string;
}

export interface CancelStockOutResponse {
  ok: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class StockOutService {
  constructor(private http: HttpClient) {}

  getStockOuts(): Observable<StockOutResponse> {
    return this.http.get<StockOutResponse>(`${environment.apiUrl}/stock-out`);
  }

  getStockOutDetail(id: number): Observable<StockOutDetailResponse> {
    return this.http.get<StockOutDetailResponse>(`${environment.apiUrl}/stock-out/${id}`);
  }

  createStockOut(payload: {
    lines: Array<{
      id_produit: number;
      quantite: number;
    }>;
  }): Observable<CreateStockOutResponse> {
    return this.http.post<CreateStockOutResponse>(`${environment.apiUrl}/stock-out`, payload);
  }

  cancelStockOut(id: number): Observable<CancelStockOutResponse> {
    return this.http.post<CancelStockOutResponse>(`${environment.apiUrl}/stock-out/${id}/cancel`, {});
  }
}
