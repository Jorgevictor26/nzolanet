import { Component, computed, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Preferences } from './core/preferences';

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
  }

  protected clearNotifications(): void {
    this.notifications.set([]);
  }

  protected logout(): void {
    this.isProfileMenuOpen.set(false);
    this.router.navigateByUrl('/');
  }

  protected isLoginRoute(): boolean {
    return this.router.url === '/' || this.router.url.startsWith('/login');
  }
}
