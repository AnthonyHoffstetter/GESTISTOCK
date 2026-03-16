import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Utilisateur {
  id_utilisateur: number;
  nom_complet: string;
  email: string;
  role: 'Admin' | 'Mag';
  statut: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UtilisateursService {
  constructor(private http: HttpClient) {}

  getUtilisateurs(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/utilisateurs`);
  }

  createUtilisateur(data: {
    nom_complet: string;
    email: string;
    mot_de_passe: string;
    role: 'Admin' | 'Mag';
    statut: boolean;
  }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/utilisateurs`, data);
  }

  deleteUtilisateur(id: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/utilisateurs/${id}`);
  }
}