import { batchStatuses, placementStatuses, studentStatuses, sessionStatuses } from '../data';

export const studentFields = [
  { name: 'name', label: 'Student name', required: true, placeholder: 'Enter student name' },
  { name: 'lmsUsername', label: 'LMS User Name', placeholder: 'Enter LMS User ID' },
  { name: 'lmsPassword', label: 'LMS Password', placeholder: 'Enter password' },
  { name: 'email', label: 'Email address', type: 'email', required: true, placeholder: 'student@example.org' },
  { name: 'phone', label: 'Phone number', placeholder: '+91 ...' },
  { name: 'field', label: 'Training field', type: 'select-custom', required: true, placeholder: 'Choose or type a training field' },
  { name: 'batch', label: 'Batch / cohort', placeholder: 'Batch name' },
  { name: 'status', label: 'Student status', type: 'select', options: studentStatuses.map((value) => ({ value, label: value })), required: true },
  { name: 'enrollmentDate', label: 'Enrollment date', type: 'date' },
  { name: 'meetDisplayName', label: 'Google Meet display name', placeholder: 'Name shown in Meet attendance' },
  { name: 'notes', label: 'Notes', type: 'textarea', full: true, placeholder: 'Any learner notes or support requirements...' },
];

export const sessionFields = [
  { name: 'title', label: 'Session title', required: true, placeholder: 'e.g. React Fundamentals' },
  { name: 'field', label: 'Training field', type: 'select-custom', required: true, placeholder: 'Choose or type a training field' },
  { name: 'batch', label: 'Batch / cohort', placeholder: 'Batch name' },
  { name: 'trainer', label: 'Trainer / facilitator', placeholder: 'Assigned trainer name' },
  { name: 'date', label: 'Session date', type: 'date', required: true },
  { name: 'startTime', label: 'Start time', type: 'time', required: true },
  { name: 'endTime', label: 'End time', type: 'time', required: true },
  { name: 'status', label: 'Session status', type: 'select', options: sessionStatuses.map((value) => ({ value, label: value })), required: true },
  { name: 'meetLink', label: 'Google Meet link', type: 'url', required: true, placeholder: 'https://meet.google.com/...' },
  { name: 'conferenceRecordName', label: 'Meet conference record (for API sync)', placeholder: 'conferenceRecords/...' },
  { name: 'description', label: 'Session notes / agenda', type: 'textarea', full: true, placeholder: 'What will students learn in this session?' },
];

export const placementFields = [
  { name: 'studentId', label: 'Student', type: 'student', required: true },
  { name: 'company', label: 'Company', required: true, placeholder: 'Company name' },
  { name: 'role', label: 'Job title', required: true, placeholder: 'e.g. Junior Frontend Developer' },
  { name: 'location', label: 'Location', placeholder: 'Remote / City' },
  { name: 'packageLpa', label: 'Annual package (LPA)', type: 'number', placeholder: 'e.g. 4.5' },
  { name: 'status', label: 'Placement status', type: 'select', options: placementStatuses.map((value) => ({ value, label: value })), required: true },
  { name: 'placedAt', label: 'Offer / joining date', type: 'date' },
  { name: 'offerLetterUrl', label: 'Offer letter URL', type: 'url', placeholder: 'https://...' },
  { name: 'notes', label: 'Notes', type: 'textarea', full: true, placeholder: 'Interview feedback, follow-up or joining notes...' },
];

export const batchFields = [
  { name: 'name', label: 'Batch name', required: true, placeholder: 'e.g. Batch 01' },
  { name: 'code', label: 'Batch code', required: true, placeholder: 'e.g. B-01' },
  { name: 'field', label: 'Training field / track', type: 'select-custom', required: true, placeholder: 'Choose or type a training field' },
  { name: 'trainer', label: 'Assigned trainer / facilitator', placeholder: 'Assigned facilitator name' },
  { name: 'timing', label: 'Class timing', placeholder: 'e.g. 10:00 AM - 11:30 AM' },
  { name: 'status', label: 'Batch status', type: 'select', options: batchStatuses.map((value) => ({ value, label: value })), required: true },
  { name: 'meetLink', label: 'Google Meet classroom link', type: 'url', placeholder: 'https://meet.google.com/...' },
  { name: 'startDate', label: 'Start date', type: 'date' },
  { name: 'endDate', label: 'Target completion date', type: 'date' },
  { name: 'description', label: 'Batch description / syllabus summary', type: 'textarea', full: true, placeholder: 'Course highlights, tools, and objectives...' },
];
