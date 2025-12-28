---
sidebar_position: 2
title: Installation
description: Detailed installation guide for Game Insights
---

# Installation Guide

This guide covers detailed installation instructions, system requirements, and troubleshooting for common issues.

## System Requirements

### Minimum Requirements

| Component | Requirement |
|-----------|-------------|
| **Node.js** | 18.0 or higher |
| **npm** | 9.0 or higher |
| **Memory** | 4GB RAM |
| **Disk Space** | 500MB free |
| **Browser** | Chrome 90+, Firefox 90+, Safari 15+, Edge 90+ |

### Recommended for Large Datasets

| Component | Recommendation |
|-----------|----------------|
| **Node.js** | 20.x LTS |
| **Memory** | 8GB+ RAM |
| **Disk Space** | 2GB+ free (for IndexedDB storage) |

## Installation Steps

### 1. Install Node.js

**macOS (using Homebrew):**
```bash
brew install node@20
```

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Windows:**

Download and run the installer from [nodejs.org](https://nodejs.org/).

Verify the installation:
```bash
node --version   # v20.x.x
npm --version    # 10.x.x
```

### 2. Clone the Repository

```bash
git clone https://github.com/your-org/game-insights.git
cd game-insights
```

### 3. Install Dependencies

```bash
npm install
```

This installs all required packages including:
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **ECharts** - Charting library
- **TailwindCSS** - Styling
- **sql.js** - In-browser SQL for data processing
- **PapaParse** - CSV parsing
- **xlsx** - Excel file parsing

### 4. Start Development Server

```bash
npm run dev
```

The server starts at `http://localhost:5173` by default.

## Environment Setup

### Optional Environment Variables

Create a `.env.local` file for custom configuration:

```bash
# .env.local

# API endpoints (if using external integrations)
VITE_API_URL=https://your-api.example.com

# Feature flags
VITE_ENABLE_LLM=true
VITE_ENABLE_REALTIME=true
```

:::note
Game Insights is designed as a local-first application. Most features work without any external configuration.
:::

## Build for Production

Create an optimized production build:

```bash
npm run build
```

The output is generated in the `dist/` directory. Preview the build locally:

```bash
npm run preview
```

### Deployment Options

The production build is a static site that can be deployed to:

- **Vercel** - `npm i -g vercel && vercel`
- **Netlify** - Connect your repository
- **GitHub Pages** - Use the `gh-pages` branch
- **AWS S3** - Upload `dist/` to an S3 bucket
- **Docker** - See Dockerfile in repository

## Development Tools

### ESLint

Lint your code:
```bash
npm run lint
```

### Testing

Run the test suite:
```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### Storybook

View and develop components in isolation:
```bash
npm run storybook
```

Storybook runs at `http://localhost:6006`.

## Project Structure

After installation, your project structure looks like this:

```
game-insights/
├── src/
│   ├── adapters/       # Data source adapters
│   ├── ai/             # AI pipeline modules
│   ├── components/     # React components
│   ├── context/        # React context providers
│   ├── lib/            # Utilities and stores
│   ├── pages/          # Page components
│   └── types/          # TypeScript type definitions
├── public/             # Static assets
├── tests/              # Test files
├── docs/               # Documentation
└── package.json        # Project configuration
```

## Troubleshooting

### Common Issues

#### `ENOENT: no such file or directory`

Clear npm cache and reinstall:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### Port 5173 already in use

Either stop the process using the port:
```bash
# Find process using port 5173
lsof -i :5173
# Kill the process
kill -9 <PID>
```

Or use a different port:
```bash
npm run dev -- --port 3000
```

#### Build fails with memory error

Increase Node.js memory limit:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

#### TypeScript errors

Ensure TypeScript is installed and check your version:
```bash
npx tsc --version
```

If errors persist, try:
```bash
rm -rf node_modules/.cache
npm run build
```

#### IndexedDB quota exceeded

Game Insights stores data locally in IndexedDB. If you hit storage limits:

1. Clear browser data for localhost
2. Or increase browser storage quota (Chrome: `chrome://settings/content/cookies`)

#### Slow performance with large datasets

For datasets over 100K rows:
- The AI pipeline uses smart sampling (default: 1000 rows)
- Consider preprocessing data before upload
- Use the built-in data cleaning to remove unnecessary columns

### Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome | 90+ | Full support |
| Firefox | 90+ | Full support |
| Safari | 15+ | IndexedDB may have limits |
| Edge | 90+ | Full support |

:::warning
Internet Explorer is not supported.
:::

## Next Steps

- **[Quick Start](/docs/getting-started/quickstart)** - Get running in 5 minutes
- **[Core Concepts](/docs/getting-started/core-concepts)** - Understand the fundamentals
- **[Architecture](/docs/getting-started/architecture)** - Learn the system design

## Getting Help

If you encounter issues not covered here:

1. Check the [GitHub Issues](https://github.com/your-org/game-insights/issues)
2. Search existing issues for similar problems
3. Create a new issue with:
   - Node.js version
   - npm version
   - Operating system
   - Error messages
   - Steps to reproduce
