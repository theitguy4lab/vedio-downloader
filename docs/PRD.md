# Product Requirements Document (PRD)

## VideoDownloader

**Document version:** 1.0\
**Status:** Draft for product and engineering review\
**Product type:** Web application\
**Technology:** MERN (MongoDB, Express.js, React, Node.js)\
**Primary audience:** Individual users, creators, students, researchers,
and media professionals

------------------------------------------------------------------------

## 1. Product Summary

VideoDownloader is a web-based media download and management
application. It helps users inspect supported media URLs, choose from
available media formats, submit authorized download jobs, monitor
processing progress, and organize completed media in a personal library.

The product will use a React and TypeScript frontend, a Node.js and
Express backend, MongoDB for persistent application data, Redis and
BullMQ for background job processing, Socket.IO for real-time updates,
and FFmpeg/FFprobe for permitted media processing.

The initial release will prioritize direct media URLs and other sources
for which the application has a clearly permitted access and download
method. Integrations with YouTube, TikTok, Instagram, and Facebook are
conditional on the availability of authorized APIs or other expressly
permitted methods and compliance with each platform's terms and
applicable law.

### 1.1 Product vision

Provide a dependable, easy-to-use workspace for managing media downloads
and authorized media processing from one place.

### 1.2 Product principles

1.  **Permission first:** Only retrieve or process content the user
    owns, is authorized to access, or is otherwise legally permitted to
    download.
2.  **Reliability:** Long-running work must be handled by background
    workers rather than held open in HTTP requests.
3.  **Privacy:** Users can access only their own private jobs and files
    unless an explicitly authorized administrative action applies.
4.  **Transparency:** Show clear job states, progress, errors, and
    storage usage.
5.  **Modularity:** Integrate each source through an isolated adapter.
6.  **Maintainability:** Prefer a modular monolith with separate worker
    processes before considering microservices.

------------------------------------------------------------------------

## 2. Problem Statement

Users who are permitted to save media often need to move between
separate tools to inspect media, select formats, monitor long-running
tasks, and organize completed files. A simple URL input and download
button does not provide reliable job management, recovery, history, or a
coherent media library.

VideoDownloader addresses this by providing a single workflow for URL
inspection, authorized download processing, progress tracking, media
organization, and account management.

------------------------------------------------------------------------

## 3. Goals and Success Metrics

### 3.1 Product goals

-   Let users submit and inspect supported media URLs.
-   Present available formats and relevant metadata before a job is
    created.
-   Process downloads asynchronously.
-   Show current job status and progress.
-   Allow users to view, retrieve, and organize completed files.
-   Provide secure accounts and user-specific data access.
-   Give administrators operational visibility into users, jobs, queues,
    and storage.
-   Establish a foundation for future plans and subscriptions.

### 3.2 Success metrics

The team should establish baselines during beta testing and set numeric
targets before public launch.

  -----------------------------------------------------------------------
  Metric                              Definition
  ----------------------------------- -----------------------------------
  URL inspection success rate         Successful inspections divided by
                                      valid supported inspection attempts

  Job completion rate                 Completed jobs divided by jobs
                                      accepted for processing, excluding
                                      user cancellations

  Median inspection latency           Median time from inspection request
                                      to metadata response

  Job queue wait time                 Time between queue acceptance and
                                      worker start

  Job processing duration             Time from worker start to
                                      completion or failure

  Failure rate                        Failed jobs divided by jobs started

  Retry recovery rate                 Retried failed jobs that
                                      subsequently complete

  Active users                        Users who perform a meaningful
                                      action within a defined period

  Library engagement                  Users who view, search, or organize
                                      library files

  Support issue rate                  Reported issues per active user or
                                      per completed job
  -----------------------------------------------------------------------

Metrics must not be used to justify bypassing platform restrictions or
collecting unnecessary personal data.

------------------------------------------------------------------------

## 4. Target Users and Personas

### 4.1 Individual user

Needs a straightforward way to submit an authorized media URL, choose an
available format, and retrieve the resulting file.

### 4.2 Content creator

Needs to manage their own source material, maintain a history of
processed files, and convert media into supported formats.

### 4.3 Student or researcher

Needs to organize media they are authorized to use for study or
research, with searchable metadata and collections.

### 4.4 Administrator

Needs to monitor system health, manage accounts, review job failures,
enforce usage limits, and investigate abuse reports.

------------------------------------------------------------------------

## 5. Scope

### 5.1 In scope

-   Responsive web application.
-   User registration, login, logout, and account recovery.
-   Role-based access control.
-   URL validation and source detection.
-   Metadata inspection for supported sources.
-   Available format selection.
-   Asynchronous download jobs.
-   Queue, progress, cancellation, and retry management where supported.
-   Media conversion and inspection using FFmpeg/FFprobe.
-   Personal media library and collections.
-   Notifications and download history.
-   Administrative monitoring and user management.
-   Usage limits and a foundation for subscription plans.
-   Secure storage and file delivery.
-   Logging, monitoring, and testing.

