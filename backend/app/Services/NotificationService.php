<?php

namespace App\Services;

use App\DTOs\NotificationDTO;
use App\Models\Comment;
use App\Models\Notification;
use App\Models\Post;
use App\Models\User;
use App\Repositories\NotificationRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class NotificationService
{
    private const TYPE_BAZE = 'baze';

    private const TYPE_COMMENT = 'comment';

    private const TYPE_FOLLOW = 'follow';

    private const MIN_PER_PAGE = 1;

    private const MAX_PER_PAGE = 50;

    public function __construct(
        private readonly NotificationRepository $notifications,
    ) {}

    /**
     * @return array{data: array<int, array<string, bool|int|string|null>>, meta: array<string, int>}
     */
    public function list(User $user, int $perPage): array
    {
        $paginator = $this->notifications->paginateByUserId($user->id, $this->normalizePerPage($perPage));

        return $this->formatPaginatedNotifications($paginator, $user);
    }

    public function notifyNewBaze(User $actor, Post $post): void
    {
        $this->notifyPostOwner($actor, $post, [
            'actor_id' => $actor->id,
            'post_id' => $post->id,
            'type' => self::TYPE_BAZE,
            'title' => 'Novo baze',
            'body' => "{$actor->name} deu baze na tua publicação.",
        ]);
    }

    public function notifyNewComment(User $actor, Post $post, Comment $comment): void
    {
        $this->notifyPostOwner($actor, $post, [
            'actor_id' => $actor->id,
            'post_id' => $post->id,
            'comment_id' => $comment->id,
            'type' => self::TYPE_COMMENT,
            'title' => 'Novo comentário',
            'body' => "{$actor->name} comentou na tua publicação.",
        ]);
    }

    public function notifyNewFollower(User $follower, User $followed): void
    {
        if ($follower->id === $followed->id) {
            return;
        }

        $this->notifications->create([
            'user_id' => $followed->id,
            'actor_id' => $follower->id,
            'type' => self::TYPE_FOLLOW,
            'title' => 'Novo seguidor',
            'body' => "{$follower->name} começou a seguir-te.",
        ]);
    }

    public function markAllAsRead(User $user): int
    {
        $this->notifications->markAllAsRead($user->id);

        return $this->notifications->countUnreadByUserId($user->id);
    }

    public function clear(User $user): void
    {
        $this->notifications->deleteAllByUserId($user->id);
    }

    private function normalizePerPage(int $perPage): int
    {
        return max(self::MIN_PER_PAGE, min($perPage, self::MAX_PER_PAGE));
    }

    /**
     * @param  array{actor_id: int, post_id: int, comment_id?: int, type: string, title: string, body: string}  $data
     */
    private function notifyPostOwner(User $actor, Post $post, array $data): void
    {
        if ($actor->id === $post->user_id) {
            return;
        }

        $this->notifications->create([
            ...$data,
            'user_id' => $post->user_id,
        ]);
    }

    /**
     * @param  LengthAwarePaginator<int, Notification>  $paginator
     * @return array{data: array<int, array<string, bool|int|string|null>>, meta: array<string, int>}
     */
    private function formatPaginatedNotifications(LengthAwarePaginator $paginator, User $user): array
    {
        return [
            'data' => $paginator->getCollection()
                ->map(fn (Notification $notification): array => NotificationDTO::fromModel($notification)->toArray())
                ->values()
                ->all(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'unread' => $this->notifications->countUnreadByUserId($user->id),
            ],
        ];
    }
}
