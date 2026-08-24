<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'store_id',
        'order_number',
        'status',
        'fulfillment_type',
        'subtotal',
        'delivery_fee',
        'total',
        'delivery_address',
        'delivery_latitude',
        'delivery_longitude',
        'notes',

        'payment_method',
        'payment_status',
        'payment_reference',
        'paid_at',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'delivery_fee' => 'decimal:2',
        'total' => 'decimal:2',
        'delivery_latitude' => 'decimal:7',
        'delivery_longitude' => 'decimal:7',
        'paid_at' => 'datetime',
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
            OrderItem::class,
            'order_id'
        );
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'user_id'
        );
    }
}
