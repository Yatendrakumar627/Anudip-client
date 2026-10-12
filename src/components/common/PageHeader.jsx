import React from 'react';

export default function PageHeader({ eyebrow, title, subtitle, action, children }) {
  return (
    <div className="page-header">
      <div className="page-header-info">
        <div className="eyebrow">{eyebrow || 'ANUDIP FOUNDATION'}</div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="header-actions">
        {children}
        {action}
      </div>
    </div>
  );
}
