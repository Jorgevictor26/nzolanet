<?php

namespace Tests\Feature;

use App\Models\Comment;
use App\Models\Post;
use App\Models\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_reports(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $report = $this->createReport();

        $response = $this
            ->actingAs($admin, 'sanctum')
            ->getJson('/api/moderation/reports');

        $response
            ->assertOk()
            ->assertJsonPath('data.0.id', $report->id)
            ->assertJsonPath('data.0.comment_id', $report->comment_id)
            ->assertJsonPath('data.0.reason', 'Spam/Publicidade')
            ->assertJsonPath('data.0.status', 'Pendente')
            ->assertJsonPath('data.0.reports_count', 1)
            ->assertJsonPath('meta.total', 1);
    }

    public function test_non_admin_cannot_list_reports(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user, 'sanctum')
            ->getJson('/api/moderation/reports');

        $response
            ->assertForbidden()
            ->assertJsonPath('message', 'Acesso não autorizado.');
    }

    public function test_authenticated_user_can_submit_comment_report(): void
    {
        $reporter = User::factory()->create();
        $comment = $this->createComment();

        $response = $this
            ->actingAs($reporter, 'sanctum')
            ->postJson("/api/comments/{$comment->id}/report", [
                'reason' => 'Assédio',
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'Denúncia submetida com sucesso.');

        $this->assertDatabaseHas('reports', [
            'comment_id' => $comment->id,
            'reported_user_id' => $comment->user_id,
            'reporter_id' => $reporter->id,
            'reason' => 'Assédio',
            'status' => 'Pendente',
        ]);
    }

    public function test_authenticated_user_cannot_submit_post_report(): void
    {
        $reporter = User::factory()->create();
        $author = User::factory()->create();
        $post = Post::create([
            'user_id' => $author->id,
            'content' => 'Publicação denunciada.',
        ]);

        $response = $this
            ->actingAs($reporter, 'sanctum')
            ->postJson("/api/posts/{$post->id}/report", [
                'reason' => 'Conteúdo Falso',
            ]);

        $response->assertNotFound();

        $this->assertDatabaseCount('reports', 0);
    }

    public function test_admin_can_approve_report_without_removing_comment(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $report = $this->createReport();

        $response = $this
            ->actingAs($admin, 'sanctum')
            ->postJson("/api/moderation/reports/{$report->id}/approve");

        $response
            ->assertOk()
            ->assertJsonPath('data.status', 'Resolvido');

        $this->assertDatabaseHas('comments', ['id' => $report->comment_id]);
        $this->assertDatabaseHas('reports', [
            'id' => $report->id,
            'status' => 'Resolvido',
        ]);
    }

    public function test_admin_can_warn_user_and_resolve_report(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $report = $this->createReport();

        $response = $this
            ->actingAs($admin, 'sanctum')
            ->postJson("/api/moderation/reports/{$report->id}/warn");

        $response
            ->assertOk()
            ->assertJsonPath('data.status', 'Resolvido');
    }

    public function test_admin_can_remove_reported_comment(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $report = $this->createReport();

        $response = $this
            ->actingAs($admin, 'sanctum')
            ->deleteJson("/api/moderation/reports/{$report->id}");

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Comentário removido com sucesso.');

        $this->assertDatabaseMissing('comments', ['id' => $report->comment_id]);
        $this->assertDatabaseMissing('reports', ['id' => $report->id]);
    }

    private function createReport(): Report
    {
        $comment = $this->createComment();
        $reporter = User::factory()->create();

        return Report::create([
            'comment_id' => $comment->id,
            'reported_user_id' => $comment->user_id,
            'reporter_id' => $reporter->id,
            'reason' => 'Spam/Publicidade',
        ]);
    }

    private function createComment(): Comment
    {
        $author = User::factory()->create();
        $post = Post::create([
            'user_id' => $author->id,
            'content' => 'Publicação para denúncia.',
        ]);

        return Comment::create([
            'user_id' => $author->id,
            'post_id' => $post->id,
            'content' => 'Comentário denunciado.',
        ]);
    }
}
