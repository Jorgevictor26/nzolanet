<?php

namespace App\DTOs;

use App\Models\Notification;

readonly class NotificationDTO
{
    public function __construct(
        public int $id,
        public string $type,
        public string $title,
        public string $body,
        public bool $isRead,
        public ?int $actorId,
        public ?int $postId,
        public ?int $commentId,
        public string $createdAt,
    ) {}

    public static function fromModel(Notification $notification): self
    {
        return new self(
            id: $notification->id,
            type: $notification->type,
            title: $notification->title,
            body: $notification->body,
            isRead: $notification->read_at !== null,
            actorId: $notification->actor_id,
            postId: $notification->post_id,
            commentId: $notification->comment_id,
            createdAt: $notification->created_at?->toISOString() ?? '',
        );
    }

    /**
     * @return array<string, bool|int|string|null>
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'title' => $this->title,
            'body' => $this->body,
            'is_read' => $this->isRead,
            'actor_id' => $this->actorId,
            'post_id' => $this->postId,
            'comment_id' => $this->commentId,
            'created_at' => $this->createdAt,
        ];
    }
}
