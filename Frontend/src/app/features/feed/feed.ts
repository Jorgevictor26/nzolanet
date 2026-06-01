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
  video?: string;
  image?: string;
  imageAlt?: string;
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
  protected readonly activeCommentPostId = signal<number | null>(null);
  protected readonly selectedCommentAttachment = signal<CommentAttachment>(null);
  protected readonly likedPostIds = signal<Set<number>>(new Set());
  protected readonly followedProfileIds = signal<Set<number>>(new Set());
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
  protected readonly activeCommentPost = computed(() =>
    this.posts().find((post) => post.id === this.activeCommentPostId()) ?? null
  );
  protected readonly activePostComments = computed(() => {
    const postId = this.activeCommentPostId();
    return postId ? this.comments()[postId] ?? [] : [];
  });

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
    this.socialState.sharePost(postId);
    this.feedback.show('Publicação partilhada.');
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

  protected choosePostMedia(input: HTMLInputElement): void {
    input.click();
  }

  protected selectPostMedia(event: Event, type: 'image' | 'video'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      return;
    }

    if (this.selectedMediaPreview()) {
      URL.revokeObjectURL(this.selectedMediaPreview() as string);
    }

    this.selectedImage.set(type === 'image' ? file : null);
    this.selectedVideo.set(type === 'video' ? file : null);
    this.selectedMediaPreview.set(URL.createObjectURL(file));
    input.value = '';
  }

  protected removeSelectedMedia(): void {
    if (this.selectedMediaPreview()) {
      URL.revokeObjectURL(this.selectedMediaPreview() as string);
    }

    this.selectedImage.set(null);
    this.selectedVideo.set(null);
    this.selectedMediaPreview.set(null);
  }

  protected publishPost(): void {
    const content = this.composerText().trim();

    if (!content) {
      this.postsError.set('Escreve algum texto para publicar.');
      return;
    }

    this.isPublishingPost.set(true);
    this.postsError.set(null);
    this.postService.create({
      content,
      image: this.selectedImage(),
      video: this.selectedVideo()
    }).subscribe({
      next: (response) => {
        this.posts.update((posts) => [this.mapPost(response.data), ...posts]);
        this.isPublishingPost.set(false);
        this.isComposerOpen.set(false);
        this.clearComposer();
        this.feedback.show('Publicação criada.');
      },
      error: () => {
        this.postsError.set('Não foi possível publicar.');
        this.isPublishingPost.set(false);
      }
    });
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

    if (days > 0) {
      return `${days}d atrás`;
    }

    if (hours > 0) {
      return `${hours}h atrás`;
    }

    if (minutes > 0) {
      return `${minutes}min atrás`;
    }

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
    this.postsError.set(null);
    this.removeSelectedMedia();
  }
}
