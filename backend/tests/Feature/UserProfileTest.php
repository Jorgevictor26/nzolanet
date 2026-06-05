<?php

namespace Tests\Feature;

use App\Models\Post;
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
            'username' => 'jorge.victor',
            'phone_number' => '+244 921 000 000',
            'privacy' => 'private',
        ]);

        $response = $this
            ->actingAs($user, 'sanctum')
            ->getJson('/api/users/me');

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.name', 'Jorge Victor')
            ->assertJsonPath('data.username', 'jorge.victor')
            ->assertJsonPath('data.phone_number', '+244 921 000 000')
            ->assertJsonPath('data.cover_photo', null)
            ->assertJsonPath('data.privacy', 'private')
            ->assertJsonMissing(['password']);
    }

    public function test_authenticated_user_can_view_public_profile(): void
    {
        $viewer = User::factory()->create();
        $profile = User::factory()->create([
            'name' => 'Public User',
            'username' => 'public.user',
            'phone_number' => '+244 921 111 111',
            'privacy' => 'public',
        ]);
        Post::create([
            'user_id' => $profile->id,
            'content' => 'Publicação do perfil.',
        ]);

        $response = $this
            ->actingAs($viewer, 'sanctum')
            ->getJson("/api/users/{$profile->id}");

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $profile->id)
            ->assertJsonPath('data.name', 'Public User')
            ->assertJsonPath('data.username', 'public.user')
            ->assertJsonPath('data.cover_photo', null)
            ->assertJsonPath('data.posts_count', 1)
            ->assertJsonMissing(['phone_number']);
    }

    public function test_authenticated_user_can_view_private_profile_summary_from_another_user(): void
    {
        $viewer = User::factory()->create();
        $profile = User::factory()->create([
            'name' => 'Private User',
            'privacy' => 'private',
        ]);

        $response = $this
            ->actingAs($viewer, 'sanctum')
            ->getJson("/api/users/{$profile->id}");

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $profile->id)
            ->assertJsonPath('data.name', 'Private User')
            ->assertJsonPath('data.privacy', 'private')
            ->assertJsonMissing(['phone_number']);
    }

    public function test_authenticated_user_can_update_own_profile(): void
    {
        $user = User::factory()->create([
            'name' => 'Old Name',
            'username' => 'old.name',
            'phone_number' => '+244 921 222 222',
            'bio' => null,
            'privacy' => 'public',
        ]);

        $response = $this
            ->actingAs($user, 'sanctum')
            ->putJson('/api/users/profile', [
                'name' => 'New Name',
                'username' => 'new.name',
                'phone_number' => '+244 921 333 333',
                'bio' => 'Backend engineer at NzolaNet.',
                'privacy' => 'private',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.name', 'New Name')
            ->assertJsonPath('data.username', 'new.name')
            ->assertJsonPath('data.phone_number', '+244 921 333 333')
            ->assertJsonPath('data.bio', 'Backend engineer at NzolaNet.')
            ->assertJsonPath('data.privacy', 'private');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'New Name',
            'username' => 'new.name',
            'phone_number' => '+244 921 333 333',
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

    public function test_authenticated_user_can_update_cover_photo(): void
    {
        Storage::fake('public');

        $user = User::factory()->create([
            'name' => 'Jorge Victor',
            'username' => 'jorge.victor',
            'phone_number' => '+244 921 000 000',
            'bio' => 'Perfil com capa.',
            'privacy' => 'public',
        ]);
        $cover = UploadedFile::fake()->createWithContent(
            'cover.png',
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=')
        );

        $response = $this
            ->actingAs($user, 'sanctum')
            ->postJson('/api/users/profile', [
                'name' => 'Jorge Victor',
                'username' => 'jorge.victor',
                'phone_number' => '+244 921 000 000',
                'bio' => 'Perfil com capa.',
                'privacy' => 'public',
                'cover_photo_file' => $cover,
            ]);

        $path = $user->fresh()->cover_photo;

        $response
            ->assertOk()
            ->assertJsonPath('data.cover_photo', $path);

        $this->assertNotNull($path);
        Storage::disk('public')->assertExists($path);
    }
}
