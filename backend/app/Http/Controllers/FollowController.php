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
        $user = $this->followService->follow($request->user(), $id);

        return response()->json([
            'message' => 'Utilizador seguido com sucesso.',
            'data' => $user->toArray(),
        ], 201);
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
            $this->followService->followers($id, (int) $request->integer('per_page', 15))
        );
    }

    public function following(Request $request, int $id): JsonResponse
    {
        return response()->json(
            $this->followService->following($id, (int) $request->integer('per_page', 15))
        );
    }
}
