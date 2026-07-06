<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('notifications')) {
            Schema::table('notifications', function (Blueprint $table): void {
                if (! Schema::hasColumn('notifications', 'actor_id')) {
                    $table->foreignId('actor_id')->nullable()->after('user_id')->constrained('users')->nullOnDelete();
                }

                if (! Schema::hasColumn('notifications', 'post_id')) {
                    $table->foreignId('post_id')->nullable()->after('actor_id')->constrained()->cascadeOnDelete();
                }

                if (! Schema::hasColumn('notifications', 'comment_id')) {
                    $table->foreignId('comment_id')->nullable()->after('post_id')->constrained()->cascadeOnDelete();
                }

                if (! Schema::hasColumn('notifications', 'title')) {
                    $table->string('title')->nullable()->after('type');
                }

                if (! Schema::hasColumn('notifications', 'body')) {
                    $table->text('body')->nullable()->after('title');
                }

                if (! Schema::hasColumn('notifications', 'read_at')) {
                    $table->timestamp('read_at')->nullable()->after('body');
                }
            });

            if (Schema::hasColumn('notifications', 'message')) {
                DB::table('notifications')
                    ->whereNull('body')
                    ->update(['body' => DB::raw('message')]);
            }

            DB::table('notifications')
                ->whereNull('title')
                ->update([
                    'title' => DB::raw("
                        CASE
                            WHEN type = 'baze' THEN 'Novo baze'
                            WHEN type = 'comment' THEN 'Novo comentário'
                            WHEN type = 'follow' THEN 'Novo seguidor'
                            ELSE 'Notificação'
                        END
                    "),
                ]);

            DB::table('notifications')
                ->whereNull('body')
                ->update(['body' => 'Tens uma nova notificação.']);

            if (Schema::hasColumn('notifications', 'is_read')) {
                DB::table('notifications')
                    ->where('is_read', true)
                    ->whereNull('read_at')
                    ->update(['read_at' => now()]);
            }

            return;
        }

        Schema::create('notifications', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('post_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('comment_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->string('title');
            $table->text('body');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'read_at', 'created_at']);
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('notifications')) {
            return;
        }

        Schema::table('notifications', function (Blueprint $table): void {
            foreach (['actor_id', 'post_id', 'comment_id', 'title', 'body', 'read_at'] as $column) {
                if (Schema::hasColumn('notifications', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
