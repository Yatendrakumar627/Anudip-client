import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionIcon,
  Anchor,
  Badge,
  Button,
  Collapse,
  Divider,
  Group,
  Menu,
  Modal,
  Paper,
  ScrollArea,
  Select,
  Table,
  Tabs,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import { FacebookDatePicker, FacebookTimingPicker } from '../common/FacebookDateTimePicker';
import {
  IconCalendar,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconClock,
  IconCloudUpload,
  IconCopy,
  IconDots,
  IconDownload,
  IconEdit,
  IconEraser,
  IconExternalLink,
  IconEye,
  IconEyeCheck,
  IconEyeOff,
  IconFileSpreadsheet,
  IconGripVertical,
  IconHash,
  IconLink,
  IconMail,
  IconPhone,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconSettings,
  IconTable,
  IconTag,
  IconTrash,
  IconTypography,
  IconUser,
  IconUsers,
  IconUsersGroup,
  IconVideo,
  IconX,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import ImportEnrollmentModal from './ImportEnrollmentModal';
import { batchStatuses, fields } from '../../data';
import { statusColor } from '../../utils/formatters';
import { showError, showSuccess, showWarning } from '../../utils/notifications';
import SearchBox from '../common/SearchBox';
import { Link } from 'react-router-dom';

// Static Column definitions & Base mappings
const BASE_COLS = [
  { key: 'name', label: 'Student Name', type: 'text', width: 200, required: true },
  { key: 'email', label: 'Email', type: 'email', width: 220 },
  { key: 'lmsUsername', label: 'User Name', type: 'text', width: 150 },
  { key: 'lmsPassword', label: 'Password', type: 'text', width: 140 },
];

const BASE_COL_MAP = {
  name: { key: 'name', label: 'Student Name', type: 'text', width: 200, required: true },
  email: { key: 'email', label: 'Email', type: 'email', width: 220 },
  lmsusername: { key: 'lmsUsername', label: 'User Name', type: 'text', width: 150 },
  lmspassword: { key: 'lmsPassword', label: 'Password', type: 'text', width: 140 },
};

const BASE_COL_BY_LABEL = {
  'student name': BASE_COL_MAP.name,
  'email': BASE_COL_MAP.email,
  'user name': BASE_COL_MAP.lmsusername,
  'lms user id': BASE_COL_MAP.lmsusername,
  'password': BASE_COL_MAP.lmspassword,
};

const PHONE_FIELD_REGEX = /mobile|phone|contact/i;
const EMAIL_FIELD_REGEX = /email|mail/i;
const EMAIL_VALID_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COL_ICON_PROPS = { size: 13 };
const COL_ICONS = {
  number: <IconHash {...COL_ICON_PROPS} color="#2563eb" />,
  date: <IconCalendar {...COL_ICON_PROPS} color="#0d9d8b" />,
  select: <IconTag {...COL_ICON_PROPS} color="#d97706" />,
  phone: <IconPhone {...COL_ICON_PROPS} color="#16a34a" />,
  email: <IconMail {...COL_ICON_PROPS} color="#0284c7" />,
  link: <IconLink {...COL_ICON_PROPS} color="#7c3aed" />,
  default: <IconTypography {...COL_ICON_PROPS} color="#64748b" />,
};
const getColIcon = (type) => COL_ICONS[type] || COL_ICONS.default;

// High-Performance Memoized Cell Display Component
const CellDisplay = React.memo(function CellDisplay({ col, cellValue }) {
  const colKey = col.key;
  const colType = col.type;
  const colLabel = col.label || '';

  if (colKey === 'lmsUsername' && cellValue) {
    return (
      <Group gap={6} wrap="nowrap">
        <code className="lms-code-badge user">{cellValue}</code>
        <Tooltip label="Copy User Name" withArrow>
          <ActionIcon
            size="sm"
            variant="light"
            color="indigo"
            radius="md"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(cellValue);
              showSuccess(`Copied "${cellValue}"`, 'Copied');
            }}
            aria-label="Copy User Name"
          >
            <IconCopy size={13} />
          </ActionIcon>
        </Tooltip>
      </Group>
    );
  }

  if (colKey === 'lmsPassword' && cellValue) {
    return (
      <Group gap={6} wrap="nowrap">
        <code className="lms-code-badge pass">{cellValue}</code>
        <Tooltip label="Copy Password" withArrow>
          <ActionIcon
            size="sm"
            variant="light"
            color="green"
            radius="md"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(cellValue);
              showSuccess(`Copied "${cellValue}"`, 'Copied');
            }}
            aria-label="Copy Password"
          >
            <IconCopy size={13} />
          </ActionIcon>
        </Tooltip>
      </Group>
    );
  }

  const strVal = cellValue != null ? String(cellValue).trim() : '';
  const lowerVal = strVal.toLowerCase();

  if (lowerVal === 'yes' || lowerVal === 'no') {
    return (
      <Badge size="xs" color={lowerVal === 'yes' ? 'teal' : 'red'} variant="light">
        {strVal}
      </Badge>
    );
  }

  if (colKey === 'status' || colKey === 'placementStatus') {
    return cellValue ? (
      <Badge size="xs" color={statusColor(cellValue)} variant="light">
        {cellValue}
      </Badge>
    ) : (
      <span className="placeholder-cell">—</span>
    );
  }

  if (colType === 'phone' && cellValue) {
    return (
      <Group gap={4} wrap="nowrap">
        <Text size="xs" fw={500} c="dark.4">
          {cellValue}
        </Text>
        <Tooltip label={`Call ${cellValue}`} withArrow>
          <ActionIcon
            size="xs"
            variant="subtle"
            color="green"
            component="a"
            href={`tel:${String(cellValue).replace(/[^0-9+]/g, '')}`}
            onClick={(e) => e.stopPropagation()}
          >
            <IconPhone size={11} />
          </ActionIcon>
        </Tooltip>
      </Group>
    );
  }

  if (colType === 'email' && cellValue) {
    return (
      <Group gap={4} wrap="nowrap">
        <Text size="xs" fw={500} c="dark.4" truncate maw={170}>
          {cellValue}
        </Text>
        <Tooltip label={`Email ${cellValue}`} withArrow>
          <ActionIcon
            size="xs"
            variant="subtle"
            color="blue"
            component="a"
            href={`mailto:${cellValue}`}
            onClick={(e) => e.stopPropagation()}
          >
            <IconMail size={11} />
          </ActionIcon>
        </Tooltip>
      </Group>
    );
  }

  if (colType === 'select') {
    if (!strVal || strVal.toUpperCase() === 'NAN' || strVal === 'null' || strVal === 'undefined') {
      return <span className="placeholder-cell">—</span>;
    }
    let badgeColor = 'indigo';
    if (lowerVal === 'male') badgeColor = 'blue';
    else if (lowerVal === 'female') badgeColor = 'pink';
    else if (lowerVal === 'active' || lowerVal === 'yes' || lowerVal === 'completed') badgeColor = 'teal';
    else if (lowerVal === 'inactive' || lowerVal === 'no' || lowerVal === 'dropped') badgeColor = 'red';
    else if (lowerVal === 'pending' || lowerVal === 'on hold') badgeColor = 'orange';

    return (
      <Badge size="xs" color={badgeColor} variant="light" style={{ textTransform: 'none' }}>
        {strVal}
      </Badge>
    );
  }

  if (colType === 'date' && cellValue) {
    return (
      <Group gap={4} wrap="nowrap">
        <IconCalendar size={12} color="#0d9488" />
        <Text size="xs" fw={500} c="dark.4">
          {cellValue}
        </Text>
      </Group>
    );
  }

  if (colKey === 'age' || colLabel.toLowerCase() === 'age') {
    if (!strVal || strVal.toUpperCase() === 'NAN') {
      return <span className="placeholder-cell">—</span>;
    }
    return (
      <Badge size="xs" variant="light" color="cyan" fw={700}>
        {cellValue} yrs
      </Badge>
    );
  }

  if (colType === 'number') {
    if (!strVal || strVal.toUpperCase() === 'NAN') {
      return <span className="placeholder-cell">—</span>;
    }
    return (
      <Badge size="xs" variant="outline" color="blue" fw={700}>
        {cellValue}
      </Badge>
    );
  }

  if (colKey === 'name') {
    return (
      <Text size="xs" fw={700} c="dark.5">
        {cellValue || <span className="placeholder-cell">New Student</span>}
      </Text>
    );
  }

  return (
    <Text size="xs" truncate c={cellValue ? 'dark.4' : 'dimmed'}>
      {cellValue || <span className="placeholder-cell">Click to edit</span>}
    </Text>
  );
});

// Inline Cell Editor Component
function CellEditor({
  col,
  rowId,
  editValue,
  setEditValue,
  options,
  onCommit,
  onCancel,
  onSelectChange,
}) {
  if (col.type === 'select') {
    const baseOpts = options && options.length ? options : ['Active', 'Completed', 'On hold'];
    const currentValStr = String(editValue || '').trim();
    const matched = baseOpts.find(
      (o) => String(o).toLowerCase() === currentValStr.toLowerCase()
    );

    const allOpts = [...baseOpts];
    if (currentValStr && currentValStr.toUpperCase() !== 'NAN' && !matched) {
      allOpts.push(currentValStr);
    }

    const selectData = allOpts.map((o) => ({
      value: String(o),
      label: String(o),
    }));

    const activeValue = matched
      ? String(matched)
      : currentValStr.toUpperCase() === 'NAN'
      ? null
      : currentValStr || null;

    return (
      <Select
        size="xs"
        autoFocus
        defaultDropdownOpened
        comboboxProps={{ withinPortal: true, zIndex: 10000 }}
        placeholder="Select choice..."
        data={selectData}
        value={activeValue}
        allowDeselect={false}
        onChange={(val) => {
          onSelectChange(rowId, col.key, val || '');
        }}
        onDropdownClose={onCancel}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
        }}
      />
    );
  }

  const isPhoneCol =
    col.type === 'phone' ||
    col.key === 'phone' ||
    (col.label && PHONE_FIELD_REGEX.test(col.label));

  const isEmailCol =
    col.type === 'email' ||
    col.key === 'email' ||
    (col.label && EMAIL_FIELD_REGEX.test(col.label));

  const currentValStr = String(editValue || '');
  const isEmailValid = EMAIL_VALID_REGEX.test(currentValStr.trim());

  return (
    <TextInput
      size="xs"
      autoFocus
      type={
        col.type === 'number'
          ? 'number'
          : col.type === 'date'
          ? 'date'
          : isPhoneCol
          ? 'tel'
          : isEmailCol
          ? 'email'
          : 'text'
      }
      inputMode={isPhoneCol ? 'numeric' : undefined}
      pattern={isPhoneCol ? '[0-9]*' : undefined}
      maxLength={isPhoneCol ? 10 : undefined}
      placeholder={
        isPhoneCol
          ? '10-digit mobile'
          : isEmailCol
          ? 'student@example.com'
          : undefined
      }
      value={editValue}
      onChange={(e) => {
        let val = e.target.value;
        if (isPhoneCol) {
          val = val.replace(/\D/g, '').slice(0, 10);
        } else if (isEmailCol) {
          val = val.replace(/\s+/g, '');
        }
        setEditValue(val);
      }}
      rightSection={
        isPhoneCol ? (
          currentValStr.length === 10 ? (
            <IconCheck size={13} color="#16a34a" />
          ) : currentValStr.length > 0 ? (
            <Text size="9px" fw={700} c="orange.7">
              {currentValStr.length}/10
            </Text>
          ) : null
        ) : isEmailCol ? (
          currentValStr.length > 0 ? (
            isEmailValid ? (
              <IconCheck size={13} color="#16a34a" />
            ) : (
              <IconMail size={13} color="#f59e0b" />
            )
          ) : null
        ) : null
      }
      onBlur={onCommit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onCommit();
        if (e.key === 'Escape') onCancel();
      }}
    />
  );
}

