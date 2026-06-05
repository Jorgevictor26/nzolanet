<?php

namespace App\Http\Controllers;

use App\DTOs\CreatePostDTO;
use App\DTOs\UpdatePostDTO;
use App\Http\Requests\StorePostRequest;
use App\Http\Requests\StorePostReportRequest;
use App\Http\Requests\UpdatePostRequest;
use App\Services\ModerationService;
use App\Services\PostService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function __construct(
        private readonly PostService $postService,
        private readonly ModerationService $moderationService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json(
            $this->postService->feed((int) $request->integer('per_page', 15))
        );
    }

    public function userPosts(Request $request, int $id): JsonResponse
    {
        return response()->json(
            $this->postService->userPosts($request->user(), $id, (int) $request->integer('per_page', 15))
        );
    }

    public function store(StorePostRequest $request): JsonResponse
    {
        $post = $this->postService->create(
            $request->user(),
            new CreatePostDTO(
                content: $request->validated('content'),
                image: $request->file('image'),
                video: $request->file('video')
            ),
        );

        return response()->json([
            'data' => $post->toArray(),
        ], 201);
    }

    public function update(UpdatePostRequest $request, int $id): JsonResponse
    {
        $post = $this->postService->update(
            $request->user(),
            $id,
            new UpdatePostDTO(
                content: $request->validated('content'),
                image: $request->file('image'),
                video: $request->file('video')
            ),
        );

        return response()->json([
            'data' => $post->toArray(),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->postService->delete($request->user(), $id);

        return response()->json([
            'message' => 'Publicação eliminada com sucesso.',
        ]);
    }

    public function report(StorePostReportRequest $request, int $id): JsonResponse
    {
        $this->moderationService->submitPostReport(
            $request->user(),
            $id,
            $request->validated('reason'),
        );

        return response()->json([
            'message' => 'Denúncia submetida com sucesso.',
        ], 201);
    }
}
