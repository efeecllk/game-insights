# Testing Guide

This document describes the testing infrastructure and practices for Game Insights.

## Quick Start

```bash
# Run all unit tests
npm run test:run

# Run tests in watch mode
npm run test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run Storybook
npm run storybook

# Run Lighthouse CI
npm run lighthouse
```

## Test Structure

```
tests/
├── unit/                    # Unit tests
│   ├── ai/                  # AI module tests
│   │   ├── SchemaAnalyzer.test.ts
│   │   ├── GameTypeDetector.test.ts
│   │   ├── ChartSelector.test.ts
│   │   ├── DataCleaner.test.ts
│   │   └── MonetizationAnalyzer.test.ts
│   ├── lib/                 # Library/store tests
│   │   ├── gameStore.test.ts
│   │   ├── funnelStore.test.ts
│   │   ├── experimentStore.test.ts
│   │   └── exportUtils.test.ts
│   └── components/          # React component tests
│       ├── KPICard.test.tsx
│       └── LoadingState.test.tsx
├── integration/             # Integration tests
│   └── dataset-analysis.test.ts
├── e2e/                     # End-to-end tests
│   ├── app.spec.ts          # Navigation & core flows
│   ├── upload.spec.ts       # File upload flows
│   ├── error-handling.spec.ts
│   └── accessibility.spec.ts
└── fixtures/                # Test data
    └── datasets/
        ├── puzzle_game_events.json
        ├── idle_game_events.json
        ├── battle_royale_events.json
        ├── gacha_rpg_events.json
        └── hypercasual_events.json
```

## Testing Types

### 1. Unit Tests (Vitest)

Fast, isolated tests for individual modules.

```bash
npm run test:unit
```

**Example: Testing an AI module**

```typescript
import { describe, it, expect } from 'vitest';
import { SchemaAnalyzer } from '@/ai/SchemaAnalyzer';

describe('SchemaAnalyzer', () => {
  const analyzer = new SchemaAnalyzer();

  it('should detect user_id columns', () => {
    const result = analyzer.analyzeColumn('user_id', ['u1', 'u2', 'u3']);
    expect(result.semanticType).toBe('user_id');
    expect(result.confidence).toBeGreaterThan(0.8);
  });
});
```

**Example: Testing a React component**

```typescript
import { render, screen } from '@testing-library/react';
import { KPICard } from '@/components/ui/KPICard';
import { Users } from 'lucide-react';

describe('KPICard', () => {
  it('renders value and label', () => {
    render(
      <KPICard
        icon={Users}
        label="Daily Active Users"
        value="12,847"
        changeType="up"
      />
    );

    expect(screen.getByText('Daily Active Users')).toBeInTheDocument();
    expect(screen.getByText('12,847')).toBeInTheDocument();
  });
});
```

### 2. Integration Tests

Test multiple modules working together.

```typescript
import { describe, it, expect } from 'vitest';
import { SchemaAnalyzer } from '@/ai/SchemaAnalyzer';
import { GameTypeDetector } from '@/ai/GameTypeDetector';

describe('Dataset Analysis Pipeline', () => {
  it('should detect puzzle game from data', () => {
    const data = [
      { user_id: 'u1', level: 15, moves: 25, boosters: 2 },
      { user_id: 'u2', level: 16, moves: 30, boosters: 0 },
    ];

    const analyzer = new SchemaAnalyzer();
    const detector = new GameTypeDetector();

    const schema = analyzer.analyze(data);
    const gameType = detector.detect(schema, data);

    expect(gameType.category).toBe('puzzle');
    expect(gameType.confidence).toBeGreaterThan(0.7);
  });
});
```

### 3. E2E Tests (Playwright)

Full browser tests for critical user journeys.

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/upload.spec.ts

# Run with UI mode
npx playwright test --ui

# Debug a test
npx playwright test --debug
```

**Example: Testing file upload**

```typescript
import { test, expect } from '@playwright/test';

