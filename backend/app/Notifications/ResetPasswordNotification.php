<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends ResetPassword
{
    public function toMail(mixed $notifiable): MailMessage
    {
        $url = env('FRONTEND_URL') . '/login?token=' . $this->token . '&email=' . urlencode($notifiable->email);

        return (new MailMessage)
            ->subject('Recuperação de Senha - NzolaNet')
            ->greeting('Olá, ' . $notifiable->name . '!')
            ->line('Recebemos um pedido para redefinir a senha da tua conta.')
            ->action('Redefinir Senha', $url)
            ->line('Este link expira em 60 minutos.')
            ->line('Se não fizeste este pedido, ignora este email.');
    }
}