### 5.2 Out of scope

-   Circumventing DRM, encryption, paywalls, login requirements, or
    platform access controls.
-   Accessing private accounts or private media without authorization.
-   Downloading content where the user lacks permission or a lawful
    basis.
-   Rehosting or redistributing third-party content without permission.
-   Guaranteeing that every platform URL can be downloaded.
-   Native Android, iOS, or desktop applications in the initial release.
-   Public social sharing of downloaded files.
-   A public search engine or catalog of third-party media.

### 5.3 Source support policy

The product may display a source as supported only when a documented,
permitted integration is available and operational.

  -----------------------------------------------------------------------
  Source                              Initial product position
  ----------------------------------- -----------------------------------
  Direct media URLs                   Primary MVP integration, subject to
                                      URL and network safety checks

  YouTube                             Conditional integration; use only
                                      permitted APIs or methods and
                                      comply with platform terms

  TikTok                              Conditional integration; use only
                                      permitted APIs or methods and
                                      comply with platform terms

  Instagram                           Conditional integration; use only
                                      permitted APIs or methods and
                                      comply with platform terms

  Facebook                            Conditional integration; use only
                                      permitted APIs or methods and
                                      comply with platform terms
  -----------------------------------------------------------------------

If an authorized method does not provide downloadable media, the
application must explain that the URL or requested operation is
unavailable. The application must not attempt to evade technical
restrictions.

------------------------------------------------------------------------

## 6. User Roles and Permissions

### 6.1 Guest

-   View public landing and help pages.
-   Register or log in.
-   Cannot access private user data.
-   Whether guest inspection is allowed is a configurable product
    decision; guest downloads are disabled by default for the MVP.

### 6.2 User

-   Manage their own profile and preferences.
-   Inspect supported URLs.
-   Create and manage their own download jobs.
-   View their own queue and history.
-   Access and organize their own media files.
-   Manage notifications and collections.
-   Delete their own files and account, subject to retention and legal
    requirements.

### 6.3 Admin

-   View administrative dashboard and operational metrics.
-   Search and manage user accounts.
-   Suspend or reactivate accounts with an audit reason.
-   View job and queue metadata needed for support and abuse prevention.
-   Review reports and operational logs according to access policy.
-   Configure supported sources and usage limits.

### 6.4 Super administrator

-   Perform admin functions.
-   Manage administrator accounts and role assignments.
-   Change high-impact system settings.
-   Review administrative audit logs.

Administrative access must be protected by strong authentication and
least-privilege permissions. Support staff should not have unrestricted
access to users' media contents.

------------------------------------------------------------------------

## 7. Functional Requirements

Priority definitions:

-   **P0:** Required for the first usable MVP.
-   **P1:** Required for the first production release.
-   **P2:** Planned enhancement.

### 7.1 Authentication and account management

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  FR-AUTH-001             Users can register with P0
                          name, email, and        
                          password.               

  FR-AUTH-002             Users can log in and    P0
                          log out securely.       

  FR-AUTH-003             Passwords are stored    P0
                          using a secure password 
                          hashing algorithm.      

  FR-AUTH-004             Users can view and      P1
                          update their profile.   

  FR-AUTH-005             Users can request       P1
                          password reset.         

  FR-AUTH-006             Users can verify their  P1
                          email address.          

  FR-AUTH-007             Users can view and      P2
                          revoke active sessions. 

  FR-AUTH-008             Users can request       P1
                          account deletion.       

  FR-AUTH-009             The system enforces     P0
                          role-based permissions. 

  FR-AUTH-010             Optional Google sign-in P2
                          may be added through a  
                          compliant OAuth flow.   
  -----------------------------------------------------------------------

### 7.2 URL inspection and source detection

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  FR-MEDIA-001            A user can submit a URL P0
                          for inspection.         

  FR-MEDIA-002            The system validates    P0
                          URL syntax and allowed  
                          protocols.              

  FR-MEDIA-003            The system identifies   P0
                          the source adapter,     
                          where possible.         

  FR-MEDIA-004            The system rejects      P0
                          prohibited, unsafe, or  
                          unsupported             
                          destinations.           

  FR-MEDIA-005            The system retrieves    P0
                          permitted metadata such 
                          as title, duration,     
                          creator, and thumbnail. 

  FR-MEDIA-006            The system displays     P0
                          available formats       
                          returned by the         
                          authorized source       
                          method.                 

  FR-MEDIA-007            The system provides a   P0
                          clear unavailable or    
                          unsupported response    
                          when inspection cannot  
                          proceed.                

  FR-MEDIA-008            The system applies      P0
                          inspection timeouts and 
                          request limits.         
  -----------------------------------------------------------------------

