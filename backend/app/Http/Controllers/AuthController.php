<?php

namespace App\Http\Controllers;

use App\DTOs\LoginDTO;
use App\DTOs\RegisterDTO;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $authService,
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = $this->authService->register(
            RegisterDTO::fromArray($request->validated())
        );

        return response()->json([
            'data' => $user->toArray(),
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $auth = $this->authService->login(
            LoginDTO::fromArray($request->validated())
        );

        return response()->json([
            'data' => $auth['user']->toArray(),
            'token' => $auth['token'],
            'token_type' => 'Bearer',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return response()->json([
            'message' => 'Sessão terminada com sucesso.',
        ]);
    }

}
