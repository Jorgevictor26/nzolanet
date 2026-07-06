export function profilePhotoUrl(profilePhoto: string | null | undefined): string | null {
  return profilePhoto ? `/storage/${profilePhoto}` : null;
}

export function userInitials(
  name?: string | null,
  email?: string | null,
  username?: string | null,
): string {
  const source = (name || username || email || 'Utilizador').trim();
  const parts = source.replace(/@.*/, '').split(/\s+/).filter(Boolean);

  if (!parts.length) {
    return 'U';
  }
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
