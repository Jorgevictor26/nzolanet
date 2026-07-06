<?php

namespace App\Services;

use App\DTOs\UserDTO;
use App\Models\FollowRequest;
use App\Models\User;
use App\Repositories\FollowRepository;
use App\Repositories\FollowRequestRepository;
use App\Repositories\UserRepository;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;

class FollowService
{
    public function __construct(
        private readonly FollowRepository $follows,
        private readonly FollowRequestRepository $followRequests,
        private readonly NotificationService $notifications,
        private readonly ProfilePrivacyService $profilePrivacy,
        private readonly UserRepository $users,
    ) {}

    /**
     * @return array{message: string, status: int, user: UserDTO}
     */
    public function follow(User $follower, int $followingId): array
    {
        $following = $this->findUserOrFail($followingId);

        if ($follower->id === $following->id) {
            throw ValidationException::withMessages([
                'user' => ['Não é possível seguir a si próprio.'],
            ]);
        }

        if ($this->follows->exists($follower->id, $following->id)) {
            throw ValidationException::withMessages([
                'user' => ['Este utilizador já está a ser seguido.'],
            ]);
        }

        if ($following->privacy === 'private') {
            if ($this->followRequests->hasPending($follower->id, $following->id)) {
                throw ValidationException::withMessages([
                    'user' => ['Pedido de seguimento jÃ¡ enviado.'],
                ]);
            }

            $request = $this->followRequests->createOrRenewPending($follower->id, $following->id);
            $this->notifications->notifyNewFollowRequest($follower, $following, $request);
            $following->loadCount(['followers', 'following']);

            return [
                'message' => 'Pedido de seguimento enviado.',
                'status' => 202,
                'user' => UserDTO::fromModel($following, $follower, false, 'pending'),
            ];
        }

        $this->follows->create($follower->id, $following->id);
        $this->notifications->notifyNewFollower($follower, $following);
        $following->loadCount(['followers', 'following']);

        return [
            'message' => 'Utilizador seguido com sucesso.',
            'status' => 201,
            'user' => UserDTO::fromModel($following, $follower, true, 'following'),
        ];
    }

    public function unfollow(User $follower, int $followingId): void
    {
        $following = $this->findUserOrFail($followingId);

        if (! $this->follows->delete($follower->id, $following->id)) {
            throw ValidationException::withMessages([
                'user' => ['Este utilizador não está a ser seguido.'],
            ]);
        }
    }

    /**
     * @return array{id: int, status: string}
     */
    public function acceptRequest(User $owner, int $requestId): array
    {
        $request = $this->findFollowRequestOrFail($requestId);
        $this->ensureRequestOwner($owner, $request);
        $this->ensureRequestIsPending($request);

        if (! $this->follows->exists($request->follower_id, $request->following_id)) {
            $this->follows->create($request->follower_id, $request->following_id);
        }

        $request = $this->followRequests->markAccepted($request);
        $this->notifications->notifyFollowRequestAccepted($owner, $request->follower);

        return [
            'id' => $request->id,
            'status' => $request->status,
        ];
    }

    /**
     * @return array{id: int, status: string}
     */
    public function rejectRequest(User $owner, int $requestId): array
    {
        $request = $this->findFollowRequestOrFail($requestId);
        $this->ensureRequestOwner($owner, $request);
        $this->ensureRequestIsPending($request);

        $request = $this->followRequests->markRejected($request);
        $this->notifications->notifyFollowRequestRejected($owner, $request->follower);

        return [
            'id' => $request->id,
            'status' => $request->status,
        ];
    }

    /**
     * @return array{data: array<int, array<string, bool|int|string|null>>, meta: array<string, int>}
     */
    public function followers(int $userId, int $perPage, User $viewer): array
    {
        $user = $this->findUserOrFail($userId);
        $this->profilePrivacy->ensureCanViewProfile($viewer, $user);

        return $this->formatPaginatedUsers(
            $this->follows->paginateFollowers($user, $this->normalizePerPage($perPage)),
            $viewer
        );
    }

    /**
     * @return array{data: array<int, array<string, bool|int|string|null>>, meta: array<string, int>}
     */
    public function following(int $userId, int $perPage, User $viewer): array
    {
        $user = $this->findUserOrFail($userId);
        $this->profilePrivacy->ensureCanViewProfile($viewer, $user);

        return $this->formatPaginatedUsers(
            $this->follows->paginateFollowing($user, $this->normalizePerPage($perPage)),
            $viewer
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

    private function findFollowRequestOrFail(int $id): FollowRequest
    {
        $request = $this->followRequests->findById($id);

        if (! $request) {
            throw (new ModelNotFoundException)->setModel(FollowRequest::class, [$id]);
        }

        return $request;
    }

    private function ensureRequestOwner(User $owner, FollowRequest $request): void
    {
        if ($request->following_id !== $owner->id) {
            throw new AuthorizationException('Acesso nao autorizado.');
        }
    }

    private function ensureRequestIsPending(FollowRequest $request): void
    {
        if ($request->status !== FollowRequest::STATUS_PENDING) {
            throw ValidationException::withMessages([
                'request' => ['Este pedido ja foi respondido.'],
            ]);
        }
    }

    private function normalizePerPage(int $perPage): int
    {
        return max(1, min($perPage, 50));
    }

    /**
     * @param  LengthAwarePaginator<int, User>  $paginator
     * @return array{data: array<int, array<string, bool|int|string|null>>, meta: array<string, int>}
     */
    private function formatPaginatedUsers(LengthAwarePaginator $paginator, User $viewer): array
    {
        return [
            'data' => $paginator->getCollection()
                ->each->loadCount(['followers', 'following'])
                ->map(fn (User $user): array => UserDTO::fromModel(
                    $user,
                    $viewer,
                    $this->profilePrivacy->canViewProfile($viewer, $user),
                )->toArray())
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
