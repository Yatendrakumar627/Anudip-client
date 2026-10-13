import Papa from 'papaparse';
import dayjs from 'dayjs';

/**
 * Normalizes header strings for case/whitespace-insensitive fuzzy matching
 */
function normHeader(h = '') {
  return String(h).toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

/**
 * Parse an Excel or CSV File object into raw JSON rows
 */
export async function parseSpreadsheetFile(file) {
  if (!file) throw new Error('No file provided');

  const fileName = file.name.toLowerCase();
  const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

  if (isExcel) {
    const XLSX = await import('xlsx');
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      cellDates: true,
      raw: false,
    });

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error('The uploaded Excel workbook contains no sheets.');
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json(worksheet, {
      defval: '',
      raw: false,
    });

    return {
      fileName: file.name,
      sheetNames: workbook.SheetNames,
      activeSheet: firstSheetName,
      rawRows,
    };
  }

  // Fallback to CSV / text
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, meta }) => {
        resolve({
          fileName: file.name,
          sheetNames: ['CSV Data'],
          activeSheet: 'CSV Data',
          rawRows: data || [],
        });
      },
      error: (err) => reject(err),
    });
  });
}

/**
 * Deeply analyzes raw rows from an Enrollment Report or roster spreadsheet
 */
export function analyzeEnrollmentReport(rawRows = [], defaultBatch = null) {
  if (!rawRows || !rawRows.length) {
    return {
      isEnrollmentReport: false,
      detectedBatch: null,
      mappedColumns: [],
      mappedRows: [],
      summary: { totalRows: 0 },
    };
  }

  // Find all keys across rows
  const allKeys = Object.keys(rawRows[0] || {});
  const normalizedKeyMap = new Map();
  allKeys.forEach((k) => {
    normalizedKeyMap.set(normHeader(k), k);
  });

  const getColVal = (row, ...candidates) => {
    for (const c of candidates) {
      const actualKey = normalizedKeyMap.get(normHeader(c));
      if (actualKey && row[actualKey] !== undefined && row[actualKey] !== '') {
        return String(row[actualKey]).trim();
      }
    }
    return '';
  };

  // Inspect first non-empty row for batch metadata
  const sampleRow = rawRows.find((r) => Object.values(r).some((v) => !!v)) || rawRows[0];

  const batchCode = getColVal(sampleRow, 'Batch Code', 'BatchCode', 'Batch ID', 'Batch');
  const courseName = getColVal(sampleRow, 'Course Name', 'CourseName', 'Course', 'Program');
  const courseAlias = getColVal(sampleRow, 'Course Alias', 'CourseAlias', 'Alias');
  const rawStartDate = getColVal(sampleRow, 'Start Date', 'StartDate', 'Training Start');
  const rawEndDate = getColVal(sampleRow, 'End Date', 'EndDate', 'Training End');

  const formatDate = (val) => {
    if (!val) return '';
    const d = dayjs(val);
    return d.isValid() ? d.format('YYYY-MM-DD') : String(val).trim();
  };

  const startDate = formatDate(rawStartDate);
  const endDate = formatDate(rawEndDate);

  const isEnrollmentReport = Boolean(
    batchCode ||
    (courseName && (getColVal(sampleRow, 'Student Code', 'StudentCode') || getColVal(sampleRow, 'Disability Type')))
  );

  // Suggested Batch Details
  const detectedBatch = {
    code: batchCode || defaultBatch?.code || '',
    name: courseName
      ? `${courseName}${batchCode ? ` (${batchCode})` : ''}`
      : defaultBatch?.name || (batchCode ? `Batch ${batchCode}` : 'Imported Cohort'),
    field: courseAlias || courseName || defaultBatch?.field || 'General Training',
    startDate: startDate || defaultBatch?.startDate || dayjs().format('YYYY-MM-DD'),
    endDate: endDate || defaultBatch?.endDate || '',
    trainer: defaultBatch?.trainer || '',
    timing: defaultBatch?.timing || 'Mon - Fri',
    meetLink: defaultBatch?.meetLink || '',
    status: 'Active',
    description: `Imported enrollment roster (${rawRows.length} learners)${batchCode ? ` for batch ${batchCode}` : ''}.`,
  };

  // Build standard canonical columns & detect custom attributes
  const coreColDefs = [
    { key: 'name', label: 'Student Name', type: 'text', width: 200, required: true },
    { key: 'email', label: 'Email', type: 'email', width: 220 },
    { key: 'lmsUsername', label: 'User Name', type: 'text', width: 150 },
    { key: 'lmsPassword', label: 'Password', type: 'text', width: 140 },
  ];

  // Map known secondary attributes from Anudip reports
  const secondaryKnownCols = [
    { match: ['Mobile No.', 'Mobile', 'Phone', 'Contact'], key: 'phone', label: 'Mobile No.', type: 'phone', width: 150 },
    { match: ['Student Code', 'StudentCode', 'Enrollment ID', 'AF Code'], key: 'studentCode', label: 'Student Code', type: 'text', width: 140 },
    { match: ['Disability Type', 'Disability'], key: 'disabilityType', label: 'Disability Type', type: 'select', width: 180 },
    { match: ['Disability Parcentage', 'Disability Percentage', 'Disability %'], key: 'disabilityPercentage', label: 'Disability %', type: 'number', width: 130 },
    { match: ['DOB', 'Date of Birth'], key: 'dob', label: 'DOB', type: 'date', width: 130 },
    { match: ['Gender', 'Sex'], key: 'gender', label: 'Gender', type: 'select', width: 110, options: ['male', 'female', 'other'] },
    { match: ['Address', 'Location', 'City'], key: 'address', label: 'Address', type: 'text', width: 200 },
    { match: ['Education Qualification', 'Qualification', 'Education'], key: 'qualification', label: 'Qualification', type: 'select', width: 160 },
  ];

  // Keep track of which original Excel columns correspond to batch-level fields to avoid duplicating them in student rows
  const batchLevelRawHeaders = new Set(
    ['batch code', 'course alias', 'course name', 'start date', 'end date'].map(normHeader)
  );

  const detectedColumns = [...coreColDefs];
  const seenColKeys = new Set(coreColDefs.map((c) => c.key));

  secondaryKnownCols.forEach((sec) => {
    const hasCol = sec.match.some((cand) => normalizedKeyMap.has(normHeader(cand)));
    if (hasCol && !seenColKeys.has(sec.key)) {
      seenColKeys.add(sec.key);

      let options = sec.options;
      if (sec.type === 'select' && (!options || !options.length)) {
        const foundKey = sec.match.map((c) => normalizedKeyMap.get(normHeader(c))).find(Boolean);
        if (foundKey) {
          const uniqueVals = [
            ...new Set(
              rawRows.map((r) => String(r[foundKey] || '').trim()).filter(Boolean)
            ),
          ];
          options = uniqueVals;
        }
      }

      detectedColumns.push({
        key: sec.key,
        label: sec.label,
        type: sec.type,
        width: sec.width,
        ...(options && options.length ? { options } : {}),
      });
    }
  });

  // If DOB is present in detected columns, automatically insert Age column right next to it
  if (seenColKeys.has('dob') && !seenColKeys.has('age')) {
    seenColKeys.add('age');
    const dobPos = detectedColumns.findIndex((c) => c.key === 'dob');
    const insertIdx = dobPos !== -1 ? dobPos + 1 : detectedColumns.length;
    detectedColumns.splice(insertIdx, 0, {
      key: 'age',
      label: 'Age',
      type: 'number',
      width: 95,
    });
  }

  // Any other unknown custom columns present in raw rows that aren't batch-level
  allKeys.forEach((rawKey) => {
    const norm = normHeader(rawKey);
    if (batchLevelRawHeaders.has(norm)) return; // skip batch-level headers

    const isAlreadyMapped =
      ['studentname', 'name', 'email', 'emailid', 'username', 'password'].includes(norm) ||
      secondaryKnownCols.some((s) => s.match.some((m) => normHeader(m) === norm));

    if (!isAlreadyMapped) {
      const cleanKey = `col_${norm.slice(0, 15)}`;
      if (!seenColKeys.has(cleanKey)) {
        seenColKeys.add(cleanKey);
        detectedColumns.push({
          key: cleanKey,
          label: rawKey.trim(),
          type: 'text',
          width: 160,
          originalHeader: rawKey,
        });
      }
    }
  });

  // Transform each row into clean mapped student object
  const mappedRows = rawRows
    .map((row, idx) => {
      const studentName = getColVal(row, 'Student Name', 'Name', 'Student', 'Beneficiary Name');
      const email = getColVal(row, 'Email ID', 'Email', 'Mail');
      const rawMobile = getColVal(row, 'Mobile No.', 'Mobile', 'Phone', 'Contact Number');
      const mobileDigits = String(rawMobile || '').replace(/\D/g, '');
      const mobile =
        mobileDigits.length === 12 && mobileDigits.startsWith('91')
          ? mobileDigits.slice(2)
          : mobileDigits.length > 10
          ? mobileDigits.slice(-10)
          : mobileDigits;
      const dob = formatDate(getColVal(row, 'DOB', 'Date of Birth'));
      let age = getColVal(row, 'Age');
      if (!age && dob && dayjs(dob).isValid()) {
        const calculatedAge = dayjs().diff(dayjs(dob), 'year');
        if (calculatedAge >= 0 && calculatedAge < 120) {
          age = calculatedAge;
        }
      }
      const studentCode = getColVal(row, 'Student Code', 'StudentCode', 'Enrollment ID', 'AF Code', 'Student Id', 'StudentID', 'Registration No', 'Reg No');
      const gender = getColVal(row, 'Gender', 'Sex');
      const disabilityType = getColVal(row, 'Disability Type', 'Disability');
      const disabilityPercentage = getColVal(row, 'Disability Parcentage', 'Disability Percentage', 'Disability %');
      const address = getColVal(row, 'Address', 'Location', 'City');
      const qualification = getColVal(row, 'Education Qualification', 'Qualification', 'Education');

      // If the row has zero meaningful data, skip it
      if (!studentName && !email && !studentCode) return null;

      // LMS User ID is primarily the Student Code (e.g. AF05310456), or email username
      const lmsUsername = String(studentCode || (email ? email.split('@')[0] : `user_${idx + 1}`)).trim();

      // Consistent default LMS password for new batch import
      const lmsPassword = String(getColVal(row, 'Password', 'LMS Password') || 'Anudip@2026').trim();

      const rowObj = {
        id: `row_import_${Date.now().toString(36)}_${idx}`,
        name: studentName,
        email: email || `${studentName.toLowerCase().replace(/[^a-z0-9]/g, '.') || 'student'}.${Date.now().toString(36).slice(2, 6)}@example.org`,
        lmsUsername,
        lmsPassword,
        phone: mobile,
        studentCode,
        dob,
        age: age != null && age !== '' ? Number(age) || age : '',
        gender,
        disabilityType,
        disabilityPercentage,
        address,
        qualification,
      };

      // Add any custom extra columns
      detectedColumns.forEach((col) => {
        if (col.originalHeader && row[col.originalHeader] !== undefined) {
          rowObj[col.key] = String(row[col.originalHeader]).trim();
        }
      });

      return rowObj;
    })
    .filter(Boolean);

  return {
    isEnrollmentReport,
    detectedBatch,
    columns: detectedColumns,
    rows: mappedRows,
    summary: {
      totalRows: mappedRows.length,
      batchCode: detectedBatch.code,
      courseName: detectedBatch.name,
      dateRange: detectedBatch.startDate && detectedBatch.endDate
        ? `${detectedBatch.startDate} to ${detectedBatch.endDate}`
        : detectedBatch.startDate || 'TBA',
    },
  };
}
