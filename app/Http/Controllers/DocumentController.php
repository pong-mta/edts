<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use App\Http\Requests\StoreDocumentRequest;

class DocumentController extends Controller
{
    /**
     * Display the user's documents.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $documents = $user->documents()
            ->with('department')
            ->latest()
            ->get();

        return Inertia::render('documents/index', [
            'documents' => $documents,
        ]);
    }

    /**
     * Show the create document page.
     */
    public function create(): Response
    {
        return Inertia::render('documents/create');
    }

    /**
     * Store a new document.
     */
    public function store(
        StoreDocumentRequest $request
    ): RedirectResponse {
        $validated = $request->validate([
            'title' => [
                'required',
                'string',
                'max:255',
            ],

            'document_type' => [
                'required',
                'in:word,excel,template',
            ],
        ]);

        $user = $request->user();

        /*
        |--------------------------------------------------------------------------
        | CREATE DOCUMENT
        |--------------------------------------------------------------------------
        |
        | created_by and department_id come from the authenticated
        | user. They are NEVER accepted from the frontend.
        |
        */

        $document = $user->documents()->create([
            'title' =>
            $validated['title'],

            'document_type' =>
            $validated['document_type'],

            'content' =>
            null,

            'department_id' =>
            $user->department_id,

            'status' =>
            'draft',
        ]);

        return redirect()->route(
            'documents.edit',
            $document
        );
    }

    /**
     * Show the document editor.
     */
    public function edit(
        Request $request,
        Document $document
    ): Response {
        /*
        |--------------------------------------------------------------------------
        | SECURITY
        |--------------------------------------------------------------------------
        |
        | A user can only edit documents that they created.
        |
        */

        abort_unless(
            $document->created_by ===
                $request->user()->id,
            403
        );

        return Inertia::render(
            'documents/editor',
            [
                'document' =>
                $document->load([
                    'department',
                    'creator',
                ]),
            ]
        );
    }

    /**
     * Update the document.
     */
    public function update(
        Request $request,
        Document $document
    ): RedirectResponse {
        /*
        |--------------------------------------------------------------------------
        | SECURITY
        |--------------------------------------------------------------------------
        */

        abort_unless(
            $document->created_by ===
                $request->user()->id,
            403
        );

        $validated = $request->validate([
            'title' => [
                'required',
                'string',
                'max:255',
            ],

            'content' => [
                'nullable',
                'string',
            ],
        ]);

        $document->update([
            'title' =>
            $validated['title'],

            'content' =>
            $validated['content'] ?? null,
        ]);

        return back()->with(
            'success',
            'Document saved successfully.'
        );
    }
}
