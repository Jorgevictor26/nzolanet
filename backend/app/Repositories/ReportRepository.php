<?php

namespace App\Repositories;

use App\Models\Report;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ReportRepository
{
    /**
     * @return LengthAwarePaginator<int, Report>
     */
    public function paginate(int $perPage): LengthAwarePaginator
    {
        return Report::query()
            ->with(['comment', 'reportedUser:id,name,profile_photo', 'reporter:id,name,profile_photo'])
            ->whereNotNull('comment_id')
            ->latest()
            ->paginate($perPage);
    }

    public function findById(int $id): ?Report
    {
        return Report::query()
            ->with(['comment', 'reportedUser:id,name,profile_photo', 'reporter:id,name,profile_photo'])
            ->whereNotNull('comment_id')
            ->find($id);
    }

    /**
     * @param  array{comment_id: int, reported_user_id: int, reporter_id: int, reason: string, status?: string}  $data
     */
    public function create(array $data): Report
    {
        return Report::create($data)
            ->refresh()
            ->load(['comment', 'reportedUser:id,name,profile_photo', 'reporter:id,name,profile_photo']);
    }

    public function resolve(Report $report): Report
    {
        $report->fill(['status' => 'Resolvido'])->save();

        return $report->refresh()
            ->load(['comment', 'reportedUser:id,name,profile_photo', 'reporter:id,name,profile_photo']);
    }

    public function countByCommentId(int $commentId): int
    {
        return Report::query()
            ->where('comment_id', $commentId)
            ->count();
    }
}
