<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GroceryCartController extends Controller
{
    /**
     * Get the authenticated user's active cart.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        $cart = Cart::query()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->with([
                'store:id,name,slug,logo',
                'items.productVariant.product:id,name,slug,image',
            ])
            ->latest('id')
            ->first();

        if (!$cart) {
            return response()->json([
                'success' => true,
                'cart' => null,
            ]);
        }

        return response()->json([
            'success' => true,
            'cart' => $this->formatCart($cart),
        ]);
    }

    /**
     * Add a product variant to the cart.
     */
    public function addItem(
        Request $request
    ): JsonResponse {
        $validated = $request->validate([
            'store_id' => [
                'required',
                'integer',
                'exists:stores,id',
            ],

            'product_variant_id' => [
                'required',
                'integer',
                'exists:product_variants,id',
            ],

            'quantity' => [
                'required',
                'integer',
                'min:1',
            ],
        ]);

        $user = $request->user();

        return DB::transaction(function () use (
            $validated,
            $user
        ) {
            $variant = ProductVariant::query()
                ->with('product')
                ->where('id', $validated['product_variant_id'])
                ->where('is_active', true)
                ->firstOrFail();

            if (!$variant->product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found.',
                ], 404);
            }

            if (
                !$variant->product->is_active
            ) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product is not available.',
                ], 422);
            }

            if (
                $variant->product->store_id
                !== (int) $validated['store_id']
            ) {
                return response()->json([
                    'success' => false,
                    'message' =>
                    'This product does not belong to the selected store.',
                ], 422);
            }

            if ($variant->stock < 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product is out of stock.',
                ], 422);
            }

            $cart = Cart::query()
                ->firstOrCreate(
                    [
                        'user_id' => $user->id,
                        'store_id' => $validated['store_id'],
                        'status' => 'active',
                    ]
                );

            $item = $cart->items()
                ->where(
                    'product_variant_id',
                    $variant->id
                )
                ->first();

            $newQuantity =
                ($item?->quantity ?? 0)
                + $validated['quantity'];

            if (
                $newQuantity >
                $variant->stock
            ) {
                return response()->json([
                    'success' => false,
                    'message' =>
                    "Only {$variant->stock} item(s) available.",
                ], 422);
            }

            if ($item) {

                $item->update([
                    'quantity' => $newQuantity,
                    'unit_price' => $variant->price,
                ]);
            } else {

                $item = $cart->items()->create([
                    'product_variant_id' =>
                    $variant->id,

                    'quantity' =>
                    $validated['quantity'],

                    'unit_price' =>
                    $variant->price,
                ]);
            }

            $cart->load([
                'store:id,name,slug,logo',
                'items.productVariant.product:id,name,slug,image',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Item added to cart.',
                'cart' => $this->formatCart($cart),
            ]);
        });
    }

    /**
     * Update cart item quantity.
     */
    public function updateItem(
        Request $request,
        CartItem $item
    ): JsonResponse {
        $validated = $request->validate([
            'quantity' => [
                'required',
                'integer',
                'min:1',
            ],
        ]);

        $user = $request->user();

        if (
            $item->cart->user_id
            !== $user->id
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $variant = $item
            ->productVariant()
            ->with('product')
            ->firstOrFail();

        if (
            !$variant->is_active
            || !$variant->product
            || !$variant->product->is_active
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                'This product is no longer available.',
            ], 422);
        }

        if (
            $validated['quantity']
            > $variant->stock
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                "Only {$variant->stock} item(s) available.",
            ], 422);
        }

        $item->update([
            'quantity' =>
            $validated['quantity'],

            'unit_price' =>
            $variant->price,
        ]);

        $cart = $item->cart->load([
            'store:id,name,slug,logo',
            'items.productVariant.product:id,name,slug,image',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Cart updated.',
            'cart' => $this->formatCart($cart),
        ]);
    }

    /**
     * Remove an item from the cart.
     */
    public function removeItem(
        Request $request,
        CartItem $item
    ): JsonResponse {
        $user = $request->user();

        if (
            $item->cart->user_id
            !== $user->id
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $cart = $item->cart;

        $item->delete();

        $cart->load([
            'store:id,name,slug,logo',
            'items.productVariant.product:id,name,slug,image',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Item removed.',
            'cart' => $this->formatCart($cart),
        ]);
    }

    /**
     * Format cart response.
     */
    private function formatCart(
        Cart $cart
    ): array {
        $items = $cart->items->map(
            function (CartItem $item) {

                $variant =
                    $item->productVariant;

                $product =
                    $variant?->product;

                $quantity =
                    (int) $item->quantity;

                $unitPrice =
                    (float) $item->unit_price;

                return [
                    'id' => $item->id,

                    'product_variant_id' =>
                    $item->product_variant_id,

                    'product_id' =>
                    $product?->id,

                    'product_name' =>
                    $product?->name,

                    'variant_name' =>
                    $variant?->name,

                    'sku' =>
                    $variant?->sku,

                    'image' =>
                    $variant?->image
                        ?? $product?->image,

                    'quantity' =>
                    $quantity,

                    'unit_price' =>
                    number_format(
                        $unitPrice,
                        2,
                        '.',
                        ''
                    ),

                    'subtotal' =>
                    number_format(
                        $quantity * $unitPrice,
                        2,
                        '.',
                        ''
                    ),
                ];
            }
        )->values();

        $totalQuantity = $items->sum(
            fn($item) =>
            $item['quantity']
        );

        $total = $items->sum(
            fn($item) =>
            (float) $item['subtotal']
        );

        return [
            'id' => $cart->id,

            'store' => $cart->store
                ? [
                    'id' =>
                    $cart->store->id,

                    'name' =>
                    $cart->store->name,

                    'slug' =>
                    $cart->store->slug,

                    'logo' =>
                    $cart->store->logo,
                ]
                : null,

            'status' =>
            $cart->status,

            'items' =>
            $items,

            'total_quantity' =>
            $totalQuantity,

            'total' =>
            number_format(
                $total,
                2,
                '.',
                ''
            ),
        ];
    }
}
