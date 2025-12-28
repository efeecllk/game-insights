import React from 'react';

interface KPI {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface KPIExampleProps {
  kpis: KPI[];
}

export default function KPIExample({ kpis }: KPIExampleProps) {
  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return '↑';
      case 'down': return '↓';
      default: return '';
    }
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return '#10b981';
      case 'down': return '#ef4444';
      default: return 'inherit';
    }
  };

  return (
    <div className="kpi-example">
      {kpis.map((kpi, index) => (
        <div key={index} className="kpi-item">
          <div className="kpi-item__label">{kpi.label}</div>
          <div className="kpi-item__value">
            {kpi.value}
            {kpi.trend && (
              <span style={{ color: getTrendColor(kpi.trend), marginLeft: '0.25rem', fontSize: '0.875rem' }}>
                {getTrendIcon(kpi.trend)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
