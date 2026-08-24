<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class OrderPaymentService
{
    /*
    |--------------------------------------------------------------------------
    | MARK AS PAID
    |--------------------------------------------------------------------------
    */

    public function markPaid(
        Order $order,
        ?string $paymentReference = null
    ): Order {

        return DB::transaction(function () use (
            $order,
            $paymentReference
        ) {

            /*
            |--------------------------------------------------------------------------
            | LOCK ORDER
            |--------------------------------------------------------------------------
            */

            $order = Order::query()
                ->lockForUpdate()
                ->findOrFail($order->id);


            /*
            |--------------------------------------------------------------------------
            | ALREADY PAID
            |--------------------------------------------------------------------------
            |
            | Idempotent:
            | If the gateway sends the same webhook twice,
            | we don't break the order.
            |
            */

            if (
                $order->payment_status === 'paid'
            ) {

                return $order;
            }


            /*
            |--------------------------------------------------------------------------
            | CANCELLED ORDER
            |--------------------------------------------------------------------------
            */

            if (
                $order->status === 'cancelled'
            ) {

                throw new RuntimeException(
                    'A cancelled order cannot be marked as paid.'
                );
            }


            /*
            |--------------------------------------------------------------------------
            | UPDATE PAYMENT
            |--------------------------------------------------------------------------
            */

            $order->payment_status = 'paid';

            $order->payment_reference =
                $paymentReference
                ??
                $order->payment_reference;

            $order->paid_at =
                now();


            $order->save();


            return $order;
        });
    }


    /*
    |--------------------------------------------------------------------------
    | MARK AS FAILED
    |--------------------------------------------------------------------------
    */

    public function markFailed(
        Order $order,
        ?string $paymentReference = null
    ): Order {

        return DB::transaction(function () use (
            $order,
            $paymentReference
        ) {

            $order = Order::query()
                ->lockForUpdate()
                ->findOrFail($order->id);


            /*
            |--------------------------------------------------------------------------
            | DO NOT CHANGE A COMPLETED PAYMENT
            |--------------------------------------------------------------------------
            */

            if (
                $order->payment_status === 'paid'
            ) {

                throw new RuntimeException(
                    'A paid order cannot be marked as failed.'
                );
            }


            /*
            |--------------------------------------------------------------------------
            | UPDATE
            |--------------------------------------------------------------------------
            */

            $order->payment_status =
                'failed';

            $order->payment_reference =
                $paymentReference
                ??
                $order->payment_reference;

            $order->paid_at =
                null;


            $order->save();


            return $order;
        });
    }


    /*
    |--------------------------------------------------------------------------
    | MARK AS PENDING
    |--------------------------------------------------------------------------
    */

    public function markPending(
        Order $order,
        ?string $paymentReference = null
    ): Order {

        return DB::transaction(function () use (
            $order,
            $paymentReference
        ) {

            $order = Order::query()
                ->lockForUpdate()
                ->findOrFail($order->id);


            /*
            |--------------------------------------------------------------------------
            | PAID CANNOT GO BACK TO PENDING
            |--------------------------------------------------------------------------
            */

            if (
                $order->payment_status === 'paid'
            ) {

                throw new RuntimeException(
                    'A paid order cannot be returned to pending.'
                );
            }


            $order->payment_status =
                'pending';

            $order->payment_reference =
                $paymentReference
                ??
                $order->payment_reference;

            $order->paid_at =
                null;


            $order->save();


            return $order;
        });
    }
}
