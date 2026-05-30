import { Routes } from '@angular/router';
import { Feed } from './features/feed/feed';
import { Profile } from './features/profile/profile';

export const routes: Routes = [
  { path: '', component: Feed },
  { path: 'profile', component: Profile },
  { path: '**', redirectTo: '' }
];
