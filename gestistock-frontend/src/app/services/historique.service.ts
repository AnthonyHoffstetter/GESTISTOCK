import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface HistoriqueMouvement {
  id_mouvement: number;
  type_mouvement: 'IN' | 'OUT';
  quantite: number;
  date_mouvement: string;
  motif: string | null;
  reference: string;
  nom_produit: string;
  nom_complet: string;
}

export interface HistoriqueResponse {
  ok: boolean;
  historiques: HistoriqueMouvement[];
}

@Injectable({
  providedIn: 'root'
})
export class HistoriqueService {
  constructor(private http: HttpClient) {}

  getHistorique(filters?: { type?: string; search?: string }): Observable<HistoriqueResponse> {
    let params = new HttpParams();

    if (filters?.type) {
      params = params.set('type', filters.type);
    }

    if (filters?.search) {
      params = params.set('search', filters.search);
    }

    return this.http.get<HistoriqueResponse>(`${environment.apiUrl}/historique`, { params });
  }
}