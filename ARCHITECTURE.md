# Data Room Architecture Documentation

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────┐
│                    App.tsx (State)                  │
│  ┌──────────────────────────────────────────────┐  │
│  │              AppState                        │  │
│  │  - datarooms: Record<string, Dataroom>      │  │
│  │  - folders: Record<string, Folder>          │  │
│  │  - files: Record<string, FileItem>          │  │
│  │  - activeDataroomId: string | null          │  │
│  │  - activeFolderId: string | null            │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
├─────────────────────────────────────────────────────┤
│  ┌───────────┐  ┌────────────┐  ┌──────────────┐  │
│  │  Header   │  │  Dataroom  │  │  Folder      │  │
│  │  Panel    │  │  Panel     │  │  Panel       │  │
│  └───────────┘  └────────────┘  └──────────────┘  │
│                                                     │
│              ┌──────────────────────┐              │
│              │  Documents Panel     │              │
│              │  ┌────────────────┐  │              │
│              │  │  FolderTree    │  │              │
│              │  │  ItemRow x N   │  │              │
│              │  │ FilePreview    │  │              │
│              │  └────────────────┘  │              │
│              └──────────────────────┘              │
│                                                     │
├─────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────┐  │
│  │         Dialog Layer (Modal)                 │  │
│  │  ├─ NameDialog (Create/Rename)              │  │
│  │  ├─ ConfirmDialog (Delete)                  │  │
│  │  └─ (based on DialogShell)                  │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Component Hierarchy

### Presentational Components (No State)

These components are pure and receive all data via props:

```
Header
  └─ Props: onCreateDataroom, onLoadDemo

DataroomPanel
  ├─ Props: datarooms[], activeDataroomId, appState, handlers
  └─ Uses: EditIcon, TrashIcon, PlusIcon

FolderPanel
  └─ FolderTree
      └─ renderFolder() → (many recursive renders)

DocumentsPanel (Large, complex component)
  ├─ ItemRow (for each folder)
  ├─ ItemRow (for each file)
  └─ FilePreview (in sidebar)

EmptyDataroom
  └─ Props: onCreateDataroom, onLoadDemo

Notice
  └─ Props: notice { type, message }
```

### Dialog Components

```
DialogShell (Base wrapper)
  ├─ NameDialog (extends with form)
  └─ ConfirmDialog (extends with buttons)
```

## Type System

### Core Types

```typescript
// Dataroom: Top-level workspace
type Dataroom = {
  id: string;                    // UUID
  name: string;                  // Display name
  rootFolderId: string;          // Links to root folder
  createdAt: number;             // Timestamp
};

// Folder: File container (can nest)
type Folder = {
  id: string;                    // UUID
  name: string;                  // Display name
  parentId: string | null;       // null = root folder
  dataroomId: string;            // Link to parent dataroom
  childFolderIds: string[];      // Direct children
  fileIds: string[];             // Direct files
  createdAt: number;             // Timestamp
};

// FileItem: PDF file
type FileItem = {
  id: string;                    // UUID
  name: string;                  // filename.pdf
  parentFolderId: string;        // Container folder
  dataroomId: string;            // Link to dataroom
  size: number;                  // Bytes
  createdAt: number;             // Timestamp
  blobUrl?: string;              // Object URL (upload only)
  source: "upload" | "demo";     // Origin
};

// AppState: Single source of truth
type AppState = {
  datarooms: Record<string, Dataroom>;
  folders: Record<string, Folder>;
  files: Record<string, FileItem>;
  activeDataroomId: string | null;
  activeFolderId: string | null;
};

// Dialog state union
type DialogState = 
  | { type: "create-dataroom"; error?: string }
  | { type: "rename-dataroom"; id: string; currentName: string; error?: string }
  | { type: "create-folder"; parentId: string; error?: string }
  | // ... more states
```

## State Management Patterns

### Immutable Updates

All state updates follow immutable patterns to ensure React re-renders properly:

