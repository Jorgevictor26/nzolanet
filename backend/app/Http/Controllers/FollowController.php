<?php

namespace App\Http\Controllers;

use App\Services\FollowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FollowController extends Controller
{
    public function __construct(
        private readonly FollowService $followService,
    ) {}

    public function follow(Request $request, int $id): JsonResponse
    {
        $result = $this->followService->follow($request->user(), $id);

        return response()->json([
            'message' => $result['message'],
            'data' => $result['user']->toArray(),
        ], $result['status']);
    }

    public function unfollow(Request $request, int $id): JsonResponse
    {
        $this->followService->unfollow($request->user(), $id);

        return response()->json([
            'message' => 'Utilizador removido da lista de seguidos com sucesso.',
        ]);
    }

    public function followers(Request $request, int $id): JsonResponse
    {
        return response()->json(
            $this->followService->followers($id, (int) $request->integer('per_page', 15), $request->user())
        );
    }

    public function following(Request $request, int $id): JsonResponse
    {
        return response()->json(
            $this->followService->following($id, (int) $request->integer('per_page', 15), $request->user())
        );
    }

    public function acceptRequest(Request $request, int $id): JsonResponse
    {
        return response()->json([
            'message' => 'Pedido de seguimento aceite.',
            'data' => $this->followService->acceptRequest($request->user(), $id),
        ]);
    }

    public function rejectRequest(Request $request, int $id): JsonResponse
    {
        return response()->json([
            'message' => 'Pedido de seguimento rejeitado.',
            'data' => $this->followService->rejectRequest($request->user(), $id),
        ]);
    }
}
