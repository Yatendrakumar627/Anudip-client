import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@mantine/core';
import { IconTable } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/common/EmptyState';
import { showSuccess } from '../../utils/notifications';
import { useLmsCohorts } from './hooks/useLmsCohorts';
import LmsHeroBanner from './components/LmsHeroBanner';
import LmsCohortTabs from './components/LmsCohortTabs';
import LmsCohortTable from './components/LmsCohortTable';
import LmsFeatureGrid from './components/LmsFeatureGrid';
import LmsSupportCard from './components/LmsSupportCard';
import LmsStudentPassModal from './components/LmsStudentPassModal';

export default function LmsPortalPage({
  students = [],
  batches = [],
  search = '',
  setSearch,
}) {
  // Resolve isolated batch cohorts with dynamic fields and Google Meet details
  const cohortsList = useLmsCohorts(batches, students);

  // Tab State: default to 'all' so all batches are visible immediately
  const [activeTab, setActiveTab] = useState('all');
  const [copiedKey, setCopiedKey] = useState(null);
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [selectedStudentForPass, setSelectedStudentForPass] = useState(null);

  // Sync activeTab if current tab was deleted
  useEffect(() => {
    if (activeTab !== 'all' && !cohortsList.some((c) => c.id === activeTab)) {
      setActiveTab('all');
    }
  }, [cohortsList, activeTab]);

  // Total enrolled learner count across all cohorts
  const totalEnrolledStudents = useMemo(() => {
    return cohortsList.reduce((acc, c) => acc + c.students.length, 0);
  }, [cohortsList]);

  // Handle 1-click clipboard copy with feedback toast
  const handleCopy = async (text, label, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      showSuccess(`${label} "${text}" copied to clipboard!`, 'Copied');
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      showSuccess(`${label} copied!`, 'Copied');
    }
  };

  const togglePasswordVisibility = (id) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const scrollToTable = () => {
    document.getElementById('lms-credentials-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Currently focused cohort for the bottom facilitator support card
  const activeCohortForSupport = useMemo(() => {
    if (activeTab === 'all') return cohortsList[0] || null;
    return cohortsList.find((c) => c.id === activeTab) || cohortsList[0] || null;
  }, [cohortsList, activeTab]);

  // Determine which cohorts to display based on selected tab and search query
  const cohortsToRender = useMemo(() => {
    const list = activeTab === 'all'
      ? cohortsList
      : cohortsList.filter((c) => c.id === activeTab);

    const q = search.toLowerCase().trim();
    if (!q || activeTab !== 'all') return list;

    // In 'all' view with search, filter out cohorts that have 0 matching learners
    return list.filter((cohort) =>
      cohort.students.some((s) =>
        [s.name, s.lmsUsername, s.email, s.phone, s.batch, s.field, s.trainer].some((v) =>
          String(v || '').toLowerCase().includes(q)
        ) ||
        (s.customFields || []).some((cf) =>
          `${cf.label}: ${cf.value}`.toLowerCase().includes(q)
        )
      )
    );
  }, [cohortsList, activeTab, search]);

  return (
    <div className="lms-portal-root">
      {/* 1. Hero Header Banner */}
      <LmsHeroBanner onScrollToTable={scrollToTable} />

      {/* 2. Cohort Tabs & Live Search Bar */}
      <LmsCohortTabs
        cohortsList={cohortsList}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalEnrolledStudents={totalEnrolledStudents}
        search={search}
        onSearchChange={setSearch}
      />

      {/* 4. Batch-Isolated Cohort Tables */}
      {cohortsToRender.length > 0 ? (
        cohortsToRender.map((cohort) => (
          <LmsCohortTable
            key={cohort.id}
            cohort={cohort}
            search={search}
            copiedKey={copiedKey}
            revealedPasswords={revealedPasswords}
            onCopy={handleCopy}
            onTogglePassword={togglePasswordVisibility}
            onSelectStudent={setSelectedStudentForPass}
          />
        ))
      ) : (
        <EmptyState
          title="No cohorts found"
          description="Create a batch in the Spreadsheet section to populate the LMS Portal."
          action={
            <Button
              component={Link}
              to="/batches"
              size="sm"
              color="indigo"
              leftSection={<IconTable size={16} />}
            >
              Go to Batches Spreadsheet
            </Button>
          }
        />
      )}

      {/* 5. Feature Highlights Grid */}
      <LmsFeatureGrid />

      {/* 6. Trainer Facilitator & WhatsApp Support Card */}
      <LmsSupportCard activeCohort={activeCohortForSupport} />

      {/* 7. Student LMS Identity Pass Modal */}
      <LmsStudentPassModal
        opened={!!selectedStudentForPass}
        onClose={() => setSelectedStudentForPass(null)}
        student={selectedStudentForPass}
        copiedKey={copiedKey}
        onCopy={handleCopy}
      />
    </div>
  );
}
