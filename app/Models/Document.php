<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'document_type',
        'content',
        'created_by',
        'department_id',
        'status',
    ];

    /*
    |--------------------------------------------------------------------------
    | CREATED BY
    |--------------------------------------------------------------------------
    */

    public function creator(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'created_by'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | DEPARTMENT
    |--------------------------------------------------------------------------
    */

    public function department(): BelongsTo
    {
        return $this->belongsTo(
            Department::class
        );
    }
}
