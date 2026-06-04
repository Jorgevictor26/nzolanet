import { Routes } from '@angular/router';
import { Favorites } from './features/favorites/favorites';
import { Feed } from './features/feed/feed';
import { Login } from './features/login/login';
import { Moderation } from './features/moderation/moderation';
import { Profile } from './features/profile/profile';
import { Settings } from './features/settings/settings';
import { VisitorProfile } from './features/visitor-profile/visitor-profile';
import { adminGuard } from './core/admin.guard';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', component: Login },
  { path: 'login', redirectTo: '', pathMatch: 'full' },
  { path: 'esqueci-senha', component: Login, data: { authStep: 'forgot' } },
  { path: 'redefinir-senha', component: Login, data: { authStep: 'reset' } },
  { path: 'home', component: Feed, canActivate: [authGuard] },
  { path: 'favorites', component: Favorites, canActivate: [authGuard] },
  { path: 'profile', component: Profile, canActivate: [authGuard] },
  { path: 'moderation', component: Moderation, canActivate: [authGuard, adminGuard] },
  { path: 'visitor-profile/:id', component: VisitorProfile, canActivate: [authGuard] },
  { path: 'visitor-profile', component: VisitorProfile, canActivate: [authGuard] },
  { path: 'settings', component: Settings, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
