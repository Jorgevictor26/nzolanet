<?php

namespace App\Services;

use App\DTOs\CurrentUserDTO;
use App\DTOs\ForgotPasswordDTO;
use App\DTOs\LoginDTO;
use App\DTOs\RegisterDTO;
use App\DTOs\ResetPasswordDTO;
use App\Models\User;
use App\Repositories\UserRepository;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
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

    public function forgotPassword(ForgotPasswordDTO $dto): string
    {
        $status = Password::sendResetLink(['email' => $dto->email]);

        if ($status !== Password::RESET_LINK_SENT) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return __($status);
    }

    public function resetPassword(ResetPasswordDTO $dto): string
    {
        $status = Password::reset(
            $dto->toPasswordBrokerCredentials(),
            function (User $user, string $password): void {
                $this->users->updatePassword($user, Hash::make($password));

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return __($status);
    }
}
