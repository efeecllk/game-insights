import React from 'react';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  link?: string;
}

export default function FeatureCard({ icon, title, description, link }: FeatureCardProps) {
  const content = (
    <div className="feature-card">
      <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{icon}</div>
      <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem' }}>{title}</h3>
      <p style={{ margin: 0, opacity: 0.8, fontSize: '0.875rem' }}>{description}</p>
    </div>
  );

  if (link) {
    return <a href={link} style={{ textDecoration: 'none', color: 'inherit' }}>{content}</a>;
  }

  return content;
}
