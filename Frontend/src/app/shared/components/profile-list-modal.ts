import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ProfileListItemCard, ProfileListItemViewModel } from './profile-list-item-card';
import { ProfileListModal } from '../profile/profile-view-models';

@Component({
  selector: 'app-profile-list-modal',
  imports: [ProfileListItemCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (activeModal()) {
      <div class="fixed inset-0 z-50 grid place-items-center bg-[#0f172a]/35 p-3 sm:p-4" (click)="close.emit()">
        <section class="flex max-h-[calc(100dvh-24px)] w-full max-w-[440px] flex-col overflow-hidden rounded-[8px] bg-white shadow-2xl" role="dialog" aria-modal="true" (click)="$event.stopPropagation()">
          <header class="flex h-12 shrink-0 items-center justify-between border-b border-[#eef1f6] px-4">
            <h2 class="text-[14px] font-bold text-[#111827]">{{ activeModal() === 'followers' ? followersTitle() : followingTitle() }}</h2>
            <button class="grid size-8 place-items-center rounded-full text-[#1f2944] hover:bg-[#f5f7fb]" type="button" aria-label="Fechar modal" (click)="close.emit()">
              <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </header>

          <div class="min-h-0 flex-1 overflow-y-auto p-3">
            @if (activeModal() === 'followers') {
              @for (profile of followers(); track profile.id) {
                <app-profile-list-item-card
                  [profile]="profile"
                  [profileLink]="profileLink(profile.id)"
                  [actionLabel]="profile.isFollowing ? followingLabel() : followBackLabel()"
                  [variant]="profile.isFollowing ? 'secondary' : 'primary'"
                  (followToggle)="followersToggle.emit($event)"
                />
              } @empty {
                <p class="rounded-[8px] bg-[#f8fafc] px-3 py-4 text-center text-[12px] font-semibold text-[#8b95a7]">{{ followersEmptyText() }}</p>
              }
            } @else {
              @for (profile of following(); track profile.id) {
                <app-profile-list-item-card
                  [profile]="profile"
                  [profileLink]="profileLink(profile.id)"
                  [actionLabel]="profile.isFollowing ? unfollowLabel() : removedLabel()"
                  [variant]="profile.isFollowing ? 'secondary' : 'muted'"
                  (followToggle)="followingToggle.emit($event)"
                />
              } @empty {
                <p class="rounded-[8px] bg-[#f8fafc] px-3 py-4 text-center text-[12px] font-semibold text-[#8b95a7]">{{ followingEmptyText() }}</p>
              }
            }
          </div>
        </section>
      </div>
    }
  `
})
export class ProfileListModalComponent {
  readonly activeModal = input.required<ProfileListModal>();
  readonly followers = input.required<ProfileListItemViewModel[]>();
  readonly following = input.required<ProfileListItemViewModel[]>();
  readonly followersTitle = input('Seguidores');
  readonly followingTitle = input('A seguir');
  readonly followingLabel = input('A seguir');
  readonly followBackLabel = input('Seguir de volta');
  readonly unfollowLabel = input('Deixar de seguir');
  readonly removedLabel = input('Removido');
  readonly followersEmptyText = input('Ainda não há seguidores.');
  readonly followingEmptyText = input('Ainda não segue ninguém.');
  readonly currentUserId = input<number | null | undefined>(null);

  readonly close = output<void>();
  readonly followersToggle = output<number>();
  readonly followingToggle = output<number>();

  protected profileLink(profileId: number): unknown[] {
    return profileId === this.currentUserId() ? ['/profile'] : ['/visitor-profile', profileId];
  }
}
