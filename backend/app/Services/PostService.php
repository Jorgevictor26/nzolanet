<?php

namespace App\Services;

use App\DTOs\CreatePostDTO;
use App\DTOs\PostDTO;
use App\DTOs\UpdatePostDTO;
use App\Models\Post;
use App\Models\User;
use App\Repositories\PostRepository;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class PostService
{
    public function __construct(
        private readonly PostRepository $posts,
    ) {}

    public function create(User $author, CreatePostDTO $dto): PostDTO
    {
        $post = $this->posts->create([
            'user_id' => $author->id,
            'content' => $dto->content,
            'image' => $this->storeFile($dto->image, 'post-images'),
            'video' => $this->storeFile($dto->video, 'post-videos'),
        ]);

        return PostDTO::fromModel($post);
    }

    public function update(User $author, int $postId, UpdatePostDTO $dto): PostDTO
    {
        $post = $this->findPostOrFail($postId);
        $this->ensureOwner($author, $post);

        $data = [
            'content' => $dto->content,
        ];

        if ($dto->image) {
            $this->deleteFile($post->image);
            $data['image'] = $this->storeFile($dto->image, 'post-images');
        }

        if ($dto->video) {
            $this->deleteFile($post->video);
            $data['video'] = $this->storeFile($dto->video, 'post-videos');
        }

        return PostDTO::fromModel(
            $this->posts->update($post, $data)
        );
    }

    public function delete(User $author, int $postId): void
    {
        $post = $this->findPostOrFail($postId);
        $this->ensureOwner($author, $post);

        $this->deleteFile($post->image);
        $this->deleteFile($post->video);

        $this->posts->delete($post);
    }

    private function findPostOrFail(int $id): Post
    {
        $post = $this->posts->findById($id);

        if (! $post) {
            throw (new ModelNotFoundException)->setModel(Post::class, [$id]);
        }

        return $post;
    }

    private function ensureOwner(User $author, Post $post): void
    {
        if ($post->user_id !== $author->id) {
            throw new AuthorizationException('Não tem permissão para alterar esta publicação.');
        }
    }

    private function storeFile(?UploadedFile $file, string $directory): ?string
    {
        return $file?->store($directory, 'public');
    }

    private function deleteFile(?string $path): void
    {
        if ($path) {
            Storage::disk('public')->delete($path);
        }
    }
}
