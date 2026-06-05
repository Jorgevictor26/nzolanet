<?php

namespace App\DTOs;

use App\Models\Report;

readonly class ReportDTO
{
    public function __construct(
        public int $id,
        public ?int $commentId,
        public ?int $postId,
        public string $commentContent,
        public int $reportedUserId,
        public string $reportedUserName,
        public ?string $reportedUserAvatar,
        public string $reason,
        public string $status,
        public int $reportsCount,
        public string $createdAt,
    ) {}

    public static function fromModel(Report $report): self
    {
        return new self(
            id: $report->id,
            commentId: $report->comment_id,
            postId: $report->post_id,
            commentContent: $report->comment?->content ?? $report->post?->content ?? '',
            reportedUserId: $report->reported_user_id,
            reportedUserName: $report->reportedUser?->name ?? 'Utilizador',
            reportedUserAvatar: $report->reportedUser?->profile_photo,
            reason: $report->reason,
            status: $report->status,
            reportsCount: (int) ($report->reports_count ?? 0),
            createdAt: $report->created_at?->toISOString() ?? '',
        );
    }

    /**
     * @return array<string, int|string|null>
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'comment_id' => $this->commentId,
            'post_id' => $this->postId,
            'comment' => $this->commentContent,
            'user' => $this->reportedUserName,
            'avatar' => $this->reportedUserAvatar,
            'reason' => $this->reason,
            'status' => $this->status,
            'reports_count' => $this->reportsCount,
            'created_at' => $this->createdAt,
        ];
    }
}
