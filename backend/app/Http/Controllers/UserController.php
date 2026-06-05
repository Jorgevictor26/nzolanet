<?php

namespace App\Http\Controllers;

use App\DTOs\UpdateProfileDTO;
use App\Http\Requests\ChangeProfilePhotoRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(
        private readonly UserService $userService,
    ) {}

    public function me(Request $request): JsonResponse
    {
        $user = $this->userService->getAuthenticatedProfile($request->user());

        return response()->json([
            'data' => $user->toArray(),
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $user = $this->userService->getProfile($id, $request->user());

        return response()->json([
            'data' => $user->toArray(),
        ]);
    }

    public function suggestions(Request $request): JsonResponse
    {
        return response()->json(
            $this->userService->followSuggestions(
                $request->user(),
                (int) $request->integer('per_page', 5),
                $request->integer('exclude_id') ?: null,
            )
        );
    }

    public function updateProfile(UpdateUserRequest $request): JsonResponse
    {
        $user = $this->userService->updateProfile(
            $request->user(),
            UpdateProfileDTO::fromArray($request->validated()),
        );

        return response()->json([
            'data' => $user->toArray(),
        ]);
    }

    public function changeProfilePhoto(ChangeProfilePhotoRequest $request): JsonResponse
    {
        $user = $this->userService->changeProfilePhoto(
            $request->user(),
            $request->file('photo'),
        );

        return response()->json([
            'data' => $user->toArray(),
        ]);
    }

    public function count(): JsonResponse
    {
        return response()->json(['data' => ['count' => \App\Models\User::count()]]);
    }
}
