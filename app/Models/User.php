<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'name',
        'phone',
        'department_id',
        'password',
        'phone_verified',
    ];

    protected $hidden = [
        'password',
    ];

    public function otpVerifications(): HasMany
    {
        return $this->hasMany(OtpVerification::class);
    }

    public function deviceTokens(): HasMany
    {
        return $this->hasMany(DeviceToken::class);
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(
            Role::class,
            'role_user'
        )->withTimestamps();
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }
    public function documents(): HasMany
    {
        return $this->hasMany(
            Document::class,
            'created_by'
        );
    }
}
