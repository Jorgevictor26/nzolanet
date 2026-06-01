import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Feedback } from '../../core/feedback';
import { SocialState } from '../../core/social-state';
import { Preferences } from '../../core/preferences';
import { ApiPost, Posts } from '../../core/posts';
import { Auth, CurrentUser } from '../../core/auth';

type CommentAttachment = 'photo' | 'video' | 'sticker' | 'emoji' | null;

type FeedPost = {
  id: number;
  author: string;
  username: string;
  avatar: string;
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
  author: string;
  avatar: string;
  text: string;
  attachment: CommentAttachment;
  time: string;
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
  protected readonly postsError = signal<string | null>(null);
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
  protected readonly followedProfileIds = signal<Set<number>>(new Set());
  protected readonly hiddenPostIds = signal<Set<number>>(new Set());
  protected readonly openPostMenuId = signal<number | null>(null);
  protected readonly posts = signal<FeedPost[]>([]);
  protected readonly comments = signal<Record<number, PostComment[]>>({
    1: [
      {
        id: 1,
        author: 'Maria Guilhermina',
        avatar: 'https://i.pravatar.cc/96?img=47',
        text: 'Ficou mesmo inspirador!',
        attachment: null,
        time: 'Agora'
      },
      {
        id: 2,
        author: 'Lia K.',
        avatar: 'https://i.pravatar.cc/96?img=36',
        text: 'Esse setup merece uma foto de capa.',
        attachment: 'photo',
        time: '12 min'
      }
    ],
    2: [
      {
        id: 3,
        author: 'David Miller',
        avatar: 'https://i.pravatar.cc/96?img=18',
        text: 'Também estou a gostar bastante.',
        attachment: null,
        time: '31 min'
      }
    ],
    3: [
      {
        id: 4,
        author: 'Ana Figueira',
        avatar: 'https://i.pravatar.cc/96?img=44',
        text: 'Que luz linda.',
        attachment: 'emoji',
        time: '18 min'
      }
    ],
    4: [
      {
        id: 5,
        author: 'Julian Thorne',
        avatar: 'https://i.pravatar.cc/96?img=60',
        text: 'Boa organização.',
        attachment: 'sticker',
        time: '8 min'
      }
    ]
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

  constructor(
    private readonly feedback: Feedback,
    private readonly postService: Posts,
    protected readonly auth: Auth,
    protected readonly socialState: SocialState,
    protected readonly prefs: Preferences
  ) {}

  ngOnInit(): void {
    this.loadPosts();
  }

  protected openComposer(): void {
    if (!this.composerText() && this.savedDraft()) {
      this.composerText.set(this.savedDraft());
    }
    this.postsError.set(null);
    this.isComposerOpen.set(true);
  }

  protected closeComposer(): void {
    this.isComposerOpen.set(false);
    this.clearComposer();
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

    this.postService.create({
      content: content || (this.selectedVideo() ? 'Novo vídeo partilhado.' : 'Nova imagem partilhada.'),
      image: this.selectedImage(),
      video: this.selectedVideo()
    }).subscribe({
      next: (response) => {
        const post = this.mapPost(response.data);
        this.posts.update((posts) => [post, ...posts]);
        this.comments.update((comments) => ({ ...comments, [post.id]: [] }));
        this.savedDraft.set('');
        this.isPublishingPost.set(false);
        this.isComposerOpen.set(false);
        this.clearComposer();
        this.feedback.show('Publicação criada.', 'success');
      },
      error: () => {
        this.postsError.set('Não foi possível publicar.');
        this.isPublishingPost.set(false);
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

  protected openComments(postId: number): void {
    this.activeCommentPostId.set(postId);
    this.selectedCommentAttachment.set(null);
  }

  protected closeComments(): void {
    this.activeCommentPostId.set(null);
    this.selectedCommentAttachment.set(null);
  }

  protected selectCommentAttachment(attachment: CommentAttachment): void {
    this.selectedCommentAttachment.update((currentAttachment) =>
      currentAttachment === attachment ? null : attachment
    );
  }

  protected submitComment(text: string): void {
    const postId = this.activeCommentPostId();
    const trimmedText = text.trim();
    const attachment = this.selectedCommentAttachment();

    if (!postId || (!trimmedText && !attachment)) {
      return;
    }

    const nextComment: PostComment = {
      id: Date.now(),
      author: this.auth.currentUser()?.name ?? 'Utilizador',
      avatar: this.currentUserAvatar(),
      text: trimmedText || this.attachmentLabel(attachment),
      attachment,
      time: 'Agora'
    };

    this.comments.update((comments) => ({
      ...comments,
      [postId]: [...(comments[postId] ?? []), nextComment]
    }));
    this.incrementCommentCount(postId);
    this.selectedCommentAttachment.set(null);
    this.feedback.show('Comentário publicado.');
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

  protected isFollowingProfile(profileId: number): boolean {
    return this.followedProfileIds().has(profileId);
  }

  protected toggleSuggestedFollow(profileId: number): void {
    this.followedProfileIds.update((profileIds) => {
      const nextProfileIds = new Set(profileIds);
      nextProfileIds.has(profileId) ? nextProfileIds.delete(profileId) : nextProfileIds.add(profileId);
      return nextProfileIds;
    });
    this.feedback.show(this.isFollowingProfile(profileId) ? 'Agora estás a seguir este perfil.' : 'Deixaste de seguir este perfil.', this.isFollowingProfile(profileId) ? 'success' : 'info');
  }

  protected currentUserAvatar(user: CurrentUser | null = this.auth.currentUser()): string {
    return user?.profile_photo ? `/storage/${user.profile_photo}` : 'https://i.pravatar.cc/96?img=47';
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

  private mapPost(post: ApiPost): FeedPost {
    return {
      id: post.id,
      author: post.author.name ?? 'Utilizador',
      username: post.author.username ? `@${post.author.username}` : `#${post.user_id}`,
      avatar: post.author.profile_photo ? `/storage/${post.author.profile_photo}` : 'https://i.pravatar.cc/96?img=47',
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
