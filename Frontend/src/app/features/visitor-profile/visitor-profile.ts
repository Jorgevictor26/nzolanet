import { Component, signal } from '@angular/core';
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

@Component({
  selector: 'app-visitor-profile',
  imports: [],
  templateUrl: './visitor-profile.html'
})
export class VisitorProfile {
  protected readonly isFollowing = signal(false);
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
      avatar: 'https://i.pravatar.cc/80?img=5',
      bio: 'Fotografia documental',
      isFollowing: false
    },
    {
      id: 8,
      name: 'David Miller',
      username: '@miller_design',
      avatar: 'https://i.pravatar.cc/80?img=18',
      bio: 'Design e produto',
      isFollowing: false
    }
  ]);

  constructor(protected readonly prefs: Preferences) {}

  protected toggleFollow(): void {
    this.isFollowing.update((value) => !value);
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
