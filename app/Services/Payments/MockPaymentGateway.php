<?php

namespace App\Services\Payments;

use App\Models\Order;
use Illuminate\Support\Str;

class MockPaymentGateway implements PaymentGatewayInterface
{
    /**
     * Create a fake payment request.
     *
     * This is ONLY for testing the payment flow.
     */
    public function createPayment(Order $order): array
    {
        $reference = 'TEST-' . strtoupper(
            Str::random(12)
        );

        return [
            'success' => true,

            'payment_url' =>
            'https://example.com/test-payment/' . $reference,

            'reference' =>
            $reference,

            'message' =>
            'Test payment created.',
        ];
    }

    /**
     * Handle a fake webhook.
     */
    public function handleWebhook(array $payload): array
    {
        return [
            'success' => true,

            'order_id' =>
            $payload['order_id'] ?? null,

            'payment_status' =>
            $payload['payment_status'] ?? 'pending',

            'payment_reference' =>
            $payload['payment_reference'] ?? null,

            'message' =>
            'Test webhook processed.',
        ];
    }

    /**
     * Verify a fake payment.
     */
    public function verifyPayment(string $reference): array
    {
        return [
            'success' => true,

            'payment_status' => 'paid',

            'payment_reference' =>
            $reference,

            'message' =>
            'Test payment verified.',
        ];
    }
}
