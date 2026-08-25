<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            ['code' => 'MAYOR', 'name' => 'Office of the Municipal Mayor'],
            ['code' => 'VMAYOR', 'name' => 'Office of the Municipal Vice Mayor'],
            ['code' => 'SB', 'name' => 'Sangguniang Bayan'],
            ['code' => 'ADMIN', 'name' => 'Municipal Administrator’s Office'],
            ['code' => 'MPDO', 'name' => 'Municipal Planning and Development Office'],
            ['code' => 'BUDGET', 'name' => 'Municipal Budget Office'],
            ['code' => 'ACCOUNTING', 'name' => 'Municipal Accounting Office'],
            ['code' => 'TREASURER', 'name' => 'Municipal Treasurer’s Office'],
            ['code' => 'ASSESSOR', 'name' => 'Municipal Assessor’s Office'],
            ['code' => 'ENGINEERING', 'name' => 'Municipal Engineering Office'],
            ['code' => 'HEALTH', 'name' => 'Municipal Health Office'],
            ['code' => 'MSWDO', 'name' => 'Municipal Social Welfare and Development Office'],
            ['code' => 'AGRICULTURE', 'name' => 'Municipal Agriculture Office'],
            ['code' => 'MENRO', 'name' => 'Municipal Environment and Natural Resources Office'],
            ['code' => 'MDRRMO', 'name' => 'Municipal Disaster Risk Reduction and Management Office'],
            ['code' => 'CIVIL_REGISTRAR', 'name' => 'Municipal Civil Registrar’s Office'],
            ['code' => 'HRMO', 'name' => 'Human Resource Management Office'],
            ['code' => 'GSO', 'name' => 'General Services Office'],
            ['code' => 'LEGAL', 'name' => 'Municipal Legal Office'],
            ['code' => 'BPLO', 'name' => 'Business Permits and Licensing Office'],
            ['code' => 'PESO', 'name' => 'Public Employment Service Office'],
            ['code' => 'INFORMATION', 'name' => 'Municipal Information Office'],
            ['code' => 'TOURISM', 'name' => 'Municipal Tourism Office'],
            ['code' => 'ECONOMIC', 'name' => 'Local Economic Enterprise Office'],
            ['code' => 'GAD', 'name' => 'Gender and Development Office'],
        ];

        foreach ($departments as $department) {
            Department::updateOrCreate(
                ['code' => $department['code']],
                [
                    'name' => $department['name'],
                    'status' => true,
                ]
            );
        }
    }
}
