<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('store_id')
                ->constrained('stores')
                ->cascadeOnDelete();

            $table->string('order_number')
                ->unique();

            $table->string('status')
                ->default('pending');

            $table->string('fulfillment_type')
                ->default('delivery');

            $table->decimal('subtotal', 10, 2)
                ->default(0);

            $table->decimal('delivery_fee', 10, 2)
                ->default(0);

            $table->decimal('total', 10, 2)
                ->default(0);

            $table->text('delivery_address')
                ->nullable();

            $table->decimal('delivery_latitude', 10, 7)
                ->nullable();

            $table->decimal('delivery_longitude', 10, 7)
                ->nullable();

            $table->text('notes')
                ->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
