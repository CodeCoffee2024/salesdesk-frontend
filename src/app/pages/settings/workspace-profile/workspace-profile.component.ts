import { Component, OnInit } from '@angular/core';
import { WorkspaceProfileService } from '../../../core/services/workspace-profile.service';
import { WorkspaceProfile } from '../../../core/models/workspace-profile.model';

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

  constructor(private readonly workspaceProfileService: WorkspaceProfileService) {}

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
        logoUrl: this.logoUrl.trim() === '' ? null : this.logoUrl.trim()
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
  }
}
