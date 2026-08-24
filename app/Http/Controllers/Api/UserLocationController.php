<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserLocation;
use Illuminate\Http\Request;

class UserLocationController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'latitude' => [
                'required',
                'numeric',
                'between:-90,90',
            ],

            'longitude' => [
                'required',
                'numeric',
                'between:-180,180',
            ],

            'accuracy' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'recorded_at' => [
                'required',
                'date',
            ],
        ]);

        $location =
            UserLocation::create([
                'user_id' =>
                $request->user()->id,

                'latitude' =>
                $validated['latitude'],

                'longitude' =>
                $validated['longitude'],

                'accuracy' =>
                $validated['accuracy'] ?? null,

                'recorded_at' =>
                $validated['recorded_at'],
            ]);

        return response()->json([
            'success' => true,

            'message' =>
            'Location recorded.',

            'location' => [
                'id' =>
                $location->id,

                'latitude' =>
                $location->latitude,

                'longitude' =>
                $location->longitude,

                'accuracy' =>
                $location->accuracy,

                'recorded_at' =>
                $location->recorded_at,
            ],
        ], 201);
    }
}
