<?php

namespace App\Repositories;

use App\Models\Like;

class LikeRepository
{
    public function exists(int $userId, int $postId): bool
    {
        return Like::query()
            ->where('user_id', $userId)
            ->where('post_id', $postId)
            ->exists();
    }

    public function create(int $userId, int $postId): Like
    {
        return Like::create([
            'user_id' => $userId,
            'post_id' => $postId,
        ]);
    }

    public function delete(int $userId, int $postId): bool
    {
        return Like::query()
            ->where('user_id', $userId)
            ->where('post_id', $postId)
            ->delete() > 0;
    }
}
