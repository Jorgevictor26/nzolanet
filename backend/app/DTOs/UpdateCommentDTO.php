<?php

namespace App\DTOs;

readonly class UpdateCommentDTO
{
    public function __construct(
        public string $content,
    ) {}
}
