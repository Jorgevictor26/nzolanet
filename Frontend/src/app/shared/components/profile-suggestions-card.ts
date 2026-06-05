import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ProfileListItemCard, ProfileListItemViewModel } from './profile-list-item-card';

@Component({
  selector: 'app-profile-suggestions-card',
  imports: [ProfileListItemCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded-[8px] border border-[#dfe6f0] bg-white p-5 shadow-sm">
      <h2 class="mb-4 text-[15px] font-bold text-[#111827]">{{ title() }}</h2>

      <div class="space-y-4">
        @for (profile of profiles(); track profile.id) {
          <app-profile-list-item-card
            [profile]="profile"
            [compact]="true"
            [profileLink]="['/visitor-profile', profile.id]"
            [actionLabel]="profile.isFollowing ? followingLabel() : followLabel()"
            [variant]="profile.isFollowing ? 'secondary' : 'primary'"
            (followToggle)="followToggle.emit($event)"
          />
        } @empty {
          <p class="text-[12px] font-semibold text-[#778295]">{{ emptyText() }}</p>
        }
      </div>

      <button class="mt-5 rounded-[6px] px-2 py-1 text-[14px] font-normal text-[#1f6fff] hover:bg-[#eef3ff]" type="button">
        {{ showMoreLabel() }}
      </button>
    </section>
  `
})
export class ProfileSuggestionsCard {
  readonly title = input.required<string>();
  readonly profiles = input.required<ProfileListItemViewModel[]>();
  readonly followLabel = input.required<string>();
  readonly followingLabel = input.required<string>();
  readonly showMoreLabel = input.required<string>();
  readonly emptyText = input('Sem sugestões disponíveis.');
  readonly followToggle = output<number>();
}
