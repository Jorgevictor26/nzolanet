<?php

namespace App\Repositories;

use App\Models\Notification;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class NotificationRepository
{
    /**
     * @param  array{user_id: int, actor_id?: ?int, post_id?: ?int, comment_id?: ?int, type: string, title: string, body: string}  $data
     */
    public function create(array $data): Notification
    {
        return Notification::create($data);
    }

    /**
     * @return LengthAwarePaginator<int, Notification>
     */
    public function paginateByUserId(int $userId, int $perPage): LengthAwarePaginator
    {
        return Notification::query()
            ->where('user_id', $userId)
            ->latest()
            ->paginate($perPage);
    }

    public function countUnreadByUserId(int $userId): int
    {
        return Notification::query()
            ->where('user_id', $userId)
            ->whereNull('read_at')
            ->count();
    }

    public function markAllAsRead(int $userId): void
    {
        Notification::query()
            ->where('user_id', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    public function deleteAllByUserId(int $userId): void
    {
        Notification::query()
            ->where('user_id', $userId)
            ->delete();
    }
}
