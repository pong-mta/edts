<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cart extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'store_id',
        'status',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'user_id'
        );
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(
            Store::class,
            'store_id'
        );
    }

    public function items(): HasMany
    {
        return $this->hasMany(
            CartItem::class,
            'cart_id'
        );
    }
}
