<?php

namespace App\Services;

use App\DTOs\CreatePostDTO;
use App\DTOs\PostDTO;
use App\DTOs\UpdatePostDTO;
use App\Models\Post;
use App\Models\User;
use App\Repositories\PostRepository;
use App\Repositories\UserRepository;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class PostService
{
    private const IMAGE_DIRECTORY = 'post-images';

    private const VIDEO_DIRECTORY = 'post-videos';

    private const MIN_PER_PAGE = 1;

    private const MAX_PER_PAGE = 50;

    public function __construct(
        private readonly PostRepository $posts,
        private readonly UserRepository $users,
    ) {}

    /**
     * @return array{data: array<int, array<string, mixed>>, meta: array<string, int>}
     */
    public function feed(int $perPage): array
    {
        return $this->formatPaginatedPosts(
            $this->posts->paginateFeed($this->normalizePerPage($perPage))
        );
    }

    /**
     * @return array{data: array<int, array<string, mixed>>, meta: array<string, int>}
     */
    public function userPosts(User $viewer, int $userId, int $perPage): array
    {
        $profile = $this->users->findById($userId);

        if (! $profile) {
            throw (new ModelNotFoundException)->setModel(User::class, [$userId]);
        }

        if ($profile->id !== $viewer->id && $profile->privacy === 'private' && ! $this->viewerFollowsProfile($viewer, $profile)) {
            throw new AuthorizationException('Este perfil é privado.');
        }

        return $this->formatPaginatedPosts(
            $this->posts->paginateByUserId($userId, $this->normalizePerPage($perPage))
        );
    }

    public function create(User $author, CreatePostDTO $dto): PostDTO
    {
        $post = $this->posts->create([
            'user_id' => $author->id,
            'content' => $dto->content,
            'image' => $this->storeFile($dto->image, self::IMAGE_DIRECTORY),
            'video' => $this->storeFile($dto->video, self::VIDEO_DIRECTORY),
        ]);

        return PostDTO::fromModel(
            $post->load('user:id,name,username,profile_photo')
                ->loadCount(['likes', 'comments'])
        );
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
            $data['image'] = $this->storeFile($dto->image, self::IMAGE_DIRECTORY);
        }

        if ($dto->video) {
            $this->deleteFile($post->video);
            $data['video'] = $this->storeFile($dto->video, self::VIDEO_DIRECTORY);
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

    private function viewerFollowsProfile(User $viewer, User $profile): bool
    {
        return $profile->followers()
            ->where('users.id', $viewer->id)
            ->exists();
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

    private function normalizePerPage(int $perPage): int
    {
        return max(self::MIN_PER_PAGE, min($perPage, self::MAX_PER_PAGE));
    }

    /**
     * @param  LengthAwarePaginator<int, Post>  $paginator
     * @return array{data: array<int, array<string, mixed>>, meta: array<string, int>}
     */
    private function formatPaginatedPosts(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => $paginator->getCollection()
                ->map(fn (Post $post): array => PostDTO::fromModel($post)->toArray())
                ->values()
                ->all(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }
}
