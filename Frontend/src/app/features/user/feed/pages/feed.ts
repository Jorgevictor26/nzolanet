import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { profilePhotoUrl, userInitials } from '../../../../core/models/avatar';
import { Auth, CurrentUser } from '../../../../core/services/auth';
import { Feedback } from '../../../../core/services/feedback';
import { ApiComment, ApiPost, Posts, ReportReason } from '../../../../core/services/posts';
import { Preferences } from '../../../../core/services/preferences';
import { SocialState } from '../../../../core/services/social-state';
import { ApiUser, Users } from '../../../../core/services/users';
import { ProfileListItemViewModel } from '../../../../shared/components/profile-list-item-card';

type FeedPost = {
  id: number;
  userId: number;
  author: string;
  username: string;
  avatar: string | null;
  initials: string;
  time: string;
  text: string;
  image?: string;
  imageAlt?: string;
  video?: string;
  videoAlt?: string;
  likesCount: number;
  commentsCount: number;
  isLikedByViewer: boolean;
};

type PostComment = {
  id: number;
  userId: number;
  postId: number;
  author: string;
  avatar: string | null;
  initials: string;
  text: string;
  time: string;
};

const reportReasons: ReportReason[] = [
  'Discurso de Ódio',
  'Spam/Publicidade',
  'Linguagem Imprópria',
  'Assédio',
  'Conteúdo Falso',
];

@Component({
  selector: 'app-feed',
  imports: [RouterLink],
  templateUrl: './feed.html',
})
export class Feed implements OnInit {
  protected readonly isComposerOpen = signal(false);
  protected readonly isLoadingPosts = signal(false);
  protected readonly isPublishingPost = signal(false);
  protected readonly isLoadingComments = signal(false);
  protected readonly isSubmittingComment = signal(false);
  protected readonly reportingCommentIds = signal<Set<number>>(new Set());
  protected readonly reportingPostIds = signal<Set<number>>(new Set());
  protected readonly postsError = signal<string | null>(null);
  protected readonly commentsError = signal<string | null>(null);
  protected readonly editingPostId = signal<number | null>(null);
  protected readonly deletingPostIds = signal<Set<number>>(new Set());
  protected readonly composerText = signal('');
  protected readonly selectedImage = signal<File | null>(null);
  protected readonly selectedVideo = signal<File | null>(null);
  protected readonly selectedMediaPreview = signal<string | null>(null);
  protected readonly selectedMediaName = signal('');
  protected readonly savedDraft = signal('');
  protected readonly composerLimit = 280;
  protected readonly activeCommentPostId = signal<number | null>(null);
  protected readonly likedPostIds = signal<Set<number>>(new Set());
  protected readonly likingPostIds = signal<Set<number>>(new Set());
  protected readonly hiddenPostIds = signal<Set<number>>(new Set());
  protected readonly openPostMenuId = signal<number | null>(null);
  protected readonly posts = signal<FeedPost[]>([]);
  protected readonly suggestedProfiles = signal<ProfileListItemViewModel[]>([]);
  protected readonly suggestionsError = signal<string | null>(null);
  protected readonly loadedCommentPostIds = signal<Set<number>>(new Set());
  protected readonly comments = signal<Record<number, PostComment[]>>({});
  protected readonly reportModalVisible = signal(false);
  protected readonly openCommentMenuId = signal<number | null>(null);
  protected readonly reportModalResolve = signal<((reason: ReportReason | null) => void) | null>(
    null,
  );
  protected readonly visiblePosts = computed(() =>
    this.posts().filter((post) => !this.hiddenPostIds().has(post.id)),
  );
  protected readonly activeCommentPost = computed(
    () => this.visiblePosts().find((post) => post.id === this.activeCommentPostId()) ?? null,
  );
  protected readonly activePostComments = computed(() => {
    const postId = this.activeCommentPostId();
    return postId ? (this.comments()[postId] ?? []) : [];
  });
  protected readonly composerCharacterCount = computed(() => this.composerText().length);
  protected readonly composerProgress = computed(() =>
    Math.min(100, (this.composerCharacterCount() / this.composerLimit) * 100),
  );
  protected readonly canPublishComposer = computed(
    () =>
      this.composerText().trim().length > 0 ||
      Boolean(this.selectedImage() || this.selectedVideo()),
  );
  protected readonly activeEditingPost = computed(() => {
    const postId = this.editingPostId();
    return postId ? (this.posts().find((post) => post.id === postId) ?? null) : null;
  });

