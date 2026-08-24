<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\StoreCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class GroceryStoreCategoryController extends Controller
{
    /**
     * Get categories belonging to the selected store.
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


        /*
        |--------------------------------------------------------------------------
        | GET SELECTED STORE
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        | The store must belong to the authenticated owner.
        |
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
        | GET CATEGORIES
        |--------------------------------------------------------------------------
        */

        $categories =
            $store->categories()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();


        return response()->json([
            'success' => true,

            'store' => [
                'id' =>
                $store->id,

                'name' =>
                $store->name,
            ],

            'categories' =>
            $categories,
        ]);
    }


    /**
     * Create a category for the selected store.
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

            ]);


        /*
        |--------------------------------------------------------------------------
        | GET SELECTED STORE
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
        | UNIQUE SLUG INSIDE THIS STORE
        |--------------------------------------------------------------------------
        */

        $slug =
            $this->makeUniqueSlug(
                $store,
                $validated['name']
            );


        /*
        |--------------------------------------------------------------------------
        | CREATE CATEGORY
        |--------------------------------------------------------------------------
        */

        $category =
            $store->categories()->create([

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


        return response()->json([
            'success' => true,

            'message' =>
            'Category created successfully.',

            'category' =>
            $category,
        ], 201);
    }


    /**
     * Update a category.
     */
    public function update(
        Request $request,
        StoreCategory $category
    ): JsonResponse {

        $validated =
            $request->validate([

                'store_id' => [
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

            ]);


        /*
        |--------------------------------------------------------------------------
        | GET SELECTED STORE
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
        | CATEGORY MUST BELONG TO SELECTED STORE
        |--------------------------------------------------------------------------
        */

        if (
            (int) $category->store_id !==
            (int) $store->id
        ) {

            return response()->json([
                'success' => false,

                'message' =>
                'This category does not belong to the selected store.',
            ], 403);
        }


        /*
        |--------------------------------------------------------------------------
        | UNIQUE SLUG
        |--------------------------------------------------------------------------
        */

        $slug =
            Str::slug(
                $validated['name']
            );


        if (
            $slug === ''
        ) {

            $slug =
                'category';
        }


        $baseSlug =
            $slug;

        $counter =
            2;


        while (
            StoreCategory::query()
            ->where(
                'store_id',
                $store->id
            )
            ->where(
                'slug',
                $slug
            )
            ->where(
                'id',
                '!=',
                $category->id
            )
            ->exists()
        ) {

            $slug =
                $baseSlug .
                '-' .
                $counter;

            $counter++;
        }


        /*
        |--------------------------------------------------------------------------
        | UPDATE
        |--------------------------------------------------------------------------
        */

        $category->update([

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


        return response()->json([
            'success' => true,

            'message' =>
            'Category updated successfully.',

            'category' =>
            $category->fresh(),
        ]);
    }


    /**
     * Delete a category.
     */
    public function destroy(
        Request $request,
        StoreCategory $category
    ): JsonResponse {

        /*
        |--------------------------------------------------------------------------
        | GET OWNER'S STORE
        |--------------------------------------------------------------------------
        |
        | We use the category's store_id here.
        | Then verify that this store belongs to
        | the authenticated owner.
        |
        */

        $store =
            Store::query()
            ->where(
                'id',
                $category->store_id
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
                'You are not authorized to delete this category.',
            ], 403);
        }


        /*
        |--------------------------------------------------------------------------
        | DON'T DELETE CATEGORY WITH PRODUCTS
        |--------------------------------------------------------------------------
        */

        if (
            $category->products()
            ->exists()
        ) {

            return response()->json([
                'success' => false,

                'message' =>
                'This category cannot be deleted because it contains products.',
            ], 422);
        }


        /*
        |--------------------------------------------------------------------------
        | DELETE
        |--------------------------------------------------------------------------
        */

        $category->delete();


        return response()->json([
            'success' => true,

            'message' =>
            'Category deleted successfully.',
        ]);
    }


    /**
     * Generate unique slug inside a store.
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
                'category';
        }


        $slug =
            $base;

        $counter =
            2;


        while (
            StoreCategory::query()
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
