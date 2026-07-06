<?php

namespace App\Repositories;

use App\Models\FollowRequest;

class FollowRequestRepository
{
    public function findById(int $id): ?FollowRequest
    {
        return FollowRequest::query()->find($id);
    }

    public function findByFollowerAndFollowing(int $followerId, int $followingId): ?FollowRequest
    {
        return FollowRequest::query()
            ->where('follower_id', $followerId)
            ->where('following_id', $followingId)
            ->first();
    }

    public function hasPending(int $followerId, int $followingId): bool
    {
        return FollowRequest::query()
            ->where('follower_id', $followerId)
            ->where('following_id', $followingId)
            ->where('status', FollowRequest::STATUS_PENDING)
            ->exists();
    }

    public function createOrRenewPending(int $followerId, int $followingId): FollowRequest
    {
        $request = $this->findByFollowerAndFollowing($followerId, $followingId);

        if ($request) {
            $request->forceFill([
                'status' => FollowRequest::STATUS_PENDING,
                'responded_at' => null,
            ])->save();

            return $request;
        }

        return FollowRequest::create([
            'follower_id' => $followerId,
            'following_id' => $followingId,
            'status' => FollowRequest::STATUS_PENDING,
        ]);
    }

    public function markAccepted(FollowRequest $request): FollowRequest
    {
        $request->forceFill([
            'status' => FollowRequest::STATUS_ACCEPTED,
            'responded_at' => now(),
        ])->save();

        return $request;
    }

    public function markRejected(FollowRequest $request): FollowRequest
    {
        $request->forceFill([
            'status' => FollowRequest::STATUS_REJECTED,
            'responded_at' => now(),
        ])->save();

        return $request;
    }
}
