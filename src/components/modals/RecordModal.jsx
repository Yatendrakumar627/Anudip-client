import React, { useEffect, useRef, useState } from 'react';
import {
  ActionIcon,
  Autocomplete,
  Badge,
  Button,
  Divider,
  Group,
  Modal,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import { Link } from 'react-router-dom';
import {
  DateInput,
  DateTimePicker,
} from '@mantine/dates';
import {
  FacebookDatePicker,
  FacebookTimePicker,
  FacebookTimingPicker,
} from '../common/FacebookDateTimePicker';
import {
  IconBriefcase,
  IconCalendar,
  IconCalendarEvent,
  IconCheck,
  IconClock,
  IconMail,
  IconPhone,
  IconPlus,
  IconSchool,
  IconTable,
  IconTag,
  IconUser,
  IconUserCheck,
  IconUsersGroup,
  IconVideo,
  IconX,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import { attendanceStatuses, fields } from '../../data';
import { studentFields, sessionFields, placementFields, batchFields } from '../../constants/formFields';
import { formatDuration, localDateInput, totalSeconds } from '../../utils/formatters';
import { showError } from '../../utils/notifications';

export default function RecordModal({
  opened,
  onClose,
  type,
  record,
  students = [],
  sessions = [],
  batches = [],
  onSave,
}) {
  const [form, setForm] = useState({});
  const [segments, setSegments] = useState([{ joinedAt: '', leftAt: '' }]);
  const [saving, setSaving] = useState(false);

  const typeMeta = {
    session: { icon: IconVideo, color: 'indigo', label: 'Training Session' },
    student: { icon: IconUser, color: 'teal', label: 'Student Learner' },
    batch: { icon: IconUsersGroup, color: 'blue', label: 'Student Batch' },
    attendance: { icon: IconCalendarEvent, color: 'cyan', label: 'Attendance Record' },
    placement: { icon: IconBriefcase, color: 'orange', label: 'Placement Offer' },
  }[type] || { icon: IconSchool, color: 'indigo', label: 'Record' };

  const TypeIcon = typeMeta.icon;

  const title = `${record ? 'Edit' : 'Add'} ${
    type === 'student'
      ? 'student'
      : type === 'session'
      ? 'training session'
      : type === 'batch'
      ? 'student batch'
      : type === 'attendance'
      ? 'attendance record'
      : 'placement'
  }`;

  const fieldDefinitions =
    type === 'student'
      ? studentFields
      : type === 'session'
      ? sessionFields
      : type === 'batch'
      ? batchFields
      : type === 'placement'
      ? placementFields
      : [];

  useEffect(() => {
    if (!opened) return;
    const today = dayjs().format('YYYY-MM-DD');
    const defaults =
      type === 'student'
        ? { field: fields[0], status: 'Active', enrollmentDate: today }
        : type === 'session'
        ? { field: fields[0], status: 'Upcoming', date: today, startTime: '10:00', endTime: '11:00' }
        : type === 'batch'
        ? { field: fields[0], status: 'Active', startDate: today }
        : type === 'placement'
        ? { status: 'Not started', packageLpa: '' }
        : { date: today, status: 'Present', source: 'manual' };

    setForm({ ...defaults, ...(record || {}) });

    if (type === 'attendance') {
      setSegments(
        record?.segments?.length
          ? record.segments.map((s) => ({
              joinedAt: localDateInput(s.joinedAt),
              leftAt: localDateInput(s.leftAt),
            }))
          : [{ joinedAt: '', leftAt: '' }]
      );
    }
  }, [opened, record, type]);

  const setValue = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };

      if (type === 'student' && !payload.meetDisplayName) {
        payload.meetDisplayName = payload.name;
      }

      if (payload.phone) {
        const digits = String(payload.phone).replace(/\D/g, '');
        if (digits.length !== 10) {
          throw new Error(`Mobile number must be exactly 10 digits (currently ${digits.length}).`);
        }
        payload.phone = digits;
      }

      if (payload.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(payload.email).trim())) {
          throw new Error('Please enter a valid email address (e.g. name@domain.com).');
        }
        payload.email = String(payload.email).trim().toLowerCase();
      }

      if (type === 'placement') {
        payload.packageLpa =
          payload.packageLpa === '' || payload.packageLpa == null
            ? null
            : Number(payload.packageLpa);
      }

      if (type === 'attendance') {
        const cleanedSegments = segments
          .filter((segment) => segment.joinedAt)
          .map((segment) => ({
            joinedAt: segment.joinedAt,
            leftAt: segment.leftAt || null,
          }));

        const invalidSegment = cleanedSegments.some((segment) => {
          const joined = new Date(segment.joinedAt).getTime();
          const left = segment.leftAt ? new Date(segment.leftAt).getTime() : null;
          return Number.isNaN(joined) || (left !== null && (Number.isNaN(left) || left <= joined));
        });

        if (invalidSegment) {
          throw new Error('Every leave time must be later than its join time.');
        }

        if (payload.status === 'Absent' && cleanedSegments.length > 0) {
          throw new Error(
            'An absent record cannot contain join/leave intervals. Clear the intervals or change the status.'
          );
        }

        payload.segments = cleanedSegments;
        payload.source = record ? 'manual_adjustment' : 'manual';
      }

      if (type === 'batch' && !record) {
        payload.columns = payload.columns || [
          { key: 'name', label: 'Student Name', type: 'text', width: 200, required: true },
          { key: 'email', label: 'Email', type: 'email', width: 220 },
          { key: 'lmsUsername', label: 'User Name', type: 'text', width: 150 },
          { key: 'lmsPassword', label: 'Password', type: 'text', width: 140 },
        ];
        payload.rows = payload.rows || [];
      }

      await onSave(type, payload, record?.id);
      onClose();
    } catch (error) {
      showError(error);
    } finally {
      setSaving(false);
    }
  };

  // Contextual icon resolver for modern, enhanced input fields
  const getFieldIcon = (field) => {
    const name = (field.name || '').toLowerCase();
    const fType = (field.type || '').toLowerCase();
    if (name.includes('meet') || name.includes('link') || name === 'meetlink') {
      return <IconVideo size={16} color="#0d9488" />;
    }
    if (name.includes('mail')) return <IconMail size={16} color="#6366f1" />;
    if (name.includes('phone')) return <IconPhone size={16} color="#16a34a" />;
    if (name.includes('trainer') || name.includes('facilitator')) {
      return <IconUserCheck size={16} color="#4f46e5" />;
    }
    if (name.includes('batch') || name.includes('cohort')) {
      return <IconUsersGroup size={16} color="#2563eb" />;
    }
    if (name === 'name' || name.includes('student')) {
      return <IconUser size={16} color="#4f46e5" />;
    }
    if (name.includes('title')) return <IconSchool size={16} color="#4f46e5" />;
    if (fType === 'date') return <IconCalendar size={16} color="#4f46e5" />;
    if (fType === 'time') return <IconClock size={16} color="#0d9488" />;
    if (fType === 'number' || name.includes('package')) {
      return <IconBriefcase size={16} color="#d97706" />;
    }
    if (fType === 'select-custom' || fType === 'select') {
      return <IconTag size={16} color="#6366f1" />;
    }
    return null;
  };

  const renderField = (field) => {
    const value = form[field.name] ?? '';
    const icon = getFieldIcon(field);

    const shared = {
      label: field.label,
      required: field.required,
      placeholder: field.placeholder,
      radius: 'md',
      leftSection: icon,
    };

    // 1. Date fields with Facebook-style DatePicker (formatted calendar + quick preset chips)
    if (field.type === 'date') {
      return (
        <FacebookDatePicker
          {...shared}
          value={value}
          onChange={(newDate) => setValue(field.name, newDate)}
        />
      );
    }

    // 2. Time fields with Facebook Event-style TimePicker (15-min interval dropdown + search + custom typing)
    if (field.type === 'time') {
      return (
        <FacebookTimePicker
          {...shared}
          value={value}
          onChange={(val) => setValue(field.name, val)}
        />
      );
    }

    // 2b. Timing range field (Class timing)
    if (field.name === 'timing' || field.type === 'timing') {
      return (
        <FacebookTimingPicker
          label={field.label}
          required={field.required}
          value={value}
          onChange={(val) => setValue(field.name, val)}
        />
      );
    }

    // 2.5 Batch picker autocomplete
    if (field.name === 'batch') {
      const batchNames = [...new Set(batches.map((b) => b.name).filter(Boolean))];
      return (
        <Autocomplete
          {...shared}
          value={value == null ? '' : String(value)}
          onChange={(next) => setValue(field.name, next)}
          data={batchNames}
          placeholder="Select or enter cohort name"
        />
      );
    }

    // 3. Custom select / Autocomplete
    if (field.type === 'select-custom') {
      return (
        <Autocomplete
          {...shared}
          value={value == null ? '' : String(value)}
          onChange={(next) => setValue(field.name, next)}
          data={fields}
        />
      );
    }

    // 4. Select dropdown
    if (field.type === 'select') {
      return (
        <Select
          {...shared}
          value={value == null ? '' : String(value)}
          onChange={(next) => setValue(field.name, next || '')}
          data={field.options}
          searchable
          clearable={false}
        />
      );
    }

    // 5. Student picker
    if (field.type === 'student') {
      return (
        <Select
          {...shared}
          value={value == null ? '' : String(value)}
          onChange={(next) => setValue(field.name, next || '')}
          data={students.map((s) => ({ value: s.id, label: `${s.name} · ${s.field || ''}` }))}
          searchable
        />
      );
    }

    // 6. Textarea
    if (field.type === 'textarea') {
      return (
        <Textarea
          {...shared}
          leftSection={undefined}
          value={value == null ? '' : String(value)}
          onChange={(event) => setValue(field.name, event.currentTarget.value)}
          minRows={3}
          autosize
        />
      );
    }

    // 7. Number field
    if (field.type === 'number') {
      return (
        <TextInput
          {...shared}
          value={value == null ? '' : String(value)}
          onChange={(event) => setValue(field.name, event.currentTarget.value)}
          type="number"
          min={0}
          step="0.1"
        />
      );
    }

    // 8. General TextInput with Phone (10 digits) & Email formatting
    const isPhoneField = field.name === 'phone' || field.type === 'phone' || /mobile|phone|contact/i.test(field.label || '');
    const isEmailField = field.name === 'email' || field.type === 'email' || /email/i.test(field.label || '');

    if (isPhoneField) {
      const phoneVal = value == null ? '' : String(value);
      return (
        <TextInput
          {...shared}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={10}
          placeholder="10-digit mobile number"
          value={phoneVal}
          onChange={(event) => {
            const raw = event.currentTarget.value.replace(/\D/g, '').slice(0, 10);
            setValue(field.name, raw);
          }}
          rightSection={
            phoneVal.length === 10 ? (
              <IconCheck size={16} color="#16a34a" />
            ) : phoneVal.length > 0 ? (
              <Text size="11px" fw={700} c="orange.7">
                {phoneVal.length}/10
              </Text>
            ) : null
          }
        />
      );
    }

    if (isEmailField) {
      const emailVal = value == null ? '' : String(value);
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal.trim());
      return (
        <TextInput
          {...shared}
          type="email"
          placeholder="name@domain.com"
          value={emailVal}
          onChange={(event) => setValue(field.name, event.currentTarget.value.replace(/\s+/g, ''))}
          rightSection={
            emailVal.length > 0 ? (
              isValid ? (
                <IconCheck size={16} color="#16a34a" />
              ) : (
                <IconMail size={16} color="#f59e0b" />
              )
            ) : null
          }
        />
      );
    }

    return (
      <TextInput
        {...shared}
        value={value == null ? '' : String(value)}
        onChange={(event) => setValue(field.name, event.currentTarget.value)}
        type={field.type || 'text'}
      />
    );
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm" align="center" wrap="nowrap">
          <ThemeIcon size={38} radius="md" color={typeMeta.color} variant="light">
            <TypeIcon size={20} />
          </ThemeIcon>
          <div>
            <Group gap="xs" align="center">
              <Text fw={800} size="lg" c="dark.6">
                {title}
              </Text>
              <Badge color={typeMeta.color} variant="light" size="xs">
                {record ? 'Edit Mode' : 'New Entry'}
              </Badge>
            </Group>
            <Text size="xs" c="dimmed">
              Changes save directly to your current workspace and update related reports.
            </Text>
          </div>
        </Group>
      }
      centered
      size={type === 'attendance' ? 'xl' : 'lg'}
      radius="lg"
      padding="xl"
      scrollAreaComponent={ScrollArea.Autosize}
      yOffset="3vh"
      overlayProps={{ backgroundOpacity: 0.45, blur: 3 }}
    >
      <Divider mb="lg" />

      {type === 'batch' && record && (
        <Paper withBorder p="sm" radius="md" mb="md" bg="#f8faff" style={{ borderLeft: '3px solid #4f46e5' }}>
          <Group justify="space-between" align="center" wrap="wrap" gap="xs">
            <Group gap="xs">
              <ThemeIcon color="indigo" variant="light" size="sm">
                <IconTable size={14} />
              </ThemeIcon>
              <div>
                <Text size="xs" c="dark.5" fw={700}>
                  Batch Details & Spreadsheet Table are Tightly Coupled
                </Text>
                <Text size="xs" c="dimmed">
                  You can edit batch details with live student table cells simultaneously in the dynamic spreadsheet.
                </Text>
              </div>
            </Group>
            <Button
              component={Link}
              to="/batches"
              size="compact-xs"
              variant="light"
              color="indigo"
              onClick={onClose}
              leftSection={<IconTable size={12} />}
            >
              Open in Live Spreadsheet Table
            </Button>
          </Group>
        </Paper>
      )}

      <form onSubmit={onSubmit}>
        {type === 'attendance' ? (
          <Stack gap="md">
            <div className="form-grid">
              <Select
                label="Student"
                placeholder="Choose student"
                required
                searchable
                radius="md"
                leftSection={<IconUser size={16} color="#4f46e5" />}
                value={form.studentId || null}
                onChange={(v) => setValue('studentId', v)}
                data={students.map((s) => ({ value: s.id, label: s.name }))}
              />
              <Select
                label="Training session"
                placeholder="Choose session"
                required
                searchable
                radius="md"
                leftSection={<IconSchool size={16} color="#4f46e5" />}
                value={form.sessionId || null}
                onChange={(v) => {
                  setValue('sessionId', v);
                  const session = sessions.find((s) => s.id === v);
                  if (session) setValue('date', session.date);
                }}
                data={sessions.map((s) => ({
                  value: s.id,
                  label: `${s.title} · ${s.date}`,
                }))}
              />
              <FacebookDatePicker
                label="Session date"
                required
                radius="md"
                leftSection={<IconCalendar size={16} color="#4f46e5" />}
                value={form.date || ''}
                onChange={(val) => setValue('date', val)}
              />
              <Select
                label="Attendance status"
                radius="md"
                leftSection={<IconTag size={16} color="#6366f1" />}
                data={attendanceStatuses.map((s) => ({ value: s, label: s }))}
                value={form.status || 'Present'}
                onChange={(v) => setValue('status', v || 'Present')}
                required
              />
            </div>

            <div className="segment-heading">
              <div>
                <Text fw={650} size="sm">
                  Join / leave intervals
                </Text>
                <Text c="dimmed" size="xs">
                  Each reconnect is a separate interval. Total time is calculated automatically.
                </Text>
              </div>
              <Button
                type="button"
                leftSection={<IconPlus size={15} />}
                size="xs"
                variant="light"
                color="indigo"
                radius="md"
                onClick={() =>
                  setSegments((current) => [...current, { joinedAt: '', leftAt: '' }])
                }
              >
                Add interval
              </Button>
            </div>

            <Stack gap="xs">
              {segments.map((segment, index) => (
                <div className="segment-row" key={index}>
                  <div className="segment-number">{String(index + 1).padStart(2, '0')}</div>
                  <DateTimePicker
                    label="Joined at"
                    valueFormat="DD-MMM-YYYY hh:mm A"
                    radius="md"
                    leftSection={<IconClock size={16} color="#0d9488" />}
                    value={
                      segment.joinedAt && dayjs(segment.joinedAt).isValid()
                        ? dayjs(segment.joinedAt).toDate()
                        : null
                    }
                    onChange={(val) => {
                      const formatted = val ? dayjs(val).format('YYYY-MM-DDTHH:mm') : '';
                      setSegments((curr) =>
                        curr.map((s, i) => (i === index ? { ...s, joinedAt: formatted } : s))
                      );
                    }}
                    clearable
                  />
                  <DateTimePicker
                    label="Left at"
                    valueFormat="DD-MMM-YYYY hh:mm A"
                    radius="md"
                    leftSection={<IconClock size={16} color="#0d9488" />}
                    value={
                      segment.leftAt && dayjs(segment.leftAt).isValid()
                        ? dayjs(segment.leftAt).toDate()
                        : null
                    }
                    onChange={(val) => {
                      const formatted = val ? dayjs(val).format('YYYY-MM-DDTHH:mm') : '';
                      setSegments((curr) =>
                        curr.map((s, i) => (i === index ? { ...s, leftAt: formatted } : s))
                      );
                    }}
                    clearable
                  />
                  <ActionIcon
                    aria-label="Remove interval"
                    variant="subtle"
                    color="red"
                    mt={22}
                    disabled={segments.length === 1}
                    onClick={() => setSegments((curr) => curr.filter((_, i) => i !== index))}
                  >
                    <IconX size={17} />
                  </ActionIcon>
                </div>
              ))}
            </Stack>

            <Textarea
              label="Notes"
              radius="md"
              placeholder="Optional explanation for a manual correction..."
              value={form.notes || ''}
              onChange={(e) => setValue('notes', e.currentTarget.value)}
            />

            <div className="duration-preview">
              <IconClock size={17} />
              <span>Calculated learning time</span>
              <strong>{formatDuration(totalSeconds(segments))}</strong>
            </div>
          </Stack>
        ) : (
          <div className="form-grid">
            {fieldDefinitions.map((field) => (
              <div className={field.full ? 'full-field' : ''} key={field.name}>
                {renderField(field)}
              </div>
            ))}
          </div>
        )}

        <Group justify="flex-end" mt="xl" pt="sm">
          <Button
            type="button"
            variant="default"
            radius="md"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            color="indigo"
            radius="md"
            loading={saving}
            leftSection={<IconCheck size={16} />}
          >
            {record ? 'Save changes' : 'Create record'}
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
