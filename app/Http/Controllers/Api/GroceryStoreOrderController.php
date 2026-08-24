<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Store;
use App\Services\GroceryOrderNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GroceryStoreOrderController extends Controller
{
    /**
     * Get one order belonging to a store
     * owned by the authenticated user.
     */
    public function show(
        Request $request,
        Order $order
    ): JsonResponse {

        $user = $request->user();

        /*
        |--------------------------------------------------------------------------
        | STORE OWNER CHECK
        |--------------------------------------------------------------------------
        */

        $store = Store::query()
            ->where(
                'id',
                $order->store_id
            )
            ->where(
                'owner_id',
                $user->id
            )
            ->first();

        if (!$store) {

            return response()->json([
                'success' => false,
                'message' => 'Order not found.',
            ], 404);
        }

        /*
        |--------------------------------------------------------------------------
        | LOAD RELATIONSHIPS
        |--------------------------------------------------------------------------
        */

        $order->load([
            'store:id,name,slug,logo',
            'user:id,name,phone',
            'items',
        ]);

        /*
        |--------------------------------------------------------------------------
        | RETURN ORDER
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'success' => true,

            'order' => $this->formatOrder($order),
        ]);
    }


    /**
     * Get orders belonging to the selected store
     * owned by the authenticated user.
     */
    public function index(
        Request $request
    ): JsonResponse {

        $user = $request->user();

        /*
    |--------------------------------------------------------------------------
    | VALIDATE STORE ID
    |--------------------------------------------------------------------------
    */

        $validated = $request->validate([
            'store_id' => [
                'required',
                'integer',
                'exists:stores,id',
            ],
        ]);

        $storeId = (int) $validated['store_id'];

        /*
    |--------------------------------------------------------------------------
    | VERIFY STORE OWNERSHIP
    |--------------------------------------------------------------------------
    */

        $store = Store::query()
            ->where('id', $storeId)
            ->where('owner_id', $user->id)
            ->first();

        if (!$store) {

            return response()->json([
                'success' => false,
                'message' =>
                'You are not authorized to access this store.',
            ], 403);
        }

        /*
    |--------------------------------------------------------------------------
    | GET ORDERS FOR THIS STORE ONLY
    |--------------------------------------------------------------------------
    */

        $orders = Order::query()
            ->where('store_id', $store->id)
            ->with([
                'store:id,name,slug,logo',
                'user:id,name,phone',
                'items',
            ])
            ->latest()
            ->get();

        /*
    |--------------------------------------------------------------------------
    | RETURN
    |--------------------------------------------------------------------------
    */

        return response()->json([
            'success' => true,

            'store' => [
                'id' => $store->id,
                'name' => $store->name,
            ],

            'orders' => $orders
                ->map(
                    fn($order) =>
                    $this->formatOrder($order)
                )
                ->values(),
        ]);
    }

    /**
     * Update the status of a grocery order.
     *
     * Only the owner of the store associated
     * with the order may update its status.
     *
     * The backend strictly enforces the
     * allowed status progression.
     */
    public function updateStatus(
        Request $request,
        Order $order,
        GroceryOrderNotificationService $notificationService
    ): JsonResponse {

        /*
        |--------------------------------------------------------------------------
        | VALIDATE REQUEST
        |--------------------------------------------------------------------------
        */

        $validated = $request->validate([
            'status' => [
                'required',
                'string',
                'in:pending,confirmed,preparing,ready,out_for_delivery,delivered,cancelled',
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
        | STORE OWNER CHECK
        |--------------------------------------------------------------------------
        */

        $store = Store::query()
            ->where(
                'id',
                $order->store_id
            )
            ->where(
                'owner_id',
                $user->id
            )
            ->first();

        if (!$store) {

            return response()->json([
                'success' => false,

                'message' =>
                'You are not authorized to update this order.',
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | OLD / NEW STATUS
        |--------------------------------------------------------------------------
        */

        $oldStatus = $order->status;

        $newStatus = $validated['status'];

        /*
        |--------------------------------------------------------------------------
        | NO CHANGE
        |--------------------------------------------------------------------------
        */

        if (
            $oldStatus ===
            $newStatus
        ) {

            return response()->json([
                'success' => true,

                'message' =>
                'Order status is already ' .
                    $this->statusLabel($newStatus) .
                    '.',

                'order' => [
                    'id' =>
                    $order->id,

                    'order_number' =>
                    $order->order_number,

                    'status' =>
                    $order->status,
                ],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | CANCELLED
        |--------------------------------------------------------------------------
        |
        | Cancellation is handled separately from
        | the normal forward progression.
        |
        */

        if (
            $newStatus ===
            'cancelled'
        ) {

            /*
            |----------------------------------------------------------------------
            | CANNOT CANCEL COMPLETED ORDERS
            |---------------------------------------------------------------------- 
            */

            if (
                in_array(
                    $oldStatus,
                    [
                        'delivered',
                        'cancelled',
                    ],
                    true
                )
            ) {

                return response()->json([
                    'success' => false,

                    'message' =>
                    'This order can no longer be cancelled.',
                ], 422);
            }

            /*
            |----------------------------------------------------------------------
            | CANCEL
            |---------------------------------------------------------------------- 
            */

            DB::transaction(
                function () use (
                    $order
                ) {

                    $order->update([
                        'status' =>
                        'cancelled',
                    ]);
                }
            );

            $order->refresh();

            /*
            |----------------------------------------------------------------------
            | NOTIFY CUSTOMER
            |---------------------------------------------------------------------- 
            */

            try {

                $notificationService
                    ->statusChanged(
                        $order,
                        $oldStatus
                    );
            } catch (\Throwable $e) {

                Log::error(
                    'GROCERY ORDER STATUS NOTIFICATION ERROR',
                    [
                        'order_id' =>
                        $order->id,

                        'order_number' =>
                        $order->order_number,

                        'old_status' =>
                        $oldStatus,

                        'new_status' =>
                        $newStatus,

                        'error' =>
                        $e->getMessage(),
                    ]
                );
            }

            return response()->json([
                'success' => true,

                'message' =>
                'Order cancelled successfully.',

                'order' => [
                    'id' =>
                    $order->id,

                    'order_number' =>
                    $order->order_number,

                    'status' =>
                    $order->status,
                ],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | NORMAL STATUS FLOW
        |--------------------------------------------------------------------------
        */

        $allowedNextStatuses = [
            'pending' => [
                'confirmed',
            ],

            'confirmed' => [
                'preparing',
            ],

            'preparing' => [
                'ready',
            ],

            'ready' => [
                'out_for_delivery',
                'delivered',
            ],

            'out_for_delivery' => [
                'delivered',
            ],

            'delivered' => [],

            'cancelled' => [],
        ];

        /*
        |--------------------------------------------------------------------------
        | CHECK NEXT STATUS
        |--------------------------------------------------------------------------
        */

        $allowedStatuses =
            $allowedNextStatuses[$oldStatus] ?? [];

        /*
        |--------------------------------------------------------------------------
        | DELIVERY / PICKUP RULE
        |--------------------------------------------------------------------------
        */

        if (
            $newStatus ===
            'out_for_delivery'
        ) {

            if (
                $order->fulfillment_type !==
                'delivery'
            ) {

                return response()->json([
                    'success' => false,

                    'message' =>
                    'Pickup orders cannot be marked as out for delivery.',
                ], 422);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | PREVENT INVALID JUMP
        |--------------------------------------------------------------------------
        */

        if (
            !in_array(
                $newStatus,
                $allowedStatuses,
                true
            )
        ) {

            return response()->json([
                'success' => false,

                'message' =>
                'Invalid order status transition: ' .
                    $this->statusLabel($oldStatus) .
                    ' → ' .
                    $this->statusLabel($newStatus) .
                    '.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | UPDATE ORDER
        |--------------------------------------------------------------------------
        */

        DB::transaction(
            function () use (
                $order,
                $newStatus
            ) {

                $order->update([
                    'status' =>
                    $newStatus,
                ]);
            }
        );

        /*
        |--------------------------------------------------------------------------
        | REFRESH
        |--------------------------------------------------------------------------
        */

        $order->refresh();

        /*
        |--------------------------------------------------------------------------
        | NOTIFY CUSTOMER
        |--------------------------------------------------------------------------
        */

        try {

            $notificationService
                ->statusChanged(
                    $order,
                    $oldStatus
                );
        } catch (\Throwable $e) {

            Log::error(
                'GROCERY ORDER STATUS NOTIFICATION ERROR',
                [
                    'order_id' =>
                    $order->id,

                    'order_number' =>
                    $order->order_number,

                    'old_status' =>
                    $oldStatus,

                    'new_status' =>
                    $newStatus,

                    'error' =>
                    $e->getMessage(),
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'success' => true,

            'message' =>
            'Order status updated successfully.',

            'order' => [
                'id' =>
                $order->id,

                'order_number' =>
                $order->order_number,

                'status' =>
                $order->status,
            ],
        ]);
    }


    /**
     * Format order response.
     */
    protected function formatOrder(
        Order $order
    ): array {

        return [

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
            | CUSTOMER
            |--------------------------------------------------------------------------
            */

            'customer' =>
            $order->user
                ? [
                    'id' =>
                    $order->user->id,

                    'name' =>
                    $order->user->name,

                    'phone' =>
                    $order->user->phone,
                ]
                : null,

            /*
            |--------------------------------------------------------------------------
            | STORE
            |--------------------------------------------------------------------------
            */

            'store' =>
            $order->store
                ? [
                    'id' =>
                    $order->store->id,

                    'name' =>
                    $order->store->name,

                    'slug' =>
                    $order->store->slug,

                    'logo' =>
                    $order->store->logo,
                ]
                : null,

            /*
            |--------------------------------------------------------------------------
            | ITEMS
            |--------------------------------------------------------------------------
            */

            'items' =>
            $order->items
                ->map(
                    function ($item) {

                        return [

                            'id' =>
                            $item->id,

                            'product_variant_id' =>
                            $item->product_variant_id,

                            'product_name' =>
                            $item->product_name,

                            'variant_name' =>
                            $item->variant_name,

                            'sku' =>
                            $item->sku,

                            'quantity' =>
                            $item->quantity,

                            'unit_price' =>
                            number_format(
                                (float)
                                $item->unit_price,
                                2,
                                '.',
                                ''
                            ),

                            'subtotal' =>
                            number_format(
                                (float)
                                $item->subtotal,
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
            $order->delivery_address,

            'delivery_latitude' =>
            $order->delivery_latitude,

            'delivery_longitude' =>
            $order->delivery_longitude,

            /*
            |--------------------------------------------------------------------------
            | OTHER
            |--------------------------------------------------------------------------
            */

            'notes' =>
            $order->notes,

            'created_at' =>
            $order->created_at,
        ];
    }


    /**
     * Convert internal status into
     * customer-friendly text.
     */
    protected function statusLabel(
        string $status
    ): string {

        return match ($status) {

            'pending' =>
            'Pending',

            'confirmed' =>
            'Confirmed',

            'preparing' =>
            'Preparing',

            'ready' =>
            'Ready',

            'out_for_delivery' =>
            'Out for Delivery',

            'delivered' =>
            'Delivered',

            'cancelled' =>
            'Cancelled',

            default =>
            ucwords(
                str_replace(
                    '_',
                    ' ',
                    $status
                )
            ),
        };
    }
}
