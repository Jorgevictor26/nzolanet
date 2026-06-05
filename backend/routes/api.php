<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\FollowController;
use App\Http\Controllers\ModerationController;
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
    Route::get('users/suggestions', [UserController::class, 'suggestions']);
    Route::post('users/{id}/follow', [FollowController::class, 'follow'])->whereNumber('id');
    Route::delete('users/{id}/follow', [FollowController::class, 'unfollow'])->whereNumber('id');
    Route::get('users/{id}/followers', [FollowController::class, 'followers'])->whereNumber('id');
    Route::get('users/{id}/following', [FollowController::class, 'following'])->whereNumber('id');
    Route::get('users/{id}/posts', [PostController::class, 'userPosts'])->whereNumber('id');
    Route::get('users/{id}', [UserController::class, 'show'])->whereNumber('id');
    Route::put('users/profile', [UserController::class, 'updateProfile']);
    Route::post('users/profile', [UserController::class, 'updateProfile']);
    Route::post('users/profile-photo', [UserController::class, 'changeProfilePhoto']);
    Route::get('users/count', [UserController::class, 'count']);
    Route::get('posts', [PostController::class, 'index']);
    Route::post('posts', [PostController::class, 'store']);
    Route::put('posts/{id}', [PostController::class, 'update'])->whereNumber('id');
    Route::delete('posts/{id}', [PostController::class, 'destroy'])->whereNumber('id');
    Route::post('posts/{id}/report', [PostController::class, 'report'])->whereNumber('id');
    Route::get('posts/{postId}/comments', [CommentController::class, 'index'])->whereNumber('postId');
    Route::post('posts/{postId}/comments', [CommentController::class, 'store'])->whereNumber('postId');
    Route::put('comments/{id}', [CommentController::class, 'update'])->whereNumber('id');
    Route::delete('comments/{id}', [CommentController::class, 'destroy'])->whereNumber('id');
    Route::post('comments/{id}/report', [CommentController::class, 'report'])->whereNumber('id');

    Route::middleware('admin')->prefix('moderation')->group(function (): void {
        Route::get('reports', [ModerationController::class, 'index']);
        Route::post('reports/{id}/approve', [ModerationController::class, 'approve'])->whereNumber('id');
        Route::delete('reports/{id}', [ModerationController::class, 'removeComment'])->whereNumber('id');
        Route::post('reports/{id}/warn', [ModerationController::class, 'warnUser'])->whereNumber('id');
    });
});
