# SheetSync

## Overview

SheetSync is a lightweight, real-time collaborative spreadsheet
application. Built as a single-page application utilizing modern React
paradigms, it provides a persistent, synchronized workspace for
concurrent users. The system is designed to handle multi-user input
efficiently while maintaining strict client-server data boundaries.

## Core Capabilities

-   **Real-Time Synchronization:** Sub-second state distribution across
    concurrent active sessions.
-   **Formula Parsing Engine:** Support for mathematical evaluations and
    cross-cell referencing (e.g., `=SUM(A1:A5)` or `=A1+B2`).
-   **Collaborative Presence:** Visual indicators of active participants
    and their current cursor locations within the grid.
-   **Document Management:** Authenticated dashboard for creating,
    retrieving, and destroying isolated spreadsheet environments.
-   **Data Export:** Built-in serialization to CSV and native XLSX
    formats.
-   **Grid Manipulation:** Dynamic column and row resizing via drag
    interfaces.
-   **Cell Formatting:** Granular control over typography, alignment,
    borders, and conditional data representation (currency, percentages,
    etc.).

## Technology Stack

-   **Framework:** Next.js 15 (App Router)
-   **View Layer:** React 19
-   **Language:** TypeScript (Strict Mode)
-   **Styling:** Tailwind CSS (configured with dynamic HSL variables for
    system-aware themes)
-   **Database & Auth:** Firebase (Firestore & Firebase Authentication)
-   **Data Processing:** SheetJS (for XLSX export operations)

## Architectural Decisions & Trade-offs

### State Management & Contention Handling

State is separated into **local ephemeral state** and **persistent
remote state**. The grid utilizes a **cell-level granularity approach**
to database writes rather than document-level replacements.

To mitigate race conditions and write-contention during concurrent
editing, the system employs **debounced synchronization**. Cell content
updates and grid resizes update the local UI optimistically and are
queued via a standard debounce interval.

This approach: - Reduces Firebase write operations - Ensures UI
responsiveness - Resolves basic contention through a **Last-Write-Wins
(LWW)** strategy at the individual cell property level

### Formula Parser Implementation

The custom formula evaluation engine parses basic arithmetic operators
and specific mathematical functions.

The parser utilizes an **iterative evaluation loop with a maximum depth
threshold** rather than a single-pass execution or complex Abstract
Syntax Tree (AST) compilation.

This design: - Prioritizes client-side performance - Prevents infinite
loops caused by circular dependencies (e.g., `A1 → B1 → A1`) - Handles
chained dependencies where multiple cells rely on each other to
stabilize

### Presence Architecture

Real-time presence is handled via a **persistent heartbeat mechanism**.
Clients broadcast their active cell coordinate and connection status at
standard intervals.

Disconnections or tab closures are handled via a **timeout layer** that
purges stale user cursors from the active document pool, avoiding the
necessity of a dedicated WebSocket server.

## Local Development Setup

### Prerequisites

-   Node.js (v18 or higher recommended)
-   NPM or Yarn package manager
-   A Firebase Project configured with **Firestore** and
    **Authentication (Google Provider)**

### Installation

#### 1. Clone the repository

``` bash
git clone <repository-url>
cd sheet-sync
```

#### 2. Install dependencies

``` bash
npm install
```

### Environment Configuration

Create a `.env.local` file in the project root directory and populate it
with your Firebase project credentials.

Example:

``` env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Initialize the development server

``` bash
npm run dev
```

The application will be accessible at:

    http://localhost:3000

## Available Scripts

-   **npm run dev** --- Initializes the Next.js development server with
    Turbopack.
-   **npm run build** --- Compiles the application for production
    deployment.
-   **npm start** --- Serves the compiled production build.
-   **npm run lint** --- Executes ESLint for static code analysis.
-   **npm run type-check** --- Runs the TypeScript compiler to identify
    type discrepancies without emitting compiled files.
