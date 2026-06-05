<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePostReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'post_id' => (int) $this->route('id'),
        ]);
    }

    public function rules(): array
    {
        return [
            'post_id' => ['required', 'integer', 'exists:posts,id'],
            'reason' => [
                'required',
                'string',
                'in:Discurso de Ódio,Spam/Publicidade,Linguagem Imprópria,Assédio,Conteúdo Falso',
            ],
        ];
    }
}
