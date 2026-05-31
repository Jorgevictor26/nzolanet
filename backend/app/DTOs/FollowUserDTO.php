<?php

namespace App\DTOs;

readonly class FollowUserDTO
{
    public function __construct(
        public int $followerId,
        public int $followingId,
    ) {}
}
