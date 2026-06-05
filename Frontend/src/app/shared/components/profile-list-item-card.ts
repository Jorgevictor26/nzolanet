import { Component, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';

export type ProfileListItemViewModel = {
  id: number;
  name: string;
  username: string;
  avatar: string | null;
  initials: string;
  bio: string;
  isFollowing: boolean;
};

@Component({
  selector: 'app-profile-list-item-card',
  imports: [NgTemplateOutlet, RouterLink],
  template: `
    <article [class]="compact() ? compactClass : fullClass">
      @if (profileLink(); as link) {
        <a class="shrink-0" [routerLink]="link" [attr.aria-label]="'Ver perfil de ' + profile().name">
          <ng-container [ngTemplateOutlet]="avatar"></ng-container>
        </a>
      } @else {
        <ng-container [ngTemplateOutlet]="avatar"></ng-container>
      }

      @if (profileLink(); as link) {
        <a class="min-w-0 flex-1" [routerLink]="link">
          <ng-container [ngTemplateOutlet]="identity"></ng-container>
        </a>
      } @else {
        <div class="min-w-0 flex-1">
          <ng-container [ngTemplateOutlet]="identity"></ng-container>
        </div>
      }

      <button [class]="buttonClass()" type="button" (click)="followToggle.emit(profile().id)">
        {{ actionLabel() }}
      </button>
    </article>

    <ng-template #avatar>
      @if (profile().avatar) {
        <img [class]="compact() ? 'size-9 rounded-full object-cover' : 'size-11 rounded-full object-cover'" [src]="profile().avatar" [alt]="profile().name" />
      } @else {
        <span [class]="compact() ? 'grid size-9 shrink-0 place-items-center rounded-full bg-[#28334b] text-[11px] font-extrabold text-white' : 'grid size-11 shrink-0 place-items-center rounded-full bg-[#28334b] text-[12px] font-extrabold text-white'">
          {{ profile().initials }}
        </span>
      }
    </ng-template>

    <ng-template #identity>
      <h3 [class]="compact() ? 'truncate text-[12px] font-bold leading-4 text-[#111827]' : 'truncate text-[12px] font-bold text-[#111827]'">{{ profile().name }}</h3>
      @if (compact()) {
        <p class="truncate text-[10px] text-[#778295]">{{ profile().username }}</p>
      } @else {
        <p class="truncate text-[10px] text-[#667085]">{{ profile().username }} &middot; {{ profile().bio }}</p>
      }
    </ng-template>
  `
})
export class ProfileListItemCard {
  protected readonly compactClass = 'flex items-center gap-3 rounded-[8px] px-2 py-2 hover:bg-[#f4f7fb]';
  protected readonly fullClass = 'flex items-center gap-3 rounded-[8px] px-2 py-3 hover:bg-[#f4f7fb]';

  readonly profile = input.required<ProfileListItemViewModel>();
  readonly actionLabel = input.required<string>();
  readonly compact = input(false);
  readonly profileLink = input<string | unknown[] | null>(null);
  readonly variant = input<'primary' | 'secondary' | 'muted'>('primary');
  readonly followToggle = output<number>();

  protected buttonClass(): string {
    const shape = this.compact() ? 'h-8 rounded-full px-5 text-[12px]' : 'h-8 rounded-[8px] px-3 text-[10px]';
    const base = `${shape} font-bold`;

    if (this.variant() === 'secondary') {
      return `${base} bg-[#eef3ff] text-[#1f6fff] hover:bg-[#e4edff]`;
    }

    if (this.variant() === 'muted') {
      return `${base} bg-[#f4f7fb] text-[#667085]`;
    }

    return `${base} bg-[#28334b] text-white hover:bg-[#1f2944]`;
  }
}
