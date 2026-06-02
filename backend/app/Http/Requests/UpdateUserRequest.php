<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'username' => [
                'nullable',
                'string',
                'max:30',
                'regex:/^[A-Za-z0-9_.]+$/',
                Rule::unique('users', 'username')->ignore($this->user()?->id),
            ],
            'phone_number' => [
                'nullable',
                'string',
                'max:30',
                Rule::unique('users', 'phone_number')->ignore($this->user()?->id),
            ],
            'bio' => ['nullable', 'string', 'max:1000'],
            'privacy' => ['required', 'in:public,private'],
            'profile_photo_file' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'cover_photo_file' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ];
    }
}
