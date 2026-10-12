import React, { useMemo, useState } from 'react';
import {
  Button,
  Group,
  SegmentedControl,
  Text,
} from '@mantine/core';
import {
  IconFileSpreadsheet,
  IconLayoutGrid,
  IconPlus,
  IconTable,
} from '@tabler/icons-react';
import PageHeader from '../../components/common/PageHeader';
import DynamicBatchTable from '../../components/batches/DynamicBatchTable';
import ImportEnrollmentModal from '../../components/batches/ImportEnrollmentModal';
import { showError, showSuccess } from '../../utils/notifications';
import BatchStats from './components/BatchStats';
import BatchCardsGrid from './components/BatchCardsGrid';
import BatchRosterDrawer from './components/BatchRosterDrawer';
import BatchDeleteModal from './components/BatchDeleteModal';

export default function BatchesPage({
  students = [],
  sessions = [],
  attendance = [],
  placements = [],
  batches = [],
  onAddBatch,
  onEditBatch,
  onDeleteBatch,
  onDeleteBatchWithOptions,
  onClearBatchTable,
  onAddStudentToBatch,
  onEditStudent,
  onUpdateBatch,
  onCreateBatch,
}) {
  const [viewMode, setViewMode] = useState('spreadsheet');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fieldFilter, setFieldFilter] = useState('all');

  // Active batch selection & tightly coupled editor state for spreadsheet view
  const [activeBatchId, setActiveBatchId] = useState(null);
  const [openDetailsEditor, setOpenDetailsEditor] = useState(false);

  // Import Enrollment Modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const handleImportComplete = async ({ mode, batchId, batchPayload }) => {
    try {
      if (mode === 'create') {
        const createFn = onCreateBatch || onAddBatch;
        const res = await createFn?.(batchPayload);
        setViewMode('spreadsheet');
        if (res?.id) {
          setActiveBatchId(res.id);
        }
      } else {
        await onUpdateBatch?.(batchPayload);
        setViewMode('spreadsheet');
        if (batchId) {
          setActiveBatchId(batchId);
        }
      }
    } catch (err) {
      showError(err, 'Failed to import enrollment data');
    }
  };

  // Batch Delete with Table Options Modal state
  const [batchToDelete, setBatchToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Selected Batch for Roster Drawer
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [rosterSearch, setRosterSearch] = useState('');

  // Handle Edit Batch from Cohort Cards: seamlessly switch to dynamic table with batch details editor open!
  const handleEditBatchFromCard = (batch) => {
    setActiveBatchId(batch.id);
    setViewMode('spreadsheet');
    setOpenDetailsEditor(true);
    showSuccess(`Opened "${batch.name}" to edit batch details alongside live spreadsheet table.`);
  };

  // Extract unique batches list
  const allBatches = useMemo(() => {
    if (batches && batches.length) return batches;
    // Fallback: derive batches dynamically from students & sessions if needed
    const studentBatchNames = [...new Set(students.map((s) => s.batch).filter(Boolean))];
    return studentBatchNames.map((name, index) => ({
      id: `batch_${index + 1}`,
      name,
      code: '',
      field: students.find((s) => s.batch === name)?.field || '',
      trainer: '',
      timing: '',
      meetLink: '',
      status: 'Active',
      description: '',
    }));
  }, [batches, students]);

  // Sync activeBatchId with current batch list
  React.useEffect(() => {
    if ((!activeBatchId || !allBatches.some((b) => b.id === activeBatchId)) && allBatches.length > 0) {
      setActiveBatchId(allBatches[0].id);
    }
  }, [allBatches, activeBatchId]);

  // Filter batches
  const filteredBatches = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allBatches.filter((b) => {
      const matchSearch =
        !q ||
        [b.name, b.code, b.field, b.trainer, b.timing].some((v) =>
          String(v || '').toLowerCase().includes(q)
        );
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;
      const matchField = fieldFilter === 'all' || b.field === fieldFilter;
      return matchSearch && matchStatus && matchField;
    });
  }, [allBatches, search, statusFilter, fieldFilter]);

  // Unique fields for filter
  const uniqueFields = useMemo(() => {
    const set = new Set(allBatches.map((b) => b.field).filter(Boolean));
    return [{ value: 'all', label: 'All fields' }, ...[...set].sort().map((f) => ({ value: f, label: f }))];
  }, [allBatches]);

  // Metrics
  const totalEnrolled = students.length;
  const activeBatchesCount = useMemo(
    () => allBatches.filter((b) => b.status === 'Active').length,
    [allBatches]
  );
  const placedCount = useMemo(
    () => placements.filter((p) => p.status === 'Placed').length,
    [placements]
  );

  // Enrolled students in the active drawer batch
  const enrolledStudents = useMemo(() => {
    if (!selectedBatch) return [];
    const q = rosterSearch.toLowerCase().trim();
    return students
      .filter((s) => s.batch === selectedBatch.name || s.batch === selectedBatch.id)
      .filter((s) => {
        if (!q) return true;
        return [s.name, s.lmsUsername, s.email, s.phone].some((v) =>
          String(v || '').toLowerCase().includes(q)
        );
      });
  }, [students, selectedBatch, rosterSearch]);

  const handleCopyLms = React.useCallback((text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showSuccess(`Copied "${text}" to clipboard!`, 'Copied');
  }, []);

  return (
    <>
      <PageHeader
        title="Student Batches"
        subtitle="Manage training cohorts, facilitators, schedules, and view enrolled learner details."
        eyebrow="COHORT MANAGEMENT"
        action={
          <Group gap="xs" className="batch-header-actions-group">
            <Button
              leftSection={<IconFileSpreadsheet size={17} />}
              variant="light"
              color="teal"
              onClick={() => setIsImportModalOpen(true)}
              className="batch-header-action-btn"
            >
              Import Excel / Report
            </Button>
            <Button
              leftSection={<IconPlus size={17} />}
              onClick={() => onAddBatch?.()}
              color="indigo"
              className="batch-header-action-btn"
            >
              Create Batch
            </Button>
          </Group>
        }
      />

      {/* 1. Metric Cards */}
      <BatchStats
        totalCohorts={allBatches.length}
        activeBatchesCount={activeBatchesCount}
        totalEnrolled={totalEnrolled}
        totalSessions={sessions.length}
        placedCount={placedCount}
      />

      {/* 2. View Switcher: Dynamic Spreadsheet vs Cohort Cards */}
      <div className="batch-view-switcher-wrap">
        <SegmentedControl
          value={viewMode}
          onChange={setViewMode}
          fullWidth
          className="batch-view-segmented"
          data={[
            {
              value: 'spreadsheet',
              label: (
                <Group gap={6} justify="center" wrap="nowrap">
                  <IconTable size={16} />
                  <span>Dynamic Spreadsheet</span>
                </Group>
              ),
            },
            {
              value: 'cards',
              label: (
                <Group gap={6} justify="center" wrap="nowrap">
                  <IconLayoutGrid size={16} />
                  <span>Cohort Cards</span>
                </Group>
              ),
            },
          ]}
          size="sm"
          radius="md"
        />
        <Text size="xs" c="dimmed" className="batch-view-helper-text">
          {viewMode === 'spreadsheet'
            ? '⚡ Live Dynamic Table: Trainer can create custom columns, add rows, inline edit & import/export CSV'
            : `Showing ${filteredBatches.length} of ${allBatches.length} cohorts`}
        </Text>
      </div>

      {/* 3. Main Content: Dynamic Table or Cohort Cards */}
      {viewMode === 'spreadsheet' ? (
        <DynamicBatchTable
          batches={allBatches}
          students={students}
          activeBatchId={activeBatchId}
          onActiveBatchChange={setActiveBatchId}
          initialOpenDetails={openDetailsEditor}
          onOpenImport={() => setIsImportModalOpen(true)}
          onUpdateBatch={onUpdateBatch}
          onCreateBatch={onCreateBatch || onAddBatch}
          onDeleteBatch={(batch) => setBatchToDelete(batch)}
          onClearTable={(batch) => setBatchToDelete(batch)}
        />
      ) : (
        <BatchCardsGrid
          batches={allBatches}
          filteredBatches={filteredBatches}
          search={search}
          onSearchChange={setSearch}
          fieldFilter={fieldFilter}
          onFieldFilterChange={setFieldFilter}
          uniqueFields={uniqueFields}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          students={students}
          attendance={attendance}
          placements={placements}
          onSelectBatch={setSelectedBatch}
          onEditBatch={handleEditBatchFromCard}
          onDeleteBatch={(batch) => setBatchToDelete(batch)}
          onAddBatch={onAddBatch}
        />
      )}

      {/* 4. Drawer: Detailed Enrolled Students in Batch */}
      <BatchRosterDrawer
        opened={!!selectedBatch}
        onClose={() => setSelectedBatch(null)}
        selectedBatch={selectedBatch}
        rosterSearch={rosterSearch}
        onRosterSearchChange={setRosterSearch}
        enrolledStudents={enrolledStudents}
        attendance={attendance}
        placements={placements}
        onAddStudentToBatch={onAddStudentToBatch}
        onEditStudent={onEditStudent}
        onCopyLms={handleCopyLms}
      />

      {/* 5. Batch & Table Deletion Scope Modal */}
      <BatchDeleteModal
        opened={!!batchToDelete}
        onClose={() => setBatchToDelete(null)}
        batch={batchToDelete}
        batches={allBatches}
        students={students}
        loading={deleteLoading}
        onConfirmDelete={async (batch, options) => {
          setDeleteLoading(true);
          try {
            if (onDeleteBatchWithOptions) {
              await onDeleteBatchWithOptions(batch, options);
            } else {
              await onDeleteBatch?.(batch);
            }
            // Auto switch active tab if deleted batch was the currently viewed batch
            if (activeBatchId === batch.id) {
              const remaining = allBatches.filter((b) => b.id !== batch.id);
              setActiveBatchId(remaining[0]?.id || null);
            }
            setBatchToDelete(null);
          } catch (err) {
            showError(err);
          } finally {
            setDeleteLoading(false);
          }
        }}
        onConfirmClearTable={async (batch) => {
          try {
            if (onClearBatchTable) {
              await onClearBatchTable(batch);
            } else {
              await onUpdateBatch?.({ ...batch, rows: [] });
            }
            setBatchToDelete(null);
          } catch (err) {
            showError(err);
          }
        }}
      />

      {/* 6. Smart Enrollment Excel & CSV Importer Modal */}
      <ImportEnrollmentModal
        opened={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        batches={allBatches}
        currentBatch={allBatches.find((b) => b.id === activeBatchId) || allBatches[0]}
        onImportComplete={handleImportComplete}
      />
    </>
  );
}
