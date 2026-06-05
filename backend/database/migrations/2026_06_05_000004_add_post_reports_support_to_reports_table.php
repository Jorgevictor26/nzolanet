<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reports', function (Blueprint $table): void {
            if (! Schema::hasColumn('reports', 'post_id')) {
                $table->foreignId('post_id')->nullable()->after('comment_id')->constrained()->cascadeOnDelete();
            }
        });

        if (Schema::hasColumn('reports', 'comment_id') && DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE reports MODIFY comment_id BIGINT UNSIGNED NULL');
        }
    }

    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table): void {
            if (Schema::hasColumn('reports', 'post_id')) {
                $table->dropConstrainedForeignId('post_id');
            }
        });
    }
};
