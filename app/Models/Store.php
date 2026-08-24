<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Store extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_id',
        'name',
        'business_type',
        'slug',
        'description',
        'phone',
        'address',
        'latitude',
        'longitude',
        'logo',
        'is_active',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'is_active' => 'boolean',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'owner_id'
        );
    }

    public function categories(): HasMany
    {
        return $this->hasMany(
            StoreCategory::class,
            'store_id'
        );
    }

    public function products(): HasMany
    {
        return $this->hasMany(
            Product::class,
            'store_id'
        );
    }
}
