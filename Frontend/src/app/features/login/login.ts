import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html'
})
export class Login {
  constructor(private readonly router: Router) {}

  protected readonly authStep = signal<AuthStep>('login');
  protected readonly isPasswordVisible = signal(false);
  protected readonly firstName = signal('');
  protected readonly lastName = signal('');
  protected readonly bio = signal('');
  protected readonly profilePhotoPreview = signal<string | null>(null);
  protected readonly profileInitials = computed(() => {
    const names = [this.firstName(), this.lastName()]
      .map((name) => name.trim())
      .filter(Boolean);

    if (!names.length) {
      return 'U';
    }

    return names
      .slice(0, 2)
      .map((name) => name[0]?.toUpperCase() ?? '')
      .join('');
  });
  protected readonly suggestedProfiles = signal<SuggestedProfile[]>([
    {
      id: 15,
      name: 'Marcus Vane',
      username: '@mrv_design',
      avatar: 'https://i.pravatar.cc/96?img=15',
      role: 'Design e tecnologia',
      isFollowing: false
    },
    {
      id: 36,
      name: 'Lia K.',
      username: '@lia_connect',
      avatar: 'https://i.pravatar.cc/96?img=36',
      role: 'Comunidade NzolaNet',
      isFollowing: false
    },
    {
      id: 60,
      name: 'Julian Thorne',
      username: '@jthorne_io',
      avatar: 'https://i.pravatar.cc/96?img=60',
      role: 'Tecnologia e startups',
      isFollowing: false
    }
  ]);

  protected togglePasswordVisibility(): void {
    this.isPasswordVisible.update((isVisible) => !isVisible);
  }

  protected goToStep(step: AuthStep): void {
    this.authStep.set(step);
  }

  protected chooseProfilePhoto(input: HTMLInputElement): void {
    input.click();
  }

  protected uploadProfilePhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.profilePhotoPreview.set(URL.createObjectURL(file));
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
