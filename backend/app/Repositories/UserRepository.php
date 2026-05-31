<?php

namespace App\Repositories;

use App\Models\User;
use Illuminate\Support\Str;

class UserRepository
{
    /**
     * @param  array{name: string, email: string, password: string, bio?: ?string, profile_photo?: ?string, privacy?: string}  $data
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
     * @param  array{name?: string, bio?: ?string, privacy?: string}  $data
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

    public function updatePassword(User $user, string $hashedPassword): User
    {
        $user->forceFill([
            'password' => $hashedPassword,
            'remember_token' => Str::random(60),
        ])->save();

        return $user;
    }
}
