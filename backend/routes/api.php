<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\FollowController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('auth/logout', [AuthController::class, 'logout']);

    Route::apiResource('users', UserController::class)->only(['index', 'show', 'update']);
    Route::apiResource('posts', PostController::class);
    Route::apiResource('comments', CommentController::class)->only(['store', 'update', 'destroy']);
    Route::apiResource('likes', LikeController::class)->only(['store', 'destroy']);
    Route::apiResource('follows', FollowController::class)->only(['store', 'destroy']);
    Route::apiResource('notifications', NotificationController::class)->only(['index', 'show', 'update']);
});
