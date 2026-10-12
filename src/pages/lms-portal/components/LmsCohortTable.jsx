import React, { useMemo, useState } from 'react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Group,
  Paper,
  ScrollArea,
  Table,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import {
  IconCheck,
  IconClock,
  IconCopy,
  IconDownload,
  IconExternalLink,
  IconEye,
  IconEyeOff,
  IconFileSpreadsheet,
  IconId,
  IconKey,
  IconMail,
  IconSearch,
  IconTable,
  IconTag,
  IconUser,
  IconUsers,
  IconVideo,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import EmptyState from '../../../components/common/EmptyState';
import { initials, initialsColor, statusColor } from '../../../utils/formatters';
import { showSuccess } from '../../../utils/notifications';
import { LMS_LOGIN_URL } from './LmsHeroBanner';

export default function LmsCohortTable({
  cohort,
  search = '',
  copiedKey,
  revealedPasswords,
  onCopy,
  onTogglePassword,
  onSelectStudent,
}) {
  const [tableSearch, setTableSearch] = useState('');
  const [revealAll, setRevealAll] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  // 1. STRICT RESTRICTION PIPELINE: Detect all hidden columns from batch configuration
  const restrictedKeys = useMemo(() => {
    const set = new Set(
      (cohort.restrictedKeys || []).map((k) => String(k).toLowerCase().trim())
    );
    (cohort.columns || []).forEach((c) => {
      if (c && (c.hidden || c.hiddenOnLms || c.visible === false)) {
        if (c.key) {
          const k = String(c.key).toLowerCase().trim();
          set.add(k);
          set.add(k.replace(/[^a-z0-9]/g, ''));
        }
        if (c.label) {
          const l = String(c.label).toLowerCase().trim();
          set.add(l);
          set.add(l.replace(/[^a-z0-9]/g, ''));
        }
      }
    });
    return set;
  }, [cohort.restrictedKeys, cohort.columns]);

  const isRestrictedKey = (k = '', l = '') => {
    const normK = String(k || '').toLowerCase().trim();
    const normL = String(l || '').toLowerCase().trim();
    const cleanK = normK.replace(/[^a-z0-9]/g, '');
    const cleanL = normL.replace(/[^a-z0-9]/g, '');
    return (
      restrictedKeys.has(normK) ||
      restrictedKeys.has(normL) ||
      (cleanK && restrictedKeys.has(cleanK)) ||
      (cleanL && restrictedKeys.has(cleanL))
    );
  };

  // 2. Derive visible cohort columns - STRICTLY EXCLUDE any restricted column
  const cohortCols = useMemo(() => {
    const targetCols = (cohort.columns || []).filter((c) => {
      if (!c) return false;
      if (c.hidden || c.hiddenOnLms || c.visible === false) return false;
      return !isRestrictedKey(c.key, c.label);
    });

    const cols = [];
    const seen = new Set();

    targetCols.forEach((col) => {
      const k = String(col.key || '').toLowerCase().trim();
      const l = String(col.label || col.key || '').toLowerCase().trim();
      if (isRestrictedKey(k, l)) return; // Strictly restricted!

      const id = l || k;
      if (seen.has(id)) return;
      seen.add(id);

      if (k === 'name' || l === 'student name') {
        cols.push({ type: 'name', label: 'Student Name', key: 'name' });
      } else if (k === 'email' || l === 'email') {
        cols.push({ type: 'email', label: 'Email', key: 'email' });
      } else if (k === 'lmsusername' || l === 'user name' || l === 'lms user id') {
        cols.push({ type: 'lmsUsername', label: 'User Name', key: 'lmsUsername' });
      } else if (k === 'lmspassword' || l === 'password') {
        cols.push({ type: 'lmsPassword', label: 'Password', key: 'lmsPassword' });
      } else {
        cols.push({
          type: 'custom',
          key: col.key,
          label: col.label || col.key,
          colType: col.type || 'text',
        });
      }
    });

    // Ensure core identification columns exist ONLY IF NOT RESTRICTED
    const existingTypes = new Set(cols.map((c) => c.type));
    if (!existingTypes.has('name') && !isRestrictedKey('name', 'student name')) {
      cols.unshift({ type: 'name', label: 'Student Name', key: 'name' });
    }
    if (
      !existingTypes.has('lmsUsername') &&
      !isRestrictedKey('lmsusername', 'user name') &&
      !isRestrictedKey('lmsusername', 'lms user id')
    ) {
      cols.push({ type: 'lmsUsername', label: 'User Name', key: 'lmsUsername' });
    }
    if (!existingTypes.has('lmsPassword') && !isRestrictedKey('lmspassword', 'password')) {
      cols.push({ type: 'lmsPassword', label: 'Password', key: 'lmsPassword' });
    }
    if (
      !existingTypes.has('email') &&
      !isRestrictedKey('email', 'email') &&
      !isRestrictedKey('email', 'email id')
    ) {
      const hasAnyEmail = cohort.students.some((s) => !!s.email);
      if (hasAnyEmail) {
        cols.push({ type: 'email', label: 'Email', key: 'email' });
      }
    }

    return cols;
  }, [cohort.columns, cohort.students, restrictedKeys]);

  // 3. Search and filtering - Strictly never search across restricted fields
  const q = (tableSearch || search).toLowerCase().trim();
  const matchingStudents = useMemo(() => {
    return cohort.students.filter((s) => {
      if (!q) return true;
      const searchableFields = [
        s.name,
        s.lmsUsername,
        s.batch,
        s.field,
        s.trainer,
        // Only include email/phone if NOT restricted
        !isRestrictedKey('email', 'email id') ? s.email : '',
        !isRestrictedKey('phone', 'mobile') ? s.phone : '',
      ];

      const matchesCore = searchableFields.some((v) =>
        String(v || '').toLowerCase().includes(q)
      );
      if (matchesCore) return true;

      // Only check custom fields that are NOT restricted
      return (s.customFields || []).some(
        (cf) =>
          !isRestrictedKey(cf.key, cf.label) &&
          `${cf.label}: ${cf.value}`.toLowerCase().includes(q)
      );
    });
  }, [cohort.students, q, restrictedKeys]);

  // 4. Facilitator Quick Actions: Copy all credentials for roster communication
  const handleCopyAllCredentials = () => {
    if (!matchingStudents.length) return;
    const lines = [
      `🎓 Cohort: ${cohort.name} (${cohort.code || 'ANUDIP'})`,
      `Trainer: ${cohort.trainer || 'Unassigned'} | Class Timing: ${cohort.timing || 'Schedule TBA'}`,
      `-------------------------------------------------------`,
    ];
    matchingStudents.forEach((s, idx) => {
      lines.push(`${idx + 1}. ${s.name}`);
      lines.push(`   Username: ${s.lmsUsername}`);
      lines.push(`   Password: ${s.lmsPassword || 'Anudip@2026'}`);
      if (s.meetLink) lines.push(`   Meet Link: ${s.meetLink}`);
      lines.push('');
    });
    lines.push(`Official LMS Portal: ${LMS_LOGIN_URL}`);
    navigator.clipboard.writeText(lines.join('\n'));
    showSuccess(
      `Copied credentials for ${matchingStudents.length} learners to clipboard!`,
      'Roster Copied'
    );
  };

  // 5. Facilitator Quick Action: Export CSV of visible roster
  const handleExportCsv = () => {
    if (!matchingStudents.length) return;
    const headerRow = ['#', ...cohortCols.map((c) => c.label)];
    const csvRows = [headerRow.join(',')];

    matchingStudents.forEach((student, idx) => {
      const rowVals = [
        idx + 1,
        ...cohortCols.map((col) => {
          if (col.type === 'name') return `"${student.name.replace(/"/g, '""')}"`;
          if (col.type === 'email') return `"${(student.email || '').replace(/"/g, '""')}"`;
          if (col.type === 'lmsUsername') return `"${(student.lmsUsername || '').replace(/"/g, '""')}"`;
          if (col.type === 'lmsPassword') return `"${(student.lmsPassword || '').replace(/"/g, '""')}"`;

          // Custom column
          const k = col.key;
          const l = col.label;
          if (isRestrictedKey(k, l)) return '""'; // Never export restricted detail
          const val =
            (student.rawRow && (student.rawRow[k] ?? student.rawRow[l])) ??
            student[k] ??
            (student.customFields?.find((f) => f.key === k || f.label === l)?.value || '');
          return `"${String(val || '').replace(/"/g, '""')}"`;
        }),
      ];
      csvRows.push(rowVals.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LMS_Roster_${cohort.code || 'Cohort'}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess('Exported clean roster CSV.', 'Download Complete');
  };

  return (
    <Paper
      id={`lms-cohort-table-${cohort.id}`}
      className="table-card lms-cohort-elevated-card"
      withBorder
      radius="lg"
      mb="xl"
    >
      {/* ATTACHED HEADER: Cohort Identity & Facilitator Classroom Bar */}
      <div className="portal-table-attached-header">
        {/* Top Level: Cohort Identity */}
        <div className="attached-header-top">
          <div>
            <Group gap="xs" mb={4} align="center">
              <Badge color="indigo" size="md" variant="filled" radius="sm">
                {cohort.code || 'COHORT'}
              </Badge>
              <Badge color={statusColor(cohort.status)} variant="light" size="md">
                ● {cohort.status || 'Active'}
              </Badge>
              <Badge color="gray" variant="outline" size="md">
                {cohort.field || 'Training Track'}
              </Badge>
            </Group>

            <Text fw={800} size="xl" c="dark.6">
              Cohort: {cohort.name}
            </Text>
            <Text size="xs" c="dimmed">
              Official Anudip LMS Credentials & Real-Time Classroom Roster
            </Text>
          </div>

          <Group gap="sm" wrap="wrap" align="center">
            <Button
              component="a"
              href={LMS_LOGIN_URL}
              target="_blank"
              rel="noreferrer"
              color="indigo"
              size="sm"
              radius="md"
              rightSection={<IconExternalLink size={15} />}
            >
              LMS Portal Direct ↗
            </Button>
          </Group>
        </div>

        {/* Bottom Level: Attached Metadata & Google Meet */}
        <div className="attached-header-meta-bar">
          <Group justify="space-between" align="center" wrap="wrap" gap="md" w="100%">
            <Group gap="lg" wrap="wrap">
              <Group gap={6}>
                <IconUser size={16} color="#4f46e5" />
                <Text size="xs" c="dark.4">
                  Trainer: <strong>{cohort.trainer || 'Unassigned'}</strong>
                </Text>
              </Group>

              <Group gap={6}>
                <IconClock size={16} color="#0d9488" />
                <Text size="xs" c="dark.4">
                  Class Timing: <strong>{cohort.timing || 'Schedule TBA'}</strong>
                </Text>
              </Group>

              <Group gap={6}>
                <IconUsers size={16} color="#64748b" />
                <Text size="xs" c="dark.4">
                  Enrolled: <strong>{matchingStudents.length} Students</strong>
                </Text>
              </Group>

              <Group gap={6}>
                <IconTag size={15} color="#d97706" />
                <Text size="xs" c="dimmed">
                  Curriculum Track: <strong>{cohort.field || 'General Track'}</strong>
                </Text>
              </Group>
            </Group>

            <Group gap="xs" wrap="wrap">
              {cohort.meetLink ? (
                <Button
                  component="a"
                  href={cohort.meetLink}
                  target="_blank"
                  rel="noreferrer"
                  color="teal"
                  size="sm"
                  radius="md"
                  leftSection={<IconVideo size={16} />}
                  className="live-meet-btn"
                >
                  Join Google Meet Classroom 📹
                </Button>
              ) : (
                <Badge size="md" variant="light" color="orange">
                  Meet link pending facilitator schedule
                </Badge>
              )}
            </Group>
          </Group>
        </div>

        {/* QUICK ACTION ROSTER CONTROLS TOOLBAR */}
        <div className="lms-roster-action-toolbar">
          <Group justify="space-between" align="center" wrap="wrap" gap="sm" w="100%">
            <TextInput
              placeholder="Filter roster..."
              size="xs"
              radius="md"
              leftSection={<IconSearch size={14} />}
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="lms-roster-search-input"
            />

            <Group gap="xs" wrap="wrap">
              <Tooltip label={revealAll ? 'Mask all passwords' : 'Show all passwords'} withArrow>
                <Button
                  size="xs"
                  variant="default"
                  radius="md"
                  leftSection={revealAll ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                  onClick={() => setRevealAll((prev) => !prev)}
                >
                  {revealAll ? 'Mask Passwords' : 'Show Passwords'}
                </Button>
              </Tooltip>

              <Tooltip label="Copy all student credentials to clipboard" withArrow>
                <Button
                  size="xs"
                  variant="light"
                  color="indigo"
                  radius="md"
                  leftSection={<IconCopy size={14} />}
                  onClick={handleCopyAllCredentials}
                >
                  Copy All
                </Button>
              </Tooltip>

              <Tooltip label="Download visible roster as CSV" withArrow>
                <Button
                  size="xs"
                  variant="light"
                  color="teal"
                  radius="md"
                  leftSection={<IconDownload size={14} />}
                  onClick={handleExportCsv}
                >
                  Export CSV
                </Button>
              </Tooltip>

              <Button
                size="xs"
                variant="subtle"
                color="gray"
                radius="md"
                onClick={() => setIsCompact((prev) => !prev)}
              >
                {isCompact ? 'Comfortable' : 'Compact'}
              </Button>
            </Group>
          </Group>
        </div>
      </div>

      {/* Table Body */}
      {matchingStudents.length > 0 ? (
        <ScrollArea type="auto" offsetScrollbars>
          <Table
            verticalSpacing={isCompact ? 'xs' : 'sm'}
            horizontalSpacing="md"
            withTableBorder
            withColumnBorders
            striped
            highlightOnHover
            className="lms-credential-data-table"
            miw={1080}
          >
            <Table.Thead>
              <Table.Tr className="lms-th-row">
                <Table.Th w={55} ta="center" className="lms-th-cell">
                  #
                </Table.Th>

                {cohortCols.map((col) => {
                  let icon = null;
                  if (col.type === 'name') icon = <IconUser size={13} color="#93c5fd" />;
                  else if (col.type === 'email') icon = <IconMail size={13} color="#93c5fd" />;
                  else if (col.type === 'lmsUsername') icon = <IconId size={13} color="#93c5fd" />;
                  else if (col.type === 'lmsPassword') icon = <IconKey size={13} color="#93c5fd" />;
                  else icon = <IconTag size={13} color="#93c5fd" />;

                  return (
                    <Table.Th
                      key={col.key || col.type}
                      className="lms-th-cell"
                    >
                      <Group gap={6} wrap="nowrap" align="center">
                        {icon}
                        <span>{col.label}</span>
                      </Group>
                    </Table.Th>
                  );
                })}

                <Table.Th
                  ta="center"
                  w={150}
                  style={{ minWidth: 145 }}
                  className="lms-th-cell lms-th-portal"
                >
                  <Group gap={6} justify="center" wrap="nowrap" align="center">
                    <IconExternalLink size={13} color="#93c5fd" />
                    <span>LMS PORTAL</span>
                  </Group>
                </Table.Th>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {matchingStudents.map((student, index) => {
                const uNameKey = `u-${student.id}`;
                const passKey = `p-${student.id}`;
                const isCopiedUName = copiedKey === uNameKey;
                const isCopiedPass = copiedKey === passKey;
                const isPassRevealed = revealAll || !!revealedPasswords[student.id];

                return (
                  <Table.Tr
                    key={student.id}
                    className="clickable-student-row"
                    onClick={() => onSelectStudent(student)}
                    title={`Click row to view ${student.name}'s LMS Pass Card`}
                  >
                    {/* Index */}
                    <Table.Td ta="center" w={55}>
                      <span className="lms-num-badge">{index + 1}</span>
                    </Table.Td>

                    {cohortCols.map((col) => {
                      if (col.type === 'name') {
                        return (
                          <Table.Td key="name">
                            <Group gap="sm" wrap="nowrap">
                              <Avatar
                                color={initialsColor(student.name)}
                                radius="xl"
                                size={isCompact ? 28 : 34}
                              >
                                {initials(student.name)}
                              </Avatar>
                              <div>
                                <Group gap={6} align="center">
                                  <Text fw={750} size="sm" c="dark.6">
                                    {student.name}
                                  </Text>
                                  <Tooltip label="Click to view Student Pass Card" withArrow>
                                    <IconId
                                      size={14}
                                      color="#6366f1"
                                      style={{ opacity: 0.7 }}
                                    />
                                  </Tooltip>
                                </Group>
                              </div>
                            </Group>
                          </Table.Td>
                        );
                      }

                      if (col.type === 'email') {
                        return (
                          <Table.Td key="email">
                            <Text size="xs" c={student.email ? 'dark.4' : 'dimmed'}>
                              {student.email || <span className="placeholder-cell">—</span>}
                            </Text>
                          </Table.Td>
                        );
                      }

                      if (col.type === 'lmsUsername') {
                        return (
                          <Table.Td key="lmsUsername">
                            <Group gap="xs" wrap="nowrap" align="center">
                              <code className="lms-code-badge user">{student.lmsUsername}</code>
                              <Tooltip
                                label={isCopiedUName ? 'Copied!' : 'Copy User Name'}
                                withArrow
                                position="top"
                              >
                                <ActionIcon
                                  variant="light"
                                  color={isCopiedUName ? 'teal' : 'indigo'}
                                  size="sm"
                                  radius="md"
                                  className="lms-copy-action-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onCopy(student.lmsUsername, 'User Name', uNameKey);
                                  }}
                                  aria-label="Copy User Name"
                                >
                                  {isCopiedUName ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                </ActionIcon>
                              </Tooltip>
                            </Group>
                          </Table.Td>
                        );
                      }

                      if (col.type === 'lmsPassword') {
                        return (
                          <Table.Td key="lmsPassword">
                            <Group gap="xs" wrap="nowrap" align="center">
                              <code className="lms-code-badge pass">
                                {isPassRevealed ? student.lmsPassword : '••••••••'}
                              </code>
                              <Tooltip
                                label={isPassRevealed ? 'Hide Password' : 'Show Password'}
                                withArrow
                                position="top"
                              >
                                <ActionIcon
                                  variant="subtle"
                                  color="gray"
                                  size="sm"
                                  radius="md"
                                  className="lms-copy-action-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onTogglePassword(student.id);
                                  }}
                                  aria-label="Toggle password"
                                >
                                  {isPassRevealed ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                                </ActionIcon>
                              </Tooltip>
                              <Tooltip
                                label={isCopiedPass ? 'Copied!' : 'Copy Password'}
                                withArrow
                                position="top"
                              >
                                <ActionIcon
                                  variant="light"
                                  color={isCopiedPass ? 'teal' : 'green'}
                                  size="sm"
                                  radius="md"
                                  className="lms-copy-action-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onCopy(student.lmsPassword, 'Password', passKey);
                                  }}
                                  aria-label="Copy Password"
                                >
                                  {isCopiedPass ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                </ActionIcon>
                              </Tooltip>
                            </Group>
                          </Table.Td>
                        );
                      }

                      // 6. CUSTOM DYNAMIC COLUMN - STRICT RESTRICTION CHECK
                      const k = col.key;
                      const l = col.label;

                      if (isRestrictedKey(k, l)) {
                        // Completely restricted by admin in Batch Page: never display!
                        return null;
                      }

                      const keysToTry = [k, l];
                      let val = null;
                      for (const testKey of keysToTry) {
                        if (
                          student.rawRow &&
                          student.rawRow[testKey] != null &&
                          String(student.rawRow[testKey]).trim() !== ''
                        ) {
                          val = student.rawRow[testKey];
                          break;
                        }
                        if (student[testKey] != null && String(student[testKey]).trim() !== '') {
                          val = student[testKey];
                          break;
                        }
                      }

                      if (val == null && student.customFields && Array.isArray(student.customFields)) {
                        const cf = student.customFields.find(
                          (f) =>
                            keysToTry.includes(f.key) ||
                            keysToTry.some((tk) => tk.toLowerCase() === (f.label || '').toLowerCase())
                        );
                        if (cf && cf.value != null && cf.value !== '—') {
                          val = cf.value;
                        }
                      }

                      const strVal = String(val != null ? val : '').trim();
                      const lowerVal = strVal.toLowerCase();
                      const normColKey = String(col.key || '').toLowerCase();
                      const normColLabel = String(col.label || '').toLowerCase();

                      // Smart Cell Renderers based on Attribute Types
                      let cellContent = <span className="placeholder-cell">—</span>;

                      if (strVal && strVal !== '—') {
                        if (lowerVal === 'yes' || lowerVal === 'no') {
                          cellContent = (
                            <Badge
                              size="xs"
                              color={lowerVal === 'yes' ? 'teal' : 'red'}
                              variant="light"
                            >
                              {strVal}
                            </Badge>
                          );
                        } else if (normColKey.includes('studentcode') || normColLabel.includes('student code')) {
                          cellContent = (
                            <code className="lms-code-badge user">{strVal}</code>
                          );
                        } else if (normColKey.includes('disabilitytype') || normColLabel.includes('disability type')) {
                          cellContent = (
                            <Badge size="xs" variant="light" color="grape">
                              {strVal}
                            </Badge>
                          );
                        } else if (normColKey.includes('percentage') || normColLabel.includes('percentage') || normColLabel.includes('%')) {
                          cellContent = (
                            <Badge size="xs" variant="light" color="teal">
                              {strVal.replace('%', '')}%
                            </Badge>
                          );
                        } else if (normColKey === 'age' || normColLabel === 'age') {
                          cellContent = (
                            <Badge size="xs" variant="light" color="blue">
                              {strVal} yrs
                            </Badge>
                          );
                        } else if (normColKey === 'gender' || normColLabel === 'gender') {
                          cellContent = (
                            <Badge
                              size="xs"
                              variant="light"
                              color={lowerVal === 'female' ? 'pink' : 'cyan'}
                            >
                              {strVal}
                            </Badge>
                          );
                        } else if (normColKey.includes('qualification') || normColLabel.includes('qualification')) {
                          cellContent = (
                            <Badge size="xs" variant="outline" color="dark">
                              {strVal}
                            </Badge>
                          );
                        } else {
                          cellContent = (
                            <Text size="xs" fw={600} c="dark.4">
                              {strVal}
                            </Text>
                          );
                        }
                      }

                      return <Table.Td key={col.key || col.label}>{cellContent}</Table.Td>;
                    })}

                    {/* Direct LMS Login */}
                    <Table.Td
                      ta="center"
                      style={{ width: 150, minWidth: 145 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        component="a"
                        href={LMS_LOGIN_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="xs"
                        radius="md"
                        className="lms-portal-launch-btn"
                        rightSection={<IconExternalLink size={13} />}
                      >
                        Launch LMS
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      ) : (
        <EmptyState
          title={`No learners found for ${cohort.name}`}
          description={
            q
              ? `No student matches "${q}" in this cohort.`
              : 'Add students to this batch in the Spreadsheet table to generate their LMS credentials.'
          }
          action={
            <Button
              component={Link}
              to="/batches"
              size="xs"
              color="indigo"
              leftSection={<IconTable size={15} />}
            >
              Open Batch in Spreadsheet
            </Button>
          }
        />
      )}

      {/* Footer */}
      <div className="table-footer">
        <Text size="xs" c="dimmed">
          Official Anudip Foundation LMS Portal &bull; Redirect link: <code>learn.anudip.org/login/index.php</code>
        </Text>
        <Text size="xs" c="dimmed">
          Showing {matchingStudents.length} of {cohort.students.length} accounts in {cohort.name}
        </Text>
      </div>
    </Paper>
  );
}
