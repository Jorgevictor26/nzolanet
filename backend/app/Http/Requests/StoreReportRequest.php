<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'comment_id' => (int) $this->route('id'),
        ]);
    }

    public function rules(): array
    {
        return [
            'comment_id' => ['required', 'integer', 'exists:comments,id'],
            'reason' => [
                'required',
                'string',
                'in:Discurso de Ódio,Spam/Publicidade,Linguagem Imprópria,Assédio,Conteúdo Falso',
            ],
        ];
    }
}
