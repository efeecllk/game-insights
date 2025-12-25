# Phase 1: Universal Data Import

**Goal:** Accept data from ANY source an indie dev might use - no data engineering skills required.

**Tagline:** "If you can export it, we can analyze it."

---

## The Problem

Indie developers have data scattered everywhere:
- CSV exports from spreadsheets
- JSON logs from custom backends
- Firebase event dumps
- Unity Analytics exports
- SQLite databases from local testing
- Google Sheets with manual tracking
- PlayFab exports
- Custom REST APIs

Each format is different. Column names vary. Date formats are inconsistent. The indie dev shouldn't need to normalize this themselves.

---

## Features

### 1.1 Smart File Upload (Enhanced)
**Status:** Partially Done | **Priority:** Critical

Current: Basic CSV/JSON parsing
Target: Intelligent format detection and auto-normalization

- [ ] **Auto-detect file encoding** (UTF-8, UTF-16, Latin-1, etc.)
- [ ] **Multi-format support:**
  - CSV (any delimiter: comma, tab, semicolon, pipe)
  - JSON (arrays, nested objects, NDJSON/JSON Lines)
  - Excel (.xlsx, .xls)
  - Google Sheets export
  - SQLite databases (.db, .sqlite)
  - Parquet files (for larger datasets)
- [ ] **Smart delimiter detection** - no config needed
- [ ] **Header row detection** - find it automatically
- [ ] **Multi-sheet support** for Excel files
- [ ] **Compressed file support** (.zip, .gz containing data files)
- [ ] **Large file handling** - stream processing for 100MB+ files
- [ ] **Progress indicator** with estimated time remaining

### 1.2 Drag & Drop Folder Upload
**Status:** New | **Priority:** High

- [ ] Upload entire folder of files
- [ ] Auto-merge files with same schema
- [ ] Date-based file organization (daily exports)
- [ ] Incremental data append (new data only)

### 1.3 Copy-Paste Import
**Status:** New | **Priority:** Medium

- [ ] Paste data directly from spreadsheets
- [ ] Paste JSON from console/logs
- [ ] Auto-detect structure from pasted content
- [ ] Quick preview before import

### 1.4 URL Import
**Status:** New | **Priority:** Medium

- [ ] Import from public URL (CSV, JSON)
- [ ] Google Sheets public link support
- [ ] Dropbox/Google Drive shared links
- [ ] One-time fetch or scheduled refresh

### 1.5 Game Engine Export Templates
**Status:** New | **Priority:** High

Pre-built parsers for common game engine export formats:

- [ ] **Unity Analytics** - Standard event export format
- [ ] **Unity Cloud Save** - Player data exports
- [ ] **Godot** - Custom analytics exports
- [ ] **Unreal Engine** - Analytics plugin exports
- [ ] **GameMaker** - Analytics exports
- [ ] **Construct 3** - Event logs

Each template includes:
- Expected column mappings
- Common event types
- Automatic game type detection
- Suggested first dashboard

### 1.6 Column Mapping Wizard (Enhanced)
**Status:** Partially Done | **Priority:** Critical

Current: AI-powered but requires review
Target: Zero-config for common patterns

- [ ] **Instant recognition** of standard column names
- [ ] **Fuzzy matching** for variations (user_id, userId, player_id, playerId)
- [ ] **Learn from corrections** - remember user mappings
- [ ] **Mapping templates** - save and reuse for similar files
- [ ] **Bulk column actions** - ignore multiple columns at once
- [ ] **Column preview** with sample values inline

### 1.7 Data Preview & Validation
**Status:** New | **Priority:** High

- [ ] **Interactive data preview** (first 100 rows)
- [ ] **Per-column statistics:**
  - Unique values count
  - Null percentage
  - Value distribution histogram
  - Detected data type
- [ ] **Data quality score** before import
- [ ] **Issue highlighting** (nulls, outliers, format issues)
- [ ] **Quick fixes** - fix issues before import

---

## Technical Implementation

### File Processing Pipeline
```
File Input → Encoding Detection → Format Detection →
Schema Extraction → AI Column Mapping → Validation →
Normalization → Storage
```

### New Dependencies
```json
{
  "xlsx": "^0.18.5",       // Excel parsing
  "papaparse": "^5.4.1",   // Robust CSV parsing
  "sql.js": "^1.9.0",      // SQLite in browser
  "pako": "^2.1.0",        // Compression
  "chardet": "^2.0.0"      // Encoding detection
}
```

### New Files
```
src/lib/
├── importers/
│   ├── index.ts           # Unified import interface
│   ├── csvImporter.ts     # Enhanced CSV with delimiter detection
│   ├── jsonImporter.ts    # JSON/NDJSON support
│   ├── excelImporter.ts   # Excel parsing
│   ├── sqliteImporter.ts  # SQLite database import
│   ├── urlImporter.ts     # Fetch from URL
│   └── clipboardImporter.ts # Paste support
├── templates/
│   ├── index.ts           # Template registry
│   ├── unityAnalytics.ts  # Unity format
│   ├── firebaseExport.ts  # Firebase format
│   └── customBackend.ts   # Common custom patterns
└── validation/
    ├── schemaValidator.ts  # Pre-import validation
    └── dataQuality.ts      # Quality scoring
```

---

## User Experience Flow

### Happy Path (90% of users)
1. Drag file onto page
2. See instant preview with detected columns
3. Green checkmarks on recognized columns
4. Click "Import" → Dashboard ready in seconds

### Edge Cases
1. Unknown columns → AI suggests meanings, user confirms
2. Bad data quality → Show issues, offer auto-fix
3. Wrong format → Suggest correct format, provide converter
4. Too large → Stream process, show progress

---

## Success Metrics

- **< 10 seconds** from file drop to dashboard for standard files
- **> 90%** column auto-detection accuracy
- **Zero config** for files from major game engines
- **< 3 clicks** to import any supported format

---

## Dependencies on Other Phases

- None - Phase 1 is foundational

## Enables

- Phase 2: Zero-Config Analytics (needs clean data)
- Phase 3: One-Click Integrations (uses same normalization)

---

## Estimated Effort

| Component | Effort | Priority |
|-----------|--------|----------|
| Excel support | Medium | High |
| SQLite import | Medium | Medium |
| URL import | Small | Medium |
| Clipboard paste | Small | Low |
| Engine templates | Large | High |
| Enhanced wizard | Medium | Critical |
| Folder upload | Medium | Medium |

**Total:** ~4-6 weeks of focused development
