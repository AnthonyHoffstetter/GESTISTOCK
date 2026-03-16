import { Injectable } from '@angular/core';

export interface AuthUser {
  id_utilisateur: number;
  nom_complet: string;
  email: string;
  role: 'Admin' | 'Mag';
  statut: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  getToken(): string | null {
    return localStorage.getItem('gestistock_token');
  }

  getUser(): AuthUser | null {
    const raw = localStorage.getItem('gestistock_user');

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && token !== 'null' && token !== 'undefined' && token.trim() !== '';
  }

  hasRole(role: 'Admin' | 'Mag'): boolean {
    const user = this.getUser();
    return !!user && user.role === role;
  }

  logout(): void {
    localStorage.removeItem('gestistock_token');
    localStorage.removeItem('gestistock_user');
  }
}