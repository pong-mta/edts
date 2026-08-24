<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();

            $table->foreignId('store_id')
                ->constrained('stores')
                ->cascadeOnDelete();

            $table->foreignId('category_id')
                ->constrained('store_categories')
                ->cascadeOnDelete();

            $table->string('name');

            $table->string('slug');

            $table->text('description')
                ->nullable();

            $table->string('image')
                ->nullable();

            $table->boolean('is_active')
                ->default(true);

            $table->unsignedInteger('sort_order')
                ->default(0);

            $table->timestamps();

            $table->unique([
                'store_id',
                'slug',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
