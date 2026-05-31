<?php

namespace App\Services;

use App\DTOs\CommentDTO;
use App\DTOs\CreateCommentDTO;
use App\DTOs\UpdateCommentDTO;
use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use App\Repositories\CommentRepository;
use App\Repositories\PostRepository;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class CommentService
{
    public function __construct(
        private readonly CommentRepository $comments,
        private readonly PostRepository $posts,
    ) {}

    public function create(User $author, CreateCommentDTO $dto): CommentDTO
    {
        $this->findPostOrFail($dto->postId);

        $comment = $this->comments->create([
            'user_id' => $author->id,
            'post_id' => $dto->postId,
            'content' => $dto->content,
        ]);

        return CommentDTO::fromModel($comment);
    }

    public function update(User $author, int $commentId, UpdateCommentDTO $dto): CommentDTO
    {
        $comment = $this->findCommentOrFail($commentId);
        $this->ensureOwner($author, $comment);

        return CommentDTO::fromModel(
            $this->comments->update($comment, [
                'content' => $dto->content,
            ])
        );
    }

    public function delete(User $author, int $commentId): void
    {
        $comment = $this->findCommentOrFail($commentId);
        $this->ensureOwner($author, $comment);

        $this->comments->delete($comment);
    }

    private function findPostOrFail(int $id): Post
    {
        $post = $this->posts->findById($id);

        if (! $post) {
            throw (new ModelNotFoundException)->setModel(Post::class, [$id]);
        }

        return $post;
    }

    private function findCommentOrFail(int $id): Comment
    {
        $comment = $this->comments->findById($id);

        if (! $comment) {
            throw (new ModelNotFoundException)->setModel(Comment::class, [$id]);
        }

        return $comment;
    }

    private function ensureOwner(User $author, Comment $comment): void
    {
        if ($comment->user_id !== $author->id) {
            throw new AuthorizationException('Não tem permissão para alterar este comentário.');
        }
    }
}
