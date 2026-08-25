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
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | OTP SETTINGS
    |--------------------------------------------------------------------------
    */

    private const OTP_EXPIRATION = 5; // minutes

    private const RECOVERY_EXPIRATION = 15; // minutes

    private const RESET_TOKEN_EXPIRATION = 10; // minutes

    private const MAX_OTP_ATTEMPTS = 5;

    private const MAX_RESENDS = 3;


    /*
    |--------------------------------------------------------------------------
    | REGISTER
    |--------------------------------------------------------------------------
    |
    | Creates the user, assigns Department Head role,
    | generates registration OTP and sends SMS.
    |
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

        /*
        |--------------------------------------------------------------------------
        | CREATE USER
        |--------------------------------------------------------------------------
        */

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
        | Every new user is Department Head.
        |
        */

        $role = Role::where(
            'name',
            'department_head'
        )->first();

        if (!$role) {
            return response()->json([
                'message' =>
                'Department Head role does not exist. Run RoleSeeder first.',
            ], 500);
        }

        $user->roles()->syncWithoutDetaching([
            $role->id,
        ]);

        /*
        |--------------------------------------------------------------------------
        | CREATE REGISTRATION OTP
        |--------------------------------------------------------------------------
        */

        $otp = $this->generateOtp();

        Cache::put(
            "registration_otp:{$user->id}",
            [
                'otp' => $otp,
                'attempts' => 0,
                'created_at' => now()->timestamp,
                'expires_at' => now()
                    ->addMinutes(self::OTP_EXPIRATION)
                    ->timestamp,
            ],
            now()->addMinutes(
                self::OTP_EXPIRATION
            )
        );

        /*
        |--------------------------------------------------------------------------
        | SEND REGISTRATION OTP
        |--------------------------------------------------------------------------
        */

        $smsSent = $smsService->send(
            $user->phone,
            "Your eDTS verification code is {$otp}. This code expires in 5 minutes."
        );

        if (!$smsSent) {
            Cache::forget(
                "registration_otp:{$user->id}"
            );

            /*
            | Delete account because registration was not completed.
            */
            $user->delete();

            return response()->json([
                'message' =>
                'Unable to send verification code. Please try again.',
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
    | VERIFY REGISTRATION OTP
    |--------------------------------------------------------------------------
    |
    | POST /api/verify-otp
    |
    */

    public function verifyOtp(
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
                'Invalid verification request.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | ALREADY VERIFIED
        |--------------------------------------------------------------------------
        */

        if ($user->phone_verified) {
            return response()->json([
                'message' =>
                'Phone number is already verified.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | GET REGISTRATION OTP
        |--------------------------------------------------------------------------
        */

        $cacheKey =
            "registration_otp:{$user->id}";

        $registration = Cache::get(
            $cacheKey
        );

        if (!$registration) {
            return response()->json([
                'message' =>
                'Your verification code has expired. Please request a new code.',
            ], 410);
        }

        /*
        |--------------------------------------------------------------------------
        | CHECK EXPIRATION
        |--------------------------------------------------------------------------
        */

        if (
            isset($registration['expires_at']) &&
            now()->timestamp >=
            $registration['expires_at']
        ) {
            Cache::forget(
                $cacheKey
            );

            return response()->json([
                'message' =>
                'Your verification code has expired. Please request a new code.',
            ], 410);
        }

        /*
        |--------------------------------------------------------------------------
        | CHECK ATTEMPTS
        |--------------------------------------------------------------------------
        */

        $attempts =
            $registration['attempts'] ?? 0;

        if (
            $attempts >=
            self::MAX_OTP_ATTEMPTS
        ) {
            Cache::forget(
                $cacheKey
            );

            return response()->json([
                'message' =>
                'Too many incorrect attempts. Please request a new verification code.',
            ], 429);
        }

        /*
        |--------------------------------------------------------------------------
        | CHECK OTP
        |--------------------------------------------------------------------------
        */

        if (
            !hash_equals(
                (string) $registration['otp'],
                (string) $validated['otp']
            )
        ) {
            $registration['attempts'] =
                $attempts + 1;

            $remainingSeconds = max(
                1,
                $registration['expires_at'] -
                    now()->timestamp
            );

            Cache::put(
                $cacheKey,
                $registration,
                now()->addSeconds(
                    $remainingSeconds
                )
            );

            $remaining =
                self::MAX_OTP_ATTEMPTS -
                $registration['attempts'];

            return response()->json([
                'message' =>
                "Invalid verification code. {$remaining} attempt(s) remaining.",
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | VERIFY PHONE
        |--------------------------------------------------------------------------
        */

        $user->update([
            'phone_verified' => true,
        ]);

        /*
        |--------------------------------------------------------------------------
        | REMOVE REGISTRATION OTP
        |--------------------------------------------------------------------------
        */

        Cache::forget(
            $cacheKey
        );

        return response()->json([
            'message' =>
            'Phone number verified successfully.',

            'user_id' =>
            $user->id,

            'phone_verified' =>
            true,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | RESEND REGISTRATION OTP
    |--------------------------------------------------------------------------
    |
    | POST /api/resend-otp
    |
    | User can only resend after the current OTP expires.
    |
    */

    public function resendOtp(
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
                'Invalid registration request.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | ALREADY VERIFIED
        |--------------------------------------------------------------------------
        */

        if ($user->phone_verified) {
            return response()->json([
                'message' =>
                'Phone number is already verified.',
            ], 422);
        }

        $cacheKey =
            "registration_otp:{$user->id}";

        $registration = Cache::get(
            $cacheKey
        );

        /*
        |--------------------------------------------------------------------------
        | NO ACTIVE OTP
        |--------------------------------------------------------------------------
        */

        if (!$registration) {
            return response()->json([
                'message' =>
                'Your registration verification session has expired. Please register again.',
            ], 410);
        }

        /*
        |--------------------------------------------------------------------------
        | OTP STILL ACTIVE
        |--------------------------------------------------------------------------
        */

        if (
            now()->timestamp <
            $registration['expires_at']
        ) {
            $retryAfter =
                $registration['expires_at'] -
                now()->timestamp;

            return response()->json([
                'message' =>
                'Please wait until the current verification code expires.',

                'retry_after' =>
                $retryAfter,
            ], 429);
        }

        /*
        |--------------------------------------------------------------------------
        | RESEND COUNT
        |--------------------------------------------------------------------------
        */

        $resends =
            $registration['resends'] ?? 0;

        if (
            $resends >=
            self::MAX_RESENDS
        ) {
            Cache::forget(
                $cacheKey
            );

            return response()->json([
                'message' =>
                'Maximum resend attempts reached. Please register again.',
            ], 429);
        }

        /*
        |--------------------------------------------------------------------------
        | GENERATE NEW OTP
        |--------------------------------------------------------------------------
        */

        $otp = $this->generateOtp();

        $expiresAt = now()->addMinutes(
            self::OTP_EXPIRATION
        );

        $registration['otp'] =
            $otp;

        $registration['attempts'] =
            0;

        $registration['resends'] =
            $resends + 1;

        $registration['expires_at'] =
            $expiresAt->timestamp;

        /*
        |--------------------------------------------------------------------------
        | SAVE NEW OTP
        |--------------------------------------------------------------------------
        */

        Cache::put(
            $cacheKey,
            $registration,
            $expiresAt
        );

        /*
        |--------------------------------------------------------------------------
        | SEND SMS
        |--------------------------------------------------------------------------
        */

        $smsSent = $smsService->send(
            $user->phone,
            "Your new eDTS verification code is {$otp}. This code expires in 5 minutes."
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

            'phone' =>
            $user->phone,

            'otp_expires_at' =>
            $expiresAt->timestamp,

            'otp_expires_in' =>
            self::OTP_EXPIRATION * 60,

            'resends_remaining' =>
            self::MAX_RESENDS -
                $registration['resends'],
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | LOGIN
    |--------------------------------------------------------------------------
    |
    | POST /api/login
    |
    */

    public function login(
        Request $request
    ) {
        $validated = $request->validate([
            'phone' => [
                'required',
                'string',
                'regex:/^09[0-9]{9}$/',
            ],

            'password' => [
                'required',
                'string',
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
        | INVALID LOGIN
        |--------------------------------------------------------------------------
        */

        if (
            !$user ||
            !Hash::check(
                $validated['password'],
                $user->password
            )
        ) {
            return response()->json([
                'message' =>
                'Invalid phone number or password.',
            ], 401);
        }

        /*
        |--------------------------------------------------------------------------
        | PHONE NOT VERIFIED
        |--------------------------------------------------------------------------
        */

        if (!$user->phone_verified) {
            return response()->json([
                'message' =>
                'Please verify your phone number first.',

                'user_id' =>
                $user->id,

                'phone_verified' =>
                false,

                'verification_required' =>
                true,
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | DELETE OLD TOKENS
        |--------------------------------------------------------------------------
        */

        $user->tokens()->delete();

        /*
        |--------------------------------------------------------------------------
        | CREATE TOKEN
        |--------------------------------------------------------------------------
        */

        $token = $user->createToken(
            'eDTS Mobile/Web'
        )->plainTextToken;

        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'message' =>
            'Login successful.',

            'token' =>
            $token,

            'token_type' =>
            'Bearer',

            'user' =>
            $user->load([
                'department',
                'roles',
            ]),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | LOGOUT
    |--------------------------------------------------------------------------
    |
    | POST /api/logout
    |
    */

    public function logout(
        Request $request
    ) {
        $user = $request->user();

        if ($user) {
            /*
            | Delete only the current token.
            */
            $user->currentAccessToken()?->delete();
        }

        return response()->json([
            'message' =>
            'Logged out successfully.',
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | FORGOT PASSWORD
    |--------------------------------------------------------------------------
    |
    | POST /api/forgot-password
    |
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
        | DO NOT REVEAL ACCOUNT EXISTENCE
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

        if ($recovery) {
            $expiresAt =
                $recovery['expires_at'] ??
                null;

            if (
                $expiresAt &&
                now()->timestamp <
                $expiresAt
            ) {
                return response()->json([
                    'message' =>
                    'A password recovery request is already active. Please use the current verification code.',

                    'user_id' =>
                    $user->id,

                    'phone' =>
                    $user->phone,

                    'otp_expires_at' =>
                    $recovery['otp_expires_at'],
                ], 429);
            }

            Cache::forget(
                $sessionKey
            );
        }

        /*
        |--------------------------------------------------------------------------
        | CREATE RECOVERY OTP
        |--------------------------------------------------------------------------
        */

        $otp = $this->generateOtp();

        $otpExpiresAt = now()->addMinutes(
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
        | SEND SMS
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
    |
    | POST /api/forgot-password/verify
    |
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
        | NO SESSION
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
            /*
            | Keep the recovery session.
            |
            | This is important because the user must be
            | able to RESEND after the 5-minute OTP expires.
            */

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
                'Too many incorrect attempts. Please start a new recovery request.',
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

            $remainingSeconds = max(
                1,
                $recovery['expires_at'] -
                    now()->timestamp
            );

            Cache::put(
                $sessionKey,
                $recovery,
                now()->addSeconds(
                    $remainingSeconds
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

        Cache::forget(
            $sessionKey
        );

        /*
        |--------------------------------------------------------------------------
        | CREATE ONE-TIME RESET TOKEN
        |--------------------------------------------------------------------------
        */

        $resetToken =
            Str::random(64);

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
            now()->addMinutes(
                self::RESET_TOKEN_EXPIRATION
            )
        );

        return response()->json([
            'message' =>
            'OTP verified successfully.',

            'reset_token' =>
            $resetToken,

            'user_id' =>
            $user->id,

            'expires_in' =>
            self::RESET_TOKEN_EXPIRATION * 60,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | RESEND FORGOT PASSWORD OTP
    |--------------------------------------------------------------------------
    |
    | POST /api/forgot-password/resend
    |
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
                'Your recovery session has expired. Please start again.',
            ], 410);
        }

        /*
        |--------------------------------------------------------------------------
        | MAX RESENDS
        |--------------------------------------------------------------------------
        */

        $resends =
            $recovery['resends'] ?? 0;

        if (
            $resends >=
            self::MAX_RESENDS
        ) {
            return response()->json([
                'message' =>
                'Maximum resend attempts reached.',
            ], 429);
        }

        /*
        |--------------------------------------------------------------------------
        | CURRENT OTP STILL ACTIVE
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
        | CREATE NEW OTP
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

        $recovery['resends'] =
            $resends + 1;

        /*
        |--------------------------------------------------------------------------
        | KEEP ORIGINAL RECOVERY EXPIRATION
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
        | SEND SMS
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

            'phone' =>
            $user->phone,

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
    |
    | POST /api/forgot-password/reset
    |
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

        /*
        |--------------------------------------------------------------------------
        | INVALID / EXPIRED TOKEN
        |--------------------------------------------------------------------------
        */

        if (!$resetSession) {
            return response()->json([
                'message' =>
                'Password reset session has expired. Please start again.',
            ], 410);
        }

        /*
        |--------------------------------------------------------------------------
        | GET USER
        |--------------------------------------------------------------------------
        */

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
        | DELETE ALL EXISTING TOKENS
        |--------------------------------------------------------------------------
        |
        | Optional security measure:
        | changing password logs out existing API sessions.
        |
        */

        $user->tokens()->delete();

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
