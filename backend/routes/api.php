<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\FollowController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\ModerationController;
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

    Route::prefix('notifications')->group(function (): void {
        Route::get('/', [NotificationController::class, 'index']);
        Route::post('mark-read', [NotificationController::class, 'markAllAsRead']);
        Route::delete('/', [NotificationController::class, 'clear']);
    });

    Route::prefix('users')->group(function (): void {
        Route::get('me', [UserController::class, 'me']);
        Route::get('count', [UserController::class, 'count']);
        Route::get('suggestions', [UserController::class, 'suggestions']);
        Route::put('profile', [UserController::class, 'updateProfile']);
        Route::post('profile', [UserController::class, 'updateProfile']);
        Route::post('profile-photo', [UserController::class, 'changeProfilePhoto']);

        Route::post('{id}/follow', [FollowController::class, 'follow'])->whereNumber('id');
        Route::delete('{id}/follow', [FollowController::class, 'unfollow'])->whereNumber('id');
        Route::get('{id}/followers', [FollowController::class, 'followers'])->whereNumber('id');
        Route::get('{id}/following', [FollowController::class, 'following'])->whereNumber('id');
        Route::get('{id}/posts', [PostController::class, 'userPosts'])->whereNumber('id');
        Route::get('{id}', [UserController::class, 'show'])->whereNumber('id');
    });

    Route::prefix('posts')->group(function (): void {
        Route::get('/', [PostController::class, 'index']);
        Route::post('/', [PostController::class, 'store']);
        Route::put('{id}', [PostController::class, 'update'])->whereNumber('id');
        Route::delete('{id}', [PostController::class, 'destroy'])->whereNumber('id');
        Route::post('{id}/like', [LikeController::class, 'store'])->whereNumber('id');
        Route::delete('{id}/like', [LikeController::class, 'destroy'])->whereNumber('id');
        Route::get('{postId}/comments', [CommentController::class, 'index'])->whereNumber('postId');
        Route::post('{postId}/comments', [CommentController::class, 'store'])->whereNumber('postId');
    });

    Route::prefix('comments')->group(function (): void {
        Route::put('{id}', [CommentController::class, 'update'])->whereNumber('id');
        Route::delete('{id}', [CommentController::class, 'destroy'])->whereNumber('id');
        Route::post('{id}/report', [CommentController::class, 'report'])->whereNumber('id');
    });

    Route::middleware('admin')->prefix('moderation')->group(function (): void {
        Route::get('reports', [ModerationController::class, 'index']);
        Route::post('reports/{id}/approve', [ModerationController::class, 'approve'])->whereNumber('id');
        Route::delete('reports/{id}', [ModerationController::class, 'removeComment'])->whereNumber('id');
        Route::post('reports/{id}/warn', [ModerationController::class, 'warnUser'])->whereNumber('id');
    });
});
