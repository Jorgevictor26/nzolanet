<?php

namespace App\Repositories;

use App\Models\Post;

class PostRepository
{
    /**
     * @param  array{user_id: int, content: string, image?: ?string, video?: ?string}  $data
     */
    public function create(array $data): Post
    {
        return Post::create($data);
    }

    public function findById(int $id): ?Post
    {
        return Post::query()->find($id);
    }

    /**
     * @param  array{content: string, image?: ?string, video?: ?string}  $data
     */
    public function update(Post $post, array $data): Post
    {
        $post->fill($data)->save();

        return $post->refresh();
    }

    public function delete(Post $post): void
    {
        $post->delete();
    }
}
