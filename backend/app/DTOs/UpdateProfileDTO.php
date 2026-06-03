<?php

namespace App\DTOs;

use Illuminate\Http\UploadedFile;

readonly class UpdateProfileDTO
{
    public function __construct(
        public string $name,
        public ?string $username,
        public ?string $phoneNumber,
        public ?string $bio,
        public string $privacy,
        public ?UploadedFile $profilePhoto,
        public ?UploadedFile $coverPhoto,
    ) {}

    /**
     * @param  array{name: string, username?: ?string, phone_number?: ?string, bio?: ?string, privacy: string}  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            username: $data['username'] ?? null,
            phoneNumber: $data['phone_number'] ?? null,
            bio: $data['bio'] ?? null,
            privacy: $data['privacy'],
            profilePhoto: $data['profile_photo_file'] ?? null,
            coverPhoto: $data['cover_photo_file'] ?? null,
        );
    }

    /**
     * @return array{name: string, username: ?string, phone_number: ?string, bio: ?string, privacy: string}
     */
    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'username' => $this->username,
            'phone_number' => $this->phoneNumber,
            'bio' => $this->bio,
            'privacy' => $this->privacy,
        ];
    }
}
