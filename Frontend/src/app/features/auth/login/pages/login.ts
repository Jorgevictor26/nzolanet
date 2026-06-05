import { Component, computed, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { profilePhotoUrl, userInitials } from '../../../../core/models/avatar';
import { Auth } from '../../../../core/services/auth';
import { ApiUser, Users } from '../../../../core/services/users';

type AuthStep = 'login' | 'register' | 'photo' | 'bio' | 'follow' | 'forgot' | 'reset';

type SuggestedProfile = {
  id: number;
  name: string;
  username: string;
  avatar: string | null;
  initials: string;
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
    private readonly route: ActivatedRoute,
    private readonly auth: Auth,
    private readonly users: Users
  ) {
    const initialStep = this.route.snapshot.data['authStep'] as AuthStep | undefined;
    const email = this.route.snapshot.queryParamMap.get('email')?.trim();
    const token = this.route.snapshot.queryParamMap.get('token')?.trim();
    const navigationMessage = this.router.getCurrentNavigation()?.extras.state?.['authMessage'];

    if (initialStep) {
      this.authStep.set(initialStep);
    }

    if (email) {
      this.forgotEmail.set(email);
      this.loginEmail.set(email);
    }

    if (token) {
      this.resetToken.set(token);
    }

    if (typeof navigationMessage === 'string') {
      this.authMessage.set(navigationMessage);
    }
  }

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
  protected readonly suggestedProfiles = signal<SuggestedProfile[]>([]);

  protected togglePasswordVisibility(): void {
    this.isPasswordVisible.update((isVisible) => !isVisible);
  }

  protected goToStep(step: AuthStep): void {
    this.authError.set(null);
    this.authMessage.set(null);
    this.authStep.set(step);

    if (step === 'login') {
      this.router.navigateByUrl('/');
    } else if (step === 'forgot') {
      this.router.navigateByUrl('/esqueci-senha');
    } else if (step === 'reset') {
      this.router.navigate(['/redefinir-senha'], {
        queryParams: { email: this.forgotEmail().trim() || null }
      });
    }

    if (step === 'follow') {
      this.loadSuggestions();
    }
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
    const profile = this.suggestedProfiles().find((item) => item.id === profileId);

    if (!profile) {
      return;
    }

    const onSuccess = (): void => {
      this.suggestedProfiles.update((profiles) =>
        profiles.map((item) => item.id === profileId ? { ...item, isFollowing: !item.isFollowing } : item)
      );
    };
    const onError = (error: unknown): void => this.handleError(error);

    if (profile.isFollowing) {
      this.users.unfollow(profileId).subscribe({
        next: onSuccess,
        error: onError
      });
      return;
    }

    this.users.follow(profileId).subscribe({
      next: onSuccess,
      error: onError
    });
  }

  protected finishOnboarding(): void {
    this.router.navigateByUrl('/home');
  }

  protected submitLogin(): void {
    const email = this.loginEmail().trim();
    const password = this.loginPassword();

    if (!email) {
      this.authError.set('Indica o email da tua conta para iniciar sessão.');
      return;
    }

    if (!password) {
      this.authError.set('Escreve a tua senha para entrares na conta.');
      return;
    }

    this.runRequest(() =>
      this.auth.login({
        email,
        password
      }).subscribe({
        next: () => this.router.navigateByUrl('/home'),
        error: (error: unknown) => this.handleError(error)
      })
    );
  }

  protected submitRegister(): void {
    const password = this.registerPassword();
    const email = this.registerEmail().trim();
    const name = this.fullName();

    if (!name) {
      this.authError.set('Preenche pelo menos o primeiro nome para criar a conta.');
      return;
    }

    if (!email) {
      this.authError.set('Indica um email válido para associares a conta.');
      return;
    }

    if (password.length < 8) {
      this.authError.set('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

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
    const email = this.forgotEmail().trim();

    if (!email) {
      this.authError.set('Escreve o email da conta para enviarmos o código de recuperação.');
      return;
    }

    this.runRequest(() =>
      this.auth.forgotPassword(email).subscribe({
        next: (response) => {
          this.forgotEmail.set(email);
          this.loginEmail.set(email);
          this.goToStep('reset');
          this.authMessage.set(response.message || 'Enviamos um código de recuperação para o teu email.');
          this.finishRequest();
        },
        error: (error: unknown) => this.handleError(error)
      })
    );
  }

  protected submitResetPassword(): void {
    const email = this.forgotEmail().trim();
    const token = this.resetToken().trim();
    const password = this.resetPassword();
    const passwordConfirmation = this.resetPasswordConfirmation();

    if (!email) {
      this.authError.set('Informa o email da conta para redefinir a senha.');
      return;
    }

    if (!token) {
      this.authError.set('Informa o código de recuperação que recebeste por email.');
      return;
    }

    if (password.length < 8) {
      this.authError.set('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (password !== passwordConfirmation) {
      this.authError.set('A confirmação da senha deve ser igual à nova senha.');
      return;
    }

    this.runRequest(() =>
      this.auth.resetPassword({
        email,
        token,
        password,
        password_confirmation: passwordConfirmation
      }).subscribe({
        next: (response) => {
          const message = response.message || 'Senha alterada com sucesso. Já podes entrar com a nova senha.';

          this.authError.set(null);
          this.authMessage.set(message);
          this.loginEmail.set(email);
          this.loginPassword.set('');
          this.resetToken.set('');
          this.resetPassword.set('');
          this.resetPasswordConfirmation.set('');
          this.authStep.set('login');
          this.router.navigateByUrl('/', {
            state: {
              authMessage: message
            }
          });
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

  private loadSuggestions(): void {
    this.users.suggestions(5).subscribe({
      next: ({ data }) => this.suggestedProfiles.set(data.map((user) => this.mapSuggestedProfile(user))),
      error: (error: unknown) => this.handleError(error)
    });
  }

  private mapSuggestedProfile(user: ApiUser): SuggestedProfile {
    return {
      id: user.id,
      name: user.name,
      username: user.username ? `@${user.username}` : `@utilizador${user.id}`,
      avatar: profilePhotoUrl(user.profile_photo),
      initials: userInitials(user.name, null, user.username),
      role: user.bio ?? 'Ainda sem biografia.',
      isFollowing: user.is_followed_by_viewer
    };
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
      return 'Não foi possível concluir a operação. Verifica a tua ligação e tenta novamente.';
    }

    const validationErrors = error.error?.errors;
    const firstValidationKey = validationErrors ? Object.keys(validationErrors)[0] : null;
    const firstValidationError = validationErrors && firstValidationKey ? validationErrors[firstValidationKey] : null;

    if (Array.isArray(firstValidationError) && firstValidationError[0]) {
      return this.validationMessage(firstValidationKey, String(firstValidationError[0]));
    }

    if (error.status === 401) {
      return 'Email ou senha incorretos. Confirma os dados e tenta novamente.';
    }

    if (error.status === 404) {
      return 'Não encontramos uma conta com estes dados.';
    }

    if (error.status === 422) {
      return 'Revê os dados preenchidos e tenta novamente.';
    }

    return error.error?.message || 'Não foi possível concluir a operação. Tenta novamente dentro de instantes.';
  }

  private validationMessage(field: string | null, fallback: string): string {
    switch (field) {
      case 'name':
        return 'Indica o teu nome para criar a conta.';
      case 'email':
        return this.authStep() === 'login'
          ? 'Indica um email válido para entrar.'
          : 'Indica um email válido. Se já existe uma conta com este email, usa a tela de login.';
      case 'password':
        return 'A senha deve ter pelo menos 8 caracteres.';
      case 'password_confirmation':
        return 'A confirmação da senha deve ser igual à nova senha.';
      case 'token':
        return 'O código de recuperação está vazio ou inválido.';
      default:
        return fallback || 'Revê os dados preenchidos e tenta novamente.';
    }
  }
}
