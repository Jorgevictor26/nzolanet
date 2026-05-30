import { Component } from '@angular/core';
import { Preferences } from '../../core/preferences';

type ExploreItem = {
  id: number;
  title: string;
  image: string;
  author: string;
  kind: 'image' | 'video' | 'album';
  className: string;
};

@Component({
  selector: 'app-explore',
  imports: [],
  templateUrl: './explore.html'
})
export class Explore {
  constructor(protected readonly prefs: Preferences) {}

  protected readonly exploreItems: ExploreItem[] = [
    {
      id: 1,
      title: 'Mudei',
      image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85',
      author: '@andrebento',
      kind: 'image',
      className: 'md:col-span-2 md:row-span-1'
    },
    {
      id: 2,
      title: 'Noite de festa',
      image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=85',
      author: '@maria.events',
      kind: 'album',
      className: 'md:col-span-2 md:row-span-1'
    },
    {
      id: 3,
      title: 'Corte fresco',
      image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=900&q=85',
      author: '@barberlife',
      kind: 'image',
      className: 'md:col-span-2 md:row-span-2'
    },
    {
      id: 4,
      title: 'Selfie do dia',
      image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85',
      author: '@casalnz',
      kind: 'album',
      className: 'md:col-span-2 md:row-span-1'
    },
    {
      id: 5,
      title: 'Primeiro banho',
      image: 'https://images.unsplash.com/photo-1546015720-b8b30df5aa27?auto=format&fit=crop&w=900&q=85',
      author: '@familiafeliz',
      kind: 'video',
      className: 'md:col-span-2 md:row-span-1'
    },
    {
      id: 6,
      title: 'Moda urbana',
      image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85',
      author: '@stylehub',
      kind: 'image',
      className: 'md:col-span-2 md:row-span-1'
    }
  ];
}
