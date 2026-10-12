import React from 'react';
import { Button } from '@mantine/core';
import { IconExternalLink, IconSparkles } from '@tabler/icons-react';

export const LMS_LOGIN_URL = 'https://learn.anudip.org/login/index.php';

export default function LmsHeroBanner({ onScrollToTable }) {
  return (
    <section className="lms-hero-card">
      <div className="lms-hero-content">
        <div className="lms-badge">
          <IconSparkles size={14} />
          <span>ANUDIP FOUNDATION LMS PORTAL &bull; LEARN &bull; PRACTICE &bull; GROW</span>
        </div>
        <h1>
          Your learning journey <br />
          <span className="lms-gradient-text">starts here.</span>
        </h1>
        <p>
          Access your official Anudip LMS account using your assigned User Name and Password.
          Batches created by your trainer reflect here in real-time with all your details.
        </p>
        <div className="lms-hero-actions">
          <Button
            className="lms-btn-primary"
            size="md"
            radius="md"
            onClick={onScrollToTable}
          >
            View Login Details ↓
          </Button>
          <Button
            component="a"
            href={LMS_LOGIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            variant="default"
            size="md"
            radius="md"
            rightSection={<IconExternalLink size={16} />}
          >
            Open Official LMS (learn.anudip.org)
          </Button>
        </div>
      </div>
    </section>
  );
}
