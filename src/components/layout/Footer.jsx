import React from 'react';

export default function Footer({ orgName = 'Anudip Foundation', demoMode = true }) {
  return (
    <footer className="app-footer">
      <span>
        © {new Date().getFullYear()} {orgName} · Training Hub
      </span>
      <span>
        {demoMode ? (
          <>
            <span className="mode-dot demo" /> Demo mode · browser storage
          </>
        ) : (
          <>
            <span className="mode-dot connected" /> Connected to API
          </>
        )}
      </span>
      <span>Built for people. Designed for impact.</span>
    </footer>
  );
}
