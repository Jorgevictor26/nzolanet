<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response|JsonResponse
    {
        $user = $request->user();
        $email = strtolower(trim((string) $user?->email));
        $username = strtolower(trim((string) $user?->username));

        $isAdmin = (bool) $user?->is_admin
            || in_array($email, ['admin@nzolanet.com'], true)
            || in_array($username, ['admin', 'administrador'], true);

        if (! $isAdmin) {
            return response()->json([
                'message' => 'Acesso não autorizado.',
            ], 403);
        }

        return $next($request);
    }
}
