import { ProfileListItemViewModel } from '../components/profile-list-item-card';
import { ProfileMediaGridItem } from '../components/profile-media-grid';

export type ProfileListModal = 'followers' | 'following' | null;
export type ProfileContentFilter = 'posts' | 'photos' | 'videos';

export type ProfileMediaItem = ProfileMediaGridItem & {
  kind: ProfileContentFilter;
  likesCount: number;
  commentsCount: number;
  time: string;
};

export type ProfileComment = {
  id: number;
  author: string;
  avatar: string | null;
  initials: string;
  text: string;
  time: string;
};

export type ProfileUserSummary = {
  id?: number;
  name?: string | null;
  email?: string | null;
  username?: string | null;
  bio?: string | null;
  profile_photo?: string | null;
  cover_photo?: string | null;
};

export type ProfileSuggestion = ProfileListItemViewModel;
