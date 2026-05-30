import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

type AuthStep = 'login' | 'register' | 'photo' | 'bio' | 'follow' | 'forgot' | 'reset';

type SuggestedProfile = {
  id: number;
  name: string;
  username: string;
  avatar: string;
  role: string;
  isFollowing: boolean;
};

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  templateUrl: './login.html'
})
export class Login {
  constructor(private readonly router: Router) {}

  protected readonly authStep = signal<AuthStep>('login');
  protected readonly isPasswordVisible = signal(false);
  protected readonly hasProfilePhoto = signal(false);
  protected readonly suggestedProfiles = signal<SuggestedProfile[]>([
    {
      id: 1,
      name: 'Sarah Chen',
      username: '@schen.dev',
      avatar: 'https://i.pravatar.cc/96?img=5',
      role: 'Design e tecnologia',
      isFollowing: false
    },
    {
      id: 2,
      name: 'Alex Rivera',
      username: '@arivera.nz',
      avatar: 'https://i.pravatar.cc/96?img=12',
      role: 'Produtividade e criacao',
      isFollowing: false
    },
    {
      id: 3,
      name: 'Lia K.',
      username: '@lia_connect',
      avatar: 'https://i.pravatar.cc/96?img=36',
      role: 'Comunidade NzolaNet',
      isFollowing: false
    }
  ]);

  protected togglePasswordVisibility(): void {
    this.isPasswordVisible.update((isVisible) => !isVisible);
  }

  protected goToStep(step: AuthStep): void {
    this.authStep.set(step);
  }

  protected chooseProfilePhoto(): void {
    this.hasProfilePhoto.set(true);
  }

  protected toggleFollow(profileId: number): void {
    this.suggestedProfiles.update((profiles) =>
      profiles.map((profile) =>
        profile.id === profileId ? { ...profile, isFollowing: !profile.isFollowing } : profile
      )
    );
  }

  protected finishOnboarding(): void {
    this.router.navigateByUrl('/home');
  }
}
