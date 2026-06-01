import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth, CurrentUser } from '../../core/auth';
import { Feedback } from '../../core/feedback';
import { Preferences } from '../../core/preferences';
import { SocialState } from '../../core/social-state';

type ProfileListModal = 'followers' | 'following' | null;

type ProfileListItem = {
  id: number;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  isFollowing: boolean;
};

type SharedProfilePost = {
  id: number;
  author: string;
  username: string;
  avatar: string;
  text: string;
  image?: string;
  imageAlt?: string;
};

type ProfileContentFilter = 'posts' | 'photos' | 'videos' | 'tagged';

type ProfileMediaItem = {
  id: number;
  kind: ProfileContentFilter;
  image: string;
  alt: string;
};

@Component({
  selector: 'app-profile',
  imports: [FormsModule],
  templateUrl: './profile.html'
})
export class Profile implements OnInit {
  constructor(
    protected readonly auth: Auth,
    private readonly feedback: Feedback,
    protected readonly prefs: Preferences,
    protected readonly socialState: SocialState
  ) {}

  protected readonly isProfileEditorOpen = signal(false);
  protected readonly isSavingProfile = signal(false);
  protected readonly profileError = signal<string | null>(null);
  protected readonly editName = signal('');
  protected readonly editBio = signal('');
  protected readonly editPrivacy = signal<'public' | 'private'>('public');
  protected readonly activeModal = signal<ProfileListModal>(null);
  protected readonly activeContentFilter = signal<ProfileContentFilter>('posts');
  protected readonly followers = signal<ProfileListItem[]>([
    {
      id: 1,
      name: 'Sarah Connor',
      username: '@sarah.c',
      avatar: 'https://i.pravatar.cc/80?img=5',
      bio: 'Fotografia, cultura e viagens',
      isFollowing: false
    },
    {
      id: 2,
      name: 'David Miller',
      username: '@miller_design',
      avatar: 'https://i.pravatar.cc/80?img=18',
      bio: 'Design de produtos digitais',
      isFollowing: true
    },
    {
      id: 3,
      name: 'Lia K.',
      username: '@lia_connect',
      avatar: 'https://i.pravatar.cc/80?img=36',
      bio: 'Comunidade NzolaNet',
      isFollowing: false
    }
  ]);
  protected readonly following = signal<ProfileListItem[]>([
    {
      id: 4,
      name: 'Marcus Vane',
      username: '@mrv_design',
      avatar: 'https://i.pravatar.cc/80?img=15',
      bio: 'Branding e identidade visual',
      isFollowing: true
    },
    {
      id: 5,
      name: 'Julian Thorne',
      username: '@jthorne_io',
      avatar: 'https://i.pravatar.cc/80?img=60',
      bio: 'Tecnologia e startups',
      isFollowing: true
    },
    {
      id: 6,
      name: 'Ana Figueira',
      username: '@anafigueira',
      avatar: 'https://i.pravatar.cc/80?img=44',
      bio: 'Moda, eventos e lifestyle',
      isFollowing: true
    }
  ]);
  protected readonly suggestedProfiles = signal<ProfileListItem[]>([
    {
      id: 15,
      name: 'Marcus Vane',
      username: '@mrv_design',
      avatar: 'https://i.pravatar.cc/80?img=15',
      bio: 'Branding e identidade visual',
      isFollowing: false
    },
    {
      id: 36,
      name: 'Lia K.',
      username: '@lia_connect',
      avatar: 'https://i.pravatar.cc/80?img=36',
      bio: 'Comunidade NzolaNet',
      isFollowing: false
    },
    {
      id: 60,
      name: 'Julian Thorne',
      username: '@jthorne_io',
      avatar: 'https://i.pravatar.cc/80?img=60',
      bio: 'Tecnologia e startups',
      isFollowing: false
    }
  ]);
  protected readonly sharedPosts: SharedProfilePost[] = [
    {
      id: 1,
      author: 'Alex Rivera',
      username: '@arivera.nz',
      avatar: 'https://i.pravatar.cc/96?img=12',
      text: 'Acabei de configurar meu novo espaço de trabalho! 🚀',
      image: 'meza-membros/meza-06.jpeg',
      imageAlt: 'Membros da Meza no stand do evento'
    },
    {
      id: 2,
      author: 'Sarah Chen',
      username: '@schen.dev',
      avatar: 'https://i.pravatar.cc/96?img=5',
      text: 'A conectividade nesta plataforma é incrível. Realmente aproveitando as vibrações do glassmorphism e a navegação fluida.'
    },
    {
      id: 3,
      author: 'Karina Ribeiro',
      username: '@karinaribeiro123_',
      avatar: 'https://i.pravatar.cc/96?img=32',
      text: 'A tarde perfeita para respirar, fotografar e guardar memórias.',
      image: 'meza-membros/meza-01.jpeg',
      imageAlt: 'Membros da Meza em conversa com visitantes'
    },
    {
      id: 4,
      author: 'David Miller',
      username: '@miller_design',
      avatar: 'https://i.pravatar.cc/96?img=18',
      text: 'Novo painel para organizar ideias antes da próxima reunião.',
      image: 'meza-membros/meza-07.jpeg',
      imageAlt: 'Demonstração da Meza durante o evento'
    }
  ];
  protected readonly mediaItems: ProfileMediaItem[] = [
    {
      id: 1,
      kind: 'photos',
      image: 'meza-membros/meza-02.jpeg',
      alt: 'Registo de membros da Meza'
    },
    {
      id: 2,
      kind: 'posts',
      image: 'meza-membros/meza-03.jpeg',
      alt: 'Momento da equipa Meza'
    },
    {
      id: 3,
      kind: 'videos',
      image: 'meza-membros/meza-09.jpeg',
      alt: 'Vídeo da apresentação Meza'
    },
    {
      id: 4,
      kind: 'tagged',
      image: 'meza-membros/meza-04.jpeg',
      alt: 'Visitante no stand da Meza'
    },
    {
      id: 5,
      kind: 'photos',
      image: 'meza-membros/meza-05.jpeg',
      alt: 'Interação com membros da Meza'
    },
    {
      id: 6,
      kind: 'posts',
      image: 'meza-membros/meza-10.jpeg',
      alt: 'Stand da Meza no evento'
    }
  ];
  protected readonly filteredMediaItems = computed(() => {
    const filter = this.activeContentFilter();
    return filter === 'posts'
      ? this.mediaItems
      : this.mediaItems.filter((item) => item.kind === filter);
  });
  protected readonly currentUser = computed(() => this.auth.currentUser());

