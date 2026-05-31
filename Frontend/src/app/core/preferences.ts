import { Injectable, signal } from '@angular/core';

export type LanguageCode = 'pt' | 'en';

const STORAGE_THEME_KEY = 'nzolanet-theme';
const STORAGE_LANGUAGE_KEY = 'nzolanet-language';

const translations: Record<LanguageCode, Record<string, string>> = {
  pt: {
    search: 'Pesquisar no NzolaNet',
    notifications: 'Notificações',
    newUpdates: 'novas atualizações',
    markRead: 'Marcar lidas',
    clear: 'Limpar',
    new: 'Nova',
    noNotifications: 'Sem notificações',
    allClean: 'Tudo limpo por aqui.',
    viewProfile: 'Ver perfil',
    logout: 'Sair',
    home: 'Página Inicial',
    explore: 'Explorar',
    favorites: 'Favoritos',
    profile: 'Perfil',
    settings: 'Definições',
    terms: 'Termos de Serviço',
    privacy: 'Política de Privacidade',
    cookies: 'Política de Cookies',
    ads: 'Info de Anúncios',
    moreCopyright: 'Mais... © 2024 NzolaNet Corp.',
    recentCommunity: 'Conteúdos recentes da comunidade.',
    filterExplore: 'Filtrar explorar',
    savedPosts: 'Publicações guardadas para veres mais tarde.',
    backToFeed: 'Voltar ao feed',
    savedNow: 'guardado agora',
    removeFavorite: 'Remover dos favoritos',
    collections: 'Coleções',
    all: 'Todos',
    work: 'Trabalho',
    inspiration: 'Inspiração',
    nothingSaved: 'Ainda não guardaste nada',
    saveHint: 'Quando tocares no ícone de favorito numa publicação, ela aparece aqui.',
    exploreFeed: 'Explorar feed',
    settingsTitle: 'Definições',
    settingsSubtitle: 'Gerencia segurança, aparência, idioma e documentos da plataforma.',
    security: 'Segurança',
    changePassword: 'Trocar senha',
    currentPassword: 'Senha atual',
    newPassword: 'Nova senha',
    confirmPassword: 'Confirmar senha',
    updatePassword: 'Atualizar senha',
    appearance: 'Aparência',
    lightMode: 'Modo claro',
    darkMode: 'Modo escuro',
    language: 'Idioma',
    portuguese: 'Português',
    english: 'Inglês',
    legal: 'Políticas e termos',
    privacyTerms: 'Termos de privacidade',
    termsBody: 'A NzolaNet protege os teus dados, limita o uso indevido das informações e oferece controlo sobre a tua conta.',
    serviceTermsBody: 'Ao usar a plataforma, concordas em respeitar a comunidade, publicar conteúdo próprio e cumprir as regras locais.',
    cookiesBody: 'Usamos cookies para manter a sessão, melhorar a experiência e medir funcionalidades essenciais.',
    saveChanges: 'Guardar alterações',
    active: 'Ativo',
    editProfile: 'Editar Perfil',
    posts: 'Posts',
    photos: 'Fotos',
    videos: 'Vídeos',
    tagged: 'Marcados',
    suggestionsForYou: 'Sugestões para ti',
    seeAll: 'Ver todos',
    follow: 'Seguir',
    following: 'Seguindo',
    recentActivity: 'Atividade recente',
    publicAccount: 'Conta Pública',
    cancel: 'Cancelar',
    saveProfile: 'Salvar Alterações'
  },
  en: {
    search: 'Search on NzolaNet',
    notifications: 'Notifications',
    newUpdates: 'new updates',
    markRead: 'Mark as read',
    clear: 'Clear',
    new: 'New',
    noNotifications: 'No notifications',
    allClean: 'Everything is clear here.',
    viewProfile: 'View profile',
    logout: 'Log out',
    home: 'Home',
    explore: 'Explore',
    favorites: 'Favorites',
    profile: 'Profile',
    settings: 'Settings',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    cookies: 'Cookie Policy',
    ads: 'Ads Info',
    moreCopyright: 'More... © 2024 NzolaNet Corp.',
    recentCommunity: 'Recent content from the community.',
    filterExplore: 'Filter explore',
    savedPosts: 'Saved posts to view later.',
    backToFeed: 'Back to feed',
    savedNow: 'saved now',
    removeFavorite: 'Remove from favorites',
    collections: 'Collections',
    all: 'All',
    work: 'Work',
    inspiration: 'Inspiration',
    nothingSaved: 'You have not saved anything yet',
    saveHint: 'When you tap the favorite icon on a post, it appears here.',
    exploreFeed: 'Explore feed',
    settingsTitle: 'Settings',
    settingsSubtitle: 'Manage security, appearance, language and platform documents.',
    security: 'Security',
    changePassword: 'Change password',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm password',
    updatePassword: 'Update password',
    appearance: 'Appearance',
    lightMode: 'Light mode',
    darkMode: 'Dark mode',
    language: 'Language',
    portuguese: 'Portuguese',
    english: 'English',
    legal: 'Policies and terms',
    privacyTerms: 'Privacy terms',
    termsBody: 'NzolaNet protects your data, limits misuse of information and gives you control over your account.',
    serviceTermsBody: 'By using the platform, you agree to respect the community, publish your own content and follow local rules.',
    cookiesBody: 'We use cookies to keep your session, improve the experience and measure essential features.',
    saveChanges: 'Save changes',
    active: 'Active',
    editProfile: 'Edit Profile',
    posts: 'Posts',
    photos: 'Photos',
    videos: 'Videos',
    tagged: 'Tagged',
    suggestionsForYou: 'Suggestions for you',
    seeAll: 'See all',
    follow: 'Follow',
    following: 'Following',
    recentActivity: 'Recent activity',
    publicAccount: 'Public Account',
    cancel: 'Cancel',
    saveProfile: 'Save Changes'
  }
};

@Injectable({
  providedIn: 'root'
})
export class Preferences {
  readonly language = signal<LanguageCode>(this.readLanguage());
  readonly isDarkMode = signal(this.readTheme() === 'dark');

  t(key: string): string {
    return translations[this.language()][key] ?? translations.pt[key] ?? key;
  }

  setLanguage(language: LanguageCode): void {
    this.language.set(language);
    this.writeStorage(STORAGE_LANGUAGE_KEY, language);
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.isDarkMode.set(theme === 'dark');
    this.writeStorage(STORAGE_THEME_KEY, theme);
  }

  toggleTheme(): void {
    this.setTheme(this.isDarkMode() ? 'light' : 'dark');
  }

  private readLanguage(): LanguageCode {
    const value = this.readStorage(STORAGE_LANGUAGE_KEY);
    return value === 'en' ? 'en' : 'pt';
  }

  private readTheme(): 'light' | 'dark' {
    return this.readStorage(STORAGE_THEME_KEY) === 'dark' ? 'dark' : 'light';
  }

  private readStorage(key: string): string | null {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  }

  private writeStorage(key: string, value: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  }
}
