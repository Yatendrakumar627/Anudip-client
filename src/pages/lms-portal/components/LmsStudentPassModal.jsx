import React from 'react';
import {
  Avatar,
  Badge,
  Button,
  Divider,
  Group,
  Modal,
  SimpleGrid,
  Text,
  ThemeIcon,
} from '@mantine/core';
import { IconCopy, IconExternalLink, IconId, IconVideo } from '@tabler/icons-react';
import { initials, initialsColor } from '../../../utils/formatters';
import { LMS_LOGIN_URL } from './LmsHeroBanner';

export default function LmsStudentPassModal({
  opened,
  onClose,
  student,
  copiedKey,
  onCopy,
}) {
  if (!student) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon size={28} radius="md" color="indigo" variant="light">
            <IconId size={16} />
          </ThemeIcon>
          <Text fw={800} size="md">
            Student LMS Identity Pass
          </Text>
        </Group>
      }
      centered
      size="md"
      radius="lg"
    >
      <div className="lms-pass-modal-content">
        {/* Student ID Card Container */}
        <div className="lms-student-pass-card">
          <div className="pass-card-top">
            <Group justify="space-between" align="flex-start">
              <div>
                <Badge color="indigo" size="sm" variant="filled">
                  {student.batchCode || 'ANUDIP'}
                </Badge>
                <Text fw={800} size="lg" mt={4} c="dark.5">
                  {student.name}
                </Text>
                <Text size="xs" c="dimmed">
                  {[student.email, student.phone].filter(Boolean).join(' • ') || 'Verified Anudip Learner'}
                </Text>
              </div>
              <Avatar
                size={48}
                radius="xl"
                color={initialsColor(student.name)}
              >
                {initials(student.name)}
              </Avatar>
            </Group>
          </div>

          <Divider my="sm" />

          {/* Batch & Trainer Info */}
          <div className="pass-batch-info">
            <SimpleGrid cols={2} spacing="xs">
              <div>
                <Text size="xs" c="dimmed">
                  Enrolled Batch:
                </Text>
                <Text fw={700} size="sm" c="dark.4">
                  {student.batch}
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  Assigned Trainer:
                </Text>
                <Text fw={700} size="sm" c="dark.4">
                  {student.trainer || 'Not Assigned'}
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  Course Track:
                </Text>
                <Text fw={600} size="xs" c="indigo">
                  {student.field || 'General Track'}
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  Class Timing:
                </Text>
                <Text fw={600} size="xs" c="dark.4">
                  {student.timing || 'Schedule TBA'}
                </Text>
              </div>
            </SimpleGrid>
          </div>

          {/* Dynamic Custom Fields from Trainer's Batch Table */}
          {student.customFields && student.customFields.length > 0 && (
            <div className="pass-dynamic-fields" style={{ marginTop: 12 }}>
              <Text size="xs" fw={700} c="dimmed" mb={4}>
                Batch Dynamic Attributes:
              </Text>
              <Group gap={6} wrap="wrap">
                {student.customFields.map((cf) => (
                  <Badge
                    key={cf.key}
                    color={
                      cf.value.toLowerCase() === 'yes'
                        ? 'teal'
                        : cf.value.toLowerCase() === 'no'
                        ? 'red'
                        : 'blue'
                    }
                    variant="filled"
                    size="sm"
                  >
                    {cf.label}: {cf.value}
                  </Badge>
                ))}
              </Group>
            </div>
          )}

          {/* Big LMS Credential Box */}
          <div className="pass-credentials-box">
            <Text size="xs" fw={700} c="indigo" mb={6}>
              OFFICIAL ANUDIP LMS CREDENTIALS
            </Text>

            <div className="credential-row">
              <div>
                <span className="cred-label">LMS User Name:</span>
                <span className="cred-val">{student.lmsUsername}</span>
              </div>
              <Button
                size="xs"
                variant="light"
                color="indigo"
                leftSection={<IconCopy size={13} />}
                onClick={() =>
                  onCopy(
                    student.lmsUsername,
                    'LMS User Name',
                    'modal-u'
                  )
                }
              >
                {copiedKey === 'modal-u' ? 'Copied!' : 'Copy'}
              </Button>
            </div>

            <div className="credential-row" style={{ marginTop: 8 }}>
              <div>
                <span className="cred-label">Password:</span>
                <span className="cred-val pass">{student.lmsPassword}</span>
              </div>
              <Button
                size="xs"
                variant="light"
                color="teal"
                leftSection={<IconCopy size={13} />}
                onClick={() =>
                  onCopy(
                    student.lmsPassword,
                    'Password',
                    'modal-p'
                  )
                }
              >
                {copiedKey === 'modal-p' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>
        </div>

        {/* Classroom Google Meet & Direct Redirect */}
        <div style={{ marginTop: 18 }}>
          {student.meetLink && (
            <Button
              component="a"
              href={student.meetLink}
              target="_blank"
              rel="noopener noreferrer"
              fullWidth
              size="md"
              color="teal"
              variant="light"
              leftSection={<IconVideo size={18} />}
              mb="sm"
            >
              Join Google Meet Classroom ({student.timing || 'Scheduled Session'}) 📹
            </Button>
          )}

          <Button
            component="a"
            href={LMS_LOGIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            fullWidth
            size="md"
            color="indigo"
            rightSection={<IconExternalLink size={16} />}
          >
            Proceed to LMS Login (learn.anudip.org) ↗
          </Button>
          <Text size="xs" ta="center" c="dimmed" mt={8}>
            Direct URL: <code>https://learn.anudip.org/login/index.php</code>
          </Text>
        </div>
      </div>
    </Modal>
  );
}
