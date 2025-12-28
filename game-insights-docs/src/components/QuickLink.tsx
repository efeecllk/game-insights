import React from 'react';

interface QuickLinkProps {
  icon: string;
  title: string;
  description: string;
  to: string;
}

export default function QuickLink({ icon, title, description, to }: QuickLinkProps) {
  return (
    <a href={to} className="quick-link">
      <span className="quick-link__icon">{icon}</span>
      <div className="quick-link__content">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </a>
  );
}
