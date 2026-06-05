<?php

namespace App\Http\Controllers;

use App\Services\ModerationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ModerationController extends Controller
{
    public function __construct(
        private readonly ModerationService $moderationService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json(
            $this->moderationService->listReports((int) $request->integer('per_page', 15))
        );
    }

    public function approve(Request $request, int $id): JsonResponse
    {
        $report = $this->moderationService->approveComment($id);

        return response()->json([
            'data' => $report->toArray(),
        ]);
    }

    public function removeComment(Request $request, int $id): JsonResponse
    {
        $this->moderationService->removeComment($id);

        return response()->json([
            'message' => 'Comentário removido com sucesso.',
        ]);
    }

    public function warnUser(Request $request, int $id): JsonResponse
    {
        $report = $this->moderationService->warnUser($id);

        return response()->json([
            'data' => $report->toArray(),
        ]);
    }
}
