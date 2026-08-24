<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class FirebaseAccessTokenService
{
    public function getAccessToken(): string
    {
        /*
        |--------------------------------------------------------------------------
        | Firebase service account
        |--------------------------------------------------------------------------
        */

        $credentialsPath =
            config('services.firebase.credentials');

        if (
            !$credentialsPath ||
            !file_exists($credentialsPath)
        ) {
            throw new RuntimeException(
                'Firebase service account file not found.'
            );
        }

        $credentials =
            json_decode(
                file_get_contents($credentialsPath),
                true
            );

        if (
            !is_array($credentials)
        ) {
            throw new RuntimeException(
                'Invalid Firebase service account JSON.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Required credentials
        |--------------------------------------------------------------------------
        */

        $clientEmail =
            $credentials['client_email']
            ?? null;

        $privateKey =
            $credentials['private_key']
            ?? null;

        $tokenUri =
            $credentials['token_uri']
            ?? 'https://oauth2.googleapis.com/token';

        if (
            !$clientEmail ||
            !$privateKey
        ) {
            throw new RuntimeException(
                'Firebase service account is missing client_email or private_key.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | JWT Header
        |--------------------------------------------------------------------------
        */

        $header = [
            'alg' => 'RS256',
            'typ' => 'JWT',
        ];

        /*
        |--------------------------------------------------------------------------
        | JWT Payload
        |--------------------------------------------------------------------------
        */

        $now = time();

        $payload = [
            'iss' => $clientEmail,

            'scope' =>
            'https://www.googleapis.com/auth/firebase.messaging',

            'aud' => $tokenUri,

            'iat' => $now,

            'exp' => $now + 3600,
        ];

        /*
        |--------------------------------------------------------------------------
        | Base64 URL encoding
        |--------------------------------------------------------------------------
        */

        $base64UrlEncode =
            function ($data): string {

                return rtrim(
                    strtr(
                        base64_encode(
                            $data
                        ),
                        '+/',
                        '-_'
                    ),
                    '='
                );
            };

        /*
        |--------------------------------------------------------------------------
        | Encode JWT
        |--------------------------------------------------------------------------
        */

        $encodedHeader =
            $base64UrlEncode(
                json_encode(
                    $header,
                    JSON_UNESCAPED_SLASHES
                )
            );

        $encodedPayload =
            $base64UrlEncode(
                json_encode(
                    $payload,
                    JSON_UNESCAPED_SLASHES
                )
            );

        $unsignedToken =
            $encodedHeader .
            '.' .
            $encodedPayload;

        /*
        |--------------------------------------------------------------------------
        | Load private key
        |--------------------------------------------------------------------------
        */

        $privateKeyResource =
            openssl_pkey_get_private(
                $privateKey
            );

        if (!$privateKeyResource) {

            throw new RuntimeException(
                'Unable to load Firebase private key.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Sign JWT with RSA SHA256
        |--------------------------------------------------------------------------
        */

        $signature = '';

        $success =
            openssl_sign(
                $unsignedToken,
                $signature,
                $privateKeyResource,
                OPENSSL_ALGO_SHA256
            );

        if (!$success) {

            throw new RuntimeException(
                'Unable to sign Firebase OAuth JWT.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Final JWT
        |--------------------------------------------------------------------------
        */

        $jwt =
            $unsignedToken .
            '.' .
            $base64UrlEncode(
                $signature
            );

        /*
        |--------------------------------------------------------------------------
        | Exchange JWT for Google OAuth access token
        |--------------------------------------------------------------------------
        */

        $response =
            Http::asForm()
            ->timeout(15)
            ->post(
                $tokenUri,
                [
                    'grant_type' =>
                    'urn:ietf:params:oauth:grant-type:jwt-bearer',

                    'assertion' =>
                    $jwt,
                ]
            );

        /*
        |--------------------------------------------------------------------------
        | Check Google response
        |--------------------------------------------------------------------------
        */

        if (
            !$response->successful()
        ) {

            throw new RuntimeException(
                'Google OAuth token request failed: ' .
                    $response->body()
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Get access token
        |--------------------------------------------------------------------------
        */

        $accessToken =
            $response->json(
                'access_token'
            );

        if (!$accessToken) {

            throw new RuntimeException(
                'Google OAuth response did not contain an access token.'
            );
        }

        return $accessToken;
    }
}
