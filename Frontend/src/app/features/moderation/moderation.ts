import { Component, signal } from '@angular/core';

type ModerationReason =
  | 'Discurso de Ódio'
  | 'Spam/Publicidade'
  | 'Linguagem Imprópria'
  | 'Assédio'
  | 'Conteúdo Falso';

type ModerationReport = {
  id: number;
  user: string;
  reason: ModerationReason;
  status: 'Pendente' | 'Resolvido';
  avatar: string;
  comment: string;
  reportsCount: number;
};

@Component({
  selector: 'app-moderation',
  imports: [],
  templateUrl: './moderation.html'
})
export class Moderation {
  protected readonly activeReport = signal<ModerationReport | null>(null);
  protected readonly reports: ModerationReport[] = [
    {
      id: 1,
      user: 'João Silva',
      reason: 'Discurso de Ódio',
      status: 'Pendente',
      avatar: 'https://i.pravatar.cc/120?img=12',
      comment: '"Este conteúdo é totalmente inaceitável e as pessoas que o publicaram não devam estar aqui..."',
      reportsCount: 8
    },
    {
      id: 2,
      user: 'Ana Martins',
      reason: 'Spam/Publicidade',
      status: 'Pendente',
      avatar: 'https://i.pravatar.cc/120?img=32',
      comment: '"Publicação repetida várias vezes com links externos e publicidade fora das regras da comunidade."',
      reportsCount: 5
    },
    {
      id: 3,
      user: 'Pedro Lima',
      reason: 'Linguagem Imprópria',
      status: 'Resolvido',
      avatar: 'https://i.pravatar.cc/120?img=53',
      comment: '"Comentário com palavras ofensivas direcionadas a outro utilizador durante a conversa."',
      reportsCount: 3
    },
    {
      id: 4,
      user: 'Carla Mendes',
      reason: 'Assédio',
      status: 'Pendente',
      avatar: 'https://i.pravatar.cc/120?img=45',
      comment: '"Mensagens insistentes e respostas agressivas após o utilizador pedir para parar."',
      reportsCount: 7
    },
    {
      id: 5,
      user: 'Miguel Costa',
      reason: 'Conteúdo Falso',
      status: 'Pendente',
      avatar: 'https://i.pravatar.cc/120?img=14',
      comment: '"Informação enganosa partilhada como notícia confirmada, sem qualquer fonte confiável."',
      reportsCount: 6
    },
    {
      id: 6,
      user: 'Beatriz Rocha',
      reason: 'Linguagem Imprópria',
      status: 'Resolvido',
      avatar: 'https://i.pravatar.cc/120?img=49',
      comment: '"Resposta removida por linguagem imprópria numa discussão pública."',
      reportsCount: 2
    },
    {
      id: 7,
      user: 'Rafael Nunes',
      reason: 'Spam/Publicidade',
      status: 'Pendente',
      avatar: 'https://i.pravatar.cc/120?img=18',
      comment: '"Perfil usado para promover serviços em comentários sem relação com o conteúdo."',
      reportsCount: 4
    },
    {
      id: 8,
      user: 'Luísa Andrade',
      reason: 'Discurso de Ódio',
      status: 'Resolvido',
      avatar: 'https://i.pravatar.cc/120?img=41',
      comment: '"Comentário denunciado por atacar um grupo de pessoas de forma ofensiva."',
      reportsCount: 9
    }
  ];

  protected openReportDetails(report: ModerationReport): void {
    this.activeReport.set(report);
  }

  protected closeReportDetails(): void {
    this.activeReport.set(null);
  }
}
