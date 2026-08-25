<?php


use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DeviceTokenController;
use App\Http\Controllers\Api\FCMTestController;
use App\Models\Department;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        "message" => "PONG eDTS is Ready!"
    ]);
});

Route::get('/departments', function () {
    return response()->json(
        Department::where('status', true)
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'code',
            ])
    );
});

Route::post(
    '/register',
    [AuthController::class, 'register']
);



Route::post(
    '/login',
    [AuthController::class, 'login']
);



Route::post(
    '/verify-otp',
    [AuthController::class, 'verifyOtp']
);

Route::post(
    '/resend-otp',
    [AuthController::class, 'resendOtp']
);

Route::post(
    '/forgot-password',
    [AuthController::class, 'forgotPassword']
);

Route::post(
    '/forgot-password/verify',
    [AuthController::class, 'verifyForgotPasswordOtp']
);

Route::post(
    '/forgot-password/reset',
    [AuthController::class, 'resetPassword']
);


Route::post(
    '/forgot-password/resend',
    [AuthController::class, 'resendForgotPasswordOtp']
);




















Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post(
        '/logout',
        [AuthController::class, 'logout']
    );



    Route::post(
        '/device-token',
        [DeviceTokenController::class, 'store']
    );

    Route::delete(
        '/device-token',
        [DeviceTokenController::class, 'destroy']
    );

    Route::post(
        '/fcm/test',
        [FCMTestController::class, 'send']
    );
});
