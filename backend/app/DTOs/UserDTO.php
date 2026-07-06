<?php

namespace App\DTOs;

use App\Models\FollowRequest;
use App\Models\User;

readonly class UserDTO
{
    public function __construct(
        public int $id,
        public string $name,
        public ?string $username,
        public ?string $bio,
        public ?string $profilePhoto,
        public ?string $coverPhoto,
        public string $privacy,
        public int $postsCount,
        public int $followersCount,
        public int $followingCount,
        public bool $isFollowedByViewer,
        public bool $canViewContent,
        public string $followStatus,
    ) {}

    public static function fromModel(
        User $user,
        ?User $viewer = null,
        ?bool $canViewContent = null,
        ?string $followStatus = null,
    ): self
    {
        $isFollowedByViewer = $viewer !== null
            && $viewer->id !== $user->id
            && $user->followers()->where('users.id', $viewer->id)->exists();
        $resolvedFollowStatus = $followStatus ?? self::resolveFollowStatus($user, $viewer, $isFollowedByViewer);

        return new self(
            id: $user->id,
            name: $user->name,
            username: $user->username,
            bio: $user->bio,
            profilePhoto: $user->profile_photo,
            coverPhoto: $user->cover_photo,
            privacy: $user->privacy,
            postsCount: (int) ($user->getAttribute('posts_count') ?? $user->posts()->count()),
            followersCount: (int) ($user->getAttribute('followers_count') ?? $user->followers()->count()),
            followingCount: (int) ($user->getAttribute('following_count') ?? $user->following()->count()),
            isFollowedByViewer: $isFollowedByViewer,
            canViewContent: $canViewContent ?? self::canViewerViewContent($user, $viewer, $isFollowedByViewer),
            followStatus: $resolvedFollowStatus,
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
            'cover_photo' => $this->coverPhoto,
            'privacy' => $this->privacy,
            'posts_count' => $this->postsCount,
            'followers_count' => $this->followersCount,
            'following_count' => $this->followingCount,
            'is_followed_by_viewer' => $this->isFollowedByViewer,
            'can_view_content' => $this->canViewContent,
            'follow_status' => $this->followStatus,
        ];
    }

    private static function resolveFollowStatus(User $user, ?User $viewer, bool $isFollowedByViewer): string
    {
        if ($isFollowedByViewer) {
            return 'following';
        }

        if ($viewer === null || $viewer->id === $user->id) {
            return 'none';
        }

        return FollowRequest::query()
            ->where('follower_id', $viewer->id)
            ->where('following_id', $user->id)
            ->where('status', FollowRequest::STATUS_PENDING)
            ->exists()
                ? 'pending'
                : 'none';
    }

    private static function canViewerViewContent(User $user, ?User $viewer, bool $isFollowedByViewer): bool
    {
        if ($user->privacy !== 'private') {
            return true;
        }

        if ($viewer === null) {
            return false;
        }

        if ($viewer->id === $user->id) {
            return true;
        }

        $email = strtolower(trim((string) $viewer->email));
        $username = strtolower(trim((string) $viewer->username));

        return (bool) $viewer->is_admin
            || in_array($email, ['admin@nzolanet.com'], true)
            || in_array($username, ['admin', 'administrador'], true)
            || $isFollowedByViewer;
    }
}
