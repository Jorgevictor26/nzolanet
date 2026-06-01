<?php

namespace App\Services;

use App\DTOs\ChangeProfilePhotoDTO;
use App\DTOs\CurrentUserDTO;
use App\DTOs\UpdateProfileDTO;
use App\DTOs\UserDTO;
use App\Models\User;
use App\Repositories\UserRepository;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Storage;

class UserService
{
    public function __construct(
        private readonly UserRepository $users,
    ) {}

    public function getProfile(int $id, User $viewer): UserDTO
    {
        $profile = $this->users->findById($id);

        if (! $profile) {
            throw (new ModelNotFoundException)->setModel(User::class, [$id]);
        }

        if ($profile->id !== $viewer->id && $profile->privacy === 'private') {
            throw new AuthorizationException('Este perfil é privado.');
        }

        return UserDTO::fromModel($profile);
    }

    public function getAuthenticatedProfile(User $user): CurrentUserDTO
    {
        return CurrentUserDTO::fromModel($user);
    }

    public function updateProfile(User $user, UpdateProfileDTO $dto): CurrentUserDTO
    {
        $updatedUser = $this->users->updateProfile($user, $dto->toArray());

        return CurrentUserDTO::fromModel($updatedUser);
    }

    public function changeProfilePhoto(User $user, ChangeProfilePhotoDTO $dto): CurrentUserDTO
    {
        $path = $dto->photo->store('profile-photos', 'public');
        $previousPhoto = $user->profile_photo;
        $updatedUser = $this->users->updateProfilePhoto($user, $path);

        if ($previousPhoto) {
            Storage::disk('public')->delete($previousPhoto);
        }

        return CurrentUserDTO::fromModel($updatedUser);
    }
}
