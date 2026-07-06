<?php

namespace App\Http\Controllers;

use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(
        private readonly NotificationService $notificationService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json(
            $this->notificationService->list($request->user(), (int) $request->integer('per_page', 20))
        );
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $unread = $this->notificationService->markAllAsRead($request->user());

        return response()->json([
            'message' => 'Notificações marcadas como lidas.',
            'unread' => $unread,
        ]);
    }

    public function clear(Request $request): JsonResponse
    {
        $this->notificationService->clear($request->user());

        return response()->json([
            'message' => 'Notificações limpas.',
        ]);
    }
}
