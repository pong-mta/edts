<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id',
        'category_id',
        'name',
        'slug',
        'description',
        'image',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function store(): BelongsTo
    {
        return $this->belongsTo(
            Store::class,
            'store_id'
        );
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(
            StoreCategory::class,
            'category_id'
        );
    }

    public function variants(): HasMany
    {
        return $this->hasMany(
            ProductVariant::class,
            'product_id'
        );
    }
}
