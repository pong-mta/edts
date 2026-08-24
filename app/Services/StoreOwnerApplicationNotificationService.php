<?php

namespace App\Services;

use App\Models\StoreOwnerApplication;
use Illuminate\Support\Facades\Log;
use Throwable;

class StoreOwnerApplicationNotificationService
{
    public function __construct(
        protected FCMService $fcmService,
        protected SmsService $smsService,
    ) {}

    /**
     * Notify applicant that their store owner
     * application has been approved.
     */
    public function approved(
        StoreOwnerApplication $application
    ): void {

        $application->loadMissing([
            'user',
        ]);

        $user = $application->user;

        /*
        |--------------------------------------------------------------------------
        | USER CHECK
        |--------------------------------------------------------------------------
        */

        if (!$user) {

            Log::warning(
                'STORE OWNER APPLICATION NOTIFICATION: USER NOT FOUND',
                [
                    'application_id' =>
                    $application->id,
                ]
            );

            return;
        }

        $businessName =
            $application->business_name
            ?? 'your business';


        /*
        |--------------------------------------------------------------------------
        | FCM
        |--------------------------------------------------------------------------
        */

        try {

            $sent =
                $this->fcmService->sendToUser(

                    $user->id,

                    'Store Owner Application Approved',

                    "Congratulations! Your application for {$businessName} has been approved. Please log out and log back in to access My Store.",

                    [
                        'type' =>
                        'store_owner_application',

                        'application_id' =>
                        (string) $application->id,

                        'status' =>
                        'approved',

                        'business_name' =>
                        $businessName,

                        'action' =>
                        'refresh_store_owner_access',
                    ]
                );


            /*
            |--------------------------------------------------------------------------
            | LOG FCM RESULT
            |--------------------------------------------------------------------------
            */

            if ($sent > 0) {

                Log::info(
                    'STORE OWNER APPLICATION FCM SENT',
                    [
                        'application_id' =>
                        $application->id,

                        'user_id' =>
                        $user->id,

                        'devices_sent' =>
                        $sent,
                    ]
                );
            } else {

                Log::warning(
                    'STORE OWNER APPLICATION FCM NOT SENT: NO DEVICE TOKEN OR DELIVERY FAILED',
                    [
                        'application_id' =>
                        $application->id,

                        'user_id' =>
                        $user->id,
                    ]
                );
            }
        } catch (Throwable $e) {

            Log::error(
                'STORE OWNER APPLICATION FCM EXCEPTION',
                [
                    'application_id' =>
                    $application->id,

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
            ?? $application->phone
            ?? null;


        if (!$mobile) {

            Log::warning(
                'STORE OWNER APPLICATION SMS SKIPPED: NO PHONE',
                [
                    'application_id' =>
                    $application->id,

                    'user_id' =>
                    $user->id,
                ]
            );

            return;
        }


        /*
        |--------------------------------------------------------------------------
        | SEND SMS
        |--------------------------------------------------------------------------
        */

        try {

            $message =
                "PONG: Congratulations! Your store owner "
                . "application for {$businessName} has been "
                . "approved. Please log out and log back in "
                . "to access My Store.";

            $sent =
                $this->smsService->send(
                    $mobile,
                    $message
                );


            /*
            |--------------------------------------------------------------------------
            | LOG SMS RESULT
            |--------------------------------------------------------------------------
            */

            if ($sent) {

                Log::info(
                    'STORE OWNER APPLICATION SMS SENT',
                    [
                        'application_id' =>
                        $application->id,

                        'user_id' =>
                        $user->id,

                        'mobile' =>
                        $mobile,
                    ]
                );
            } else {

                Log::warning(
                    'STORE OWNER APPLICATION SMS NOT SENT',
                    [
                        'application_id' =>
                        $application->id,

                        'user_id' =>
                        $user->id,

                        'mobile' =>
                        $mobile,
                    ]
                );
            }
        } catch (Throwable $e) {

            Log::error(
                'STORE OWNER APPLICATION SMS EXCEPTION',
                [
                    'application_id' =>
                    $application->id,

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
}
