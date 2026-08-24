<?php

namespace App\Services\Payments;

use App\Models\Order;
use InvalidArgumentException;

class PaymentService
{
    public function __construct(
        private PaymentGatewayInterface $gateway
    ) {}

    /**
     * Create a payment for an order.
     */
    public function createPayment(Order $order): PaymentResult
    {
        /*
        |--------------------------------------------------------------------------
        | COD DOES NOT NEED A PAYMENT GATEWAY
        |--------------------------------------------------------------------------
        */

        if ($order->payment_method === 'cod') {
            return PaymentResult::success(
                message: 'Cash on delivery selected.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | ONLINE PAYMENT
        |--------------------------------------------------------------------------
        */

        return $this->gateway->createPayment($order);
    }

    /**
     * Handle payment webhook.
     */
    public function handleWebhook(
        array $payload
    ): array {

        return $this->gateway->handleWebhook(
            $payload
        );
    }

    /**
     * Verify an existing payment.
     */
    public function verifyPayment(
        string $reference
    ): array {

        return $this->gateway->verifyPayment(
            $reference
        );
    }

    /**
     * Check whether a payment method
     * requires an online payment gateway.
     */
    public function requiresOnlinePayment(
        string $paymentMethod
    ): bool {

        return in_array(
            $paymentMethod,
            [
                'gcash',
                'maya',
                'card',
            ],
            true
        );
    }
}
