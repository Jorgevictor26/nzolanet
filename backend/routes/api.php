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
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('auth/logout', [AuthController::class, 'logout']);

    Route::get('users/me', [UserController::class, 'me']);
    Route::post('users/{id}/follow', [FollowController::class, 'follow'])->whereNumber('id');
    Route::delete('users/{id}/follow', [FollowController::class, 'unfollow'])->whereNumber('id');
    Route::get('users/{id}/followers', [FollowController::class, 'followers'])->whereNumber('id');
    Route::get('users/{id}/following', [FollowController::class, 'following'])->whereNumber('id');
    Route::get('users/{id}', [UserController::class, 'show'])->whereNumber('id');
    Route::put('users/profile', [UserController::class, 'updateProfile']);
    Route::post('users/profile-photo', [UserController::class, 'changeProfilePhoto']);

    Route::post('posts', [PostController::class, 'store']);
    Route::put('posts/{id}', [PostController::class, 'update'])->whereNumber('id');
    Route::delete('posts/{id}', [PostController::class, 'destroy'])->whereNumber('id');
    Route::apiResource('comments', CommentController::class)->only(['store', 'update', 'destroy']);
    Route::apiResource('likes', LikeController::class)->only(['store', 'destroy']);
    Route::apiResource('notifications', NotificationController::class)->only(['index', 'show', 'update']);
});
