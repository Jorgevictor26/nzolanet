import { Component, computed, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../core/auth';

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
  imports: [FormsModule],
  templateUrl: './login.html'
})
export class Login {
  constructor(
    private readonly router: Router,
    private readonly auth: Auth
  ) {}

  protected readonly authStep = signal<AuthStep>('login');
  protected readonly isPasswordVisible = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly authError = signal<string | null>(null);
  protected readonly authMessage = signal<string | null>(null);
  protected readonly loginEmail = signal('');
  protected readonly loginPassword = signal('');
  protected readonly registerEmail = signal('');
  protected readonly registerPassword = signal('');
  protected readonly forgotEmail = signal('');
  protected readonly resetToken = signal('');
  protected readonly resetPassword = signal('');
  protected readonly resetPasswordConfirmation = signal('');
  protected readonly selectedProfilePhoto = signal<File | null>(null);
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
    this.authError.set(null);
    this.authMessage.set(null);
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
    this.selectedProfilePhoto.set(file);
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

  protected submitLogin(): void {
    this.runRequest(() =>
      this.auth.login({
        email: this.loginEmail(),
        password: this.loginPassword()
      }).subscribe({
        next: () => this.router.navigateByUrl('/home'),
        error: (error: unknown) => this.handleError(error)
      })
    );
  }

  protected submitRegister(): void {
    const password = this.registerPassword();
    const email = this.registerEmail();
    const name = this.fullName();

    this.runRequest(() =>
      this.auth.register({ name, email, password }).subscribe({
        next: () => {
          this.auth.login({ email, password }).subscribe({
            next: () => {
              this.loginEmail.set(email);
              this.goToStep('photo');
              this.finishRequest();
            },
            error: (error: unknown) => this.handleError(error)
          });
        },
        error: (error: unknown) => this.handleError(error)
      })
    );
  }

  protected submitProfilePhoto(skip = false): void {
    const photo = this.selectedProfilePhoto();

    if (skip || !photo) {
      this.goToStep('bio');
      return;
    }

    this.runRequest(() =>
      this.auth.changeProfilePhoto(photo).subscribe({
        next: () => {
          this.goToStep('bio');
          this.finishRequest();
        },
        error: (error: unknown) => this.handleError(error)
      })
    );
  }

  protected submitBio(skip = false): void {
    const user = this.auth.currentUser();

    if (!user || skip) {
      this.goToStep('follow');
      return;
    }

    this.runRequest(() =>
      this.auth.updateProfile({
        name: user.name,
        username: user.username,
        phone_number: user.phone_number,
        bio: this.bio().trim() || null,
        privacy: user.privacy
      }).subscribe({
        next: () => {
          this.goToStep('follow');
          this.finishRequest();
        },
        error: (error: unknown) => this.handleError(error)
      })
    );
  }

  protected submitForgotPassword(): void {
    this.runRequest(() =>
      this.auth.forgotPassword(this.forgotEmail()).subscribe({
        next: (response) => {
          this.goToStep('reset');
          this.authMessage.set(response.message || 'Email de recuperação enviado.');
          this.finishRequest();
        },
        error: (error: unknown) => this.handleError(error)
      })
    );
  }

  protected submitResetPassword(): void {
    this.runRequest(() =>
      this.auth.resetPassword({
        email: this.forgotEmail(),
        token: this.resetToken(),
        password: this.resetPassword(),
        password_confirmation: this.resetPasswordConfirmation()
      }).subscribe({
        next: (response) => {
          this.goToStep('login');
          this.authMessage.set(response.message || 'Senha redefinida com sucesso.');
          this.finishRequest();
        },
        error: (error: unknown) => this.handleError(error)
      })
    );
  }

  private fullName(): string {
    return [this.firstName(), this.lastName()]
      .map((name) => name.trim())
      .filter(Boolean)
      .join(' ');
  }

  private runRequest(start: () => void): void {
    this.authError.set(null);
    this.authMessage.set(null);
    this.isSubmitting.set(true);
    start();
  }

  private finishRequest(): void {
    this.isSubmitting.set(false);
  }

  private handleError(error: unknown): void {
    this.authError.set(this.errorMessage(error));
    this.isSubmitting.set(false);
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
