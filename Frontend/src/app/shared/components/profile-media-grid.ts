import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type ProfileMediaGridItem = {
  id: number;
  text: string;
  image?: string;
  video?: string;
  alt: string;
};

@Component({
  selector: 'app-profile-media-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isLoading()) {
      <section class="mt-5 rounded-[8px] bg-white p-5 text-[13px] font-semibold text-[#667085] shadow-sm">
        {{ loadingText() }}
      </section>
    } @else if (!items().length) {
      <section class="mt-5 rounded-[8px] bg-white p-5 text-[13px] font-semibold text-[#667085] shadow-sm">
        {{ emptyText() }}
      </section>
    } @else {
      <div class="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        @for (item of items(); track item.id) {
          <article class="group relative min-h-[180px] cursor-pointer overflow-hidden rounded-[8px] bg-white shadow-sm transition hover:shadow-md" role="button" tabindex="0" (click)="itemOpen.emit(item.id)" (keydown.enter)="itemOpen.emit(item.id)" (keydown.space)="$event.preventDefault(); itemOpen.emit(item.id)">
            @if (item.image) {
              <img class="h-full min-h-[180px] w-full object-cover" [src]="item.image" [alt]="item.alt" />
            } @else if (item.video) {
              <video class="h-full min-h-[180px] w-full bg-black object-cover" [src]="item.video" controls></video>
              <span class="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-white text-[#28334b] shadow-sm">
                <svg class="size-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5Z" /></svg>
              </span>
            } @else {
              <div class="flex h-full min-h-[180px] items-center p-4">
                <p class="line-clamp-6 text-[13px] font-semibold leading-5 text-[#24304c]">{{ item.text }}</p>
              </div>
            }
            <span class="pointer-events-none absolute inset-0 bg-[#111827]/0 transition group-hover:bg-[#111827]/10"></span>
          </article>
        }
      </div>
    }
  `
})
export class ProfileMediaGrid {
  readonly items = input.required<ProfileMediaGridItem[]>();
  readonly isLoading = input(false);
  readonly loadingText = input('A carregar publicações...');
  readonly emptyText = input('Ainda não há publicações nesta secção.');
  readonly itemOpen = output<number>();
}
