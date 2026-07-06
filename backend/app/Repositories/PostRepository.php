<?php

namespace App\Repositories;

use App\Models\Post;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PostRepository
{
    private const AUTHOR_FIELDS = 'user:id,name,username,profile_photo';

    /**
     * @return LengthAwarePaginator<int, Post>
     */
    public function paginateFeed(int $perPage): LengthAwarePaginator
    {
        return Post::query()
            ->with(self::AUTHOR_FIELDS)
            ->withCount(['likes', 'comments'])
            ->latest()
            ->paginate($perPage);
    }

    /**
     * @return LengthAwarePaginator<int, Post>
     */
    public function paginateByUserId(int $userId, int $perPage): LengthAwarePaginator
    {
        return Post::query()
            ->with(self::AUTHOR_FIELDS)
            ->withCount(['likes', 'comments'])
            ->where('user_id', $userId)
            ->latest()
            ->paginate($perPage);
    }

    /**
     * @param  array{user_id: int, content: string, image?: ?string, video?: ?string}  $data
     */
    public function create(array $data): Post
    {
        return Post::create($data);
    }

    public function findById(int $id): ?Post
    {
        return Post::query()
            ->with(self::AUTHOR_FIELDS)
            ->withCount(['likes', 'comments'])
            ->find($id);
    }

    /**
     * @param  array{content: string, image?: ?string, video?: ?string}  $data
     */
    public function update(Post $post, array $data): Post
    {
        $post->fill($data)->save();

        return $post->refresh()
            ->load(self::AUTHOR_FIELDS)
            ->loadCount(['likes', 'comments']);
    }

    public function delete(Post $post): void
    {
        $post->delete();
    }
}
