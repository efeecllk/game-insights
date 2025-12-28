import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    {
      type: 'doc',
      id: 'index',
      label: 'Introduction',
    },
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/quickstart',
        'getting-started/installation',
        'getting-started/core-concepts',
        'getting-started/architecture',
      ],
    },
    {
      type: 'category',
      label: 'Data Management',
      items: [
        'data-management/overview',
        'data-management/uploading-data',
        'data-management/supported-formats',
        'data-management/data-quality',
        {
          type: 'category',
          label: 'Data Sources',
          items: [
            'data-management/sources/file-adapter',
            'data-management/sources/google-sheets',
            'data-management/sources/postgresql',
            'data-management/sources/supabase',
            'data-management/sources/webhooks',
            'data-management/sources/api',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'AI & Analytics',
      items: [
        'ai-analytics/overview',
        'ai-analytics/ai-pipeline',
        'ai-analytics/schema-analysis',
        'ai-analytics/game-type-detection',
        {
          type: 'category',
          label: 'Predictions',
          link: {
            type: 'doc',
            id: 'ai-analytics/predictions/index',
          },
          items: [
            'ai-analytics/predictions/retention',
            'ai-analytics/predictions/churn',
            'ai-analytics/predictions/ltv',
            'ai-analytics/predictions/revenue',
          ],
        },
        'ai-analytics/anomaly-detection',
        'ai-analytics/recommendations',
      ],
    },
    {
      type: 'category',
      label: 'Dashboards',
      items: [
        'dashboards/overview-dashboard',
        'dashboards/builder',
        'dashboards/widgets',
        'dashboards/charts',
        'dashboards/exporting',
      ],
    },
    {
      type: 'category',
      label: 'Features',
      items: [
        'features/funnels',
        'features/funnel-builder',
        'features/monetization',
        'features/real-time',
        'features/ab-testing',
        'features/alerts',
        'features/templates',
      ],
    },
    {
      type: 'category',
      label: 'Game Type Guides',
      items: [
        'game-guides/overview',
        'game-guides/puzzle',
        'game-guides/idle',
        'game-guides/battle-royale',
        'game-guides/match3-meta',
        'game-guides/gacha-rpg',
      ],
    },
    {
      type: 'category',
      label: 'Cookbook',
      items: [
        'cookbook/index',
        'cookbook/first-upload',
        'cookbook/custom-dashboard',
        'cookbook/setup-alerts',
        'cookbook/connect-live-data',
        'cookbook/run-ab-test',
        'cookbook/analyze-monetization',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api-reference/index',
        'api-reference/adapters',
        'api-reference/ai-pipeline',
        'api-reference/data-providers',
        'api-reference/stores',
      ],
    },
  ],
};

export default sidebars;
