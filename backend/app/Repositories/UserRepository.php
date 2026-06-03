<?php

namespace App\Repositories;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class UserRepository
{
    /**
     * @param  array{name: string, username?: ?string, email: string, phone_number?: ?string, password: string, bio?: ?string, profile_photo?: ?string, privacy?: string}  $data
     */
    public function create(array $data): User
    {
        return User::create($data);
    }

    public function findByEmail(string $email): ?User
    {
        return User::query()
            ->where('email', $email)
            ->first();
    }

    public function findById(int $id): ?User
    {
        return User::query()->find($id);
    }

    /**
     * @return LengthAwarePaginator<int, User>
     */
    public function paginateFollowSuggestions(User $viewer, int $perPage, ?int $excludeUserId = null): LengthAwarePaginator
    {
        return User::query()
            ->withCount(['posts', 'followers', 'following'])
            ->whereKeyNot($viewer->id)
            ->when($excludeUserId, fn ($query) => $query->whereKeyNot($excludeUserId))
            ->whereDoesntHave('followers', fn ($query) => $query->where('users.id', $viewer->id))
            ->orderByDesc('followers_count')
            ->orderBy('name')
            ->paginate($perPage);
    }

    /**
     * @param  array{name?: string, username?: ?string, phone_number?: ?string, bio?: ?string, privacy?: string}  $data
     */
    public function updateProfile(User $user, array $data): User
    {
        $user->fill($data)->save();

        return $user->refresh();
    }

    public function updateProfilePhoto(User $user, string $path): User
    {
        $user->forceFill([
            'profile_photo' => $path,
        ])->save();

        return $user->refresh();
    }
}
