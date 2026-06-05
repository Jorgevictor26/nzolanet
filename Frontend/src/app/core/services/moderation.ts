import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type ApiReport = {
  id: number;
  comment_id: number | null;
  post_id: number | null;
  comment: string;
  user: string;
  avatar: string | null;
  reason: 'Discurso de Ódio' | 'Spam/Publicidade' | 'Linguagem Imprópria' | 'Assédio' | 'Conteúdo Falso';
  status: 'Pendente' | 'Resolvido';
  reports_count: number;
  created_at: string;
};

export type ReportsResponse = {
  data: ApiReport[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

@Injectable({
  providedIn: 'root'
})
export class Moderation {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<ReportsResponse> {
    return this.http.get<ReportsResponse>(`${environment.apiUrl}/moderation/reports`);
  }

  approve(id: number): Observable<{ data: ApiReport }> {
    return this.http.post<{ data: ApiReport }>(`${environment.apiUrl}/moderation/reports/${id}/approve`, {});
  }

  removeComment(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/moderation/reports/${id}`);
  }

  warnUser(id: number): Observable<{ data: ApiReport }> {
    return this.http.post<{ data: ApiReport }>(`${environment.apiUrl}/moderation/reports/${id}/warn`, {});
  }
}
