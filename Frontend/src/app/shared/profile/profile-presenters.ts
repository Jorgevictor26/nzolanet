import { HttpErrorResponse } from '@angular/common/http';
import { ApiComment, ApiPost } from '../../core/services/posts';
import { ApiUser } from '../../core/services/users';
import { profilePhotoUrl, userInitials } from '../../core/models/avatar';
import { ProfileListItemViewModel } from '../components/profile-list-item-card';
import { ProfileComment, ProfileMediaItem, ProfileUserSummary } from './profile-view-models';

export function profileAvatarUrl(user: ProfileUserSummary | null | undefined): string {
  return profilePhotoUrl(user?.profile_photo) ?? '';
}

export function hasProfileAvatar(user: ProfileUserSummary | null | undefined): boolean {
  return Boolean(profilePhotoUrl(user?.profile_photo));
}

export function profileInitials(user: ProfileUserSummary | null | undefined): string {
  return userInitials(user?.name, user?.email ?? null, user?.username);
}

export function profileCoverUrl(user: ProfileUserSummary | null | undefined): string | null {
  return user?.cover_photo ? `/storage/${user.cover_photo}` : null;
}

export function profileUsername(user: ProfileUserSummary | null | undefined): string {
  if (user?.username) {
    return `@${user.username}`;
  }

  if (user?.email) {
    return `@${user.email.split('@')[0]}`;
  }

  return user?.id ? `@utilizador${user.id}` : '@utilizador';
}

export function mapUserToProfileListItem(user: ApiUser): ProfileListItemViewModel {
  return {
    id: user.id,
    name: user.name,
    username: profileUsername(user),
    avatar: profilePhotoUrl(user.profile_photo),
    initials: userInitials(user.name, null, user.username),
    bio: user.bio ?? 'Ainda sem biografia.',
    isFollowing: user.is_followed_by_viewer
  };
}

export function mapPostToProfileMediaItem(post: ApiPost): ProfileMediaItem {
  return {
    id: post.id,
    kind: post.video ? 'videos' : post.image ? 'photos' : 'posts',
    text: post.content,
    image: post.image ? `/storage/${post.image}` : undefined,
    video: post.video ? `/storage/${post.video}` : undefined,
    likesCount: post.likes_count,
    commentsCount: post.comments_count,
    time: relativeTime(post.created_at),
    alt: `Publicação de ${post.author.name ?? 'utilizador'}`
  };
}

export function mapCommentToProfileComment(comment: ApiComment): ProfileComment {
  return {
    id: comment.id,
    author: comment.author.name ?? 'Utilizador',
    avatar: profilePhotoUrl(comment.author.profile_photo),
    initials: userInitials(comment.author.name, null, null),
    text: comment.content,
    time: relativeTime(comment.created_at)
  };
}

export function relativeTime(value: string): string {
  const createdAt = new Date(value).getTime();

  if (Number.isNaN(createdAt)) {
    return 'Agora';
  }

  const seconds = Math.max(0, Math.floor((Date.now() - createdAt) / 1000));
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d atras`;
  if (hours > 0) return `${hours}h atras`;
  if (minutes > 0) return `${minutes}min atras`;

  return 'Agora';
}

export function httpErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Não foi possível concluir a operação. Verifica a tua ligação e tenta novamente.';
  }

  const validationErrors = error.error?.errors;
  const firstValidationKey = validationErrors ? Object.keys(validationErrors)[0] : null;
  const firstValidationError = validationErrors && firstValidationKey ? validationErrors[firstValidationKey] : null;

  if (Array.isArray(firstValidationError) && firstValidationError[0]) {
    return validationErrorMessage(firstValidationKey, String(firstValidationError[0]));
  }

  if (error.status === 401) {
    return 'A tua sessão terminou. Entra novamente para continuar.';
  }

  if (error.status === 403) {
    return 'Não tens permissão para ver ou alterar este conteúdo.';
  }

  if (error.status === 404) {
    return 'Não encontramos este conteúdo. Ele pode ter sido removido.';
  }

  if (error.status === 413) {
    return 'O ficheiro é demasiado grande. Escolhe um ficheiro menor e tenta novamente.';
  }

  if (error.status === 422) {
    return 'Revê os dados preenchidos. Alguns campos precisam de correção.';
  }

  if (error.status >= 500) {
    return 'O servidor não conseguiu responder agora. Tenta novamente dentro de instantes.';
  }

  const apiMessage = typeof error.error?.message === 'string' ? error.error.message : null;

  if (apiMessage && !looksLikeTechnicalMessage(apiMessage)) {
    return apiMessage;
  }

  return 'Não foi possível concluir a operação. Tenta novamente.';
}

function validationErrorMessage(field: string | null, fallback: string): string {
  switch (field) {
    case 'name':
      return 'Indica o nome do perfil.';
    case 'username':
      return 'O nome de utilizador só pode ter letras, números, ponto e sublinhado.';
    case 'email':
      return 'Indica um email válido.';
    case 'phone_number':
      return 'Indica um número de telefone válido ou deixa o campo vazio.';
    case 'bio':
      return 'A biografia está demasiado longa.';
    case 'privacy':
      return 'Escolhe se o perfil será público ou privado.';
    case 'profile_photo_file':
    case 'photo':
      return 'Escolhe uma foto válida em JPG, PNG ou WEBP com até 4MB.';
    case 'cover_photo_file':
      return 'Escolhe uma capa válida em JPG, PNG ou WEBP com até 4MB.';
    case 'content':
      return 'Escreve algum texto antes de publicar.';
    case 'image':
      return 'Escolhe uma imagem válida para a publicação.';
    case 'video':
      return 'Escolhe um vídeo válido para a publicação.';
    case 'password':
      return 'A senha deve ter pelo menos 8 caracteres.';
    case 'password_confirmation':
      return 'A confirmação da senha deve ser igual à nova senha.';
    case 'token':
      return 'O código de recuperação está vazio ou inválido.';
    default:
      return looksLikeTechnicalMessage(fallback) ? 'Revê os dados preenchidos e tenta novamente.' : fallback;
  }
}

function looksLikeTechnicalMessage(message: string): boolean {
  return /^(Failed|The |SQLSTATE|HTTP|Undefined|Call to|No query results|Server Error)/i.test(message);
}
