<?php

namespace App\Services;
    use App\DTOs\CurrentUserDTO;
    use App\DTOs\LoginDTO;
    use App\DTOs\RegisterDTO;
    use App\DTOs\ResetPasswordDTO;
    use App\Models\User;
    use App\Repositories\UserRepository;
    use Illuminate\Auth\Events\PasswordReset;
    use Illuminate\Support\Facades\Hash;
    use Illuminate\Support\Facades\Mail;
    use Illuminate\Support\Facades\Password;
    use Illuminate\Support\Str;
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

        public function sendPasswordResetToken(string $email): void
        {
            $user = $this->users->findByEmail($email);

            if (! $user) {
                return;
            }

            $token = Password::broker()->createToken($user);

            Mail::raw(
                "Olá {$user->name},\n\nUse este token para recuperar a sua palavra passe:\n\n{$token}\n\nEste token expira em 60 minutos.",
                fn ($message) => $message
                    ->to($user->email)
                    ->subject('Recuperação de palavra passe - NzolaNet')
            );
        }

        public function resetPassword(ResetPasswordDTO $dto): void
        {
            $status = Password::broker()->reset(
                [
                    'email' => $dto->email,
                    'password' => $dto->password,
                    'password_confirmation' => $dto->password,
                    'token' => $dto->token,
                ],
                function (User $user, string $password): void {
                    $user->forceFill([
                        'password' => Hash::make($password),
                        'remember_token' => Str::random(60),
                    ])->save();

                    $user->tokens()->delete();

                    event(new PasswordReset($user));
                }
            );

            if ($status !== Password::PASSWORD_RESET) {
                throw ValidationException::withMessages([
                    'email' => ['Token inválido ou expirado.'],
                ]);
            }
        }
    }
