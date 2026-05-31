import { Component, computed, signal } from '@angular/core';
import { Feedback } from '../../core/feedback';
import { Preferences } from '../../core/preferences';
import { SocialState } from '../../core/social-state';

type ExploreItem = {
  id: number;
  title: string;
  image: string;
  video?: string;
  avatar: string;
  author: string;
  time: string;
  description: string;
  commentsCount: number;
  bazeCount: number;
  kind: 'image' | 'video' | 'album';
  className: string;
};

type ExploreFilter = 'all' | 'image' | 'video' | 'album';

type ExploreComment = {
  id: number;
  author: string;
  avatar: string;
  text: string;
  time: string;
};

@Component({
  selector: 'app-explore',
  imports: [],
  templateUrl: './explore.html'
})
export class Explore {
  constructor(
    private readonly feedback: Feedback,
    protected readonly prefs: Preferences,
    protected readonly socialState: SocialState
  ) {}

  protected readonly activeFilter = signal<ExploreFilter>('all');
  protected readonly areFiltersOpen = signal(false);
  protected readonly activeItemId = signal<number | null>(null);
  protected readonly exploreItems: ExploreItem[] = [
    {
      id: 1,
      title: 'Conversa no pavilhão',
      image: 'meza-membros/meza-01.jpeg',
      avatar: 'https://i.pravatar.cc/80?img=11',
      author: '@meza.membros',
      time: '8 min',
      description: 'Membros da Meza a partilhar a proposta com visitantes durante a feira.',
      commentsCount: 18,
      bazeCount: 246,
      kind: 'image',
      className: 'md:col-span-2 md:row-span-1'
    },
    {
      id: 2,
      title: 'Equipa no stand',
      image: 'meza-membros/meza-06.jpeg',
      avatar: 'https://i.pravatar.cc/80?img=21',
      author: '@meza.team',
      time: '22 min',
      description: 'Registo da equipa no stand da Meza, com demonstração e material de divulgação.',
      commentsCount: 34,
      bazeCount: 519,
      kind: 'album',
      className: 'md:col-span-2 md:row-span-1'
    },
    {
      id: 3,
      title: 'Demonstração ao vivo',
      image: 'meza-membros/meza-07.jpeg',
      avatar: 'https://i.pravatar.cc/80?img=12',
      author: '@meza.demo',
      time: '40 min',
      description: 'Apresentação da plataforma para quem queria conhecer melhor a experiência Meza.',
      commentsCount: 11,
      bazeCount: 188,
      kind: 'image',
      className: 'md:col-span-2 md:row-span-2'
    },
    {
      id: 4,
      title: 'Momentos da feira',
      image: 'meza-membros/meza-08.jpeg',
      avatar: 'https://i.pravatar.cc/80?img=33',
      author: '@meza.eventos',
      time: '1 h',
      description: 'Álbum com conversas, visitantes e bastidores da presença da Meza.',
      commentsCount: 27,
      bazeCount: 372,
      kind: 'album',
      className: 'md:col-span-2 md:row-span-1'
    },
    {
      id: 5,
      title: 'Pitch da Meza',
      image: 'meza-membros/meza-09.jpeg',
      video: 'meza-membros/meza-video-01.mp4',
      avatar: 'https://i.pravatar.cc/80?img=45',
      author: '@meza.pitch',
      time: '2 h',
      description: 'Vídeo curto com momentos da apresentação da Meza ao público.',
      commentsCount: 42,
      bazeCount: 680,
      kind: 'video',
      className: 'md:col-span-2 md:row-span-1'
    },
    {
      id: 6,
      title: 'Resumo em vídeo',
      image: 'meza-membros/meza-10.jpeg',
      video: 'meza-membros/meza-video-02.mp4',
      avatar: 'https://i.pravatar.cc/80?img=28',
      author: '@meza.media',
      time: '3 h',
      description: 'Resumo em vídeo da interação com membros, visitantes e parceiros.',
      commentsCount: 9,
      bazeCount: 151,
      kind: 'video',
      className: 'md:col-span-2 md:row-span-1'
    }
  ];
  protected readonly comments = signal<Record<number, ExploreComment[]>>({
    1: [
      { id: 1, author: 'Maria Guilhermina', avatar: 'https://i.pravatar.cc/80?img=47', text: 'Essa luz ficou mesmo bonita.', time: 'Agora' }
    ],
    5: [
      { id: 2, author: 'Lia K.', avatar: 'https://i.pravatar.cc/80?img=36', text: 'Que memória doce.', time: '14 min' }
    ]
  });
  protected readonly filteredExploreItems = computed(() => {
    const filter = this.activeFilter();
    return filter === 'all'
      ? this.exploreItems
      : this.exploreItems.filter((item) => item.kind === filter);
  });
  protected readonly activeItem = computed(() =>
    this.exploreItems.find((item) => item.id === this.activeItemId()) ?? null
  );
  protected readonly activeItemComments = computed(() => {
    const itemId = this.activeItemId();
    return itemId ? this.comments()[itemId] ?? [] : [];
  });

  protected setFilter(filter: ExploreFilter): void {
    this.activeFilter.set(filter);
    this.feedback.show('Filtro aplicado.', 'info');
  }

  protected toggleFilters(): void {
    this.areFiltersOpen.update((isOpen) => !isOpen);
  }

  protected openItemDetails(itemId: number): void {
    this.activeItemId.set(itemId);
  }

  protected closeItemDetails(): void {
    this.activeItemId.set(null);
  }

  protected toggleBaze(itemId: number): void {
    const hasBaze = this.socialState.togglePostBaze(itemId);
    this.feedback.show(hasBaze ? 'Deste baze nesta publicação.' : 'Baze removido.', hasBaze ? 'success' : 'info');
  }

  protected toggleFavorite(itemId: number): void {
    const isFavorite = this.socialState.togglePostFavorite(itemId);
    this.feedback.show(isFavorite ? 'Publicação guardada.' : 'Publicação removida dos guardados.', isFavorite ? 'success' : 'info');
  }

  protected shareItem(itemId: number): void {
    this.socialState.sharePost(itemId);
    this.feedback.show('Publicação partilhada.');
  }

  protected submitComment(text: string): void {
    const itemId = this.activeItemId();
    const trimmedText = text.trim();

    if (!itemId || !trimmedText) {
      this.feedback.show('Escreve um comentário antes de publicar.', 'info');
      return;
    }

    const nextComment: ExploreComment = {
      id: Date.now(),
      author: 'Maria Guilhermina',
      avatar: 'https://i.pravatar.cc/80?img=47',
      text: trimmedText,
      time: 'Agora'
    };

    this.comments.update((comments) => ({
      ...comments,
      [itemId]: [...(comments[itemId] ?? []), nextComment]
    }));
    this.feedback.show('Comentário publicado.');
  }

  protected itemBazeCount(item: ExploreItem): number {
    return item.bazeCount + (this.socialState.hasPostBaze(item.id) ? 1 : 0);
  }

  protected itemCommentsCount(item: ExploreItem): number {
    return item.commentsCount + (this.comments()[item.id]?.length ?? 0);
  }
}