```typescript
// ❌ Wrong: Direct mutation
state.folders[id].name = "New Name";

// ✅ Correct: Create new objects
setData(prev => ({
  ...prev,
  folders: {
    ...prev.folders,
    [id]: { ...prev.folders[id], name: "New Name" }
  }
}));
```

### Computed Values with useMemo

Expensive computations are memoized:

```typescript
// Folder path (breadcrumb)
const folderPath = useMemo(() => {
  if (!activeFolder) return [];
  const path = [];
  let current = activeFolder;
  while (current) {
    path.unshift(current);
    if (!current.parentId) break;
    current = data.folders[current.parentId];
  }
  return path;
}, [activeFolder, data.folders]);

// Sorted folders
const sortedFolders = useMemo(() => {
  if (!activeFolder) return [];
  return activeFolder.childFolderIds
    .map(id => data.folders[id])
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
}, [activeFolder, data.folders]);

// Filtered folders
const filteredFolders = useMemo(() => {
  const query = normalizeName(searchQuery).toLowerCase();
  if (!query) return sortedFolders;
  return sortedFolders.filter(folder =>
    folder.name.toLowerCase().includes(query)
  );
}, [sortedFolders, searchQuery]);
```

## Data Flow Examples

### Creating a Dataroom

```
User clicks "Create Data Room"
         ↓
Dialog opens (NameDialog)
         ↓
User enters name, clicks "Create"
         ↓
handleCreateDataroom() called
         ↓
1. Normalize name (trim, collapse spaces)
2. Check for duplicates
3. Auto-append counter if needed
4. Create new Dataroom object
5. Create new root Folder object
6. Update AppState (immutable)
7. Set as active
8. Close dialog
         ↓
Components re-render with new data
```

### Uploading Files

```
User selects PDF files
         ↓
handleUploadFiles() called
         ↓
1. Filter out non-PDF files
2. For each valid PDF:
   - Create FileItem object
   - Generate unique filename
   - Create Object URL (blob)
   - Update parent folder's fileIds
3. Update AppState
4. Set first file as preview
5. Show success notification
         ↓
DocumentsPanel re-renders
FilePreview shows new file
```

### Deleting Folder (with cascade)

```
User clicks delete on folder
         ↓
Confirmation dialog
         ↓
User confirms
         ↓
handleDeleteFolder() called
         ↓
1. Collect all descendant folders
2. Collect all files in tree
3. For each file: revoke blob URL
4. Remove from parent's childFolderIds
5. Remove all descendants from state
6. Reset active folder if needed
7. Update expanded folders set
         ↓
Components re-render (cascade cleanup)
```

## Utility Functions

### String Processing

```typescript
// Remove duplication, normalize whitespace
normalizeName("  hello   world  ") → "hello world"

// Split filename into base and extension
splitFileName("document.pdf") → { base: "document", ext: ".pdf" }

// Make unique in set
makeUniqueName("Report", usedNames) → "Report (1)" or "Report (2)"
```

### Data Traversal

```typescript
// Get folder and all descendants
collectFolderIds(folderId, snapshot): Set<string>
// Used for: delete cascade, export, etc.

// Count nested folders and files
getDescendantStats(folderId, snapshot) → {
  folderCount: number,
  fileCount: number
}

// Get sibling names (for duplicate detection)
getSiblingNames(parentId, snapshot, excludeId?) → Set<string>
```

### Formatting

```typescript
formatBytes(2340000) → "2.3 MB"
formatDate(1234567890) → "Feb 13, 2009"
```

## Performance Considerations

### Memory Usage

- **Blob URLs**: Properly revoked on unmount
- **DOM size**: Limited by visible items (grid layout)
- **State objects**: Keyed by ID (O(1) lookup)

### Render Optimization

- **useMemo**: 3 heavy computations (path, sorted, filtered)
- **Component props**: Only pass needed data
- **Event handlers**: Inline (not extracted to useCallback)

### Potential Issues

