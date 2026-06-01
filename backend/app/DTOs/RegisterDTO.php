<?php

namespace App\DTOs;

readonly class RegisterDTO
{
    public function __construct(
        public string $name,
        public ?string $username,
        public string $email,
        public ?string $phoneNumber,
        public string $password,
    ) {}

    /**
     * @param  array{name: string, username?: ?string, email: string, phone_number?: ?string, password: string}  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            username: $data['username'] ?? null,
            email: $data['email'],
            phoneNumber: $data['phone_number'] ?? null,
            password: $data['password'],
        );
    }
}
