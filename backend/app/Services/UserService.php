<?php

namespace App\Services;

use App\DTOs\CurrentUserDTO;
use App\DTOs\UpdateProfileDTO;
use App\DTOs\UserDTO;
use App\Models\User;
use App\Repositories\UserRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class UserService
{
    public function __construct(
        private readonly ProfilePrivacyService $profilePrivacy,
        private readonly UserRepository $users,
    ) {}

    public function getProfile(int $id, User $viewer): UserDTO
    {
        $profile = $this->users->findById($id);

        if (! $profile) {
            throw (new ModelNotFoundException)->setModel(User::class, [$id]);
        }

        $canViewContent = $this->profilePrivacy->canViewProfile($viewer, $profile);

        $profile->loadCount(['posts', 'followers', 'following']);

        return UserDTO::fromModel($profile, $viewer, $canViewContent);
    }

    public function getAuthenticatedProfile(User $user): CurrentUserDTO
    {
        return CurrentUserDTO::fromModel($user);
    }

    /**
     * @return array{data: array<int, array<string, bool|int|string|null>>, meta: array<string, int>}
     */
    public function followSuggestions(User $viewer, int $perPage, ?int $excludeUserId = null): array
    {
        return $this->formatPaginatedUsers(
            $this->users->paginateFollowSuggestions($viewer, $this->normalizePerPage($perPage), $excludeUserId),
            $viewer
        );
    }

    public function updateProfile(User $user, UpdateProfileDTO $dto): CurrentUserDTO
    {
        $data = $dto->toArray();
        $previousPhoto = $user->profile_photo;
        $previousCoverPhoto = $user->cover_photo;

        if ($dto->profilePhoto) {
            $data['profile_photo'] = $dto->profilePhoto->store('profile-photos', 'public');
        }

        if ($dto->coverPhoto) {
            $data['cover_photo'] = $dto->coverPhoto->store('cover-photos', 'public');
        }

        $updatedUser = $this->users->updateProfile($user, $data);

        if ($dto->profilePhoto && $previousPhoto) {
            Storage::disk('public')->delete($previousPhoto);
        }

        if ($dto->coverPhoto && $previousCoverPhoto) {
            Storage::disk('public')->delete($previousCoverPhoto);
        }

        return CurrentUserDTO::fromModel($updatedUser);
    }

    public function changeProfilePhoto(User $user, UploadedFile $photo): CurrentUserDTO
    {
        $path = $photo->store('profile-photos', 'public');
        $previousPhoto = $user->profile_photo;
        $updatedUser = $this->users->updateProfilePhoto($user, $path);

        if ($previousPhoto) {
            Storage::disk('public')->delete($previousPhoto);
        }

        return CurrentUserDTO::fromModel($updatedUser);
    }

    private function normalizePerPage(int $perPage): int
    {
        return max(1, min($perPage, 50));
    }

    /**
     * @param  LengthAwarePaginator<int, User>  $paginator
     * @return array{data: array<int, array<string, bool|int|string|null>>, meta: array<string, int>}
     */
    private function formatPaginatedUsers(LengthAwarePaginator $paginator, User $viewer): array
    {
        return [
            'data' => $paginator->getCollection()
                ->map(fn (User $user): array => UserDTO::fromModel(
                    $user,
                    $viewer,
                    $this->profilePrivacy->canViewProfile($viewer, $user),
                )->toArray())
                ->values()
                ->all(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }
}
