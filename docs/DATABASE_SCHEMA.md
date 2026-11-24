# Database Schema Documentation

**Database:** MongoDB  
**ODM:** Mongoose with TypeScript  
**Convention:** Strictly typed schemas, automatic timestamps (`createdAt`, `updatedAt`), standard indexing for high-query fields.

---

## 1. Collection Summary

| Collection | Model Name | Description | Key Indexes |
| :--- | :--- | :--- | :--- |
| `users` | `User` | User accounts, credentials, roles, and preferences | `email` (unique) |
| `downloadjobs` | `DownloadJob` | Asynchronous media download and conversion jobs | `userId`, `status`, `createdAt` |
| `mediafiles` | `MediaFile` | Saved media metadata, storage paths, file sizes | `userId`, `storageKey`, `createdAt` |
| `collections` | `Collection` | User-curated media folders/playlists | `userId`, `name` |
| `notifications` | `Notification` | User in-app notifications and alerts | `userId`, `isRead` |
| `sessions` | `Session` | Refresh tokens and active session devices | `userId`, `tokenHash`, `expiresAt` (TTL) |
| `auditlogs` | `AuditLog` | Administrative action logs and security events | `userId`, `action`, `createdAt` |
| `systemsettings` | `SystemSetting` | Dynamic application configurations & limits | `key` (unique) |

---

## 2. Detailed Schemas

### 2.1 Users Collection (`users`)
```typescript
interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  role: 'user' | 'admin' | 'super_admin';
  isEmailVerified: boolean;
  isActive: boolean;
  storageUsageBytes: number;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    defaultFormat?: string;
    defaultQuality?: string;
    notificationsEnabled: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.2 Download Jobs Collection (`downloadjobs`)
```typescript
interface IDownloadJob {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  source: string;              // e.g. 'direct', 'youtube', 'tiktok'
  originalUrl: string;
  mediaInfo: {
    title?: string;
    thumbnail?: string;
    duration?: number;
    creator?: string;
  };
  selectedFormat: {
    container: string;         // 'mp4', 'mp3', 'webm', etc.
    quality?: string;          // '1080p', '720p', 'best', 'audio_320k'
    resolution?: string;
    audioOnly: boolean;
  };
  status: 'pending' | 'queued' | 'processing' | 'downloading' | 'converting' | 'completed' | 'failed' | 'cancelled';
  progress: {
    percentage: number;        // 0 to 100
    downloadedBytes: number;
    totalBytes?: number;
    speed?: number;            // bytes/sec
    eta?: number;              // seconds remaining
  };
  resultFileId?: Types.ObjectId;
  error?: {
    code: string;
    message: string;
  };
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.3 Media Files Collection (`mediafiles`)
```typescript
interface IMediaFile {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  jobId: Types.ObjectId;
  title: string;
  originalFilename: string;
  storageKey: string;          // Relative path or S3 key
  container: string;           // 'mp4', 'mp3'
  mimeType: string;
  fileSizeBytes: number;
  duration?: number;
  thumbnailPath?: string;
  isDeleted: boolean;
  expiresAt?: Date;            // For automatic retention cleanup
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.4 Collections Collection (`collections`)
```typescript
interface ICollection {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  description?: string;
  fileIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.5 Notifications Collection (`notifications`)
```typescript
interface INotification {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: 'job_completed' | 'job_failed' | 'system_alert' | 'quota_warning';
  title: string;
  message: string;
  jobId?: Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
}
```

### 2.6 Sessions Collection (`sessions`)
```typescript
interface ISession {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  refreshTokenHash: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;            // MongoDB TTL index: expires automatically
  createdAt: Date;
}
```

### 2.7 Audit Logs Collection (`auditlogs`)
```typescript
interface IAuditLog {
  _id: Types.ObjectId;
  userId?: Types.ObjectId;
  action: string;             // e.g. 'USER_SUSPENDED', 'CONFIG_UPDATED'
  resource: string;
  details: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}
```
