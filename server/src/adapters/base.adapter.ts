import { ValidatedUrl } from '../utils/urlValidator.js';

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

export abstract class BaseAdapter {
  abstract readonly name: string;
  abstract readonly displayName: string;
  abstract readonly description: string;
  abstract readonly status: SourceInfo['status'];

  abstract supports(url: string): boolean;
  abstract inspect(validated: ValidatedUrl): Promise<MediaInspectionResult>;

  getInfo(): SourceInfo {
    return {
      name: this.name,
      displayName: this.displayName,
      description: this.description,
      status: this.status,
      supportedProtocols: ['http:', 'https:'],
    };
  }
}
