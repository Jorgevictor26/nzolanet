import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Feedback } from '../../core/feedback';
import { SocialState } from '../../core/social-state';
import { Preferences } from '../../core/preferences';
import { ApiComment, ApiPost, Posts } from '../../core/posts';
import { Auth, CurrentUser } from '../../core/auth';
import { profilePhotoUrl, userInitials } from '../../core/avatar';
import { ApiUser, Users } from '../../core/users';

type CommentAttachment = 'photo' | 'video' | 'sticker' | 'emoji' | null;

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

type SuggestedProfile = {
  id: number;
  name: string;
  username: string;
  avatar: string | null;
  initials: string;
  bio: string;
  isFollowing: boolean;
};

@Component({
  selector: 'app-feed',
  imports: [RouterLink],
  templateUrl: './feed.html'
})
export class Feed implements OnInit {
  protected readonly isComposerOpen = signal(false);
  protected readonly isLoadingPosts = signal(false);
  protected readonly isPublishingPost = signal(false);
  protected readonly isLoadingComments = signal(false);
  protected readonly isSubmittingComment = signal(false);
  protected readonly postsError = signal<string | null>(null);
  protected readonly commentsError = signal<string | null>(null);
  protected readonly editingPostId = signal<number | null>(null);
  protected readonly deletingPostIds = signal<Set<number>>(new Set());
  protected readonly composerText = signal('');
  protected readonly selectedImage = signal<File | null>(null);
  protected readonly selectedVideo = signal<File | null>(null);
  protected readonly selectedMediaPreview = signal<string | null>(null);
  protected readonly selectedMediaName = signal('');
  protected readonly selectedMediaKind = signal<'image' | 'video' | null>(null);
  protected readonly composerHashtag = signal('');
  protected readonly isHashtagComposerOpen = signal(false);
  protected readonly savedDraft = signal('');
  protected readonly composerLimit = 280;
  protected readonly activeCommentPostId = signal<number | null>(null);
  protected readonly selectedCommentAttachment = signal<CommentAttachment>(null);
  protected readonly likedPostIds = signal<Set<number>>(new Set());
  protected readonly hiddenPostIds = signal<Set<number>>(new Set());
  protected readonly openPostMenuId = signal<number | null>(null);
  protected readonly posts = signal<FeedPost[]>([]);
  protected readonly suggestedProfiles = signal<SuggestedProfile[]>([]);
  protected readonly suggestionsError = signal<string | null>(null);
  protected readonly comments = signal<Record<number, PostComment[]>>({
    1: [],
    2: [],
    3: [],
    4: []
  });

  protected readonly visiblePosts = computed(() =>
    this.posts().filter((post) => !this.hiddenPostIds().has(post.id))
  );
  protected readonly activeCommentPost = computed(() =>
    this.visiblePosts().find((post) => post.id === this.activeCommentPostId()) ?? null
  );
  protected readonly activePostComments = computed(() => {
    const postId = this.activeCommentPostId();
    return postId ? this.comments()[postId] ?? [] : [];
  });
  protected readonly composerCharacterCount = computed(() => this.composerText().length);
  protected readonly composerProgress = computed(() =>
    Math.min(100, (this.composerCharacterCount() / this.composerLimit) * 100)
  );
  protected readonly canPublishComposer = computed(() =>
    this.composerText().trim().length > 0 || Boolean(this.selectedImage() || this.selectedVideo())
  );
  protected readonly activeEditingPost = computed(() => {
    const postId = this.editingPostId();
    return postId ? this.posts().find((post) => post.id === postId) ?? null : null;
  });

