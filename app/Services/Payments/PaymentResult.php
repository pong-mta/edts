<?php

namespace App\Services\Payments;

class PaymentResult
{
    public function __construct(
        public bool $success,
        public ?string $paymentUrl = null,
        public ?string $reference = null,
        public ?string $message = null,
    ) {}

    public static function success(
        ?string $paymentUrl = null,
        ?string $reference = null,
        ?string $message = null,
    ): self {
        return new self(
            success: true,
            paymentUrl: $paymentUrl,
            reference: $reference,
            message: $message,
        );
    }

    public static function failed(
        string $message,
    ): self {
        return new self(
            success: false,
            message: $message,
        );
    }
}
