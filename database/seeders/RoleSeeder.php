<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'name' => 'customer',
                'description' => 'Regular PONG customer',
            ],
            [
                'name' => 'store_owner',
                'description' => 'Grocery store owner',
            ],
            [
                'name' => 'restaurant_owner',
                'description' => 'Restaurant owner',
            ],
            [
                'name' => 'driver',
                'description' => 'PONG driver',
            ],
            [
                'name' => 'admin',
                'description' => 'PONG administrator',
            ],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                ['name' => $role['name']],
                ['description' => $role['description']]
            );
        }
    }
}
