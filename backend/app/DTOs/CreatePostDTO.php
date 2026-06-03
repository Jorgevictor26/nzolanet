<?php

namespace App\DTOs;

use Illuminate\Http\UploadedFile;

readonly class CreatePostDTO
{
    public function __construct(
        public string $content,
        public ?UploadedFile $image,
        public ?UploadedFile $video,
        /** @var array<int, UploadedFile> */
        public array $media = [],
    ) {}
}
