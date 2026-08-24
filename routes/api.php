<?php

use App\Http\Controllers\Api\AdminStoreOwnerApplicationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DeviceTokenController;
use App\Http\Controllers\Api\FCMTestController;
use App\Http\Controllers\Api\GroceryCartController;
use App\Http\Controllers\Api\GroceryCheckoutController;
use App\Http\Controllers\Api\GroceryOrderController;
use App\Http\Controllers\Api\GroceryStoreCategoryController;
use App\Http\Controllers\Api\GroceryStoreController;
use App\Http\Controllers\Api\GroceryStoreOrderController;
use App\Http\Controllers\Api\GroceryStoreOwnerApplicationController;
use App\Http\Controllers\Api\GroceryStoreProductController;
use App\Http\Controllers\Api\UserLocationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        "message" => "PONG is Ready!"
    ]);
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
