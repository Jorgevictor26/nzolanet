<?php

namespace App\Repositories;

use App\Models\Follow;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class FollowRepository
{
    public function exists(int $followerId, int $followingId): bool
    {
        return Follow::query()
            ->where('follower_id', $followerId)
            ->where('following_id', $followingId)
            ->exists();
    }

    public function create(int $followerId, int $followingId): Follow
    {
        return Follow::create([
            'follower_id' => $followerId,
            'following_id' => $followingId,
        ]);
    }

    public function delete(int $followerId, int $followingId): bool
    {
        return Follow::query()
            ->where('follower_id', $followerId)
            ->where('following_id', $followingId)
            ->delete() > 0;
    }

    /**
     * @return LengthAwarePaginator<int, User>
     */
    public function paginateFollowers(User $user, int $perPage): LengthAwarePaginator
    {
        return $user->followers()
            ->orderBy('users.name')
            ->paginate($perPage);
    }

    /**
     * @return LengthAwarePaginator<int, User>
     */
    public function paginateFollowing(User $user, int $perPage): LengthAwarePaginator
    {
        return $user->following()
            ->orderBy('users.name')
            ->paginate($perPage);
    }
}
