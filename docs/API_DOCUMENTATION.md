# REST API Documentation

**Base URL:** `/api/v1`  
**Protocol:** HTTP/1.1 or HTTP/2, HTTPS required in production  
**Data Format:** `application/json` (except media streaming endpoints)

---

## 1. Response Conventions

### Success Response Envelope
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

### Error Response Envelope
```json
{
  "success": false,
  "message": "Human readable error summary",
  "error": {
    "code": "ERROR_CODE_CONSTANT",
    "details": []
  }
}
```

### Common HTTP Status Codes
* `200 OK` — Successful GET / synchronous operation
* `201 Created` — Successful resource creation (POST)
* `202 Accepted` — Asynchronous job enqueued
* `400 Bad Request` — Schema validation or malformed input error
* `401 Unauthorized` — Missing or invalid authentication token
* `403 Forbidden` — Insufficient role permissions or resource ownership violation
* `404 Not Found` — Resource does not exist
* `422 Unprocessable Entity` — Business logic rejection (e.g. unsupported source)
* `429 Too Many Requests` — Rate limit exceeded
* `500 Internal Server Error` — Unhandled server exception

---

## 2. API Endpoints

### 2.1 System & Health
* `GET /api/v1/health`
  * Description: Health check reporting API, MongoDB, and worker queue status.
  * Auth: Public.
  * Response `200`: `{ "status": "ok", "uptime": 1234, "timestamp": "..." }`

### 2.2 Authentication (`/api/v1/auth`)
* `POST /api/v1/auth/register` — Register a new account (`name`, `email`, `password`).
* `POST /api/v1/auth/login` — Authenticate and receive access token + HTTP-only refresh cookie.
* `POST /api/v1/auth/logout` — Revoke active refresh session and clear cookies.
* `POST /api/v1/auth/refresh` — Issue a new short-lived access token using valid refresh token.
* `GET /api/v1/auth/me` — Retrieve the current authenticated user's profile and storage usage.

### 2.3 Media Inspection (`/api/v1/media`)
* `POST /api/v1/media/inspect`
  * Body: `{ "url": "https://example.com/video.mp4" }`
  * Description: Validates URL, performs SSRF safe checks, retrieves title, duration, thumbnail, and format options.
* `GET /api/v1/media/sources`
  * Description: Lists supported media source adapters and capabilities.

### 2.4 Download Management (`/api/v1/downloads`)
* `POST /api/v1/downloads`
  * Body: `{ "url": "...", "format": { "container": "mp4", "quality": "1080p", "audioOnly": false } }`
  * Response `202`: Returns enqueued `jobId` and initial state.
* `GET /api/v1/downloads`
  * Description: Returns paginated list of current user's download jobs.
* `GET /api/v1/downloads/:id`
  * Description: Get job details, progress percentage, bytes transferred, speed, and status.
* `POST /api/v1/downloads/:id/cancel`
  * Description: Cancel a pending, queued, or active download job.
* `POST /api/v1/downloads/:id/retry`
  * Description: Re-enqueue an eligible failed job.
* `DELETE /api/v1/downloads/:id`
  * Description: Remove job record from user's history.

### 2.5 Media Files & Library (`/api/v1/files`)
* `GET /api/v1/files` — List saved files with pagination, sorting, and search.
* `GET /api/v1/files/:id` — Get file details, duration, resolution, size.
* `GET /api/v1/files/:id/stream` — HTTP range request audio/video stream for in-browser playback.
* `GET /api/v1/files/:id/download` — Direct download with `Content-Disposition: attachment`.
* `DELETE /api/v1/files/:id` — Delete file binary and database record.

### 2.6 Real-Time Socket.IO Events
Clients connect to `/` with JWT in `auth.token`.
* Subscribes to private room: `user:<userId>`.
* Emitted Events:
  * `download:queued` — `{ jobId, status: "queued" }`
  * `download:started` — `{ jobId, status: "downloading" }`
  * `download:progress` — `{ jobId, percentage, downloadedBytes, totalBytes, speed, eta }`
  * `download:completed` — `{ jobId, fileId, status: "completed" }`
  * `download:failed` — `{ jobId, error: { code, message }, status: "failed" }`
  * `download:cancelled` — `{ jobId, status: "cancelled" }`