### 7.3 Download jobs

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  FR-DL-001               A user can create a job P0
                          from a successfully     
                          inspected supported     
                          source.                 

  FR-DL-002               A user can select an    P0
                          available format and    
                          quality.                

  FR-DL-003               The system stores the   P0
                          job and submits it to a 
                          background queue.       

  FR-DL-004               A user can view their   P0
                          own jobs and job        
                          details.                

  FR-DL-005               The system reports job  P0
                          state and progress.     

  FR-DL-006               A user can cancel a     P0
                          queued or active job    
                          where supported.        

  FR-DL-007               A user can retry an     P1
                          eligible failed job.    

  FR-DL-008               The system prevents     P0
                          unauthorized users from 
                          viewing or modifying a  
                          job.                    

  FR-DL-009               The system handles      P1
                          worker restarts and     
                          recovers or reconciles  
                          unfinished jobs.        

  FR-DL-010               The system applies      P1
                          per-user concurrency    
                          and usage limits.       

  FR-DL-011               The system prevents     P1
                          duplicate processing    
                          where idempotency rules 
                          apply.                  
  -----------------------------------------------------------------------

### 7.4 Media processing

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  FR-PROC-001             The system can inspect  P1
                          media properties using  
                          FFprobe.                

  FR-PROC-002             The system can convert  P1
                          authorized input media  
                          to supported output     
                          formats.                

  FR-PROC-003             The system can extract  P1
                          audio from authorized   
                          media.                  

  FR-PROC-004             The system can generate P1
                          thumbnails.             

  FR-PROC-005             Conversion jobs run     P1
                          separately from HTTP    
                          request handling.       

  FR-PROC-006             The system validates    P1
                          conversion options and  
                          resource limits.        

  FR-PROC-007             The system records      P1
                          conversion failures     
                          with safe,              
                          user-readable errors.   
  -----------------------------------------------------------------------

### 7.5 Media library

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  FR-LIB-001              Users can list their    P0
                          own completed media     
                          files.                  

  FR-LIB-002              Users can view file     P0
                          details.                

  FR-LIB-003              Users can retrieve      P0
                          files through           
                          authorized access.      

  FR-LIB-004              Users can search and    P1
                          sort their library.     

  FR-LIB-005              Users can rename        P1
                          library entries.        

  FR-LIB-006              Users can delete their  P0
                          files.                  

  FR-LIB-007              Users can mark files as P2
                          favorites.              

  FR-LIB-008              Users can create        P1
                          collections and         
                          organize files.         

  FR-LIB-009              The system displays     P1
                          storage usage.          
  -----------------------------------------------------------------------

### 7.6 History, queue, and notifications

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  FR-QUEUE-001            Users can view queued,  P0
                          active, completed,      
                          failed, and cancelled   
                          jobs.                   

  FR-QUEUE-002            Users can filter and    P1
                          sort their job history. 

  FR-QUEUE-003            Users receive real-time P1
                          progress updates while  
                          connected.              

  FR-QUEUE-004            The application can     P0
                          recover current job     
                          state after a page      
                          refresh.                

  FR-NOTIF-001            The system creates      P1
                          in-app notifications    
                          for important job       
                          events.                 

  FR-NOTIF-002            Users can mark          P1
                          notifications as read.  

  FR-NOTIF-003            Users can mark all      P2
                          notifications as read.  
  -----------------------------------------------------------------------

### 7.7 Settings and administration

  -----------------------------------------------------------------------
  ID                      Requirement             Priority
  ----------------------- ----------------------- -----------------------
  FR-SET-001              Users can choose theme  P1
                          and default format      
                          preferences.            

  FR-SET-002              Users can manage        P1
                          notification            
                          preferences.            

  FR-ADMIN-001            Admins can view         P1
                          aggregate application   
                          metrics.                

  FR-ADMIN-002            Admins can search and   P1
                          manage user accounts.   

  FR-ADMIN-003            Admins can inspect      P1
                          queue and worker        
                          health.                 

  FR-ADMIN-004            Admins can view         P1
                          operational errors and  
                          audit events.           

  FR-ADMIN-005            Admin actions are       P1
                          recorded with actor,    
                          action, target,         
                          timestamp, and reason.  

  FR-ADMIN-006            Admins can configure    P2
                          usage limits and source 
                          availability.           
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 8. User Workflows

### 8.1 Main download workflow

1.  User signs in.
2.  User opens the Downloader page.
3.  User pastes a supported URL.
4.  Frontend submits the URL to the inspection endpoint.
5.  Backend validates the URL and checks the source adapter.
6.  The adapter retrieves permitted metadata and available formats.
7.  Frontend displays the media preview and options.
8.  User selects an available format and submits the job.
9.  Backend checks permissions, quotas, and request validity.
10. Backend creates a download job and enqueues it.
11. A worker processes the job.
12. The frontend receives progress updates.
13. On success, the system stores the media and creates a MediaFile
    record.
14. The user sees the completed file in their library.
15. On failure, the user sees a safe error and an eligible retry option.

### 8.2 Cancellation workflow

1.  User requests cancellation.
2.  Backend verifies ownership and current job state.
3.  Backend records the cancellation request.
4.  Queue or worker receives the cancellation signal.
5.  Worker stops safely where possible and cleans up temporary data.
6.  Job status becomes cancelled.
7.  Frontend receives the updated state.

