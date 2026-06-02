<?php

namespace App\Repositories;

use App\Models\Post;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PostRepository
{
    /**
     * @return LengthAwarePaginator<int, Post>
     */
    public function paginateFeed(int $perPage): LengthAwarePaginator
    {
        return Post::query()
            ->with('user:id,name,username,profile_photo')
            ->withCount(['likes', 'comments'])
            ->latest()
            ->paginate($perPage);
    }

    /**
<<<<<<< HEAD
     * @param  array{user_id: int, content: string, image?: ?string, video?: ?string, media?: array<int, array{type: string, path: string}>}  $data
=======
     * @return LengthAwarePaginator<int, Post>
     */
    public function paginateByUserId(int $userId, int $perPage): LengthAwarePaginator
    {
        return Post::query()
            ->with('user:id,name,username,profile_photo')
            ->withCount(['likes', 'comments'])
            ->where('user_id', $userId)
            ->latest()
            ->paginate($perPage);
    }

    /**
     * @param  array{user_id: int, content: string, image?: ?string, video?: ?string}  $data
>>>>>>> 74b153e3aa87d8ef7a9fa74478cce3bbde417433
     */
    public function create(array $data): Post
    {
        return Post::create($data);
    }

    public function findById(int $id): ?Post
    {
        return Post::query()
            ->with('user:id,name,username,profile_photo')
            ->withCount(['likes', 'comments'])
            ->find($id);
    }

    /**
     * @param  array{content: string, image?: ?string, video?: ?string, media?: array<int, array{type: string, path: string}>}  $data
     */
    public function update(Post $post, array $data): Post
    {
        $post->fill($data)->save();

        return $post->refresh()
            ->load('user:id,name,username,profile_photo')
            ->loadCount(['likes', 'comments']);
    }

    public function delete(Post $post): void
    {
        $post->delete();
    }
}
