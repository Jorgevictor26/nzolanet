import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  protected readonly posts: FeedPost[] = [
    {
      id: 1,
      author: 'Alex Rivera',
      username: '@arivera.nz',
      avatar: 'https://i.pravatar.cc/96?img=12',
      time: '7h atrás',
      text: 'Acabei de configurar meu novo espaço de trabalho! 🚀',
      tags: '#produtividade #NzolaNet',
      image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1100&q=85',
      imageAlt: 'Espaço de trabalho com plantas e portátil'
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
      text: 'A tarde perfeita para respirar, fotografar e guardar memórias.',
      tags: '#Luanda #cultura #NzolaNet',
      image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1100&q=85',
      imageAlt: 'Paisagem verde ao pôr do sol'
    },
    {
      id: 4,
      author: 'David Miller',
      username: '@miller_design',
      avatar: 'https://i.pravatar.cc/96?img=18',
      time: '1h atrás',
      text: 'Novo painel para organizar ideias antes da próxima reunião.',
      image: 'https://images.unsplash.com/photo-1550439062-609e1531270e?auto=format&fit=crop&w=1100&q=85',
      imageAlt: 'Ambiente de tecnologia com computador'
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
  protected readonly activeCommentPost = computed(() =>
    this.posts.find((post) => post.id === this.activeCommentPostId()) ?? null
  );
  protected readonly activePostComments = computed(() => {
    const postId = this.activeCommentPostId();
    return postId ? this.comments()[postId] ?? [] : [];
  });

  constructor(
    protected readonly socialState: SocialState,
    protected readonly prefs: Preferences
  ) {}

  protected openComposer(): void {
    this.isComposerOpen.set(true);
  }

  protected closeComposer(): void {
    this.isComposerOpen.set(false);
  }

  protected toggleWorkspacePostFavorite(): void {
    this.socialState.toggleWorkspacePostFavorite();
  }

  protected sharePost(postId: number): void {
    this.socialState.sharePost(postId);
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
  }
}
