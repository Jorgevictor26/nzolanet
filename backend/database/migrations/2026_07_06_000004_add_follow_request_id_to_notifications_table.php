<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table): void {
            if (! Schema::hasColumn('notifications', 'follow_request_id')) {
                $table->foreignId('follow_request_id')
                    ->nullable()
                    ->after('comment_id')
                    ->constrained('follow_requests')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table): void {
            if (Schema::hasColumn('notifications', 'follow_request_id')) {
                $table->dropConstrainedForeignId('follow_request_id');
            }
        });
    }
};
