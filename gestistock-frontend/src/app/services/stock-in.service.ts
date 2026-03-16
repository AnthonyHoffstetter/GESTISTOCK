import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StockInEntry {
  id_bon: number;
  reference: string;
  date_bon: string;
  nom_complet: string | null;
  lignes: number;
  total: number;
  statut: 'Valide' | 'Annule';
}

export interface StockInLine {
  id_ligne_bon: number;
  reference: string;
  nom_produit: string;
  quantite: number;
  prix_unitaire: number;
  total_ligne: number;
}

export interface StockInDetail {
  id_bon: number;
  reference: string;
  date_bon: string;
  nom_complet: string | null;
  total: number;
  statut: 'Valide' | 'Annule';
}

export interface StockInResponse {
  ok: boolean;
  entries: StockInEntry[];
}

export interface StockInDetailResponse {
  ok: boolean;
  bon: StockInDetail;
  lines: StockInLine[];
}

export interface CreateStockInResponse {
  ok: boolean;
  message: string;
  id_bon: number;
  reference: string;
}

export interface CancelStockInResponse {
  ok: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class StockInService {
  constructor(private http: HttpClient) {}

  getStockIns(): Observable<StockInResponse> {
    return this.http.get<StockInResponse>(`${environment.apiUrl}/stock-in`);
  }

  getStockInDetail(id: number): Observable<StockInDetailResponse> {
    return this.http.get<StockInDetailResponse>(`${environment.apiUrl}/stock-in/${id}`);
  }

  createStockIn(payload: {
    lines: Array<{
      id_produit: number;
      quantite: number;
    }>;
  }): Observable<CreateStockInResponse> {
    return this.http.post<CreateStockInResponse>(`${environment.apiUrl}/stock-in`, payload);
  }

  cancelStockIn(id: number): Observable<CancelStockInResponse> {
    return this.http.post<CancelStockInResponse>(`${environment.apiUrl}/stock-in/${id}/cancel`, {});
  }
}
