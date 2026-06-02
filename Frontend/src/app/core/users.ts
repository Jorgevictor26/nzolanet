import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type ApiUser = {
  id: number;
  name: string;
  username: string | null;
  bio: string | null;
  profile_photo: string | null;
  privacy: 'public' | 'private';
  followers_count: number;
  following_count: number;
  is_followed_by_viewer: boolean;
};

export type UserResponse = {
  data: ApiUser;
};

export type UsersResponse = {
  data: ApiUser[];
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
export class Users {
  constructor(private readonly http: HttpClient) {}

  profile(id: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${environment.apiUrl}/users/${id}`);
  }

  follow(id: number): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${environment.apiUrl}/users/${id}/follow`, {});
  }

  unfollow(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/users/${id}/follow`);
  }

  followers(id: number, perPage = 50): Observable<UsersResponse> {
    return this.http.get<UsersResponse>(`${environment.apiUrl}/users/${id}/followers`, {
      params: {
        per_page: perPage
      }
    });
  }

  following(id: number, perPage = 50): Observable<UsersResponse> {
    return this.http.get<UsersResponse>(`${environment.apiUrl}/users/${id}/following`, {
      params: {
        per_page: perPage
      }
    });
  }

  suggestions(perPage = 5, excludeId?: number | null): Observable<UsersResponse> {
    const params: Record<string, number> = {
      per_page: perPage
    };

    if (excludeId) {
      params['exclude_id'] = excludeId;
    }

    return this.http.get<UsersResponse>(`${environment.apiUrl}/users/suggestions`, {
      params
    });
  }
}
