<?php

namespace App\Services;

use App\DTOs\FollowUserDTO;
use App\DTOs\UserDTO;
use App\Models\User;
use App\Repositories\FollowRepository;
use App\Repositories\UserRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;

class FollowService
{
    public function __construct(
        private readonly FollowRepository $follows,
        private readonly UserRepository $users,
    ) {}

    public function follow(User $follower, int $followingId): UserDTO
    {
        $following = $this->findUserOrFail($followingId);
        $dto = new FollowUserDTO($follower->id, $following->id);

        if ($dto->followerId === $dto->followingId) {
            throw ValidationException::withMessages([
                'user' => ['Não é possível seguir a si próprio.'],
            ]);
        }

        if ($this->follows->exists($dto->followerId, $dto->followingId)) {
            throw ValidationException::withMessages([
                'user' => ['Este utilizador já está a ser seguido.'],
            ]);
        }

        $this->follows->create($dto->followerId, $dto->followingId);

        return UserDTO::fromModel($following);
    }

    public function unfollow(User $follower, int $followingId): void
    {
        $following = $this->findUserOrFail($followingId);
        $dto = new FollowUserDTO($follower->id, $following->id);

        if (! $this->follows->delete($dto->followerId, $dto->followingId)) {
            throw ValidationException::withMessages([
                'user' => ['Este utilizador não está a ser seguido.'],
            ]);
        }
    }

    /**
     * @return array{data: array<int, array<string, int|string|null>>, meta: array<string, int>}
     */
    public function followers(int $userId, int $perPage): array
    {
        $user = $this->findUserOrFail($userId);

        return $this->formatPaginatedUsers(
            $this->follows->paginateFollowers($user, $this->normalizePerPage($perPage))
        );
    }

    /**
     * @return array{data: array<int, array<string, int|string|null>>, meta: array<string, int>}
     */
    public function following(int $userId, int $perPage): array
    {
        $user = $this->findUserOrFail($userId);

        return $this->formatPaginatedUsers(
            $this->follows->paginateFollowing($user, $this->normalizePerPage($perPage))
        );
    }

    private function findUserOrFail(int $id): User
    {
        $user = $this->users->findById($id);

        if (! $user) {
            throw (new ModelNotFoundException)->setModel(User::class, [$id]);
        }

        return $user;
    }

    private function normalizePerPage(int $perPage): int
    {
        return max(1, min($perPage, 50));
    }

    /**
     * @param  LengthAwarePaginator<int, User>  $paginator
     * @return array{data: array<int, array<string, int|string|null>>, meta: array<string, int>}
     */
    private function formatPaginatedUsers(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => $paginator->getCollection()
                ->map(fn (User $user): array => UserDTO::fromModel($user)->toArray())
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
