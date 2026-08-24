<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StoreOwnerApplication;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GroceryStoreOwnerApplicationController extends Controller
{
    /**
     * Get the authenticated user's latest
     * store-owner application.
     */
    public function show(
        Request $request
    ): JsonResponse {

        $user =
            $request->user();


        /*
        |--------------------------------------------------------------------------
        | FIND LATEST APPLICATION
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        |
        | Store owners are also allowed to have
        | another application for another store.
        |
        | Therefore we DO NOT return early just
        | because the user already has the
        | store_owner role.
        |
        */

        $application =
            StoreOwnerApplication::query()
            ->where(
                'user_id',
                $user->id
            )
            ->where(
                'status',
                'pending'
            )
            ->latest()
            ->first();


        /*
        |--------------------------------------------------------------------------
        | CHECK STORE OWNER ROLE
        |--------------------------------------------------------------------------
        */

        $isStoreOwner =
            $user->roles()
            ->where(
                'name',
                'store_owner'
            )
            ->exists();


        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'success' =>
            true,

            'is_store_owner' =>
            $isStoreOwner,

            'application' =>
            $application
                ? $this->formatApplication(
                    $application
                )
                : null,
        ]);
    }


    /**
     * Submit a store-owner application.
     *
     * This works for:
     *
     * 1. Normal customer applying for
     *    their first store.
     *
     * 2. Existing store owner applying
     *    for another store.
     */
    public function apply(
        Request $request
    ): JsonResponse {

        $user =
            $request->user();


        /*
        |--------------------------------------------------------------------------
        | CHECK PENDING APPLICATION
        |--------------------------------------------------------------------------
        |
        | We no longer block based on the
        | store_owner role.
        |
        | The important rule is:
        |
        | One user cannot have more than
        | one pending application at a time.
        |
        */

        $pendingApplication =
            StoreOwnerApplication::query()
            ->where(
                'user_id',
                $user->id
            )
            ->where(
                'status',
                'pending'
            )
            ->exists();


        if (
            $pendingApplication
        ) {

            return response()->json([
                'success' =>
                false,

                'message' =>
                'You already have a pending store owner application.',
            ], 422);
        }


        /*
        |--------------------------------------------------------------------------
        | VALIDATE
        |--------------------------------------------------------------------------
        */

        $validated =
            $request->validate([

                'business_name' => [
                    'required',
                    'string',
                    'max:255',
                ],

                'business_type' => [
                    'required',
                    'string',
                    'in:grocery,restaurant,retail,pharmacy,services,other',
                ],

                'description' => [
                    'nullable',
                    'string',
                ],

                'phone' => [
                    'nullable',
                    'string',
                    'max:30',
                ],

                'address' => [
                    'required',
                    'string',
                ],

                'latitude' => [
                    'nullable',
                    'numeric',
                    'between:-90,90',
                ],

                'longitude' => [
                    'nullable',
                    'numeric',
                    'between:-180,180',
                ],

            ]);


        /*
        |--------------------------------------------------------------------------
        | CREATE APPLICATION
        |--------------------------------------------------------------------------
        */

        $application =
            StoreOwnerApplication::create([

                'user_id' =>
                $user->id,

                'business_name' =>
                $validated['business_name'],

                'business_type' =>
                $validated['business_type'],

                'description' =>
                $validated['description'] ?? null,

                'phone' =>
                $validated['phone'] ?? $user->phone,

                'address' =>
                $validated['address'],

                'latitude' =>
                $validated['latitude'] ?? null,

                'longitude' =>
                $validated['longitude'] ?? null,

                'status' =>
                'pending',
            ]);


        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'success' =>
            true,

            'message' =>
            'Your store owner application has been submitted successfully.',

            'application' =>
            $this->formatApplication(
                $application
            ),
        ], 201);
    }


    /**
     * Format application response.
     */
    private function formatApplication(
        StoreOwnerApplication $application
    ): array {

        return [

            'id' =>
            $application->id,

            'business_name' =>
            $application->business_name,

            'business_type' =>
            $application->business_type,

            'description' =>
            $application->description,

            'phone' =>
            $application->phone,

            'address' =>
            $application->address,

            'latitude' =>
            $application->latitude,

            'longitude' =>
            $application->longitude,

            'status' =>
            $application->status,

            'admin_notes' =>
            $application->admin_notes,

            'reviewed_at' =>
            $application->reviewed_at,

            'created_at' =>
            $application->created_at,
        ];
    }
}
