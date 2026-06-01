import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type ApiPost = {
  id: number;
  user_id: number;
  author: {
    name: string | null;
    username: string | null;
    profile_photo: string | null;
  };
  content: string;
  image: string | null;
  video: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
};

export type PostsResponse = {
  data: ApiPost[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type PostResponse = {
  data: ApiPost;
};

@Injectable({
  providedIn: 'root'
})
export class Posts {
  constructor(private readonly http: HttpClient) {}

  feed(perPage = 15): Observable<PostsResponse> {
    return this.http.get<PostsResponse>(`${environment.apiUrl}/posts`, {
      params: {
        per_page: perPage
      }
    });
  }

  create(payload: { content: string; image?: File | null; video?: File | null }): Observable<PostResponse> {
    const formData = new FormData();
    formData.append('content', payload.content);

    if (payload.image) {
      formData.append('image', payload.image);
    }

    if (payload.video) {
      formData.append('video', payload.video);
    }

    return this.http.post<PostResponse>(`${environment.apiUrl}/posts`, formData);
  }
}
