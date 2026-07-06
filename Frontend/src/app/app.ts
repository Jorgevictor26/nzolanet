import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { profilePhotoUrl, userInitials } from './core/models/avatar';
import { Auth, CurrentUser } from './core/services/auth';
import { Feedback } from './core/services/feedback';
import { ApiNotification, Notifications } from './core/services/notifications';
import { Preferences } from './core/services/preferences';

type NotificationItem = {
  id: number;
  type: ApiNotification['type'];
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
export class App implements OnInit, OnDestroy {
  private pollingId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly router: Router,
    protected readonly auth: Auth,
    protected readonly feedback: Feedback,
    private readonly notificationService: Notifications,
    protected readonly prefs: Preferences
  ) {}

  protected readonly isNotificationsOpen = signal(false);
  protected readonly isProfileMenuOpen = signal(false);
  protected readonly notifications = signal<NotificationItem[]>([]);
  protected readonly notificationsError = signal<string | null>(null);
  protected readonly unreadNotifications = computed(
    () => this.notifications().filter((notification) => !notification.isRead).length
  );

  ngOnInit(): void {
    this.loadNotifications();
    this.pollingId = setInterval(() => this.loadNotifications(), 15000);
  }

  ngOnDestroy(): void {
    if (this.pollingId) {
      clearInterval(this.pollingId);
    }
  }

  protected toggleNotifications(): void {
    this.isNotificationsOpen.update((isOpen) => !isOpen);
    this.isProfileMenuOpen.set(false);
    this.loadNotifications();
  }

  protected toggleProfileMenu(): void {
    this.isProfileMenuOpen.update((isOpen) => !isOpen);
    this.isNotificationsOpen.set(false);
  }

  protected markAllNotificationsAsRead(): void {
    if (!this.auth.isAuthenticated()) {
      return;
    }

    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update((notifications) =>
          notifications.map((notification) => ({ ...notification, isRead: true }))
        );
        this.feedback.show('Notificações marcadas como lidas.');
      },
      error: () => this.notificationsError.set('Não foi possível marcar as notificações como lidas.')
    });
  }

  protected clearNotifications(): void {
    if (!this.auth.isAuthenticated()) {
      return;
    }

    this.notificationService.clear().subscribe({
      next: () => {
        this.notifications.set([]);
        this.feedback.show('Notificações limpas.', 'info');
      },
      error: () => this.notificationsError.set('Não foi possível limpar as notificações.')
    });
  }

  protected logout(): void {
    this.isProfileMenuOpen.set(false);
    this.auth.logout().subscribe({
      next: () => {
        this.notifications.set([]);
        this.feedback.show('Sessão terminada.');
        this.router.navigateByUrl('/');
      },
      error: () => {
        this.auth.clearSession();
        this.notifications.set([]);
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

  private loadNotifications(): void {
    if (!this.auth.isAuthenticated()) {
      this.notifications.set([]);
      return;
    }

    this.notificationService.list().subscribe({
      next: ({ data }) => {
        this.notifications.set(data.map((notification) => this.mapNotification(notification)));
        this.notificationsError.set(null);
      },
      error: () => this.notificationsError.set('Não foi possível carregar as notificações.')
    });
  }

  private mapNotification(notification: ApiNotification): NotificationItem {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      time: this.relativeTime(notification.created_at),
      isRead: notification.is_read
    };
  }

  private relativeTime(value: string): string {
    const createdAt = new Date(value).getTime();

    if (Number.isNaN(createdAt)) {
      return 'Agora';
    }

    const seconds = Math.max(0, Math.floor((Date.now() - createdAt) / 1000));
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}min`;

    return 'Agora';
  }
}
