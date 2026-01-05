# Data Room MVP

A single-page application for managing virtual Data Rooms with folders and PDF files.

## Features

### Core Requirements

- **Datarooms**: Create, rename, delete datarooms
- **Folders**: Create nested folders, rename, delete (with cascade deletion)
- **Files**: Upload PDF files, rename, delete, preview
- **View Modes**: Grid and list views with toggle
- **Drag & Drop**: Move folders and files between folders
- **Search**: Search by file/folder name

### Additional Features

- **Firebase Authentication**: Email/password and Google OAuth
- **Firestore Integration**: Real-time data synchronization per user
- **IndexedDB**: Local PDF file storage in browser
- **Persistent UI State**: View mode and folder expanded state saved
- **Loading Indicators**: Global loading state for async operations
- **Error Handling**: Comprehensive error handling with user feedback

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Firebase (Auth + Firestore)
- IndexedDB (idb)
- Zustand (state management)
- Sonner (toasts)

## Quick Start

### Local Development

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` file:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

3. Start dev server:

```bash
npm run dev
```

### Docker

Docker setup includes Firebase environment variables pre-configured:

```bash
# Build and start
npm run docker:build
npm run docker:up

# Or directly
docker-compose up -d

# Access at http://localhost:3000

# Stop
npm run docker:down
# Or
docker-compose down
```

## Project Structure

```
src/
├── components/     # UI components
├── features/       # Feature modules (auth, search, view-mode)
├── shared/         # Shared utilities and UI
├── store/          # Zustand stores
├── types/          # TypeScript types
└── App.tsx         # Main application component
```

## Notes

- PDF files are stored locally in IndexedDB (browser storage)
- User data is synchronized with Firestore in real-time
- Each user has isolated data access
- View mode and folder expanded state persist across sessions
