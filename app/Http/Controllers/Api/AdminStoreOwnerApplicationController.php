<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\StoreOwnerApplication;
use App\Services\StoreOwnerApplicationNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AdminStoreOwnerApplicationController extends Controller
{
    /**
     * List store-owner applications.
     */
    public function index(
        Request $request
    ): JsonResponse {

        if (!$this->isAdmin($request)) {
            return $this->unauthorized();
        }

        $applications =
            StoreOwnerApplication::query()
            ->with('user')
            ->latest()
            ->get()
            ->map(
                fn(
                    StoreOwnerApplication $application
                ) =>
                $this->formatApplication(
                    $application
                )
            );

        return response()->json([
            'success' =>
            true,

            'applications' =>
            $applications,
        ]);
    }


    /**
     * Show one application.
     */
    public function show(
        Request $request,
        StoreOwnerApplication $application
    ): JsonResponse {

        if (!$this->isAdmin($request)) {
            return $this->unauthorized();
        }

        $application->load('user');

        return response()->json([
            'success' =>
            true,

            'application' =>
            $this->formatApplication(
                $application
            ),
        ]);
    }


    /**
     * Approve a store-owner application.
     *
     * IMPORTANT:
     *
     * Every approved application creates
     * a NEW store.
     *
     * Existing stores are NEVER updated
     * during application approval.
     */
    public function approve(
        Request $request,
        StoreOwnerApplication $application,
        StoreOwnerApplicationNotificationService $notificationService
    ): JsonResponse {

        /*
        |--------------------------------------------------------------------------
        | ADMIN CHECK
        |--------------------------------------------------------------------------
        */

        if (!$this->isAdmin($request)) {
            return $this->unauthorized();
        }


        /*
        |--------------------------------------------------------------------------
        | APPROVE APPLICATION
        |--------------------------------------------------------------------------
        |
        | Lock the application while approving.
        |
        | This prevents two simultaneous requests
        | from approving the same application and
        | creating two stores.
        |
        */

        $result =
            DB::transaction(
                function () use (
                    $application,
                    $request
                ) {

                    /*
                    |--------------------------------------------------------------------------
                    | LOCK APPLICATION
                    |--------------------------------------------------------------------------
                    */

                    $application =
                        StoreOwnerApplication::query()
                        ->where(
                            'id',
                            $application->id
                        )
                        ->lockForUpdate()
                        ->first();


                    if (!$application) {

                        throw new \RuntimeException(
                            'Store owner application not found.'
                        );
                    }


                    /*
                    |--------------------------------------------------------------------------
                    | ALREADY APPROVED
                    |--------------------------------------------------------------------------
                    */

                    if (
                        $application->status ===
                        'approved'
                    ) {

                        throw new \App\Exceptions\AlreadyApprovedApplicationException(
                            'This application has already been approved.'
                        );
                    }


                    /*
                    |--------------------------------------------------------------------------
                    | ONLY PENDING APPLICATIONS
                    |--------------------------------------------------------------------------
                    */

                    if (
                        $application->status !==
                        'pending'
                    ) {

                        throw new \RuntimeException(
                            'Only pending applications can be approved.'
                        );
                    }


                    /*
                    |--------------------------------------------------------------------------
                    | LOAD USER
                    |--------------------------------------------------------------------------
                    */

                    $application->load(
                        'user'
                    );

                    $user =
                        $application->user;


                    if (!$user) {

                        throw new \RuntimeException(
                            'The user associated with this application no longer exists.'
                        );
                    }


                    /*
                    |--------------------------------------------------------------------------
                    | GET STORE OWNER ROLE
                    |--------------------------------------------------------------------------
                    */

                    $storeOwnerRoleId =
                        $this->getStoreOwnerRoleId();


                    if (
                        !$storeOwnerRoleId
                    ) {

                        throw new \RuntimeException(
                            'Store owner role does not exist.'
                        );
                    }


                    /*
                    |--------------------------------------------------------------------------
                    | ASSIGN STORE OWNER ROLE
                    |--------------------------------------------------------------------------
                    |
                    | This does NOT remove any existing roles.
                    |
                    */

                    $user->roles()
                        ->syncWithoutDetaching([
                            $storeOwnerRoleId,
                        ]);


                    /*
                    |--------------------------------------------------------------------------
                    | CREATE NEW STORE
                    |--------------------------------------------------------------------------
                    |
                    | VERY IMPORTANT:
                    |
                    | We DO NOT do:
                    |
                    | Store::where('owner_id', ...)
                    |
                    | We DO NOT update an existing store.
                    |
                    | Every approved application gets
                    | its own store.
                    |
                    */

                    $store =
                        Store::create([

                            'owner_id' =>
                            $user->id,

                            /*
                            |--------------------------------------------------------------------------
                            | STORE NAME COMES DIRECTLY
                            | FROM THIS APPLICATION
                            |--------------------------------------------------------------------------
                            */

                            'name' =>
                            $application->business_name,

                            'business_type' =>
                            $application->business_type,

                            /*
                            |--------------------------------------------------------------------------
                            | UNIQUE SLUG
                            |--------------------------------------------------------------------------
                            */

                            'slug' =>
                            $this->makeUniqueSlug(
                                $application->business_name
                            ),

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

                            'is_active' =>
                            true,
                        ]);


                    /*
                    |--------------------------------------------------------------------------
                    | UPDATE APPLICATION
                    |--------------------------------------------------------------------------
                    */

                    $application->update([

                        'status' =>
                        'approved',

                        'reviewed_by' =>
                        $request->user()->id,

                        'reviewed_at' =>
                        now(),

                        'admin_notes' =>
                        null,
                    ]);


                    /*
                    |--------------------------------------------------------------------------
                    | RETURN BOTH
                    |--------------------------------------------------------------------------
                    */

                    return [
                        'application' =>
                        $application,

                        'store' =>
                        $store,
                    ];
                }
            );


        /*
        |--------------------------------------------------------------------------
        | GET RESULT
        |--------------------------------------------------------------------------
        */

        $application =
            $result['application'];

        $store =
            $result['store'];


        /*
        |--------------------------------------------------------------------------
        | REFRESH APPLICATION
        |--------------------------------------------------------------------------
        */

        $application =
            $application->fresh([
                'user',
            ]);


        /*
        |--------------------------------------------------------------------------
        | SEND APPROVAL NOTIFICATION
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        |
        | SMS + FCM remain here.
        |
        | Notification is sent AFTER the database
        | transaction successfully commits.
        |
        | If notification fails:
        |
        | - Store remains created
        | - Application remains approved
        |
        */

        try {

            $notificationService->approved(
                $application
            );
        } catch (
            \Throwable $e
        ) {

            Log::error(
                'STORE OWNER APPLICATION NOTIFICATION ERROR',
                [
                    'application_id' =>
                    $application->id,

                    'user_id' =>
                    $application->user_id,

                    'error' =>
                    $e->getMessage(),
                ]
            );
        }


        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'success' =>
            true,

            'message' =>
            'Store owner application approved successfully.',

            'instruction' =>
            'Please log out and log back in to refresh your account access.',

            'application' =>
            $this->formatApplication(
                $application
            ),

            'store' => [

                'id' =>
                $store->id,

                'name' =>
                $store->name,

                'slug' =>
                $store->slug,

                'is_active' =>
                $store->is_active,
            ],
        ]);
    }


    /**
     * Reject a store-owner application.
     */
    public function reject(
        Request $request,
        StoreOwnerApplication $application
    ): JsonResponse {

        if (!$this->isAdmin($request)) {
            return $this->unauthorized();
        }


        /*
        |--------------------------------------------------------------------------
        | ONLY PENDING APPLICATIONS
        |--------------------------------------------------------------------------
        */

        if (
            $application->status !==
            'pending'
        ) {

            return response()->json([
                'success' =>
                false,

                'message' =>
                'Only pending applications can be rejected.',
            ], 422);
        }


        /*
        |--------------------------------------------------------------------------
        | VALIDATE ADMIN NOTES
        |--------------------------------------------------------------------------
        */

        $validated =
            $request->validate([

                'admin_notes' => [
                    'nullable',
                    'string',
                    'max:2000',
                ],

            ]);


        /*
        |--------------------------------------------------------------------------
        | UPDATE APPLICATION
        |--------------------------------------------------------------------------
        */

        $application->update([

            'status' =>
            'rejected',

            'admin_notes' =>
            $validated['admin_notes']
                ?? null,

            'reviewed_by' =>
            $request->user()->id,

            'reviewed_at' =>
            now(),
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
            'Store owner application rejected successfully.',

            'application' =>
            $this->formatApplication(
                $application->fresh(
                    'user'
                )
            ),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | ADMIN CHECK
    |--------------------------------------------------------------------------
    */

    private function isAdmin(
        Request $request
    ): bool {

        return $request
            ->user()
            ->roles()
            ->where(
                'name',
                'admin'
            )
            ->exists();
    }


    /*
    |--------------------------------------------------------------------------
    | UNAUTHORIZED
    |--------------------------------------------------------------------------
    */

    private function unauthorized(): JsonResponse
    {

        return response()->json([
            'success' =>
            false,

            'message' =>
            'You are not authorized to perform this action.',
        ], 403);
    }


    /*
    |--------------------------------------------------------------------------
    | STORE OWNER ROLE ID
    |--------------------------------------------------------------------------
    */

    private function getStoreOwnerRoleId(): int
    {

        return (int) DB::table(
            'roles'
        )
            ->where(
                'name',
                'store_owner'
            )
            ->value('id');
    }


    /*
    |--------------------------------------------------------------------------
    | UNIQUE STORE SLUG
    |--------------------------------------------------------------------------
    */

    private function makeUniqueSlug(
        string $name
    ): string {

        $base =
            Str::slug(
                $name
            );


        if (
            $base === ''
        ) {

            $base =
                'store';
        }


        $slug =
            $base;


        $counter =
            2;


        while (
            Store::query()
            ->where(
                'slug',
                $slug
            )
            ->exists()
        ) {

            $slug =
                $base .
                '-' .
                $counter;

            $counter++;
        }


        return $slug;
    }


    /*
    |--------------------------------------------------------------------------
    | FORMAT APPLICATION
    |--------------------------------------------------------------------------
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

            'reviewed_by' =>
            $application->reviewed_by,

            'reviewed_at' =>
            $application->reviewed_at,

            'created_at' =>
            $application->created_at,

            'user' =>
            $application->user
                ? [

                    'id' =>
                    $application->user->id,

                    'name' =>
                    $application->user->name,

                    'phone' =>
                    $application->user->phone,

                ]
                : null,
        ];
    }
}