export default function DynamicBatchTable({
  batches = [],
  students = [],
  onUpdateBatch,
  onCreateBatch,
  onDeleteBatch,
  onClearTable,
  activeBatchId: externalActiveBatchId,
  onActiveBatchChange,
  initialOpenDetails = false,
  onOpenImport,
}) {
  const [isInternalImportModalOpen, setIsInternalImportModalOpen] = useState(false);
  const handleOpenImport = () => {
    if (onOpenImport) onOpenImport();
    else setIsInternalImportModalOpen(true);
  };
  // Active batch selection (controlled or uncontrolled)
  const [internalActiveBatchId, setInternalActiveBatchId] = useState(batches[0]?.id || 'batch_af_01');
  const activeBatchId = externalActiveBatchId !== undefined ? externalActiveBatchId : internalActiveBatchId;
  const setActiveBatchId = (id) => {
    setInternalActiveBatchId(id);
    onActiveBatchChange?.(id);
  };

  const [search, setSearch] = useState('');

  // Cell inline editing state: { rowId, colKey }
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Drag and Drop refs to prevent React re-renders during active native drag
  const draggedColRef = useRef(null);
  const draggedRowRef = useRef(null);

  // Local optimistic state for columns & rows to ensure 0ms instantaneous UI updates
  const [localColumns, setLocalColumns] = useState(null);
  const [localRows, setLocalRows] = useState(null);

  // Tightly coupled Batch Details Editor state (in-place above the live spreadsheet)
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(initialOpenDetails);

  useEffect(() => {
    if (initialOpenDetails) {
      setIsDetailsPanelOpen(true);
    }
  }, [initialOpenDetails]);

  // Active batch object
  const currentBatch = useMemo(() => {
    return batches.find((b) => b.id === activeBatchId) || batches[0] || null;
  }, [batches, activeBatchId]);

  // In-place Batch Details Form state
  const [detailsForm, setDetailsForm] = useState({
    name: '',
    code: '',
    field: fields[0] || 'General Training',
    trainer: '',
    timing: '',
    meetLink: '',
    status: 'Active',
    startDate: '',
    endDate: '',
    description: '',
  });

  const updateDetailsFormField = (field, value) => {
    setDetailsForm((curr) => ({ ...curr, [field]: value }));
  };

  // Synchronize detailsForm when active batch changes
  useEffect(() => {
    if (currentBatch) {
      setDetailsForm({
        name: currentBatch.name || '',
        code: currentBatch.code || '',
        field: currentBatch.field || fields[0],
        trainer: currentBatch.trainer || '',
        timing: currentBatch.timing || '',
        meetLink: currentBatch.meetLink || '',
        status: currentBatch.status || 'Active',
        startDate: currentBatch.startDate || '',
        endDate: currentBatch.endDate || '',
        description: currentBatch.description || '',
      });
    }
  }, [currentBatch?.id, currentBatch?.name]);

  // Track if in-place batch details have unsaved edits
  const isDetailsDirty = useMemo(() => {
    if (!currentBatch) return false;
    return (
      (detailsForm.name || '').trim() !== (currentBatch.name || '').trim() ||
      (detailsForm.code || '').trim() !== (currentBatch.code || '').trim() ||
      (detailsForm.field || '') !== (currentBatch.field || fields[0]) ||
      (detailsForm.trainer || '').trim() !== (currentBatch.trainer || '').trim() ||
      (detailsForm.timing || '').trim() !== (currentBatch.timing || '').trim() ||
      (detailsForm.meetLink || '').trim() !== (currentBatch.meetLink || '').trim() ||
      (detailsForm.status || '') !== (currentBatch.status || 'Active') ||
      (detailsForm.startDate || '') !== (currentBatch.startDate || '') ||
      (detailsForm.endDate || '') !== (currentBatch.endDate || '') ||
      (detailsForm.description || '').trim() !== (currentBatch.description || '').trim()
    );
  }, [detailsForm, currentBatch]);

  // Inline Title quick editing state (click title in header to rename immediately)
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleEditValue, setTitleEditValue] = useState('');

  const handleStartTitleEdit = () => {
    setTitleEditValue(currentBatch?.name || '');
    setIsEditingTitle(true);
  };

  const handleSaveTitleEdit = () => {
    if (!titleEditValue.trim()) {
      showWarning('Batch name cannot be empty.', 'Invalid Name');
      return;
    }
    const newName = titleEditValue.trim();
    setIsEditingTitle(false);
    setDetailsForm((prev) => ({ ...prev, name: newName }));
    saveBatchData(columns, rows, { name: newName });
    showSuccess(`Batch renamed to "${newName}".`, 'Title Updated');
  };

  const handleCancelTitleEdit = () => {
    setIsEditingTitle(false);
  };

  // Modals state
  const [isAddColOpen, setIsAddColOpen] = useState(false);
  const [newColLabel, setNewColLabel] = useState('');
  const [newColType, setNewColType] = useState('text');
  const [newColOptions, setNewColOptions] = useState('');

  const [isRenameColOpen, setIsRenameColOpen] = useState(false);
  const [renamingColKey, setRenamingColKey] = useState(null);
  const [renameLabel, setRenameLabel] = useState('');
  const [renameType, setRenameType] = useState('text');

  // Configure Column Dropdown & Data Type Options state
  const [isConfigColOpen, setIsConfigColOpen] = useState(false);
  const [configuringCol, setConfiguringCol] = useState(null);
  const [configColType, setConfigColType] = useState('text');
  const [configColOptions, setConfigColOptions] = useState('');
  const [configColExtractedValues, setConfigColExtractedValues] = useState([]);

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchModalMode, setBatchModalMode] = useState('create'); // 'create' | 'edit'
  const [batchModalTab, setBatchModalTab] = useState('details'); // 'details' | 'table'
  const [batchForm, setBatchForm] = useState({
    name: '',
    code: '',
    field: fields[0] || 'General Training',
    trainer: '',
    timing: '',
    meetLink: '',
    status: 'Active',
    description: '',
  });

  const updateBatchFormField = (field, value) => {
    setBatchForm((curr) => ({ ...curr, [field]: value }));
  };

  const handleOpenCreateBatch = () => {
    setBatchModalMode('create');
    setBatchModalTab('details');
    setBatchForm({
      name: '',
      code: '',
      field: fields[0] || 'General Training',
      trainer: '',
      timing: '',
      meetLink: '',
      status: 'Active',
      startDate: dayjs().format('YYYY-MM-DD'),
      endDate: '',
      description: '',
    });
    setIsBatchModalOpen(true);
  };

  const handleOpenEditBatch = (batchToEdit = currentBatch) => {
    if (!batchToEdit) return;
    setBatchModalMode('edit');
    setBatchModalTab('details');
    setBatchForm({
      name: batchToEdit.name || '',
      code: batchToEdit.code || '',
      field: batchToEdit.field || fields[0],
      trainer: batchToEdit.trainer || '',
      timing: batchToEdit.timing || '',
      meetLink: batchToEdit.meetLink || '',
      status: batchToEdit.status || 'Active',
      startDate: batchToEdit.startDate || '',
      endDate: batchToEdit.endDate || '',
      description: batchToEdit.description || '',
    });
    setIsBatchModalOpen(true);
  };

  const fileInputRef = useRef(null);

  // Reset local optimistic state when active batch changes
  useEffect(() => {
    setLocalColumns(null);
    setLocalRows(null);
  }, [currentBatch?.id]);

  // Canonical columns computed from currentBatch (preserving saved custom column order)
  const canonicalColumns = useMemo(() => {
    if (!currentBatch) return BASE_COLS;
    if (!currentBatch.columns || !currentBatch.columns.length) {
      return BASE_COLS;
    }

    const orderedCols = [];
    const seenColKeys = new Set();
    const seenBase = new Set();

    (currentBatch.columns || []).forEach((c) => {
      const k = (c.key || '').toLowerCase().trim();
      const l = (c.label || '').toLowerCase().trim();
      const matchedBase = BASE_COL_MAP[k] || BASE_COL_BY_LABEL[l];

      if (matchedBase) {
        if (!seenBase.has(matchedBase.key)) {
          seenBase.add(matchedBase.key);
          seenColKeys.add(matchedBase.key);
          orderedCols.push({ ...matchedBase, ...c, width: c.width || matchedBase.width });
        }
      } else {
        const canonicalKey = c.key || `col_${l.replace(/[^a-z0-9]/g, '_')}`;
        if (!seenColKeys.has(canonicalKey)) {
          seenColKeys.add(canonicalKey);
          orderedCols.push(c);
        }
      }
    });

    // Ensure any missing core default columns are appended
    BASE_COLS.forEach((bc) => {
      if (!seenBase.has(bc.key)) {
        orderedCols.push(bc);
      }
    });

    // Automatically insert Age column right next to DOB column if DOB is present and Age is not
    const hasDob = orderedCols.some(
      (c) => c.key === 'dob' || c.label.toLowerCase() === 'dob' || /date of birth/i.test(c.label)
    );
    const hasAge = orderedCols.some(
      (c) => c.key === 'age' || c.label.toLowerCase() === 'age'
    );

    if (hasDob && !hasAge) {
      const dobIdx = orderedCols.findIndex(
        (c) => c.key === 'dob' || c.label.toLowerCase() === 'dob' || /date of birth/i.test(c.label)
      );
      orderedCols.splice(dobIdx !== -1 ? dobIdx + 1 : orderedCols.length, 0, {
        key: 'age',
        label: 'Age',
        type: 'number',
        width: 95,
      });
    }

    return orderedCols;
  }, [currentBatch]);

  // Canonical rows for current batch
  const canonicalRows = useMemo(() => {
    if (!currentBatch) return [];
    if (currentBatch.rows && currentBatch.rows.length) {
      return currentBatch.rows.map((r) => {
        const copy = {
          ...r,
          name: r.name || '',
          email: r.email || '',
          lmsUsername: r.lmsUsername || r['LMS User ID'] || '',
          lmsPassword: r.lmsPassword || '',
        };
        // Automatically calculate Age from DOB if age is empty or missing
        const dobVal = copy.dob || copy.DOB;
        if (dobVal) {
          const d = dayjs(dobVal);
          if (d.isValid()) {
            const calculatedAge = dayjs().diff(d, 'year');
            if (calculatedAge >= 0 && calculatedAge < 120) {
              if (copy.age == null || copy.age === '' || copy.age === 'NAN') {
                copy.age = calculatedAge;
              }
            }
          }
        }
        return copy;
      });
    }
    // Automatically populate from students enrolled in this batch if rows not explicitly saved
    const enrolled = students.filter(
      (s) => s.batch === currentBatch.name || s.batch === currentBatch.id
    );
    return enrolled.map((s, idx) => ({
      id: s.id || `row_${idx + 1}`,
      name: s.name || '',
      email: s.email || '',
      lmsUsername: s.lmsUsername || '',
      lmsPassword: s.lmsPassword || '',
    }));
  }, [currentBatch, students]);

  // Effective columns and rows (prefers local optimistic state for 0ms latency, fallbacks to batch canonical)
  const columns = localColumns || canonicalColumns;
  const rows = localRows || canonicalRows;

  // LMS Portal visibility status (columns hidden from learners on LMS, but visible in batch table for admin)
  const lmsHiddenColumns = useMemo(
    () => columns.filter((c) => !!(c.hiddenOnLms || c.hidden)),
    [columns]
  );

  // Filtered rows by search term across all columns in the batch table
  const filteredRows = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((row) =>
      columns.some((col) => String(row[col.key] || '').toLowerCase().includes(q))
    );
  }, [rows, columns, search]);

  // Helper to persist batch changes (columns, rows, or metadata) with instantaneous local state reflection
  const saveBatchData = React.useCallback(
    (updatedColumns, updatedRows, batchOverrides = {}) => {
      if (!currentBatch) return;
      const nextCols = updatedColumns || columns;
      const nextRows = updatedRows || rows;
      setLocalColumns(nextCols);
      setLocalRows(nextRows);
      const updated = {
        ...currentBatch,
        ...batchOverrides,
        columns: nextCols,
        rows: nextRows,
      };
      onUpdateBatch(updated);
    },
    [currentBatch, columns, rows, onUpdateBatch]
  );

  // Precompute dynamic choices for select/tag columns to eliminate row scans on cell render
  const selectOptionsMap = useMemo(() => {
    const map = {};
    columns.forEach((col) => {
      if (col.type === 'select') {
        if (Array.isArray(col.options) && col.options.length) {
          map[col.key] = col.options;
        } else {
          const unique = [
            ...new Set(
              rows
                .map((r) => String(r[col.key] || '').trim())
                .filter(
                  (v) =>
                    v &&
                    v.toUpperCase() !== 'NAN' &&
                    v !== 'null' &&
                    v !== 'undefined'
                )
            ),
          ];
          map[col.key] = unique.length ? unique : ['Active', 'Completed', 'On hold'];
        }
      }
    });
    return map;
  }, [columns, rows]);

  const handleSelectCellChange = React.useCallback(
    (rowId, colKey, nextVal) => {
      setEditValue(nextVal);
      const updatedRows = rows.map((r) =>
        r.id === rowId ? { ...r, [colKey]: nextVal } : r
      );
      saveBatchData(columns, updatedRows);
      setEditingCell(null);
    },
    [rows, columns, saveBatchData]
  );

  // --- COLUMN OPERATIONS ---
  const handleAddColumn = (e) => {
    e.preventDefault();
    if (!newColLabel.trim()) {
      showWarning('Please enter a column title.', 'Column title required');
      return;
    }

    if (
      columns.some(
        (c) => (c.label || '').toLowerCase().trim() === newColLabel.toLowerCase().trim()
      )
    ) {
      showWarning(`Column "${newColLabel.trim()}" already exists.`, 'Duplicate Column');
      return;
    }

    const key = `col_${Date.now().toString(36)}_${newColLabel
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .slice(0, 15)}`;

    const newCol = {
      key,
      label: newColLabel.trim(),
      type: newColType,
      width: newColType === 'select' ? 140 : 160,
    };

    if (newColType === 'select' && newColOptions.trim()) {
      newCol.options = newColOptions
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const isAddingDob = newCol.key === 'dob' || /^(dob|date of birth)$/i.test(newCol.label.trim());
    const hasAge = columns.some((c) => c.key === 'age' || c.label.toLowerCase() === 'age');
    let updatedCols = [...columns, newCol];
    if (isAddingDob && !hasAge) {
      updatedCols.push({
        key: 'age',
        label: 'Age',
        type: 'number',
        width: 95,
      });
    }

    saveBatchData(updatedCols, rows);
    setIsAddColOpen(false);
    setNewColLabel('');
    setNewColType('text');
    setNewColOptions('');
    showSuccess(`Added column "${newCol.label}".`, 'Column Created');
  };

  const handleOpenRename = (col) => {
    setRenamingColKey(col.key);
    setRenameLabel(col.label);
    setRenameType(col.type || 'text');
    setIsRenameColOpen(true);
  };

  const handleSaveRename = (e) => {
    e.preventDefault();
    if (!renameLabel.trim()) return;
    const targetType = renameType || 'text';
    const updatedCols = columns.map((c) => {
      if (c.key !== renamingColKey) return c;
      let options = c.options;
      if (targetType === 'select' && (!options || !options.length)) {
        const existingVals = [
          ...new Set(
            rows
              .map((r) => String(r[c.key] || '').trim())
              .filter((v) => v && v.toUpperCase() !== 'NAN' && v !== 'null' && v !== 'undefined')
          ),
        ];
        options = existingVals.length ? existingVals : ['Active', 'Completed', 'On hold'];
      }
      return {
        ...c,
        label: renameLabel.trim(),
        type: targetType,
        ...(targetType === 'select' ? { options } : {}),
      };
    });
    saveBatchData(updatedCols, rows);
    setIsRenameColOpen(false);
    showSuccess('Column header updated successfully.', 'Column Updated');
  };

  const handleChangeColType = (colKey, newType, customOptions = null) => {
    const targetCol = columns.find((c) => c.key === colKey);
    if (!targetCol) return;

    let options = customOptions;
    if (newType === 'select' && (!options || !options.length)) {
      const existingVals = [
        ...new Set(
          rows
            .map((r) => String(r[colKey] || '').trim())
            .filter((v) => v && v.toUpperCase() !== 'NAN' && v !== 'null' && v !== 'undefined')
        ),
      ];
      options = existingVals.length ? existingVals : ['Active', 'Completed', 'On hold'];
    }

    const updatedCols = columns.map((c) => {
      if (c.key !== colKey) return c;
      return {
        ...c,
        type: newType,
        ...(newType === 'select' ? { options } : {}),
      };
    });

    let updatedRows = rows;
    if (newType === 'number') {
      updatedRows = rows.map((r) => {
        const val = r[colKey];
        if (val === '' || val === null || val === undefined) return r;
        const num = parseFloat(String(val).replace(/[^0-9.-]/g, ''));
        return { ...r, [colKey]: isNaN(num) ? '' : num };
      });
    } else if (newType === 'select') {
      // Clean up stringified 'NAN' / 'NaN' / 'null' artifacts
      updatedRows = rows.map((r) => {
        const val = String(r[colKey] || '').trim();
        if (val.toUpperCase() === 'NAN' || val === 'null' || val === 'undefined') {
          return { ...r, [colKey]: '' };
        }
        return r;
      });
    }

    saveBatchData(updatedCols, updatedRows);
    showSuccess(
      `Column "${targetCol.label}" data type set to ${newType === 'select' ? 'DROPDOWN / TAG' : newType.toUpperCase()}.`,
      'Data Type Updated'
    );
  };

  const handleOpenConfigCol = (col) => {
    setConfiguringCol(col);
    setConfigColType('select');
    const existingVals = [
      ...new Set(
        rows
          .map((r) => String(r[col.key] || '').trim())
          .filter((v) => v && v.toUpperCase() !== 'NAN' && v !== 'null' && v !== 'undefined')
      ),
    ];
    setConfigColExtractedValues(existingVals);
    const initialOpts =
      col.options && col.options.length
        ? col.options
        : existingVals.length
        ? existingVals
        : ['Active', 'Completed', 'On hold'];
    setConfigColOptions(initialOpts.join(', '));
    setIsConfigColOpen(true);
  };

  const handleSaveConfigCol = (e) => {
    e.preventDefault();
    if (!configuringCol) return;
    const parsedOptions = configColOptions
      .split(',')
      .map((s) => s.trim())
      .filter((v) => v && v.toUpperCase() !== 'NAN' && v !== 'null' && v !== 'undefined');
    const finalOptions = parsedOptions.length
      ? parsedOptions
      : configColExtractedValues.length
      ? configColExtractedValues
      : ['Active', 'Completed', 'On hold'];
    handleChangeColType(configuringCol.key, 'select', finalOptions);
    setIsConfigColOpen(false);
  };

  const handleToggleLmsVisibility = (colKey) => {
    const targetCol = columns.find((c) => c.key === colKey);
    if (!targetCol) return;

    const currentlyHidden = !!(targetCol.hiddenOnLms || targetCol.hidden);
    const willHide = !currentlyHidden;

    const updatedCols = columns.map((c) => {
      if (c.key === colKey) {
        return {
          ...c,
          hiddenOnLms: willHide,
          hidden: willHide,
        };
      }
      return c;
    });

    saveBatchData(updatedCols, rows);
    if (willHide) {
      showSuccess(
        `Column "${targetCol.label}" is now hidden on the LMS Portal (still visible in this Batch table for admin).`,
        'Hidden on LMS Portal'
      );
    } else {
      showSuccess(
        `Column "${targetCol.label}" is now visible to learners on the LMS Portal.`,
        'Visible on LMS Portal'
      );
    }
  };

  const handleShowAllOnLms = () => {
    const updatedCols = columns.map((c) => ({
      ...c,
      hiddenOnLms: false,
      hidden: false,
    }));
    saveBatchData(updatedCols, rows);
    showSuccess('All columns are now visible on the LMS Portal.', 'LMS Visibility Updated');
  };

  const handleDeleteColumn = (colKey) => {
    if (columns.length <= 1) {
      showWarning('A batch table must have at least one column.', 'Cannot delete');
      return;
    }
    const updatedCols = columns.filter((c) => c.key !== colKey);
    // Also remove the key from rows
    const updatedRows = rows.map((r) => {
      const copy = { ...r };
      delete copy[colKey];
      return copy;
    });
    saveBatchData(updatedCols, updatedRows);
    showSuccess('Column removed from batch table.', 'Column Deleted');
  };

  // --- COLUMN DRAG & DROP ---
  const handleColDragStart = (e, colIndex) => {
    if (e.target.closest('button') || e.target.closest('input')) {
      e.preventDefault();
      return;
    }
    draggedColRef.current = colIndex;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(colIndex));
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'col', index: colIndex }));
    e.currentTarget.classList.add('is-col-dragging');
  };

  const handleColDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleColDragEnter = (e, colIndex) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedColRef.current !== null && draggedColRef.current !== colIndex) {
      e.currentTarget.classList.add('is-col-drag-over');
    }
  };

  const handleColDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('is-col-drag-over');
  };

  const handleColDrop = (e, targetColIndex) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('is-col-drag-over');

    let fromIndex = draggedColRef.current;
    if (fromIndex == null) {
      try {
        const raw = e.dataTransfer.getData('application/json');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.type === 'col') fromIndex = parsed.index;
        }
      } catch (_) {}
    }
    if (fromIndex == null) {
      const txt = e.dataTransfer.getData('text/plain');
      if (txt !== '') fromIndex = parseInt(txt, 10);
    }
    draggedColRef.current = null;

    document.querySelectorAll('.th-draggable').forEach((el) => {
      el.classList.remove('is-col-dragging', 'is-col-drag-over');
    });

    if (fromIndex == null || isNaN(fromIndex) || fromIndex === targetColIndex) {
      return;
    }

    const updatedCols = [...columns];
    const [movedCol] = updatedCols.splice(fromIndex, 1);
    updatedCols.splice(targetColIndex, 0, movedCol);

    // Instant optimistic update & persistence
    saveBatchData(updatedCols, rows);
    showSuccess(`Reordered column "${movedCol.label}".`, 'Column Reordered');
  };

  const handleColDragEnd = () => {
    draggedColRef.current = null;
    document.querySelectorAll('.th-draggable').forEach((el) => {
      el.classList.remove('is-col-dragging', 'is-col-drag-over');
    });
  };

  // --- ROW DRAG & DROP ---
  const handleRowDragStart = (e, rowIndex) => {
    if (
      ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA'].includes(e.target.tagName) ||
      e.target.closest('button') ||
      e.target.closest('input')
    ) {
      return;
    }
    draggedRowRef.current = rowIndex;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(rowIndex));
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'row', index: rowIndex }));
    e.currentTarget.classList.add('is-row-dragging');
  };

  const handleRowDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleRowDragEnter = (e, rowIndex) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedRowRef.current !== null && draggedRowRef.current !== rowIndex) {
      e.currentTarget.classList.add('is-row-drag-over');
    }
  };

  const handleRowDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('is-row-drag-over');
  };

  const handleRowDrop = (e, targetRowIndex) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('is-row-drag-over');

    let fromIndex = draggedRowRef.current;
    if (fromIndex == null) {
      try {
        const raw = e.dataTransfer.getData('application/json');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.type === 'row') fromIndex = parsed.index;
        }
      } catch (_) {}
    }
    if (fromIndex == null) {
      const txt = e.dataTransfer.getData('text/plain');
      if (txt !== '') fromIndex = parseInt(txt, 10);
    }
    draggedRowRef.current = null;

    document.querySelectorAll('.mantine-batch-row').forEach((el) => {
      el.classList.remove('is-row-dragging', 'is-row-drag-over');
    });

    if (fromIndex == null || isNaN(fromIndex) || fromIndex === targetRowIndex) {
      return;
    }

    const draggedRow = filteredRows[fromIndex];
    const targetRow = filteredRows[targetRowIndex];
    if (draggedRow && targetRow && draggedRow.id !== targetRow.id) {
      const fromIdx = rows.findIndex((r) => r.id === draggedRow.id);
      const toIdx = rows.findIndex((r) => r.id === targetRow.id);
      if (fromIdx !== -1 && toIdx !== -1) {
        const updatedRows = [...rows];
        const [movedRow] = updatedRows.splice(fromIdx, 1);
        updatedRows.splice(toIdx, 0, movedRow);

        // Instant optimistic update & persistence
        saveBatchData(columns, updatedRows);
        showSuccess(
          `Moved row "${movedRow.name || 'Student'}" to position ${targetRowIndex + 1}.`,
          'Row Reordered'
        );
      }
    }
  };

  const handleRowDragEnd = () => {
    draggedRowRef.current = null;
    document.querySelectorAll('.mantine-batch-row').forEach((el) => {
      el.classList.remove('is-row-dragging', 'is-row-drag-over');
    });
  };

  // --- ROW OPERATIONS ---
  const handleAddRow = () => {
    const newId = `row_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const newRow = { id: newId };
    columns.forEach((col) => {
      if (col.key === 'name') newRow[col.key] = '';
      else if (col.key === 'email') newRow[col.key] = '';
      else if (col.key === 'lmsUsername') newRow[col.key] = '';
      else if (col.key === 'lmsPassword') newRow[col.key] = '';
      else if (col.key === 'status') newRow[col.key] = 'Active';
      else if (col.type === 'number') newRow[col.key] = 0;
      else newRow[col.key] = '';
    });
    const updatedRows = [newRow, ...rows];
    saveBatchData(columns, updatedRows);
    showSuccess('New student row added. Click any cell to edit.', 'Row Added');
  };

  const handleDeleteRow = (rowId) => {
    const updatedRows = rows.filter((r) => r.id !== rowId);
    saveBatchData(columns, updatedRows);
    showSuccess('Student row removed.', 'Row Deleted');
  };

  // --- INLINE CELL EDITING ---
  const startEditing = (rowId, colKey, currentValue) => {
    setEditingCell({ rowId, colKey });
    setEditValue(currentValue == null ? '' : String(currentValue));
  };

  const commitCellEdit = () => {
    if (!editingCell) return;
    const { rowId, colKey } = editingCell;
    const col = columns.find((c) => c.key === colKey);

    let parsedValue = editValue;
    const isPhoneCol =
      col?.type === 'phone' ||
      col?.key === 'phone' ||
      (col?.label && /mobile|phone|contact/i.test(col.label));

    const isEmailCol =
      col?.type === 'email' ||
      col?.key === 'email' ||
      (col?.label && /email|mail/i.test(col.label));

    if (col?.type === 'number') {
      const num = parseFloat(String(editValue).replace(/[^0-9.-]/g, ''));
      parsedValue = editValue === '' || isNaN(num) ? null : num;
    } else if (isPhoneCol) {
      const cleaned = String(editValue || '').replace(/\D/g, '').slice(0, 10);
      if (cleaned && cleaned.length !== 10) {
        showWarning(
          `Mobile number must be exactly 10 digits (currently ${cleaned.length} digits).`,
          'Invalid Mobile Number'
        );
        return;
      }
      parsedValue = cleaned;
    } else if (isEmailCol) {
      const trimmed = String(editValue || '').trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (trimmed && !emailRegex.test(trimmed)) {
        showWarning(
          'Please enter a valid email address (e.g., student@domain.com).',
          'Invalid Email Format'
        );
        return;
      }
      parsedValue = trimmed;
    }

    const isDobCol =
      col?.key === 'dob' ||
      col?.label?.toLowerCase() === 'dob' ||
      /date of birth/i.test(col?.label || '');

    const updatedRows = rows.map((r) => {
      if (r.id === rowId) {
        const nextRow = { ...r, [colKey]: parsedValue };
        if (isDobCol) {
          if (parsedValue && dayjs(parsedValue).isValid()) {
            const ageYears = dayjs().diff(dayjs(parsedValue), 'year');
            if (ageYears >= 0 && ageYears < 120) {
              nextRow.age = ageYears;
            } else {
              nextRow.age = '';
            }
          } else {
            nextRow.age = '';
          }
        }
        return nextRow;
      }
      return r;
    });

    let nextCols = columns;
    if (
      isDobCol &&
      !columns.some((c) => c.key === 'age' || c.label.toLowerCase() === 'age')
    ) {
      const dobIndex = columns.findIndex((c) => c.key === colKey);
      const newCols = [...columns];
      newCols.splice(dobIndex !== -1 ? dobIndex + 1 : newCols.length, 0, {
        key: 'age',
        label: 'Age',
        type: 'number',
        width: 95,
      });
      nextCols = newCols;
    }

    saveBatchData(nextCols, updatedRows);
    setEditingCell(null);
  };

  const cancelCellEdit = () => {
    setEditingCell(null);
  };

  // --- EXCEL & CSV IMPORT & EXPORT ---
  const handleExportExcel = () => {
    if (!currentBatch) return;
    const exportData = rows.map((row) => {
      const obj = {};
      columns.forEach((col) => {
        obj[col.label] = row[col.key] ?? '';
      });
      return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Learners');
    XLSX.writeFile(
      workbook,
      `${currentBatch.code || 'Batch'}-${(currentBatch.name || 'Cohort').replace(/\s+/g, '_')}.xlsx`
    );
    showSuccess('Batch table exported to Excel (.xlsx).', 'Export Complete');
  };

  const handleExportCsv = () => {
    if (!currentBatch) return;
    const exportData = rows.map((row) => {
      const obj = {};
      columns.forEach((col) => {
        obj[col.label] = row[col.key] ?? '';
      });
      return obj;
    });

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentBatch.code || 'Batch'}-${currentBatch.name.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess('Batch table exported to CSV.', 'Export Complete');
  };

  const handleImportCsv = (file) => {
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, meta }) => {
        try {
          if (!data || !data.length) {
            showWarning('The uploaded CSV file is empty.', 'Import failed');
            return;
          }

          // Identify existing columns by normalized label
          const existingColMap = new Map(
            columns.map((col) => [col.label.toLowerCase().trim(), col])
          );

          const updatedCols = [...columns];

          // Check if CSV has any new columns to create dynamically!
          const csvFields = meta.fields || Object.keys(data[0]);
          csvFields.forEach((fieldName) => {
            const clean = fieldName.trim();
            if (!clean) return;
            const keyNorm = clean.toLowerCase();

            if (!existingColMap.has(keyNorm)) {
              const newKey = `col_${Date.now().toString(36)}_${clean
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '_')
                .slice(0, 15)}`;
              const detectedCol = {
                key: newKey,
                label: clean,
                type: 'text',
                width: 160,
              };
              updatedCols.push(detectedCol);
              existingColMap.set(keyNorm, detectedCol);
            }
          });

          // Build rows from CSV
          const newRows = data.map((rowItem, idx) => {
            const rowObj = {
              id: `row_import_${Date.now().toString(36)}_${idx}`,
            };
            csvFields.forEach((fieldName) => {
              const col = existingColMap.get(fieldName.trim().toLowerCase());
              if (col) {
                rowObj[col.key] = rowItem[fieldName];
              }
            });
            return rowObj;
          });

          const mergedRows = [...newRows, ...rows];
          saveBatchData(updatedCols, mergedRows);
          showSuccess(
            `Imported ${newRows.length} students into batch "${currentBatch.name}".`,
            'CSV Import Succeeded'
          );
        } catch (err) {
          showError(err, 'Failed to parse CSV');
        } finally {
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      error: (err) => {
        showError(err, 'CSV Parsing Error');
      },
    });
  };

  // --- CREATE & EDIT BATCH SUBMIT ---
  const handleBatchFormSubmit = (e) => {
    e.preventDefault();
    if (!batchForm.name.trim()) {
      showWarning('Batch name is required.', 'Input required');
      return;
    }

    if (batchModalMode === 'edit') {
      if (!currentBatch) return;
      const updated = {
        ...currentBatch,
        name: batchForm.name.trim(),
        code: batchForm.code.trim() || currentBatch.code,
        field: batchForm.field || currentBatch.field,
        trainer: batchForm.trainer.trim(),
        timing: batchForm.timing.trim(),
        meetLink: batchForm.meetLink.trim(),
        status: batchForm.status || 'Active',
        startDate: batchForm.startDate || '',
        endDate: batchForm.endDate || '',
        description: batchForm.description || '',
      };
      saveBatchData(columns, rows, updated);
      setIsBatchModalOpen(false);
      showSuccess(`Batch "${updated.name}" updated successfully.`, 'Batch Updated');
      return;
    }

    // CREATE MODE
    const newBatch = {
      ...batchForm,
      id: `batch_${Date.now().toString(36)}`,
      code:
        batchForm.code.trim() ||
        `AF-${batchForm.field.slice(0, 2).toUpperCase()}-${batches.length + 1}`,
      columns: [
        { key: 'name', label: 'Student Name', type: 'text', width: 200, required: true },
        { key: 'email', label: 'Email', type: 'email', width: 220 },
        { key: 'lmsUsername', label: 'User Name', type: 'text', width: 150 },
        { key: 'lmsPassword', label: 'Password', type: 'text', width: 140 },
      ],
      rows: [],
    };

    onCreateBatch(newBatch);
    setActiveBatchId(newBatch.id);
    setIsBatchModalOpen(false);
    showSuccess(`Created batch "${newBatch.name}". You can now add dynamic columns and students.`, 'Batch Created');
  };

  // --- IN-PLACE BATCH DETAILS SUBMIT (TIGHTLY COUPLED WITH TABLE) ---
  const handleSaveDetailsForm = (e) => {
    if (e) e.preventDefault();
    if (!detailsForm.name.trim()) {
      showWarning('Batch name is required.', 'Input required');
      return;
    }
    if (!currentBatch) return;

    const updated = {
      ...currentBatch,
      name: detailsForm.name.trim(),
      code: detailsForm.code.trim() || currentBatch.code,
      field: detailsForm.field || currentBatch.field,
      trainer: detailsForm.trainer.trim(),
      timing: detailsForm.timing.trim(),
      meetLink: detailsForm.meetLink.trim(),
      status: detailsForm.status || 'Active',
      startDate: detailsForm.startDate || '',
      endDate: detailsForm.endDate || '',
      description: detailsForm.description || '',
    };

    saveBatchData(columns, rows, updated);
    showSuccess(`Batch details for "${updated.name}" updated alongside live table.`, 'Batch Saved');
  };

  const handleResetDetailsForm = () => {
    if (currentBatch) {
      setDetailsForm({
        name: currentBatch.name || '',
        code: currentBatch.code || '',
        field: currentBatch.field || fields[0],
        trainer: currentBatch.trainer || '',
        timing: currentBatch.timing || '',
        meetLink: currentBatch.meetLink || '',
        status: currentBatch.status || 'Active',
        startDate: currentBatch.startDate || '',
        endDate: currentBatch.endDate || '',
        description: currentBatch.description || '',
      });
    }
  };

  return (
    <div className="dynamic-table-container">
      {/* Top Banner & Batch Navigation T      {/* Top Banner & Batch Navigation Tabs */}
      <Paper withBorder radius="lg" p="md" mb="md" className="batch-tabs-panel">
        <Group justify="space-between" align="center" wrap="wrap" gap="md" className="batch-tabs-header-group">
          <Group gap="sm" wrap="wrap" className="batch-tabs-title-group">
            <ThemeIcon size={38} radius="md" variant="light" color="indigo" className="batch-tabs-icon">
              <IconTable size={20} />
            </ThemeIcon>
            <div className="batch-tabs-title-text">
              <Text fw={800} size="md" c="dark.5">
                Dynamic Batch Spreadsheet
              </Text>
              <Text size="xs" c="dimmed">
                Spreadsheet database with dynamic custom columns, inline cell editing, and Excel/CSV import & export.
              </Text>
            </div>
          </Group>

          <div className="batch-tabs-top-actions">
            <Button
              size="xs"
              variant="light"
              color="teal"
              leftSection={<IconFileSpreadsheet size={15} />}
              onClick={handleOpenImport}
              className="batch-top-action-btn"
            >
              <span className="btn-label-desktop">Import Batch</span>
              <span className="btn-label-mobile">Import</span>
            </Button>
            <Button
              size="xs"
              color="indigo"
              leftSection={<IconPlus size={15} />}
              onClick={handleOpenCreateBatch}
              className="batch-top-action-btn"
            >
              <span className="btn-label-desktop">New Batch</span>
              <span className="btn-label-mobile">+ New</span>
            </Button>
            {currentBatch && (
              <Button
                size="xs"
                variant="light"
                color="indigo"
                leftSection={<IconEdit size={14} />}
                onClick={() => handleOpenEditBatch(currentBatch)}
                className="batch-top-action-btn"
              >
                <span className="btn-label-desktop">Edit Batch</span>
                <span className="btn-label-mobile">Edit</span>
              </Button>
            )}
          </div>
        </Group>

        {/* Batch Selection Tabs - Sleek Horizontal Scroll Strip */}
        <ScrollArea mt="sm" type="never" className="batch-tabs-scroll-area">
          <Tabs
            value={activeBatchId}
            onChange={(val) => {
              setActiveBatchId(val);
              setEditingCell(null);
            }}
            variant="pills"
          >
            <Tabs.List className="batch-tabs-pills-list">
              {batches.map((batch) => (
                <Tabs.Tab
                  key={batch.id}
                  value={batch.id}
                  className="batch-tab-item"
                  leftSection={
                    <Badge size="xs" variant="filled" color={batch.id === activeBatchId ? 'indigo' : 'gray'} radius="sm">
                      {batch.code || 'BATCH'}
                    </Badge>
                  }
                >
                  {batch.name}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>
        </ScrollArea>
      </Paper>

      {/* Active Batch Summary & Spreadsheet Toolbar */}
      {currentBatch && (
        <>
          <Paper withBorder radius="lg" p="md" mb="md" className="sheet-toolbar-panel">
            <div className="sheet-toolbar-content">
              {/* Batch Info Header */}
              <div className="sheet-header-info">
                <div className="sheet-title-row">
                  <div className="sheet-title-wrap">
                    {isEditingTitle ? (
                      <Group gap={6} align="center">
                        <TextInput
                          size="xs"
                          autoFocus
                          value={titleEditValue}
                          onChange={(e) => setTitleEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveTitleEdit();
                            if (e.key === 'Escape') handleCancelTitleEdit();
                          }}
                          styles={{ input: { fontWeight: 800, fontSize: 16 } }}
                          placeholder="Batch name / title"
                        />
                        <ActionIcon size="sm" color="teal" variant="filled" onClick={handleSaveTitleEdit} aria-label="Save Title">
                          <IconCheck size={14} />
                        </ActionIcon>
                        <ActionIcon size="sm" color="gray" variant="light" onClick={handleCancelTitleEdit} aria-label="Cancel Title">
                          <IconX size={14} />
                        </ActionIcon>
                      </Group>
                    ) : (
                      <Tooltip label="Click to edit batch title" withArrow>
                        <span className="batch-title-inline" onClick={handleStartTitleEdit}>
                          <Text fw={800} size="lg" c="dark.5" className="sheet-batch-title">
                            {currentBatch.name}
                          </Text>
                          <IconEdit size={14} color="#6366f1" className="title-edit-hint" />
                        </span>
                      </Tooltip>
                    )}
                  </div>

                  <div className="sheet-badges-row">
                    <Badge color={statusColor(currentBatch.status)} variant="light" size="sm">
                      {currentBatch.status}
                    </Badge>
                    <Badge color="gray" variant="outline" size="sm">
                      {currentBatch.field}
                    </Badge>
                    {currentBatch.code && (
                      <Badge color="indigo" variant="outline" size="sm">
                        {currentBatch.code}
                      </Badge>
                    )}
                    {isDetailsDirty && (
                      <Badge color="orange" variant="filled" size="xs">
                        Unsaved
                      </Badge>
                    )}
                    <Tooltip label={isDetailsPanelOpen ? 'Collapse Batch Details Editor' : 'Edit Batch Details (Tightly Coupled with Table)'} withArrow>
                      <ActionIcon
                        variant={isDetailsPanelOpen ? 'filled' : 'subtle'}
                        color="indigo"
                        size="sm"
                        radius="md"
                        onClick={() => setIsDetailsPanelOpen((prev) => !prev)}
                        aria-label="Toggle Batch Details Editor"
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </div>
                </div>

                <Text size="xs" c="dimmed" className="sheet-metadata-strip">
                  Trainer: <strong>{currentBatch.trainer || 'Unassigned'}</strong> · Timing: {currentBatch.timing || 'Schedule TBA'} · {rows.length} students enrolled · {columns.length} columns defined
                </Text>
              </div>

              {/* Quick Actions & Toolbar */}
              <div className="sheet-quick-actions-wrap">
                {/* Search Bar Row with Google Meet shortcut */}
                <div className="sheet-search-row">
                  <div className="sheet-search-box-wrap">
                    <SearchBox
                      value={search}
                      onChange={setSearch}
                      placeholder="Search table cells..."
                    />
                  </div>
                  {currentBatch.meetLink && (
                    <Tooltip label="Open Classroom Google Meet" withArrow>
                      <Button
                        component="a"
                        href={currentBatch.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        variant="light"
                        color="teal"
                        size="xs"
                        leftSection={<IconVideo size={15} />}
                        className="sheet-meet-btn"
                        aria-label="Join Meet"
                      >
                        Join Meet
                      </Button>
                    </Tooltip>
                  )}
                </div>

                {/* Justified Action Buttons Grid */}
                <div className="sheet-actions-grid">
                  {/* Pair 1: Primary Table Operations */}
                  <Button
                    size="xs"
                    color="teal"
                    leftSection={<IconPlus size={14} />}
                    onClick={handleAddRow}
                    className="sheet-grid-btn"
                  >
                    Add Row
                  </Button>

                  <Button
                    size="xs"
                    variant="light"
                    color="indigo"
                    leftSection={<IconPlus size={14} />}
                    onClick={() => setIsAddColOpen(true)}
                    className="sheet-grid-btn"
                  >
                    Add Column
                  </Button>

                  {/* Pair 2: Batch Config & LMS Columns Manager */}
                  <Button
                    size="xs"
                    variant={isDetailsPanelOpen ? 'filled' : 'light'}
                    color="indigo"
                    leftSection={isDetailsPanelOpen ? <IconChevronUp size={14} /> : <IconEdit size={14} />}
                    onClick={() => setIsDetailsPanelOpen((prev) => !prev)}
                    className="sheet-grid-btn"
                  >
                    <span className="btn-label-desktop">
                      {isDetailsPanelOpen ? 'Close Details Editor' : 'Edit Batch Details'}
                    </span>
                    <span className="btn-label-mobile">
                      {isDetailsPanelOpen ? 'Close Details' : 'Batch Details'}
                    </span>
                  </Button>

                  <Menu shadow="md" width={280} position="bottom-end" withinPortal closeOnItemClick={false}>
                    <Menu.Target>
                      <Button
                        size="xs"
                        variant="light"
                        color={lmsHiddenColumns.length > 0 ? 'orange' : 'indigo'}
                        leftSection={lmsHiddenColumns.length > 0 ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                        className="sheet-grid-btn"
                      >
                        <span className="btn-label-desktop">
                          {lmsHiddenColumns.length > 0
                            ? `LMS Hidden (${lmsHiddenColumns.length})`
                            : 'LMS Portal Columns'}
                        </span>
                        <span className="btn-label-mobile">
                          {lmsHiddenColumns.length > 0
                            ? `LMS Hidden (${lmsHiddenColumns.length})`
                            : 'LMS Columns'}
                        </span>
                      </Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                        <Group justify="space-between" align="center">
                          <div>
                            <Text size="xs" fw={700} c="dark.6">
                              LMS PORTAL VISIBILITY
                            </Text>
                            <Text size="10px" c="dimmed">
                              Columns visible to learners on LMS
                            </Text>
                          </div>
                          {lmsHiddenColumns.length > 0 && (
                            <Anchor
                              size="xs"
                              c="indigo"
                              style={{ cursor: 'pointer', fontWeight: 600 }}
                              onClick={handleShowAllOnLms}
                            >
                              Show All
                            </Anchor>
                          )}
                        </Group>
                      </div>

                      <ScrollArea.Autosize mah={280} type="auto">
                        <div style={{ padding: '6px' }}>
                          {columns.map((col) => {
                            const isHidden = !!(col.hiddenOnLms || col.hidden);
                            return (
                              <div
                                key={col.key}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  background: isHidden ? '#fef3c7' : 'transparent',
                                  marginBottom: '2px',
                                  cursor: 'pointer',
                                }}
                                onClick={() => handleToggleLmsVisibility(col.key)}
                              >
                                <Group gap={8} style={{ flex: 1, minWidth: 0 }}>
                                  <span style={{ color: isHidden ? '#d97706' : '#64748b', display: 'flex' }}>
                                    {getColIcon(col.type)}
                                  </span>
                                  <Text
                                    size="xs"
                                    fw={500}
                                    c={isHidden ? 'orange.9' : 'dark.7'}
                                    truncate
                                    style={{
                                      textDecoration: isHidden ? 'line-through' : 'none',
                                      opacity: isHidden ? 0.75 : 1,
                                    }}
                                  >
                                    {col.label}
                                  </Text>
                                </Group>
                                <Badge
                                  size="xs"
                                  variant="light"
                                  color={isHidden ? 'orange' : 'teal'}
                                  style={{ textTransform: 'none', cursor: 'pointer' }}
                                >
                                  {isHidden ? 'Hidden' : 'Visible'}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea.Autosize>
                    </Menu.Dropdown>
                  </Menu>

                  {/* Pair 3: Import & Export */}
                  <Button
                    size="xs"
                    variant="light"
                    color="teal"
                    leftSection={<IconFileSpreadsheet size={14} />}
                    onClick={handleOpenImport}
                    className="sheet-grid-btn"
                  >
                    <span className="btn-label-desktop">Import Excel / CSV</span>
                    <span className="btn-label-mobile">Import Excel</span>
                  </Button>

                  <Menu shadow="md" width={180} position="bottom-end">
                    <Menu.Target>
                      <Button
                        size="xs"
                        variant="default"
                        leftSection={<IconDownload size={14} />}
                        className="sheet-grid-btn"
                      >
                        Export Table
                      </Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconFileSpreadsheet size={14} />}
                        onClick={handleExportExcel}
                      >
                        Export Excel (.xlsx)
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconCloudUpload size={14} />}
                        onClick={handleExportCsv}
                      >
                        Export CSV (.csv)
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>

                  {/* Pair 4: LMS Portal Navigation & Table Clear */}
                  <Button
                    component={Link}
                    to="/lms-credential"
                    size="xs"
                    variant="light"
                    color="indigo"
                    leftSection={<IconExternalLink size={14} />}
                    className="sheet-grid-btn"
                  >
                    <span className="btn-label-desktop">View on LMS Portal</span>
                    <span className="btn-label-mobile">LMS Portal</span>
                  </Button>

                  {rows.length > 0 ? (
                    <Tooltip label={`Wipe spreadsheet table rows for "${currentBatch.name}"`} withArrow>
                      <Button
                        size="xs"
                        variant="light"
                        color="orange"
                        leftSection={<IconEraser size={14} />}
                        onClick={() => onClearTable?.(currentBatch)}
                        className="sheet-grid-btn"
                      >
                        Clear Table
                      </Button>
                    </Tooltip>
                  ) : (
                    <Tooltip label={`Delete "${currentBatch.name}" cohort & table`} withArrow>
                      <Button
                        size="xs"
                        variant="light"
                        color="red"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => onDeleteBatch?.(currentBatch)}
                        className="sheet-grid-btn"
                      >
                        Delete Table
                      </Button>
                    </Tooltip>
                  )}

                  {/* Destructive Delete Button: Clean Full Width Row if rows exist */}
                  {rows.length > 0 && (
                    <div className="sheet-grid-full-span">
                      <Tooltip label={`Delete "${currentBatch.name}" cohort & table`} withArrow>
                        <Button
                          size="xs"
                          variant="light"
                          color="red"
                          fullWidth
                          leftSection={<IconTrash size={14} />}
                          onClick={() => onDeleteBatch?.(currentBatch)}
                          className="sheet-grid-btn sheet-delete-btn"
                        >
                          <span className="btn-label-desktop">
                            Delete Table ({currentBatch.code || currentBatch.name})
                          </span>
                          <span className="btn-label-mobile">
                            Delete Table ({currentBatch.code || currentBatch.name})
                          </span>
                        </Button>
                      </Tooltip>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Paper>

          {/* COLLAPSIBLE TIGHTLY COUPLED BATCH DETAILS EDITOR */}
          <Collapse in={isDetailsPanelOpen}>
            <Paper withBorder radius="lg" p="md" mb="md" className="batch-details-editor-panel">
              <Group justify="space-between" align="center" mb="md" wrap="wrap" gap="xs">
                <Group gap="xs">
                  <ThemeIcon size={34} radius="md" color="indigo" variant="light">
                    <IconUsersGroup size={18} />
                  </ThemeIcon>
                  <div>
                    <Group gap="xs" align="center">
                      <Text fw={700} size="sm" c="dark.6">
                        Batch Details & Logistics (Tightly Coupled with Dynamic Table)
                      </Text>
                      {isDetailsDirty ? (
                        <Badge color="orange" size="xs" variant="light">
                          Unsaved Changes
                        </Badge>
                      ) : (
                        <Badge color="teal" size="xs" variant="light">
                          In Sync with Table
                        </Badge>
                      )}
                    </Group>
                    <Text size="xs" c="dimmed">
                      Edit batch name, trainer, schedule and classroom below. Changes are saved and coupled with the live table underneath.
                    </Text>
                  </div>
                </Group>

                <Group gap="xs">
                  <Button
                    size="xs"
                    variant="default"
                    onClick={handleResetDetailsForm}
                    disabled={!isDetailsDirty}
                    leftSection={<IconRefresh size={13} />}
                  >
                    Reset
                  </Button>
                  <Button
                    size="xs"
                    color="indigo"
                    onClick={handleSaveDetailsForm}
                    leftSection={<IconCheck size={14} />}
                  >
                    Save Batch Details
                  </Button>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="gray"
                    onClick={() => setIsDetailsPanelOpen(false)}
                    title="Close details editor"
                  >
                    <IconX size={15} />
                  </ActionIcon>
                </Group>
              </Group>

              <Divider mb="md" />

              <form onSubmit={handleSaveDetailsForm}>
                <div className="form-grid">
                  <TextInput
                    label="Batch Name (Title)"
                    placeholder="e.g. Batch AF-01 · Python Track"
                    required
                    radius="md"
                    leftSection={<IconUsersGroup size={16} color="#4f46e5" />}
                    value={detailsForm.name}
                    onChange={(e) => updateDetailsFormField('name', e.target.value)}
                  />

                  <TextInput
                    label="Batch Code"
                    placeholder="e.g. AF-PY-01"
                    radius="md"
                    leftSection={<IconTag size={16} color="#6366f1" />}
                    value={detailsForm.code}
                    onChange={(e) => updateDetailsFormField('code', e.target.value)}
                  />

                  <Select
                    label="Training Track / Field"
                    data={fields.map((f) => ({ value: f, label: f }))}
                    value={detailsForm.field}
                    onChange={(val) => updateDetailsFormField('field', val || fields[0])}
                    required
                    radius="md"
                    leftSection={<IconTag size={16} color="#0d9488" />}
                  />

                  <TextInput
                    label="Assigned Trainer / Facilitator"
                    placeholder="Trainer name"
                    radius="md"
                    leftSection={<IconUser size={16} color="#4f46e5" />}
                    value={detailsForm.trainer}
                    onChange={(e) => updateDetailsFormField('trainer', e.target.value)}
                  />

                  <FacebookTimingPicker
                    label="Class Timing"
                    radius="md"
                    value={detailsForm.timing}
                    onChange={(val) => updateDetailsFormField('timing', val)}
                  />

                  <Select
                    label="Batch Status"
                    data={batchStatuses.map((s) => ({ value: s, label: s }))}
                    value={detailsForm.status}
                    onChange={(val) => updateDetailsFormField('status', val || 'Active')}
                    required
                    radius="md"
                    leftSection={<IconTag size={16} color="#6366f1" />}
                  />

                  <FacebookDatePicker
                    label="Batch Start Date"
                    placeholder="Select start date"
                    radius="md"
                    leftSection={<IconCalendar size={16} color="#4f46e5" />}
                    value={detailsForm.startDate || ''}
                    onChange={(val) => updateDetailsFormField('startDate', val)}
                  />

                  <FacebookDatePicker
                    label="Target Completion Date"
                    placeholder="Select target end date"
                    radius="md"
                    leftSection={<IconCalendar size={16} color="#4f46e5" />}
                    value={detailsForm.endDate || ''}
                    onChange={(val) => updateDetailsFormField('endDate', val)}
                  />

                  <div className="full-field">
                    <TextInput
                      label="Google Meet Classroom Link"
                      placeholder="https://meet.google.com/..."
                      radius="md"
                      leftSection={<IconVideo size={16} color="#0d9488" />}
                      rightSection={
                        detailsForm.meetLink ? (
                          <ActionIcon
                            component="a"
                            href={detailsForm.meetLink}
                            target="_blank"
                            rel="noreferrer"
                            variant="subtle"
                            color="teal"
                            size="sm"
                            title="Test open Google Meet link"
                          >
                            <IconExternalLink size={14} />
                          </ActionIcon>
                        ) : null
                      }
                      value={detailsForm.meetLink}
                      onChange={(e) => updateDetailsFormField('meetLink', e.target.value)}
                    />
                  </div>

                  <div className="full-field">
                    <Textarea
                      label="Batch Description & Curriculum Notes"
                      placeholder="Course syllabus highlights, tools covered, objectives..."
                      radius="md"
                      minRows={2}
                      autosize
                      value={detailsForm.description}
                      onChange={(e) => updateDetailsFormField('description', e.target.value)}
                    />
                  </div>
                </div>

                <Group justify="flex-end" mt="md" pt="xs">
                  <Button
                    size="xs"
                    variant="default"
                    onClick={() => setIsDetailsPanelOpen(false)}
                  >
                    Collapse Editor
                  </Button>
                  <Button
                    size="xs"
                    color="indigo"
                    type="submit"
                    leftSection={<IconCheck size={14} />}
                  >
                    Save Batch Details & Keep Table
                  </Button>
                </Group>
              </form>
            </Paper>
          </Collapse>
        </>
      )}

      {/* EXCEL-LIKE SPREADSHEET TABLE */}
      <Paper withBorder radius="lg" className="spreadsheet-card-container">
        <ScrollArea type="auto" style={{ width: '100%', maxWidth: '100%' }}>
          <Table
            verticalSpacing="sm"
            horizontalSpacing="md"
            withTableBorder
            withColumnBorders
            striped
            highlightOnHover
            miw={1000}
            className="mantine-batch-table"
          >
            {/* Table Header with Dynamic Columns */}
            <Table.Thead>
              <Table.Tr className="lms-th-row">
                {/* Index Column */}
                <Table.Th w={50} ta="center">
                  #
                </Table.Th>

                {/* Dynamically created columns */}
                {columns.map((col, colIndex) => {
                  const isLmsHidden = !!(col.hiddenOnLms || col.hidden);
                  return (
                    <Table.Th
                      key={col.key}
                      w={col.width || 170}
                      draggable
                      onDragStart={(e) => handleColDragStart(e, colIndex)}
                      onDragOver={handleColDragOver}
                      onDragEnter={(e) => handleColDragEnter(e, colIndex)}
                      onDragLeave={handleColDragLeave}
                      onDrop={(e) => handleColDrop(e, colIndex)}
                      onDragEnd={handleColDragEnd}
                      className="th-draggable"
                      title="Drag to reorder column"
                    >
                      <div className="th-content-wrapper">
                        <Group gap={6} wrap="nowrap" align="center" style={{ flex: 1, minWidth: 0 }}>
                          <span className="col-grip-icon" title="Drag to reorder column">
                            <IconGripVertical size={13} />
                          </span>
                          <span style={{ color: '#93c5fd', display: 'flex' }}>
                            {getColIcon(col.type)}
                          </span>
                          <Text size="xs" fw={700} c="white" truncate title={col.label}>
                            {col.label}
                          </Text>
                          {isLmsHidden && (
                            <Badge
                              size="xs"
                              variant="filled"
                              color="orange"
                              title="This column is hidden on LMS Portal for learners"
                              style={{
                                fontSize: '9px',
                                height: '16px',
                                padding: '0 4px',
                                textTransform: 'none',
                                flexShrink: 0,
                              }}
                            >
                              LMS Hidden
                            </Badge>
                          )}
                        </Group>

                        {/* Column Header Dropdown Menu */}
                        <Menu position="bottom-end" shadow="md" width={190} withinPortal>
                          <Menu.Target>
                            <ActionIcon
                              size="xs"
                              variant="subtle"
                              color="gray.4"
                              aria-label="Column Options"
                              style={{ color: '#cbd5e1' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <IconDots size={13} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconEdit size={14} />}
                              onClick={() => handleOpenRename(col)}
                            >
                              Edit Column & Type
                            </Menu.Item>

                            <Menu.Divider />
                            <Menu.Label>Change Data Type</Menu.Label>

                            <Menu.Item
                              leftSection={<IconTypography size={14} color="#64748b" />}
                              rightSection={(!col.type || col.type === 'text') && <IconCheck size={14} color="#4f46e5" />}
                              onClick={() => handleChangeColType(col.key, 'text')}
                            >
                              Text
                            </Menu.Item>

                            <Menu.Item
                              leftSection={<IconHash size={14} color="#2563eb" />}
                              rightSection={col.type === 'number' && <IconCheck size={14} color="#2563eb" />}
                              onClick={() => handleChangeColType(col.key, 'number')}
                            >
                              Number (#)
                            </Menu.Item>

                            <Menu.Item
                              leftSection={<IconCalendar size={14} color="#0d9d8b" />}
                              rightSection={col.type === 'date' && <IconCheck size={14} color="#0d9d8b" />}
                              onClick={() => handleChangeColType(col.key, 'date')}
                            >
                              Date
                            </Menu.Item>

                            <Menu.Item
                              leftSection={<IconPhone size={14} color="#16a34a" />}
                              rightSection={col.type === 'phone' && <IconCheck size={14} color="#16a34a" />}
                              onClick={() => handleChangeColType(col.key, 'phone')}
                            >
                              Phone / Mobile
                            </Menu.Item>

                            <Menu.Item
                              leftSection={<IconMail size={14} color="#0284c7" />}
                              rightSection={col.type === 'email' && <IconCheck size={14} color="#0284c7" />}
                              onClick={() => handleChangeColType(col.key, 'email')}
                            >
                              Email
                            </Menu.Item>

                            <Menu.Item
                              leftSection={<IconTag size={14} color="#d97706" />}
                              rightSection={col.type === 'select' && <IconCheck size={14} color="#d97706" />}
                              onClick={() => handleChangeColType(col.key, 'select')}
                            >
                              Dropdown / Tag
                            </Menu.Item>

                            <Menu.Item
                              leftSection={<IconSettings size={14} color="#d97706" />}
                              onClick={() => handleOpenConfigCol(col)}
                            >
                              Configure Choices...
                            </Menu.Item>

                            <Menu.Divider />
                            <Menu.Item
                              leftSection={
                                isLmsHidden ? (
                                  <IconEye size={14} color="#16a34a" />
                                ) : (
                                  <IconEyeOff size={14} color="#f59e0b" />
                                )
                              }
                              onClick={() => handleToggleLmsVisibility(col.key)}
                            >
                              {isLmsHidden ? 'Show on LMS Portal' : 'Hide on LMS Portal'}
                            </Menu.Item>
                            <Menu.Item
                              color="red"
                              leftSection={<IconTrash size={14} />}
                              onClick={() => handleDeleteColumn(col.key)}
                            >
                              Delete Column
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </div>
                    </Table.Th>
                  );
                })}

                {/* Quick Add Column shortcut header */}
                <Table.Th w={50} ta="center" style={{ background: '#1e3a8a' }}>
                  <Tooltip label="Add another column" withArrow>
                    <ActionIcon
                      variant="light"
                      color="indigo.1"
                      size="sm"
                      radius="md"
                      onClick={() => setIsAddColOpen(true)}
                      aria-label="Add Column"
                    >
                      <IconPlus size={15} />
                    </ActionIcon>
                  </Tooltip>
                </Table.Th>

                {/* Rightmost Action Column Header */}
                <Table.Th w={60} ta="center" style={{ background: '#1e3a8a' }}>
                  <Text size="xs" fw={700} c="white" title="Row Actions">
                    Action
                  </Text>
                </Table.Th>
              </Table.Tr>
            </Table.Thead>

            {/* Table Body with Inline Editable Cells */}
            <Table.Tbody>
              {filteredRows.length ? (
                filteredRows.map((row, rowIndex) => (
                  <Table.Tr
                    key={row.id}
                    draggable
                    onDragStart={(e) => handleRowDragStart(e, rowIndex)}
                    onDragOver={handleRowDragOver}
                    onDragEnter={(e) => handleRowDragEnter(e, rowIndex)}
                    onDragLeave={handleRowDragLeave}
                    onDrop={(e) => handleRowDrop(e, rowIndex)}
                    onDragEnd={handleRowDragEnd}
                    className="mantine-batch-row"
                  >
                    {/* Index & Drag Handle only */}
                    <Table.Td ta="center">
                      <div className="row-index-wrap">
                        <span
                          className="row-grip-handle"
                          title="Drag to reorder row"
                        >
                          <IconGripVertical size={13} />
                        </span>
                        <span className="lms-num-badge">{rowIndex + 1}</span>
                      </div>
                    </Table.Td>

                    {/* Dynamic Cells */}
                    {columns.map((col) => {
                      const isEditing =
                        editingCell?.rowId === row.id && editingCell?.colKey === col.key;
                      const cellValue = row[col.key];

                      return (
                        <Table.Td
                          key={col.key}
                          className={`excel-td ${isEditing ? 'is-editing' : ''}`}
                          onClick={() => {
                            if (!isEditing) startEditing(row.id, col.key, cellValue);
                          }}
                        >
                          {isEditing ? (
                            <div className="inline-editor-wrap">
                              <CellEditor
                                col={col}
                                rowId={row.id}
                                editValue={editValue}
                                setEditValue={setEditValue}
                                options={selectOptionsMap[col.key]}
                                onCommit={commitCellEdit}
                                onCancel={cancelCellEdit}
                                onSelectChange={handleSelectCellChange}
                              />
                            </div>
                          ) : (
                            <div className="cell-display-value">
                              <CellDisplay col={col} cellValue={cellValue} />
                            </div>
                          )}
                        </Table.Td>
                      );
                    })}

                    {/* Empty cell under Add Column */}
                    <Table.Td ta="center" style={{ background: '#f8fafc' }} />

                    {/* Delete Row action at the right end of the table */}
                    <Table.Td ta="center" className="row-action-td">
                      <Tooltip label="Delete row" withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="sm"
                          radius="md"
                          className="table-row-del-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRow(row.id);
                          }}
                          aria-label="Delete Row"
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={columns.length + 3} ta="center" py="xl">
                    <Text size="sm" c="dimmed">
                      {search
                        ? 'No rows match your search filter.'
                        : 'No student rows in this batch spreadsheet yet.'}
                    </Text>
                    <Button
                      size="xs"
                      mt="sm"
                      variant="light"
                      leftSection={<IconPlus size={14} />}
                      onClick={handleAddRow}
                    >
                      Add First Row
                    </Button>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        {/* Quick Add Row footer */}
        <div className="spreadsheet-footer-bar">
          <Button
            size="xs"
            variant="subtle"
            leftSection={<IconPlus size={14} />}
            onClick={handleAddRow}
          >
            Add Row
          </Button>
          <Text size="xs" c="dimmed">
            Tip: Click any cell to edit directly. Hit Enter to save.
          </Text>
          <Text size="xs" fw={700} c="dimmed">
            {filteredRows.length} rows · {columns.length} columns
          </Text>
        </div>
      </Paper>

      {/* MODAL: ADD DYNAMIC COLUMN */}
      <Modal
        opened={isAddColOpen}
        onClose={() => setIsAddColOpen(false)}
        title={
          <div>
            <Text fw={800} size="md">
              Add New Column to Batch Table
            </Text>
            <Text size="xs" c="dimmed">
              Create any custom field dynamically like in Excel (e.g. Aadhar No, GitHub, Final Score).
            </Text>
          </div>
        }
        centered
        size="md"
      >
        <form onSubmit={handleAddColumn}>
          <TextInput
            label="Column Name / Header"
            placeholder="e.g. Assessment Score, GitHub URL, Laptop Issued, Father Name..."
            required
            autoFocus
            value={newColLabel}
            onChange={(e) => setNewColLabel(e.target.value)}
            mb="md"
          />

          <Select
            label="Column Data Type"
            data={[
              { value: 'text', label: 'Text (Regular text or notes)' },
              { value: 'number', label: 'Number (Scores, percentage, amounts)' },
              { value: 'select', label: 'Select / Tag (Predefined status choices)' },
              { value: 'date', label: 'Date (Enrollment, exam date, etc.)' },
              { value: 'email', label: 'Email' },
              { value: 'phone', label: 'Phone' },
              { value: 'link', label: 'URL / Link' },
            ]}
            value={newColType}
            onChange={(val) => setNewColType(val || 'text')}
            mb="md"
          />

          {newColType === 'select' && (
            <TextInput
              label="Select Options (comma-separated)"
              placeholder="e.g. Pass, Fail, Pending, Retest"
              description="Enter options separated by comma"
              value={newColOptions}
              onChange={(e) => setNewColOptions(e.target.value)}
              mb="md"
            />
          )}

          <Group justify="flex-end" mt="xl">
            <Button variant="default" onClick={() => setIsAddColOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" color="indigo" leftSection={<IconCheck size={16} />}>
              Create Column
            </Button>
          </Group>
        </form>
      </Modal>

      {/* MODAL: EDIT COLUMN & DATA TYPE */}
      <Modal
        opened={isRenameColOpen}
        onClose={() => setIsRenameColOpen(false)}
        title="Edit Column & Data Type"
        centered
        size="sm"
      >
        <form onSubmit={handleSaveRename}>
          <TextInput
            label="Column Label"
            required
            autoFocus
            value={renameLabel}
            onChange={(e) => setRenameLabel(e.target.value)}
            mb="md"
          />
          <Select
            label="Column Data Type"
            data={[
              { value: 'text', label: 'Text (General text or notes)' },
              { value: 'number', label: 'Number (Count, score, percentage)' },
              { value: 'date', label: 'Date (Calendar date)' },
              { value: 'phone', label: 'Phone / Mobile' },
              { value: 'email', label: 'Email' },
              { value: 'select', label: 'Select / Tag (Predefined choices)' },
              { value: 'link', label: 'URL / Link' },
            ]}
            value={renameType}
            onChange={(val) => setRenameType(val || 'text')}
            mb="lg"
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setIsRenameColOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" color="indigo" leftSection={<IconCheck size={16} />}>
              Save Changes
            </Button>
          </Group>
        </form>
      </Modal>

      {/* MODAL: CONFIGURE DROPDOWN / OPTIONS COLUMN */}
      <Modal
        opened={isConfigColOpen}
        onClose={() => setIsConfigColOpen(false)}
        title={
          <Group gap="xs">
            <ThemeIcon color="orange" variant="light" size="sm">
              <IconTag size={15} />
            </ThemeIcon>
            <Text fw={700} size="sm">
              Configure Dropdown Options: {configuringCol?.label}
            </Text>
          </Group>
        }
        centered
        size="md"
      >
        <form onSubmit={handleSaveConfigCol}>
          <Text size="xs" c="dimmed" mb="sm">
            Specify choices or status tags for this column. When editing rows, learners can pick from these dropdown items.
          </Text>

          <TextInput
            label="Options (comma-separated)"
            placeholder="e.g. Active, Completed, On hold"
            description="Enter choices separated by comma"
            value={configColOptions}
            onChange={(e) => setConfigColOptions(e.target.value)}
            mb="sm"
          />

          {configColExtractedValues.length > 0 && (
            <Paper p="xs" radius="sm" withBorder bg="var(--mantine-color-gray-0)" mb="md">
              <Group justify="space-between" mb={4}>
                <Text size="xs" fw={700} c="dimmed">
                  Values found in uploaded data ({configColExtractedValues.length}):
                </Text>
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="teal"
                  onClick={() => {
                    const combined = [
                      ...new Set([
                        ...configColOptions.split(',').map((s) => s.trim()).filter(Boolean),
                        ...configColExtractedValues,
                      ]),
                    ].join(', ');
                    setConfigColOptions(combined);
                  }}
                >
                  + Add All Values
                </Button>
              </Group>
              <Group gap={4} wrap="wrap">
                {configColExtractedValues.map((v) => (
                  <Badge
                    key={v}
                    size="xs"
                    variant="outline"
                    color="indigo"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      const cur = configColOptions.split(',').map((s) => s.trim()).filter(Boolean);
                      if (!cur.includes(v)) {
                        setConfigColOptions([...cur, v].join(', '));
                      }
                    }}
                  >
                    + {v}
                  </Badge>
                ))}
              </Group>
            </Paper>
          )}

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setIsConfigColOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" color="indigo" leftSection={<IconCheck size={16} />}>
              Save Options
            </Button>
          </Group>
        </form>
      </Modal>

      {/* MODAL: CREATE OR EDIT BATCH */}
      <Modal
        opened={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        title={
          <Group gap="sm" align="center" wrap="nowrap">
            <ThemeIcon size={38} radius="md" color="indigo" variant="light">
              <IconUsersGroup size={20} />
            </ThemeIcon>
            <div>
              <Group gap="xs" align="center">
                <Text fw={800} size="md" c="dark.6">
                  {batchModalMode === 'edit'
                    ? `Edit Batch: ${currentBatch?.name || 'Cohort'}`
                    : 'Create New Student Batch'}
                </Text>
                <Badge color="indigo" variant="light" size="xs">
                  {batchModalMode === 'edit' ? 'Edit Mode' : 'New Cohort'}
                </Badge>
              </Group>
              <Text size="xs" c="dimmed">
                {batchModalMode === 'edit'
                  ? 'Update batch details, trainer assignment, schedule, and Google Meet classroom.'
                  : 'Create a training cohort with its own dedicated interactive spreadsheet.'}
              </Text>
            </div>
          </Group>
        }
        centered
        size="lg"
        radius="lg"
        padding="xl"
        scrollAreaComponent={ScrollArea.Autosize}
        yOffset="3vh"
      >
        {batchModalMode === 'edit' ? (
          <Tabs value={batchModalTab} onChange={setBatchModalTab} variant="outline" radius="md">
            <Tabs.List mb="md">
              <Tabs.Tab value="details" leftSection={<IconUsersGroup size={15} />}>
                Batch Details & Schedule
              </Tabs.Tab>
              <Tabs.Tab
                value="table"
                leftSection={<IconTable size={15} />}
                rightSection={
                  <Badge size="xs" color="indigo" variant="light">
                    {rows.length}
                  </Badge>
                }
              >
                Table & Student Roster
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="details">
              <form onSubmit={handleBatchFormSubmit}>
                <div className="form-grid">
                  <TextInput
                    label="Batch Name (Title)"
                    placeholder="e.g. Batch AF-06 · Python Track"
                    required
                    autoFocus
                    radius="md"
                    leftSection={<IconUsersGroup size={16} color="#4f46e5" />}
                    value={batchForm.name}
                    onChange={(e) => updateBatchFormField('name', e.target.value)}
                  />

                  <TextInput
                    label="Batch Code"
                    placeholder="e.g. AF-PY-06"
                    radius="md"
                    leftSection={<IconTag size={16} color="#6366f1" />}
                    value={batchForm.code}
                    onChange={(e) => updateBatchFormField('code', e.target.value)}
                  />

                  <Select
                    label="Training Field / Track"
                    data={fields.map((f) => ({ value: f, label: f }))}
                    value={batchForm.field}
                    onChange={(val) => updateBatchFormField('field', val || fields[0])}
                    required
                    radius="md"
                    leftSection={<IconTag size={16} color="#0d9488" />}
                  />

                  <TextInput
                    label="Assigned Trainer / Facilitator"
                    placeholder="Trainer name"
                    radius="md"
                    leftSection={<IconUser size={16} color="#4f46e5" />}
                    value={batchForm.trainer}
                    onChange={(e) => updateBatchFormField('trainer', e.target.value)}
                  />

                  <FacebookTimingPicker
                    label="Class Timing"
                    radius="md"
                    value={batchForm.timing}
                    onChange={(val) => updateBatchFormField('timing', val)}
                  />

                  <Select
                    label="Batch Status"
                    data={batchStatuses.map((s) => ({ value: s, label: s }))}
                    value={batchForm.status}
                    onChange={(val) => updateBatchFormField('status', val || 'Active')}
                    required
                    radius="md"
                    leftSection={<IconTag size={16} color="#6366f1" />}
                  />

                  <FacebookDatePicker
                    label="Batch Start Date"
                    placeholder="Select start date"
                    radius="md"
                    leftSection={<IconCalendar size={16} color="#4f46e5" />}
                    value={batchForm.startDate || ''}
                    onChange={(val) => updateBatchFormField('startDate', val)}
                  />

                  <FacebookDatePicker
                    label="Target Completion Date"
                    placeholder="Select target end date"
                    radius="md"
                    leftSection={<IconCalendar size={16} color="#4f46e5" />}
                    value={batchForm.endDate || ''}
                    onChange={(val) => updateBatchFormField('endDate', val)}
                  />

                  <div className="full-field">
                    <TextInput
                      label="Google Meet Classroom Link"
                      placeholder="https://meet.google.com/..."
                      radius="md"
                      leftSection={<IconVideo size={16} color="#0d9488" />}
                      value={batchForm.meetLink}
                      onChange={(e) => updateBatchFormField('meetLink', e.target.value)}
                    />
                  </div>

                  <div className="full-field">
                    <Textarea
                      label="Batch Description & Notes"
                      placeholder="Syllabus highlights, objectives..."
                      radius="md"
                      minRows={2}
                      autosize
                      value={batchForm.description || ''}
                      onChange={(e) => updateBatchFormField('description', e.target.value)}
                    />
                  </div>
                </div>

                <Group justify="space-between" mt="xl" pt="sm">
                  <Button
                    variant="subtle"
                    color="indigo"
                    size="xs"
                    leftSection={<IconTable size={15} />}
                    onClick={() => {
                      setIsBatchModalOpen(false);
                      setIsDetailsPanelOpen(true);
                    }}
                  >
                    Open in Full Interactive Spreadsheet
                  </Button>
                  <Group gap="xs">
                    <Button variant="default" radius="md" onClick={() => setIsBatchModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" color="indigo" radius="md" leftSection={<IconCheck size={16} />}>
                      Save Changes
                    </Button>
                  </Group>
                </Group>
              </form>
            </Tabs.Panel>

            <Tabs.Panel value="table">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Group justify="space-between" align="center" wrap="wrap">
                  <div>
                    <Text fw={700} size="sm">
                      Enrolled Learners & Table Data
                    </Text>
                    <Text size="xs" c="dimmed">
                      {rows.length} students enrolled · {columns.length} dynamic columns defined
                    </Text>
                  </div>
                  <Group gap="xs">
                    <Button
                      size="xs"
                      color="teal"
                      leftSection={<IconPlus size={14} />}
                      onClick={handleAddRow}
                    >
                      Add Row
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      color="indigo"
                      leftSection={<IconTable size={14} />}
                      onClick={() => {
                        setIsBatchModalOpen(false);
                        setIsDetailsPanelOpen(true);
                      }}
                    >
                      Open Live Spreadsheet
                    </Button>
                  </Group>
                </Group>

                <ScrollArea.Autosize mah={300} type="auto">
                  <table className="mini-roster-preview-table">
                    <thead>
                      <tr>
                        <th style={{ width: 40, textAlign: 'center' }}>#</th>
                        {columns.map((c) => (
                          <th key={c.key}>{c.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length ? (
                        rows.map((r, idx) => (
                          <tr key={r.id}>
                            <td style={{ textAlign: 'center', color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</td>
                            {columns.map((c) => (
                              <td key={c.key}>
                                <Text size="xs" truncate style={{ maxWidth: 160 }}>
                                  {r[c.key] || '—'}
                                </Text>
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                            No students enrolled in this batch yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </ScrollArea.Autosize>

                <Group justify="space-between" mt="md" pt="sm">
                  <Button
                    variant="subtle"
                    color="indigo"
                    size="xs"
                    leftSection={<IconTable size={14} />}
                    onClick={() => {
                      setIsBatchModalOpen(false);
                      setIsDetailsPanelOpen(true);
                    }}
                  >
                    Switch to Live Dynamic Spreadsheet
                  </Button>
                  <Button
                    color="indigo"
                    size="xs"
                    onClick={handleBatchFormSubmit}
                    leftSection={<IconCheck size={14} />}
                  >
                    Save Changes & Keep Table
                  </Button>
                </Group>
              </div>
            </Tabs.Panel>
          </Tabs>
        ) : (
          <form onSubmit={handleBatchFormSubmit}>
            <div className="form-grid">
              <TextInput
                label="Batch Name"
                placeholder="e.g. Batch AF-06 · Python Track"
                required
                autoFocus
                radius="md"
                leftSection={<IconUsersGroup size={16} color="#4f46e5" />}
                value={batchForm.name}
                onChange={(e) => updateBatchFormField('name', e.target.value)}
              />

              <TextInput
                label="Batch Code"
                placeholder="e.g. AF-PY-06"
                radius="md"
                leftSection={<IconTag size={16} color="#6366f1" />}
                value={batchForm.code}
                onChange={(e) => updateBatchFormField('code', e.target.value)}
              />

              <Select
                label="Training Field / Track"
                data={fields.map((f) => ({ value: f, label: f }))}
                value={batchForm.field}
                onChange={(val) => updateBatchFormField('field', val || fields[0])}
                required
                radius="md"
                leftSection={<IconTag size={16} color="#0d9488" />}
              />

              <TextInput
                label="Assigned Trainer / Facilitator"
                placeholder="Trainer name"
                radius="md"
                leftSection={<IconUser size={16} color="#4f46e5" />}
                value={batchForm.trainer}
                onChange={(e) => updateBatchFormField('trainer', e.target.value)}
              />

              <FacebookTimingPicker
                label="Class Timing"
                radius="md"
                value={batchForm.timing}
                onChange={(val) => updateBatchFormField('timing', val)}
              />

              <Select
                label="Batch Status"
                data={batchStatuses.map((s) => ({ value: s, label: s }))}
                value={batchForm.status}
                onChange={(val) => updateBatchFormField('status', val || 'Active')}
                required
                radius="md"
                leftSection={<IconTag size={16} color="#6366f1" />}
              />

              <FacebookDatePicker
                label="Batch Start Date"
                placeholder="Select start date"
                radius="md"
                leftSection={<IconCalendar size={16} color="#4f46e5" />}
                value={batchForm.startDate || ''}
                onChange={(val) => updateBatchFormField('startDate', val)}
              />

              <FacebookDatePicker
                label="Target Completion Date"
                placeholder="Select target end date"
                radius="md"
                leftSection={<IconCalendar size={16} color="#4f46e5" />}
                value={batchForm.endDate || ''}
                onChange={(val) => updateBatchFormField('endDate', val)}
              />

              <div className="full-field">
                <TextInput
                  label="Google Meet Classroom Link"
                  placeholder="https://meet.google.com/..."
                  radius="md"
                  leftSection={<IconVideo size={16} color="#0d9488" />}
                  value={batchForm.meetLink}
                  onChange={(e) => updateBatchFormField('meetLink', e.target.value)}
                />
              </div>
            </div>

            <Group justify="flex-end" mt="xl" pt="sm">
              <Button variant="default" radius="md" onClick={() => setIsBatchModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" color="indigo" radius="md" leftSection={<IconCheck size={16} />}>
                Create Batch & Spreadsheet
              </Button>
            </Group>
          </form>
        )}
      </Modal>

      {!onOpenImport && (
        <ImportEnrollmentModal
          opened={isInternalImportModalOpen}
          onClose={() => setIsInternalImportModalOpen(false)}
          batches={batches}
          currentBatch={currentBatch}
          onImportComplete={async ({ mode, batchPayload }) => {
            if (mode === 'create') {
              await onCreateBatch?.(batchPayload);
            } else {
              await onUpdateBatch?.(batchPayload);
              if (batchPayload.columns) setLocalColumns(batchPayload.columns);
              if (batchPayload.rows) setLocalRows(batchPayload.rows);
            }
          }}
        />
      )}
    </div>
  );
}
