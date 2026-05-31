<?php

namespace App\Services;

use App\DTOs\ForgotPasswordDTO;
use App\DTOs\LoginDTO;
use App\DTOs\RegisterDTO;
use App\DTOs\ResetPasswordDTO;
use App\DTOs\UserDTO;
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

    public function register(RegisterDTO $dto): UserDTO
    {
        $user = $this->users->create([
            'name' => $dto->name,
            'email' => $dto->email,
            'password' => Hash::make($dto->password),
            'bio' => null,
            'profile_photo' => null,
            'privacy' => 'public',
        ]);

        return UserDTO::fromModel($user);
    }

    /**
     * @return array{user: UserDTO, token: string}
     */
    public function login(LoginDTO $dto): array
    {
        $user = $this->users->findByEmail($dto->email);

        if (! $user || ! Hash::check($dto->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['As credenciais informadas são inválidas.'],
            ]);
        }

        return [
            'user' => UserDTO::fromModel($user),
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
