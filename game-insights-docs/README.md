# Game Insights Documentation

This is the official documentation for [Game Insights](https://github.com/game-insights/game-insights), an AI-powered analytics dashboard for mobile games.

## Getting Started

### Prerequisites

- Node.js 20.0 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/game-insights/game-insights-docs.git
cd game-insights-docs

# Install dependencies
npm install

# Start development server
npm start
```

The documentation site will be available at `http://localhost:3000`.

### Build

```bash
npm run build
```

This generates static content in the `build` directory.

### Deployment

The site is configured for deployment on Vercel. Push to main branch for automatic deployment.

## Project Structure

```
game-insights-docs/
├── docs/                    # Documentation content
│   ├── getting-started/     # Getting started guides
│   ├── data-management/     # Data import and sources
│   ├── ai-analytics/        # AI and ML features
│   ├── dashboards/          # Dashboard documentation
│   ├── features/            # Feature guides
│   ├── game-guides/         # Game type specific guides
│   ├── cookbook/            # Step-by-step tutorials
│   └── api-reference/       # API documentation
├── src/
│   ├── components/          # Custom React components
│   ├── css/                 # Custom styles
│   └── pages/               # Custom pages
├── static/                  # Static assets
├── docusaurus.config.ts     # Docusaurus configuration
└── sidebars.ts              # Sidebar navigation
```

## Documentation Sections

| Section | Description |
|---------|-------------|
| Getting Started | Quick start, installation, core concepts |
| Data Management | Data import, adapters, quality |
| AI & Analytics | AI pipeline, predictions, recommendations |
| Dashboards | Dashboard builder, widgets, charts |
| Features | Funnels, alerts, A/B testing, templates |
| Game Guides | Puzzle, idle, battle royale, match-3, gacha |
| Cookbook | Practical tutorials |
| API Reference | Developer documentation |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

### Writing Guidelines

- Use clear, concise language
- Include code examples where helpful
- Add screenshots for UI features
- Follow the existing structure

## Built With

- [Docusaurus 3](https://docusaurus.io/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)

## License

MIT License - see LICENSE file for details.
