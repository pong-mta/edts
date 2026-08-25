<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Services\SmsService;
use App\Models\Role;

class AuthController extends Controller
{
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

            'department' => [
                'required',
                'string',
                'max:255',
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
            'department' => $validated['department'],
            'password' => Hash::make(
                $validated['password']
            ),
            'phone_verified' => false,
        ]);

        $customerRole = Role::where(
            'name',
            'customer'
        )->firstOrFail();

        $user->roles()->attach(
            $customerRole->id
        );

        /*
        |--------------------------------------------------------------------------
        | SEND OTP
        |--------------------------------------------------------------------------
        */

        $otp = $this->createOtp(
            $user,
            $smsService
        );

        if (!$otp['sent']) {

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

        ], 201);
    }


    /*
    |--------------------------------------------------------------------------
    | LOGIN
    |--------------------------------------------------------------------------
    */

    public function login(
        Request $request,
        SmsService $smsService
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

        /*
        |--------------------------------------------------------------------------
        | FIND USER
        |--------------------------------------------------------------------------
        */

        $user = User::where(
            'phone',
            $validated['phone']
        )->first();

        /*
        |--------------------------------------------------------------------------
        | INVALID CREDENTIALS
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
                'The phone number or password is incorrect.',
            ], 401);
        }

        /*
        |--------------------------------------------------------------------------
        | PHONE NOT VERIFIED
        |--------------------------------------------------------------------------
        |
        | User has the correct password, but their
        | phone still needs verification.
        |
        */

        if (!$user->phone_verified) {

            /*
            |--------------------------------------------------------------------------
            | GENERATE NEW OTP
            |--------------------------------------------------------------------------
            */

            $otp = $this->createOtp(
                $user,
                $smsService
            );

            if (!$otp['sent']) {

                return response()->json([
                    'message' =>
                    'Login successful, but we could not send the verification code.',
                ], 500);
            }

            /*
            |--------------------------------------------------------------------------
            | SEND USER TO OTP SCREEN
            |--------------------------------------------------------------------------
            */

            return response()->json([
                'message' =>
                'Phone number verification is required.',

                'user_id' =>
                $user->id,

                'phone' =>
                $user->phone,

                'otp_required' =>
                true,

            ], 200);
        }

        /*
        |--------------------------------------------------------------------------
        | PHONE ALREADY VERIFIED
        |--------------------------------------------------------------------------
        */

        $token = $user
            ->createToken('mobile')
            ->plainTextToken;

        return response()->json([
            'message' =>
            'Login successful.',

            'user' => [
                'id' =>
                $user->id,

                'name' =>
                $user->name,

                'phone' =>
                $user->phone,

                'department' =>
                $user->department,

                'phone_verified' =>
                $user->phone_verified,

                'roles' =>
                $user->roles
                    ->pluck('name')
                    ->values()
                    ->toArray(),
            ],

            'token' =>
            $token,

            'token_type' =>
            'Bearer',

            'otp_required' =>
            false,



        ], 200);
    }


    /*
    |--------------------------------------------------------------------------
    | VERIFY OTP
    |--------------------------------------------------------------------------
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

        $user = User::findOrFail(
            $validated['user_id']
        );

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
        | GET LATEST OTP
        |--------------------------------------------------------------------------
        */

        $otpVerification = $user
            ->otpVerifications()
            ->whereNull('verified_at')
            ->latest()
            ->first();

        if (!$otpVerification) {

            return response()->json([
                'message' =>
                'No active OTP found.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | CHECK EXPIRATION
        |--------------------------------------------------------------------------
        */

        if (
            $otpVerification
            ->expires_at
            ->isPast()
        ) {

            return response()->json([
                'message' =>
                'OTP has expired.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | CHECK OTP
        |--------------------------------------------------------------------------
        */

        if (
            !Hash::check(
                $validated['otp'],
                $otpVerification->otp_hash
            )
        ) {

            return response()->json([
                'message' =>
                'Invalid OTP.',
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

        $otpVerification->update([
            'verified_at' => now(),
        ]);

        /*
        |--------------------------------------------------------------------------
        | CREATE SANCTUM TOKEN
        |--------------------------------------------------------------------------
        */

        $token = $user
            ->createToken('mobile')
            ->plainTextToken;

        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'message' =>
            'Phone number verified successfully.',

            'user' => [
                'id' =>
                $user->id,

                'name' =>
                $user->name,

                'phone' =>
                $user->phone,

                'department' =>
                $user->department,

                'phone_verified' =>
                $user->phone_verified,

                'roles' =>
                $user->roles
                    ->pluck('name')
                    ->values()
                    ->toArray(),
            ],

            'token' =>
            $token,

            'token_type' =>
            'Bearer',

        ], 200);
    }


    /*
    |--------------------------------------------------------------------------
    | CREATE OTP
    |--------------------------------------------------------------------------
    */

    private function createOtp(
        User $user,
        SmsService $smsService
    ): array {

        /*
        |--------------------------------------------------------------------------
        | GENERATE
        |--------------------------------------------------------------------------
        */

        $otp = (string) random_int(
            100000,
            999999
        );

        /*
        |--------------------------------------------------------------------------
        | LOG FOR DEVELOPMENT
        |--------------------------------------------------------------------------
        */

        \Log::info('PONG OTP', [
            'user_id' =>
            $user->id,

            'phone' =>
            $user->phone,

            'otp' =>
            $otp,
        ]);

        /*
        |--------------------------------------------------------------------------
        | DELETE OLD OTPs
        |--------------------------------------------------------------------------
        */

        $user
            ->otpVerifications()
            ->delete();

        /*
        |--------------------------------------------------------------------------
        | SAVE HASH
        |--------------------------------------------------------------------------
        */

        $user
            ->otpVerifications()
            ->create([
                'otp_hash' =>
                Hash::make($otp),

                'expires_at' =>
                now()->addMinutes(5),
            ]);

        /*
        |--------------------------------------------------------------------------
        | SMS
        |--------------------------------------------------------------------------
        */

        $message =
            "Your PONG verification code is {$otp}. "
            . "It expires in 5 minutes.";

        $smsSent = $smsService->send(
            $user->phone,
            $message
        );

        return [
            'sent' =>
            $smsSent,

            'otp' =>
            $otp,
        ];
    }



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

        $user = User::findOrFail(
            $validated['user_id']
        );

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
    | GENERATE NEW OTP
    |--------------------------------------------------------------------------
    */

        $otp = (string) random_int(
            100000,
            999999
        );

        \Log::info('PONG RESEND OTP', [
            'user_id' => $user->id,
            'phone' => $user->phone,
            'otp' => $otp,
        ]);

        /*
    |--------------------------------------------------------------------------
    | DELETE OLD OTP
    |--------------------------------------------------------------------------
    */

        $user
            ->otpVerifications()
            ->delete();

        /*
    |--------------------------------------------------------------------------
    | SAVE NEW OTP
    |--------------------------------------------------------------------------
    */

        $user
            ->otpVerifications()
            ->create([
                'otp_hash' =>
                Hash::make($otp),

                'expires_at' =>
                now()->addMinutes(5),
            ]);

        /*
    |--------------------------------------------------------------------------
    | SEND SMS
    |--------------------------------------------------------------------------
    */

        $message =
            "Your PONG verification code is {$otp}. "
            . "It expires in 5 minutes.";

        $smsSent = $smsService->send(
            $user->phone,
            $message
        );

        if (!$smsSent) {

            return response()->json([
                'message' =>
                'Unable to send a new verification code.',
            ], 500);
        }

        return response()->json([
            'message' =>
            'A new verification code has been sent.',

            'user_id' =>
            $user->id,

            'phone' =>
            $user->phone,

            'expires_in' =>
            300,

        ], 200);
    }

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

        /*
    |--------------------------------------------------------------------------
    | FIND USER
    |--------------------------------------------------------------------------
    */

        $user = User::where(
            'phone',
            $validated['phone']
        )->first();

        /*
    |--------------------------------------------------------------------------
    | DON'T REVEAL WHETHER ACCOUNT EXISTS
    |--------------------------------------------------------------------------
    */

        if (!$user) {

            return response()->json([
                'message' =>
                'If this mobile number is registered, a verification code has been sent.',
            ], 200);
        }

        /*
    |--------------------------------------------------------------------------
    | GENERATE OTP
    |--------------------------------------------------------------------------
    */

        $otp = (string) random_int(
            100000,
            999999
        );

        \Log::info('PONG PASSWORD RESET OTP', [
            'user_id' => $user->id,
            'phone' => $user->phone,
            'otp' => $otp,
        ]);

        /*
    |--------------------------------------------------------------------------
    | DELETE OLD OTPs
    |--------------------------------------------------------------------------
    */

        $user
            ->otpVerifications()
            ->delete();

        /*
    |--------------------------------------------------------------------------
    | SAVE OTP
    |--------------------------------------------------------------------------
    */

        $user
            ->otpVerifications()
            ->create([
                'otp_hash' =>
                Hash::make($otp),

                'expires_at' =>
                now()->addMinutes(5),
            ]);

        /*
    |--------------------------------------------------------------------------
    | SEND SMS
    |--------------------------------------------------------------------------
    */

        $message =
            "Your PONG password reset code is {$otp}. "
            . "It expires in 5 minutes.";

        $smsSent = $smsService->send(
            $user->phone,
            $message
        );

        /*
    |--------------------------------------------------------------------------
    | SMS FAILED
    |--------------------------------------------------------------------------
    */

        if (!$smsSent) {

            return response()->json([
                'message' =>
                'Unable to send the verification code. Please try again.',
            ], 500);
        }

        /*
    |--------------------------------------------------------------------------
    | SUCCESS
    |--------------------------------------------------------------------------
    */

        return response()->json([
            'message' =>
            'Verification code sent.',

            'user_id' =>
            $user->id,

            'phone' =>
            $user->phone,

            'otp_required' =>
            true,

        ], 200);
    }


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

        $user = User::findOrFail(
            $validated['user_id']
        );

        /*
    |--------------------------------------------------------------------------
    | GET LATEST OTP
    |--------------------------------------------------------------------------
    */

        $otpVerification = $user
            ->otpVerifications()
            ->whereNull('verified_at')
            ->latest()
            ->first();

        if (!$otpVerification) {

            return response()->json([
                'message' =>
                'No active verification code found.',
            ], 422);
        }

        /*
    |--------------------------------------------------------------------------
    | CHECK EXPIRATION
    |--------------------------------------------------------------------------
    */

        if (
            $otpVerification
            ->expires_at
            ->isPast()
        ) {

            return response()->json([
                'message' =>
                'Verification code has expired.',
            ], 422);
        }

        /*
    |--------------------------------------------------------------------------
    | CHECK OTP
    |--------------------------------------------------------------------------
    */

        if (
            !Hash::check(
                $validated['otp'],
                $otpVerification->otp_hash
            )
        ) {

            return response()->json([
                'message' =>
                'Invalid verification code.',
            ], 422);
        }

        /*
    |--------------------------------------------------------------------------
    | MARK OTP VERIFIED
    |--------------------------------------------------------------------------
    */

        $otpVerification->update([
            'verified_at' => now(),
        ]);

        /*
    |--------------------------------------------------------------------------
    | CREATE RESET TOKEN
    |--------------------------------------------------------------------------
    */

        $resetToken = bin2hex(
            random_bytes(32)
        );

        /*
    |--------------------------------------------------------------------------
    | STORE TEMPORARY RESET TOKEN
    |--------------------------------------------------------------------------
    |
    | For now we will use cache.
    |
    | Token expires after 10 minutes.
    |
    */

        cache()->put(
            'password_reset:' . $resetToken,
            $user->id,
            now()->addMinutes(10)
        );

        /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

        return response()->json([
            'message' =>
            'Verification code verified successfully.',

            'reset_token' =>
            $resetToken,

            'user_id' =>
            $user->id,

        ], 200);
    }


    public function resetPassword(Request $request)
    {
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
        ], [
            'password.confirmed' =>
            'Password confirmation does not match.',
        ]);

        /*
    |--------------------------------------------------------------------------
    | GET RESET TOKEN
    |--------------------------------------------------------------------------
    */

        $cacheKey =
            'password_reset:' .
            $validated['reset_token'];

        $userId = cache()->get(
            $cacheKey
        );

        if (!$userId) {

            return response()->json([
                'message' =>
                'Password reset session has expired. Please request a new code.',
            ], 422);
        }

        /*
    |--------------------------------------------------------------------------
    | FIND USER
    |--------------------------------------------------------------------------
    */

        $user = User::find(
            $userId
        );

        if (!$user) {

            cache()->forget(
                $cacheKey
            );

            return response()->json([
                'message' =>
                'Unable to reset this account.',
            ], 404);
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
    | CONSUME RESET TOKEN
    |--------------------------------------------------------------------------
    */

        cache()->forget(
            $cacheKey
        );

        /*
    |--------------------------------------------------------------------------
    | OPTIONAL SECURITY
    |--------------------------------------------------------------------------
    |
    | Remove all existing Sanctum tokens.
    |
    */

        $user
            ->tokens()
            ->delete();

        /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

        return response()->json([
            'message' =>
            'Password reset successfully.',
        ], 200);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }
}
