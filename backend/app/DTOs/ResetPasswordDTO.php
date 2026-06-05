<?php

namespace App\DTOs;

readonly class ResetPasswordDTO
{
    public function __construct(
        public string $email,
        public string $token,
        public string $password,
    ) {}

    /**
     * @param  array{email: string, token: string, password: string}  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            email: $data['email'],
            token: $data['token'],
            password: $data['password'],
        );
    }
}
