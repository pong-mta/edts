<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('store_owner_applications', function (Blueprint $table) {

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | APPLICANT
            |--------------------------------------------------------------------------
            */

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | BUSINESS INFORMATION
            |--------------------------------------------------------------------------
            */

            $table->string('business_name');

            $table->text('description')
                ->nullable();

            $table->string('phone')
                ->nullable();

            $table->text('address');

            /*
            |--------------------------------------------------------------------------
            | LOCATION
            |--------------------------------------------------------------------------
            */

            $table->decimal(
                'latitude',
                10,
                7
            )->nullable();

            $table->decimal(
                'longitude',
                10,
                7
            )->nullable();

            /*
            |--------------------------------------------------------------------------
            | APPLICATION STATUS
            |--------------------------------------------------------------------------
            */

            $table->enum(
                'status',
                [
                    'pending',
                    'approved',
                    'rejected',
                ]
            )->default('pending');

            /*
            |--------------------------------------------------------------------------
            | ADMIN REVIEW
            |--------------------------------------------------------------------------
            */

            $table->text('admin_notes')
                ->nullable();

            $table->foreignId('reviewed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('reviewed_at')
                ->nullable();

            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | ONE ACTIVE APPLICATION PER USER
            |--------------------------------------------------------------------------
            |
            | We don't want the same customer submitting unlimited
            | duplicate applications while one is pending.
            |
            */

            $table->index([
                'user_id',
                'status',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists(
            'store_owner_applications'
        );
    }
};
