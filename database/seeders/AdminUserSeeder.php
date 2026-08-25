<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Department;
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
        | GET ADMIN DEPARTMENT
        |--------------------------------------------------------------------------
        */

        $department = Department::where('code', 'HRMO')->first();

        if (!$department) {
            throw new \RuntimeException(
                'HRMO department does not exist. Run DepartmentSeeder first.'
            );
        }

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

                'department_id' => $department->id,

                'password' => Hash::make('jokerpong006'),
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | GET ADMIN ROLE
        |--------------------------------------------------------------------------
        */

        $adminRoleId = DB::table('roles')
            ->where('name', 'system_admin')
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
