<?php

namespace App\Services;

use App\DTOs\ReportDTO;
use App\Models\Comment;
use App\Models\Post;
use App\Models\Report;
use App\Models\User;
use App\Repositories\CommentRepository;
use App\Repositories\PostRepository;
use App\Repositories\ReportRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class ModerationService
{
    public function __construct(
        private readonly ReportRepository $reports,
        private readonly CommentRepository $comments,
        private readonly PostRepository $posts,
    ) {}

    /**
     * @return array{data: array<int, array<string, mixed>>, meta: array<string, int>}
     */
    public function listReports(int $perPage): array
    {
        return $this->formatPaginatedReports(
            $this->reports->paginate($this->normalizePerPage($perPage))
        );
    }

    public function approveComment(int $reportId): ReportDTO
    {
        return $this->resolveReport($reportId);
    }

    public function removeComment(int $reportId): void
    {
        $report = $this->findReportOrFail($reportId);

        if ($report->comment_id) {
            $this->comments->delete($this->findCommentOrFail($report->comment_id));
            return;
        }

        if ($report->post_id) {
            $this->posts->delete($this->findPostOrFail($report->post_id));
        }
    }

    public function warnUser(int $reportId): ReportDTO
    {
        return $this->resolveReport($reportId);
    }

    public function submitReport(User $reporter, int $commentId, string $reason): ReportDTO
    {
        $comment = $this->findCommentOrFail($commentId);

        $report = $this->reports->create([
            'comment_id' => $comment->id,
            'reported_user_id' => $comment->user_id,
            'reporter_id' => $reporter->id,
            'reason' => $reason,
        ]);

        return ReportDTO::fromModel($this->withReportsCount($report));
    }

    public function submitPostReport(User $reporter, int $postId, string $reason): ReportDTO
    {
        $post = $this->findPostOrFail($postId);

        $report = $this->reports->create([
            'post_id' => $post->id,
            'reported_user_id' => $post->user_id,
            'reporter_id' => $reporter->id,
            'reason' => $reason,
        ]);

        return ReportDTO::fromModel($this->withReportsCount($report));
    }

    private function resolveReport(int $reportId): ReportDTO
    {
        $report = $this->reports->resolve($this->findReportOrFail($reportId));

        return ReportDTO::fromModel($this->withReportsCount($report));
    }

    private function findReportOrFail(int $id): Report
    {
        $report = $this->reports->findById($id);

        if (! $report) {
            throw (new ModelNotFoundException)->setModel(Report::class, [$id]);
        }

        return $report;
    }

    private function findCommentOrFail(int $id): Comment
    {
        $comment = $this->comments->findById($id);

        if (! $comment) {
            throw (new ModelNotFoundException)->setModel(Comment::class, [$id]);
        }

        return $comment;
    }

    private function findPostOrFail(int $id): Post
    {
        $post = $this->posts->findById($id);

        if (! $post) {
            throw (new ModelNotFoundException)->setModel(Post::class, [$id]);
        }

        return $post;
    }

    private function withReportsCount(Report $report): Report
    {
        $reportsCount = $report->comment_id
            ? $this->reports->countByCommentId($report->comment_id)
            : ($report->post_id ? $this->reports->countByPostId($report->post_id) : 0);

        $report->setAttribute('reports_count', $reportsCount);

        return $report;
    }

    private function normalizePerPage(int $perPage): int
    {
        return max(1, min($perPage, 50));
    }

    /**
     * @param  LengthAwarePaginator<int, Report>  $paginator
     * @return array{data: array<int, array<string, mixed>>, meta: array<string, int>}
     */
    private function formatPaginatedReports(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => $paginator->getCollection()
                ->map(fn (Report $report): array => ReportDTO::fromModel($this->withReportsCount($report))->toArray())
                ->values()
                ->all(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }
}
