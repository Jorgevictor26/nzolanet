import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  bio: string | null;
  profile_photo: string | null;
  privacy: 'public' | 'private';
};

type PublicUser = Omit<CurrentUser, 'email'>;

type AuthResponse = {
  data: CurrentUser;
  token: string;
  token_type: 'Bearer';
};

type UserResponse = {
  data: CurrentUser;
};

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private readonly tokenKey = 'nzolanet_token';
  private readonly userKey = 'nzolanet_user';
  private readonly tokenState = signal<string | null>(this.read(this.tokenKey));
  readonly currentUser = signal<CurrentUser | null>(this.readUser());
  readonly isAuthenticated = computed(() => Boolean(this.tokenState()));

  constructor(private readonly http: HttpClient) {}

  token(): string | null {
    return this.tokenState();
  }

  me(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${environment.apiUrl}/users/me`).pipe(
      tap((response) => this.storeUser(response.data))
    );
  }

  register(payload: { name: string; email: string; password: string }): Observable<{ data: PublicUser }> {
    return this.http.post<{ data: PublicUser }>(`${environment.apiUrl}/auth/register`, payload);
  }

  login(payload: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, payload).pipe(
      tap((response) => this.storeSession(response.token, response.data))
    );
  }

  logout(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/logout`, {}).pipe(
      tap(() => this.clearSession())
    );
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(payload: {
    email: string;
    token: string;
    password: string;
    password_confirmation: string;
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/reset-password`, payload);
  }

  updateProfile(payload: { name: string; bio: string | null; privacy: 'public' | 'private' }): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${environment.apiUrl}/users/profile`, payload).pipe(
      tap((response) => this.storeUser(response.data))
    );
  }

  changeProfilePhoto(photo: File): Observable<UserResponse> {
    const formData = new FormData();
    formData.append('photo', photo);

    return this.http.post<UserResponse>(`${environment.apiUrl}/users/profile-photo`, formData).pipe(
      tap((response) => this.storeUser(response.data))
    );
  }

  clearSession(): void {
    this.tokenState.set(null);
    this.currentUser.set(null);
    this.remove(this.tokenKey);
    this.remove(this.userKey);
  }

  private storeSession(token: string, user: CurrentUser): void {
    this.tokenState.set(token);
    this.write(this.tokenKey, token);
    this.storeUser(user);
  }

  private storeUser(user: CurrentUser): void {
    this.currentUser.set(user);
    this.write(this.userKey, JSON.stringify(user));
  }

  private readUser(): CurrentUser | null {
    const rawUser = this.read(this.userKey);

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as CurrentUser;
    } catch {
      this.remove(this.userKey);
      return null;
    }
  }

  private read(key: string): string | null {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  }

  private write(key: string, value: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  }

  private remove(key: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  }
}
