import React from 'react';
import { TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

export default function SearchBox({ value, onChange, placeholder = 'Search by name, field or batch...' }) {
  return (
    <TextInput
      className="search-box"
      leftSection={<IconSearch size={16} />}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      aria-label="Search filter"
    />
  );
}