  constructor(
    private readonly feedback: Feedback,
    private readonly postService: Posts,
    protected readonly auth: Auth,
    protected readonly socialState: SocialState,
    protected readonly prefs: Preferences,
    private readonly users: Users,
  ) {}

  ngOnInit(): void {
    this.loadPosts();
    this.loadSuggestions();
  }

  protected openComposer(): void {
    this.editingPostId.set(null);
    if (!this.composerText() && this.savedDraft()) {
      this.composerText.set(this.savedDraft());
    }
    this.postsError.set(null);
    this.isComposerOpen.set(true);
  }

  protected profileLink(userId: number): unknown[] {
    return userId === this.auth.currentUser()?.id ? ['/profile'] : ['/visitor-profile', userId];
  }

  protected closeComposer(): void {
    this.isComposerOpen.set(false);
    this.clearComposer();
    this.editingPostId.set(null);
  }

  protected loadPosts(): void {
    this.isLoadingPosts.set(true);
    this.postsError.set(null);
    this.postService.feed().subscribe({
      next: (response) => {
        this.posts.set(response.data.map((post) => this.mapPost(post)));
        this.syncLikedPosts(response.data);
        this.isLoadingPosts.set(false);
      },
      error: () => {
        this.postsError.set('Não foi possível carregar as publicações.');
        this.isLoadingPosts.set(false);
      },
    });
  }

  protected updateComposerText(text: string): void {
    this.composerText.set(text.slice(0, this.composerLimit));
  }

  protected choosePostMedia(input: HTMLInputElement): void {
    input.click();
  }

