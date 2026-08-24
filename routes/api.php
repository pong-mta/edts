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

    //Location Save
    Route::post(
        '/locations',
        [UserLocationController::class, 'store']
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

    Route::get(
        '/grocery/stores',
        [GroceryStoreController::class, 'index']
    );
    Route::get(
        '/grocery/stores/{store}/categories',
        [GroceryStoreController::class, 'categories']
    );
    Route::get(
        '/grocery/stores/{store}/categories/{category}/products',
        [GroceryStoreController::class, 'products']
    );
    Route::get(
        '/grocery/products/{product}/variants',
        [GroceryStoreController::class, 'variants']
    );
    Route::get(
        '/grocery/cart',
        [GroceryCartController::class, 'show']
    );

    Route::post(
        '/grocery/cart/items',
        [GroceryCartController::class, 'addItem']
    );

    Route::put(
        '/grocery/cart/items/{item}',
        [GroceryCartController::class, 'updateItem']
    );

    Route::delete(
        '/grocery/cart/items/{item}',
        [GroceryCartController::class, 'removeItem']
    );

    Route::post(
        '/grocery/checkout',
        [GroceryCheckoutController::class, 'checkout']
    );

    Route::post(
        '/grocery/delivery-quote',
        [GroceryCheckoutController::class, 'deliveryQuote']
    );

    Route::get(
        '/grocery/orders',
        [GroceryOrderController::class, 'index']
    );

    Route::get(
        '/grocery/orders/{order}',
        [GroceryOrderController::class, 'show']
    );

    Route::put(
        '/grocery/store/orders/{order}/status',
        [
            GroceryStoreOrderController::class,
            'updateStatus',
        ]
    );

    Route::get(
        '/grocery/store/orders/{order}',
        [
            GroceryStoreOrderController::class,
            'show',
        ]
    );

    Route::get(
        '/grocery/store/orders',
        [
            GroceryStoreOrderController::class,
            'index',
        ]
    );

    Route::get(
        '/grocery/store-owner/application',
        [
            GroceryStoreOwnerApplicationController::class,
            'show',
        ]
    );

    Route::post(
        '/grocery/store-owner/apply',
        [
            GroceryStoreOwnerApplicationController::class,
            'apply',
        ]
    );






    //ADMIN CONTROL STORE APPLICATIONS
    Route::get(
        '/admin/store-owner-applications',
        [
            AdminStoreOwnerApplicationController::class,
            'index',
        ]
    );

    Route::get(
        '/admin/store-owner-applications/{application}',
        [
            AdminStoreOwnerApplicationController::class,
            'show',
        ]
    );

    Route::put(
        '/admin/store-owner-applications/{application}/approve',
        [
            AdminStoreOwnerApplicationController::class,
            'approve',
        ]
    );

    Route::put(
        '/admin/store-owner-applications/{application}/reject',
        [
            AdminStoreOwnerApplicationController::class,
            'reject',
        ]
    );

    //Products
    Route::get(
        '/grocery/store/products',
        [GroceryStoreProductController::class, 'index']
    );

    Route::post(
        '/grocery/store/products',
        [GroceryStoreProductController::class, 'store']
    );

    Route::put(
        '/grocery/store/products/{product}',
        [GroceryStoreProductController::class, 'update']
    );

    Route::delete(
        '/grocery/store/products/{product}',
        [GroceryStoreProductController::class, 'destroy']
    );

    // Store Owner Categories

    Route::get(
        '/grocery/store/categories',
        [
            GroceryStoreCategoryController::class,
            'index',
        ]
    );

    Route::post(
        '/grocery/store/categories',
        [
            GroceryStoreCategoryController::class,
            'store',
        ]
    );
    Route::put(
        '/grocery/store/categories/{category}',
        [
            GroceryStoreCategoryController::class,
            'update',
        ]
    );

    Route::delete(
        '/grocery/store/categories/{category}',
        [
            GroceryStoreCategoryController::class,
            'destroy',
        ]
    );

    //Multiple Stores
    Route::get(
        '/grocery/store/my-stores',
        [
            GroceryStoreController::class,
            'ownerStores',
        ]
    );

    /*
    |--------------------------------------------------------------------------
    | STORE OWNER — STORE SETTINGS
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/grocery/store/{store}/settings',
        [
            GroceryStoreController::class,
            'ownerStore',
        ]
    );

    Route::put(
        '/grocery/store/{store}/settings',
        [
            GroceryStoreController::class,
            'updateOwnerStore',
        ]
    );
});
