import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

const loginPage = () => import('./features/auth/login/pages/login').then((m) => m.Login);
const feedPage = () => import('./features/user/feed/pages/feed').then((m) => m.Feed);
const favoritesPage = () =>
  import('./features/user/favorites/pages/favorites').then((m) => m.Favorites);
const profilePage = () => import('./features/user/profile/pages/profile').then((m) => m.Profile);
const visitorProfilePage = () =>
  import('./features/user/visitor-profile/pages/visitor-profile').then((m) => m.VisitorProfile);
const settingsPage = () => import('./features/user/settings/pages/settings').then((m) => m.Settings);
const moderationPage = () =>
  import('./features/admin/moderation/pages/moderation').then((m) => m.Moderation);

export const routes: Routes = [
  { path: '', loadComponent: loginPage },
  { path: 'login', redirectTo: '', pathMatch: 'full' },
  { path: 'esqueci-senha', loadComponent: loginPage, data: { authStep: 'forgot' } },
  { path: 'redefinir-senha', loadComponent: loginPage, data: { authStep: 'reset' } },
  { path: 'home', loadComponent: feedPage, canActivate: [authGuard] },
  { path: 'favorites', loadComponent: favoritesPage, canActivate: [authGuard] },
  { path: 'profile', loadComponent: profilePage, canActivate: [authGuard] },
  { path: 'moderation', loadComponent: moderationPage, canActivate: [authGuard, adminGuard] },
  { path: 'visitor-profile/:id', loadComponent: visitorProfilePage, canActivate: [authGuard] },
  { path: 'visitor-profile', loadComponent: visitorProfilePage, canActivate: [authGuard] },
  { path: 'settings', loadComponent: settingsPage, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
