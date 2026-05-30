import { Routes } from '@angular/router';
import { Favorites } from './features/favorites/favorites';
import { Feed } from './features/feed/feed';
import { Explore } from './features/explore/explore';
import { Login } from './features/login/login';
import { Profile } from './features/profile/profile';
import { Settings } from './features/settings/settings';
import { VisitorProfile } from './features/visitor-profile/visitor-profile';

export const routes: Routes = [
  { path: '', component: Login },
  { path: 'login', redirectTo: '', pathMatch: 'full' },
  { path: 'home', component: Feed },
  { path: 'explore', component: Explore },
  { path: 'favorites', component: Favorites },
  { path: 'profile', component: Profile },
  { path: 'visitor-profile', component: VisitorProfile },
  { path: 'settings', component: Settings },
  { path: '**', redirectTo: '' }
];
