import { Routes } from '@angular/router';
import { Login } from './features/auth/login/pages/login';
import { Moderation } from './features/admin/moderation/pages/moderation';
import { Favorites } from './features/user/favorites/pages/favorites';
import { Feed } from './features/user/feed/pages/feed';
import { Profile } from './features/user/profile/pages/profile';
import { Settings } from './features/user/settings/pages/settings';
import { VisitorProfile } from './features/user/visitor-profile/pages/visitor-profile';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

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
