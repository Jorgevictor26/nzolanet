<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Jorge Victor',
            'username' => 'jorge.victor',
            'email' => 'jorge@example.com',
            'phone_number' => '+244 921 000 000',
            'password' => 'password',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'Jorge Victor')
            ->assertJsonPath('data.username', 'jorge.victor')
            ->assertJsonPath('data.email', 'jorge@example.com')
            ->assertJsonPath('data.phone_number', '+244 921 000 000')
            ->assertJsonPath('data.bio', null)
            ->assertJsonPath('data.profile_photo', null)
            ->assertJsonPath('data.privacy', 'public')
            ->assertJsonMissing(['password']);

        $this->assertDatabaseHas('users', [
            'email' => 'jorge@example.com',
            'username' => 'jorge.victor',
            'phone_number' => '+244 921 000 000',
            'privacy' => 'public',
            'bio' => null,
            'profile_photo' => null,
        ]);

        $this->assertTrue(Hash::check('password', User::firstOrFail()->password));
    }

    public function test_user_can_login_and_receive_sanctum_token(): void
    {
        User::factory()->create([
            'email' => 'jorge@example.com',
            'password' => Hash::make('password'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'jorge@example.com',
            'password' => 'password',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.email', 'jorge@example.com')
            ->assertJsonPath('token_type', 'Bearer')
            ->assertJsonStructure(['data', 'token', 'token_type']);

        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

    public function test_user_can_logout_and_revoke_current_token(): void
    {
        $user = User::factory()->create();
        $plainTextToken = $user->createToken('test-token')->plainTextToken;

        $response = $this
            ->withToken($plainTextToken)
            ->postJson('/api/auth/logout');

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Sessão terminada com sucesso.');

        $this->assertSame(0, PersonalAccessToken::count());
    }

    public function test_user_can_request_password_reset_link(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'jorge@example.com',
        ]);

        $response = $this->postJson('/api/auth/forgot-password', [
            'email' => 'jorge@example.com',
        ]);

        $response->assertOk();

        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_user_can_reset_password(): void
    {
        $user = User::factory()->create([
            'email' => 'jorge@example.com',
            'password' => Hash::make('old-password'),
        ]);

        $token = Password::createToken($user);

        $response = $this->postJson('/api/auth/reset-password', [
            'email' => 'jorge@example.com',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
            'token' => $token,
        ]);

        $response->assertOk();

        $this->assertTrue(Hash::check('new-password', $user->fresh()->password));
    }
}
