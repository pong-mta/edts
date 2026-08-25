<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DocumentController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/verify-otp', function () {
    return Inertia::render('auth/verify-otp');
})->name('verify-otp');

Route::get('/forgot-password/verify', function () {
    return Inertia::render('auth/verify-forgot-password');
})->name('password.forgot.verify');

Route::get('/reset-password', function () {
    return Inertia::render('auth/reset-password');
})->name('reset-password');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function (Request $request) {
        return Inertia::render('dashboard', [
            'user' => $request->user()->load([
                'department',
                'roles',
            ]),
        ]);
    })->name('dashboard');


    /*
    |--------------------------------------------------------------------------
    | DOCUMENTS
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/documents',
        [DocumentController::class, 'index']
    )->name('documents.index');

    Route::get(
        '/documents/create',
        [DocumentController::class, 'create']
    )->name('documents.create');

    Route::post(
        '/documents',
        [DocumentController::class, 'store']
    )->name('documents.store');

    Route::get(
        '/documents/{document}/edit',
        [DocumentController::class, 'edit']
    )->name('documents.edit');

    Route::put(
        '/documents/{document}',
        [DocumentController::class, 'update']
    )->name('documents.update');


    //EXCEL IMPORT AND OPEN TO EDITOR
    Route::get('/templates/import/excel', function () {
        return Inertia::render('templates/import-excel');
    })->name('templates.import.excel');

    Route::get('/templates/import/excel/editor', function () {
        return Inertia::render('templates/excel-editor');
    })->name('templates.excel.editor');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
