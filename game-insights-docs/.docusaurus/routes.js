import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '5ff'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '5ba'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a2b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'c3c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '156'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '88c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '000'),
    exact: true
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', '14c'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', '533'),
        routes: [
          {
            path: '/docs',
            component: ComponentCreator('/docs', 'ed6'),
            routes: [
              {
                path: '/docs/',
                component: ComponentCreator('/docs/', '06f'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ai-analytics/ai-pipeline',
                component: ComponentCreator('/docs/ai-analytics/ai-pipeline', '1a0'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ai-analytics/anomaly-detection',
                component: ComponentCreator('/docs/ai-analytics/anomaly-detection', '797'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ai-analytics/game-type-detection',
                component: ComponentCreator('/docs/ai-analytics/game-type-detection', 'a57'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ai-analytics/overview',
                component: ComponentCreator('/docs/ai-analytics/overview', '761'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ai-analytics/predictions/',
                component: ComponentCreator('/docs/ai-analytics/predictions/', '7f7'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ai-analytics/predictions/churn',
                component: ComponentCreator('/docs/ai-analytics/predictions/churn', 'a5c'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ai-analytics/predictions/ltv',
                component: ComponentCreator('/docs/ai-analytics/predictions/ltv', 'bd4'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ai-analytics/predictions/retention',
                component: ComponentCreator('/docs/ai-analytics/predictions/retention', 'de0'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ai-analytics/predictions/revenue',
                component: ComponentCreator('/docs/ai-analytics/predictions/revenue', 'd28'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ai-analytics/recommendations',
                component: ComponentCreator('/docs/ai-analytics/recommendations', '131'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/ai-analytics/schema-analysis',
                component: ComponentCreator('/docs/ai-analytics/schema-analysis', 'a22'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api-reference/',
                component: ComponentCreator('/docs/api-reference/', 'f3c'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api-reference/adapters',
                component: ComponentCreator('/docs/api-reference/adapters', 'cf6'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api-reference/ai-pipeline',
                component: ComponentCreator('/docs/api-reference/ai-pipeline', 'f74'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api-reference/data-providers',
                component: ComponentCreator('/docs/api-reference/data-providers', 'dca'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/api-reference/stores',
                component: ComponentCreator('/docs/api-reference/stores', '190'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/cookbook/',
                component: ComponentCreator('/docs/cookbook/', '6ab'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/cookbook/analyze-monetization',
                component: ComponentCreator('/docs/cookbook/analyze-monetization', '4e5'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/cookbook/connect-live-data',
                component: ComponentCreator('/docs/cookbook/connect-live-data', 'b89'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/cookbook/custom-dashboard',
                component: ComponentCreator('/docs/cookbook/custom-dashboard', 'e9c'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/cookbook/first-upload',
                component: ComponentCreator('/docs/cookbook/first-upload', 'eea'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/cookbook/run-ab-test',
                component: ComponentCreator('/docs/cookbook/run-ab-test', '5fe'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/cookbook/setup-alerts',
                component: ComponentCreator('/docs/cookbook/setup-alerts', 'ba1'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/dashboards/builder',
                component: ComponentCreator('/docs/dashboards/builder', '5eb'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/dashboards/charts',
                component: ComponentCreator('/docs/dashboards/charts', '6ca'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/dashboards/exporting',
                component: ComponentCreator('/docs/dashboards/exporting', '616'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/dashboards/overview-dashboard',
                component: ComponentCreator('/docs/dashboards/overview-dashboard', '8cc'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/dashboards/widgets',
                component: ComponentCreator('/docs/dashboards/widgets', '2fa'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data-management/data-quality',
                component: ComponentCreator('/docs/data-management/data-quality', '2e6'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data-management/overview',
                component: ComponentCreator('/docs/data-management/overview', 'f95'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data-management/sources/api',
                component: ComponentCreator('/docs/data-management/sources/api', 'b54'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data-management/sources/file-adapter',
                component: ComponentCreator('/docs/data-management/sources/file-adapter', '7e5'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data-management/sources/google-sheets',
                component: ComponentCreator('/docs/data-management/sources/google-sheets', 'c66'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data-management/sources/postgresql',
                component: ComponentCreator('/docs/data-management/sources/postgresql', '04d'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data-management/sources/supabase',
                component: ComponentCreator('/docs/data-management/sources/supabase', 'c06'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data-management/sources/webhooks',
                component: ComponentCreator('/docs/data-management/sources/webhooks', '1fe'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data-management/supported-formats',
                component: ComponentCreator('/docs/data-management/supported-formats', 'b38'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/data-management/uploading-data',
                component: ComponentCreator('/docs/data-management/uploading-data', 'd62'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/features/ab-testing',
                component: ComponentCreator('/docs/features/ab-testing', '012'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/features/alerts',
                component: ComponentCreator('/docs/features/alerts', 'c34'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/features/funnel-builder',
                component: ComponentCreator('/docs/features/funnel-builder', '783'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/features/funnels',
                component: ComponentCreator('/docs/features/funnels', 'd3e'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/features/monetization',
                component: ComponentCreator('/docs/features/monetization', '89a'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/features/real-time',
                component: ComponentCreator('/docs/features/real-time', 'c61'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/features/templates',
                component: ComponentCreator('/docs/features/templates', 'a8f'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/game-guides/battle-royale',
                component: ComponentCreator('/docs/game-guides/battle-royale', 'c19'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/game-guides/gacha-rpg',
                component: ComponentCreator('/docs/game-guides/gacha-rpg', '540'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/game-guides/idle',
                component: ComponentCreator('/docs/game-guides/idle', '280'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/game-guides/match3-meta',
                component: ComponentCreator('/docs/game-guides/match3-meta', '3ac'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/game-guides/overview',
                component: ComponentCreator('/docs/game-guides/overview', 'da9'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/game-guides/puzzle',
                component: ComponentCreator('/docs/game-guides/puzzle', '356'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/getting-started/architecture',
                component: ComponentCreator('/docs/getting-started/architecture', 'd91'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/getting-started/core-concepts',
                component: ComponentCreator('/docs/getting-started/core-concepts', 'f5c'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/getting-started/installation',
                component: ComponentCreator('/docs/getting-started/installation', 'c6e'),
                exact: true,
                sidebar: "docs"
              },
              {
                path: '/docs/getting-started/quickstart',
                component: ComponentCreator('/docs/getting-started/quickstart', 'e3d'),
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
