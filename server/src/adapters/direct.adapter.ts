import path from 'path';
import { BaseAdapter, MediaFormatOption, MediaInspectionResult } from './base.adapter.js';
import { ValidatedUrl } from '../utils/urlValidator.js';
import { AppError } from '../middlewares/errorHandler.js';

const KNOWN_MEDIA_EXTENSIONS = new Set([
  '.mp4',
  '.webm',
  '.mkv',
  '.mov',
  '.avi',
  '.mp3',
  '.m4a',
  '.wav',
  '.flac',
  '.aac',
  '.ogg',
  '.opus',
]);

export class DirectUrlAdapter extends BaseAdapter {
  readonly name = 'direct';
  readonly displayName = 'Direct Media URL';
  readonly description = 'Inspect and download media directly from public HTTP/HTTPS endpoints';
  readonly status = 'active' as const;

  supports(url: string): boolean {
    try {
      const parsed = new URL(url);
      const ext = path.extname(parsed.pathname).toLowerCase();
      // If has known media extension or is general HTTP/HTTPS link
      return KNOWN_MEDIA_EXTENSIONS.has(ext) || parsed.protocol.startsWith('http');
    } catch {
      return false;
    }
  }

  async inspect(validated: ValidatedUrl): Promise<MediaInspectionResult> {
    const targetUrl = validated.parsedUrl.toString();
    let response: Response;

    // Timeout controller (5 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      // 1. Attempt lightweight HEAD request
      response = await fetch(targetUrl, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'VideoDownloader/1.0 (+https://videodownloader.local)',
        },
      });

      // 2. If HEAD is blocked or disallowed (405), fallback to small GET range request
      if (response.status === 405 || response.status === 501) {
        response = await fetch(targetUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            Range: 'bytes=0-0',
            'User-Agent': 'VideoDownloader/1.0 (+https://videodownloader.local)',
          },
        });
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new AppError('Media inspection timed out after 5 seconds', 504, 'INSPECTION_TIMEOUT');
      }
      throw new AppError(`Network request to media target failed: ${err.message}`, 502, 'TARGET_UNREACHABLE');
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok && response.status !== 206) {
      throw new AppError(
        `Target server returned HTTP ${response.status} ${response.statusText}`,
        response.status >= 500 ? 502 : 400,
        'TARGET_ERROR'
      );
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    const parsedPath = path.parse(validated.parsedUrl.pathname);
    const fileExtension = parsedPath.ext.toLowerCase();

    // Verify it is an audio or video stream or recognized media file
    const isVideo = contentType.startsWith('video/') || ['.mp4', '.webm', '.mkv', '.mov', '.avi'].includes(fileExtension);
    const isAudio = contentType.startsWith('audio/') || ['.mp3', '.m4a', '.wav', '.aac', '.flac', '.ogg'].includes(fileExtension);

    if (!isVideo && !isAudio && !contentType.includes('application/octet-stream')) {
      throw new AppError(
        `Target URL does not appear to be a supported media stream (Content-Type: ${contentType || 'unknown'})`,
        422,
        'UNSUPPORTED_MEDIA_TYPE'
      );
    }

    // Determine content length
    const contentLengthHeader = response.headers.get('content-length');
    const contentRangeHeader = response.headers.get('content-range');
    let fileSizeBytes: number | undefined;

    if (contentLengthHeader && !isNaN(Number(contentLengthHeader))) {
      fileSizeBytes = parseInt(contentLengthHeader, 10);
    } else if (contentRangeHeader) {
      // Content-Range: bytes 0-0/1234567
      const match = contentRangeHeader.match(/\/(\d+)$/);
      if (match) {
        fileSizeBytes = parseInt(match[1], 10);
      }
    }

    // Determine Title from Content-Disposition or URL basename
    let title = parsedPath.name || 'Direct_Media_Download';
    const disposition = response.headers.get('content-disposition');
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
      if (match && match[1]) {
        title = decodeURIComponent(match[1]);
        const dispExt = path.extname(title);
        if (dispExt) {
          title = path.basename(title, dispExt);
        }
      }
    }

    const container = (fileExtension.replace('.', '') || (isAudio ? 'mp3' : 'mp4')).toLowerCase();

    // Build available format matrix
    const availableFormats: MediaFormatOption[] = [
      {
        formatId: 'original',
        container,
        quality: 'original',
        audioOnly: isAudio,
        fileSizeBytes,
        description: `Source format (${container.toUpperCase()})`,
      },
    ];

    // If source is a video, add standard MP4 and MP3 audio extraction options
    if (isVideo) {
      if (container !== 'mp4') {
        availableFormats.push({
          formatId: 'mp4-standard',
          container: 'mp4',
          quality: 'standard',
          audioOnly: false,
          description: 'Standard MP4 container (H.264 / AAC compatibility)',
        });
      }

      availableFormats.push({
        formatId: 'audio-mp3',
        container: 'mp3',
        quality: '320k',
        audioOnly: true,
        description: 'Extracted Audio (MP3, 320 kbps)',
      });
    }

    return {
      source: this.name,
      sourceDisplayName: this.displayName,
      url: targetUrl,
      title,
      approximateFileSizeBytes: fileSizeBytes,
      mimeType: contentType || undefined,
      availableFormats,
    };
  }
}
