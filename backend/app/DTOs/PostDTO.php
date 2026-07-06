<?php

namespace App\DTOs;

use App\Models\Post;

readonly class PostDTO
{
    public function __construct(
        public int $id,
        public int $userId,
        public ?string $authorName,
        public ?string $authorUsername,
        public ?string $authorProfilePhoto,
        public string $content,
        public ?string $image,
        public ?string $video,
        public int $likesCount,
        public int $commentsCount,
        public bool $isLikedByViewer,
        public string $createdAt,
        public string $updatedAt,
    ) {}

    public static function fromModel(Post $post): self
    {
        return new self(
            id: $post->id,
            userId: $post->user_id,
            authorName: $post->user?->name,
            authorUsername: $post->user?->username,
            authorProfilePhoto: $post->user?->profile_photo,
            content: $post->content,
            image: $post->image,
            video: $post->video,
            likesCount: (int) ($post->likes_count ?? 0),
            commentsCount: (int) ($post->comments_count ?? 0),
            isLikedByViewer: (bool) ($post->is_liked_by_viewer ?? false),
            createdAt: $post->created_at?->toISOString() ?? '',
            updatedAt: $post->updated_at?->toISOString() ?? '',
        );
    }

    /**
     * @return array<string, int|string|null>
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->userId,
            'author' => [
                'name' => $this->authorName,
                'username' => $this->authorUsername,
                'profile_photo' => $this->authorProfilePhoto,
            ],
            'content' => $this->content,
            'image' => $this->image,
            'video' => $this->video,
            'likes_count' => $this->likesCount,
            'comments_count' => $this->commentsCount,
            'is_liked_by_viewer' => $this->isLikedByViewer,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
        ];
    }
}
