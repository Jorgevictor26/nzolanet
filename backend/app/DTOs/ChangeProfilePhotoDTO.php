<?php

namespace App\DTOs;

use Illuminate\Http\UploadedFile;

readonly class ChangeProfilePhotoDTO
{
    public function __construct(
        public UploadedFile $photo,
    ) {}

    /**
     * @param  array{photo: UploadedFile}  $data
     */
    public static function fromArray(array $data): self
    {
        return new self($data['photo']);
    }
}
