# Development Roadmap

**Methodology:** Incremental, Test-Driven, Milestone-Oriented.  
**Standard:** Every phase must pass automated tests, linting, and verification before progressing.

---

## Phase Overview

```
[Phase 1] Foundation & Workspace Setup
    │
    ▼
[Phase 2] Authentication & User Security
    │
    ▼
[Phase 3] Media Inspection & URL Safety
    │
    ▼
[Phase 4] Asynchronous Download Engine & Storage
    │
    ▼
[Phase 5] Real-Time Progress & Socket.IO
    │
    ▼
[Phase 6] Media Processing & Transcoding (FFmpeg)
    │
    ▼
[Phase 7] Media Library & In-Browser Player
    │
    ▼
[Phase 8] Production Hardening, Docker & Release
```

---

## Detailed Milestones

### Phase 1: Foundation & Workspace Setup (Current)
* [ ] Root workspace orchestration (`package.json`, `.gitignore`).
* [ ] Express.js + TypeScript backend configuration (`tsconfig.json`, ESLint, Prettier).
* [ ] React 19 + Vite + TypeScript frontend configuration with Tailwind CSS.
* [ ] MongoDB connection with auto-reconnect and Mongoose models skeleton.
* [ ] Global error handler, Zod environment validation, and `/api/v1/health` endpoint.
* [ ] Automated testing setup (Vitest + Supertest) and verification test pass.

### Phase 2: Authentication & User Security
* [ ] User schema with bcrypt password hashing and role-based permissions (`user`, `admin`, `super_admin`).
* [ ] Registration, login, token refresh, and logout endpoints.
* [ ] JWT generation and HTTP-only cookie management.
* [ ] Authentication and role verification middlewares.
* [ ] Frontend authentication forms (Login, Register), Auth Context, and Protected Routes.

### Phase 3: Media Inspection & URL Safety
* [ ] URL syntax validation and regex parsing.
* [ ] SSRF defense engine (blocking loopback, private IPs, AWS metadata IPs).
* [ ] Source adapter architecture (`BaseAdapter`, `DirectUrlAdapter`).
* [ ] Metadata extraction (title, duration, content-type, content-length, formats).
* [ ] Frontend URL input bar with real-time validation and media preview card.

### Phase 4: Asynchronous Download Engine & Storage
* [ ] `DownloadJob` Mongoose model and state transitions.
* [ ] Asynchronous task queue manager (BullMQ / Internal queue).
* [ ] Streaming download worker piping data safely to `storage/temp/` and `storage/media/`.
* [ ] Download job creation (`POST /api/v1/downloads`) and polling endpoint (`GET /api/v1/downloads/:id`).
* [ ] Frontend format selector table and download submission trigger.

### Phase 5: Real-Time Engine (Socket.IO)
* [ ] Socket.IO server initialization with JWT authentication handshake.
* [ ] Worker progress emitter (calculating speed in MB/s, ETA, and percentage).
* [ ] Socket.IO client integration in React with reconnection resilience.
* [ ] Real-time progress bar UI with live metrics and cancellation button.

### Phase 6: Media Processing & Transcoding (FFmpeg)
* [ ] FFmpeg & FFprobe binary wrapper integration (`fluent-ffmpeg`, `@ffmpeg-installer/ffmpeg`).
* [ ] Media format conversion service (MP4/WebM to MP3 audio extraction, resolution downscaling).
* [ ] Thumbnail generator from video streams.
* [ ] Automated temporary file cleanup service.

### Phase 7: Media Library & In-Browser Player
* [ ] `MediaFile` and `Collection` models and REST endpoints.
* [ ] HTTP range streaming endpoint (`GET /api/v1/files/:id/stream`) for video seeking.
* [ ] Frontend media library view with search, filter, and sorting.
* [ ] Custom video/audio player modal.

### Phase 8: Production Hardening & Packaging
* [ ] Security audits, rate-limiting rules, Helmet configuration.
* [ ] Multi-stage `Dockerfile` and `docker-compose.yml` for unified deployment.
* [ ] End-to-end integration tests.
* [ ] Comprehensive `README.md` and operational runbooks.