  constructor(
    private readonly feedback: Feedback,
    private readonly postService: Posts,
    protected readonly auth: Auth,
    protected readonly socialState: SocialState,
    protected readonly prefs: Preferences,
    private readonly users: Users
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
        this.isLoadingPosts.set(false);
      },
      error: () => {
        this.postsError.set('Não foi possível carregar as publicações.');
        this.isLoadingPosts.set(false);
      }
    });
  }

  protected updateComposerText(text: string): void {
    this.composerText.set(text.slice(0, this.composerLimit));
  }

  protected choosePostMedia(input: HTMLInputElement): void {
    input.click();
  }

  protected selectPostMedia(event: Event, type: 'image' | 'video'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      return;
    }

    this.applyComposerFile(file, type);
    input.value = '';
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
    this.selectedMediaKind.set(null);
  }

  protected insertComposerHashtag(): void {
    this.isHashtagComposerOpen.update((isOpen) => !isOpen);
  }

  protected updateComposerHashtag(value: string): void {
    this.composerHashtag.set(value.replace(/[^\p{L}\p{N}_-]/gu, '').slice(0, 32));
  }

  protected addComposerHashtag(): void {
    const hashtag = this.composerHashtag().trim();

    if (!hashtag) {
      this.feedback.show('Escreve a hashtag antes de adicionar.', 'info');
      return;
    }

    const normalizedHashtag = `#${hashtag.replace(/^#+/, '')}`;
    const currentText = this.composerText().trimEnd();
    const separator = currentText ? ' ' : '';
    this.updateComposerText(`${currentText}${separator}${normalizedHashtag}`);
    this.composerHashtag.set('');
    this.isHashtagComposerOpen.set(false);
    this.feedback.show('Hashtag adicionada.', 'success');
  }

  protected saveComposerDraft(): void {
    this.savedDraft.set(this.composerText());
    this.feedback.show('Rascunho guardado.', 'success');
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
      content: content || (this.selectedVideo() ? 'Novo vídeo partilhado.' : 'Nova imagem partilhada.'),
      image: this.selectedImage(),
      video: this.selectedVideo()
    };
    const request = editingPostId
      ? this.postService.update(editingPostId, payload)
      : this.postService.create(payload);

    request.subscribe({
      next: (response) => {
        const post = this.mapPost(response.data);
        this.posts.update((posts) =>
          editingPostId
            ? posts.map((currentPost) => currentPost.id === post.id ? post : currentPost)
            : [post, ...posts]
        );

        if (!editingPostId) {
          this.comments.update((comments) => ({ ...comments, [post.id]: [] }));
          this.savedDraft.set('');
        }

        this.isPublishingPost.set(false);
        this.isComposerOpen.set(false);
        this.clearComposer();
        this.editingPostId.set(null);
        this.feedback.show(editingPostId ? 'Publicação atualizada.' : 'Publicação criada.', 'success');
      },
      error: () => {
        this.postsError.set(editingPostId ? 'Não foi possível atualizar.' : 'Não foi possível publicar.');
        this.isPublishingPost.set(false);
      }
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
    this.composerHashtag.set('');
    this.isHashtagComposerOpen.set(false);
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
      }
    });
  }

  protected openPostDetails(postId: number): void {
    this.openComments(postId);
  }

  protected toggleWorkspacePostFavorite(): void {
    this.socialState.toggleWorkspacePostFavorite();
    this.feedback.show(
      this.socialState.isWorkspacePostFavorite()
        ? 'Publicação guardada nos favoritos.'
        : 'Publicação removida dos favoritos.',
      this.socialState.isWorkspacePostFavorite() ? 'success' : 'info'
    );
  }

  protected isPostSaved(postId: number): boolean {
    return postId === 1
      ? this.socialState.isWorkspacePostFavorite()
      : this.socialState.isPostFavorite(postId);
  }

  protected togglePostFavorite(postId: number): void {
    const isFavorite = postId === 1
      ? !this.socialState.isWorkspacePostFavorite()
      : this.socialState.togglePostFavorite(postId);

    if (postId === 1) {
      this.socialState.isWorkspacePostFavorite.set(isFavorite);
    }

    this.feedback.show(
      isFavorite ? 'Publicação guardada nos favoritos.' : 'Publicação removida dos favoritos.',
      isFavorite ? 'success' : 'info'
    );
  }

  protected sharePost(postId: number): void {
    const isShared = this.socialState.togglePostShare(postId);
    this.feedback.show(isShared ? 'Publicação partilhada.' : 'Partilha removida.', isShared ? 'success' : 'info');
  }

  protected togglePostMenu(postId: number): void {
    this.openPostMenuId.update((currentPostId) => currentPostId === postId ? null : postId);
  }

  protected hidePost(postId: number): void {
    this.hiddenPostIds.update((postIds) => new Set(postIds).add(postId));
    this.openPostMenuId.set(null);

    if (this.activeCommentPostId() === postId) {
      this.closeComments();
    }

    this.feedback.show('Publicação ocultada.', 'info');
  }

  protected isPostDeleting(postId: number): boolean {
    return this.deletingPostIds().has(postId);
  }

  protected canManagePost(post: FeedPost): boolean {
    return this.auth.currentUser()?.id === post.userId;
  }

  protected openComments(postId: number): void {
    this.activeCommentPostId.set(postId);
    this.selectedCommentAttachment.set(null);
    this.loadComments(postId);
  }

  protected closeComments(): void {
    this.activeCommentPostId.set(null);
    this.selectedCommentAttachment.set(null);
    this.commentsError.set(null);
  }

  protected selectCommentAttachment(attachment: CommentAttachment): void {
    this.selectedCommentAttachment.update((currentAttachment) =>
      currentAttachment === attachment ? null : attachment
    );
  }

  protected loadComments(postId: number): void {
    this.isLoadingComments.set(true);
    this.commentsError.set(null);
    this.postService.comments(postId).subscribe({
      next: (response) => {
        this.comments.update((comments) => ({
          ...comments,
          [postId]: response.data.map((comment) => this.mapComment(comment))
        }));
        this.updatePostCountTo(postId, 'commentsCount', response.meta.total);
        this.isLoadingComments.set(false);
      },
      error: () => {
        this.commentsError.set('Não foi possível carregar os comentários.');
        this.isLoadingComments.set(false);
      }
    });
  }

  protected submitComment(input: HTMLTextAreaElement): void {
    const postId = this.activeCommentPostId();
    const trimmedText = input.value.trim();
    const attachment = this.selectedCommentAttachment();
    const content = trimmedText || this.attachmentLabel(attachment);

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
          [postId]: [...(comments[postId] ?? []), nextComment]
        }));
        this.incrementCommentCount(postId);
        this.selectedCommentAttachment.set(null);
        input.value = '';
        this.isSubmittingComment.set(false);
        this.feedback.show('Comentário publicado.');
      },
      error: () => {
        this.commentsError.set('Não foi possível publicar o comentário.');
        this.isSubmittingComment.set(false);
      }
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
          [comment.postId]: (comments[comment.postId] ?? []).filter((currentComment) => currentComment.id !== comment.id)
        }));
        this.updatePostCount(comment.postId, 'commentsCount', -1);
        this.feedback.show('Comentário apagado.', 'success');
      },
      error: () => {
        this.feedback.show('Não foi possível apagar o comentário.', 'info');
      }
    });
  }

  protected canManageComment(comment: PostComment): boolean {
    return this.auth.currentUser()?.id === comment.userId;
  }

  protected attachmentLabel(attachment: CommentAttachment): string {
    switch (attachment) {
      case 'photo':
        return 'Foto';
      case 'video':
        return 'Vídeo';
      case 'sticker':
        return 'Sticker';
      case 'emoji':
        return '😊';
      default:
        return '';
    }
  }

  protected isPostLiked(postId: number): boolean {
    return this.likedPostIds().has(postId);
  }

  protected togglePostLike(postId: number): void {
    const wasLiked = this.isPostLiked(postId);
    this.likedPostIds.update((postIds) => {
      const nextPostIds = new Set(postIds);
      nextPostIds.has(postId) ? nextPostIds.delete(postId) : nextPostIds.add(postId);
      return nextPostIds;
    });
    this.updatePostCount(postId, 'likesCount', wasLiked ? -1 : 1);
    this.feedback.show(this.isPostLiked(postId) ? 'Deste baze nesta publicação.' : 'Baze removido.', this.isPostLiked(postId) ? 'success' : 'info');
  }

  protected toggleSuggestedFollow(profileId: number): void {
    const profile = this.suggestedProfiles().find((item) => item.id === profileId);

    if (!profile) {
      return;
    }

    const onSuccess = (): void => {
      this.suggestedProfiles.update((profiles) =>
        profile.isFollowing
          ? profiles.map((item) => item.id === profileId ? { ...item, isFollowing: false } : item)
          : profiles.filter((item) => item.id !== profileId)
      );
      this.feedback.show(profile.isFollowing ? 'Deixaste de seguir este perfil.' : 'Agora estás a seguir este perfil.', profile.isFollowing ? 'info' : 'success');
    };
    const onError = (): void => {
      this.suggestionsError.set('Não foi possível atualizar a sugestão.');
    };

    if (profile.isFollowing) {
      this.users.unfollow(profileId).subscribe({
        next: onSuccess,
        error: onError
      });
      return;
    }

    this.users.follow(profileId).subscribe({
      next: onSuccess,
      error: onError
    });
  }

  protected currentUserAvatar(user: CurrentUser | null = this.auth.currentUser()): string | null {
    return profilePhotoUrl(user?.profile_photo);
  }

  protected currentUserInitials(user: CurrentUser | null = this.auth.currentUser()): string {
    return userInitials(user?.name, user?.email, user?.username);
  }

  protected currentUsername(user: CurrentUser | null = this.auth.currentUser()): string {
    if (user?.username) {
      return `@${user.username}`;
    }

    return user?.email ? `@${user.email.split('@')[0]}` : '@utilizador';
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
    this.selectedMediaKind.set(type);
    this.feedback.show(type === 'image' ? 'Imagem pronta para publicar.' : 'Vídeo pronto para publicar.', 'success');
  }

  private loadSuggestions(): void {
    this.suggestionsError.set(null);
    this.users.suggestions(5).subscribe({
      next: ({ data }) => this.suggestedProfiles.set(
        data
          .filter((user) => !user.is_followed_by_viewer)
          .map((user) => this.mapSuggestedProfile(user))
      ),
      error: () => this.suggestionsError.set('Não foi possível carregar sugestões.')
    });
  }

  private mapSuggestedProfile(user: ApiUser): SuggestedProfile {
    return {
      id: user.id,
      name: user.name,
      username: user.username ? `@${user.username}` : `@utilizador${user.id}`,
      avatar: profilePhotoUrl(user.profile_photo),
      initials: userInitials(user.name, null, user.username),
      bio: user.bio ?? 'Ainda sem biografia.',
      isFollowing: user.is_followed_by_viewer
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
      commentsCount: post.comments_count
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
      time: this.relativeTime(comment.created_at)
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

  private updatePostCount(postId: number, key: 'likesCount' | 'commentsCount', amount: number): void {
    this.posts.update((posts) =>
      posts.map((post) =>
        post.id === postId ? { ...post, [key]: Math.max(0, post[key] + amount) } : post
      )
    );
  }

  private updatePostCountTo(postId: number, key: 'likesCount' | 'commentsCount', value: number): void {
    this.posts.update((posts) =>
      posts.map((post) =>
        post.id === postId ? { ...post, [key]: Math.max(0, value) } : post
      )
    );
  }

  private incrementCommentCount(postId: number): void {
    this.updatePostCount(postId, 'commentsCount', 1);
  }

  private clearComposer(): void {
    this.composerText.set('');
    this.composerHashtag.set('');
    this.isHashtagComposerOpen.set(false);
    this.postsError.set(null);
    this.removeSelectedMedia();
  }
}
