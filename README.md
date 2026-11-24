# VideoDownloader

A production-grade, permission-first MERN application for inspecting, downloading, and organizing media files asynchronously with real-time progress feedback.

---

## Key Features

* **Asynchronous Media Engine:** Long-running downloads are dispatched to a background queue, preventing API timeouts and blocking.
* **Real-Time Progress:** Live speed (MB/s), ETA countdown, and percentage completion streamed via Socket.IO.
* **Security & SSRF Protection:** Strict destination validation rejecting private subnets, loopbacks, and unauthorized protocols.
* **Format & Transcoding Support:** Permitted extraction, audio-only conversion (MP3), and stream remuxing powered by FFmpeg.
* **Personal Media Library:** In-browser media player, collections, searchable file history, and storage management.
* **Enterprise Security:** JWT with HTTP-only cookies, password hashing with bcrypt, role-based access control, and rate limiting.

---

## Tech Stack

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Socket.IO Client, Lucide Icons.
* **Backend:** Node.js (v24 ESM), Express, TypeScript, Zod, Mongoose, Socket.IO.
* **Database:** MongoDB (via Mongoose).
* **Media & Workers:** FFmpeg, FFprobe, BullMQ / Internal Queue Engine.
* **Testing:** Vitest, Supertest, React Testing Library.

---

## Project Structure

```
vedio-downloader/
├── client/              # React 19 + Vite + TypeScript frontend
├── server/              # Express + TypeScript backend
├── docs/                # Architecture, PRD, Database Schema, and API specifications
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_DOCUMENTATION.md
│   └── DEVELOPMENT_ROADMAP.md
├── package.json         # Root workspace scripts
└── README.md
```

---

## Documentation Links

* [Product Requirements Document (PRD)](file:///c:/Users/IT/Documents/vedio-downloader/docs/PRD.md)
* [System Architecture](file:///c:/Users/IT/Documents/vedio-downloader/docs/ARCHITECTURE.md)
* [Database Schema Specification](file:///c:/Users/IT/Documents/vedio-downloader/docs/DATABASE_SCHEMA.md)
* [REST API Documentation](file:///c:/Users/IT/Documents/vedio-downloader/docs/API_DOCUMENTATION.md)
* [Development Roadmap](file:///c:/Users/IT/Documents/vedio-downloader/docs/DEVELOPMENT_ROADMAP.md)
