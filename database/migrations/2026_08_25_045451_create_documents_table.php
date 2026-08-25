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
        Schema::create('documents', function (Blueprint $table) {
            $table->id();

            /*
            |--------------------------------------------------------------------------
            | DOCUMENT INFORMATION
            |--------------------------------------------------------------------------
            */

            $table->string('title');

            /*
            |--------------------------------------------------------------------------
            | DOCUMENT TYPE
            |--------------------------------------------------------------------------
            |
            | word     = Word-style document
            | excel    = Excel-style spreadsheet
            | template = reusable document template
            |
            */

            $table->enum('document_type', [
                'word',
                'excel',
                'template',
            ]);

            /*
            |--------------------------------------------------------------------------
            | DOCUMENT CONTENT
            |--------------------------------------------------------------------------
            |
            | This will contain the editor data.
            |
            | Word:
            | HTML/editor JSON
            |
            | Excel:
            | Spreadsheet JSON
            |
            | Template:
            | Template editor data
            |
            */

            $table->longText('content')->nullable();

            /*
            |--------------------------------------------------------------------------
            | CREATOR
            |--------------------------------------------------------------------------
            |
            | Every document belongs to the user who created it.
            |
            */

            $table->foreignId('created_by')
                ->constrained('users')
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | DEPARTMENT
            |--------------------------------------------------------------------------
            |
            | Automatically taken from the creator's department.
            |
            */

            $table->foreignId('department_id')
                ->constrained('departments')
                ->restrictOnDelete();

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            $table->enum('status', [
                'draft',
                'active',
                'completed',
                'archived',
            ])->default('draft');

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */

            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | INDEXES
            |--------------------------------------------------------------------------
            */

            $table->index([
                'created_by',
                'status',
            ]);

            $table->index([
                'department_id',
                'status',
            ]);

            $table->index([
                'document_type',
                'status',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