  ngOnInit(): void {
    this.auth.me().subscribe({
      next: ({ data }) => this.syncEditor(data),
      error: (error: unknown) => this.profileError.set(this.errorMessage(error))
    });
  }

  protected openProfileEditor(): void {
    const user = this.currentUser();

    if (user) {
      this.syncEditor(user);
    }

    this.profileError.set(null);
    this.isProfileEditorOpen.set(true);
  }

  protected closeProfileEditor(): void {
    this.isProfileEditorOpen.set(false);
  }

  protected saveProfile(): void {
    this.profileError.set(null);
    this.isSavingProfile.set(true);
    this.auth.updateProfile({
      name: this.editName().trim(),
      bio: this.editBio().trim() || null,
      privacy: this.editPrivacy()
    }).subscribe({
      next: () => {
        this.isSavingProfile.set(false);
        this.isProfileEditorOpen.set(false);
        this.feedback.show('Perfil atualizado.');
      },
      error: (error: unknown) => {
        this.isSavingProfile.set(false);
        this.profileError.set(this.errorMessage(error));
      }
    });
  }

  protected chooseProfilePhoto(input: HTMLInputElement): void {
    input.click();
  }

  protected changeProfilePhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const photo = input.files?.[0];

    if (!photo) {
      return;
    }

    this.profileError.set(null);
    this.auth.changeProfilePhoto(photo).subscribe({
      next: () => this.feedback.show('Foto de perfil atualizada.'),
      error: (error: unknown) => this.profileError.set(this.errorMessage(error))
    });
    input.value = '';
  }

  protected profilePhotoUrl(user: CurrentUser | null = this.currentUser()): string {
    return user?.profile_photo ? `/storage/${user.profile_photo}` : 'https://i.pravatar.cc/180?img=47';
  }

  protected username(user: CurrentUser | null = this.currentUser()): string {
    return user?.email ? `@${user.email.split('@')[0]}` : '@utilizador';
  }

  protected setContentFilter(filter: ProfileContentFilter): void {
    this.activeContentFilter.set(filter);
    this.feedback.show('Filtro do perfil aplicado.', 'info');
  }

  protected openModal(modal: Exclude<ProfileListModal, null>): void {
    this.activeModal.set(modal);
  }

  protected closeModal(): void {
    this.activeModal.set(null);
  }

  protected toggleFollowerFollow(profileId: number): void {
    this.followers.update((profiles) =>
      profiles.map((profile) =>
        profile.id === profileId ? { ...profile, isFollowing: !profile.isFollowing } : profile
      )
    );
    this.feedback.show('Estado de seguimento atualizado.');
  }

  protected unfollowProfile(profileId: number): void {
    this.following.update((profiles) =>
      profiles.map((profile) =>
        profile.id === profileId ? { ...profile, isFollowing: false } : profile
      )
    );
    this.feedback.show('Perfil removido da lista a seguir.', 'info');
  }

  protected toggleSuggestedFollow(profileId: number): void {
    this.suggestedProfiles.update((profiles) =>
      profiles.map((profile) =>
        profile.id === profileId ? { ...profile, isFollowing: !profile.isFollowing } : profile
      )
    );
    this.feedback.show('Sugestão atualizada.');
  }

  private syncEditor(user: CurrentUser): void {
    this.editName.set(user.name);
    this.editBio.set(user.bio ?? '');
    this.editPrivacy.set(user.privacy);
  }

  private errorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Não foi possível concluir a operação.';
    }

    const validationErrors = error.error?.errors;
    const firstValidationError = validationErrors ? Object.values(validationErrors)[0] : null;

    if (Array.isArray(firstValidationError) && firstValidationError[0]) {
      return String(firstValidationError[0]);
    }

    return error.error?.message || 'Não foi possível concluir a operação.';
  }
}
