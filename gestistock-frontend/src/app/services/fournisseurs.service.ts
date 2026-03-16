import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Fournisseur {
  id_fournisseur: number;
  nom_complet: string;
  email: string;
  telephone: string;
  adresse: string;
  notes: string;
}

@Injectable({
  providedIn: 'root'
})
export class FournisseursService {

  constructor(private http: HttpClient) {}

  getFournisseurs(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/fournisseurs`);
  }

  createFournisseur(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/fournisseurs`, data);
  }

  deleteFournisseur(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/fournisseurs/${id}`);
  }

}