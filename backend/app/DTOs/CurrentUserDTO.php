<?php

namespace App\DTOs;

use App\Models\User;

readonly class CurrentUserDTO
{
    public function __construct(
        public int $id,
        public string $name,
        public string $email,
        public ?string $bio,
        public ?string $profilePhoto,
        public string $privacy,
    ) {}

    public static function fromModel(User $user): self
    {
        return new self(
            id: $user->id,
            name: $user->name,
            email: $user->email,
            bio: $user->bio,
            profilePhoto: $user->profile_photo,
            privacy: $user->privacy,
        );
    }

    /**
     * @return array<string, int|string|null>
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'bio' => $this->bio,
            'profile_photo' => $this->profilePhoto,
            'privacy' => $this->privacy,
        ];
    }
}
