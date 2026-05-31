<?php

namespace Tests\Feature;

use App\Models\Follow;
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
            ->assertJsonPath('data.name', 'Nzola User');

        $this->assertDatabaseHas('follows', [
            'follower_id' => $follower->id,
            'following_id' => $following->id,
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
}
