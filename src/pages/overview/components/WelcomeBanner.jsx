import React from 'react';
import { Button } from '@mantine/core';
import { Link } from 'react-router-dom';
import {
  IconArrowRight,
  IconChartBar,
  IconSchool,
  IconSparkles,
  IconTargetArrow,
  IconUsers,
} from '@tabler/icons-react';

export default function WelcomeBanner({
  greeting,
  orgName,
}) {
  const orgFirstWord = orgName.split(/\s+/)[0].toUpperCase();

  return (
    <div className="welcome-banner">
      <div className="welcome-copy">
        <div className="welcome-kicker">
          <span className="welcome-dot" />
          YOUR IMPACT, IN FOCUS
        </div>
        <h2>
          {greeting}, Admin <span>✦</span>
        </h2>
        <p>Every session is a step forward. Here’s what’s happening at {orgName} today.</p>
        <div className="welcome-actions">
          <Button
            component={Link}
            to="/lms-credential"
            leftSection={<IconSchool size={17} />}
            rightSection={<IconArrowRight size={15} />}
            color="white"
            c="indigo.8"
            size="sm"
            radius="md"
            style={{
              fontWeight: 750,
              boxShadow: '0 6px 18px rgba(0, 0, 0, 0.15)',
            }}
          >
            Student LMS Portal
          </Button>
        </div>
      </div>

      <div className="welcome-art">
        <div className="art-orbit orbit-one" />
        <div className="art-orbit orbit-two" />
        <div className="art-orbit orbit-three" />
        <div className="art-core">
          <IconSparkles size={42} />
        </div>
        <div className="art-float float-one">
          <IconUsers size={17} />
          <span>Access</span>
        </div>
        <div className="art-float float-two">
          <IconTargetArrow size={17} />
          <span>Opportunity</span>
        </div>
        <div className="art-float float-three">
          <IconChartBar size={17} />
          <span>Growth</span>
        </div>
      </div>

      <div className="welcome-watermark">{orgFirstWord}</div>
    </div>
  );
}
