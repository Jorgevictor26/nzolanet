import { Component, signal } from '@angular/core';
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

@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.html'
})
export class Profile {
  constructor(
    protected readonly prefs: Preferences,
    protected readonly socialState: SocialState
  ) {}

  protected readonly isProfileEditorOpen = signal(false);
  protected readonly activeModal = signal<ProfileListModal>(null);
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
      id: 7,
      name: 'Sarah Connor',
      username: '@sarah.c',
      avatar: 'https://i.pravatar.cc/80?img=32',
      bio: 'Fotografia documental',
      isFollowing: false
    },
    {
      id: 8,
      name: 'David Miller',
      username: '@david.m',
      avatar: 'https://i.pravatar.cc/80?img=18',
      bio: 'Design e produto',
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
      image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1100&q=85',
      imageAlt: 'Espaço de trabalho com plantas e portátil'
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
      image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1100&q=85',
      imageAlt: 'Paisagem verde ao pôr do sol'
    },
    {
      id: 4,
      author: 'David Miller',
      username: '@miller_design',
      avatar: 'https://i.pravatar.cc/96?img=18',
      text: 'Novo painel para organizar ideias antes da próxima reunião.',
      image: 'https://images.unsplash.com/photo-1550439062-609e1531270e?auto=format&fit=crop&w=1100&q=85',
      imageAlt: 'Ambiente de tecnologia com computador'
    }
  ];

  protected openProfileEditor(): void {
    this.isProfileEditorOpen.set(true);
  }

  protected closeProfileEditor(): void {
    this.isProfileEditorOpen.set(false);
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
  }

  protected unfollowProfile(profileId: number): void {
    this.following.update((profiles) =>
      profiles.map((profile) =>
        profile.id === profileId ? { ...profile, isFollowing: false } : profile
      )
    );
  }

  protected toggleSuggestedFollow(profileId: number): void {
    this.suggestedProfiles.update((profiles) =>
      profiles.map((profile) =>
        profile.id === profileId ? { ...profile, isFollowing: !profile.isFollowing } : profile
      )
    );
  }
}
