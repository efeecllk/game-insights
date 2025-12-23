# F002 - Data Upload

**Status:** ✅ Completed  
**Priority:** High  
**Effort:** Medium

## Overview
File upload system with AI-powered column mapping.

## Features
- [x] Drag-drop CSV/JSON upload
- [x] AI column mapping with OpenAI
- [x] File parsing and validation
- [x] Preview before import

## Files
- `src/pages/Upload.tsx`
- `src/lib/dataStore.ts`
- `src/context/DataContext.tsx`

## Technical Details
- IndexedDB for data persistence
- OpenAI GPT for intelligent column detection
- Supports files up to 10MB
