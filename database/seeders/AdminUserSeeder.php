<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AdminUserSeeder extends Seeder
{
    /**
     * Seed the admin account.
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | ADMIN ACCOUNT
        |--------------------------------------------------------------------------
        */

        $user = User::updateOrCreate(
            [
                'phone' => '09156014662',
            ],
            [
                'name' => 'PONG ADMIN',

                'phone_verified' => true,
                'department' => 'HRMO',
                'password' =>
                Hash::make('jokerpong006'),
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | GET ADMIN ROLE
        |--------------------------------------------------------------------------
        */

        $adminRoleId =
            DB::table('roles')
            ->where('name', 'admin')
            ->value('id');

        if (!$adminRoleId) {
            throw new \RuntimeException(
                'Admin role does not exist. Run RoleSeeder first.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | ASSIGN ADMIN ROLE
        |--------------------------------------------------------------------------
        */

        $user->roles()->syncWithoutDetaching([
            $adminRoleId,
        ]);
    }
}
