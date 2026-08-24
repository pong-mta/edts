<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GroceryOrderController extends Controller
{
    /**
     * Get orders belonging to the
     * authenticated customer.
     *
     * IMPORTANT:
     * This endpoint is for CUSTOMER "My Orders".
     *
     * It must NOT require store_id.
     */
    public function index(
        Request $request
    ): JsonResponse {

        /*
        |--------------------------------------------------------------------------
        | AUTHENTICATED USER
        |--------------------------------------------------------------------------
        */

        $user = $request->user();


        /*
        |--------------------------------------------------------------------------
        | GET CUSTOMER ORDERS
        |--------------------------------------------------------------------------
        |
        | Only return orders created by this customer.
        |
        */

        $orders = Order::query()
            ->where(
                'user_id',
                $user->id
            )
            ->with([
                'store:id,name,slug,logo',
                'items',
            ])
            ->latest()
            ->get();


        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        return response()->json([

            'success' => true,

            'orders' => $orders
                ->map(
                    function ($order) {

                        return [

                            /*
                            |--------------------------------------------------------------------------
                            | ORDER
                            |--------------------------------------------------------------------------
                            */

                            'id' =>
                            $order->id,

                            'order_number' =>
                            $order->order_number,

                            'status' =>
                            $order->status,

                            'fulfillment_type' =>
                            $order->fulfillment_type,


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
                            | TOTALS
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

                            'delivery_fee' =>
                            number_format(
                                (float)
                                $order->delivery_fee,
                                2,
                                '.',
                                ''
                            ),

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
                            | DELIVERY
                            |--------------------------------------------------------------------------
                            */

                            'delivery_address' =>
                            $order
                                ->delivery_address,

                            'delivery_latitude' =>
                            $order
                                ->delivery_latitude,

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
                            | DATE
                            |--------------------------------------------------------------------------
                            */

                            'created_at' =>
                            $order->created_at,
                        ];
                    }
                )
                ->values(),
        ]);
    }


    /**
     * Get one order belonging to the
     * authenticated customer.
     */
    public function show(
        Request $request,
        Order $order
    ): JsonResponse {

        /*
        |--------------------------------------------------------------------------
        | CUSTOMER OWNERSHIP CHECK
        |--------------------------------------------------------------------------
        |
        | A customer can only view their own order.
        |
        */

        if (
            (int) $order->user_id !==
            (int) $request->user()->id
        ) {

            return response()->json([
                'success' => false,

                'message' =>
                'Order not found.',
            ], 404);
        }


        /*
        |--------------------------------------------------------------------------
        | LOAD RELATIONSHIPS
        |--------------------------------------------------------------------------
        */

        $order->load([
            'store:id,name,slug,logo',
            'items',
        ]);


        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        return response()->json([

            'success' => true,

            'order' => [

                /*
                |--------------------------------------------------------------------------
                | ORDER
                |--------------------------------------------------------------------------
                */

                'id' =>
                $order->id,

                'order_number' =>
                $order->order_number,

                'status' =>
                $order->status,

                'fulfillment_type' =>
                $order->fulfillment_type,


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
                | TOTALS
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

                'delivery_fee' =>
                number_format(
                    (float)
                    $order->delivery_fee,
                    2,
                    '.',
                    ''
                ),

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
                | DELIVERY
                |--------------------------------------------------------------------------
                */

                'delivery_address' =>
                $order
                    ->delivery_address,

                'delivery_latitude' =>
                $order
                    ->delivery_latitude,

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
                | DATE
                |--------------------------------------------------------------------------
                */

                'created_at' =>
                $order->created_at,
            ],
        ]);
    }
}
