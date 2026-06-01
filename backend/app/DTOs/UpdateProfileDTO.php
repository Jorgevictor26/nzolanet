<?php

namespace App\DTOs;

readonly class UpdateProfileDTO
{
    public function __construct(
        public string $name,
        public ?string $username,
        public ?string $phoneNumber,
        public ?string $bio,
        public string $privacy,
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
