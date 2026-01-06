# Contributing to Game Insights

Thank you for your interest in contributing to Game Insights! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended package manager)
- Git

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/game-insights.git
cd game-insights

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Running Tests

```bash
# Unit tests
pnpm test

# With coverage
pnpm test:coverage

# E2E tests (Playwright)
pnpm test:e2e
```

---

## How to Contribute

### Reporting Bugs

Before creating a bug report, please check existing issues to avoid duplicates.

**Include in your report:**
- Clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Browser/environment details
- Screenshots if applicable

### Suggesting Features

We love new ideas! Please open an issue with:
- Clear description of the feature
- Use case / problem it solves
- Potential implementation approach (optional)

### Code Contributions

1. **Fork** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following our code style
4. **Test** your changes thoroughly
5. **Commit** with clear messages
6. **Push** and create a Pull Request

---

## Code Style

### General Guidelines

- Use TypeScript for all new code
- Follow existing patterns in the codebase
- Keep components small and focused
- Write self-documenting code; add comments only when necessary

### File Organization

```
src/
├── adapters/     # Data source implementations
├── ai/           # AI/ML pipeline components
├── components/   # Reusable UI components
├── context/      # React context providers
├── hooks/        # Custom React hooks
├── lib/          # Utilities and helpers
├── pages/        # Page-level components
├── plugins/      # Plugin system
└── types/        # TypeScript type definitions
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `DataUploader.tsx` |
| Hooks | camelCase with `use` prefix | `useGameData.ts` |
| Utilities | camelCase | `formatMetric.ts` |
| Types | PascalCase | `GameType`, `ChartConfig` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |

### Import Order

```typescript
// 1. React and external libraries
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal modules (using @ alias)
import { DataContext } from '@/context/DataContext';
import { formatNumber } from '@/lib/utils';

// 3. Types
import type { GameData } from '@/types';

// 4. Styles (if any)
import './styles.css';
```

---

## Areas for Contribution

### Data Adapters

Add support for new data sources:

```typescript
// src/adapters/YourAdapter.ts
import { BaseAdapter } from './BaseAdapter';

export class YourAdapter extends BaseAdapter {
  name = 'Your Source';
  type = 'database' as const;

  async connect(config: AdapterConfig): Promise<void> {
    // Connection logic
  }

  async fetchSchema(): Promise<SchemaInfo> {
    // Return column information
  }

  async fetchData(query?: DataQuery): Promise<NormalizedData> {
    // Fetch and normalize data
  }
}
```

### AI Pipeline

Improve game detection or add new semantic types:

- **Schema Analyzer** (`src/ai/SchemaAnalyzer.ts`): Add column type detection
- **Game Type Detector** (`src/ai/GameTypeDetector.ts`): Improve classification
- **ML Models** (`src/ai/ml/`): Add new prediction models

### Visualizations

Add new chart types or dashboard layouts:

1. Register chart in `src/lib/chartRegistry.ts`
2. Create chart component in `src/components/charts/`
3. Add to relevant dashboard pages

### Documentation

- Improve inline code documentation
- Add tutorials and examples
- Translate documentation to other languages

---

## Pull Request Process

### Before Submitting

- [ ] Code follows the project style guide
- [ ] Tests pass locally (`pnpm test`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Documentation updated if needed

### PR Guidelines

- **Title**: Clear, concise description of changes
- **Description**: Explain what and why
- **Link issues**: Reference related issues with `#123`
- **Screenshots**: Include for UI changes
- **Breaking changes**: Clearly document any breaking changes

### Review Process

1. A maintainer will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged

---

## Commit Messages

Follow conventional commits:

```
feat: Add Google Sheets adapter
fix: Resolve chart rendering on mobile
docs: Update installation instructions
refactor: Simplify data normalizer
test: Add tests for retention predictor
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, etc.)
- `refactor`: Code change that doesn't fix/add
- `test`: Tests only
- `chore`: Build process, tooling

---

## Development Tips

### Path Aliases

Use `@/` for imports from `src/`:

```typescript
// Good
import { DataContext } from '@/context/DataContext';

// Avoid
import { DataContext } from '../../../context/DataContext';
```

### Tailwind Custom Theme

Custom colors are defined in `tailwind.config.js`:

```
bg-darkest, bg-dark, bg-card, bg-elevated    # Backgrounds
accent-primary, accent-secondary             # Accent colors
chart-purple, chart-indigo, chart-pink, etc. # Chart colors
```

### State Management

- Use Zustand for global state
- Use React Query for server state
- Use local state for component-specific state

---

## Questions?

- Open a [GitHub Discussion](https://github.com/yourusername/game-insights/discussions)
- Check existing issues and discussions

---

Thank you for contributing to Game Insights!
