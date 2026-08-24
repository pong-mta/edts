<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Order;
use App\Services\GroceryOrderNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GroceryCheckoutController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | DELIVERY PRICING
    |--------------------------------------------------------------------------
    |
    | First 4 km  = ₱30
    | Every started kilometer after 4 km = ₱10
    |
    */

    private const BASE_DISTANCE_KM = 4.0;

    private const BASE_DELIVERY_FEE = 30.00;

    private const ADDITIONAL_KM_FEE = 10.00;


    /*
    |--------------------------------------------------------------------------
    | CHECKOUT
    |--------------------------------------------------------------------------
    */

    public function checkout(
        Request $request,
        GroceryOrderNotificationService $notificationService
    ): JsonResponse {

        /*
        |--------------------------------------------------------------------------
        | VALIDATE REQUEST
        |--------------------------------------------------------------------------
        */

        $validated = $request->validate([

            'fulfillment_type' => [
                'required',
                'in:delivery,pickup',
            ],

            'delivery_address' => [
                'nullable',
                'string',
                'max:1000',
            ],

            'delivery_latitude' => [
                'nullable',
                'numeric',
                'between:-90,90',
            ],

            'delivery_longitude' => [
                'nullable',
                'numeric',
                'between:-180,180',
            ],

            'notes' => [
                'nullable',
                'string',
                'max:1000',
            ],

            'payment_method' => [
                'required',
                'in:cod,gcash,maya,card',
            ],

        ]);


        /*
        |--------------------------------------------------------------------------
        | AUTHENTICATED USER
        |--------------------------------------------------------------------------
        */

        $user = $request->user();


        /*
        |--------------------------------------------------------------------------
        | DELIVERY VALIDATION
        |--------------------------------------------------------------------------
        */

        if (
            $validated['fulfillment_type'] === 'delivery'
            &&
            empty($validated['delivery_address'])
        ) {

            return response()->json([
                'success' => false,

                'message' =>
                'Delivery address is required.',

            ], 422);
        }


        /*
        |--------------------------------------------------------------------------
        | DELIVERY LOCATION VALIDATION
        |--------------------------------------------------------------------------
        |
        | Delivery orders MUST contain GPS coordinates.
        |
        */

        if (
            $validated['fulfillment_type'] === 'delivery'
            &&
            (
                !isset($validated['delivery_latitude'])
                ||
                !isset($validated['delivery_longitude'])
            )
        ) {

            return response()->json([
                'success' => false,

                'message' =>
                'Your current location is required for delivery.',
            ], 422);
        }


        /*
        |--------------------------------------------------------------------------
        | CREATE ORDER
        |--------------------------------------------------------------------------
        */

        $order = DB::transaction(
            function () use (
                $validated,
                $user
            ) {

                /*
                |--------------------------------------------------------------------------
                | FIND ACTIVE CART
                |--------------------------------------------------------------------------
                */

                $cart = Cart::query()
                    ->where(
                        'user_id',
                        $user->id
                    )
                    ->where(
                        'status',
                        'active'
                    )
                    ->with([
                        'store',
                        'items',
                    ])
                    ->lockForUpdate()
                    ->first();


                /*
                |--------------------------------------------------------------------------
                | NO CART
                |--------------------------------------------------------------------------
                */

                if (!$cart) {

                    throw new \RuntimeException(
                        'Your cart is empty.'
                    );
                }


                /*
                |--------------------------------------------------------------------------
                | EMPTY CART
                |--------------------------------------------------------------------------
                */

                if (
                    $cart->items->isEmpty()
                ) {

                    throw new \RuntimeException(
                        'Your cart is empty.'
                    );
                }


                /*
                |--------------------------------------------------------------------------
                | CHECK STORE
                |--------------------------------------------------------------------------
                */

                if (!$cart->store) {

                    throw new \RuntimeException(
                        'The store associated with your cart no longer exists.'
                    );
                }


                /*
                |--------------------------------------------------------------------------
                | CHECK PRODUCTS / STOCK / PRICE
                |--------------------------------------------------------------------------
                */

                $subtotal = 0;

                $lockedItems = [];


                foreach (
                    $cart->items as $cartItem
                ) {

                    /*
                    |--------------------------------------------------------------------------
                    | LOCK PRODUCT VARIANT
                    |--------------------------------------------------------------------------
                    */

                    $variant =
                        $cartItem
                        ->productVariant()
                        ->with('product')
                        ->lockForUpdate()
                        ->first();


                    /*
                    |--------------------------------------------------------------------------
                    | PRODUCT DOES NOT EXIST
                    |--------------------------------------------------------------------------
                    */

                    if (!$variant) {

                        throw new \RuntimeException(
                            'A product in your cart no longer exists.'
                        );
                    }


                    /*
                    |--------------------------------------------------------------------------
                    | PRODUCT MUST BE ACTIVE
                    |--------------------------------------------------------------------------
                    */

                    if (
                        !$variant->is_active
                        ||
                        !$variant->product
                        ||
                        !$variant->product->is_active
                    ) {

                        throw new \RuntimeException(
                            "{$variant->name} is no longer available."
                        );
                    }


                    /*
                    |--------------------------------------------------------------------------
                    | PRODUCT MUST BELONG TO CART STORE
                    |--------------------------------------------------------------------------
                    */

                    if (
                        (int)
                        $variant
                            ->product
                            ->store_id
                        !==
                        (int)
                        $cart->store_id
                    ) {

                        throw new \RuntimeException(
                            'A cart item does not belong to this store.'
                        );
                    }


                    /*
                    |--------------------------------------------------------------------------
                    | STOCK CHECK
                    |--------------------------------------------------------------------------
                    */

                    if (
                        $cartItem->quantity
                        >
                        $variant->stock
                    ) {

                        throw new \RuntimeException(
                            "{$variant->name} only has {$variant->stock} item(s) available."
                        );
                    }


                    /*
                    |--------------------------------------------------------------------------
                    | USE CURRENT DATABASE PRICE
                    |--------------------------------------------------------------------------
                    */

                    $unitPrice =
                        (float)
                        $variant->price;


                    $quantity =
                        (int)
                        $cartItem->quantity;


                    $itemSubtotal =
                        $unitPrice *
                        $quantity;


                    $subtotal +=
                        $itemSubtotal;


                    $lockedItems[] = [

                        'variant' =>
                        $variant,

                        'quantity' =>
                        $quantity,

                        'unit_price' =>
                        $unitPrice,

                        'subtotal' =>
                        $itemSubtotal,

                    ];
                }


                /*
                |--------------------------------------------------------------------------
                | DELIVERY FEE
                |--------------------------------------------------------------------------
                */

                $deliveryFee = 0.00;

                $deliveryDistanceKm = null;


                /*
                |--------------------------------------------------------------------------
                | CALCULATE DELIVERY FEE
                |--------------------------------------------------------------------------
                */

                if (
                    $validated['fulfillment_type']
                    ===
                    'delivery'
                ) {

                    /*
                    |--------------------------------------------------------------------------
                    | STORE LOCATION
                    |--------------------------------------------------------------------------
                    */

                    $storeLatitude =
                        $cart->store->latitude;

                    $storeLongitude =
                        $cart->store->longitude;


                    /*
                    |--------------------------------------------------------------------------
                    | STORE MUST HAVE LOCATION
                    |--------------------------------------------------------------------------
                    */

                    if (
                        $storeLatitude === null
                        ||
                        $storeLongitude === null
                    ) {

                        throw new \RuntimeException(
                            'This store does not have a delivery location configured.'
                        );
                    }


                    /*
                    |--------------------------------------------------------------------------
                    | CUSTOMER LOCATION
                    |--------------------------------------------------------------------------
                    */

                    $customerLatitude =
                        (float)
                        $validated['delivery_latitude'];

                    $customerLongitude =
                        (float)
                        $validated['delivery_longitude'];


                    /*
                    |--------------------------------------------------------------------------
                    | CALCULATE DISTANCE
                    |--------------------------------------------------------------------------
                    */

                    $deliveryDistanceKm =
                        $this->calculateDistanceKm(
                            (float)
                            $storeLatitude,

                            (float)
                            $storeLongitude,

                            $customerLatitude,

                            $customerLongitude
                        );


                    /*
                    |--------------------------------------------------------------------------
                    | CALCULATE FEE
                    |--------------------------------------------------------------------------
                    |
                    | 0–4 km = ₱30
                    |
                    | Beyond 4 km:
                    |
                    | ₱30 + ₱10 for every started kilometer.
                    |
                    */

                    if (
                        $deliveryDistanceKm
                        <=
                        self::BASE_DISTANCE_KM
                    ) {

                        $deliveryFee =
                            self::BASE_DELIVERY_FEE;
                    } else {

                        $additionalDistance =
                            $deliveryDistanceKm
                            -
                            self::BASE_DISTANCE_KM;


                        $additionalKilometers =
                            (int)
                            ceil(
                                $additionalDistance
                            );


                        $deliveryFee =
                            self::BASE_DELIVERY_FEE
                            +
                            (
                                $additionalKilometers
                                *
                                self::ADDITIONAL_KM_FEE
                            );
                    }
                }


                /*
                |--------------------------------------------------------------------------
                | TOTAL
                |--------------------------------------------------------------------------
                */

                $total =
                    $subtotal +
                    $deliveryFee;


                /*
                |--------------------------------------------------------------------------
                | GENERATE ORDER NUMBER
                |--------------------------------------------------------------------------
                */

                do {

                    $orderNumber =
                        'PONG-' .
                        now()->format(
                            'YmdHis'
                        ) .
                        '-' .
                        strtoupper(
                            Str::random(4)
                        );
                } while (
                    Order::where(
                        'order_number',
                        $orderNumber
                    )->exists()
                );


                /*
                |--------------------------------------------------------------------------
                | CREATE ORDER
                |--------------------------------------------------------------------------
                */

                $order = Order::create([

                    'user_id' =>
                    $user->id,

                    'store_id' =>
                    $cart->store_id,

                    'order_number' =>
                    $orderNumber,

                    'status' =>
                    'pending',

                    'fulfillment_type' =>
                    $validated['fulfillment_type'],

                    'payment_method' =>
                    $validated['payment_method'],

                    'payment_status' =>
                    'pending',

                    'payment_reference' =>
                    null,

                    'paid_at' =>
                    null,

                    'subtotal' =>
                    $subtotal,

                    'delivery_fee' =>
                    $deliveryFee,

                    'total' =>
                    $total,

                    'delivery_address' =>
                    $validated['delivery_address'] ?? null,

                    'delivery_latitude' =>
                    $validated['delivery_latitude'] ?? null,

                    'delivery_longitude' =>
                    $validated['delivery_longitude'] ?? null,

                    'notes' =>
                    $validated['notes'] ?? null,

                ]);


                /*
                |--------------------------------------------------------------------------
                | CREATE ORDER ITEMS + DEDUCT STOCK
                |--------------------------------------------------------------------------
                */

                foreach (
                    $lockedItems as $data
                ) {

                    $variant =
                        $data['variant'];


                    $quantity =
                        $data['quantity'];


                    $unitPrice =
                        $data['unit_price'];


                    $itemSubtotal =
                        $data['subtotal'];


                    /*
                    |--------------------------------------------------------------------------
                    | ORDER ITEM
                    |--------------------------------------------------------------------------
                    */

                    $order->items()->create([

                        'product_variant_id' =>
                        $variant->id,

                        'product_name' =>
                        $variant
                            ->product
                            ->name,

                        'variant_name' =>
                        $variant->name,

                        'sku' =>
                        $variant->sku,

                        'quantity' =>
                        $quantity,

                        'unit_price' =>
                        $unitPrice,

                        'subtotal' =>
                        $itemSubtotal,

                    ]);


                    /*
                    |--------------------------------------------------------------------------
                    | STOCK
                    |--------------------------------------------------------------------------
                    */

                    $variant->decrement(
                        'stock',
                        $quantity
                    );
                }


                /*
                |--------------------------------------------------------------------------
                | DELETE TEMPORARY CART
                |--------------------------------------------------------------------------
                */

                $cart->delete();


                /*
                |--------------------------------------------------------------------------
                | RETURN ORDER
                |--------------------------------------------------------------------------
                */

                return $order;
            }
        );


        /*
        |--------------------------------------------------------------------------
        | LOAD ORDER FOR RESPONSE + NOTIFICATIONS
        |--------------------------------------------------------------------------
        */

        $order->load([
            'user',
            'store:id,name,slug,logo',
            'items',
        ]);


        /*
        |--------------------------------------------------------------------------
        | SEND ORDER PLACED NOTIFICATIONS
        |--------------------------------------------------------------------------
        */

        try {

            $notificationService
                ->orderPlaced(
                    $order
                );
        } catch (\Throwable $e) {

            /*
            |--------------------------------------------------------------------------
            | IMPORTANT
            |--------------------------------------------------------------------------
            |
            | Notification failure must NOT make
            | a successful order look like a
            | failed checkout.
            |
            */

            \Log::error(
                'GROCERY ORDER NOTIFICATION ERROR',
                [

                    'order_id' =>
                    $order->id,

                    'order_number' =>
                    $order->order_number,

                    'error' =>
                    $e->getMessage(),

                ]
            );
        }


        /*
        |--------------------------------------------------------------------------
        | RETURN ORDER
        |--------------------------------------------------------------------------
        */

        return response()->json([

            'success' => true,

            'message' =>
            'Order placed successfully.',

            'order' => [

                'id' =>
                $order->id,

                'order_number' =>
                $order->order_number,

                'status' =>
                $order->status,

                'fulfillment_type' =>
                $order->fulfillment_type,

                'payment_method' =>
                $order->payment_method,

                'payment_status' =>
                $order->payment_status,

                'payment_reference' =>
                $order->payment_reference,

                'paid_at' =>
                $order->paid_at,


                /*
                |--------------------------------------------------------------------------
                | STORE
                |--------------------------------------------------------------------------
                */

                'store' =>
                $order->store
                    ? [

                        'id' =>
                        $order
                            ->store
                            ->id,

                        'name' =>
                        $order
                            ->store
                            ->name,

                        'slug' =>
                        $order
                            ->store
                            ->slug,

                        'logo' =>
                        $order
                            ->store
                            ->logo,

                    ]

                    : null,


                /*
                |--------------------------------------------------------------------------
                | ITEMS
                |--------------------------------------------------------------------------
                */

                'items' =>
                $order
                    ->items
                    ->map(
                        function ($item) {

                            return [

                                'id' =>
                                $item->id,

                                'product_variant_id' =>
                                $item
                                    ->product_variant_id,

                                'product_name' =>
                                $item
                                    ->product_name,

                                'variant_name' =>
                                $item
                                    ->variant_name,

                                'sku' =>
                                $item->sku,

                                'quantity' =>
                                $item
                                    ->quantity,

                                'unit_price' =>
                                number_format(
                                    (float)
                                    $item
                                        ->unit_price,
                                    2,
                                    '.',
                                    ''
                                ),

                                'subtotal' =>
                                number_format(
                                    (float)
                                    $item
                                        ->subtotal,
                                    2,
                                    '.',
                                    ''
                                ),

                            ];
                        }
                    )
                    ->values(),


                /*
                |--------------------------------------------------------------------------
                | SUBTOTAL
                |--------------------------------------------------------------------------
                */

                'subtotal' =>
                number_format(
                    (float)
                    $order->subtotal,
                    2,
                    '.',
                    ''
                ),


                /*
                |--------------------------------------------------------------------------
                | DELIVERY FEE
                |--------------------------------------------------------------------------
                */

                'delivery_fee' =>
                number_format(
                    (float)
                    $order->delivery_fee,
                    2,
                    '.',
                    ''
                ),


                /*
                |--------------------------------------------------------------------------
                | TOTAL
                |--------------------------------------------------------------------------
                */

                'total' =>
                number_format(
                    (float)
                    $order->total,
                    2,
                    '.',
                    ''
                ),


                /*
                |--------------------------------------------------------------------------
                | DELIVERY ADDRESS
                |--------------------------------------------------------------------------
                */

                'delivery_address' =>
                $order
                    ->delivery_address,


                /*
                |--------------------------------------------------------------------------
                | DELIVERY LATITUDE
                |--------------------------------------------------------------------------
                */

                'delivery_latitude' =>
                $order
                    ->delivery_latitude,


                /*
                |--------------------------------------------------------------------------
                | DELIVERY LONGITUDE
                |--------------------------------------------------------------------------
                */

                'delivery_longitude' =>
                $order
                    ->delivery_longitude,


                /*
                |--------------------------------------------------------------------------
                | NOTES
                |--------------------------------------------------------------------------
                */

                'notes' =>
                $order->notes,


                /*
                |--------------------------------------------------------------------------
                | CREATED
                |--------------------------------------------------------------------------
                */

                'created_at' =>
                $order->created_at,

            ],

        ], 201);
    }


    /*
    |--------------------------------------------------------------------------
    | CALCULATE DISTANCE
    |--------------------------------------------------------------------------
    |
    | Haversine formula.
    |
    | Returns distance in kilometers.
    |
    */

    private function calculateDistanceKm(
        float $latitudeFrom,
        float $longitudeFrom,
        float $latitudeTo,
        float $longitudeTo
    ): float {

        /*
        |--------------------------------------------------------------------------
        | EARTH RADIUS
        |--------------------------------------------------------------------------
        */

        $earthRadiusKm = 6371.0;


        /*
        |--------------------------------------------------------------------------
        | CONVERT DEGREES TO RADIANS
        |--------------------------------------------------------------------------
        */

        $latitudeFromRadians =
            deg2rad(
                $latitudeFrom
            );

        $latitudeToRadians =
            deg2rad(
                $latitudeTo
            );


        $latitudeDifference =
            deg2rad(
                $latitudeTo -
                    $latitudeFrom
            );


        $longitudeDifference =
            deg2rad(
                $longitudeTo -
                    $longitudeFrom
            );


        /*
        |--------------------------------------------------------------------------
        | HAVERSINE
        |--------------------------------------------------------------------------
        */

        $a =
            sin(
                $latitudeDifference / 2
            )
            *
            sin(
                $latitudeDifference / 2
            )
            +
            cos(
                $latitudeFromRadians
            )
            *
            cos(
                $latitudeToRadians
            )
            *
            sin(
                $longitudeDifference / 2
            )
            *
            sin(
                $longitudeDifference / 2
            );


        $c =
            2 *
            atan2(
                sqrt($a),
                sqrt(1 - $a)
            );


        /*
        |--------------------------------------------------------------------------
        | DISTANCE
        |--------------------------------------------------------------------------
        */

        return
            $earthRadiusKm *
            $c;
    }


    /*
|--------------------------------------------------------------------------
| DELIVERY QUOTE
|--------------------------------------------------------------------------
*/

    public function deliveryQuote(
        Request $request
    ): JsonResponse {

        $validated = $request->validate([

            'delivery_latitude' => [
                'required',
                'numeric',
                'between:-90,90',
            ],

            'delivery_longitude' => [
                'required',
                'numeric',
                'between:-180,180',
            ],

        ]);


        /*
    |--------------------------------------------------------------------------
    | AUTHENTICATED USER
    |--------------------------------------------------------------------------
    */

        $user = $request->user();


        /*
    |--------------------------------------------------------------------------
    | FIND ACTIVE CART
    |--------------------------------------------------------------------------
    */

        $cart = Cart::query()
            ->where(
                'user_id',
                $user->id
            )
            ->where(
                'status',
                'active'
            )
            ->with('store')
            ->first();


        if (!$cart) {

            return response()->json([
                'success' => false,
                'message' => 'Your cart is empty.',
            ], 422);
        }


        /*
    |--------------------------------------------------------------------------
    | CHECK STORE
    |--------------------------------------------------------------------------
    */

        if (!$cart->store) {

            return response()->json([
                'success' => false,
                'message' =>
                'The store associated with your cart no longer exists.',
            ], 422);
        }


        /*
    |--------------------------------------------------------------------------
    | STORE LOCATION
    |--------------------------------------------------------------------------
    */

        $storeLatitude =
            $cart->store->latitude;

        $storeLongitude =
            $cart->store->longitude;


        if (
            $storeLatitude === null ||
            $storeLongitude === null
        ) {

            return response()->json([
                'success' => false,
                'message' =>
                'This store does not have a delivery location configured.',
            ], 422);
        }


        /*
    |--------------------------------------------------------------------------
    | CUSTOMER LOCATION
    |--------------------------------------------------------------------------
    */

        $customerLatitude =
            (float) $validated['delivery_latitude'];

        $customerLongitude =
            (float) $validated['delivery_longitude'];


        /*
    |--------------------------------------------------------------------------
    | CALCULATE DISTANCE
    |--------------------------------------------------------------------------
    */

        $deliveryDistanceKm =
            $this->calculateDistanceKm(

                (float) $storeLatitude,

                (float) $storeLongitude,

                $customerLatitude,

                $customerLongitude

            );


        /*
    |--------------------------------------------------------------------------
    | CALCULATE DELIVERY FEE
    |--------------------------------------------------------------------------
    |
    | 0–4 km = ₱30
    | Beyond 4 km = ₱30 + ₱10 for every started kilometer
    |
    */

        if (
            $deliveryDistanceKm <=
            self::BASE_DISTANCE_KM
        ) {

            $deliveryFee =
                self::BASE_DELIVERY_FEE;
        } else {

            $additionalDistance =
                $deliveryDistanceKm -
                self::BASE_DISTANCE_KM;

            $additionalKilometers =
                (int) ceil(
                    $additionalDistance
                );

            $deliveryFee =
                self::BASE_DELIVERY_FEE
                +
                (
                    $additionalKilometers
                    *
                    self::ADDITIONAL_KM_FEE
                );
        }


        /*
    |--------------------------------------------------------------------------
    | CALCULATE CART SUBTOTAL
    |--------------------------------------------------------------------------
    */

        $subtotal = 0;


        foreach (
            $cart->items()->with('productVariant')->get()
            as $cartItem
        ) {

            if (!$cartItem->productVariant) {
                continue;
            }

            $subtotal +=
                (float) $cartItem->productVariant->price
                *
                (int) $cartItem->quantity;
        }


        /*
    |--------------------------------------------------------------------------
    | TOTAL
    |--------------------------------------------------------------------------
    */

        $total =
            $subtotal +
            $deliveryFee;


        /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

        return response()->json([

            'success' => true,

            'distance_km' =>
            round(
                $deliveryDistanceKm,
                2
            ),

            'delivery_fee' =>
            number_format(
                $deliveryFee,
                2,
                '.',
                ''
            ),

            'subtotal' =>
            number_format(
                $subtotal,
                2,
                '.',
                ''
            ),

            'total' =>
            number_format(
                $total,
                2,
                '.',
                ''
            ),

        ]);
    }
}
