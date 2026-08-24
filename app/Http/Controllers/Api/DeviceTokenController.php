<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeviceToken;
use Illuminate\Http\Request;

class DeviceTokenController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | REGISTER DEVICE TOKEN
    |--------------------------------------------------------------------------
    */

    public function store(Request $request)
    {
        $validated = $request->validate([
            'token' => [
                'required',
                'string',
                'max:2048',
            ],

            'platform' => [
                'nullable',
                'string',
                'in:android,ios',
            ],

            'device_name' => [
                'nullable',
                'string',
                'max:255',
            ],
        ]);

        $deviceToken =
            DeviceToken::updateOrCreate(
                [
                    'user_id' =>
                    $request->user()->id,

                    'token' =>
                    $validated['token'],
                ],

                [
                    'platform' =>
                    $validated['platform']
                        ?? 'android',

                    'device_name' =>
                    $validated['device_name']
                        ?? null,

                    'last_used_at' =>
                    now(),
                ],
            );

        return response()->json([
            'success' => true,

            'message' =>
            'Device token registered successfully.',

            'device_token' => [
                'id' =>
                $deviceToken->id,

                'platform' =>
                $deviceToken->platform,

                'device_name' =>
                $deviceToken->device_name,

                'last_used_at' =>
                $deviceToken->last_used_at,
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | REMOVE DEVICE TOKEN
    |--------------------------------------------------------------------------
    */

    public function destroy(Request $request)
    {
        $validated = $request->validate([
            'token' => [
                'required',
                'string',
            ],
        ]);

        $deleted =
            DeviceToken::where(
                'user_id',
                $request->user()->id
            )
            ->where(
                'token',
                $validated['token']
            )
            ->delete();

        return response()->json([
            'success' => true,

            'message' =>
            'Device token removed successfully.',

            'deleted' =>
            $deleted > 0,
        ]);
    }
}
