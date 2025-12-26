# Phase 7: Testing & Quality Assurance

**Goal:** Ensure reliability, catch bugs before users do, and maintain code quality as the codebase grows.

**Tagline:** "Ship with confidence."

---

## The Problem

As Game Insights grows:
- Manual testing becomes impractical
- Regressions slip through unnoticed
- Refactoring becomes scary
- Contributors hesitate without test coverage
- Edge cases cause production issues

---

## Features

### 7.1 Unit Testing Foundation
**Status:** New | **Priority:** Critical

Comprehensive unit test coverage for core logic.

- [ ] **Test Framework Setup:**
  - Vitest for fast, Vite-native testing
  - Testing Library for React components
  - MSW for API mocking
  - Coverage reporting with c8/istanbul
- [ ] **AI Module Tests:**
  - SchemaAnalyzer accuracy tests
  - GameTypeDetector classification tests
  - DataCleaner transformation tests
  - ChartSelector recommendation tests
  - InsightGenerator output tests
- [ ] **ML Model Tests:**
  - RetentionPredictor accuracy validation
  - ChurnPredictor threshold tests
  - LTVPredictor segment tests
  - AnomalyModel sensitivity tests
  - RevenueForecaster projection tests
- [ ] **Store Tests:**
  - IndexedDB operations (CRUD)
  - Data persistence
  - Migration tests
  - Concurrent access handling
- [ ] **Utility Tests:**
  - Date/time calculations
  - Number formatting
  - Data transformations
  - Validation functions

### 7.2 Component Testing
**Status:** New | **Priority:** Critical

React component testing with Testing Library.

- [ ] **UI Component Tests:**
  - Button, Input, Select interactions
  - Modal open/close behavior
  - Toast notifications
  - Loading states
  - Error boundaries
- [ ] **Chart Component Tests:**
  - Data rendering accuracy
  - Tooltip interactions
  - Legend behavior
  - Responsive sizing
  - Empty/loading states
- [ ] **Page Component Tests:**
  - Dashboard data display
  - Retention cohort tables
  - Funnel visualizations
  - Settings persistence
  - Navigation behavior
- [ ] **Form Tests:**
  - Validation rules
  - Submit handling
  - Error display
  - Reset behavior

### 7.3 Integration Testing
**Status:** New | **Priority:** High

Test component interactions and data flow.

- [ ] **Data Pipeline Integration:**
  - File upload → parsing → analysis
  - Adapter connection → data fetch → display
  - Filter application → chart update
- [ ] **Context Integration:**
  - DataContext provider/consumer
  - GameContext switching
  - Theme context changes
- [ ] **Navigation Integration:**
  - Route transitions
  - Deep linking
  - History navigation
  - Protected routes
- [ ] **API Integration:**
  - REST adapter requests
  - Error handling
  - Retry logic
  - Timeout behavior

### 7.4 End-to-End Testing
**Status:** New | **Priority:** High

Full user journey testing with Playwright.

- [ ] **Setup:**
  - Playwright configuration
  - Browser matrix (Chrome, Firefox, Safari)
  - Mobile viewport testing
  - CI/CD integration
- [ ] **Critical Paths:**
  - First-time user onboarding
  - File upload and analysis
  - Dashboard navigation
  - Data source connection
  - Export generation
- [ ] **User Journeys:**
  - "Upload CSV and see retention"
  - "Connect API and view live data"
  - "Create custom dashboard"
  - "Share report with team"
- [ ] **Error Scenarios:**
  - Invalid file upload
  - Network failures
  - Large file handling
  - Concurrent operations

### 7.5 Visual Regression Testing
**Status:** New | **Priority:** Medium

Catch unintended visual changes.

- [ ] **Screenshot Testing:**
  - Playwright visual comparisons
  - Component snapshots
  - Full-page captures
  - Responsive breakpoints
- [ ] **Storybook Integration:**
  - Component documentation
  - Visual testing addon
  - Accessibility checks
  - Interactive examples
- [ ] **Design System Validation:**
  - Color consistency
  - Typography matching
  - Spacing adherence
  - Icon rendering

### 7.6 Performance Testing
**Status:** New | **Priority:** Medium

Ensure the app stays fast.

- [ ] **Metrics Collection:**
  - First Contentful Paint (FCP)
  - Largest Contentful Paint (LCP)
  - Time to Interactive (TTI)
  - Cumulative Layout Shift (CLS)
- [ ] **Bundle Analysis:**
  - Bundle size tracking
  - Tree-shaking verification
  - Code splitting validation
  - Dependency audit
- [ ] **Runtime Performance:**
  - Large dataset rendering
  - Chart animation smoothness
  - Memory leak detection
  - CPU profiling
- [ ] **Lighthouse CI:**
  - Automated audits
  - Score thresholds
  - Performance budgets
  - Regression alerts

