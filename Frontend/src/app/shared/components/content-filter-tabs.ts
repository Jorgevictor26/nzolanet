import { Component, input, output } from '@angular/core';

export type ContentFilterValue = string;

export type ContentFilterTab = {
  value: ContentFilterValue;
  label: string;
};

@Component({
  selector: 'app-content-filter-tabs',
  template: `
    <div class="grid grid-cols-3 rounded-[8px] bg-white px-2 text-[12px] font-bold text-[#b2bbca] shadow-sm sm:px-5">
      @for (tab of tabs(); track tab.value) {
        <button
          [class]="activeFilter() === tab.value ? 'relative h-11 text-[#1f6fff]' : 'relative h-11 hover:text-[#1f6fff]'"
          type="button"
          (click)="filterChange.emit(tab.value)"
        >
          {{ tab.label }}
          @if (activeFilter() === tab.value) {
            <span class="absolute bottom-0 left-1/2 h-0.5 w-24 max-w-[80%] -translate-x-1/2 rounded-full bg-[#1f6fff]"></span>
          }
        </button>
      }
    </div>
  `
})
export class ContentFilterTabs {
  readonly activeFilter = input.required<ContentFilterValue>();
  readonly tabs = input.required<ContentFilterTab[]>();
  readonly filterChange = output<ContentFilterValue>();
}
