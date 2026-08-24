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
        Schema::table(
            'store_owner_applications',
            function (Blueprint $table) {

                $table->string('business_type')
                    ->after('business_name');
            }
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table(
            'store_owner_applications',
            function (Blueprint $table) {

                $table->dropColumn(
                    'business_type'
                );
            }
        );
    }
};
