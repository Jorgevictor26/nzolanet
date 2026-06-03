<?php

namespace App\Services;

use App\DTOs\CurrentUserDTO;
use App\DTOs\LoginDTO;
use App\DTOs\RegisterDTO;
use App\Models\User;
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function __construct(
        private readonly UserRepository $users,
    ) {}

    public function register(RegisterDTO $dto): CurrentUserDTO
    {
        $user = $this->users->create([
            'name' => $dto->name,
            'username' => $dto->username,
            'email' => $dto->email,
            'phone_number' => $dto->phoneNumber,
            'password' => Hash::make($dto->password),
            'bio' => null,
            'profile_photo' => null,
            'privacy' => 'public',
        ]);

        return CurrentUserDTO::fromModel($user);
    }

    /**
     * @return array{user: CurrentUserDTO, token: string}
     */
    public function login(LoginDTO $dto): array
    {
        $user = $this->users->findByEmail($dto->email);

        if (! $user || ! Hash::check($dto->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email ou palavra passe incorreta.'],
            ]);
        }

        return [
            'user' => CurrentUserDTO::fromModel($user),
            'token' => $user->createToken('nzolanet-api-token')->plainTextToken,
        ];
    }

    public function logout(User $user): void
    {
        $token = $user->currentAccessToken();

        if ($token && method_exists($token, 'delete')) {
            $token->delete();
        }
    }
}
