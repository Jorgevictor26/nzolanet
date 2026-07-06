<?php

namespace App\Repositories;

use App\Models\Notification;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Schema;

class NotificationRepository
{
    /**
     * @param  array{user_id: int, actor_id?: ?int, post_id?: ?int, comment_id?: ?int, follow_request_id?: ?int, type: string, title: string, body: string, message?: string}  $data
     */
    public function create(array $data): Notification
    {
        $data['message'] ??= $data['body'];

        if (! Schema::hasColumn('notifications', 'message')) {
            unset($data['message']);
        }

        if (! Schema::hasColumn('notifications', 'follow_request_id')) {
            unset($data['follow_request_id']);
        }

        return Notification::create($data);
    }

    /**
     * @return LengthAwarePaginator<int, Notification>
     */
    public function paginateByUserId(int $userId, int $perPage): LengthAwarePaginator
    {
        return Notification::query()
            ->with('followRequest')
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
