import React, { useState, useRef } from 'react';
import {
  Modal,
  Button,
  Group,
  Stack,
  Text,
  Badge,
  Paper,
  Radio,
  Select,
  TextInput,
  Table,
  ScrollArea,
  Divider,
  Alert,
  Loader,
  ThemeIcon,
  Tooltip,
  Checkbox,
} from '@mantine/core';
import {
  IconCloudUpload,
  IconFileSpreadsheet,
  IconCheck,
  IconAlertCircle,
  IconCalendar,
  IconUsers,
  IconTag,
  IconArrowsExchange,
  IconFileCheck,
  IconX,
  IconDownload,
} from '@tabler/icons-react';
import { parseSpreadsheetFile, analyzeEnrollmentReport } from '../../utils/enrollmentImporter';
import {
  downloadSampleExcelTemplate,
  downloadSampleCsv,
  SAMPLE_TEMPLATE_COLUMNS,
} from '../../utils/sampleExcelGenerator';
import { showError, showSuccess } from '../../utils/notifications';

export default function ImportEnrollmentModal({
  opened,
  onClose,
  batches = [],
  currentBatch = null,
  onImportComplete,
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [fileData, setFileData] = useState(null); // { fileName, rawRows }
  const [analysis, setAnalysis] = useState(null); // analyzeEnrollmentReport output

  // Target mode: 'create' | 'existing'
  const [targetMode, setTargetMode] = useState('create');
  const [selectedBatchId, setSelectedBatchId] = useState(currentBatch?.id || batches[0]?.id || '');
  const [rowHandling, setRowHandling] = useState('replace'); // 'replace' | 'append'
  const [updateBatchMetadata, setUpdateBatchMetadata] = useState(true);

  // Editable batch fields if 'create' mode
  const [batchForm, setBatchForm] = useState({
    name: '',
    code: '',
    field: '',
    startDate: '',
    endDate: '',
  });

  const [importing, setImporting] = useState(false);

  const resetState = () => {
    setFileData(null);
    setAnalysis(null);
    setParsing(false);
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleModalClose = () => {
    resetState();
    onClose?.();
  };

  const processFile = async (file) => {
    if (!file) return;
    setParsing(true);
    try {
      const parsed = await parseSpreadsheetFile(file);
      if (!parsed.rawRows || !parsed.rawRows.length) {
        throw new Error('The spreadsheet contains no readable data rows.');
      }

      const activeTargetBatch = batches.find((b) => b.id === selectedBatchId) || currentBatch;
      const analyzed = analyzeEnrollmentReport(parsed.rawRows, activeTargetBatch);

      setFileData(parsed);
      setAnalysis(analyzed);

      // Prepopulate form if batch metadata detected
      if (analyzed.detectedBatch) {
        setBatchForm({
          name: analyzed.detectedBatch.name || '',
          code: analyzed.detectedBatch.code || '',
          field: analyzed.detectedBatch.field || 'General Training',
          startDate: analyzed.detectedBatch.startDate || '',
          endDate: analyzed.detectedBatch.endDate || '',
        });

        // If batch code already matches an existing batch in system, auto-suggest 'existing'
        const existingMatch = batches.find(
          (b) =>
            (analyzed.detectedBatch.code && b.code === analyzed.detectedBatch.code) ||
            b.name.toLowerCase() === analyzed.detectedBatch.name.toLowerCase()
        );
        if (existingMatch) {
          setTargetMode('existing');
          setSelectedBatchId(existingMatch.id);
        } else {
          setTargetMode('create');
        }
      }
    } catch (err) {
      showError(err, 'File parsing failed');
      resetState();
    } finally {
      setParsing(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleConfirmImport = async () => {
    if (!analysis || !analysis.rows.length) {
      showError('No student records found to import.');
      return;
    }

    setImporting(true);
    try {
      if (targetMode === 'create') {
        const newBatchPayload = {
          name: batchForm.name.trim() || analysis.detectedBatch.name,
          code: batchForm.code.trim() || analysis.detectedBatch.code,
          field: batchForm.field.trim() || analysis.detectedBatch.field,
          startDate: batchForm.startDate || analysis.detectedBatch.startDate,
          endDate: batchForm.endDate || analysis.detectedBatch.endDate,
          trainer: currentBatch?.trainer || '',
          timing: currentBatch?.timing || 'Schedule TBA',
          meetLink: currentBatch?.meetLink || '',
          status: 'Active',
          description: analysis.detectedBatch.description || '',
          columns: analysis.columns,
          rows: analysis.rows,
        };

        await onImportComplete?.({
          mode: 'create',
          batchPayload: newBatchPayload,
        });

        showSuccess(
          `Created batch "${newBatchPayload.name}" with ${analysis.rows.length} learners.`,
          'Enrollment Import Complete'
        );
      } else {
        const targetBatch = batches.find((b) => b.id === selectedBatchId) || currentBatch;
        if (!targetBatch) throw new Error('Target batch could not be found.');

        // Compute merged rows
        const finalRows =
          rowHandling === 'append'
            ? [...(targetBatch.rows || []), ...analysis.rows]
            : analysis.rows;

        // Compute merged columns (preserving existing custom columns plus adding new ones)
        const existingColKeys = new Set((targetBatch.columns || []).map((c) => c.key));
        const mergedCols = [...(targetBatch.columns || [])];
        analysis.columns.forEach((newCol) => {
          if (!existingColKeys.has(newCol.key)) {
            mergedCols.push(newCol);
            existingColKeys.add(newCol.key);
          }
        });

        const updatedBatchPayload = {
          ...targetBatch,
          columns: mergedCols,
          rows: finalRows,
          ...(updateBatchMetadata && analysis.detectedBatch
            ? {
                code: analysis.detectedBatch.code || targetBatch.code,
                startDate: analysis.detectedBatch.startDate || targetBatch.startDate,
                endDate: analysis.detectedBatch.endDate || targetBatch.endDate,
                field: analysis.detectedBatch.field || targetBatch.field,
              }
            : {}),
        };

        await onImportComplete?.({
          mode: 'update',
          batchId: targetBatch.id,
          batchPayload: updatedBatchPayload,
        });

        showSuccess(
          `Imported ${analysis.rows.length} learners into batch "${targetBatch.name}".`,
          'Enrollment Import Complete'
        );
      }

      handleModalClose();
    } catch (err) {
      showError(err, 'Import execution failed');
    } finally {
      setImporting(false);
    }
  };

  const previewRows = analysis?.rows?.slice(0, 4) || [];
  const previewCols = analysis?.columns?.slice(0, 6) || [];

  return (
    <Modal
      opened={opened}
      onClose={handleModalClose}
      title={
        <Group gap="xs">
          <ThemeIcon color="teal" variant="light" size="lg" radius="md">
            <IconFileSpreadsheet size={20} />
          </ThemeIcon>
          <div>
            <Text fw={700} size="md">
              Import Enrollment Report (Excel / CSV)
            </Text>
            <Text size="xs" c="dimmed">
              Upload official Anudip/ADIP .xlsx, .xls, or .csv files to auto-populate batches and learner rosters.
            </Text>
          </div>
        </Group>
      }
      size="xl"
      radius="md"
      padding="lg"
    >
      <Stack gap="md">
        {/* 1. Drag & Drop Upload Zone */}
        {!fileData && (
          <Paper
            p="xl"
            radius="md"
            withBorder
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              cursor: 'pointer',
              borderStyle: 'dashed',
              borderWidth: 2,
              borderColor: isDragging ? 'var(--mantine-color-teal-6)' : 'var(--mantine-color-gray-4)',
              backgroundColor: isDragging ? 'var(--mantine-color-teal-0)' : 'var(--mantine-color-gray-0)',
              textAlign: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {parsing ? (
              <Stack align="center" gap="sm" py="md">
                <Loader color="teal" size="md" />
                <Text size="sm" fw={600} c="dimmed">
                  Analyzing spreadsheet structure & columns...
                </Text>
              </Stack>
            ) : (
              <Stack align="center" gap="xs" py="md">
                <ThemeIcon size={52} radius="xl" color="teal" variant="light">
                  <IconCloudUpload size={28} />
                </ThemeIcon>
                <Text size="md" fw={600}>
                  Click or drag & drop your Excel report here
                </Text>
                <Text size="xs" c="dimmed" maw={400}>
                  Supports <strong>Enrollment_Report.xlsx</strong>, .xls, or .csv. Headers, batch codes, dates, and learner attributes are auto-detected.
                </Text>
                <Group gap="xs" mt="xs">
                  <Badge variant="outline" color="teal" size="sm">
                    Excel (.xlsx, .xls)
                  </Badge>
                  <Badge variant="outline" color="blue" size="sm">
                    CSV (.csv)
                  </Badge>
                  <Badge variant="outline" color="grape" size="sm">
                    Auto-detects ANP Cohort
                  </Badge>
                </Group>
              </Stack>
            )}
          </Paper>
        )}

        {/* Sample Excel Helper Section */}
        {!fileData && (
          <Paper p="md" radius="md" withBorder bg="#f8fafc" className="sample-excel-helper-box">
            <Stack gap="xs">
              <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                <Group gap="sm" align="center">
                  <ThemeIcon color="teal" variant="light" size={38} radius="md">
                    <IconFileSpreadsheet size={22} />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" fw={750} c="dark.7">
                      Official 16-Column Sample Excel Template
                    </Text>
                    <Text size="11px" c="dimmed">
                      Matches official MIS report format. Download, fill or copy-paste learner rows, and upload.
                    </Text>
                  </div>
                </Group>

                <Group gap="xs" wrap="wrap">
                  <Button
                    size="xs"
                    variant="filled"
                    color="teal"
                    leftSection={<IconDownload size={14} />}
                    onClick={downloadSampleExcelTemplate}
                  >
                    Download Sample Excel (.xlsx)
                  </Button>
                  <Button
                    size="xs"
                    variant="default"
                    leftSection={<IconDownload size={14} />}
                    onClick={downloadSampleCsv}
                  >
                    Download Sample CSV (.csv)
                  </Button>
                </Group>
              </Group>

              {/* Exact 16 columns chip preview */}
              <Divider my={2} />
              <div>
                <Text size="10px" fw={700} c="dimmed" tt="uppercase" mb={4}>
                  Template Headers (16 Columns in Exact Order):
                </Text>
                <Group gap={4} wrap="wrap">
                  {SAMPLE_TEMPLATE_COLUMNS.map((colName, idx) => (
                    <Badge
                      key={colName}
                      size="xs"
                      variant="dot"
                      color={idx < 5 ? 'indigo' : idx === 15 ? 'red' : 'teal'}
                      styles={{ root: { textTransform: 'none', fontWeight: 600 } }}
                    >
                      {idx + 1}. {colName}
                    </Badge>
                  ))}
                </Group>
              </div>
            </Stack>
          </Paper>
        )}

        {/* 2. Loaded File Header & Actions */}
        {fileData && analysis && (
          <>
            <Paper p="sm" radius="md" withBorder bg="var(--mantine-color-teal-0)">
              <Group justify="space-between" align="center" wrap="wrap">
                <Group gap="sm">
                  <ThemeIcon color="teal" size="md" radius="sm">
                    <IconFileCheck size={18} />
                  </ThemeIcon>
                  <div>
                    <Text size="sm" fw={700}>
                      {fileData.fileName}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {analysis.summary.totalRows} learners identified · Sheet: {fileData.activeSheet}
                    </Text>
                  </div>
                </Group>

                <Button
                  variant="subtle"
                  color="red"
                  size="xs"
                  leftSection={<IconX size={14} />}
                  onClick={resetState}
                >
                  Change File
                </Button>
              </Group>
            </Paper>

            {/* Smart Detection Banner */}
            {analysis.isEnrollmentReport && (
              <Alert
                icon={<IconCheck size={16} />}
                title="Official Enrollment Report Detected!"
                color="teal"
                radius="md"
              >
                <Group gap="lg" mt={4} wrap="wrap">
                  {analysis.detectedBatch.code && (
                    <Group gap={4}>
                      <Text size="xs" c="dimmed">
                        Batch Code:
                      </Text>
                      <Badge color="indigo" variant="light">
                        {analysis.detectedBatch.code}
                      </Badge>
                    </Group>
                  )}
                  {analysis.detectedBatch.name && (
                    <Group gap={4}>
                      <Text size="xs" c="dimmed">
                        Course:
                      </Text>
                      <Text size="xs" fw={600}>
                        {analysis.detectedBatch.name}
                      </Text>
                    </Group>
                  )}
                  {analysis.summary.dateRange && (
                    <Group gap={4}>
                      <Text size="xs" c="dimmed">
                        Duration:
                      </Text>
                      <Badge color="gray" variant="outline" size="sm">
                        {analysis.summary.dateRange}
                      </Badge>
                    </Group>
                  )}
                  <Group gap={4}>
                    <Text size="xs" c="dimmed">
                      Learners:
                    </Text>
                    <Badge color="teal" size="sm">
                      {analysis.summary.totalRows} Enrolled
                    </Badge>
                  </Group>
                </Group>
              </Alert>
            )}

            {/* 3. Destination Batch Selection */}
            <Paper p="md" radius="md" withBorder>
              <Text size="sm" fw={700} mb="sm">
                Where should this enrollment data be imported?
              </Text>

              <Radio.Group value={targetMode} onChange={setTargetMode}>
                <Stack gap="sm">
                  <Radio
                    value="create"
                    label={
                      <div>
                        <Text size="sm" fw={600}>
                          Create as a New Batch
                        </Text>
                        <Text size="xs" c="dimmed">
                          Generates a new dedicated batch and populates these {analysis.summary.totalRows} learners.
                        </Text>
                      </div>
                    }
                  />

                  {targetMode === 'create' && (
                    <Paper p="sm" radius="sm" withBorder ml="lg" bg="var(--mantine-color-gray-0)">
                      <Stack gap="xs">
                        <Group grow>
                          <TextInput
                            label="Batch Name"
                            size="xs"
                            required
                            value={batchForm.name}
                            onChange={(e) =>
                              setBatchForm((f) => ({ ...f, name: e.target.value }))
                            }
                          />
                          <TextInput
                            label="Batch Code"
                            size="xs"
                            placeholder="e.g. ANP-D7517"
                            value={batchForm.code}
                            onChange={(e) =>
                              setBatchForm((f) => ({ ...f, code: e.target.value }))
                            }
                          />
                        </Group>

                        <Group grow>
                          <TextInput
                            label="Course / Field"
                            size="xs"
                            value={batchForm.field}
                            onChange={(e) =>
                              setBatchForm((f) => ({ ...f, field: e.target.value }))
                            }
                          />
                          <TextInput
                            label="Start Date"
                            type="date"
                            size="xs"
                            value={batchForm.startDate}
                            onChange={(e) =>
                              setBatchForm((f) => ({ ...f, startDate: e.target.value }))
                            }
                          />
                          <TextInput
                            label="End Date"
                            type="date"
                            size="xs"
                            value={batchForm.endDate}
                            onChange={(e) =>
                              setBatchForm((f) => ({ ...f, endDate: e.target.value }))
                            }
                          />
                        </Group>
                      </Stack>
                    </Paper>
                  )}

                  <Radio
                    value="existing"
                    label={
                      <div>
                        <Text size="sm" fw={600}>
                          Import into Existing Batch
                        </Text>
                        <Text size="xs" c="dimmed">
                          Target an existing cohort and populate or merge learners into its spreadsheet.
                        </Text>
                      </div>
                    }
                  />

                  {targetMode === 'existing' && (
                    <Paper p="sm" radius="sm" withBorder ml="lg" bg="var(--mantine-color-gray-0)">
                      <Stack gap="xs">
                        <Select
                          label="Target Batch"
                          size="xs"
                          data={batches.map((b) => ({
                            value: b.id,
                            label: `${b.code ? `[${b.code}] ` : ''}${b.name} (${b.rows?.length || 0} students)`,
                          }))}
                          value={selectedBatchId}
                          onChange={(val) => setSelectedBatchId(val)}
                        />

                        <Group gap="lg">
                          <Radio.Group
                            label="Roster Row Handling"
                            size="xs"
                            value={rowHandling}
                            onChange={setRowHandling}
                          >
                            <Group mt={4} gap="md">
                              <Radio value="replace" label="Replace existing roster" size="xs" />
                              <Radio value="append" label="Append to existing roster" size="xs" />
                            </Group>
                          </Radio.Group>

                          <Checkbox
                            size="xs"
                            mt="lg"
                            label="Update batch code, field & dates from report"
                            checked={updateBatchMetadata}
                            onChange={(e) => setUpdateBatchMetadata(e.currentTarget.checked)}
                          />
                        </Group>
                      </Stack>
                    </Paper>
                  )}
                </Stack>
              </Radio.Group>
            </Paper>

            {/* 4. Column Mapping Badges */}
            <Paper p="sm" radius="md" withBorder>
              <Text size="xs" fw={700} c="dimmed" mb={6} tt="uppercase">
                Mapped Dynamic Columns ({analysis.columns.length})
              </Text>
              <Group gap={6} wrap="wrap">
                {analysis.columns.map((col) => (
                  <Badge
                    key={col.key}
                    size="sm"
                    variant={col.required ? 'filled' : 'light'}
                    color={
                      col.required
                        ? 'indigo'
                        : ['studentCode', 'phone', 'dob', 'disabilityType'].includes(col.key)
                        ? 'teal'
                        : 'gray'
                    }
                  >
                    {col.label}
                    {col.key === 'lmsUsername' && ' (Student Code)'}
                  </Badge>
                ))}
              </Group>
            </Paper>

            {/* 5. Live Data Preview (first 4 rows) */}
            <Paper p="sm" radius="md" withBorder>
              <Group justify="space-between" mb={6}>
                <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                  Data Preview (First {previewRows.length} of {analysis.rows.length} Learners)
                </Text>
                <Text size="xs" c="teal" fw={600}>
                  Ready to Import
                </Text>
              </Group>

              <ScrollArea>
                <Table striped highlightOnHover withTableBorder withColumnBorders fz="xs">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>#</Table.Th>
                      {previewCols.map((c) => (
                        <Table.Th key={c.key}>{c.label}</Table.Th>
                      ))}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {previewRows.map((r, i) => (
                      <Table.Tr key={r.id || i}>
                        <Table.Td fw={600}>{i + 1}</Table.Td>
                        {previewCols.map((c) => (
                          <Table.Td key={c.key}>{r[c.key] || '—'}</Table.Td>
                        ))}
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Paper>
          </>
        )}

        <Divider my="xs" />

        {/* Modal Footer Actions */}
        <Group justify="space-between">
          <Button variant="default" onClick={handleModalClose} disabled={importing}>
            Cancel
          </Button>

          {fileData && (
            <Button
              color="teal"
              leftSection={<IconCheck size={16} />}
              loading={importing}
              onClick={handleConfirmImport}
            >
              Confirm Import ({analysis?.rows?.length || 0} Learners)
            </Button>
          )}
        </Group>
      </Stack>
    </Modal>
  );
}
