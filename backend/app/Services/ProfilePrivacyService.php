<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;

class ProfilePrivacyService
{
    public function ensureCanViewProfile(User $viewer, User $profile): void
    {
        if (! $this->canViewProfile($viewer, $profile)) {
            throw new AuthorizationException('Este perfil é privado.');
        }
    }

    public function canViewProfile(User $viewer, User $profile): bool
    {
        if ($profile->privacy !== 'private') {
            return true;
        }

        if ($viewer->id === $profile->id) {
            return true;
        }

        if ($this->isAdmin($viewer)) {
            return true;
        }

        return $profile->followers()
            ->where('users.id', $viewer->id)
            ->exists();
    }

    private function isAdmin(User $user): bool
    {
        $email = strtolower(trim((string) $user->email));
        $username = strtolower(trim((string) $user->username));

        return (bool) $user->is_admin
            || in_array($email, ['admin@nzolanet.com'], true)
            || in_array($username, ['admin', 'administrador'], true);
    }
}
