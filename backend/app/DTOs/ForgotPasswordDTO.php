<?php

namespace App\DTOs;

readonly class ForgotPasswordDTO
{
    public function __construct(
        public string $email,
    ) {}

    /**
     * @param  array{email: string}  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(email: $data['email']);
    }
}
