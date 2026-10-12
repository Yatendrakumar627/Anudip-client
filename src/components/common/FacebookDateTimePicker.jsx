import React, { useMemo } from 'react';
import { Group, Button, Select, ThemeIcon, Text } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconCalendar, IconClock, IconCheck } from '@tabler/icons-react';
import dayjs from 'dayjs';

/**
 * Generates 15-minute interval time slots for a full 24-hour day (96 slots),
 * labeled in user-friendly 12-hour AM/PM format (e.g. "10:00 AM", "04:30 PM").
 */
export function generateTimeSlots(stepMinutes = 15) {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += stepMinutes) {
      const hStr = String(hour).padStart(2, '0');
      const mStr = String(min).padStart(2, '0');
      const val24 = `${hStr}:${mStr}`;

      const ampm = hour >= 12 ? 'PM' : 'AM';
      const h12 = hour % 12 || 12;
      const label12 = `${String(h12).padStart(2, '0')}:${mStr} ${ampm}`;

      slots.push({ value: val24, label: label12 });
    }
  }
  return slots;
}

/**
 * Converts any time string (e.g. "10:00", "16:30", "4:30 PM") to 24-hour "HH:mm".
 */
export function normalizeTo24H(val) {
  if (!val) return '';
  const clean = String(val).trim();
  const match = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return clean;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2] || '0', 10);
  const ampm = match[3] ? match[3].toUpperCase() : null;
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Converts 24-hour "HH:mm" to 12-hour "hh:mm A".
 */
export function formatTo12H(val) {
  if (!val) return '';
  const parts = String(val).split(':');
  let h = parseInt(parts[0], 10);
  const m = parseInt(parts[1] || '0', 10);
  if (isNaN(h)) return val;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * Facebook Event-style Time Picker:
 * - Searchable dropdown with 15-minute time slots (09:00 AM, 09:15 AM, 09:30 AM...)
 * - Allows searching by typing any hour/minute or AM/PM
 * - Selected item highlighted with Facebook blue/indigo pill
 * - Values seamlessly map to standard HH:mm 24-hour strings
 */
export function FacebookTimePicker({
  label,
  required,
  placeholder = 'Select time',
  value,
  onChange,
  radius = 'md',
  leftSection,
  disabled,
  error,
}) {
  const timeSlots = useMemo(() => generateTimeSlots(15), []);

  const normalizedValue = normalizeTo24H(value);

  // If the current value isn't on a 15-minute boundary, include it dynamically in data
  const options = useMemo(() => {
    if (!normalizedValue) return timeSlots;
    const exists = timeSlots.some((s) => s.value === normalizedValue);
    if (!exists) {
      const customSlot = {
        value: normalizedValue,
        label: formatTo12H(normalizedValue),
      };
      return [customSlot, ...timeSlots].sort((a, b) => a.value.localeCompare(b.value));
    }
    return timeSlots;
  }, [timeSlots, normalizedValue]);

  return (
    <Select
      label={label}
      required={required}
      placeholder={placeholder}
      data={options}
      value={normalizedValue || null}
      onChange={(val) => onChange(val || '')}
      searchable
      clearable
      maxDropdownHeight={260}
      radius={radius}
      leftSection={leftSection || <IconClock size={16} color="#1877f2" />}
      disabled={disabled}
      error={error}
      renderOption={({ option, checked }) => (
        <Group justify="space-between" w="100%" px={4} py={2}>
          <Group gap="xs">
            <ThemeIcon
              size={22}
              radius="sm"
              variant={checked ? 'filled' : 'subtle'}
              color={checked ? 'indigo' : 'gray'}
            >
              <IconClock size={13} />
            </ThemeIcon>
            <Text size="sm" fw={checked ? 700 : 500} c={checked ? 'indigo.8' : 'dark.5'}>
              {option.label}
            </Text>
          </Group>
          {checked && <IconCheck size={15} color="#4f46e5" />}
        </Group>
      )}
      comboboxProps={{
        transitionProps: { transition: 'pop-top-left', duration: 150 },
        shadow: 'md',
        withinPortal: true,
        zIndex: 1000,
      }}
    />
  );
}

/**
 * Facebook Event-style Class Timing Picker:
 * - Pairs Start Time & End Time using Facebook 15-minute slot dropdowns
 * - Parses and serializes "10:00 AM - 11:30 AM" seamlessly
 */
export function FacebookTimingPicker({
  label = 'Class Timing',
  required,
  value = '',
  onChange,
  radius = 'md',
  disabled,
}) {
  const [startRaw, endRaw] = useMemo(() => {
    if (!value) return ['', ''];
    const parts = String(value).split(/\s*-\s*|\s+to\s+/i);
    return [parts[0] ? parts[0].trim() : '', parts[1] ? parts[1].trim() : ''];
  }, [value]);

  const handleStartChange = (val) => {
    const start12 = val ? formatTo12H(val) : '';
    const end12 = endRaw ? formatTo12H(normalizeTo24H(endRaw)) : '';
    if (!start12 && !end12) {
      onChange('');
    } else if (start12 && end12) {
      onChange(`${start12} - ${end12}`);
    } else {
      onChange(start12 || end12);
    }
  };

  const handleEndChange = (val) => {
    const end12 = val ? formatTo12H(val) : '';
    const start12 = startRaw ? formatTo12H(normalizeTo24H(startRaw)) : '';
    if (!start12 && !end12) {
      onChange('');
    } else if (start12 && end12) {
      onChange(`${start12} - ${end12}`);
    } else {
      onChange(start12 || end12);
    }
  };

  return (
    <div>
      <Text size="xs" fw={700} c="#334155" mb={6}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </Text>
      <Group gap="xs" grow align="flex-start">
        <FacebookTimePicker
          placeholder="Start (10:00 AM)"
          value={normalizeTo24H(startRaw)}
          onChange={handleStartChange}
          leftSection={<IconClock size={16} color="#0d9488" />}
          radius={radius}
          disabled={disabled}
        />
        <FacebookTimePicker
          placeholder="End (11:30 AM)"
          value={normalizeTo24H(endRaw)}
          onChange={handleEndChange}
          leftSection={<IconClock size={16} color="#0d9488" />}
          radius={radius}
          disabled={disabled}
        />
      </Group>
    </div>
  );
}

/**
 * Facebook Event-style Date Picker:
 * - Clean calendar with quick preset chips ("Today", "Tomorrow", "Next Week")
 * - Formatted date display (DD-MMM-YYYY)
 * - Calendar left section icon
 */
export function FacebookDatePicker({
  label,
  required,
  placeholder = 'Select date',
  value,
  onChange,
  radius = 'md',
  leftSection,
  clearable = true,
  disabled,
  error,
}) {
  const parsedDate = value
    ? dayjs(value).isValid()
      ? dayjs(value).toDate()
      : null
    : null;

  return (
    <DateInput
      label={label}
      required={required}
      placeholder={placeholder}
      valueFormat="DD-MMM-YYYY"
      value={parsedDate}
      onChange={(newDate) => {
        onChange(newDate ? dayjs(newDate).format('YYYY-MM-DD') : '');
      }}
      firstDayOfWeek={1}
      clearable={clearable}
      radius={radius}
      leftSection={leftSection || <IconCalendar size={18} color="#4f46e5" />}
      disabled={disabled}
      error={error}
      popoverProps={{
        withinPortal: true,
        zIndex: 1000,
        shadow: 'md',
        radius: 'md',
      }}
    />
  );
}