### 8.3 File deletion workflow

1.  User requests deletion of a library file.
2.  Backend verifies ownership.
3.  Backend checks whether the file is in use by an active process.
4.  Backend deletes or schedules deletion of the stored object.
5.  Database record is updated or removed according to retention policy.
6.  User receives confirmation.

------------------------------------------------------------------------

## 9. Download Job State Model

Allowed states:

-   `pending`
-   `queued`
-   `processing`
-   `downloading`
-   `completed`
-   `failed`
-   `cancelled`

Typical transitions:

``` text
pending -> queued
queued -> processing
processing -> downloading
downloading -> completed
pending -> cancelled
queued -> cancelled
processing -> cancelled
downloading -> cancelled
processing -> failed
downloading -> failed
failed -> queued (eligible retry)
```

The backend is the source of truth for job state. The frontend must not
directly set job status. Every transition must be validated, persisted,
and logged.

------------------------------------------------------------------------

## 10. Non-Functional Requirements

### 10.1 Performance

-   Normal API requests should return promptly and must not wait for
    long media processing tasks.
-   URL inspection should have configurable timeouts.
-   Large file transfers must use streaming rather than buffering entire
    files in application memory.
-   Pagination is required for job history and media library lists.
-   Performance targets must be measured under a documented test
    environment before launch.

### 10.2 Reliability

-   Background jobs must be persisted in the queue system.
-   Job processing must be idempotent where practical.
-   Failed jobs must have retry limits and backoff policies.
-   Worker restarts must not silently lose job records.
-   The system must reconcile interrupted jobs.
-   Database and object storage backups must be configured.

### 10.3 Scalability

-   API and worker processes must be independently deployable and
    scalable.
-   Queue concurrency must be configurable.
-   Media storage must be externalizable to object storage.
-   Database queries must use appropriate indexes.
-   Large media transfers must not consume unnecessary API memory.

### 10.4 Security and privacy

-   All production traffic must use HTTPS.
-   Passwords must be securely hashed.
-   Sessions must use secure cookie settings.
-   Every private resource must be authorized on the server.
-   URL processing must defend against SSRF, redirects to private
    networks, DNS rebinding, and unsafe protocols.
-   Worker processes must run with restricted permissions and resource
    limits.
-   File names and paths must be generated or normalized safely.
-   Secrets must not be committed to source control.
-   Logs must not expose passwords, session tokens, or unnecessary
    sensitive data.
-   Users must be able to request deletion of their account and
    associated data, subject to legal retention requirements.

### 10.5 Accessibility and usability

-   Responsive layouts for desktop, tablet, and mobile.
-   Keyboard-accessible forms and controls.
-   Clear labels and validation messages.
-   Visible loading, empty, success, and error states.
-   Adequate color contrast.
-   Progress indicators must include accessible text.

### 10.6 Maintainability

-   Use TypeScript for frontend, backend, worker, and shared contracts.
-   Keep source adapters isolated.
-   Separate controllers, services, models, and validation.
-   Maintain automated tests.
-   Document APIs and architecture.
-   Use structured logs and centralized error handling.

------------------------------------------------------------------------

## 11. UX and Page Requirements

### 11.1 Public pages

-   Landing page
-   Login
-   Registration
-   Forgot password
-   Help and support
-   Terms of service
-   Privacy policy
-   Acceptable use policy

### 11.2 Authenticated pages

  -----------------------------------------------------------------------
  Route                   Page                    Key content
  ----------------------- ----------------------- -----------------------
  `/dashboard`            Dashboard               Activity summary,
                                                  storage, recent jobs

  `/downloader`           Downloader              URL input, metadata
                                                  preview, format
                                                  selection

  `/queue`                Queue                   Active and pending
                                                  jobs, progress, actions

  `/history`              History                 Previous jobs, status
                                                  filters

  `/library`              Library                 Media grid/list,
                                                  search, sorting

  `/collections`          Collections             User-created media
                                                  groups

  `/notifications`        Notifications           In-app alerts

  `/settings`             Settings                Account, preferences,
                                                  privacy
  -----------------------------------------------------------------------

### 11.3 Admin pages

  Route                 Page               Key content
  --------------------- ------------------ -----------------------------------
  `/admin`              Overview           Users, jobs, errors, storage
  `/admin/users`        User management    Search, status, roles
  `/admin/downloads`    Job monitoring     Job status and failure data
  `/admin/queues`       Queue monitoring   Queue depth and worker activity
  `/admin/system`       System health      Service health and resource usage
  `/admin/audit-logs`   Audit history      Administrative actions

### 11.4 Required UI states

Every data-driven page must handle:

-   Initial loading
-   Empty state
-   Successful data display
-   Validation error
-   Server error
-   Network disconnection
-   Permission denied
-   Not found
-   Retry or recovery action where appropriate

------------------------------------------------------------------------

## 12. System Architecture

### 12.1 Architecture style

