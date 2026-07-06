<?php

namespace Tests\Feature;

use App\Models\Follow;
use App\Models\FollowRequest;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FollowTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_follow_another_user(): void
    {
        $follower = User::factory()->create();
        $following = User::factory()->create([
            'name' => 'Nzola User',
        ]);

        $response = $this
            ->actingAs($follower, 'sanctum')
            ->postJson("/api/users/{$following->id}/follow");

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'Utilizador seguido com sucesso.')
            ->assertJsonPath('data.id', $following->id)
            ->assertJsonPath('data.name', 'Nzola User')
            ->assertJsonPath('data.follow_status', 'following')
            ->assertJsonPath('data.can_view_content', true);

        $this->assertDatabaseHas('follows', [
            'follower_id' => $follower->id,
            'following_id' => $following->id,
        ]);
        $this->assertDatabaseCount('follow_requests', 0);
    }

    public function test_private_profile_follow_creates_pending_request_without_following(): void
    {
        $follower = User::factory()->create(['name' => 'Solicitante']);
        $following = User::factory()->create([
            'name' => 'Perfil Privado',
            'privacy' => 'private',
        ]);

        $response = $this
            ->actingAs($follower, 'sanctum')
            ->postJson("/api/users/{$following->id}/follow");

        $response
            ->assertStatus(202)
            ->assertJsonPath('message', 'Pedido de seguimento enviado.')
            ->assertJsonPath('data.id', $following->id)
            ->assertJsonPath('data.follow_status', 'pending')
            ->assertJsonPath('data.is_followed_by_viewer', false)
            ->assertJsonPath('data.can_view_content', false);

        $this->assertDatabaseMissing('follows', [
            'follower_id' => $follower->id,
            'following_id' => $following->id,
        ]);
        $this->assertDatabaseHas('follow_requests', [
            'follower_id' => $follower->id,
            'following_id' => $following->id,
            'status' => FollowRequest::STATUS_PENDING,
        ]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $following->id,
            'actor_id' => $follower->id,
            'type' => 'follow_request',
            'title' => 'Pedido de seguimento',
            'body' => 'Solicitante quer seguir-te.',
        ]);
    }

    public function test_accepting_private_follow_request_creates_follow_and_unlocks_content(): void
    {
        $follower = User::factory()->create();
        $following = User::factory()->create([
            'name' => 'Perfil Privado',
            'privacy' => 'private',
        ]);
        Post::create([
            'user_id' => $following->id,
            'content' => 'Conteudo privado.',
        ]);
        $request = FollowRequest::create([
            'follower_id' => $follower->id,
            'following_id' => $following->id,
            'status' => FollowRequest::STATUS_PENDING,
        ]);

        $response = $this
            ->actingAs($following, 'sanctum')
            ->postJson("/api/follow-requests/{$request->id}/accept");

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Pedido de seguimento aceite.')
            ->assertJsonPath('data.id', $request->id)
            ->assertJsonPath('data.status', FollowRequest::STATUS_ACCEPTED);

        $this->assertDatabaseHas('follows', [
            'follower_id' => $follower->id,
            'following_id' => $following->id,
        ]);
        $this->assertDatabaseHas('follow_requests', [
            'id' => $request->id,
            'status' => FollowRequest::STATUS_ACCEPTED,
        ]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $follower->id,
            'actor_id' => $following->id,
            'type' => 'follow_request_accepted',
        ]);

        $this
            ->actingAs($follower, 'sanctum')
            ->getJson("/api/users/{$following->id}")
            ->assertOk()
            ->assertJsonPath('data.can_view_content', true)
            ->assertJsonPath('data.follow_status', 'following');

        $this
            ->actingAs($follower, 'sanctum')
            ->getJson("/api/users/{$following->id}/posts")
            ->assertOk()
            ->assertJsonPath('meta.total', 1);
    }

    public function test_rejecting_private_follow_request_keeps_content_blocked(): void
    {
        $follower = User::factory()->create();
        $following = User::factory()->create([
            'privacy' => 'private',
        ]);
        $request = FollowRequest::create([
            'follower_id' => $follower->id,
            'following_id' => $following->id,
            'status' => FollowRequest::STATUS_PENDING,
        ]);

        $response = $this
            ->actingAs($following, 'sanctum')
            ->postJson("/api/follow-requests/{$request->id}/reject");

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Pedido de seguimento rejeitado.')
            ->assertJsonPath('data.id', $request->id)
            ->assertJsonPath('data.status', FollowRequest::STATUS_REJECTED);

        $this->assertDatabaseMissing('follows', [
            'follower_id' => $follower->id,
            'following_id' => $following->id,
        ]);
        $this->assertDatabaseHas('follow_requests', [
            'id' => $request->id,
            'status' => FollowRequest::STATUS_REJECTED,
        ]);
        $this->assertDatabaseHas('notifications', [
            'user_id' => $follower->id,
            'actor_id' => $following->id,
            'type' => 'follow_request_rejected',
        ]);

        $this
            ->actingAs($follower, 'sanctum')
            ->getJson("/api/users/{$following->id}")
            ->assertOk()
            ->assertJsonPath('data.can_view_content', false)
            ->assertJsonPath('data.follow_status', 'none');
    }

    public function test_only_request_owner_can_accept_or_reject_follow_request(): void
    {
        $follower = User::factory()->create();
        $following = User::factory()->create([
            'privacy' => 'private',
        ]);
        $otherUser = User::factory()->create();
        $request = FollowRequest::create([
            'follower_id' => $follower->id,
            'following_id' => $following->id,
            'status' => FollowRequest::STATUS_PENDING,
        ]);

        $this
            ->actingAs($otherUser, 'sanctum')
            ->postJson("/api/follow-requests/{$request->id}/accept")
            ->assertForbidden();

        $this
            ->actingAs($otherUser, 'sanctum')
            ->postJson("/api/follow-requests/{$request->id}/reject")
            ->assertForbidden();

        $this->assertDatabaseMissing('follows', [
            'follower_id' => $follower->id,
            'following_id' => $following->id,
        ]);
        $this->assertDatabaseHas('follow_requests', [
            'id' => $request->id,
            'status' => FollowRequest::STATUS_PENDING,
        ]);
    }

    public function test_authenticated_user_cannot_follow_self(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user, 'sanctum')
            ->postJson("/api/users/{$user->id}/follow");

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['user']);

        $this->assertDatabaseCount('follows', 0);
    }

    public function test_authenticated_user_cannot_follow_same_user_twice(): void
    {
        $follower = User::factory()->create();
        $following = User::factory()->create();

        Follow::create([
            'follower_id' => $follower->id,
            'following_id' => $following->id,
        ]);

        $response = $this
            ->actingAs($follower, 'sanctum')
            ->postJson("/api/users/{$following->id}/follow");

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['user']);

        $this->assertDatabaseCount('follows', 1);
    }

    public function test_authenticated_user_can_unfollow_user(): void
    {
        $follower = User::factory()->create();
        $following = User::factory()->create();

        Follow::create([
            'follower_id' => $follower->id,
            'following_id' => $following->id,
        ]);

        $response = $this
            ->actingAs($follower, 'sanctum')
            ->deleteJson("/api/users/{$following->id}/follow");

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Utilizador removido da lista de seguidos com sucesso.');

        $this->assertDatabaseMissing('follows', [
            'follower_id' => $follower->id,
            'following_id' => $following->id,
        ]);
    }

    public function test_can_list_user_followers_paginated(): void
    {
        $viewer = User::factory()->create();
        $target = User::factory()->create();
        $followers = User::factory()->count(3)->create();

        $followers->each(fn (User $follower) => Follow::create([
            'follower_id' => $follower->id,
            'following_id' => $target->id,
        ]));

        $response = $this
            ->actingAs($viewer, 'sanctum')
            ->getJson("/api/users/{$target->id}/followers?per_page=2");

        $response
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonPath('meta.total', 3);
    }

    public function test_cannot_list_private_profile_followers_without_access(): void
    {
        $viewer = User::factory()->create();
        $target = User::factory()->create([
            'privacy' => 'private',
        ]);

        Follow::create([
            'follower_id' => User::factory()->create()->id,
            'following_id' => $target->id,
        ]);

        $response = $this
            ->actingAs($viewer, 'sanctum')
            ->getJson("/api/users/{$target->id}/followers");

        $response
            ->assertForbidden()
            ->assertJsonPath('message', 'Este perfil é privado.');
    }

    public function test_follower_can_list_private_profile_followers(): void
    {
        $viewer = User::factory()->create();
        $target = User::factory()->create([
            'privacy' => 'private',
        ]);
        $otherFollower = User::factory()->create();

        Follow::create([
            'follower_id' => $viewer->id,
            'following_id' => $target->id,
        ]);
        Follow::create([
            'follower_id' => $otherFollower->id,
            'following_id' => $target->id,
        ]);

        $response = $this
            ->actingAs($viewer, 'sanctum')
            ->getJson("/api/users/{$target->id}/followers");

        $response
            ->assertOk()
            ->assertJsonPath('meta.total', 2);
    }

    public function test_can_list_users_followed_by_user_paginated(): void
    {
        $viewer = User::factory()->create();
        $target = User::factory()->create();
        $following = User::factory()->count(3)->create();

        $following->each(fn (User $followed) => Follow::create([
            'follower_id' => $target->id,
            'following_id' => $followed->id,
        ]));

        $response = $this
            ->actingAs($viewer, 'sanctum')
            ->getJson("/api/users/{$target->id}/following?per_page=2");

        $response
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonPath('meta.total', 3);
    }

    public function test_cannot_list_private_profile_following_without_access(): void
    {
        $viewer = User::factory()->create();
        $target = User::factory()->create([
            'privacy' => 'private',
        ]);

        Follow::create([
            'follower_id' => $target->id,
            'following_id' => User::factory()->create()->id,
        ]);

        $response = $this
            ->actingAs($viewer, 'sanctum')
            ->getJson("/api/users/{$target->id}/following");

        $response
            ->assertForbidden()
            ->assertJsonPath('message', 'Este perfil é privado.');
    }

    public function test_admin_can_list_private_profile_following(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $target = User::factory()->create([
            'privacy' => 'private',
        ]);

        Follow::create([
            'follower_id' => $target->id,
            'following_id' => User::factory()->create()->id,
        ]);

        $response = $this
            ->actingAs($admin, 'sanctum')
            ->getJson("/api/users/{$target->id}/following");

        $response
            ->assertOk()
            ->assertJsonPath('meta.total', 1);
    }
}