### 7.7 Accessibility Testing
**Status:** New | **Priority:** Medium

Ensure the app is usable by everyone.

- [ ] **Automated Checks:**
  - axe-core integration
  - WCAG 2.1 AA compliance
  - Color contrast validation
  - ARIA attribute verification
- [ ] **Keyboard Navigation:**
  - Tab order testing
  - Focus management
  - Keyboard shortcuts
  - Skip links
- [ ] **Screen Reader Testing:**
  - NVDA/VoiceOver compatibility
  - Alt text verification
  - Semantic HTML
  - Live region announcements

### 7.8 Security Testing
**Status:** New | **Priority:** Medium

Protect user data and prevent vulnerabilities.

- [ ] **Static Analysis:**
  - ESLint security rules
  - Dependency vulnerability scanning
  - Secret detection
  - Code pattern analysis
- [ ] **Input Validation:**
  - XSS prevention tests
  - Injection attack tests
  - File upload validation
  - URL parsing safety
- [ ] **Data Security:**
  - IndexedDB isolation
  - LocalStorage handling
  - Sensitive data masking
  - Export sanitization

### 7.9 CI/CD Pipeline
**Status:** New | **Priority:** Critical

Automated testing on every change.

- [ ] **GitHub Actions Workflow:**
  - Lint on PR
  - Unit tests on PR
  - Integration tests on PR
  - E2E tests on merge to main
- [ ] **Quality Gates:**
  - Minimum coverage thresholds
  - No failing tests policy
  - Performance budgets
  - Bundle size limits
- [ ] **Reporting:**
  - Coverage reports
  - Test result summaries
  - Performance trends
  - Flaky test detection
- [ ] **Deployment:**
  - Preview deployments for PRs
  - Staging environment
  - Production deployment
  - Rollback capability

### 7.10 Test Documentation
**Status:** New | **Priority:** Low

Help contributors write good tests.

- [ ] **Testing Guide:**
  - Test structure conventions
  - Naming patterns
  - Mock strategies
  - Best practices
- [ ] **Example Tests:**
  - Unit test examples
  - Integration test examples
  - E2E test examples
  - Performance test examples
- [ ] **Coverage Reports:**
  - Per-module coverage
  - Uncovered code highlighting
  - Historical trends

---

## Technical Implementation

### Test Structure
```
tests/
├── unit/
│   ├── ai/
│   │   ├── SchemaAnalyzer.test.ts
│   │   ├── GameTypeDetector.test.ts
│   │   └── ...
│   ├── ml/
│   │   ├── RetentionPredictor.test.ts
│   │   └── ...
│   └── lib/
│       ├── dataStore.test.ts
│       └── ...
├── integration/
│   ├── dataPipeline.test.ts
│   ├── adapters.test.ts
│   └── ...
├── e2e/
│   ├── upload.spec.ts
│   ├── dashboard.spec.ts
│   └── ...
└── fixtures/
    ├── csvSamples/
    ├── jsonSamples/
    └── mockData/
```

### Vitest Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['node_modules/', 'tests/'],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
});
```

### Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:unit
      - uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
```

---

## Success Metrics

- **Unit Test Coverage:** > 80% statements, > 75% branches
- **E2E Test Coverage:** All critical user paths covered
- **CI Pipeline:** < 10 min for full test suite
- **Flaky Tests:** < 1% flake rate
- **Bug Detection:** > 90% of bugs caught before production
- **Performance:** No regressions > 10% on key metrics

---

## Dependencies

- Phase 1-6: Core features to test
- Stable API contracts
- Component architecture finalized

## Enables

- Confident refactoring
- Fast contributor onboarding
- Reliable releases
- Quality community contributions

---

## Implementation Priority

| Component | Priority | Effort |
|-----------|----------|--------|
| CI/CD Pipeline | Critical | Medium |
| Unit Testing | Critical | Large |
| Component Testing | Critical | Large |
| Integration Testing | High | Medium |
| E2E Testing | High | Large |
| Performance Testing | Medium | Medium |
| Visual Regression | Medium | Medium |
| Accessibility Testing | Medium | Medium |
| Security Testing | Medium | Small |
| Documentation | Low | Small |

---

## Testing Philosophy

### Test Pyramid
```
          /\
         /  \
        / E2E \        <- Few, slow, high confidence
       /--------\
      /Integration\    <- More, medium speed
     /--------------\
    /     Unit       \ <- Many, fast, focused
   /------------------\
```

### Key Principles
1. **Test behavior, not implementation** - Tests should survive refactoring
2. **Fast feedback** - Unit tests run in < 5 seconds
3. **Deterministic** - No flaky tests allowed
4. **Maintainable** - Tests are code, treat them accordingly
5. **Documented** - Tests explain expected behavior
