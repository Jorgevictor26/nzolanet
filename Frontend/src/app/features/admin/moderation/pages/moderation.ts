import { Component, computed, signal } from '@angular/core';

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
  protected readonly reports = signal<ModerationReport[]>([]);
  protected readonly reportsCount = computed(() => this.reports().reduce((total, report) => total + report.reportsCount, 0));
  protected readonly reportedUsersCount = computed(() => new Set(this.reports().map((report) => report.user)).size);

  protected openReportDetails(report: ModerationReport): void {
    this.activeReport.set(report);
  }

  protected closeReportDetails(): void {
    this.activeReport.set(null);
  }
}
