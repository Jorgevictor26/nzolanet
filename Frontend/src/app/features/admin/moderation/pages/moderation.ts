import { Component, OnInit, computed, signal } from '@angular/core';
import { profilePhotoUrl } from '../../../../core/models/avatar';
import { ApiReport, Moderation as ModerationService } from '../../../../core/services/moderation';
import { Users } from '../../../../core/services/users';

type ModerationReport = ApiReport & {
  reportsCount: number;
};

@Component({
  selector: 'app-moderation',
  imports: [],
  templateUrl: './moderation.html',
})
export class Moderation implements OnInit {
  protected readonly activeReport = signal<ModerationReport | null>(null);
  protected readonly reports = signal<ModerationReport[]>([]);
  protected readonly loading = signal(false);
  protected readonly totalUsersCount = signal(0);
  protected readonly error = signal<string | null>(null);
  protected readonly reportsCount = computed(() =>
    this.reports().reduce((total, report) => total + report.reportsCount, 0),
  );
  protected readonly reportedUsersCount = computed(
    () => new Set(this.reports().map((report) => report.user)).size,
  );

  constructor(
    private readonly moderationSvc: ModerationService,
    private readonly users: Users,
  ) {}

  ngOnInit(): void {
    this.loadReports();
    this.loadUsersCount();
  }

  private loadUsersCount(): void {
    this.users.count().subscribe({
      next: ({ data }) => this.totalUsersCount.set(data.count),
      error: () => {},
    });
  }

  protected openReportDetails(report: ModerationReport): void {
    this.activeReport.set(report);
  }

  protected closeReportDetails(): void {
    this.activeReport.set(null);
  }

  protected approve(report: ApiReport): void {
    this.moderationSvc.approve(report.id).subscribe({
      next: ({ data }) => {
        this.updateReport(this.mapReport(data));
        this.closeReportDetails();
      },
      error: () => this.error.set('Não foi possível aprovar o comentário.'),
    });
  }

  protected remove(report: ApiReport): void {
    this.moderationSvc.removeComment(report.id).subscribe({
      next: () => {
        this.reports.update((reports) => reports.filter((item) => item.id !== report.id));
        this.closeReportDetails();
      },
      error: () => this.error.set('Não foi possível remover o comentário.'),
    });
  }

  protected warn(report: ApiReport): void {
    this.moderationSvc.warnUser(report.id).subscribe({
      next: ({ data }) => {
        this.updateReport(this.mapReport(data));
        this.closeReportDetails();
      },
      error: () => this.error.set('Não foi possível avisar o utilizador.'),
    });
  }

  private loadReports(): void {
    this.loading.set(true);
    this.error.set(null);

    this.moderationSvc.list().subscribe({
      next: ({ data }) => {
        this.reports.set(data.map((report) => this.mapReport(report)));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Não foi possível carregar as denúncias.');
        this.loading.set(false);
      },
    });
  }

  private updateReport(report: ModerationReport): void {
    this.reports.update((reports) =>
      reports.map((item) => (item.id === report.id ? report : item)),
    );
  }

  private mapReport(report: ApiReport): ModerationReport {
    return {
      ...report,
      avatar: profilePhotoUrl(report.avatar) ?? '/nzolanet_logo.png',
      reportsCount: report.reports_count,
    };
  }
}
