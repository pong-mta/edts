<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Facades\Log;
use Throwable;

class GroceryOrderNotificationService
{
    public function __construct(
        protected FCMService $fcmService,
        protected SmsService $smsService,
    ) {}

    /**
     * Notify customer that a grocery order
     * has been successfully placed.
     */
    public function orderPlaced(
        Order $order
    ): void {

        $order->loadMissing([
            'user',
            'store',
        ]);

        $user = $order->user;

        if (!$user) {
            Log::warning(
                'GROCERY ORDER NOTIFICATION: user not found',
                [
                    'order_id' =>
                    $order->id,
                ]
            );

            return;
        }

        $storeName =
            $order->store?->name
            ?? 'Grocery Store';

        $orderNumber =
            $order->order_number;

        $total =
            number_format(
                (float) $order->total,
                2,
                '.',
                ''
            );

        /*
        |--------------------------------------------------------------------------
        | FCM
        |--------------------------------------------------------------------------
        */

        try {

            $this->fcmService->sendToUser(
                $user->id,

                'Order Placed',

                "{$storeName}: Your order {$orderNumber} has been placed successfully. Total: ₱{$total}.",

                [
                    'type' =>
                    'grocery_order',

                    'order_id' =>
                    (string) $order->id,

                    'order_number' =>
                    $orderNumber,

                    'status' =>
                    $order->status,
                ]
            );
        } catch (Throwable $e) {

            Log::error(
                'GROCERY ORDER FCM FAILED',
                [
                    'order_id' =>
                    $order->id,

                    'user_id' =>
                    $user->id,

                    'error' =>
                    $e->getMessage(),
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | SMS
        |--------------------------------------------------------------------------
        */

        $mobile =
            $user->phone
            ?? null;

        if (!$mobile) {

            Log::warning(
                'GROCERY ORDER SMS SKIPPED: user has no phone',
                [
                    'order_id' =>
                    $order->id,

                    'user_id' =>
                    $user->id,
                ]
            );

            return;
        }

        try {

            $message =
                "{$storeName}: Your order {$orderNumber} has been placed successfully. "
                . "Total: PHP {$total}. "
                . "Status: Pending.";

            $this->smsService->send(
                $mobile,
                $message
            );
        } catch (Throwable $e) {

            Log::error(
                'GROCERY ORDER SMS FAILED',
                [
                    'order_id' =>
                    $order->id,

                    'user_id' =>
                    $user->id,

                    'mobile' =>
                    $mobile,

                    'error' =>
                    $e->getMessage(),
                ]
            );
        }
    }


    /**
     * Notify customer when the order status changes.
     */
    public function statusChanged(
        Order $order,
        string $oldStatus
    ): void {

        $order->loadMissing([
            'user',
            'store',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Don't notify if status didn't actually change.
        |--------------------------------------------------------------------------
        */

        if (
            $oldStatus ===
            $order->status
        ) {
            return;
        }

        $user = $order->user;

        if (!$user) {
            return;
        }

        $storeName =
            $order->store?->name
            ?? 'Grocery Store';

        $orderNumber =
            $order->order_number;

        $statusLabel =
            $this->statusLabel(
                $order->status
            );

        /*
        |--------------------------------------------------------------------------
        | FCM
        |--------------------------------------------------------------------------
        */

        try {

            $this->fcmService->sendToUser(
                $user->id,

                'Order Update',

                "{$storeName}: Your order {$orderNumber} is now {$statusLabel}.",

                [
                    'type' =>
                    'grocery_order',

                    'order_id' =>
                    (string) $order->id,

                    'order_number' =>
                    $orderNumber,

                    'status' =>
                    $order->status,
                ]
            );
        } catch (Throwable $e) {

            Log::error(
                'GROCERY ORDER STATUS FCM FAILED',
                [
                    'order_id' =>
                    $order->id,

                    'user_id' =>
                    $user->id,

                    'error' =>
                    $e->getMessage(),
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | SMS
        |--------------------------------------------------------------------------
        */

        $mobile =
            $user->phone
            ?? null;

        if (!$mobile) {
            return;
        }

        try {

            $message =
                "{$storeName}: Your order {$orderNumber} "
                . "is now {$statusLabel}.";

            $this->smsService->send(
                $mobile,
                $message
            );
        } catch (Throwable $e) {

            Log::error(
                'GROCERY ORDER STATUS SMS FAILED',
                [
                    'order_id' =>
                    $order->id,

                    'user_id' =>
                    $user->id,

                    'error' =>
                    $e->getMessage(),
                ]
            );
        }
    }


    /**
     * Convert internal order status
     * into customer-friendly text.
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
            'Out for delivery',

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