Use a modular monolith for the API, with separate background worker
processes. Avoid premature microservices.

### 12.2 Main components

  -----------------------------------------------------------------------
  Component                           Responsibility
  ----------------------------------- -----------------------------------
  React frontend                      User interface and client-side
                                      state

  Express API                         Authentication, authorization,
                                      validation, business logic

  MongoDB                             Users, jobs, files, collections,
                                      notifications

  Redis                               Queue coordination and transient
                                      state

  BullMQ                              Background job lifecycle

  Socket.IO                           Real-time user-specific events

  Source adapters                     Permitted source-specific metadata
                                      and retrieval

  FFmpeg/FFprobe                      Media inspection and conversion

  Object storage                      Persistent media files

  Monitoring                          Logs, metrics, errors, health
                                      checks
  -----------------------------------------------------------------------

### 12.3 Processing separation

Use separate queues or clearly separated job types for:

-   URL inspection
-   Download processing
-   Media conversion
-   Thumbnail generation
-   Cleanup tasks

The API should enqueue work and return a job identifier. Workers perform
long-running operations.

### 12.4 Source adapter contract

Each source adapter should implement a common contract for source
identification and supported metadata/format operations. Adapters must
declare their capabilities and limitations. An adapter must return an
explicit unsupported or unavailable result rather than attempting to
bypass a source's restrictions.

------------------------------------------------------------------------

## 13. Data Model

MongoDB collections:

1.  `users`
2.  `downloadjobs`
3.  `mediafiles`
4.  `collections`
5.  `notifications`
6.  `subscriptions`
7.  `sessions`
8.  `auditlogs`

### 13.1 User

