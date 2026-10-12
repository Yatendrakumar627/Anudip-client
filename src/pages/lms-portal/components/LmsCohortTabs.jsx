import React, { useMemo } from 'react';
import { Badge, Group, Paper, Select, Text, ThemeIcon } from '@mantine/core';
import { IconSchool } from '@tabler/icons-react';
import SearchBox from '../../../components/common/SearchBox';

export default function LmsCohortTabs({
  cohortsList = [],
  activeTab,
  onTabChange,
  totalEnrolledStudents = 0,
  search = '',
  onSearchChange,
}) {
  // Batch dropdown options with learner counts
  const batchSelectOptions = useMemo(() => {
    return [
      {
        value: 'all',
        label: `All Batches (${totalEnrolledStudents} learners)`,
      },
      ...cohortsList.map((cohort) => ({
        value: cohort.id,
        label: `${cohort.name} (${cohort.students?.length || 0} learners)`,
      })),
    ];
  }, [cohortsList, totalEnrolledStudents]);

  return (
    <Paper
      id="lms-credentials-section"
      withBorder
      radius="lg"
      p="md"
      mb="lg"
      className="portal-cohort-tabs-card"
    >
      {/* Friendly Student Header with Batch Dropdown & Live Search */}
      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <div>
          <Group gap="xs" align="center">
            <ThemeIcon size={28} radius="md" color="indigo" variant="light">
              <IconSchool size={16} />
            </ThemeIcon>
            <Text fw={800} size="md" c="dark.6">
              Select Your Batch
            </Text>
            <Badge size="sm" variant="light" color="indigo">
              {cohortsList.length} Batches
            </Badge>
          </Group>
          <Text size="xs" c="dimmed" mt={2}>
            Choose your enrolled batch below to view your LMS credentials and Google Meet classroom.
          </Text>
        </div>

        {/* Controls: Batch Dropdown Selector + Student Search Bar */}
        <Group gap="sm" align="center" wrap="wrap">
          <Select
            value={activeTab}
            onChange={(val) => onTabChange(val || 'all')}
            data={batchSelectOptions}
            placeholder="Select Batch..."
            searchable
            allowDeselect={false}
            nothingFoundMessage="No batches found"
            leftSection={<IconSchool size={15} color="#4f46e5" />}
            w={{ base: '100%', sm: 300 }}
            radius="md"
            size="sm"
            aria-label="Select Batch Dropdown"
            className="lms-batch-select-dropdown"
            comboboxProps={{ shadow: 'md', transitionProps: { transition: 'pop', duration: 150 } }}
          />

          <SearchBox
            value={search}
            onChange={onSearchChange}
            placeholder="Find your name or LMS User ID..."
          />
        </Group>
      </Group>
    </Paper>
  );
}
