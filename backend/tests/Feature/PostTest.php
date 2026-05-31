<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PostTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_post(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user, 'sanctum')
            ->postJson('/api/posts', [
                'content' => 'Primeira publicação na NzolaNet.',
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.user_id', $user->id)
            ->assertJsonPath('data.content', 'Primeira publicação na NzolaNet.')
            ->assertJsonPath('data.image', null)
            ->assertJsonPath('data.video', null);

        $this->assertDatabaseHas('posts', [
            'user_id' => $user->id,
            'content' => 'Primeira publicação na NzolaNet.',
        ]);
    }

    public function test_authenticated_user_can_create_post_with_media_files(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $image = UploadedFile::fake()->createWithContent(
            'photo.png',
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=')
        );
        $video = UploadedFile::fake()->create('clip.mp4', 100, 'video/mp4');

        $response = $this
            ->actingAs($user, 'sanctum')
            ->post('/api/posts', [
                'content' => 'Publicação com multimédia.',
                'image' => $image,
                'video' => $video,
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.user_id', $user->id);

        $post = Post::firstOrFail();

        $this->assertNotNull($post->image);
        $this->assertNotNull($post->video);
        Storage::disk('public')->assertExists($post->image);
        Storage::disk('public')->assertExists($post->video);
    }

    public function test_post_author_can_update_own_post(): void
    {
        $user = User::factory()->create();
        $post = Post::create([
            'user_id' => $user->id,
            'content' => 'Conteúdo antigo.',
        ]);

        $response = $this
            ->actingAs($user, 'sanctum')
            ->putJson("/api/posts/{$post->id}", [
                'content' => 'Conteúdo atualizado.',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $post->id)
            ->assertJsonPath('data.content', 'Conteúdo atualizado.');

        $this->assertDatabaseHas('posts', [
            'id' => $post->id,
            'content' => 'Conteúdo atualizado.',
        ]);
    }

    public function test_user_cannot_update_post_from_another_user(): void
    {
        $author = User::factory()->create();
        $otherUser = User::factory()->create();
        $post = Post::create([
            'user_id' => $author->id,
            'content' => 'Conteúdo protegido.',
        ]);

        $response = $this
            ->actingAs($otherUser, 'sanctum')
            ->putJson("/api/posts/{$post->id}", [
                'content' => 'Tentativa indevida.',
            ]);

        $response->assertForbidden();

        $this->assertDatabaseHas('posts', [
            'id' => $post->id,
            'content' => 'Conteúdo protegido.',
        ]);
    }

    public function test_post_author_can_delete_own_post(): void
    {
        $user = User::factory()->create();
        $post = Post::create([
            'user_id' => $user->id,
            'content' => 'Publicação a eliminar.',
        ]);

        $response = $this
            ->actingAs($user, 'sanctum')
            ->deleteJson("/api/posts/{$post->id}");

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Publicação eliminada com sucesso.');

        $this->assertDatabaseMissing('posts', [
            'id' => $post->id,
        ]);
    }

    public function test_user_cannot_delete_post_from_another_user(): void
    {
        $author = User::factory()->create();
        $otherUser = User::factory()->create();
        $post = Post::create([
            'user_id' => $author->id,
            'content' => 'Publicação protegida.',
        ]);

        $response = $this
            ->actingAs($otherUser, 'sanctum')
            ->deleteJson("/api/posts/{$post->id}");

        $response->assertForbidden();

        $this->assertDatabaseHas('posts', [
            'id' => $post->id,
        ]);
    }
}
