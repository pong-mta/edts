<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\StoreCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GroceryStoreProductController extends Controller
{
    /**
     * Get products belonging to the selected store.
     */
    public function index(
        Request $request
    ): JsonResponse {

        $validated =
            $request->validate([
                'store_id' => [
                    'required',
                    'integer',
                ],
            ]);

        $store =
            Store::query()
            ->where(
                'id',
                $validated['store_id']
            )
            ->where(
                'owner_id',
                $request->user()->id
            )
            ->first();

        if (!$store) {

            return response()->json([
                'success' => false,

                'message' =>
                'Store not found or you are not authorized to manage this store.',
            ], 403);
        }

        $products =
            Product::query()
            ->where(
                'store_id',
                $store->id
            )
            ->with([
                'category',
                'variants',
            ])
            ->orderBy(
                'sort_order'
            )
            ->orderBy(
                'name'
            )
            ->get();

        return response()->json([
            'success' => true,

            'store' => [
                'id' =>
                $store->id,

                'name' =>
                $store->name,
            ],

            'products' =>
            $products,
        ]);
    }


    /**
     * Create a product and its variants.
     */
    public function store(
        Request $request
    ): JsonResponse {

        $validated =
            $request->validate([

                'store_id' => [
                    'required',
                    'integer',
                ],

                'category_id' => [
                    'required',
                    'integer',
                ],

                'name' => [
                    'required',
                    'string',
                    'max:255',
                ],

                'description' => [
                    'nullable',
                    'string',
                ],

                'image' => [
                    'nullable',
                    'string',
                    'max:2048',
                ],

                'is_active' => [
                    'nullable',
                    'boolean',
                ],

                'sort_order' => [
                    'nullable',
                    'integer',
                ],

                /*
                |--------------------------------------------------------------------------
                | VARIANTS
                |--------------------------------------------------------------------------
                */

                'variants' => [
                    'nullable',
                    'array',
                ],

                'variants.*.name' => [
                    'required',
                    'string',
                    'max:255',
                ],

                'variants.*.sku' => [
                    'nullable',
                    'string',
                    'max:255',
                ],

                'variants.*.price' => [
                    'required',
                    'numeric',
                    'min:0',
                ],

                'variants.*.stock' => [
                    'nullable',
                    'integer',
                    'min:0',
                ],

                'variants.*.image' => [
                    'nullable',
                    'string',
                    'max:2048',
                ],

                'variants.*.is_active' => [
                    'nullable',
                    'boolean',
                ],

                'variants.*.sort_order' => [
                    'nullable',
                    'integer',
                    'min:0',
                ],
            ]);


        /*
        |--------------------------------------------------------------------------
        | VERIFY STORE
        |--------------------------------------------------------------------------
        */

        $store =
            Store::query()
            ->where(
                'id',
                $validated['store_id']
            )
            ->where(
                'owner_id',
                $request->user()->id
            )
            ->first();

        if (!$store) {

            return response()->json([
                'success' => false,

                'message' =>
                'Store not found or you are not authorized to manage this store.',
            ], 403);
        }


        /*
        |--------------------------------------------------------------------------
        | VERIFY CATEGORY
        |--------------------------------------------------------------------------
        */

        $category =
            StoreCategory::query()
            ->where(
                'id',
                $validated['category_id']
            )
            ->where(
                'store_id',
                $store->id
            )
            ->first();

        if (!$category) {

            return response()->json([
                'success' => false,

                'message' =>
                'The selected category does not belong to this store.',
            ], 422);
        }


        /*
        |--------------------------------------------------------------------------
        | CREATE PRODUCT + VARIANTS
        |--------------------------------------------------------------------------
        */

        $product =
            DB::transaction(
                function () use (
                    $store,
                    $validated
                ) {

                    $slug =
                        $this->makeUniqueSlug(
                            $store,
                            $validated['name']
                        );


                    /*
                    |--------------------------------------------------------------------------
                    | PRODUCT
                    |--------------------------------------------------------------------------
                    */

                    $product =
                        Product::create([

                            'store_id' =>
                            $store->id,

                            'category_id' =>
                            $validated['category_id'],

                            'name' =>
                            $validated['name'],

                            'slug' =>
                            $slug,

                            'description' =>
                            $validated['description']
                                ?? null,

                            'image' =>
                            $validated['image']
                                ?? null,

                            'is_active' =>
                            $validated['is_active']
                                ?? true,

                            'sort_order' =>
                            $validated['sort_order']
                                ?? 0,
                        ]);


                    /*
                    |--------------------------------------------------------------------------
                    | VARIANTS
                    |--------------------------------------------------------------------------
                    */

                    foreach (
                        $validated['variants']
                            ?? []
                        as $index =>
                        $variant
                    ) {

                        $product->variants()->create([

                            'name' =>
                            $variant['name'],

                            'sku' =>
                            $variant['sku']
                                ?? null,

                            'price' =>
                            $variant['price'],

                            'stock' =>
                            $variant['stock']
                                ?? 0,

                            'image' =>
                            $variant['image']
                                ?? null,

                            'is_active' =>
                            $variant['is_active']
                                ?? true,

                            'sort_order' =>
                            $variant['sort_order']
                                ?? $index,
                        ]);
                    }


                    return $product;
                }
            );


        /*
        |--------------------------------------------------------------------------
        | LOAD RELATIONSHIPS
        |--------------------------------------------------------------------------
        */

        $product->load([
            'category',
            'variants',
        ]);


        return response()->json([
            'success' => true,

            'message' =>
            'Product created successfully.',

            'product' =>
            $product,
        ], 201);
    }


    /**
     * Update a product and its variants.
     */
    public function update(
        Request $request,
        Product $product
    ): JsonResponse {

        $validated =
            $request->validate([

                'store_id' => [
                    'required',
                    'integer',
                ],

                'category_id' => [
                    'required',
                    'integer',
                ],

                'name' => [
                    'required',
                    'string',
                    'max:255',
                ],

                'description' => [
                    'nullable',
                    'string',
                ],

                'image' => [
                    'nullable',
                    'string',
                    'max:2048',
                ],

                'is_active' => [
                    'nullable',
                    'boolean',
                ],

                'sort_order' => [
                    'nullable',
                    'integer',
                ],

                'variants' => [
                    'nullable',
                    'array',
                ],

                'variants.*.id' => [
                    'nullable',
                    'integer',
                ],

                'variants.*.name' => [
                    'required',
                    'string',
                    'max:255',
                ],

                'variants.*.sku' => [
                    'nullable',
                    'string',
                    'max:255',
                ],

                'variants.*.price' => [
                    'required',
                    'numeric',
                    'min:0',
                ],

                'variants.*.stock' => [
                    'nullable',
                    'integer',
                    'min:0',
                ],

                'variants.*.image' => [
                    'nullable',
                    'string',
                    'max:2048',
                ],

                'variants.*.is_active' => [
                    'nullable',
                    'boolean',
                ],

                'variants.*.sort_order' => [
                    'nullable',
                    'integer',
                    'min:0',
                ],
            ]);


        /*
        |--------------------------------------------------------------------------
        | VERIFY STORE
        |--------------------------------------------------------------------------
        */

        $store =
            Store::query()
            ->where(
                'id',
                $validated['store_id']
            )
            ->where(
                'owner_id',
                $request->user()->id
            )
            ->first();

        if (!$store) {

            return response()->json([
                'success' => false,

                'message' =>
                'Store not found or you are not authorized to manage this store.',
            ], 403);
        }


        /*
        |--------------------------------------------------------------------------
        | VERIFY PRODUCT
        |--------------------------------------------------------------------------
        */

        if (
            (int) $product->store_id !==
            (int) $store->id
        ) {

            return response()->json([
                'success' => false,

                'message' =>
                'This product does not belong to the selected store.',
            ], 403);
        }


        /*
        |--------------------------------------------------------------------------
        | VERIFY CATEGORY
        |--------------------------------------------------------------------------
        */

        $category =
            StoreCategory::query()
            ->where(
                'id',
                $validated['category_id']
            )
            ->where(
                'store_id',
                $store->id
            )
            ->first();

        if (!$category) {

            return response()->json([
                'success' => false,

                'message' =>
                'The selected category does not belong to this store.',
            ], 422);
        }


        /*
        |--------------------------------------------------------------------------
        | UPDATE PRODUCT + VARIANTS
        |--------------------------------------------------------------------------
        */

        DB::transaction(
            function () use (
                $product,
                $validated
            ) {

                $slug =
                    Str::slug(
                        $validated['name']
                    );

                if (
                    $slug === ''
                ) {
                    $slug =
                        'product';
                }

                $baseSlug =
                    $slug;

                $counter =
                    2;

                while (
                    Product::query()
                    ->where(
                        'store_id',
                        $product->store_id
                    )
                    ->where(
                        'slug',
                        $slug
                    )
                    ->where(
                        'id',
                        '!=',
                        $product->id
                    )
                    ->exists()
                ) {

                    $slug =
                        $baseSlug .
                        '-' .
                        $counter;

                    $counter++;
                }


                $product->update([

                    'category_id' =>
                    $validated['category_id'],

                    'name' =>
                    $validated['name'],

                    'slug' =>
                    $slug,

                    'description' =>
                    $validated['description']
                        ?? null,

                    'image' =>
                    $validated['image']
                        ?? null,

                    'is_active' =>
                    $validated['is_active']
                        ?? true,

                    'sort_order' =>
                    $validated['sort_order']
                        ?? 0,
                ]);


                /*
                |--------------------------------------------------------------------------
                | EXISTING VARIANT IDS
                |--------------------------------------------------------------------------
                */

                $submittedIds = collect(
                    $validated['variants']
                        ?? []
                )
                    ->pluck('id')
                    ->filter()
                    ->map(
                        fn($id) =>
                        (int) $id
                    )
                    ->values()
                    ->all();


                /*
                |--------------------------------------------------------------------------
                | DELETE REMOVED VARIANTS
                |--------------------------------------------------------------------------
                */

                $variantQuery =
                    $product->variants();

                if (
                    count($submittedIds) > 0
                ) {

                    $variantQuery->whereNotIn(
                        'id',
                        $submittedIds
                    );
                }

                $variantQuery->delete();


                /*
                |--------------------------------------------------------------------------
                | UPDATE / CREATE VARIANTS
                |--------------------------------------------------------------------------
                */

                foreach (
                    $validated['variants']
                        ?? []
                    as $index =>
                    $variant
                ) {

                    if (
                        !empty($variant['id'])
                    ) {

                        $existing =
                            $product
                            ->variants()
                            ->where(
                                'id',
                                $variant['id']
                            )
                            ->first();


                        if (
                            $existing
                        ) {

                            $existing->update([

                                'name' =>
                                $variant['name'],

                                'sku' =>
                                $variant['sku']
                                    ?? null,

                                'price' =>
                                $variant['price'],

                                'stock' =>
                                $variant['stock']
                                    ?? 0,

                                'image' =>
                                $variant['image']
                                    ?? null,

                                'is_active' =>
                                $variant['is_active']
                                    ?? true,

                                'sort_order' =>
                                $variant['sort_order']
                                    ?? $index,
                            ]);
                        }
                    } else {

                        $product
                            ->variants()
                            ->create([

                                'name' =>
                                $variant['name'],

                                'sku' =>
                                $variant['sku']
                                    ?? null,

                                'price' =>
                                $variant['price'],

                                'stock' =>
                                $variant['stock']
                                    ?? 0,

                                'image' =>
                                $variant['image']
                                    ?? null,

                                'is_active' =>
                                $variant['is_active']
                                    ?? true,

                                'sort_order' =>
                                $variant['sort_order']
                                    ?? $index,
                            ]);
                    }
                }
            }
        );


        $product->load([
            'category',
            'variants',
        ]);


        return response()->json([
            'success' => true,

            'message' =>
            'Product updated successfully.',

            'product' =>
            $product,
        ]);
    }


    /**
     * Delete a product.
     */
    public function destroy(
        Request $request,
        Product $product
    ): JsonResponse {

        $store =
            Store::query()
            ->where(
                'id',
                $product->store_id
            )
            ->where(
                'owner_id',
                $request->user()->id
            )
            ->first();


        if (!$store) {

            return response()->json([
                'success' => false,

                'message' =>
                'You are not authorized to delete this product.',
            ], 403);
        }


        /*
        |--------------------------------------------------------------------------
        | PRODUCT VARIANTS
        |--------------------------------------------------------------------------
        |
        | product_variants.product_id has cascadeOnDelete(),
        | so deleting the product also deletes its variants.
        |
        */

        $product->delete();


        return response()->json([
            'success' => true,

            'message' =>
            'Product deleted successfully.',
        ]);
    }


    /**
     * Generate unique product slug inside a store.
     */
    private function makeUniqueSlug(
        Store $store,
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
                'product';
        }


        $slug =
            $base;

        $counter =
            2;


        while (
            Product::query()
            ->where(
                'store_id',
                $store->id
            )
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
}
