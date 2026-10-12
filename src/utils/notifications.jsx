import React from 'react';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconAlertTriangle } from '@tabler/icons-react';

export function showSuccess(message, title = 'Saved successfully') {
  notifications.show({
    title,
    message,
    color: 'teal',
    icon: <IconCheck size={16} />,
  });
}

export function showError(error, title = 'Something went wrong') {
  notifications.show({
    title,
    message: error?.message || (typeof error === 'string' ? error : 'Please try again.'),
    color: 'red',
  });
}

export function showWarning(message, title = 'Attention needed') {
  notifications.show({
    title,
    message,
    color: 'orange',
    icon: <IconAlertTriangle size={16} />,
  });
}

export function showInfo(message, title = 'Notice') {
  notifications.show({
    title,
    message,
    color: 'indigo',
  });
}
