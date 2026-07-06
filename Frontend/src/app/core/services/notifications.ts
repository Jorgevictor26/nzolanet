import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type ApiNotification = {
  id: number;
  type: 'baze' | 'comment' | 'follow';
  title: string;
  body: string;
  is_read: boolean;
  actor_id: number | null;
  post_id: number | null;
  comment_id: number | null;
  created_at: string;
};

export type NotificationsResponse = {
  data: ApiNotification[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    unread: number;
  };
};

@Injectable({
  providedIn: 'root',
})
export class Notifications {
  constructor(private readonly http: HttpClient) {}

  list(perPage = 20): Observable<NotificationsResponse> {
    return this.http.get<NotificationsResponse>(`${environment.apiUrl}/notifications`, {
      params: {
        per_page: perPage,
      },
    });
  }

  markAllAsRead(): Observable<{ message: string; unread: number }> {
    return this.http.post<{ message: string; unread: number }>(
      `${environment.apiUrl}/notifications/mark-read`,
      {},
    );
  }

  clear(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/notifications`);
  }
}
