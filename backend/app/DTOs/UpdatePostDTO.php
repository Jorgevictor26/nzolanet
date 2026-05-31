<?php

namespace App\DTOs;

use Illuminate\Http\UploadedFile;

readonly class UpdatePostDTO
{
    public function __construct(
        public string $content,
        public ?UploadedFile $image,
        public ?UploadedFile $video,
    ) {}
}
