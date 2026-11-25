import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { AppError } from '../middlewares/errorHandler.js';

export class StorageService {
  private static rootDir: string = path.resolve(process.cwd(), env.STORAGE_DIR);
  private static tempDir: string = path.join(StorageService.rootDir, 'temp');
  private static mediaDir: string = path.join(StorageService.rootDir, 'media');

  public static initStorage(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
    if (!fs.existsSync(this.mediaDir)) {
      fs.mkdirSync(this.mediaDir, { recursive: true });
    }
  }

  /**
   * Generates a safe temporary path for an in-progress download
   */
  public static getTempFilePath(extension = 'tmp'): string {
    this.initStorage();
    const safeExt = extension.replace(/[^a-zA-Z0-9]/g, '');
    const filename = `temp_${Date.now()}_${crypto.randomUUID()}.${safeExt}`;
    const targetPath = path.join(this.tempDir, filename);

    // Verify path boundary
    this.assertWithinBoundary(targetPath, this.tempDir);
    return targetPath;
  }

  /**
   * Moves a completed temporary file into user-scoped permanent storage
   */
  public static async promoteTempToMedia(
    tempFilePath: string,
    userId: string,
    container: string
  ): Promise<{ storageKey: string; absolutePath: string; fileSizeBytes: number }> {
    this.initStorage();
    this.assertWithinBoundary(tempFilePath, this.tempDir);

    if (!fs.existsSync(tempFilePath)) {
      throw new AppError('Temporary download file does not exist', 500, 'TEMP_FILE_MISSING');
    }

    const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
    const safeContainer = container.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'mp4';
    const userMediaDir = path.join(this.mediaDir, safeUserId);

    if (!fs.existsSync(userMediaDir)) {
      fs.mkdirSync(userMediaDir, { recursive: true });
    }

    const fileId = crypto.randomUUID();
    const finalFilename = `${fileId}.${safeContainer}`;
    const finalAbsolutePath = path.join(userMediaDir, finalFilename);

    this.assertWithinBoundary(finalAbsolutePath, this.mediaDir);

    // Rename/move temp file to final destination
    await fs.promises.rename(tempFilePath, finalAbsolutePath);

    const stats = await fs.promises.stat(finalAbsolutePath);
    const storageKey = path.posix.join('media', safeUserId, finalFilename);

    return {
      storageKey,
      absolutePath: finalAbsolutePath,
      fileSizeBytes: stats.size,
    };
  }

  /**
   * Safely deletes a file from disk
   */
  public static async deleteFile(absoluteOrRelativePath: string): Promise<boolean> {
    try {
      const resolved = path.isAbsolute(absoluteOrRelativePath)
        ? path.resolve(absoluteOrRelativePath)
        : path.resolve(this.rootDir, absoluteOrRelativePath);

      this.assertWithinBoundary(resolved, this.rootDir);

      if (fs.existsSync(resolved)) {
        await fs.promises.unlink(resolved);
        return true;
      }
      return false;
    } catch (err: any) {
      console.warn(`[StorageService] Failed to delete file: ${err.message}`);
      return false;
    }
  }

  /**
   * Guard to prevent Path Traversal attacks (../) outside authorized root
   */
  private static assertWithinBoundary(targetPath: string, boundaryDir: string): void {
    const resolvedTarget = path.resolve(targetPath);
    const resolvedBoundary = path.resolve(boundaryDir);

    if (!resolvedTarget.startsWith(resolvedBoundary)) {
      throw new AppError('Access to unauthorized filesystem path blocked', 403, 'PATH_TRAVERSAL_BLOCKED');
    }
  }
}
