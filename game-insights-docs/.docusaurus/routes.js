import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/docs',
    component: ComponentCreator('/docs', '5ce'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', 'b9f'),
        routes: [
          {
            path: '/docs',
            component: ComponentCreator('/docs', '196'),
            routes: [
              {
                path: '/docs/',
                component: ComponentCreator('/docs/', '6e3'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ai-analytics/ai-pipeline',
                component: ComponentCreator('/docs/ai-analytics/ai-pipeline', 'dc5'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ai-analytics/anomaly-detection',
                component: ComponentCreator('/docs/ai-analytics/anomaly-detection', '40c'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ai-analytics/game-type-detection',
                component: ComponentCreator('/docs/ai-analytics/game-type-detection', '5eb'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ai-analytics/overview',
                component: ComponentCreator('/docs/ai-analytics/overview', '49c'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ai-analytics/predictions/',
                component: ComponentCreator('/docs/ai-analytics/predictions/', '910'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ai-analytics/predictions/churn',
                component: ComponentCreator('/docs/ai-analytics/predictions/churn', '8dc'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ai-analytics/predictions/ltv',
                component: ComponentCreator('/docs/ai-analytics/predictions/ltv', '004'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ai-analytics/predictions/retention',
                component: ComponentCreator('/docs/ai-analytics/predictions/retention', '148'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ai-analytics/predictions/revenue',
                component: ComponentCreator('/docs/ai-analytics/predictions/revenue', '5e3'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ai-analytics/recommendations',
                component: ComponentCreator('/docs/ai-analytics/recommendations', '694'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ai-analytics/schema-analysis',
                component: ComponentCreator('/docs/ai-analytics/schema-analysis', 'eec'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api-reference/',
                component: ComponentCreator('/docs/api-reference/', 'f43'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api-reference/adapters',
                component: ComponentCreator('/docs/api-reference/adapters', 'e2d'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api-reference/ai-pipeline',
                component: ComponentCreator('/docs/api-reference/ai-pipeline', 'fb1'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api-reference/data-providers',
                component: ComponentCreator('/docs/api-reference/data-providers', '349'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api-reference/stores',
                component: ComponentCreator('/docs/api-reference/stores', '016'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/cookbook/',
                component: ComponentCreator('/docs/cookbook/', '5d1'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/cookbook/analyze-monetization',
                component: ComponentCreator('/docs/cookbook/analyze-monetization', 'e62'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/cookbook/connect-live-data',
                component: ComponentCreator('/docs/cookbook/connect-live-data', '656'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/cookbook/custom-dashboard',
                component: ComponentCreator('/docs/cookbook/custom-dashboard', '91a'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/cookbook/first-upload',
                component: ComponentCreator('/docs/cookbook/first-upload', '26d'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/cookbook/run-ab-test',
                component: ComponentCreator('/docs/cookbook/run-ab-test', 'faf'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/cookbook/setup-alerts',
                component: ComponentCreator('/docs/cookbook/setup-alerts', '612'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/dashboards/builder',
                component: ComponentCreator('/docs/dashboards/builder', '94e'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/dashboards/charts',
                component: ComponentCreator('/docs/dashboards/charts', 'fc3'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/dashboards/exporting',
                component: ComponentCreator('/docs/dashboards/exporting', 'd09'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/dashboards/overview-dashboard',
                component: ComponentCreator('/docs/dashboards/overview-dashboard', 'a95'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/dashboards/widgets',
                component: ComponentCreator('/docs/dashboards/widgets', '2d9'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data-management/data-quality',
                component: ComponentCreator('/docs/data-management/data-quality', '48f'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data-management/overview',
                component: ComponentCreator('/docs/data-management/overview', 'b76'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data-management/sources/api',
                component: ComponentCreator('/docs/data-management/sources/api', '434'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data-management/sources/file-adapter',
                component: ComponentCreator('/docs/data-management/sources/file-adapter', '1c2'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data-management/sources/google-sheets',
                component: ComponentCreator('/docs/data-management/sources/google-sheets', '7b3'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data-management/sources/postgresql',
                component: ComponentCreator('/docs/data-management/sources/postgresql', '53e'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data-management/sources/supabase',
                component: ComponentCreator('/docs/data-management/sources/supabase', '457'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data-management/sources/webhooks',
                component: ComponentCreator('/docs/data-management/sources/webhooks', 'e8c'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data-management/supported-formats',
                component: ComponentCreator('/docs/data-management/supported-formats', '3ed'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data-management/uploading-data',
                component: ComponentCreator('/docs/data-management/uploading-data', '7f1'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/features/ab-testing',
                component: ComponentCreator('/docs/features/ab-testing', 'b51'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/features/alerts',
                component: ComponentCreator('/docs/features/alerts', '00c'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/features/funnel-builder',
                component: ComponentCreator('/docs/features/funnel-builder', '072'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/features/funnels',
                component: ComponentCreator('/docs/features/funnels', '35b'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/features/monetization',
                component: ComponentCreator('/docs/features/monetization', 'aa5'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/features/real-time',
                component: ComponentCreator('/docs/features/real-time', '5a1'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/features/templates',
                component: ComponentCreator('/docs/features/templates', 'ecc'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/game-guides/battle-royale',
                component: ComponentCreator('/docs/game-guides/battle-royale', '071'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/game-guides/gacha-rpg',
                component: ComponentCreator('/docs/game-guides/gacha-rpg', 'b51'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/game-guides/idle',
                component: ComponentCreator('/docs/game-guides/idle', '4ad'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/game-guides/match3-meta',
                component: ComponentCreator('/docs/game-guides/match3-meta', '811'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/game-guides/overview',
                component: ComponentCreator('/docs/game-guides/overview', 'fc5'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/game-guides/puzzle',
                component: ComponentCreator('/docs/game-guides/puzzle', 'd47'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/getting-started/architecture',
                component: ComponentCreator('/docs/getting-started/architecture', 'fad'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/getting-started/core-concepts',
                component: ComponentCreator('/docs/getting-started/core-concepts', '745'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/getting-started/installation',
                component: ComponentCreator('/docs/getting-started/installation', '022'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/getting-started/quickstart',
                component: ComponentCreator('/docs/getting-started/quickstart', 'a27'),
                exact: true,
                sidebar: "docs"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/',
    component: ComponentCreator('/', 'e5f'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
