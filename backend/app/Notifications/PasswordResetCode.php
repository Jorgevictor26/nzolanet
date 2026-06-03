<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordResetCode extends Notification
{
    use Queueable;

    public function __construct(
        public readonly string $token,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Código de recuperação da NzolaNet')
            ->greeting('Olá!')
            ->line('Recebemos um pedido para redefinir a senha da tua conta na NzolaNet.')
            ->line('Usa este código na tela de redefinição de senha:')
            ->line($this->token)
            ->line('Se não pediste esta alteração, podes ignorar este email.');
    }
}
