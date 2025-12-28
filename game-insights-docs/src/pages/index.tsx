import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

const features = [
  {
    icon: '🤖',
    title: 'AI-Powered Analysis',
    description: 'Automatic game type detection, schema analysis, and intelligent recommendations tailored to your game.',
  },
  {
    icon: '📈',
    title: 'Predictive Analytics',
    description: 'Forecast retention, churn, LTV, and revenue with machine learning models built for games.',
  },
  {
    icon: '🎮',
    title: 'Game-Specific Metrics',
    description: 'Specialized KPIs and visualizations for puzzle, idle, battle royale, match-3, and gacha games.',
  },
  {
    icon: '⚡',
    title: 'Real-Time Monitoring',
    description: 'Live dashboards with 3-second refresh for monitoring active users, revenue, and events.',
  },
  {
    icon: '🧪',
    title: 'A/B Testing',
    description: 'Built-in experimentation framework with Bayesian analysis and winner detection.',
  },
  {
    icon: '🔔',
    title: 'Smart Alerts',
    description: 'Multi-channel notifications for anomalies, thresholds, and AI-detected opportunities.',
  },
];

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className="hero">
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
          <Link
            className="button button--primary button--lg"
            to="/docs/getting-started/quickstart">
            Get Started
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/docs">
            Read the Docs
          </Link>
        </div>
      </div>
    </header>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="feature-card">
      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{icon}</div>
      <h3 style={{ marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ opacity: 0.8, margin: 0 }}>{description}</p>
    </div>
  );
}

function HomepageFeatures() {
  return (
    <section style={{ padding: '4rem 0' }}>
      <div className="container">
        <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>Why Game Insights?</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}>
          {features.map((feature, idx) => (
            <FeatureCard key={idx} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function GameTypesSection() {
  const gameTypes = [
    { icon: '🧩', name: 'Puzzle', metrics: 'Level progression, boosters, difficulty' },
    { icon: '⏰', name: 'Idle', metrics: 'Prestige funnels, offline time, upgrades' },
    { icon: '🎯', name: 'Battle Royale', metrics: 'Rank distribution, weapon meta, SBMM' },
    { icon: '💎', name: 'Match-3 Meta', metrics: 'Story progress, decorations, chapters' },
    { icon: '🎰', name: 'Gacha RPG', metrics: 'Banner performance, spender tiers, whales' },
  ];

  return (
    <section style={{ padding: '4rem 0', background: 'var(--ifm-background-surface-color)' }}>
      <div className="container">
        <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>Supported Game Types</h2>
        <p style={{ textAlign: 'center', marginBottom: '3rem', opacity: 0.8 }}>
          Specialized analytics tailored to your game category
        </p>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '1rem',
        }}>
          {gameTypes.map((game, idx) => (
            <div key={idx} style={{
              background: 'var(--ifm-background-color)',
              border: '1px solid var(--ifm-color-emphasis-200)',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              minWidth: '180px',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{game.icon}</div>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>{game.name}</h4>
              <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: 0 }}>{game.metrics}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section style={{ padding: '4rem 0', textAlign: 'center' }}>
      <div className="container">
        <h2>Ready to Get Started?</h2>
        <p style={{ opacity: 0.8, marginBottom: '2rem' }}>
          Upload your game data and get AI-powered insights in minutes
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link className="button button--primary button--lg" to="/docs/getting-started/quickstart">
            Quick Start Guide
          </Link>
          <Link className="button button--outline button--lg" to="/docs/cookbook">
            View Tutorials
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Home(): React.ReactElement {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title="Home"
      description={siteConfig.tagline}>
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <GameTypesSection />
        <CTASection />
      </main>
    </Layout>
  );
}
