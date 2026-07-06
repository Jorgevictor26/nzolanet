<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('reports') || ! Schema::hasColumn('reports', 'post_id')) {
            return;
        }

        Schema::table('reports', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('post_id');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('reports') || Schema::hasColumn('reports', 'post_id')) {
            return;
        }

        Schema::table('reports', function (Blueprint $table): void {
            $table->foreignId('post_id')->nullable()->after('comment_id')->constrained()->cascadeOnDelete();
        });
    }
};
