import { Component, OnInit } from '@angular/core';
import { ReminderSettingsService } from '../../../core/services/reminder-settings.service';
import { ReminderSettings } from '../../../core/models/reminder-settings.model';

@Component({
  selector: 'app-reminder-settings',
  templateUrl: './reminder-settings.component.html',
  styleUrls: ['./reminder-settings.component.scss']
})
export class ReminderSettingsComponent implements OnInit {
  loading = true;
  loadError = false;
  saving = false;
  saveError = false;
  saved = false;

  isEnabled = false;
  quoteFollowUpEnabled = true;
  invoiceDueWarningEnabled = true;
  overdueNoticesEnabled = true;
  ccEmail = '';

  constructor(private readonly reminderSettingsService: ReminderSettingsService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadError = false;
    this.reminderSettingsService.get().subscribe({
      next: (settings) => {
        this.applySettings(settings);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
      }
    });
  }

  save(): void {
    this.saving = true;
    this.saveError = false;
    this.saved = false;

    this.reminderSettingsService
      .save({
        isEnabled: this.isEnabled,
        quoteFollowUpEnabled: this.quoteFollowUpEnabled,
        invoiceDueWarningEnabled: this.invoiceDueWarningEnabled,
        overdueNoticesEnabled: this.overdueNoticesEnabled,
        ccEmail: this.ccEmail.trim() === '' ? null : this.ccEmail.trim()
      })
      .subscribe({
        next: (settings) => {
          this.applySettings(settings);
          this.saving = false;
          this.saved = true;
        },
        error: () => {
          this.saving = false;
          this.saveError = true;
        }
      });
  }

  private applySettings(settings: ReminderSettings): void {
    this.isEnabled = settings.isEnabled;
    this.quoteFollowUpEnabled = settings.quoteFollowUpEnabled;
    this.invoiceDueWarningEnabled = settings.invoiceDueWarningEnabled;
    this.overdueNoticesEnabled = settings.overdueNoticesEnabled;
    this.ccEmail = settings.ccEmail ?? '';
  }
}
