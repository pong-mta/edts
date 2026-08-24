<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    protected string $baseUrl;
    protected string $apiKey;

    public function __construct()
    {
        $this->baseUrl = rtrim(
            config('services.pong_sms.url'),
            '/'
        );

        $this->apiKey =
            config('services.pong_sms.api_key');
    }

    public function send(
        string $mobile,
        string $message
    ): bool {

        try {

            $response = Http::timeout(15)
                ->acceptJson()
                ->withHeaders([
                    'X-API-KEY' =>
                    $this->apiKey,
                ])
                ->post(
                    $this->baseUrl . '/v1/send',
                    [
                        'mobile' =>
                        $mobile,

                        'message' =>
                        $message,
                    ]
                );

            if (
                $response->successful() &&
                $response->json('success') === true
            ) {

                Log::info(
                    'PONG SMS queued',
                    [
                        'mobile' =>
                        $mobile,

                        'queue_id' =>
                        $response->json('queue_id'),
                    ]
                );

                return true;
            }

            Log::error(
                'PONG SMS API failed',
                [
                    'status' =>
                    $response->status(),

                    'response' =>
                    $response->json(),
                ]
            );

            return false;
        } catch (\Throwable $e) {

            Log::error(
                'PONG SMS API exception',
                [
                    'mobile' =>
                    $mobile,

                    'error' =>
                    $e->getMessage(),
                ]
            );

            return false;
        }
    }
}
