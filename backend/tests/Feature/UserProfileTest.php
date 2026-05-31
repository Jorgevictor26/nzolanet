<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class UserProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_get_own_profile(): void
    {
        $user = User::factory()->create([
            'name' => 'Jorge Victor',
            'privacy' => 'private',
        ]);

        $response = $this
            ->actingAs($user, 'sanctum')
            ->getJson('/api/users/me');

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.name', 'Jorge Victor')
            ->assertJsonPath('data.privacy', 'private')
            ->assertJsonMissing(['password']);
    }

    public function test_authenticated_user_can_view_public_profile(): void
    {
        $viewer = User::factory()->create();
        $profile = User::factory()->create([
            'name' => 'Public User',
            'privacy' => 'public',
        ]);

        $response = $this
            ->actingAs($viewer, 'sanctum')
            ->getJson("/api/users/{$profile->id}");

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $profile->id)
            ->assertJsonPath('data.name', 'Public User');
    }

    public function test_authenticated_user_cannot_view_private_profile_from_another_user(): void
    {
        $viewer = User::factory()->create();
        $profile = User::factory()->create([
            'privacy' => 'private',
        ]);

        $response = $this
            ->actingAs($viewer, 'sanctum')
            ->getJson("/api/users/{$profile->id}");

        $response->assertForbidden();
    }

    public function test_authenticated_user_can_update_own_profile(): void
    {
        $user = User::factory()->create([
            'name' => 'Old Name',
            'bio' => null,
            'privacy' => 'public',
        ]);

        $response = $this
            ->actingAs($user, 'sanctum')
            ->putJson('/api/users/profile', [
                'name' => 'New Name',
                'bio' => 'Backend engineer at NzolaNet.',
                'privacy' => 'private',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.name', 'New Name')
            ->assertJsonPath('data.bio', 'Backend engineer at NzolaNet.')
            ->assertJsonPath('data.privacy', 'private');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'New Name',
            'bio' => 'Backend engineer at NzolaNet.',
            'privacy' => 'private',
        ]);
    }

    public function test_authenticated_user_can_change_profile_photo(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $photo = UploadedFile::fake()->createWithContent(
            'avatar.png',
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=')
        );

        $response = $this
            ->actingAs($user, 'sanctum')
            ->postJson('/api/users/profile-photo', [
                'photo' => $photo,
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $user->id);

        $path = $user->fresh()->profile_photo;

        $this->assertNotNull($path);
        Storage::disk('public')->assertExists($path);
    }
}
