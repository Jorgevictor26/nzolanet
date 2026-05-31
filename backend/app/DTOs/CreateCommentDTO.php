<?php

namespace App\DTOs;

readonly class CreateCommentDTO
{
    public function __construct(
        public int $postId,
        public string $content,
    ) {}
}
