<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FCMService;
use Illuminate\Http\Request;

class FCMTestController extends Controller
{
    public function send(
        Request $request,
        FCMService $fcm
    ) {
        $validated = $request->validate([
            'title' => [
                'required',
                'string',
                'max:255',
            ],

            'body' => [
                'required',
                'string',
                'max:1000',
            ],
        ]);

        $devicesSent =
            $fcm->sendToUser(
                $request->user()->id,
                $validated['title'],
                $validated['body'],
                [
                    'type' => 'test',
                    'screen' => 'dashboard',
                ],
            );

        return response()->json([
            'success' => true,

            'message' =>
            'FCM notification sent.',

            'devices_sent' =>
            $devicesSent,
        ]);
    }
}
