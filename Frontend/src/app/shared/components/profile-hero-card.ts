import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type ProfileHeroActionVariant = 'primary' | 'secondary' | 'neutral';

@Component({
  selector: 'app-profile-hero-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="overflow-hidden rounded-[8px] bg-white shadow-sm">
      <div [class]="coverClass()">
        @if (coverUrl()) {
          <img class="h-full w-full object-cover" [src]="coverUrl()" [alt]="coverAlt()" />
        } @else {
          <div class="h-full w-full bg-[#e9eef5]"></div>
        }
        <div [class]="coverOverlayClass()"></div>
      </div>

      <div class="relative px-5 pb-5 pt-5 sm:px-7">
        @if (avatarUrl()) {
          <img class="absolute -top-14 left-5 size-24 rounded-full border-4 border-white object-cover shadow-md sm:-top-16 sm:left-7 sm:size-28" [src]="avatarUrl()" [alt]="avatarAlt()" />
        } @else {
          <span class="absolute -top-14 left-5 grid size-24 place-items-center rounded-full border-4 border-white bg-[#28334b] text-[26px] font-extrabold text-white shadow-md sm:-top-16 sm:left-7 sm:size-28 sm:text-[30px]">{{ initials() }}</span>
        }

        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="min-w-0 pt-16 sm:pl-32 sm:pt-0">
            <h1 class="text-[20px] font-bold leading-6 text-[#111827]">{{ title() }}</h1>
            <div class="mt-1 flex flex-wrap items-center gap-2">
              <p class="text-[12px] font-semibold text-[#6b7484]">{{ username() }}</p>
              @if (privacyLabel()) {
                <span [class]="privacyClass()">{{ privacyLabel() }}</span>
              }
            </div>
          </div>

          @if (actionLabel()) {
            <div class="flex items-center gap-2 sm:pt-0">
              <button [class]="actionClass()" type="button" [disabled]="actionDisabled()" (click)="action.emit()">
                {{ actionLabel() }}
              </button>
            </div>
          }
        </div>

        <p class="mt-4 max-w-[620px] text-[13px] leading-6 text-[#4b5565] sm:mt-6">
          {{ bio() }}
        </p>

        <div class="mt-5 grid max-w-[430px] grid-cols-3 gap-4 border-t border-[#edf1f6] pt-4 text-center sm:text-left">
          <div>
            <p class="text-[18px] font-bold text-[#111827]">{{ postsCount() }}</p>
            <p class="text-[9px] font-bold uppercase tracking-[0.08em] text-[#8b95a7]">{{ postsLabel() }}</p>
          </div>
          <button class="rounded-[8px] text-center hover:bg-[#f4f7fb] sm:text-left" type="button" (click)="followersClick.emit()">
            <span class="block text-[18px] font-bold text-[#111827]">{{ followersCount() }}</span>
            <span class="block text-[9px] font-bold uppercase tracking-[0.08em] text-[#8b95a7]">{{ followersLabel() }}</span>
          </button>
          <button class="rounded-[8px] text-center hover:bg-[#f4f7fb] sm:text-left" type="button" (click)="followingClick.emit()">
            <span class="block text-[18px] font-bold text-[#111827]">{{ followingCount() }}</span>
            <span class="block text-[9px] font-bold uppercase tracking-[0.08em] text-[#8b95a7]">{{ followingLabel() }}</span>
          </button>
        </div>
      </div>
    </section>
  `
})
export class ProfileHeroCard {
  readonly coverUrl = input<string | null>(null);
  readonly coverAlt = input('Capa do perfil');
  readonly coverClass = input('relative h-[190px] sm:h-[250px]');
  readonly coverOverlayClass = input('absolute inset-0 bg-gradient-to-t from-black/25 to-transparent');
  readonly avatarUrl = input<string | null>(null);
  readonly avatarAlt = input('Perfil');
  readonly initials = input.required<string>();
  readonly title = input.required<string>();
  readonly username = input.required<string>();
  readonly privacyLabel = input<string | null>(null);
  readonly privacyVariant = input<'public' | 'private'>('public');
  readonly bio = input.required<string>();
  readonly postsCount = input.required<number>();
  readonly followersCount = input.required<number>();
  readonly followingCount = input.required<number>();
  readonly postsLabel = input('Publicações');
  readonly followersLabel = input('Seguidores');
  readonly followingLabel = input('A seguir');
  readonly actionLabel = input<string | null>(null);
  readonly actionVariant = input<ProfileHeroActionVariant>('primary');
  readonly actionDisabled = input(false);

  readonly action = output<void>();
  readonly followersClick = output<void>();
  readonly followingClick = output<void>();

  protected actionClass(): string {
    const base = 'inline-flex h-9 items-center rounded-[8px] px-5 text-[12px] font-bold disabled:opacity-60';

    if (this.actionVariant() === 'secondary') {
      return `${base} bg-[#eef3ff] text-[#1f6fff] hover:bg-[#e4edff]`;
    }

    if (this.actionVariant() === 'neutral') {
      return `${base} bg-[#f4f7fb] text-[#24304c] hover:bg-[#eef3ff] hover:text-[#1f6fff]`;
    }

    return `${base} bg-[#28334b] text-white hover:bg-[#1f2944]`;
  }

  protected privacyClass(): string {
    const base = 'inline-flex h-5 items-center rounded-[6px] px-2 text-[10px] font-bold';

    return this.privacyVariant() === 'private'
      ? `${base} bg-[#fff7ed] text-[#c2410c]`
      : `${base} bg-[#ecfdf3] text-[#047857]`;
  }
}
