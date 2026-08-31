export interface WorkspaceProfile {
  name: string;
  email: string;
  tagline: string | null;
  address: string | null;
  logoUrl: string | null;
}

export type UpdateWorkspaceProfileRequest = WorkspaceProfile;
