import { Routes } from '@angular/router';
import { Favorites } from './features/favorites/favorites';
import { Feed } from './features/feed/feed';
import { Profile } from './features/profile/profile';

export const routes: Routes = [
  { path: '', component: Feed },
  { path: 'favorites', component: Favorites },
  { path: 'profile', component: Profile },
  { path: '**', redirectTo: '' }
];