⚠️ **Large datasets**: 10,000+ files may slow search
⚠️ **Blob URLs**: Safari/Firefox may have limits (~500 total)
⚠️ **Nested folders**: 50+ levels deep could cause stack overflow

## Error Handling

### Input Validation

```typescript
// All dialog inputs validated:
1. Required fields (non-empty after trim)
2. Duplicate detection (case-insensitive)
3. PDF type validation
4. Name length (implicit, no limit)
```

### Edge Cases Handled

1. **Duplicate names**: Auto-increment counter
2. **Invalid files**: Skip with notification
3. **Root folder deletion**: Show error, prevent
4. **Empty folders**: Allow (cleanup on parent delete)
5. **Rename to existing**: Show error, allow retry
6. **Search with no results**: Show empty state
7. **Delete active folder**: Switch to parent

## CSS Architecture

### Design System

**Colors** (via CSS variables):
```css
--ink: 30 26 22           /* Text */
--muted: 111 102 95       /* Secondary text */
--accent: 22 115 97       /* Interactive */
--accent-2: 208 118 42    /* Secondary action */
--panel: 255 249 240      /* Card background */
--border: 227 218 205     /* Dividers */
--bg: 244 239 230         /* Page background */
```

**Typography**:
- Display: Space Grotesk 44px, 36px, 24px
- Body: IBM Plex Sans 16px, 14px, 12px, 10px

**Spacing**: Tailwind default (4px base unit)

**Shadows**:
- `shadow-soft`: Light elevation
- `shadow-card`: Medium elevation

### Responsive Grid

```css
/* Mobile: 1 column */
grid: auto / 1fr

/* Tablet: 2 columns */
@media (min-width: 1024px) {
  grid: auto / 240px 260px minmax(0, 1fr)
}
```

## Testing Strategy

### Unit Tests (Utilities)

```typescript
test('formatBytes', () => {
  expect(formatBytes(0)).toBe('0 B');
  expect(formatBytes(1024)).toBe('1 KB');
  expect(formatBytes(1024 * 1024)).toBe('1 MB');
});

test('makeUniqueName', () => {
  const used = new Set(['report', 'report (1)']);
  expect(makeUniqueName('Report', used)).toBe('Report (2)');
});
```

### Integration Tests (Workflows)

```typescript
test('Create and rename folder', () => {
  // 1. Render app
  // 2. Click "New Folder"
  // 3. Enter name
  // 4. Verify folder created
  // 5. Click rename
  // 6. Verify update
});
```

### E2E Tests (User Journey)

```typescript
test('Complete dataroom workflow', () => {
  // 1. Create dataroom
  // 2. Create folders
  // 3. Upload files
  // 4. Search files
  // 5. Rename/delete
  // 6. Verify final state
});
```

## Future Refactoring Opportunities

### Code Splitting
- Extract dialog handlers to separate file
- Create constants file for strings
- Move validators to utils

### State Management
- Consider Context API for deeply nested props
- Potential migration to Redux/Zustand
- Add undo/redo capability

### Performance
- Virtual scrolling for 1000+ items
- Service Worker caching
- Pagination for demo data

### Testing
- Add Vitest unit tests
- Add React Testing Library integration tests
- Add Cypress E2E tests

## Security Considerations

### Current Implementation
- ✅ Type-safe (TypeScript strict mode)
- ✅ XSS prevention (React escapes by default)
- ✅ Input validation on all user inputs

### To-Do for Production
- 🔐 Add user authentication
- 🔐 Implement rate limiting
- 🔐 Add CSRF protection
- 🔐 Hash sensitive data
- 🔐 Implement audit logging

## Deployment Checklist

- [ ] Build passes (`npm run build`)
- [ ] Lint passes (`npm run lint`)
- [ ] No console errors/warnings
- [ ] Test demo workflow
- [ ] Test on mobile (iPhone/Android)
- [ ] Test on multiple browsers
- [ ] Set environment variables
- [ ] Configure CSP headers
- [ ] Enable HTTPS
- [ ] Setup monitoring/analytics
