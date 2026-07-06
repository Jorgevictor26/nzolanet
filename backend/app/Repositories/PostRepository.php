<?php

namespace App\Repositories;

use App\Models\Post;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PostRepository
{
    private const AUTHOR_FIELDS = 'user:id,name,username,profile_photo';

    /**
     * @return LengthAwarePaginator<int, Post>
     */
    public function paginateFeed(User $viewer, int $perPage): LengthAwarePaginator
    {
        return Post::query()
            ->with(self::AUTHOR_FIELDS)
            ->withCount(['likes', 'comments'])
            ->withExists([
                'likes as is_liked_by_viewer' => fn ($query) => $query->where('user_id', $viewer->id),
            ])
            ->latest()
            ->paginate($perPage);
    }

    /**
     * @return LengthAwarePaginator<int, Post>
     */
    public function paginateByUserId(User $viewer, int $userId, int $perPage): LengthAwarePaginator
    {
        return Post::query()
            ->with(self::AUTHOR_FIELDS)
            ->withCount(['likes', 'comments'])
            ->withExists([
                'likes as is_liked_by_viewer' => fn ($query) => $query->where('user_id', $viewer->id),
            ])
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

    public function findById(int $id, ?User $viewer = null): ?Post
    {
        return Post::query()
            ->with(self::AUTHOR_FIELDS)
            ->withCount(['likes', 'comments'])
            ->when(
                $viewer,
                fn ($query) => $query->withExists([
                    'likes as is_liked_by_viewer' => fn ($query) => $query->where('user_id', $viewer->id),
                ])
            )
            ->find($id);
    }

    /**
     * @param  array{content: string, image?: ?string, video?: ?string}  $data
     */
    public function update(Post $post, array $data, ?User $viewer = null): Post
    {
        $post->fill($data)->save();

        return $this->findById($post->id, $viewer) ?? $post->refresh();
    }

    public function delete(Post $post): void
    {
        $post->delete();
    }
}
