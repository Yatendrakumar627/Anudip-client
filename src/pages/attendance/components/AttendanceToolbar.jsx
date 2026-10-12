import React from 'react';
import { Button, Select } from '@mantine/core';
import { IconCloudUpload } from '@tabler/icons-react';
import SearchBox from '../../../components/common/SearchBox';

export default function AttendanceToolbar({
  search,
  setSearch,
  sessionOptions,
  sessionFilter,
  setSessionFilter,
  statusOptions,
  statusFilter,
  setStatusFilter,
  importing,
  fileRef,
  onImportFile,
}) {
  return (
    <div className="toolbar-row">
      <SearchBox
        value={search}
        onChange={setSearch}
        placeholder="Search student or session..."
      />
      <Select
        className="filter-select session-filter"
        data={sessionOptions}
        value={sessionFilter}
        onChange={(v) => setSessionFilter(v || 'all')}
        searchable
      />
      <Select
        className="filter-select status-filter"
        data={statusOptions}
        value={statusFilter}
        onChange={(v) => setStatusFilter(v || 'all')}
      />
      <Button
        variant="light"
        loading={importing}
        leftSection={<IconCloudUpload size={16} />}
        onClick={() => fileRef.current?.click()}
      >
        Import Meet CSV
      </Button>
      <input
        ref={fileRef}
        type="file"
        hidden
        accept=".csv,text/csv"
        onChange={(e) => onImportFile(e.target.files?.[0])}
      />
    </div>
  );
}
