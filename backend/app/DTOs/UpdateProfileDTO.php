<?php

namespace App\DTOs;

readonly class UpdateProfileDTO
{
    public function __construct(
        public string $name,
        public ?string $bio,
        public string $privacy,
    ) {}

    /**
     * @param  array{name: string, bio?: ?string, privacy: string}  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            bio: $data['bio'] ?? null,
            privacy: $data['privacy'],
        );
    }

    /**
     * @return array{name: string, bio: ?string, privacy: string}
     */
    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'bio' => $this->bio,
            'privacy' => $this->privacy,
        ];
    }
}
