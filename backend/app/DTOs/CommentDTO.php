<?php

namespace App\DTOs;

use App\Models\Comment;

readonly class CommentDTO
{
    public function __construct(
        public int $id,
        public int $userId,
        public int $postId,
        public ?string $authorName,
        public ?string $authorProfilePhoto,
        public string $content,
        public string $createdAt,
        public string $updatedAt,
    ) {}

    public static function fromModel(Comment $comment): self
    {
        return new self(
            id: $comment->id,
            userId: $comment->user_id,
            postId: $comment->post_id,
            authorName: $comment->user?->name,
            authorProfilePhoto: $comment->user?->profile_photo,
            content: $comment->content,
            createdAt: $comment->created_at?->toISOString() ?? '',
            updatedAt: $comment->updated_at?->toISOString() ?? '',
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->userId,
            'post_id' => $this->postId,
            'author' => [
                'name' => $this->authorName,
                'profile_photo' => $this->authorProfilePhoto,
            ],
            'content' => $this->content,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
        ];
    }
}
