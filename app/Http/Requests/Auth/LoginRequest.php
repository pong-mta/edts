<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'phone' => [
                'required',
                'string',
                'regex:/^09[0-9]{9}$/',
            ],

            'password' => [
                'required',
                'string',
            ],

            'remember' => [
                'sometimes',
                'boolean',
            ],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        /*
        |--------------------------------------------------------------------------
        | FIND USER
        |--------------------------------------------------------------------------
        */

        $credentials = [
            'phone' =>
            $this->string('phone')->toString(),

            'password' =>
            $this->string('password')->toString(),
        ];

        /*
        |--------------------------------------------------------------------------
        | AUTHENTICATE
        |--------------------------------------------------------------------------
        */

        if (
            !Auth::attempt(
                $credentials,
                $this->boolean('remember')
            )
        ) {
            RateLimiter::hit(
                $this->throttleKey()
            );

            throw ValidationException::withMessages([
                'phone' =>
                'The mobile number or password is incorrect.',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | PHONE VERIFICATION
        |--------------------------------------------------------------------------
        */

        $user = Auth::user();

        if (
            !$user ||
            !$user->phone_verified
        ) {
            Auth::logout();

            throw ValidationException::withMessages([
                'phone' =>
                'Your mobile number has not been verified.',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | CLEAR RATE LIMIT
        |--------------------------------------------------------------------------
        */

        RateLimiter::clear(
            $this->throttleKey()
        );
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (
            !RateLimiter::tooManyAttempts(
                $this->throttleKey(),
                5
            )
        ) {
            return;
        }

        event(
            new Lockout($this)
        );

        $seconds =
            RateLimiter::availableIn(
                $this->throttleKey()
            );

        throw ValidationException::withMessages([
            'phone' =>
            __('auth.throttle', [
                'seconds' =>
                $seconds,

                'minutes' =>
                ceil(
                    $seconds / 60
                ),
            ]),
        ]);
    }

    /**
     * Get the login rate limiting throttle key.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(
            Str::lower(
                $this
                    ->string('phone')
                    ->toString()
            )
                . '|'
                . $this->ip()
        );
    }
}
