import * as XLSX from 'xlsx';
import { showSuccess } from './notifications';

/**
 * Standard 16 Enrollment columns matching the exact official Anudip report screenshot:
 * Batch Code | Course Alias | Course Name | Start Date | End Date | Student Code | Student Name | DOB | Gender | Disability Parcentage | Disability Type | Address | Email ID | Mobile No. | Education Qualification | Password
 */
export const SAMPLE_TEMPLATE_COLUMNS = [
  'Batch Code',
  'Course Alias',
  'Course Name',
  'Start Date',
  'End Date',
  'Student Code',
  'Student Name',
  'DOB',
  'Gender',
  'Disability Parcentage',
  'Disability Type',
  'Address',
  'Email ID',
  'Mobile No.',
  'Education Qualification',
  'Password',
];

const SAMPLE_ENROLLMENT_DATA = [
  {
    'Batch Code': 'AF-PY-01',
    'Course Alias': 'Tech Track',
    'Course Name': 'Python & Web Development Track',
    'Start Date': '2026-03-01',
    'End Date': '2026-06-30',
    'Student Code': 'AF0531001',
    'Student Name': 'Aarav Sharma',
    'DOB': '2002-05-14',
    'Gender': 'Male',
    'Disability Parcentage': '60%',
    'Disability Type': 'Locomotor Disability',
    'Address': 'Mumbai, Maharashtra',
    'Email ID': 'aarav.sharma@example.com',
    'Mobile No.': '9876543210',
    'Education Qualification': 'Graduate (B.Com)',
    'Password': 'Anudip@2026',
  },
  {
    'Batch Code': 'AF-PY-01',
    'Course Alias': 'Tech Track',
    'Course Name': 'Python & Web Development Track',
    'Start Date': '2026-03-01',
    'End Date': '2026-06-30',
    'Student Code': 'AF0531002',
    'Student Name': 'Priya Patel',
    'DOB': '2004-08-20',
    'Gender': 'Female',
    'Disability Parcentage': '50%',
    'Disability Type': 'Hearing Impairment',
    'Address': 'Ahmedabad, Gujarat',
    'Email ID': 'priya.patel@example.com',
    'Mobile No.': '9812345678',
    'Education Qualification': '12th Pass',
    'Password': 'Anudip@2026',
  },
  {
    'Batch Code': 'AF-PY-01',
    'Course Alias': 'Tech Track',
    'Course Name': 'Python & Web Development Track',
    'Start Date': '2026-03-01',
    'End Date': '2026-06-30',
    'Student Code': 'AF0531003',
    'Student Name': 'Rahul Verma',
    'DOB': '2000-11-05',
    'Gender': 'Male',
    'Disability Parcentage': '75%',
    'Disability Type': 'Visual Impairment',
    'Address': 'Delhi, NCR',
    'Email ID': 'rahul.verma@example.com',
    'Mobile No.': '9765432109',
    'Education Qualification': 'B.Tech Computer Science',
    'Password': 'Anudip@2026',
  },
  {
    'Batch Code': 'AF-PY-01',
    'Course Alias': 'Tech Track',
    'Course Name': 'Python & Web Development Track',
    'Start Date': '2026-03-01',
    'End Date': '2026-06-30',
    'Student Code': 'AF0531004',
    'Student Name': 'Neha Gupta',
    'DOB': '2003-02-18',
    'Gender': 'Female',
    'Disability Parcentage': '40%',
    'Disability Type': 'Locomotor Disability',
    'Address': 'Kolkata, West Bengal',
    'Email ID': 'neha.gupta@example.com',
    'Mobile No.': '9823456789',
    'Education Qualification': 'Graduate (BA)',
    'Password': 'Anudip@2026',
  },
  {
    'Batch Code': 'AF-PY-01',
    'Course Alias': 'Tech Track',
    'Course Name': 'Python & Web Development Track',
    'Start Date': '2026-03-01',
    'End Date': '2026-06-30',
    'Student Code': 'AF0531005',
    'Student Name': 'Vikram Singh',
    'DOB': '2001-09-25',
    'Gender': 'Male',
    'Disability Parcentage': '55%',
    'Disability Type': 'Low Vision',
    'Address': 'Jaipur, Rajasthan',
    'Email ID': 'vikram.singh@example.com',
    'Mobile No.': '9912345670',
    'Education Qualification': 'Diploma IT',
    'Password': 'Anudip@2026',
  },
];

const SAMPLE_COLS_WIDTHS = [
  { wch: 14 }, // Batch Code
  { wch: 16 }, // Course Alias
  { wch: 32 }, // Course Name
  { wch: 13 }, // Start Date
  { wch: 13 }, // End Date
  { wch: 15 }, // Student Code
  { wch: 20 }, // Student Name
  { wch: 13 }, // DOB
  { wch: 10 }, // Gender
  { wch: 23 }, // Disability Parcentage
  { wch: 24 }, // Disability Type
  { wch: 25 }, // Address
  { wch: 28 }, // Email ID
  { wch: 15 }, // Mobile No.
  { wch: 26 }, // Education Qualification
  { wch: 15 }, // Password
];

/**
 * Downloads the official Sample Enrollment Excel Template (.xlsx)
 * with the exact 16 columns requested from the Anudip MIS report:
 * Batch Code | Course Alias | Course Name | Start Date | End Date | Student Code | Student Name | DOB | Gender | Disability Parcentage | Disability Type | Address | Email ID | Mobile No. | Education Qualification | Password
 */
export function downloadSampleExcelTemplate() {
  const worksheet = XLSX.utils.json_to_sheet(SAMPLE_ENROLLMENT_DATA);
  worksheet['!cols'] = SAMPLE_COLS_WIDTHS;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Enrollment Template');
  XLSX.writeFile(workbook, 'Sample_Enrollment_Template.xlsx');
  showSuccess('Downloaded "Sample_Enrollment_Template.xlsx" with all 16 official report columns.', 'Sample Excel Downloaded');
}

export function downloadSampleRosterExcel() {
  downloadSampleExcelTemplate();
}

export function downloadOfficialEnrollmentReportExcel() {
  downloadSampleExcelTemplate();
}

/**
 * Generates and downloads a clean CSV sample with the exact 16 columns
 */
export function downloadSampleCsv() {
  const headers = SAMPLE_TEMPLATE_COLUMNS;

  const rows = SAMPLE_ENROLLMENT_DATA.map((row) =>
    headers
      .map((h) => {
        const val = row[h] != null ? String(row[h]) : '';
        return val.includes(',') ? `"${val}"` : val;
      })
      .join(',')
  );

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Sample_Enrollment_Template.csv';
  a.click();
  URL.revokeObjectURL(url);
  showSuccess('Downloaded "Sample_Enrollment_Template.csv".', 'CSV Downloaded');
}
