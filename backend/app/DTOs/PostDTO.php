<?php

namespace App\DTOs;

use App\Models\Post;

readonly class PostDTO
{
    public function __construct(
        public int $id,
        public int $userId,
        public string $content,
        public ?string $image,
        public ?string $video,
        public string $createdAt,
        public string $updatedAt,
    ) {}

    public static function fromModel(Post $post): self
    {
        return new self(
            id: $post->id,
            userId: $post->user_id,
            content: $post->content,
            image: $post->image,
            video: $post->video,
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
            'content' => $this->content,
            'image' => $this->image,
            'video' => $this->video,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
        ];
    }
}
