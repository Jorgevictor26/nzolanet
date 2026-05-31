import { Component, computed, signal } from '@angular/core';
import { Preferences } from '../../core/preferences';

type ProfileListModal = 'followers' | 'following' | null;

type ProfileListItem = {
  id: number;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  isFollowing: boolean;
};

type ProfileContentFilter = 'posts' | 'photos' | 'videos' | 'tagged';

type ProfileMediaItem = {
  id: number;
  kind: ProfileContentFilter;
  image: string;
  alt: string;
};

@Component({
  selector: 'app-visitor-profile',
  imports: [],
  templateUrl: './visitor-profile.html'
})
export class VisitorProfile {
  protected readonly isFollowing = signal(false);
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
  protected readonly mediaItems: ProfileMediaItem[] = [
    {
      id: 1,
      kind: 'photos',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
      alt: 'Arte abstrata colorida'
    },
    {
      id: 2,
      kind: 'posts',
      image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=600&q=80',
      alt: 'Espaço de trabalho'
    },
    {
      id: 3,
      kind: 'videos',
      image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80',
      alt: 'Paisagem natural'
    },
    {
      id: 4,
      kind: 'tagged',
      image: 'https://images.unsplash.com/photo-1520975682031-a1c877bc1e15?auto=format&fit=crop&w=600&q=80',
      alt: 'Retrato editorial'
    },
    {
      id: 5,
      kind: 'photos',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
      alt: 'Moda urbana'
    },
    {
      id: 6,
      kind: 'posts',
      image: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=600&q=80',
      alt: 'Cidade ao anoitecer'
    }
  ];
  protected readonly filteredMediaItems = computed(() => {
    const filter = this.activeContentFilter();
    return filter === 'posts'
      ? this.mediaItems
      : this.mediaItems.filter((item) => item.kind === filter);
  });

  constructor(protected readonly prefs: Preferences) {}

  protected toggleFollow(): void {
    this.isFollowing.update((value) => !value);
  }

  protected setContentFilter(filter: ProfileContentFilter): void {
    this.activeContentFilter.set(filter);
  }

  protected openModal(modal: Exclude<ProfileListModal, null>): void {
    this.activeModal.set(modal);
  }

  protected closeModal(): void {
    this.activeModal.set(null);
  }

  protected toggleSuggestedFollow(profileId: number): void {
    this.suggestedProfiles.update((profiles) =>
      profiles.map((profile) =>
        profile.id === profileId ? { ...profile, isFollowing: !profile.isFollowing } : profile
      )
    );
  }
}