  protected selectPostMediaAuto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      return;
    }

    const type = file.type.startsWith('video/') ? 'video' : 'image';
    this.applyComposerFile(file, type);
    input.value = '';
  }

  protected handleComposerDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file) {
      return;
    }

    const kind = file.type.startsWith('video/') ? 'video' : 'image';
    this.applyComposerFile(file, kind);
  }

  protected removeSelectedMedia(): void {
    const preview = this.selectedMediaPreview();
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    this.selectedImage.set(null);
    this.selectedVideo.set(null);
    this.selectedMediaPreview.set(null);
    this.selectedMediaName.set('');
  }

  protected saveComposerDraft(): void {
    this.savedDraft.set(this.composerText());
    this.feedback.show('Rascunho guardado.', 'success');
  }

  protected toggleCommentMenu(commentId: number): void {
    this.openCommentMenuId.update((id) => (id === commentId ? null : commentId));
  }

  protected publishPost(): void {
    const content = this.composerText().trim();

    if (!this.canPublishComposer()) {
      this.postsError.set('Escreve algum texto ou adiciona uma imagem/vídeo antes de publicar.');
      return;
    }

    this.isPublishingPost.set(true);
    this.postsError.set(null);

    const editingPostId = this.editingPostId();
    const payload = {
      content:
        content || (this.selectedVideo() ? 'Novo vídeo partilhado.' : 'Nova imagem partilhada.'),
      image: this.selectedImage(),
      video: this.selectedVideo(),
    };
    const request = editingPostId
      ? this.postService.update(editingPostId, payload)
      : this.postService.create(payload);

    request.subscribe({
      next: (response) => {
        const post = this.mapPost(response.data);
        this.posts.update((posts) =>
          editingPostId
            ? posts.map((currentPost) => (currentPost.id === post.id ? post : currentPost))
            : [post, ...posts],
        );

        if (!editingPostId) {
          this.comments.update((comments) => ({ ...comments, [post.id]: [] }));
          this.savedDraft.set('');
        }

        this.setPostLiked(post.id, post.isLikedByViewer);
        this.isPublishingPost.set(false);
        this.isComposerOpen.set(false);
        this.clearComposer();
        this.editingPostId.set(null);
        this.feedback.show(
          editingPostId ? 'Publicação atualizada.' : 'Publicação criada.',
          'success',
        );
      },
      error: () => {
        this.postsError.set(
          editingPostId ? 'Não foi possível atualizar.' : 'Não foi possível publicar.',
        );
        this.isPublishingPost.set(false);
      },
    });
  }

  protected editPost(postId: number): void {
    const post = this.posts().find((currentPost) => currentPost.id === postId);

    if (!post || !this.canManagePost(post)) {
      this.feedback.show('Não tens permissão para editar esta publicação.', 'info');
      return;
    }

    this.openPostMenuId.set(null);
    this.postsError.set(null);
    this.editingPostId.set(post.id);
    this.composerText.set(post.text.slice(0, this.composerLimit));
    this.removeSelectedMedia();
    this.isComposerOpen.set(true);
  }

  protected deletePost(postId: number): void {
    const post = this.posts().find((currentPost) => currentPost.id === postId);

    if (!post || !this.canManagePost(post)) {
      this.feedback.show('Não tens permissão para apagar esta publicação.', 'info');
      return;
    }

    if (!confirm('Apagar esta publicação?')) {
      return;
    }

    this.openPostMenuId.set(null);
    this.deletingPostIds.update((postIds) => new Set(postIds).add(postId));
    this.postService.delete(postId).subscribe({
      next: () => {
        this.posts.update((posts) => posts.filter((currentPost) => currentPost.id !== postId));
        this.comments.update((comments) => {
          const nextComments = { ...comments };
          delete nextComments[postId];
          return nextComments;
        });
        this.likedPostIds.update((postIds) => {
          const nextPostIds = new Set(postIds);
          nextPostIds.delete(postId);
          return nextPostIds;
        });
        this.likingPostIds.update((postIds) => {
          const nextPostIds = new Set(postIds);
          nextPostIds.delete(postId);
          return nextPostIds;
        });

        if (this.activeCommentPostId() === postId) {
          this.closeComments();
        }

        this.deletingPostIds.update((postIds) => {
          const nextPostIds = new Set(postIds);
          nextPostIds.delete(postId);
          return nextPostIds;
        });
        this.feedback.show('Publicação apagada.', 'success');
      },
      error: () => {
        this.deletingPostIds.update((postIds) => {
          const nextPostIds = new Set(postIds);
          nextPostIds.delete(postId);
          return nextPostIds;
        });
        this.feedback.show('Não foi possível apagar a publicação.', 'info');
      },
    });
  }

  protected openPostDetails(postId: number): void {
    this.openComments(postId);
  }

  protected isPostSaved(postId: number): boolean {
    return this.socialState.isPostFavorite(postId);
  }

  protected togglePostFavorite(postId: number): void {
    const isFavorite = this.socialState.togglePostFavorite(postId);

    this.feedback.show(
      isFavorite ? 'Publicação guardada nos favoritos.' : 'Publicação removida dos favoritos.',
      isFavorite ? 'success' : 'info',
    );
  }

  protected sharePost(postId: number): void {
    const isShared = this.socialState.togglePostShare(postId);
    this.feedback.show(
      isShared ? 'Publicação partilhada.' : 'Partilha removida.',
      isShared ? 'success' : 'info',
    );
  }

  protected togglePostMenu(postId: number): void {
    this.openPostMenuId.update((currentPostId) => (currentPostId === postId ? null : postId));
  }

  protected hidePost(postId: number): void {
    this.hiddenPostIds.update((postIds) => new Set(postIds).add(postId));
    this.openPostMenuId.set(null);

    if (this.activeCommentPostId() === postId) {
      this.closeComments();
    }

    this.feedback.show('Publicação ocultada.', 'info');
  }

  protected async reportPost(post: FeedPost): Promise<void> {
    if (this.canManagePost(post)) {
      this.feedback.show('Não podes denunciar a tua própria publicação.', 'info');
      return;
    }
    if (this.isPostReporting(post.id)) return;

    const reason = await this.chooseReportReason();
    if (!reason) return;

    this.openPostMenuId.set(null);
    this.reportingPostIds.update((ids) => new Set(ids).add(post.id));
    this.postService.reportPost(post.id, reason).subscribe({
      next: () => {
        this.reportingPostIds.update((ids) => {
          const s = new Set(ids);
          s.delete(post.id);
          return s;
        });
        this.feedback.show('Denúncia submetida com sucesso.', 'success');
      },
      error: () => {
        this.reportingPostIds.update((ids) => {
          const s = new Set(ids);
          s.delete(post.id);
          return s;
        });
        this.feedback.show('Não foi possível submeter a denúncia.', 'info');
      },
    });
  }

  protected isPostDeleting(postId: number): boolean {
    return this.deletingPostIds().has(postId);
  }

  protected isPostReporting(postId: number): boolean {
    return this.reportingPostIds().has(postId);
  }

  protected canManagePost(post: FeedPost): boolean {
    return this.auth.currentUser()?.id === post.userId;
  }

  protected openComments(postId: number): void {
    this.activeCommentPostId.set(postId);
    this.loadComments(postId);
  }

  protected closeComments(): void {
    this.activeCommentPostId.set(null);
    this.commentsError.set(null);
  }

  protected loadComments(postId: number): void {
    if (this.loadedCommentPostIds().has(postId)) {
      return;
    }

    this.isLoadingComments.set(true);
    this.commentsError.set(null);
    this.postService.comments(postId).subscribe({
      next: (response) => {
        this.comments.update((comments) => ({
          ...comments,
          [postId]: response.data.map((comment) => this.mapComment(comment)),
        }));
        this.updatePostCountTo(postId, 'commentsCount', response.meta.total);
        this.loadedCommentPostIds.update((postIds) => new Set(postIds).add(postId));
        this.isLoadingComments.set(false);
      },
      error: () => {
        this.commentsError.set('Não foi possível carregar os comentários.');
        this.isLoadingComments.set(false);
      },
    });
  }

  protected submitComment(input: HTMLTextAreaElement): void {
    const postId = this.activeCommentPostId();
    const content = input.value.trim();

    if (!postId || !content) {
      return;
    }

    this.isSubmittingComment.set(true);
    this.commentsError.set(null);
    this.postService.createComment(postId, content).subscribe({
      next: (response) => {
        const nextComment = this.mapComment(response.data);
        this.comments.update((comments) => ({
          ...comments,
          [postId]: [...(comments[postId] ?? []), nextComment],
        }));
        this.loadedCommentPostIds.update((postIds) => new Set(postIds).add(postId));
        this.incrementCommentCount(postId);
        input.value = '';
        this.isSubmittingComment.set(false);
        this.feedback.show('Comentário publicado.');
      },
      error: () => {
        this.commentsError.set('Não foi possível publicar o comentário.');
        this.isSubmittingComment.set(false);
      },
    });
  }

  protected deleteComment(comment: PostComment): void {
    if (!this.canManageComment(comment)) {
      this.feedback.show('Não tens permissão para apagar este comentário.', 'info');
      return;
    }

    this.postService.deleteComment(comment.id).subscribe({
      next: () => {
        this.comments.update((comments) => ({
          ...comments,
          [comment.postId]: (comments[comment.postId] ?? []).filter(
            (currentComment) => currentComment.id !== comment.id,
          ),
        }));
        this.updatePostCount(comment.postId, 'commentsCount', -1);
        this.feedback.show('Comentário apagado.', 'success');
      },
      error: () => {
        this.feedback.show('Não foi possível apagar o comentário.', 'info');
      },
    });
  }

  protected async reportComment(comment: PostComment): Promise<void> {
    if (this.canManageComment(comment)) {
      this.feedback.show('Não podes denunciar o teu próprio comentário.', 'info');
      return;
    }
    if (this.isCommentReporting(comment.id)) return;

    const reason = await this.chooseReportReason();
    if (!reason) return;

    this.reportingCommentIds.update((ids) => new Set(ids).add(comment.id));
    this.postService.reportComment(comment.id, reason).subscribe({
      next: () => {
        this.reportingCommentIds.update((ids) => {
          const s = new Set(ids);
          s.delete(comment.id);
          return s;
        });
        this.feedback.show('Denúncia submetida com sucesso.', 'success');
      },
      error: () => {
        this.reportingCommentIds.update((ids) => {
          const s = new Set(ids);
          s.delete(comment.id);
          return s;
        });
        this.feedback.show('Não foi possível submeter a denúncia.', 'info');
      },
    });
  }

  protected selectReportReason(reason: ReportReason): void {
    const resolve = this.reportModalResolve();
    if (resolve) {
      resolve(reason);
    }
    this.reportModalVisible.set(false);
    this.reportModalResolve.set(null);
  }

  protected cancelReportModal(): void {
    const resolve = this.reportModalResolve();
    if (resolve) {
      resolve(null);
    }
    this.reportModalVisible.set(false);
    this.reportModalResolve.set(null);
  }
  protected canManageComment(comment: PostComment): boolean {
    return this.auth.currentUser()?.id === comment.userId;
  }

  protected canReportComment(comment: PostComment): boolean {
    return !this.canManageComment(comment);
  }

  protected isCommentReporting(commentId: number): boolean {
    return this.reportingCommentIds().has(commentId);
  }

  protected isPostLiked(postId: number): boolean {
    return this.likedPostIds().has(postId);
  }

  protected togglePostLike(postId: number): void {
    if (this.likingPostIds().has(postId)) {
      return;
    }

    const wasLiked = this.isPostLiked(postId);
    this.likingPostIds.update((postIds) => new Set(postIds).add(postId));

    const request = wasLiked ? this.postService.unlike(postId) : this.postService.like(postId);
    request.subscribe({
      next: ({ data }) => {
        const updatedPost = this.mapPost(data);
        this.posts.update((posts) =>
          posts.map((post) => (post.id === postId ? updatedPost : post)),
        );
        this.setPostLiked(postId, updatedPost.isLikedByViewer);
        this.removeLikingPost(postId);
        this.feedback.show(
          updatedPost.isLikedByViewer ? 'Deste baze nesta publicação.' : 'Baze removido.',
          updatedPost.isLikedByViewer ? 'success' : 'info',
        );
      },
      error: () => {
        this.removeLikingPost(postId);
        this.feedback.show('Não foi possível atualizar a baze.', 'info');
      },
    });
  }

  protected toggleSuggestedFollow(profileId: number): void {
    const profile = this.suggestedProfiles().find((item) => item.id === profileId);

    if (!profile) {
      return;
    }

    const onSuccess = (): void => {
      this.suggestedProfiles.update((profiles) =>
        profile.isFollowing
          ? profiles.map((item) => (item.id === profileId ? { ...item, isFollowing: false } : item))
          : profiles.filter((item) => item.id !== profileId),
      );
      this.feedback.show(
        profile.isFollowing
          ? 'Deixaste de seguir este perfil.'
          : 'Agora estás a seguir este perfil.',
        profile.isFollowing ? 'info' : 'success',
      );
    };
    const onError = (): void => {
      this.suggestionsError.set('Não foi possível atualizar a sugestão.');
    };

    if (profile.isFollowing) {
      this.users.unfollow(profileId).subscribe({
        next: onSuccess,
        error: onError,
      });
      return;
    }

    this.users.follow(profileId).subscribe({
      next: onSuccess,
      error: onError,
    });
  }

  protected currentUserAvatar(user: CurrentUser | null = this.auth.currentUser()): string | null {
    return profilePhotoUrl(user?.profile_photo);
  }

  protected currentUserInitials(user: CurrentUser | null = this.auth.currentUser()): string {
    return userInitials(user?.name, user?.email, user?.username);
  }

  private applyComposerFile(file: File, type: 'image' | 'video'): void {
    const isImage = type === 'image' && file.type.startsWith('image/');
    const isVideo = type === 'video' && file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      this.feedback.show('Escolhe uma imagem ou um vídeo válido.', 'info');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      this.feedback.show('O ficheiro deve ter no máximo 50MB.', 'info');
      return;
    }

    this.removeSelectedMedia();
    this.selectedImage.set(type === 'image' ? file : null);
    this.selectedVideo.set(type === 'video' ? file : null);
    this.selectedMediaPreview.set(URL.createObjectURL(file));
    this.selectedMediaName.set(file.name);
    this.feedback.show(
      type === 'image' ? 'Imagem pronta para publicar.' : 'Vídeo pronto para publicar.',
      'success',
    );
  }

  private loadSuggestions(): void {
    this.suggestionsError.set(null);
    this.users.suggestions(5).subscribe({
      next: ({ data }) =>
        this.suggestedProfiles.set(
          data
            .filter((user) => !user.is_followed_by_viewer)
            .map((user) => this.mapSuggestedProfile(user)),
        ),
      error: () => this.suggestionsError.set('Não foi possível carregar sugestões.'),
    });
  }

  private mapSuggestedProfile(user: ApiUser): ProfileListItemViewModel {
    return {
      id: user.id,
      name: user.name,
      username: user.username ? `@${user.username}` : `@utilizador${user.id}`,
      avatar: profilePhotoUrl(user.profile_photo),
      initials: userInitials(user.name, null, user.username),
      bio: user.bio ?? 'Ainda sem biografia.',
      isFollowing: user.is_followed_by_viewer,
    };
  }

  private mapPost(post: ApiPost): FeedPost {
    return {
      id: post.id,
      userId: post.user_id,
      author: post.author.name ?? 'Utilizador',
      username: post.author.username ? `@${post.author.username}` : `#${post.user_id}`,
      avatar: profilePhotoUrl(post.author.profile_photo),
      initials: userInitials(post.author.name, null, post.author.username),
      time: this.relativeTime(post.created_at),
      text: post.content,
      image: post.image ? `/storage/${post.image}` : undefined,
      video: post.video ? `/storage/${post.video}` : undefined,
      imageAlt: `Imagem da publicação de ${post.author.name ?? 'utilizador'}`,
      videoAlt: `Vídeo da publicação de ${post.author.name ?? 'utilizador'}`,
      likesCount: post.likes_count,
      commentsCount: post.comments_count,
      isLikedByViewer: post.is_liked_by_viewer,
    };
  }

  private mapComment(comment: ApiComment): PostComment {
    return {
      id: comment.id,
      userId: comment.user_id,
      postId: comment.post_id,
      author: comment.author.name ?? 'Utilizador',
      avatar: profilePhotoUrl(comment.author.profile_photo),
      initials: userInitials(comment.author.name, null, null),
      text: comment.content,
      time: this.relativeTime(comment.created_at),
    };
  }

  private relativeTime(value: string): string {
    const createdAt = new Date(value).getTime();

    if (Number.isNaN(createdAt)) {
      return 'Agora';
    }

    const seconds = Math.max(0, Math.floor((Date.now() - createdAt) / 1000));
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d atrás`;
    if (hours > 0) return `${hours}h atrás`;
    if (minutes > 0) return `${minutes}min atrás`;

    return 'Agora';
  }

  private updatePostCount(
    postId: number,
    key: 'likesCount' | 'commentsCount',
    amount: number,
  ): void {
    this.posts.update((posts) =>
      posts.map((post) =>
        post.id === postId ? { ...post, [key]: Math.max(0, post[key] + amount) } : post,
      ),
    );
  }

  private updatePostCountTo(
    postId: number,
    key: 'likesCount' | 'commentsCount',
    value: number,
  ): void {
    this.posts.update((posts) =>
      posts.map((post) => (post.id === postId ? { ...post, [key]: Math.max(0, value) } : post)),
    );
  }

  private incrementCommentCount(postId: number): void {
    this.updatePostCount(postId, 'commentsCount', 1);
  }

  private syncLikedPosts(posts: ApiPost[]): void {
    this.likedPostIds.set(new Set(posts.filter((post) => post.is_liked_by_viewer).map((post) => post.id)));
  }

  private setPostLiked(postId: number, isLiked: boolean): void {
    this.likedPostIds.update((postIds) => {
      const nextPostIds = new Set(postIds);
      isLiked ? nextPostIds.add(postId) : nextPostIds.delete(postId);
      return nextPostIds;
    });
  }

  private removeLikingPost(postId: number): void {
    this.likingPostIds.update((postIds) => {
      const nextPostIds = new Set(postIds);
      nextPostIds.delete(postId);
      return nextPostIds;
    });
  }

  private chooseReportReason(): Promise<ReportReason | null> {
    return new Promise((resolve) => {
      this.reportModalResolve.set(resolve);
      this.reportModalVisible.set(true);
    });
  }

  private clearComposer(): void {
    this.composerText.set('');
    this.postsError.set(null);
    this.removeSelectedMedia();
  }
}
