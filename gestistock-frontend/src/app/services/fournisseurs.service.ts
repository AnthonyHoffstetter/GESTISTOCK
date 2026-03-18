import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

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

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken() || '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  getFournisseurs(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/fournisseurs`, {
      headers: this.getAuthHeaders()
    });
  }

  createFournisseur(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/fournisseurs`, data, {
      headers: this.getAuthHeaders()
    });
  }

  deleteFournisseur(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/fournisseurs/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

}
