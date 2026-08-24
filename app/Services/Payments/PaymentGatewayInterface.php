<?php

namespace App\Services\Payments;

use App\Models\Order;

interface PaymentGatewayInterface
{
    /**
     * Create a payment request for an order.
     *
     * @return array{
     *     success: bool,
     *     payment_url: string|null,
     *     reference: string|null,
     *     message: string|null
     * }
     */
    public function createPayment(Order $order): array;

    /**
     * Handle payment gateway webhook.
     *
     * @param array $payload
     * @return array{
     *     success: bool,
     *     order_id: int|null,
     *     payment_status: string|null,
     *     payment_reference: string|null,
     *     message: string|null
     * }
     */
    public function handleWebhook(array $payload): array;

    /**
     * Verify the payment status from the gateway.
     *
     * @return array{
     *     success: bool,
     *     payment_status: string|null,
     *     payment_reference: string|null,
     *     message: string|null
     * }
     */
    public function verifyPayment(string $reference): array;
}
