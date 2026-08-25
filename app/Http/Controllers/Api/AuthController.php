<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use App\Services\SmsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | OTP SETTINGS
    |--------------------------------------------------------------------------
    */

    private const OTP_EXPIRATION = 5; // minutes

    private const RECOVERY_EXPIRATION = 15; // minutes

    private const MAX_OTP_ATTEMPTS = 5;

    private const MAX_RESENDS = 3;

    /*
    |--------------------------------------------------------------------------
    | REGISTER
    |--------------------------------------------------------------------------
    */

    public function register(
        Request $request,
        SmsService $smsService
    ) {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'phone' => [
                'required',
                'string',
                'regex:/^09[0-9]{9}$/',
                'unique:users,phone',
            ],

            'department_id' => [
                'required',
                'integer',
                'exists:departments,id',
            ],

            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
            ],
        ], [
            'phone.regex' =>
            'Phone number must be exactly 11 digits and start with 09.',

            'phone.unique' =>
            'This phone number is already registered.',

            'password.confirmed' =>
            'Password confirmation does not match.',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'department_id' => $validated['department_id'],
            'password' => Hash::make(
                $validated['password']
            ),
            'phone_verified' => false,
        ]);

        /*
        |--------------------------------------------------------------------------
        | DEFAULT ROLE
        |--------------------------------------------------------------------------
        |
        | Every newly registered user becomes Department Head.
        |
        */

        $role = Role::where(
            'name',
            'department_head'
        )->first();

        if (!$role) {
            return response()->json([
                'message' =>
                'Department Head role does not exist.',
            ], 500);
        }

        $user->roles()->syncWithoutDetaching([
            $role->id,
        ]);

        /*
        |--------------------------------------------------------------------------
        | REGISTRATION OTP
        |--------------------------------------------------------------------------
        */

        $otp = $this->generateOtp();

        Cache::put(
            "registration_otp:{$user->id}",
            $otp,
            now()->addMinutes(self::OTP_EXPIRATION)
        );

        /*
        |--------------------------------------------------------------------------
        | SEND SMS
        |--------------------------------------------------------------------------
        */

        $smsSent = $smsService->send(
            $user->phone,
            "Your eDTS verification code is {$otp}. This code expires in 5 minutes."
        );

        if (!$smsSent) {
            return response()->json([
                'message' =>
                'Registration completed, but OTP could not be sent.',
            ], 500);
        }

        return response()->json([
            'message' =>
            'Registration successful. OTP verification required.',

            'user_id' =>
            $user->id,

            'phone' =>
            $user->phone,

            'otp_required' =>
            true,

            'expires_in' =>
            self::OTP_EXPIRATION * 60,
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | FORGOT PASSWORD
    |--------------------------------------------------------------------------
    */

    public function forgotPassword(
        Request $request,
        SmsService $smsService
    ) {
        $validated = $request->validate([
            'phone' => [
                'required',
                'string',
                'regex:/^09[0-9]{9}$/',
            ],
        ], [
            'phone.regex' =>
            'Phone number must be exactly 11 digits and start with 09.',
        ]);

        $user = User::where(
            'phone',
            $validated['phone']
        )->first();

        /*
        |--------------------------------------------------------------------------
        | DO NOT REVEAL WHETHER ACCOUNT EXISTS
        |--------------------------------------------------------------------------
        */

        if (!$user) {
            return response()->json([
                'message' =>
                'If the mobile number is registered, a verification code will be sent.',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | EXISTING RECOVERY SESSION
        |--------------------------------------------------------------------------
        */

        $sessionKey =
            "password_recovery:{$user->id}";

        $recovery = Cache::get(
            $sessionKey
        );

        /*
        |--------------------------------------------------------------------------
        | ALREADY ACTIVE
        |--------------------------------------------------------------------------
        |
        | This prevents the user from going back to
        | /forgot-password and generating another OTP.
        |
        */

        if ($recovery) {

            $expiresAt =
                $recovery['expires_at'] ?? null;

            if (
                $expiresAt &&
                now()->timestamp < $expiresAt
            ) {
                return response()->json([
                    'message' =>
                    'A password recovery request is already active. Please use the current verification code.',
                    'user_id' =>
                    $user->id,
                    'otp_expires_at' =>
                    $expiresAt,
                ], 429);
            }

            /*
            |--------------------------------------------------------------------------
            | RECOVERY SESSION EXPIRED
            |--------------------------------------------------------------------------
            */

            Cache::forget(
                $sessionKey
            );
        }

        /*
        |--------------------------------------------------------------------------
        | CREATE NEW RECOVERY SESSION
        |--------------------------------------------------------------------------
        */

        $otp = $this->generateOtp();

        $otpExpiresAt =
            now()->addMinutes(
                self::OTP_EXPIRATION
            );

        $recoveryExpiresAt =
            now()->addMinutes(
                self::RECOVERY_EXPIRATION
            );

        $recovery = [
            'user_id' =>
            $user->id,

            'phone' =>
            $user->phone,

            'otp' =>
            $otp,

            'otp_expires_at' =>
            $otpExpiresAt->timestamp,

            'attempts' =>
            0,

            'resends' =>
            0,

            'created_at' =>
            now()->timestamp,

            'expires_at' =>
            $recoveryExpiresAt->timestamp,
        ];

        Cache::put(
            $sessionKey,
            $recovery,
            $recoveryExpiresAt
        );

        /*
        |--------------------------------------------------------------------------
        | SEND OTP
        |--------------------------------------------------------------------------
        */

        $smsSent = $smsService->send(
            $user->phone,
            "Your eDTS password recovery code is {$otp}. This code expires in 5 minutes."
        );

        if (!$smsSent) {

            Cache::forget(
                $sessionKey
            );

            return response()->json([
                'message' =>
                'Unable to send verification code. Please try again later.',
            ], 500);
        }

        return response()->json([
            'message' =>
            'If the mobile number is registered, a verification code has been sent.',

            'user_id' =>
            $user->id,

            'phone' =>
            $user->phone,

            'otp_expires_at' =>
            $otpExpiresAt->timestamp,

            'otp_expires_in' =>
            self::OTP_EXPIRATION * 60,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | VERIFY FORGOT PASSWORD OTP
    |--------------------------------------------------------------------------
    */

    public function verifyForgotPasswordOtp(
        Request $request
    ) {
        $validated = $request->validate([
            'user_id' => [
                'required',
                'integer',
                'exists:users,id',
            ],

            'otp' => [
                'required',
                'digits:6',
            ],
        ]);

        $user = User::find(
            $validated['user_id']
        );

        if (!$user) {
            return response()->json([
                'message' =>
                'Invalid recovery request.',
            ], 422);
        }

        $sessionKey =
            "password_recovery:{$user->id}";

        $recovery = Cache::get(
            $sessionKey
        );

        /*
        |--------------------------------------------------------------------------
        | NO ACTIVE SESSION
        |--------------------------------------------------------------------------
        */

        if (!$recovery) {
            return response()->json([
                'message' =>
                'This password recovery session has expired. Please start again.',
            ], 410);
        }

        /*
        |--------------------------------------------------------------------------
        | RECOVERY SESSION EXPIRED
        |--------------------------------------------------------------------------
        */

        if (
            now()->timestamp >=
            $recovery['expires_at']
        ) {
            Cache::forget(
                $sessionKey
            );

            return response()->json([
                'message' =>
                'This password recovery session has expired. Please start again.',
            ], 410);
        }

        /*
        |--------------------------------------------------------------------------
        | OTP EXPIRED
        |--------------------------------------------------------------------------
        */

        if (
            now()->timestamp >=
            $recovery['otp_expires_at']
        ) {
            Cache::forget(
                $sessionKey
            );

            return response()->json([
                'message' =>
                'Your verification code has expired. Please request a new code.',
            ], 410);
        }

        /*
        |--------------------------------------------------------------------------
        | MAX ATTEMPTS
        |--------------------------------------------------------------------------
        */

        if (
            $recovery['attempts'] >=
            self::MAX_OTP_ATTEMPTS
        ) {
            Cache::forget(
                $sessionKey
            );

            return response()->json([
                'message' =>
                'Too many incorrect attempts. Please request a new verification code.',
            ], 429);
        }

        /*
        |--------------------------------------------------------------------------
        | INVALID OTP
        |--------------------------------------------------------------------------
        */

        if (
            !hash_equals(
                (string) $recovery['otp'],
                (string) $validated['otp']
            )
        ) {

            $recovery['attempts']++;

            Cache::put(
                $sessionKey,
                $recovery,
                now()->addSeconds(
                    max(
                        1,
                        $recovery['expires_at'] -
                            now()->timestamp
                    )
                )
            );

            $remaining =
                self::MAX_OTP_ATTEMPTS -
                $recovery['attempts'];

            return response()->json([
                'message' =>
                "Invalid verification code. {$remaining} attempt(s) remaining.",
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | OTP VALID
        |--------------------------------------------------------------------------
        */

        /*
        | Invalidate OTP immediately.
        */
        Cache::forget(
            $sessionKey
        );

        /*
        |--------------------------------------------------------------------------
        | CREATE ONE-TIME RESET TOKEN
        |--------------------------------------------------------------------------
        */

        $resetToken = Str::random(64);

        Cache::put(
            "password_reset_token:{$resetToken}",
            [
                'user_id' =>
                $user->id,

                'phone' =>
                $user->phone,

                'created_at' =>
                now()->timestamp,
            ],
            now()->addMinutes(10)
        );

        return response()->json([
            'message' =>
            'OTP verified successfully.',

            'reset_token' =>
            $resetToken,

            'user_id' =>
            $user->id,

            'expires_in' =>
            600,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | RESEND FORGOT PASSWORD OTP
    |--------------------------------------------------------------------------
    */

    public function resendForgotPasswordOtp(
        Request $request,
        SmsService $smsService
    ) {
        $validated = $request->validate([
            'user_id' => [
                'required',
                'integer',
                'exists:users,id',
            ],
        ]);

        $user = User::find(
            $validated['user_id']
        );

        if (!$user) {
            return response()->json([
                'message' =>
                'Invalid recovery request.',
            ], 422);
        }

        $sessionKey =
            "password_recovery:{$user->id}";

        $recovery = Cache::get(
            $sessionKey
        );

        /*
        |--------------------------------------------------------------------------
        | NO SESSION
        |--------------------------------------------------------------------------
        */

        if (!$recovery) {
            return response()->json([
                'message' =>
                'Your recovery session has expired. Please start again.',
            ], 410);
        }

        /*
        |--------------------------------------------------------------------------
        | MAX RESENDS
        |--------------------------------------------------------------------------
        */

        if (
            $recovery['resends'] >=
            self::MAX_RESENDS
        ) {
            Cache::forget(
                $sessionKey
            );

            return response()->json([
                'message' =>
                'Maximum resend attempts reached. Please start a new recovery request later.',
            ], 429);
        }

        /*
        |--------------------------------------------------------------------------
        | WAIT UNTIL CURRENT OTP EXPIRES
        |--------------------------------------------------------------------------
        */

        if (
            now()->timestamp <
            $recovery['otp_expires_at']
        ) {
            $remaining =
                $recovery['otp_expires_at'] -
                now()->timestamp;

            return response()->json([
                'message' =>
                'Please wait until the current verification code expires.',
                'retry_after' =>
                $remaining,
            ], 429);
        }

        /*
        |--------------------------------------------------------------------------
        | GENERATE NEW OTP
        |--------------------------------------------------------------------------
        */

        $otp = $this->generateOtp();

        $otpExpiresAt =
            now()->addMinutes(
                self::OTP_EXPIRATION
            );

        $recovery['otp'] =
            $otp;

        $recovery['otp_expires_at'] =
            $otpExpiresAt->timestamp;

        $recovery['attempts'] =
            0;

        $recovery['resends']++;

        /*
        |--------------------------------------------------------------------------
        | KEEP RECOVERY SESSION ALIVE
        |--------------------------------------------------------------------------
        */

        $remainingRecovery =
            max(
                1,
                $recovery['expires_at'] -
                    now()->timestamp
            );

        Cache::put(
            $sessionKey,
            $recovery,
            now()->addSeconds(
                $remainingRecovery
            )
        );

        /*
        |--------------------------------------------------------------------------
        | SEND NEW OTP
        |--------------------------------------------------------------------------
        */

        $smsSent = $smsService->send(
            $user->phone,
            "Your new eDTS password recovery code is {$otp}. This code expires in 5 minutes."
        );

        if (!$smsSent) {
            return response()->json([
                'message' =>
                'Unable to send the new verification code.',
            ], 500);
        }

        return response()->json([
            'message' =>
            'A new verification code has been sent.',

            'user_id' =>
            $user->id,

            'otp_expires_at' =>
            $otpExpiresAt->timestamp,

            'otp_expires_in' =>
            self::OTP_EXPIRATION * 60,

            'resends_remaining' =>
            self::MAX_RESENDS -
                $recovery['resends'],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | RESET PASSWORD
    |--------------------------------------------------------------------------
    */

    public function resetPassword(
        Request $request
    ) {
        $validated = $request->validate([
            'reset_token' => [
                'required',
                'string',
            ],

            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
            ],
        ]);

        $tokenKey =
            "password_reset_token:" .
            $validated['reset_token'];

        $resetSession = Cache::get(
            $tokenKey
        );

        if (!$resetSession) {
            return response()->json([
                'message' =>
                'Password reset session has expired.',
            ], 410);
        }

        $user = User::find(
            $resetSession['user_id']
        );

        if (!$user) {
            Cache::forget(
                $tokenKey
            );

            return response()->json([
                'message' =>
                'Invalid password reset request.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | UPDATE PASSWORD
        |--------------------------------------------------------------------------
        */

        $user->update([
            'password' =>
            Hash::make(
                $validated['password']
            ),
        ]);

        /*
        |--------------------------------------------------------------------------
        | TOKEN CAN ONLY BE USED ONCE
        |--------------------------------------------------------------------------
        */

        Cache::forget(
            $tokenKey
        );

        return response()->json([
            'message' =>
            'Password reset successfully.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | GENERATE OTP
    |--------------------------------------------------------------------------
    */

    private function generateOtp(): string
    {
        return str_pad(
            (string) random_int(
                0,
                999999
            ),
            6,
            '0',
            STR_PAD_LEFT
        );
    }
}
