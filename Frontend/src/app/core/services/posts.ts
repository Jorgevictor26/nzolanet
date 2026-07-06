import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  is_liked_by_viewer: boolean;
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

export type ApiComment = {
  id: number;
  user_id: number;
  post_id: number;
  author: {
    id: number;
    name: string | null;
    profile_photo: string | null;
  };
  content: string;
  created_at: string;
  updated_at: string;
};

export type CommentsResponse = {
  data: ApiComment[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type CommentResponse = {
  data: ApiComment;
};

export type ReportReason =
  | 'Discurso de Ódio'
  | 'Spam/Publicidade'
  | 'Linguagem Imprópria'
  | 'Assédio'
  | 'Conteúdo Falso';

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

  byUser(userId: number, perPage = 50): Observable<PostsResponse> {
    return this.http.get<PostsResponse>(`${environment.apiUrl}/users/${userId}/posts`, {
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

  update(id: number, payload: { content: string; image?: File | null; video?: File | null }): Observable<PostResponse> {
    const formData = new FormData();
    formData.append('_method', 'PUT');
    formData.append('content', payload.content);

    if (payload.image) {
      formData.append('image', payload.image);
    }

    if (payload.video) {
      formData.append('video', payload.video);
    }

    return this.http.post<PostResponse>(`${environment.apiUrl}/posts/${id}`, formData);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/posts/${id}`);
  }

  like(id: number): Observable<PostResponse> {
    return this.http.post<PostResponse>(`${environment.apiUrl}/posts/${id}/like`, {});
  }

  unlike(id: number): Observable<PostResponse> {
    return this.http.delete<PostResponse>(`${environment.apiUrl}/posts/${id}/like`);
  }

  reportPost(id: number, reason: ReportReason): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/posts/${id}/report`, { reason });
  }

  comments(postId: number, perPage = 50): Observable<CommentsResponse> {
    return this.http.get<CommentsResponse>(`${environment.apiUrl}/posts/${postId}/comments`, {
      params: {
        per_page: perPage
      }
    });
  }

  createComment(postId: number, content: string): Observable<CommentResponse> {
    return this.http.post<CommentResponse>(`${environment.apiUrl}/posts/${postId}/comments`, { content });
  }

  updateComment(id: number, content: string): Observable<CommentResponse> {
    return this.http.put<CommentResponse>(`${environment.apiUrl}/comments/${id}`, { content });
  }

  deleteComment(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/comments/${id}`);
  }

  reportComment(id: number, reason: ReportReason): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/comments/${id}/report`, { reason });
  }
}
