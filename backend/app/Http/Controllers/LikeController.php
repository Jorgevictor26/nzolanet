<?php

namespace App\Http\Controllers;

use App\Services\LikeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LikeController extends Controller
{
    public function __construct(
        private readonly LikeService $likeService,
    ) {}

    public function store(Request $request, int $id): JsonResponse
    {
        $post = $this->likeService->like($request->user(), $id);

        return response()->json([
            'message' => 'Baze adicionada com sucesso.',
            'data' => $post->toArray(),
        ], 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $post = $this->likeService->unlike($request->user(), $id);

        return response()->json([
            'message' => 'Baze removida com sucesso.',
            'data' => $post->toArray(),
        ]);
    }
}
