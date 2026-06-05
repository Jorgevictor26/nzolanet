import { Component, computed, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { profilePhotoUrl, userInitials } from './core/models/avatar';
import { Auth, CurrentUser } from './core/services/auth';
import { Feedback } from './core/services/feedback';
import { Preferences } from './core/services/preferences';

type NotificationItem = {
  id: number;
  title: string;
  body: string;
  time: string;
  isRead: boolean;
};

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor(
    private readonly router: Router,
    protected readonly auth: Auth,
    protected readonly feedback: Feedback,
    protected readonly prefs: Preferences
  ) {}

  protected readonly isNotificationsOpen = signal(false);
  protected readonly isProfileMenuOpen = signal(false);
  protected readonly notifications = signal<NotificationItem[]>([
    {
      id: 1,
      title: 'Nova reação',
      body: 'Sarah Chen gostou da tua publicação.',
      time: '2 min',
      isRead: false
    },
    {
      id: 2,
      title: 'Comentário recente',
      body: 'Alex Rivera comentou no teu post.',
      time: '18 min',
      isRead: false
    },
    {
      id: 3,
      title: 'Novo seguidor',
      body: 'Marcus Vane começou a seguir-te.',
      time: '1 h',
      isRead: true
    }
  ]);
  protected readonly unreadNotifications = computed(
    () => this.notifications().filter((notification) => !notification.isRead).length
  );

  protected toggleNotifications(): void {
    this.isNotificationsOpen.update((isOpen) => !isOpen);
    this.isProfileMenuOpen.set(false);
  }

  protected toggleProfileMenu(): void {
    this.isProfileMenuOpen.update((isOpen) => !isOpen);
    this.isNotificationsOpen.set(false);
  }

  protected markAllNotificationsAsRead(): void {
    this.notifications.update((notifications) =>
      notifications.map((notification) => ({ ...notification, isRead: true }))
    );
    this.feedback.show('Notificações marcadas como lidas.');
  }

  protected clearNotifications(): void {
    this.notifications.set([]);
    this.feedback.show('Notificações limpas.', 'info');
  }

  protected logout(): void {
    this.isProfileMenuOpen.set(false);
    this.auth.logout().subscribe({
      next: () => {
        this.feedback.show('Sessão terminada.');
        this.router.navigateByUrl('/');
      },
      error: () => {
        this.auth.clearSession();
        this.feedback.show('Sessão terminada localmente.', 'info');
        this.router.navigateByUrl('/');
      }
    });
  }

  protected isLoginRoute(): boolean {
    const publicAuthRoutes = ['/', '/login', '/esqueci-senha', '/redefinir-senha'];

    return publicAuthRoutes.some((route) => this.router.url === route || this.router.url.startsWith(`${route}?`));
  }

  protected currentUserPhotoUrl(user: CurrentUser | null = this.auth.currentUser()): string | null {
    return profilePhotoUrl(user?.profile_photo);
  }

  protected currentUserInitials(user: CurrentUser | null = this.auth.currentUser()): string {
    return userInitials(user?.name, user?.email, user?.username);
  }
}
