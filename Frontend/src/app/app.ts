import { Component, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

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
  protected readonly isNotificationsOpen = signal(false);
  protected readonly notifications = signal<NotificationItem[]>([
    {
      id: 1,
      title: 'Nova reacao',
      body: 'Sarah Chen gostou da tua publicacao.',
      time: '2 min',
      isRead: false
    },
    {
      id: 2,
      title: 'Comentario recente',
      body: 'Alex Rivera comentou no teu post.',
      time: '18 min',
      isRead: false
    },
    {
      id: 3,
      title: 'Novo seguidor',
      body: 'Marcus Vane comecou a seguir-te.',
      time: '1 h',
      isRead: true
    }
  ]);
  protected readonly unreadNotifications = computed(
    () => this.notifications().filter((notification) => !notification.isRead).length
  );

  protected toggleNotifications(): void {
    this.isNotificationsOpen.update((isOpen) => !isOpen);
  }

  protected markAllNotificationsAsRead(): void {
    this.notifications.update((notifications) =>
      notifications.map((notification) => ({ ...notification, isRead: true }))
    );
  }

  protected clearNotifications(): void {
    this.notifications.set([]);
  }
}
