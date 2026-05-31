<?php

namespace App\DTOs;

use Illuminate\Http\UploadedFile;

readonly class ChangeProfilePhotoDTO
{
    public function __construct(
        public UploadedFile $photo,
    ) {}
}
