<?php

namespace Tests\Feature;

use App\Models\Comment;
use App\Models\Notification;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_baze_creates_notification_for_post_author(): void
    {
        $actor = User::factory()->create(['name' => 'Bazeador']);
        $author = User::factory()->create();
        $post = Post::create([
            'user_id' => $author->id,
            'content' => 'Publicação com baze.',
        ]);

        $this
            ->actingAs($actor, 'sanctum')
            ->postJson("/api/posts/{$post->id}/like")
            ->assertCreated();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $author->id,
            'actor_id' => $actor->id,
            'post_id' => $post->id,
            'type' => 'baze',
            'title' => 'Novo baze',
            'body' => 'Bazeador deu baze na tua publicação.',
        ]);
    }

    public function test_new_comment_creates_notification_for_post_author(): void
    {
        $actor = User::factory()->create(['name' => 'Comentador']);
        $author = User::factory()->create();
        $post = Post::create([
            'user_id' => $author->id,
            'content' => 'Publicação comentável.',
        ]);

        $this
            ->actingAs($actor, 'sanctum')
            ->postJson("/api/posts/{$post->id}/comments", [
                'content' => 'Comentário real.',
            ])
            ->assertCreated();

        $comment = Comment::firstOrFail();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $author->id,
            'actor_id' => $actor->id,
            'post_id' => $post->id,
            'comment_id' => $comment->id,
            'type' => 'comment',
            'title' => 'Novo comentário',
            'body' => 'Comentador comentou na tua publicação.',
        ]);
    }

    public function test_new_follower_creates_notification_for_followed_user(): void
    {
        $follower = User::factory()->create(['name' => 'Seguidor']);
        $followed = User::factory()->create();

        $this
            ->actingAs($follower, 'sanctum')
            ->postJson("/api/users/{$followed->id}/follow")
            ->assertCreated();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $followed->id,
            'actor_id' => $follower->id,
            'type' => 'follow',
            'title' => 'Novo seguidor',
            'body' => 'Seguidor começou a seguir-te.',
        ]);
    }

    public function test_user_can_poll_own_notifications(): void
    {
        $user = User::factory()->create();
        $actor = User::factory()->create();

        Notification::create([
            'user_id' => $user->id,
            'actor_id' => $actor->id,
            'type' => 'follow',
            'title' => 'Novo seguidor',
            'body' => 'Alguém começou a seguir-te.',
        ]);

        $response = $this
            ->actingAs($user, 'sanctum')
            ->getJson('/api/notifications');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.type', 'follow')
            ->assertJsonPath('data.0.is_read', false)
            ->assertJsonPath('meta.unread', 1);
    }

    public function test_user_can_mark_all_notifications_as_read(): void
    {
        $user = User::factory()->create();
        Notification::create([
            'user_id' => $user->id,
            'type' => 'baze',
            'title' => 'Novo baze',
            'body' => 'Recebeste uma baze.',
        ]);

        $response = $this
            ->actingAs($user, 'sanctum')
            ->postJson('/api/notifications/mark-read');

        $response
            ->assertOk()
            ->assertJsonPath('unread', 0);

        $this->assertDatabaseMissing('notifications', [
            'user_id' => $user->id,
            'read_at' => null,
        ]);
    }

    public function test_user_can_clear_own_notifications(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        Notification::create([
            'user_id' => $user->id,
            'type' => 'comment',
            'title' => 'Novo comentário',
            'body' => 'Comentaram numa publicação tua.',
        ]);
        Notification::create([
            'user_id' => $otherUser->id,
            'type' => 'follow',
            'title' => 'Novo seguidor',
            'body' => 'Outra notificação.',
        ]);

        $this
            ->actingAs($user, 'sanctum')
            ->deleteJson('/api/notifications')
            ->assertOk();

        $this->assertDatabaseMissing('notifications', [
            'user_id' => $user->id,
        ]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $otherUser->id,
        ]);
    }

    public function test_users_do_not_receive_notifications_from_their_own_actions(): void
    {
        $author = User::factory()->create();
        $post = Post::create([
            'user_id' => $author->id,
            'content' => 'Publicação própria.',
        ]);

        $this
            ->actingAs($author, 'sanctum')
            ->postJson("/api/posts/{$post->id}/like")
            ->assertCreated();

        $this
            ->actingAs($author, 'sanctum')
            ->postJson("/api/posts/{$post->id}/comments", [
                'content' => 'Comentário próprio.',
            ])
            ->assertCreated();

        $this->assertDatabaseCount('notifications', 0);
        $this->assertDatabaseCount('likes', 1);
    }
}
