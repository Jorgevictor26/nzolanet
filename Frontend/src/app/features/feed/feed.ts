import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Feedback } from '../../core/feedback';
import { SocialState } from '../../core/social-state';
import { Preferences } from '../../core/preferences';

type CommentAttachment = 'photo' | 'video' | 'sticker' | 'emoji' | null;

type FeedPost = {
  id: number;
  author: string;
  username: string;
  avatar: string;
  time: string;
  text: string;
  tags?: string;
  image?: string;
  imageAlt?: string;
  video?: string;
  videoAlt?: string;
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
export class Feed {
  protected readonly isComposerOpen = signal(false);
  protected readonly activeCommentPostId = signal<number | null>(null);
  protected readonly selectedCommentAttachment = signal<CommentAttachment>(null);
  protected readonly likedPostIds = signal<Set<number>>(new Set());
  protected readonly followedProfileIds = signal<Set<number>>(new Set());
  protected readonly createdPosts = signal<FeedPost[]>([]);
  protected readonly composerText = signal('');
  protected readonly composerMediaUrl = signal<string | null>(null);
  protected readonly composerMediaKind = signal<'image' | 'video' | null>(null);
  protected readonly composerMediaName = signal('');
  protected readonly composerLocation = signal('');
  protected readonly savedDraft = signal('');
  protected readonly composerLimit = 280;
  protected readonly posts: FeedPost[] = [
    {
      id: 1,
      author: 'Alex Rivera',
      username: '@arivera.nz',
      avatar: 'https://i.pravatar.cc/96?img=12',
      time: '7h atrás',
      text: 'A equipa da Meza esteve no terreno a apresentar a plataforma e ouvir sugestões dos visitantes.',
      tags: '#Meza #Membros #NzolaNet',
      image: 'meza-membros/meza-06.jpeg',
      imageAlt: 'Membros da Meza no stand do evento'
    },
    {
      id: 2,
      author: 'Sarah Chen',
      username: '@schen.dev',
      avatar: 'https://i.pravatar.cc/96?img=5',
      time: '4h atrás',
      text: 'A conectividade nesta plataforma é incrível. Realmente aproveitando as vibrações do glassmorphism e a navegação fluida. Novas ideias a caminho.'
    },
    {
      id: 3,
      author: 'Karina Ribeiro',
      username: '@karinaribeiro123_',
      avatar: 'https://i.pravatar.cc/96?img=32',
      time: '2h atrás',
      text: 'Boas conversas, demonstrações rápidas e muita curiosidade à volta da Meza.',
      tags: '#Meza #comunidade #NzolaNet',
      image: 'meza-membros/meza-01.jpeg',
      imageAlt: 'Membros da Meza em conversa com visitantes'
    },
    {
      id: 4,
      author: 'David Miller',
      username: '@miller_design',
      avatar: 'https://i.pravatar.cc/96?img=18',
      time: '1h atrás',
      text: 'Mais um registo do stand, com a equipa a explicar como a experiência funciona.',
      image: 'meza-membros/meza-07.jpeg',
      imageAlt: 'Demonstração da Meza durante o evento'
    }
  ];
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
  protected readonly allPosts = computed(() => [...this.createdPosts(), ...this.posts]);
  protected readonly activeCommentPost = computed(() =>
    this.allPosts().find((post) => post.id === this.activeCommentPostId()) ?? null
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
    this.composerText().trim().length > 0 || Boolean(this.composerMediaUrl())
  );

  constructor(
    private readonly feedback: Feedback,
    protected readonly socialState: SocialState,
    protected readonly prefs: Preferences
  ) {}

  protected openComposer(): void {
    if (!this.composerText() && this.savedDraft()) {
      this.composerText.set(this.savedDraft());
    }
    this.isComposerOpen.set(true);
  }

  protected closeComposer(): void {
    this.isComposerOpen.set(false);
  }

  protected updateComposerText(text: string): void {
    this.composerText.set(text.slice(0, this.composerLimit));
  }

  protected chooseComposerFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.applyComposerFile(file);
    input.value = '';
  }

  protected handleComposerDrop(event: DragEvent): void {
    event.preventDefault();
    this.applyComposerFile(event.dataTransfer?.files?.[0]);
  }

  protected clearComposerMedia(): void {
    this.revokeComposerMedia();
    this.composerMediaUrl.set(null);
    this.composerMediaKind.set(null);
    this.composerMediaName.set('');
  }

  protected insertComposerHashtag(): void {
    const currentText = this.composerText().trimEnd();
    const separator = currentText ? ' ' : '';
    this.updateComposerText(`${currentText}${separator}#NzolaNet`);
  }

  protected toggleComposerLocation(): void {
    this.composerLocation.update((location) => location ? '' : 'Luanda, Angola');
    this.feedback.show(this.composerLocation() ? 'Localização adicionada.' : 'Localização removida.', 'info');
  }

  protected addComposerEmoji(): void {
    this.updateComposerText(`${this.composerText()} :)`);
  }

  protected saveComposerDraft(): void {
    this.savedDraft.set(this.composerText());
    this.feedback.show('Rascunho guardado.', 'success');
  }

  protected publishComposerPost(): void {
    if (!this.canPublishComposer()) {
      this.feedback.show('Escreve algo ou adiciona uma imagem/vídeo antes de publicar.', 'info');
      return;
    }

    const text = this.composerText().trim() || (this.composerMediaKind() === 'video' ? 'Novo vídeo partilhado.' : 'Nova imagem partilhada.');
    const nextPost: FeedPost = {
      id: Date.now(),
      author: 'Maria Guilhermina',
      username: this.composerLocation() ? `@maria.g · ${this.composerLocation()}` : '@maria.g',
      avatar: 'https://i.pravatar.cc/96?img=47',
      time: 'Agora',
      text,
      image: this.composerMediaKind() === 'image' ? this.composerMediaUrl() ?? undefined : undefined,
      imageAlt: this.composerMediaName() || 'Imagem publicada por Maria Guilhermina',
      video: this.composerMediaKind() === 'video' ? this.composerMediaUrl() ?? undefined : undefined,
      videoAlt: this.composerMediaName() || 'Vídeo publicado por Maria Guilhermina'
    };

    this.createdPosts.update((posts) => [nextPost, ...posts]);
    this.comments.update((comments) => ({ ...comments, [nextPost.id]: [] }));
    this.savedDraft.set('');
    this.resetComposer();
    this.closeComposer();
    this.feedback.show('Publicação criada.', 'success');
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
      author: 'Maria Guilhermina',
      avatar: 'https://i.pravatar.cc/96?img=47',
      text: trimmedText || this.attachmentLabel(attachment),
      attachment,
      time: 'Agora'
    };

    this.comments.update((comments) => ({
      ...comments,
      [postId]: [...(comments[postId] ?? []), nextComment]
    }));
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
    this.likedPostIds.update((postIds) => {
      const nextPostIds = new Set(postIds);
      nextPostIds.has(postId) ? nextPostIds.delete(postId) : nextPostIds.add(postId);
      return nextPostIds;
    });
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

  private applyComposerFile(file: File | undefined): void {
    if (!file) {
      return;
    }

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      this.feedback.show('Escolhe uma imagem ou um vídeo.', 'info');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      this.feedback.show('O ficheiro deve ter no máximo 50MB.', 'info');
      return;
    }

    this.clearComposerMedia();
    this.composerMediaKind.set(isImage ? 'image' : 'video');
    this.composerMediaName.set(file.name);
    this.composerMediaUrl.set(URL.createObjectURL(file));
    this.feedback.show(isImage ? 'Imagem pronta para publicar.' : 'Vídeo pronto para publicar.', 'success');
  }

  private resetComposer(): void {
    this.composerText.set('');
    this.composerLocation.set('');
    this.clearComposerMedia();
  }

  private revokeComposerMedia(): void {
    const mediaUrl = this.composerMediaUrl();
    if (mediaUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(mediaUrl);
    }
  }
}
