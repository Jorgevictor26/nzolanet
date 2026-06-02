<?php

namespace App\DTOs;

use App\Models\User;

readonly class UserDTO
{
    public function __construct(
        public int $id,
        public string $name,
        public ?string $username,
        public ?string $bio,
        public ?string $profilePhoto,
        public string $privacy,
        public int $followersCount,
        public int $followingCount,
        public bool $isFollowedByViewer,
    ) {}

    public static function fromModel(User $user, ?User $viewer = null): self
    {
        return new self(
            id: $user->id,
            name: $user->name,
            username: $user->username,
            bio: $user->bio,
            profilePhoto: $user->profile_photo,
            privacy: $user->privacy,
            followersCount: (int) ($user->getAttribute('followers_count') ?? $user->followers()->count()),
            followingCount: (int) ($user->getAttribute('following_count') ?? $user->following()->count()),
            isFollowedByViewer: $viewer !== null
                && $viewer->id !== $user->id
                && $user->followers()->where('users.id', $viewer->id)->exists(),
        );
    }

    /**
     * @return array<string, bool|int|string|null>
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'bio' => $this->bio,
            'profile_photo' => $this->profilePhoto,
            'privacy' => $this->privacy,
            'followers_count' => $this->followersCount,
            'following_count' => $this->followingCount,
            'is_followed_by_viewer' => $this->isFollowedByViewer,
        ];
    }
}
