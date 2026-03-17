import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AssistantResponse {
  ok: boolean;
  message: string;
}

export interface SuggestionsResponse {
  ok: boolean;
  suggestions: string[];
}

export interface HealthResponse {
  ok: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AssistantService {
  constructor(private http: HttpClient) {}

  chat(message: string, history: ChatMessage[]): Observable<AssistantResponse> {
    const token = localStorage.getItem('gestistock_token') || '';

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.post<AssistantResponse>(
      `${environment.apiUrl}/assistant/chat`,
      { message, history },
      { headers }
    );
  }

  getSuggestions(): Observable<SuggestionsResponse> {
    const token = localStorage.getItem('gestistock_token') || '';
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<SuggestionsResponse>(
      `${environment.apiUrl}/assistant/suggestions`,
      { headers }
    );
  }

  getHealth(): Observable<HealthResponse> {
    const token = localStorage.getItem('gestistock_token') || '';
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<HealthResponse>(
      `${environment.apiUrl}/assistant/health`,
      { headers }
    );
  }
}
