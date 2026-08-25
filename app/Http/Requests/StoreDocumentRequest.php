<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDocumentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to create a document.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'title' => [
                'required',
                'string',
                'max:255',
            ],

            'document_type' => [
                'required',
                Rule::in([
                    'word',
                    'excel',
                    'template',
                ]),
            ],
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'title.required' =>
            'Please enter a document title.',

            'title.max' =>
            'The document title may not exceed 255 characters.',

            'document_type.required' =>
            'Please select a document type.',

            'document_type.in' =>
            'The selected document type is invalid.',
        ];
    }
}
