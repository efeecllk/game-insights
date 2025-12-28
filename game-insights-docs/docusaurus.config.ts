import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Game Insights',
  tagline: 'AI-Powered Analytics Dashboard for Mobile Games',
  favicon: 'img/favicon.ico',

  url: 'https://game-insights.dev',
  baseUrl: '/',

  organizationName: 'game-insights',
  projectName: 'game-insights-docs',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/game-insights/game-insights-docs/tree/main/',
          showLastUpdateTime: true,
          showLastUpdateAuthor: true,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/game-insights-social-card.png',
    navbar: {
      title: 'Game Insights',
      logo: {
        alt: 'Game Insights Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Documentation',
        },
        {
          to: '/docs/getting-started/quickstart',
          label: 'Get Started',
          position: 'left',
        },
        {
          to: '/docs/cookbook',
          label: 'Cookbook',
          position: 'left',
        },
        {
          to: '/docs/api-reference',
          label: 'API',
          position: 'left',
        },
        {
          href: 'https://github.com/game-insights/game-insights',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/getting-started/quickstart',
            },
            {
              label: 'Data Management',
              to: '/docs/data-management/overview',
            },
            {
              label: 'AI & Analytics',
              to: '/docs/ai-analytics/overview',
            },
          ],
        },
        {
          title: 'Features',
          items: [
            {
              label: 'Dashboard Builder',
              to: '/docs/dashboards/builder',
            },
            {
              label: 'Predictions',
              to: '/docs/ai-analytics/predictions',
            },
            {
              label: 'A/B Testing',
              to: '/docs/features/ab-testing',
            },
          ],
        },
        {
          title: 'Game Guides',
          items: [
            {
              label: 'Puzzle Games',
              to: '/docs/game-guides/puzzle',
            },
            {
              label: 'Idle Games',
              to: '/docs/game-guides/idle',
            },
            {
              label: 'Battle Royale',
              to: '/docs/game-guides/battle-royale',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/game-insights/game-insights',
            },
            {
              label: 'Cookbook',
              to: '/docs/cookbook',
            },
          ],
        },
      ],
      copyright: `Copyright ${new Date().getFullYear()} Game Insights. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript', 'sql'],
    },
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 4,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
