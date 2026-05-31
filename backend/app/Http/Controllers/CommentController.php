<?php

namespace App\Http\Controllers;

use App\DTOs\CreateCommentDTO;
use App\DTOs\UpdateCommentDTO;
use App\Http\Requests\StoreCommentRequest;
use App\Http\Requests\UpdateCommentRequest;
use App\Services\CommentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function __construct(
        private readonly CommentService $commentService,
    ) {}

    public function index(Request $request, int $postId): JsonResponse
    {
        return response()->json(
            $this->commentService->listByPost($postId, (int) $request->integer('per_page', 15))
        );
    }

    public function store(StoreCommentRequest $request, int $postId): JsonResponse
    {
        $comment = $this->commentService->create(
            $request->user(),
            new CreateCommentDTO(
                postId: $postId,
                content: $request->validated('content'),
            ),
        );

        return response()->json([
            'data' => $comment->toArray(),
        ], 201);
    }

    public function update(UpdateCommentRequest $request, int $id): JsonResponse
    {
        $comment = $this->commentService->update(
            $request->user(),
            $id,
            new UpdateCommentDTO(
                content: $request->validated('content'),
            ),
        );

        return response()->json([
            'data' => $comment->toArray(),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->commentService->delete($request->user(), $id);

        return response()->json([
            'message' => 'Comentário eliminado com sucesso.',
        ]);
    }
}
