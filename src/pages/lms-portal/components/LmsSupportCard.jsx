import React from 'react';
import { Anchor, Button, Group, Paper, Text } from '@mantine/core';
import { IconMail, IconPhone } from '@tabler/icons-react';
import { anudipSupport } from '../../../data';

export default function LmsSupportCard({ activeCohort }) {
  const trainerName = activeCohort?.trainer || 'Assigned Facilitator';
  const supportEmail = anudipSupport.email || 'support@anudip.org';
  const whatsappNumber = activeCohort?.whatsapp || anudipSupport.whatsapp;
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}` : null;

  return (
    <Paper withBorder radius="lg" p="xl" className="lms-support-banner">
      <Group justify="space-between" align="center" wrap="wrap" gap="lg">
        <div>
          <div className="eyebrow" style={{ color: '#2563eb' }}>
            LMS SUPPORT & FACILITATION
          </div>
          <Text fw={800} size="lg" c="dark.5" mt={4}>
            Need assistance with your Anudip LMS journey?
          </Text>
          <Text size="sm" c="dimmed" mt={2}>
            Reach out directly to your assigned facilitator & trainer.
          </Text>

          <Group gap="lg" mt="md" wrap="wrap">
            <Group gap="xs">
              <Text size="xs" fw={700} c="dark.4">
                Facilitator:
              </Text>
              <Text size="xs" fw={600} c="indigo">
                {trainerName}
              </Text>
            </Group>

            {whatsappNumber && (
              <Group gap="xs">
                <IconPhone size={14} color="#16a34a" />
                <Anchor
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="xs"
                  fw={700}
                  c="green.7"
                >
                  WhatsApp: {whatsappNumber}
                </Anchor>
              </Group>
            )}

            <Group gap="xs">
              <IconMail size={14} color="#2563eb" />
              <Anchor
                href={`mailto:${supportEmail}`}
                size="xs"
                fw={700}
                c="blue.7"
              >
                {supportEmail}
              </Anchor>
            </Group>
          </Group>
        </div>

        {whatsappLink ? (
          <Button
            component="a"
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            color="teal"
            radius="md"
            leftSection={<IconPhone size={16} />}
          >
            Chat on WhatsApp
          </Button>
        ) : (
          <Button
            component="a"
            href={`mailto:${supportEmail}`}
            color="indigo"
            radius="md"
            leftSection={<IconMail size={16} />}
          >
            Email Support
          </Button>
        )}
      </Group>
    </Paper>
  );
}
