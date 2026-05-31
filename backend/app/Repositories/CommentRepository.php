<?php

namespace App\Repositories;

use App\Models\Comment;

class CommentRepository
{
    /**
     * @param  array{user_id: int, post_id: int, content: string}  $data
     */
    public function create(array $data): Comment
    {
        return Comment::create($data)
            ->load('user:id,name,profile_photo');
    }

    public function findById(int $id): ?Comment
    {
        return Comment::query()
            ->with('user:id,name,profile_photo')
            ->find($id);
    }

    /**
     * @param  array{content: string}  $data
     */
    public function update(Comment $comment, array $data): Comment
    {
        $comment->fill($data)->save();

        return $comment->refresh()
            ->load('user:id,name,profile_photo');
    }

    public function delete(Comment $comment): void
    {
        $comment->delete();
    }
}
