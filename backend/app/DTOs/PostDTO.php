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
        public array $media,
        public int $likesCount,
        public int $commentsCount,
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
            media: self::normalizeMedia($post),
            likesCount: (int) ($post->likes_count ?? 0),
            commentsCount: (int) ($post->comments_count ?? 0),
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
            'media' => $this->media,
            'likes_count' => $this->likesCount,
            'comments_count' => $this->commentsCount,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
        ];
    }

    /**
     * @return array<int, array{type: string, path: string}>
     */
    private static function normalizeMedia(Post $post): array
    {
        $media = is_array($post->media) ? $post->media : [];

        if ($media !== []) {
            return $media;
        }

        return array_values(array_filter([
            $post->image ? ['type' => 'image', 'path' => $post->image] : null,
            $post->video ? ['type' => 'video', 'path' => $post->video] : null,
        ]));
    }
}
