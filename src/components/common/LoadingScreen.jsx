import React, { useState, useEffect } from 'react';
import { Paper, Stack, Text, Badge, Button, Group, Progress, ThemeIcon } from '@mantine/core';
import {
  IconSparkles,
  IconClock,
  IconRefresh,
  IconDatabase,
} from '@tabler/icons-react';

/**
 * TopProgressBar: A sleek 3px indeterminate progress bar for route transitions
 */
export function TopProgressBar() {
  return (
    <div className="top-progress-bar-wrap" role="progressbar" aria-label="Loading page">
      <div className="top-progress-bar-fill" />
    </div>
  );
}

/**
 * LoadingScreen: Comprehensive, time-aware loader for workspace data or slow connections
 */
export default function LoadingScreen({
  title = 'Anudip Training Hub',
  subtitle = 'Initializing learning portal & cohort roster...',
  fullPage = false,
  onRetry,
  onUseDemo,
}) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Time-aware progressive messaging
  let statusBadge = 'Loading';
  let badgeColor = 'indigo';
  let dynamicMessage = subtitle;
  let progressValue = Math.min(15 + seconds * 12, 92);

  if (seconds >= 3 && seconds < 7) {
    statusBadge = 'Connecting';
    badgeColor = 'blue';
    dynamicMessage = 'Connecting to database & syncing training records...';
  } else if (seconds >= 7 && seconds < 12) {
    statusBadge = 'Server Warmup';
    badgeColor = 'cyan';
    dynamicMessage = 'Cloud server is waking up from idle state. Hang tight, almost there...';
  } else if (seconds >= 12) {
    statusBadge = 'Taking Time';
    badgeColor = 'orange';
    dynamicMessage = 'Connection is taking longer than expected. You can wait or switch to demo mode.';
  }

  return (
    <div className={`loading-screen-container ${fullPage ? 'full-page' : ''}`}>
      <TopProgressBar />

      <Paper
        withBorder
        radius="xl"
        p="xl"
        className="loading-screen-card"
        shadow="md"
      >
        <Stack align="center" gap="md" ta="center">
          {/* Animated Spinner Icon */}
          <div className="loader-ring-wrapper">
            <div className="loader-ring-spin" />
            <div className="loader-ring-inner">
              <ThemeIcon size={44} radius="xl" color="indigo" variant="light">
                <IconSparkles size={22} className="loader-sparkle-anim" />
              </ThemeIcon>
            </div>
          </div>

          {/* Heading */}
          <div>
            <Group justify="center" gap="xs" mb={4}>
              <Text fw={750} size="lg" c="#18233c">
                {title}
              </Text>
              <Badge size="sm" variant="light" color={badgeColor}>
                {statusBadge}
              </Badge>
            </Group>
            <Text size="xs" c="dimmed" style={{ maxWidth: 360, minHeight: 34 }}>
              {dynamicMessage}
            </Text>
          </div>

          {/* Dynamic Progress Bar */}
          <div style={{ width: '100%', maxWidth: 280 }}>
            <Progress
              value={progressValue}
              animated
              color={seconds >= 12 ? 'orange' : 'indigo'}
              radius="xl"
              size="sm"
            />
            <Group justify="space-between" mt={6}>
              <Text size="10px" c="dimmed">
                {seconds > 0 ? `${seconds}s elapsed` : 'Starting...'}
              </Text>
              <Text size="10px" c="dimmed" fw={600}>
                {progressValue}%
              </Text>
            </Group>
          </div>

          {/* Fallback Action Buttons if Taking More Than 7s */}
          {seconds >= 7 && (
            <Stack gap="xs" mt="xs" style={{ width: '100%' }}>
              <div className="taking-time-notice">
                <Group gap={6} justify="center">
                  <IconClock size={13} color="#b45309" />
                  <Text size="11px" c="#b45309" fw={600}>
                    Free cloud services may take 30-40s to cold-start.
                  </Text>
                </Group>
              </div>

              <Group justify="center" gap="xs">
                {onUseDemo && (
                  <Button
                    size="xs"
                    variant="light"
                    color="teal"
                    leftSection={<IconDatabase size={13} />}
                    onClick={onUseDemo}
                  >
                    Load Offline / Demo Mode
                  </Button>
                )}
                <Button
                  size="xs"
                  variant="subtle"
                  color="gray"
                  leftSection={<IconRefresh size={13} />}
                  onClick={onRetry || (() => window.location.reload())}
                >
                  Reload Page
                </Button>
              </Group>
            </Stack>
          )}
        </Stack>
      </Paper>
    </div>
  );
}
