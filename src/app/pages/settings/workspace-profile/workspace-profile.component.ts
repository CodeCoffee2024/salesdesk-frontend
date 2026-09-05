import { Component, OnInit } from '@angular/core';
import { WorkspaceProfileService } from '../../../core/services/workspace-profile.service';
import { WorkspaceProfile } from '../../../core/models/workspace-profile.model';
import { IANA_TIMEZONES, ISO_COUNTRIES, ISO_CURRENCIES, taxLabelForCountry } from '../../../core/constants/locale.constants';

@Component({
  selector: 'app-workspace-profile',
  templateUrl: './workspace-profile.component.html',
  styleUrls: ['./workspace-profile.component.scss']
})
export class WorkspaceProfileComponent implements OnInit {
  loading = true;
  loadError = false;
  saving = false;
  saveError = false;
  saved = false;

  name = '';
  email = '';
  tagline = '';
  address = '';
  logoUrl = '';
  country = 'US';
  defaultCurrency = 'USD';
  timeZoneId = 'UTC';

  readonly countries = ISO_COUNTRIES;
  readonly currencies = ISO_CURRENCIES;
  readonly timeZones = IANA_TIMEZONES;

  constructor(private readonly workspaceProfileService: WorkspaceProfileService) {}

  /** Informational only (TASK-029 guardrail: no hardcoded tax rates) — just a label hint next to the Country selector. */
  get taxLabel(): string {
    return taxLabelForCountry(this.country);
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadError = false;
    this.workspaceProfileService.get().subscribe({
      next: (profile) => {
        this.applyProfile(profile);
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

    this.workspaceProfileService
      .update({
        name: this.name,
        email: this.email,
        tagline: this.tagline.trim() === '' ? null : this.tagline.trim(),
        address: this.address.trim() === '' ? null : this.address.trim(),
        logoUrl: this.logoUrl.trim() === '' ? null : this.logoUrl.trim(),
        country: this.country,
        defaultCurrency: this.defaultCurrency,
        timeZoneId: this.timeZoneId
      })
      .subscribe({
        next: (profile) => {
          this.applyProfile(profile);
          this.saving = false;
          this.saved = true;
        },
        error: () => {
          this.saving = false;
          this.saveError = true;
        }
      });
  }

  private applyProfile(profile: WorkspaceProfile): void {
    this.name = profile.name;
    this.email = profile.email;
    this.tagline = profile.tagline ?? '';
    this.address = profile.address ?? '';
    this.logoUrl = profile.logoUrl ?? '';
    this.country = profile.country;
    this.defaultCurrency = profile.defaultCurrency;
    this.timeZoneId = profile.timeZoneId;
  }
}
