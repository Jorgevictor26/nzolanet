<?php

namespace App\Services;

use App\DTOs\PostDTO;
use App\Models\Post;
use App\Models\User;
use App\Repositories\LikeRepository;
use App\Repositories\PostRepository;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;

class LikeService
{
    public function __construct(
        private readonly LikeRepository $likes,
        private readonly NotificationService $notifications,
        private readonly PostRepository $posts,
    ) {}

    public function like(User $user, int $postId): PostDTO
    {
        $this->findPostOrFail($postId, $user);

        if ($this->likes->exists($user->id, $postId)) {
            throw ValidationException::withMessages([
                'post' => ['Já deste baze nesta publicação.'],
            ]);
        }

        $this->likes->create($user->id, $postId);
        $this->notifications->notifyNewBaze($user, $this->findPostOrFail($postId, $user));

        return PostDTO::fromModel($this->findPostOrFail($postId, $user));
    }

    public function unlike(User $user, int $postId): PostDTO
    {
        $this->findPostOrFail($postId, $user);

        if (! $this->likes->delete($user->id, $postId)) {
            throw ValidationException::withMessages([
                'post' => ['Ainda não deste baze nesta publicação.'],
            ]);
        }

        return PostDTO::fromModel($this->findPostOrFail($postId, $user));
    }

    private function findPostOrFail(int $id, User $viewer): Post
    {
        $post = $this->posts->findById($id, $viewer);

        if (! $post) {
            throw (new ModelNotFoundException)->setModel(Post::class, [$id]);
        }

        return $post;
    }
}
