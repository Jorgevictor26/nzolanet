<?php

namespace App\DTOs;

readonly class ResetPasswordDTO
{
    public function __construct(
        public string $email,
        public string $password,
        public string $passwordConfirmation,
        public string $token,
    ) {}

    /**
     * @param  array{email: string, password: string, password_confirmation: string, token: string}  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            email: $data['email'],
            password: $data['password'],
            passwordConfirmation: $data['password_confirmation'],
            token: $data['token'],
        );
    }

    /**
     * @return array{email: string, password: string, password_confirmation: string, token: string}
     */
    public function toPasswordBrokerCredentials(): array
    {
        return [
            'email' => $this->email,
            'password' => $this->password,
            'password_confirmation' => $this->passwordConfirmation,
            'token' => $this->token,
        ];
    }
}
