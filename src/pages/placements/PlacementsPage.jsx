import React, { useMemo } from 'react';
import { Anchor, Avatar, Badge, Button, Group, Paper, ScrollArea, SimpleGrid, Table, Text } from '@mantine/core';
import {
  IconActivity,
  IconChartBar,
  IconExternalLink,
  IconPlus,
  IconTargetArrow,
} from '@tabler/icons-react';
import PageHeader from '../../components/common/PageHeader';
import SearchBox from '../../components/common/SearchBox';
import StatCard from '../../components/common/StatCard';
import TableActions from '../../components/common/TableActions';
import EmptyState from '../../components/common/EmptyState';
import { formatDate, initials, initialsColor, statusColor } from '../../utils/formatters';

export default function PlacementsPage({
  students = [],
  placements = [],
  search = '',
  setSearch,
  onAdd,
  onEdit,
  onDelete,
}) {
  const filtered = useMemo(() => {
    return placements
      .map((p) => ({ ...p, student: students.find((s) => s.id === p.studentId) }))
      .filter((p) =>
        [p.student?.name, p.company, p.role, p.location, p.status].some((v) =>
          String(v || '').toLowerCase().includes(search.toLowerCase())
        )
      );
  }, [placements, students, search]);

  const placed = placements.filter((p) => p.status === 'Placed');
  const pipeline = placements.filter((p) => ['Shortlisted', 'Interviewing'].includes(p.status));
  const average = placed.length
    ? placed.reduce((sum, p) => sum + Number(p.packageLpa || 0), 0) / placed.length
    : 0;

  return (
    <>
      <PageHeader
        title="Placements"
        subtitle="Make the transition from training to employment visible and actionable."
        eyebrow="CAREER OUTCOMES"
        action={
          <Button leftSection={<IconPlus size={17} />} onClick={onAdd}>
            Add placement
          </Button>
        }
      />

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="lg">
        <StatCard
          icon={IconTargetArrow}
          label="Successfully placed"
          value={placed.length}
          detail="Learners with confirmed outcomes"
          tone="teal"
        />
        <StatCard
          icon={IconActivity}
          label="Active pipeline"
          value={pipeline.length}
          detail="Shortlisted or interviewing"
          tone="indigo"
        />
        <StatCard
          icon={IconChartBar}
          label="Average package"
          value={average ? `₹${average.toFixed(1)} LPA` : '—'}
          detail="Among placed learners only"
          tone="cyan"
        />
      </SimpleGrid>

      <div className="toolbar-row">
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder="Search learner, employer or role..."
        />
        <div className="toolbar-spacer" />
        <Text size="sm" c="dimmed">
          {placements.length} placement records
        </Text>
      </div>

      <Paper className="table-card" withBorder radius="lg">
        {filtered.length ? (
          <ScrollArea>
            <Table verticalSpacing="md" horizontalSpacing="lg" miw={900} highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Student</Table.Th>
                  <Table.Th>Employer & role</Table.Th>
                  <Table.Th>Package</Table.Th>
                  <Table.Th>Location</Table.Th>
                  <Table.Th>Offer / joining date</Table.Th>
                  <Table.Th>Pipeline status</Table.Th>
                  <Table.Th ta="right">Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtered.map((placement) => {
                  const studentName = placement.student?.name || 'Student removed';
                  const avatarColor = initialsColor(placement.student?.name || placement.company);

                  return (
                    <Table.Tr key={placement.id}>
                      <Table.Td>
                        <Group gap="sm" wrap="nowrap">
                          <Avatar color={avatarColor} radius="xl">
                            {initials(studentName)}
                          </Avatar>
                          <div>
                            <Text fw={650} size="sm">
                              {studentName}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {placement.student?.field || '—'}
                            </Text>
                          </div>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={650} size="sm">
                          {placement.company}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {placement.role}
                        </Text>
                        {placement.offerLetterUrl && (
                          <Anchor
                            href={placement.offerLetterUrl}
                            target="_blank"
                            rel="noreferrer"
                            size="xs"
                          >
                            Offer letter <IconExternalLink size={12} />
                          </Anchor>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Text fw={700} size="sm">
                          {placement.packageLpa != null && placement.packageLpa !== ''
                            ? `₹${Number(placement.packageLpa).toFixed(1)} LPA`
                            : 'Not shared'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{placement.location || '—'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{formatDate(placement.placedAt)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={statusColor(placement.status)} variant="light">
                          {placement.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <TableActions
                          onEdit={() => onEdit(placement)}
                          onDelete={() => onDelete(placement)}
                        />
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        ) : (
          <EmptyState
            title="No placement records found"
            description="Track an interview, shortlisting, offer or placement for a learner."
            action={
              <Button leftSection={<IconPlus size={16} />} onClick={onAdd}>
                Add placement
              </Button>
            }
          />
        )}
        <div className="table-footer">
          <Text size="xs" c="dimmed">
            Placement outcomes · Keep company, role, status and offer details current.
          </Text>
          <Text size="xs" c="dimmed">
            Showing {filtered.length} of {placements.length}
          </Text>
        </div>
      </Paper>
    </>
  );
}
