export interface MediaFormatOption {
  formatId: string;
  container: string;
  quality: string;
  resolution?: string;
  audioOnly: boolean;
  fileSizeBytes?: number;
  description: string;
}

export interface MediaInspectionResult {
  source: string;
  sourceDisplayName: string;
  url: string;
  title: string;
  creator?: string;
  durationSeconds?: number;
  thumbnail?: string;
  approximateFileSizeBytes?: number;
  mimeType?: string;
  isLiveStream?: boolean;
  availableFormats: MediaFormatOption[];
}

export interface SourceInfo {
  name: string;
  displayName: string;
  description: string;
  status: 'active' | 'conditional' | 'maintenance';
  supportedProtocols: string[];
}