``` ts
{
  _id: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  role: "user" | "admin" | "super_admin";
  isEmailVerified: boolean;
  isActive: boolean;
  preferences: {
    theme: "light" | "dark" | "system";
    defaultFormat?: string;
    defaultQuality?: string;
    notificationsEnabled: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### 13.2 DownloadJob

``` ts
{
  _id: ObjectId;
  userId: ObjectId;
  source: string;
  originalUrl: string;
  mediaInfo: {
    title?: string;
    thumbnail?: string;
    duration?: number;
    creator?: string;
  };
  selectedFormat: {
    container: string;
    quality?: string;
    resolution?: string;
    audioOnly: boolean;
  };
  status:
    | "pending"
    | "queued"
    | "processing"
    | "downloading"
    | "completed"
    | "failed"
    | "cancelled";
  progress: {
    percentage: number;
    downloadedBytes: number;
    totalBytes?: number;
    speed?: number;
    eta?: number;
  };
  resultFileId?: ObjectId;
  error?: {
    code: string;
    message: string;
  };
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### 13.3 MediaFile

``` ts
{
  _id: ObjectId;
  userId: ObjectId;
  downloadJobId?: ObjectId;
  title: string;
  originalFilename?: string;
  storedFilename: string;
  storage: {
    provider: "local" | "s3" | "r2";
    objectKey: string;
  };
  mimeType: string;
  extension: string;
  size: number;
  duration?: number;
  width?: number;
  height?: number;
  source?: string;
  originalUrl?: string;
  isFavorite: boolean;
  folderId?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

### 13.4 Collection

``` ts
{
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  description?: string;
  mediaFiles: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
```

### 13.5 Notification

``` ts
{
  _id: ObjectId;
  userId: ObjectId;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedJobId?: ObjectId;
  createdAt: Date;
}
```

### 13.6 Subscription

``` ts
{
  _id: ObjectId;
  userId: ObjectId;
  plan: "free" | "pro" | "business";
  status: string;
  startDate?: Date;
  endDate?: Date;
  paymentProvider?: string;
  externalSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 13.7 AuditLog

``` ts
{
  _id: ObjectId;
  actorUserId: ObjectId;
  action: string;
  targetType: string;
  targetId?: ObjectId;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
```

### 13.8 Index requirements

-   `users.email`: unique index.
-   `downloadjobs.userId + createdAt`: user history pagination.
-   `downloadjobs.status + createdAt`: operational queue views.
-   `mediafiles.userId + createdAt`: library pagination.
-   `collections.userId + name`: collection lookup, with uniqueness
    policy decided by product requirements.
-   `notifications.userId + isRead + createdAt`: notification listing.
-   `auditlogs.actorUserId + createdAt`: audit review.

Do not store video binaries in MongoDB. Store media in a filesystem or
object storage and keep references and metadata in MongoDB.

------------------------------------------------------------------------

## 14. API Requirements

Base path: `/api/v1`

All endpoints must validate input, authenticate where required,
authorize resource ownership, and return a consistent response format.

### 14.1 Authentication

  -------------------------------------------------------------------------
  Method                  Endpoint                  Description
  ----------------------- ------------------------- -----------------------
  POST                    `/auth/register`          Register

  POST                    `/auth/login`             Login

  POST                    `/auth/logout`            Logout

  POST                    `/auth/refresh`           Refresh session, if
                                                    token-based rotation is
                                                    used

  GET                     `/auth/me`                Current user

  POST                    `/auth/forgot-password`   Request reset

  POST                    `/auth/reset-password`    Reset password

  POST                    `/auth/verify-email`      Verify email
  -------------------------------------------------------------------------

### 14.2 Media inspection

  Method   Endpoint               Description
  -------- ---------------------- ---------------------------------------------
  POST     `/media/inspect`       Inspect a supported URL
  GET      `/media/sources`       List available source capabilities
  GET      `/media/:id`           Retrieve an inspection record, if persisted
  GET      `/media/:id/formats`   Retrieve available formats

### 14.3 Downloads

  Method   Endpoint                  Description
  -------- ------------------------- -----------------------------------------
  POST     `/downloads`              Create a job
  GET      `/downloads`              List current user's jobs
  GET      `/downloads/:id`          Job details
  POST     `/downloads/:id/pause`    Pause if supported
  POST     `/downloads/:id/resume`   Resume if supported
  POST     `/downloads/:id/cancel`   Cancel
  POST     `/downloads/:id/retry`    Retry eligible failure
  DELETE   `/downloads/:id`          Delete job record under retention rules

### 14.4 Files and collections

  Method   Endpoint                           Description
  -------- ---------------------------------- ---------------------------
  GET      `/files`                           List files
  GET      `/files/:id`                       File details
  GET      `/files/:id/stream`                Authorized streaming
  GET      `/files/:id/download`              Authorized file retrieval
  PATCH    `/files/:id`                       Update metadata
  DELETE   `/files/:id`                       Delete file
  POST     `/collections`                     Create collection
  GET      `/collections`                     List collections
  GET      `/collections/:id`                 Collection details
  PATCH    `/collections/:id`                 Update collection
  DELETE   `/collections/:id`                 Delete collection
  POST     `/collections/:id/files`           Add file
  DELETE   `/collections/:id/files/:fileId`   Remove file

### 14.5 Notifications

  Method   Endpoint                    Description
  -------- --------------------------- ---------------------
  GET      `/notifications`            List notifications
  PATCH    `/notifications/:id/read`   Mark read
  PATCH    `/notifications/read-all`   Mark all read
  DELETE   `/notifications/:id`        Delete notification

### 14.6 Administration

  Method   Endpoint                    Description
  -------- --------------------------- -----------------------
  GET      `/admin/dashboard`          Aggregate metrics
  GET      `/admin/users`              Search users
  PATCH    `/admin/users/:id/status`   Change account status
  GET      `/admin/downloads`          Inspect jobs
  GET      `/admin/workers`            Worker health
  GET      `/admin/queues`             Queue statistics
  GET      `/admin/logs`               Operational logs
  GET      `/admin/storage`            Storage metrics
  GET      `/admin/audit-logs`         Audit history

### 14.7 API response conventions

Success:

``` json
{
  "success": true,
  "message": "Download job created",
  "data": {
    "jobId": "example-id",
    "status": "queued"
  }
}
```

Error:

``` json
{
  "success": false,
  "message": "Unsupported media source",
  "error": {
    "code": "UNSUPPORTED_SOURCE"
  }
}
```

Use suitable HTTP status codes, pagination metadata, request correlation
IDs, and safe error messages. Never return internal stack traces or
secrets to clients.

------------------------------------------------------------------------

## 15. Real-Time Events

Use Socket.IO for authenticated, user-specific updates.

  Event                    Payload purpose
  ------------------------ --------------------------------------------
  `download:queued`        Job accepted
  `download:started`       Worker started
  `download:progress`      Progress, speed, and ETA
  `download:completed`     Job completed and file reference available
  `download:failed`        Safe error information
  `download:cancelled`     Job cancelled
  `conversion:completed`   Conversion completed

Requirements:

-   Authenticate every socket connection.
-   Derive the user room from the authenticated session.
-   Never trust a client-supplied user ID for room authorization.
-   Validate event payloads.
-   Persist important state changes in MongoDB.
-   Treat socket events as updates, not the only source of truth.
-   Allow the frontend to retrieve current state after reconnecting.

------------------------------------------------------------------------

## 16. Security Requirements

### 16.1 URL and network safety

URL processing is a high-risk feature and must include:

-   HTTP and HTTPS protocol allowlisting.
-   Domain and source allowlisting where applicable.
-   Blocking loopback, private, link-local, and reserved IP ranges.
-   DNS resolution validation.
-   Redirect destination revalidation.
-   DNS rebinding protections.
-   Cloud metadata endpoint blocking.
-   Port restrictions.
-   Connection, response, and total-job timeouts.
-   Response size and bandwidth limits.
-   Restricted outbound network access for workers.

### 16.2 File and process safety

-   Generate storage object keys on the server.
-   Do not trust supplied filenames or extensions.
-   Validate media content and MIME information.
-   Prevent path traversal.
-   Keep temporary files in isolated directories.
-   Run FFmpeg with restricted permissions and resource limits.
-   Avoid shell command construction from untrusted input.
-   Apply file retention and cleanup policies.
-   Use private object storage and authorized retrieval.

### 16.3 Account and application safety

-   Secure password hashing.
-   HTTP-only, Secure, SameSite cookies where cookie sessions are used.
-   CSRF protection where required.
-   Rate limits on authentication and inspection endpoints.
-   Role-based authorization.
-   Per-resource ownership checks.
-   Audit administrator actions.
-   Secret management.
-   Dependency and container vulnerability scanning.
-   Structured logging with sensitive-data redaction.

### 16.4 Content and platform compliance

-   Require users to confirm they have permission to download or process
    submitted content.
-   Respect platform terms and API policies.
-   Do not bypass DRM, private-account restrictions, paywalls, or access
    controls.
-   Provide a reporting process for rights holders and abuse complaints.
-   Disable integrations when permission is unavailable or withdrawn.
-   Establish a takedown and data-retention policy before public launch.

------------------------------------------------------------------------

## 17. External Dependencies and Integrations

  Dependency             Purpose                       Requirement
  ---------------------- ----------------------------- -------------
  MongoDB                Persistent application data   Required
  Redis                  Queue coordination            Required
  BullMQ                 Background jobs               Required
  Socket.IO              Real-time progress            P1
  FFmpeg                 Media processing              P1
  FFprobe                Media inspection              P1
  Object storage         Production media storage      P1
  Email provider         Verification and recovery     P1
  OAuth provider         Optional social login         P2
  Payment provider       Subscription billing          P2
  Sentry or equivalent   Error monitoring              P1

All third-party integrations must be configured through environment
variables or a secrets manager. Provider credentials must never be
exposed to the frontend.

------------------------------------------------------------------------

## 18. Testing and Quality Assurance

### 18.1 Unit tests

Test:

-   URL validation.
-   Source adapter selection.
-   Permission checks.
-   Job state transitions.
-   Quota calculations.
-   Format validation.
-   File metadata handling.

### 18.2 Integration tests

Test:

-   Authentication with MongoDB.
-   Download job creation.
-   Redis queue submission.
-   Worker processing.
-   Job persistence.
-   File storage and retrieval.
-   Socket authorization.
-   Cancellation and retry behavior.

### 18.3 End-to-end tests

Test complete workflows:

1.  Register and log in.
2.  Inspect an authorized direct media URL.
3.  Select an available format.
4.  Create a download job.
5.  Observe progress.
6.  Retrieve the completed file.
7.  Find it in the media library.
8.  Delete it.
9.  Attempt unauthorized access to another user's job or file.

### 18.4 Failure and security tests

-   Invalid URL.
-   Unsupported protocol.
-   Redirect to private IP.
-   DNS rebinding scenario.
-   Oversized response.
-   Corrupt media.
-   Worker crash.
-   Redis outage.
-   Database outage.
-   Duplicate job submission.
-   Storage outage.
-   Unauthorized resource access.
-   Malicious filename.
-   Excessive concurrent requests.

------------------------------------------------------------------------

## 19. Analytics and Monitoring

### 19.1 Product analytics

Collect only necessary, privacy-respecting aggregate events:

-   Account created.
-   Inspection attempted.
-   Inspection succeeded or failed.
-   Job created.
-   Job completed or failed.
-   File retrieved.
-   File deleted.
-   Collection created.

Do not log full private URLs, authentication tokens, or media contents
unnecessarily.

### 19.2 Operational monitoring

Monitor:

-   API availability and latency.
-   Database connectivity.
-   Redis connectivity.
-   Queue depth.
-   Oldest waiting job.
-   Active worker count.
-   Worker crash rate.
-   Job completion and failure rates.
-   Storage capacity.
-   Disk usage.
-   CPU and memory utilization.
-   Error rate.

Configure alerts for queue backlogs, repeated worker failures, storage
pressure, and service outages.

------------------------------------------------------------------------

## 20. Delivery Roadmap

  -----------------------------------------------------------------------
  Phase                   Deliverables            Exit criteria
  ----------------------- ----------------------- -----------------------
  1\. Foundation          Repositories,           Services run locally
                          TypeScript, frontend,   and communicate
                          API, MongoDB, Redis,    
                          Docker                  

  2\. Authentication      Registration, login,    Protected endpoints and
                          sessions, authorization ownership tests pass

  3\. Inspection          URL validation, direct  Supported URLs inspect
                          URL adapter, metadata   safely

  4\. Download MVP        Job model, queue,       An authorized direct
                          worker, file storage    media job completes

  5\. Real-time           Socket.IO and progress  Users see progress and
                          UI                      recover state after
                                                  refresh

  6\. Media processing    FFmpeg, FFprobe,        Supported conversion
                          conversion queue        workflows pass

  7\. Library             Files, search,          Users manage their own
                          collections, history    media

  8\. Platform            Individual permitted    Each integration passes
  integrations            source adapters         compliance and
                                                  technical review

  9\. Admin and SaaS      Admin dashboard,        Administrative and
                          quotas, subscriptions   billing workflows pass

  10\. Production         Security, performance,  Release checklist and
                          backups, deployment     acceptance tests pass
  -----------------------------------------------------------------------

### 20.1 MVP release definition

The MVP is complete when:

-   A user can register and authenticate.
-   A user can submit an authorized direct media URL.
-   The backend safely inspects the URL.
-   Available media information is displayed.
-   A user can select a supported format.
-   A download job is processed by a background worker.
-   Progress and final status are visible.
-   Completed files are stored outside MongoDB.
-   Users can view and retrieve their own files.
-   Users cannot access another user's jobs or files.
-   Errors are handled safely.
-   Basic automated tests pass.

------------------------------------------------------------------------

## 21. Risks and Mitigation

  -----------------------------------------------------------------------
  Risk                    Impact                  Mitigation
  ----------------------- ----------------------- -----------------------
  Platform API            Some source             Treat integrations as
  restrictions            integrations may be     conditional
                          unavailable             capabilities

  Copyright or terms      Legal and operational   Permission-first
  violations              risk                    product policy and
                                                  reporting

  SSRF through submitted  Internal network        Strict URL and network
  URLs                    compromise              controls

  Large media files       High storage and        Quotas, streaming,
                          bandwidth costs         lifecycle policies

  Worker crashes          Incomplete jobs         Persistent queues,
                                                  retries, reconciliation

  Redis outage            Processing delays       Monitoring, recovery
                                                  procedures, durable job
                                                  records

  Malicious media         Worker compromise or    Sandboxing and resource
                          resource exhaustion     limits

  High concurrency        Slow service            Separate workers and
                                                  configurable limits

  Unauthorized file       Privacy breach          Ownership checks and
  access                                          private storage

  Unexpected operating    Unsustainable service   Usage quotas,
  costs                                           monitoring, and cost
                                                  controls
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 22. Open Product Decisions

These decisions should be finalized before the relevant implementation
phases:

1.  Will guest users be allowed to inspect URLs, or must every user sign
    in?
2.  What default storage quota should the free plan have?
3.  Which maximum file size should the MVP support?
4.  Should the MVP store files locally or use object storage from the
    beginning?
5.  Which countries and jurisdictions will the service initially serve?
6.  Which email provider will be used?
7.  Which payment provider is available and suitable for the target
    market?
8.  What retention period should apply to completed files and failed
    jobs?
9.  Which permitted source APIs are available for each requested
    platform?
10. Will the initial release be public beta or private testing?

Unresolved decisions must be documented rather than silently assumed.

------------------------------------------------------------------------

## 23. Definition of Done

A feature is complete only when:

-   Its requirements are documented.
-   Input validation is implemented.
-   Authorization and ownership checks are implemented.
-   Loading, empty, success, and error states are handled.
-   Unit and relevant integration tests pass.
-   Security implications are reviewed.
-   Logs and monitoring are sufficient.
-   API documentation is updated.
-   The feature is reviewed and merged.
-   Deployment and rollback considerations are documented.

A release is production-ready only after the MVP acceptance criteria,
security review, backup and recovery procedures, monitoring, and
operational runbooks are complete.

------------------------------------------------------------------------

## 24. Recommended Initial Backlog

The first engineering tasks should be:

1.  Create the Git repository.
2.  Initialize the React + TypeScript + Vite client.
3.  Initialize the Express + TypeScript server.
4.  Configure MongoDB and Mongoose.
5.  Configure Redis and BullMQ.
6.  Create shared TypeScript types.
7.  Implement health-check endpoints.
8.  Build the application shell and navigation.
9.  Implement registration and login.
10. Create the URL validation service.
11. Implement the direct media source adapter.
12. Create the DownloadJob model.
13. Implement the first background worker.
14. Store a completed media file safely.
15. Display job status and the resulting file in the frontend.

Do not begin with subscriptions, all platform integrations, or a large
admin dashboard. First prove that the core authorized download workflow
is secure and reliable.

------------------------------------------------------------------------

## 25. Reference Documentation

-   React: https://react.dev/
-   TypeScript: https://www.typescriptlang.org/docs/
-   Express: https://expressjs.com/
-   MongoDB: https://www.mongodb.com/docs/
-   Mongoose: https://mongoosejs.com/docs/
-   Redis: https://redis.io/docs/
-   BullMQ: https://docs.bullmq.io/
-   Socket.IO: https://socket.io/docs/v4/
-   FFmpeg: https://ffmpeg.org/documentation.html
-   OWASP Top 10: https://owasp.org/www-project-top-ten/
-   OWASP Server-Side Request Forgery Prevention:
    https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html

------------------------------------------------------------------------

## Document Control

  Field          Value
  -------------- ----------------------------------
  Document       Product Requirements Document
  Product        VideoDownloader
  Version        1.0
  Status         Draft
  Platform       Web
  Architecture   MERN with background workers
  Prepared for   Product and engineering planning
  Last updated   2026-11-24

**End of document.**
