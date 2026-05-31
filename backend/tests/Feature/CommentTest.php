<?php

namespace Tests\Feature;

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommentTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_comment_on_existing_post(): void
    {
        $author = User::factory()->create([
            'name' => 'Comentador Nzola',
            'profile_photo' => 'profile-photos/commenter.png',
        ]);
        $post = Post::create([
            'user_id' => User::factory()->create()->id,
            'content' => 'Publicação alvo.',
        ]);

        $response = $this
            ->actingAs($author, 'sanctum')
            ->postJson("/api/posts/{$post->id}/comments", [
                'content' => 'Comentário inicial.',
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.user_id', $author->id)
            ->assertJsonPath('data.post_id', $post->id)
            ->assertJsonPath('data.author.name', 'Comentador Nzola')
            ->assertJsonPath('data.author.profile_photo', 'profile-photos/commenter.png')
            ->assertJsonPath('data.content', 'Comentário inicial.');

        $this->assertDatabaseHas('comments', [
            'user_id' => $author->id,
            'post_id' => $post->id,
            'content' => 'Comentário inicial.',
        ]);
    }

    public function test_cannot_comment_on_missing_post(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user, 'sanctum')
            ->postJson('/api/posts/999/comments', [
                'content' => 'Comentário sem publicação.',
            ]);

        $response->assertNotFound();
    }

    public function test_comment_content_is_required(): void
    {
        $user = User::factory()->create();
        $post = Post::create([
            'user_id' => User::factory()->create()->id,
            'content' => 'Publicação alvo.',
        ]);

        $response = $this
            ->actingAs($user, 'sanctum')
            ->postJson("/api/posts/{$post->id}/comments", []);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['content']);
    }

    public function test_comment_author_can_update_own_comment(): void
    {
        $author = User::factory()->create();
        $comment = Comment::create([
            'user_id' => $author->id,
            'post_id' => Post::create([
                'user_id' => User::factory()->create()->id,
                'content' => 'Publicação alvo.',
            ])->id,
            'content' => 'Comentário antigo.',
        ]);

        $response = $this
            ->actingAs($author, 'sanctum')
            ->putJson("/api/comments/{$comment->id}", [
                'content' => 'Comentário atualizado.',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $comment->id)
            ->assertJsonPath('data.content', 'Comentário atualizado.');

        $this->assertDatabaseHas('comments', [
            'id' => $comment->id,
            'content' => 'Comentário atualizado.',
        ]);
    }

    public function test_user_cannot_update_comment_from_another_user(): void
    {
        $author = User::factory()->create();
        $otherUser = User::factory()->create();
        $comment = Comment::create([
            'user_id' => $author->id,
            'post_id' => Post::create([
                'user_id' => User::factory()->create()->id,
                'content' => 'Publicação alvo.',
            ])->id,
            'content' => 'Comentário protegido.',
        ]);

        $response = $this
            ->actingAs($otherUser, 'sanctum')
            ->putJson("/api/comments/{$comment->id}", [
                'content' => 'Tentativa indevida.',
            ]);

        $response->assertForbidden();

        $this->assertDatabaseHas('comments', [
            'id' => $comment->id,
            'content' => 'Comentário protegido.',
        ]);
    }

    public function test_comment_author_can_delete_own_comment(): void
    {
        $author = User::factory()->create();
        $comment = Comment::create([
            'user_id' => $author->id,
            'post_id' => Post::create([
                'user_id' => User::factory()->create()->id,
                'content' => 'Publicação alvo.',
            ])->id,
            'content' => 'Comentário a eliminar.',
        ]);

        $response = $this
            ->actingAs($author, 'sanctum')
            ->deleteJson("/api/comments/{$comment->id}");

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Comentário eliminado com sucesso.');

        $this->assertDatabaseMissing('comments', [
            'id' => $comment->id,
        ]);
    }

    public function test_user_cannot_delete_comment_from_another_user(): void
    {
        $author = User::factory()->create();
        $otherUser = User::factory()->create();
        $comment = Comment::create([
            'user_id' => $author->id,
            'post_id' => Post::create([
                'user_id' => User::factory()->create()->id,
                'content' => 'Publicação alvo.',
            ])->id,
            'content' => 'Comentário protegido.',
        ]);

        $response = $this
            ->actingAs($otherUser, 'sanctum')
            ->deleteJson("/api/comments/{$comment->id}");

        $response->assertForbidden();

        $this->assertDatabaseHas('comments', [
            'id' => $comment->id,
        ]);
    }
}
