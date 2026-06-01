import { Routes } from '@angular/router';
import { Favorites } from './features/favorites/favorites';
import { Feed } from './features/feed/feed';
import { Explore } from './features/explore/explore';
import { Login } from './features/login/login';
import { Profile } from './features/profile/profile';
import { Settings } from './features/settings/settings';
import { VisitorProfile } from './features/visitor-profile/visitor-profile';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', component: Login },
  { path: 'login', redirectTo: '', pathMatch: 'full' },
  { path: 'home', component: Feed, canActivate: [authGuard] },
  { path: 'explore', component: Explore, canActivate: [authGuard] },
  { path: 'favorites', component: Favorites, canActivate: [authGuard] },
  { path: 'profile', component: Profile, canActivate: [authGuard] },
  { path: 'visitor-profile', component: VisitorProfile, canActivate: [authGuard] },
  { path: 'settings', component: Settings, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
