<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\StoreCategory;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GroceryStoreController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | CUSTOMER — STORES
    |--------------------------------------------------------------------------
    |
    | Example:
    |
    | GET /api/grocery/stores?business_type=grocery
    |
    | GET /api/grocery/stores?business_type=pharmacy
    |
    */

    public function index(
        Request $request
    ): JsonResponse {

        /*
        |--------------------------------------------------------------------------
        | BUSINESS TYPE
        |--------------------------------------------------------------------------
        */

        $businessType =
            $request->query(
                'business_type'
            );


        /*
        |--------------------------------------------------------------------------
        | QUERY
        |--------------------------------------------------------------------------
        */

        $query =
            Store::query()
            ->where(
                'is_active',
                true
            );


        /*
        |--------------------------------------------------------------------------
        | FILTER BY BUSINESS TYPE
        |--------------------------------------------------------------------------
        |
        | Only apply the filter when supplied.
        |
        | This allows the endpoint to remain
        | backwards compatible while we update
        | the mobile app.
        |
        */

        if (
            $businessType !== null &&
            $businessType !== ''
        ) {

            $query->where(
                'business_type',
                $businessType
            );
        }


        /*
        |--------------------------------------------------------------------------
        | GET STORES
        |--------------------------------------------------------------------------
        */

        $stores =
            $query
            ->orderBy(
                'name'
            )
            ->get([
                'id',
                'name',
                'slug',
                'business_type',
                'description',
                'phone',
                'address',
                'latitude',
                'longitude',
                'logo',
            ]);


        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        return response()->json([

            'success' =>
            true,

            'business_type' =>
            $businessType,

            'stores' =>
            $stores,

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | CUSTOMER — CATEGORIES
    |--------------------------------------------------------------------------
    */

    public function categories(
        int $store
    ): JsonResponse {

        $categories =
            StoreCategory::query()
            ->where(
                'store_id',
                $store
            )
            ->where(
                'is_active',
                true
            )
            ->orderBy(
                'sort_order'
            )
            ->orderBy(
                'name'
            )
            ->get([
                'id',
                'store_id',
                'name',
                'slug',
                'description',
                'image',
            ]);


        return response()->json([

            'success' =>
            true,

            'categories' =>
            $categories,

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | CUSTOMER — PRODUCTS
    |--------------------------------------------------------------------------
    */

    public function products(
        int $store,
        int $category
    ): JsonResponse {

        $products =
            Product::query()
            ->where(
                'store_id',
                $store
            )
            ->where(
                'category_id',
                $category
            )
            ->where(
                'is_active',
                true
            )
            ->orderBy(
                'sort_order'
            )
            ->orderBy(
                'name'
            )
            ->get([
                'id',
                'store_id',
                'category_id',
                'name',
                'slug',
                'description',
                'image',
            ]);


        return response()->json([

            'success' =>
            true,

            'products' =>
            $products,

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | CUSTOMER — VARIANTS
    |--------------------------------------------------------------------------
    */

    public function variants(
        int $product
    ): JsonResponse {

        $variants =
            ProductVariant::query()
            ->where(
                'product_id',
                $product
            )
            ->where(
                'is_active',
                true
            )
            ->orderBy(
                'sort_order'
            )
            ->orderBy(
                'name'
            )
            ->get([
                'id',
                'product_id',
                'name',
                'sku',
                'price',
                'stock',
                'image',
            ]);


        return response()->json([

            'success' =>
            true,

            'variants' =>
            $variants,

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | STORE OWNER — MY STORES
    |--------------------------------------------------------------------------
    */

    public function ownerStores(
        Request $request
    ): JsonResponse {

        $stores =
            Store::query()
            ->where(
                'owner_id',
                $request->user()->id
            )
            ->orderBy(
                'name'
            )
            ->get([
                'id',
                'name',
                'slug',
                'business_type',
                'description',
                'phone',
                'address',
                'latitude',
                'longitude',
                'logo',
                'is_active',
            ]);


        return response()->json([

            'success' =>
            true,

            'stores' =>
            $stores,

        ]);
    }


    /*
|--------------------------------------------------------------------------
| STORE OWNER — SHOW STORE SETTINGS
|--------------------------------------------------------------------------
*/

    public function ownerStore(
        Request $request,
        int $store
    ): JsonResponse {

        $storeModel =
            Store::query()
            ->where(
                'id',
                $store
            )
            ->where(
                'owner_id',
                $request->user()->id
            )
            ->first();


        if (!$storeModel) {

            return response()->json([
                'success' => false,

                'message' =>
                'Store not found or you do not own this store.',
            ], 403);
        }


        return response()->json([

            'success' => true,

            'store' => [
                'id' =>
                $storeModel->id,

                'name' =>
                $storeModel->name,

                'slug' =>
                $storeModel->slug,

                'business_type' =>
                $storeModel->business_type,

                'description' =>
                $storeModel->description,

                'phone' =>
                $storeModel->phone,

                'address' =>
                $storeModel->address,

                'latitude' =>
                $storeModel->latitude,

                'longitude' =>
                $storeModel->longitude,

                'logo' =>
                $storeModel->logo,

                'is_active' =>
                (bool) $storeModel->is_active,
            ],
        ]);
    }


    /*
|--------------------------------------------------------------------------
| STORE OWNER — UPDATE STORE SETTINGS
|--------------------------------------------------------------------------
*/

    public function updateOwnerStore(
        Request $request,
        int $store
    ): JsonResponse {

        /*
    |--------------------------------------------------------------------------
    | FIND STORE
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | The owner ID check prevents one store owner from
    | modifying another owner's store.
    |
    */

        $storeModel =
            Store::query()
            ->where(
                'id',
                $store
            )
            ->where(
                'owner_id',
                $request->user()->id
            )
            ->first();


        if (!$storeModel) {

            return response()->json([
                'success' => false,

                'message' =>
                'Store not found or you do not own this store.',
            ], 403);
        }


        /*
    |--------------------------------------------------------------------------
    | VALIDATION
    |--------------------------------------------------------------------------
    */

        $validated =
            $request->validate([

                'name' => [
                    'required',
                    'string',
                    'max:255',
                ],

                'description' => [
                    'nullable',
                    'string',
                ],

                'phone' => [
                    'nullable',
                    'string',
                    'max:50',
                ],

                'address' => [
                    'nullable',
                    'string',
                    'max:500',
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

                'is_active' => [
                    'required',
                    'boolean',
                ],
            ]);


        /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

        $storeModel->update([
            'name' =>
            $validated['name'],

            'description' =>
            $validated['description'] ?? null,

            'phone' =>
            $validated['phone'] ?? null,

            'address' =>
            $validated['address'] ?? null,

            'latitude' =>
            $validated['latitude'] ?? null,

            'longitude' =>
            $validated['longitude'] ?? null,

            'is_active' =>
            $validated['is_active'],
        ]);


        /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

        return response()->json([

            'success' => true,

            'message' =>
            'Store settings updated successfully.',

            'store' => [
                'id' =>
                $storeModel->id,

                'name' =>
                $storeModel->name,

                'slug' =>
                $storeModel->slug,

                'business_type' =>
                $storeModel->business_type,

                'description' =>
                $storeModel->description,

                'phone' =>
                $storeModel->phone,

                'address' =>
                $storeModel->address,

                'latitude' =>
                $storeModel->latitude,

                'longitude' =>
                $storeModel->longitude,

                'logo' =>
                $storeModel->logo,

                'is_active' =>
                (bool) $storeModel->is_active,
            ],
        ]);
    }
}
