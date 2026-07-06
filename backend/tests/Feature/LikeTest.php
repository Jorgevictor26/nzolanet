<?php

namespace Tests\Feature;

use App\Models\Like;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LikeTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_give_baze_to_post(): void
    {
        $user = User::factory()->create();
        $post = Post::create([
            'user_id' => User::factory()->create()->id,
            'content' => 'Publicação para receber baze.',
        ]);

        $response = $this
            ->actingAs($user, 'sanctum')
            ->postJson("/api/posts/{$post->id}/like");

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'Baze adicionada com sucesso.')
            ->assertJsonPath('data.id', $post->id)
            ->assertJsonPath('data.likes_count', 1)
            ->assertJsonPath('data.is_liked_by_viewer', true);

        $this->assertDatabaseHas('likes', [
            'user_id' => $user->id,
            'post_id' => $post->id,
        ]);
    }

    public function test_authenticated_user_cannot_give_baze_twice_to_same_post(): void
    {
        $user = User::factory()->create();
        $post = Post::create([
            'user_id' => User::factory()->create()->id,
            'content' => 'Publicação já curtida.',
        ]);
        Like::create([
            'user_id' => $user->id,
            'post_id' => $post->id,
        ]);

        $response = $this
            ->actingAs($user, 'sanctum')
            ->postJson("/api/posts/{$post->id}/like");

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['post']);

        $this->assertDatabaseCount('likes', 1);
    }

    public function test_authenticated_user_can_remove_baze_from_post(): void
    {
        $user = User::factory()->create();
        $post = Post::create([
            'user_id' => User::factory()->create()->id,
            'content' => 'Publicação para remover baze.',
        ]);
        Like::create([
            'user_id' => $user->id,
            'post_id' => $post->id,
        ]);

        $response = $this
            ->actingAs($user, 'sanctum')
            ->deleteJson("/api/posts/{$post->id}/like");

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Baze removida com sucesso.')
            ->assertJsonPath('data.id', $post->id)
            ->assertJsonPath('data.likes_count', 0)
            ->assertJsonPath('data.is_liked_by_viewer', false);

        $this->assertDatabaseMissing('likes', [
            'user_id' => $user->id,
            'post_id' => $post->id,
        ]);
    }

    public function test_feed_marks_posts_liked_by_viewer(): void
    {
        $viewer = User::factory()->create();
        $author = User::factory()->create();
        $likedPost = Post::create([
            'user_id' => $author->id,
            'content' => 'Publicação com baze.',
        ]);
        $likedPost->forceFill([
            'created_at' => now()->subMinute(),
            'updated_at' => now()->subMinute(),
        ])->save();

        $plainPost = Post::create([
            'user_id' => $author->id,
            'content' => 'Publicação sem baze.',
        ]);
        $plainPost->forceFill([
            'created_at' => now(),
            'updated_at' => now(),
        ])->save();

        Like::create([
            'user_id' => $viewer->id,
            'post_id' => $likedPost->id,
        ]);

        $response = $this
            ->actingAs($viewer, 'sanctum')
            ->getJson('/api/posts?per_page=10');

        $response
            ->assertOk()
            ->assertJsonPath('data.0.id', $plainPost->id)
            ->assertJsonPath('data.0.is_liked_by_viewer', false)
            ->assertJsonPath('data.1.id', $likedPost->id)
            ->assertJsonPath('data.1.is_liked_by_viewer', true);
    }
}
