<?php

namespace Tests\Feature;

use App\Models\Comment;
use App\Models\Follow;
use App\Models\Like;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PostTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_list_feed_paginated_with_author_and_counters(): void
    {
        $viewer = User::factory()->create();
        $author = User::factory()->create([
            'name' => 'Autor Nzola',
            'profile_photo' => 'profile-photos/author.png',
        ]);
        $oldPost = Post::create([
            'user_id' => $author->id,
            'content' => 'Publicação antiga.',
        ]);
        $oldPost->forceFill([
            'created_at' => now()->subDay(),
            'updated_at' => now()->subDay(),
        ])->save();

        $newPost = Post::create([
            'user_id' => $author->id,
            'content' => 'Publicação recente.',
            'image' => 'post-images/recent.png',
            'video' => 'post-videos/recent.mp4',
        ]);
        $newPost->forceFill([
            'created_at' => now(),
            'updated_at' => now(),
        ])->save();

        Like::create(['user_id' => $viewer->id, 'post_id' => $newPost->id]);
        Comment::create(['user_id' => $viewer->id, 'post_id' => $newPost->id, 'content' => 'Comentário']);

        $response = $this
            ->actingAs($viewer, 'sanctum')
            ->getJson('/api/posts?per_page=1');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $newPost->id)
            ->assertJsonPath('data.0.author.name', 'Autor Nzola')
            ->assertJsonPath('data.0.author.profile_photo', 'profile-photos/author.png')
            ->assertJsonPath('data.0.content', 'Publicação recente.')
            ->assertJsonPath('data.0.image', 'post-images/recent.png')
            ->assertJsonPath('data.0.video', 'post-videos/recent.mp4')
            ->assertJsonPath('data.0.likes_count', 1)
            ->assertJsonPath('data.0.comments_count', 1)
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.per_page', 1)
            ->assertJsonPath('meta.total', 2);

        $this->assertDatabaseHas('posts', [
            'id' => $oldPost->id,
        ]);
    }

    public function test_authenticated_user_can_list_posts_from_a_public_profile(): void
    {
        $viewer = User::factory()->create();
        $profile = User::factory()->create([
            'name' => 'Perfil Visitado',
            'privacy' => 'public',
        ]);
        $otherUser = User::factory()->create();

        $profilePost = Post::create([
            'user_id' => $profile->id,
            'content' => 'Publicação real do perfil visitado.',
        ]);
        Post::create([
            'user_id' => $otherUser->id,
            'content' => 'Publicação de outro utilizador.',
        ]);

        $response = $this
            ->actingAs($viewer, 'sanctum')
            ->getJson("/api/users/{$profile->id}/posts?per_page=10");

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $profilePost->id)
            ->assertJsonPath('data.0.user_id', $profile->id)
            ->assertJsonPath('data.0.author.name', 'Perfil Visitado')
            ->assertJsonPath('data.0.content', 'Publicação real do perfil visitado.')
            ->assertJsonPath('meta.total', 1);
    }

    public function test_authenticated_user_cannot_list_posts_from_a_private_profile(): void
    {
        $viewer = User::factory()->create();
        $profile = User::factory()->create([
            'privacy' => 'private',
        ]);

        Post::create([
            'user_id' => $profile->id,
            'content' => 'Publicação privada.',
        ]);

        $response = $this
            ->actingAs($viewer, 'sanctum')
            ->getJson("/api/users/{$profile->id}/posts");

        $response->assertForbidden();
    }

    public function test_authenticated_follower_can_list_posts_from_a_private_profile(): void
    {
        $viewer = User::factory()->create();
        $profile = User::factory()->create([
            'privacy' => 'private',
        ]);

        Follow::create([
            'follower_id' => $viewer->id,
            'following_id' => $profile->id,
        ]);

        $profilePost = Post::create([
            'user_id' => $profile->id,
            'content' => 'Publicação privada para seguidores.',
        ]);

        $response = $this
            ->actingAs($viewer, 'sanctum')
            ->getJson("/api/users/{$profile->id}/posts");

        $response
            ->assertOk()
            ->assertJsonPath('data.0.id', $profilePost->id)
            ->assertJsonPath('data.0.content', 'Publicação privada para seguidores.');
    }

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
