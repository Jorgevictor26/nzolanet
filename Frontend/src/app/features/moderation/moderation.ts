import { Component } from '@angular/core';

type ModerationReport = {
  user: string;
  reason: string;
  status: 'Pendente' | 'Resolvido';
};

@Component({
  selector: 'app-moderation',
  imports: [],
  templateUrl: './moderation.html'
})
export class Moderation {
  protected readonly reports: ModerationReport[] = [
    {
      user: 'Joao Silva',
      reason: 'Discurso de Odio',
      status: 'Pendente'
    },
    {
      user: 'Ana Martins',
      reason: 'Spam/Publicidade',
      status: 'Pendente'
    },
    {
      user: 'Pedro Lima',
      reason: 'Linguagem Impropria',
      status: 'Resolvido'
    }
  ];
}