test('should upload CSV and show preview', async ({ page }) => {
  await page.goto('/upload');

  const csvContent = `user_id,event,timestamp
user_001,purchase,2024-01-01`;

  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.click('text=Drop files here');
  const fileChooser = await fileChooserPromise;

  await fileChooser.setFiles({
    name: 'data.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csvContent),
  });

  await expect(page.locator('text=/preview|data/i')).toBeVisible();
});
```

### 4. Accessibility Tests

Automated accessibility testing with axe-core.

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('page should be accessible', async ({ page }) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(results.violations).toHaveLength(0);
});
```

### 5. Visual Regression (Storybook)

Component documentation and visual testing.

```bash
# Start Storybook
npm run storybook

# Build static Storybook
npm run build-storybook
```

**Example: Creating a story**

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { KPICard } from './KPICard';
import { Users } from 'lucide-react';

const meta: Meta<typeof KPICard> = {
  title: 'UI/KPICard',
  component: KPICard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof KPICard>;

export const Default: Story = {
  args: {
    icon: Users,
    label: 'Daily Active Users',
    value: '12,847',
    change: 12.5,
    changeType: 'up',
  },
};
```

### 6. Performance Tests (Lighthouse CI)

Automated performance audits.

```bash
# Run Lighthouse locally
npm run lighthouse

# Build first, then preview
npm run build && npm run preview
```

## CI/CD Pipelines

### Main CI Workflow (.github/workflows/ci.yml)

Runs on every push/PR:
- Lint
- Type check
- Unit tests with coverage
- Build
- E2E tests (on main branch)

### Security Workflow (.github/workflows/security.yml)

- npm audit for vulnerabilities
- CodeQL analysis
- Secret scanning with Gitleaks
- License compliance check

### Performance Workflow (.github/workflows/performance.yml)

- Lighthouse CI audits
- Bundle size analysis
- Performance budget checks

### Storybook Workflow (.github/workflows/storybook.yml)

- Build Storybook
- Accessibility testing
- (Optional) Chromatic visual regression

## Writing Good Tests

### Do's

✅ **Test behavior, not implementation**
```typescript
// Good - tests what component does
expect(screen.getByText('12,847')).toBeInTheDocument();

// Bad - tests implementation details
expect(component.state.value).toBe('12,847');
```

✅ **Use descriptive test names**
```typescript
// Good
it('should show positive change with green indicator')

// Bad
it('test change')
```

✅ **Keep tests independent**
```typescript
// Good - each test sets up its own state
beforeEach(() => {
  cleanup();
});

// Bad - tests depend on each other
```

✅ **Use test fixtures**
```typescript
import puzzleData from '../fixtures/datasets/puzzle_game_events.json';
```

### Don'ts

❌ Don't test external libraries
❌ Don't use sleep/delays (use waitFor)
❌ Don't test private methods
❌ Don't skip tests in main branch

## Coverage Goals

| Metric | Target | Current |
|--------|--------|---------|
| Statements | 80% | Check with `npm run test:coverage` |
| Branches | 75% | |
| Functions | 80% | |
| Lines | 80% | |

## Debugging Tests

### Vitest

```bash
# Run specific test file
npx vitest run path/to/test.ts

# Run with verbose output
npx vitest run --reporter=verbose

# Run matching pattern
npx vitest run -t "should detect"
```

### Playwright

```bash
# Debug mode
npx playwright test --debug

# Show browser
npx playwright test --headed

# Generate test code
npx playwright codegen localhost:5173
```

## Mock Strategies

### Mocking IndexedDB

```typescript
// tests/setup.ts
import 'fake-indexeddb/auto';
```

### Mocking API calls (MSW)

```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/data', (req, res, ctx) => {
    return res(ctx.json({ data: [] }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Common Issues

### "Cannot find module" errors

Ensure path aliases are configured in `vitest.config.ts`:

```typescript
resolve: {
  alias: {
    '@': resolve(__dirname, './src'),
  },
},
```

### E2E tests timing out

Increase timeout in specific tests:

```typescript
test('slow operation', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ...
});
```

### Flaky tests

Use proper wait conditions:

```typescript
// Good
await page.waitForSelector('.loaded');
await expect(element).toBeVisible();

// Bad
await page.waitForTimeout(1000);
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Storybook](https://storybook.js.org/)
- [axe-core](https://www.deque.com/axe/)
