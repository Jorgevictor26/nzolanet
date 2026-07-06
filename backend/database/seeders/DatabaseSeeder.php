<?php

namespace Database\Seeders;

use App\Models\Comment;
use App\Models\Post;
use App\Models\Report;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $admin = User::factory()->create([
            'name' => 'Administrador NzolaNet',
            'username' => 'admin',
            'email' => 'admin@nzolanet.com',
            'password' => Hash::make('password'),
            'is_admin' => true,
        ]);

        $author = User::factory()->create([
            'name' => 'David Manuel',
            'username' => 'Manuel',
        ]);

        $reporter = User::factory()->create([
            'name' => 'Maria Panzo',
            'username' => 'panzo',
        ]);

        $post = Post::create([
            'user_id' => $author->id,
            'content' => 'Hoje está um dia muito nublado.',
        ]);

        $comment = Comment::create([
            'user_id' => $author->id,
            'post_id' => $post->id,
            'content' => 'Todo mundo sabe que o surto de Ébola está matando muita gente, mas ninguém fala disso.',
        ]);

        Report::create([
            'comment_id' => $comment->id,
            'reported_user_id' => $author->id,
            'reporter_id' => $reporter->id,
            'reason' => 'Spam/Publicidade',
        ]);
    }
}
