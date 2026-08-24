<?php

namespace App\Services;

use App\Models\DeviceToken;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Services\FirebaseAccessTokenService;
use Throwable;

class FCMService
{
    public function __construct(
        protected FirebaseAccessTokenService $accessTokenService
    ) {}

    /*
    |--------------------------------------------------------------------------
    | SEND TO ONE DEVICE
    |--------------------------------------------------------------------------
    */

    public function sendToToken(
        string $token,
        string $title,
        string $body,
        array $data = []
    ): bool {

        try {

            /*
            |--------------------------------------------------------------------------
            | Get Firebase OAuth access token
            |--------------------------------------------------------------------------
            */

            $accessToken =
                $this->accessTokenService
                ->getAccessToken();

            /*
            |--------------------------------------------------------------------------
            | Get Firebase project ID
            |--------------------------------------------------------------------------
            */

            $credentialsPath =
                config(
                    'services.firebase.credentials'
                );

            $credentials =
                json_decode(
                    file_get_contents(
                        $credentialsPath
                    ),
                    true
                );

            $projectId =
                $credentials['project_id']
                ?? null;

            if (!$projectId) {

                throw new \RuntimeException(
                    'Firebase project_id not found.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | FCM HTTP v1 endpoint
            |--------------------------------------------------------------------------
            */

            $url =
                "https://fcm.googleapis.com/v1/projects/"
                . $projectId
                . "/messages:send";

            /*
            |--------------------------------------------------------------------------
            | FCM data must contain strings
            |--------------------------------------------------------------------------
            */

            $formattedData = [];

            foreach ($data as $key => $value) {

                $formattedData[(string) $key] =
                    is_scalar($value)
                    ? (string) $value
                    : json_encode($value);
            }

            /*
            |--------------------------------------------------------------------------
            | Build FCM message
            |--------------------------------------------------------------------------
            */

            $payload = [

                'message' => [

                    'token' => $token,

                    'notification' => [

                        'title' =>
                        $title,

                        'body' =>
                        $body,
                    ],

                    'data' =>
                    $formattedData,

                    'android' => [

                        'priority' =>
                        'HIGH',

                        'notification' => [

                            'channel_id' =>
                            'default',

                            'sound' =>
                            'default',
                        ],
                    ],
                ],
            ];

            /*
            |--------------------------------------------------------------------------
            | Send request
            |--------------------------------------------------------------------------
            */

            $response =
                Http::withToken(
                    $accessToken
                )
                ->acceptJson()
                ->post(
                    $url,
                    $payload
                );

            /*
            |--------------------------------------------------------------------------
            | Check response
            |--------------------------------------------------------------------------
            */

            if (!$response->successful()) {

                Log::error(
                    'FCM SEND FAILED',
                    [
                        'status' =>
                        $response->status(),

                        'response' =>
                        $response->json(),

                        'token' =>
                        substr(
                            $token,
                            0,
                            20
                        ) . '...',
                    ]
                );

                return false;
            }

            Log::info(
                'FCM SEND SUCCESS',
                [
                    'response' =>
                    $response->json(),
                ]
            );

            return true;
        } catch (Throwable $e) {

            Log::error(
                'FCM SEND EXCEPTION',
                [
                    'message' =>
                    $e->getMessage(),

                    'token' =>
                    substr(
                        $token,
                        0,
                        20
                    ) . '...',
                ]
            );

            return false;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SEND TO ALL USER DEVICES
    |--------------------------------------------------------------------------
    */

    public function sendToUser(
        int $userId,
        string $title,
        string $body,
        array $data = []
    ): int {

        $devices =
            DeviceToken::where(
                'user_id',
                $userId
            )->get();

        $sent = 0;

        foreach ($devices as $device) {

            $success =
                $this->sendToToken(
                    $device->token,
                    $title,
                    $body,
                    $data
                );

            if ($success) {

                $device->update([
                    'last_used_at' =>
                    now(),
                ]);

                $sent++;
            }
        }

        return $sent;
    }
}
