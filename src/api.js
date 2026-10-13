import { seedData } from './data';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const STORAGE_KEY = 'anudip-training-hub-v3';
const isDemo = !API_BASE;

function localDb() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.batches) {
        parsed.batches = [];
      }
      // Normalize batches while strictly PRESERVING user's customized column and row sequence
      if (parsed.batches && Array.isArray(parsed.batches)) {
        parsed.batches = parsed.batches.map((b) => {
          const baseCols = [
            { key: 'name', label: 'Student Name', type: 'text', width: 200, required: true },
            { key: 'email', label: 'Email', type: 'email', width: 220 },
            { key: 'lmsUsername', label: 'User Name', type: 'text', width: 150 },
            { key: 'lmsPassword', label: 'Password', type: 'text', width: 140 },
          ];
          if (!b.columns || !b.columns.length) {
            return { ...b, columns: baseCols };
          }
          const baseColMap = {
            name: { key: 'name', label: 'Student Name', type: 'text', width: 200, required: true },
            email: { key: 'email', label: 'Email', type: 'email', width: 220 },
            lmsusername: { key: 'lmsUsername', label: 'User Name', type: 'text', width: 150 },
            lmspassword: { key: 'lmsPassword', label: 'Password', type: 'text', width: 140 },
          };
          const baseColByLabel = {
            'student name': baseColMap.name,
            'email': baseColMap.email,
            'user name': baseColMap.lmsusername,
            'lms user id': baseColMap.lmsusername,
            'password': baseColMap.lmspassword,
          };
          const orderedColumns = [];
          const seenKeys = new Set();
          const seenBaseKeys = new Set();

          // Preserve exact sequence saved in b.columns
          (b.columns || []).forEach((c) => {
            const k = (c.key || '').toLowerCase().trim();
            const l = (c.label || '').toLowerCase().trim();
            const matchedBase = baseColMap[k] || baseColByLabel[l];
            if (matchedBase) {
              if (!seenBaseKeys.has(matchedBase.key)) {
                seenBaseKeys.add(matchedBase.key);
                seenKeys.add(matchedBase.key);
                orderedColumns.push({ ...matchedBase, ...c, width: c.width || matchedBase.width });
              }
            } else {
              const canonical = c.key || `col_${l.replace(/[^a-z0-9]/g, '_')}`;
              if (!seenKeys.has(canonical)) {
                seenKeys.add(canonical);
                orderedColumns.push(c);
              }
            }
          });

          // Ensure any missing core default columns are appended
          baseCols.forEach((bc) => {
            if (!seenBaseKeys.has(bc.key)) {
              orderedColumns.push(bc);
              seenBaseKeys.add(bc.key);
            }
          });

          const rows = (b.rows || []).map((r) => ({
            ...r,
            name: r.name || 'New Student',
            email: r.email || '',
            lmsUsername: r.lmsUsername || r['LMS User ID'] || '',
            lmsPassword: r.lmsPassword || '',
          }));
          return { ...b, columns: orderedColumns, rows };
        });
      }
      return parsed;
    }
  } catch (error) {
    console.warn('Could not read demo data:', error);
  }
  const fresh = structuredClone(seedData);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  return fresh;
}
function saveDb(db) { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); }
function id() { return `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }

const WORKSPACE_CACHE_KEY = 'anudip_ws_cache_v3';
const WORKSPACE_ETAG_KEY = 'anudip_ws_etag_v3';

let workspaceCache = null;
let workspaceEtag = null;

try {
  const savedEtag = localStorage.getItem(WORKSPACE_ETAG_KEY);
  const savedCache = localStorage.getItem(WORKSPACE_CACHE_KEY);
  if (savedEtag && savedCache) {
    workspaceEtag = savedEtag;
    workspaceCache = JSON.parse(savedCache);
  }
} catch (e) {
  console.warn('Could not read persistent workspace cache:', e);
}

export function getCachedWorkspaceData() {
  return workspaceCache;
}

export function invalidateWorkspaceCache() {
  workspaceCache = null;
  workspaceEtag = null;
  try {
    localStorage.removeItem(WORKSPACE_CACHE_KEY);
    localStorage.removeItem(WORKSPACE_ETAG_KEY);
  } catch (e) {}
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method)) {
    invalidateWorkspaceCache();
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || `Request failed (${response.status})`);
  return body;
}

export const api = {
  demoMode: isDemo,
  getCachedWorkspaceData,
  async list(resource) {
    if (!isDemo) return request(`/api/${resource}`);
    const db = localDb();
    return structuredClone(db[resource] || []);
  },
  async getWorkspace() {
    if (!isDemo) {
      const headers = {};
      if (workspaceEtag && workspaceCache) {
        headers['If-None-Match'] = workspaceEtag;
      }
      const response = await fetch(`${API_BASE}/api/workspace`, {
        headers: { 'Content-Type': 'application/json', ...headers },
      });

      if (response.status === 304 && workspaceCache) {
        // Fast 304 Not Modified: return cached data immediately without cloning or re-renders
        return { data: workspaceCache, notModified: true };
      }

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || `Request failed (${response.status})`);
      }

      const data = await response.json();
      workspaceCache = data;
      const etag = response.headers.get('ETag');
      if (etag) {
        workspaceEtag = etag;
        try {
          localStorage.setItem(WORKSPACE_ETAG_KEY, etag);
        } catch (e) {}
      }
      try {
        localStorage.setItem(WORKSPACE_CACHE_KEY, JSON.stringify(data));
      } catch (e) {}
      return { data, notModified: false };
    }
    const db = localDb();
    return {
      data: {
        students: db.students || [],
        sessions: db.sessions || [],
        attendance: db.attendance || [],
        placements: db.placements || [],
        batches: db.batches || [],
      },
      notModified: false,
    };
  },
  async create(resource, record) {
    if (!isDemo) return request(`/api/${resource}`, { method: 'POST', body: JSON.stringify(record) });
    const db = localDb();
    if (resource === 'students' && db.students.some((row) => String(row.email || '').toLowerCase() === String(record.email || '').toLowerCase())) throw new Error('A student with this email already exists.');
    if (resource === 'attendance' && db.attendance.some((row) => row.studentId === record.studentId && row.sessionId === record.sessionId)) throw new Error('An attendance record already exists for this student and session. Edit the existing record instead.');
    const saved = { ...record, id: record.id || id() };
    db[resource] = [saved, ...(db[resource] || [])];

    // Synchronize batch rows with student directory
    if (resource === 'batches' && record.rows && Array.isArray(record.rows)) {
      record.rows.forEach((row, i) => {
        if (!row.name) return;
        const sIndex = db.students.findIndex(
          (s) =>
            s.id === row.id ||
            (row.lmsUsername && s.lmsUsername && String(s.lmsUsername).toLowerCase() === String(row.lmsUsername).toLowerCase()) ||
            (row.email && s.email && String(s.email).toLowerCase() === String(row.email).toLowerCase())
        );
        const studentPayload = {
          ...row,
          id: row.id || `stu_b_${Date.now().toString(36)}_${i}`,
          name: row.name,
          lmsUsername: row.lmsUsername || '',
          lmsPassword: row.lmsPassword || '',
          email: row.email || '',
          phone: row.phone || '',
          batch: record.name,
          field: record.field || '',
          status: row.status || 'Active',
        };
        if (sIndex >= 0) {
          db.students[sIndex] = { ...db.students[sIndex], ...studentPayload };
        } else {
          db.students.push(studentPayload);
        }
      });
    }
    // Synchronize student with batch table
    if (resource === 'students' && record.batch) {
      db.batches = (db.batches || []).map((b) => {
        if (b.name === record.batch || b.code === record.batch) {
          const rows = Array.isArray(b.rows) ? [...b.rows] : [];
          const rIdx = rows.findIndex((r) => r.id === saved.id || (r.email && r.email.toLowerCase() === (record.email || '').toLowerCase()));
          const rowData = {
            id: saved.id,
            name: saved.name,
            email: saved.email || '',
            lmsUsername: saved.lmsUsername || '',
            lmsPassword: saved.lmsPassword || '',
            phone: saved.phone || '',
            status: saved.status || 'Active',
          };
          if (rIdx >= 0) rows[rIdx] = { ...rows[rIdx], ...rowData };
          else rows.push(rowData);
          return { ...b, rows };
        }
        return b;
      });
    }

    saveDb(db); return structuredClone(saved);
  },
  async update(resource, recordId, record) {
    if (!isDemo) return request(`/api/${resource}/${recordId}`, { method: 'PUT', body: JSON.stringify(record) });
    const db = localDb();
    const index = (db[resource] || []).findIndex((row) => row.id === recordId);
    if (index < 0) throw new Error('Record not found. Refresh and try again.');
    if (resource === 'students' && db.students.some((row, i) => i !== index && String(row.email || '').toLowerCase() === String(record.email || '').toLowerCase())) throw new Error('A student with this email already exists.');
    if (resource === 'attendance' && db.attendance.some((row, i) => i !== index && row.studentId === (record.studentId ?? db.attendance[index].studentId) && row.sessionId === (record.sessionId ?? db.attendance[index].sessionId))) throw new Error('An attendance record already exists for this student and session.');
    db[resource][index] = { ...db[resource][index], ...record, id: recordId };

    // Synchronize batch rows with student directory
    if (resource === 'batches' && record.rows && Array.isArray(record.rows)) {
      record.rows.forEach((row, i) => {
        if (!row.name) return;
        const sIndex = db.students.findIndex(
          (s) =>
            s.id === row.id ||
            (row.lmsUsername && s.lmsUsername && String(s.lmsUsername).toLowerCase() === String(row.lmsUsername).toLowerCase()) ||
            (row.email && s.email && String(s.email).toLowerCase() === String(row.email).toLowerCase())
        );
        const studentPayload = {
          ...row,
          id: row.id || `stu_b_${Date.now().toString(36)}_${i}`,
          name: row.name,
          lmsUsername: row.lmsUsername || '',
          lmsPassword: row.lmsPassword || '',
          email: row.email || '',
          phone: row.phone || '',
          batch: record.name,
          field: record.field || '',
          status: row.status || 'Active',
        };
        if (sIndex >= 0) {
          db.students[sIndex] = { ...db.students[sIndex], ...studentPayload };
        } else {
          db.students.push(studentPayload);
        }
      });
    }

    // Synchronize student with batch table
    if (resource === 'students') {
      const updatedStudent = db.students[index];
      db.batches = (db.batches || []).map((b) => {
        const rows = Array.isArray(b.rows) ? [...b.rows] : [];
        const isTargetBatch = b.name === updatedStudent.batch || b.code === updatedStudent.batch;
        const rIdx = rows.findIndex((r) => r.id === recordId || (r.email && updatedStudent.email && r.email.toLowerCase() === updatedStudent.email.toLowerCase()));

        if (isTargetBatch) {
          const rowData = {
            id: recordId,
            name: updatedStudent.name,
            email: updatedStudent.email || '',
            lmsUsername: updatedStudent.lmsUsername || '',
            lmsPassword: updatedStudent.lmsPassword || '',
            phone: updatedStudent.phone || '',
            status: updatedStudent.status || 'Active',
          };
          if (rIdx >= 0) rows[rIdx] = { ...rows[rIdx], ...rowData };
          else rows.push(rowData);
          return { ...b, rows };
        } else if (rIdx >= 0) {
          // Student moved out of this batch
          return { ...b, rows: rows.filter((_, i) => i !== rIdx) };
        }
        return b;
      });
    }

    saveDb(db); return structuredClone(db[resource][index]);
  },
  async remove(resource, recordId) {
    if (!isDemo) return request(`/api/${resource}/${recordId}`, { method: 'DELETE' });
    const db = localDb();
    const toRemove = (db[resource] || []).find((row) => row.id === recordId);
    db[resource] = (db[resource] || []).filter((row) => row.id !== recordId);
    if (resource === 'students') {
      db.placements = db.placements.filter((row) => row.studentId !== recordId);
      // Remove from any batch rows
      db.batches = (db.batches || []).map((b) => ({
        ...b,
        rows: (b.rows || []).filter((r) => r.id !== recordId && (!toRemove?.email || r.email !== toRemove.email)),
      }));
    }
    if (resource === 'students' || resource === 'sessions') db.attendance = db.attendance.filter((row) => row.studentId !== recordId && row.sessionId !== recordId);
    saveDb(db); return { success: true };
  },
  async upsertAttendance(record) {
    if (!isDemo) return request('/api/attendance/upsert', { method: 'POST', body: JSON.stringify(record) });
    const db = localDb();
    const index = db.attendance.findIndex((row) => row.studentId === record.studentId && row.sessionId === record.sessionId);
    if (index >= 0) db.attendance[index] = { ...db.attendance[index], ...record, id: db.attendance[index].id };
    else db.attendance.unshift({ ...record, id: record.id || id() });
    saveDb(db);
    return structuredClone(db.attendance.find((row) => row.studentId === record.studentId && row.sessionId === record.sessionId));
  },
  async syncMeet(sessionId) {
    if (isDemo) throw new Error('Meet sync requires the Node API plus Google OAuth credentials and a valid Meet link. Configure the server first.');
    return request(`/api/sessions/${sessionId}/sync-meet`, { method: 'POST', body: '{}' });
  },
  async googleStatus() {
    if (isDemo) return { configured: false, demo: true };
    return request('/api/integrations/google/status');
  },
  // Quiz Rooms API
  async listQuizRooms() {
    if (!isDemo) return request('/api/quiz-rooms');
    const db = localDb();
    const now = new Date();
    // Auto-delete expired rooms after 48 hours
    db.quizRooms = (db.quizRooms || []).filter((r) => !r.expiresAt || new Date(r.expiresAt) > now);
    saveDb(db);
    return structuredClone(db.quizRooms);
  },
  async getQuizRoomByCode(code) {
    if (!isDemo) return request(`/api/quiz-rooms/code/${encodeURIComponent(code)}`);
    const db = localDb();
    const now = new Date();
    db.quizRooms = (db.quizRooms || []).filter((r) => !r.expiresAt || new Date(r.expiresAt) > now);
    saveDb(db);
    const room = (db.quizRooms || []).find((r) => String(r.roomCode).toUpperCase() === String(code).toUpperCase());
    if (!room) throw new Error(`Quiz room with code "${code}" was not found or has expired after 48 hours.`);
    return {
      id: room.id,
      title: room.title,
      roomCode: room.roomCode,
      description: room.description || '',
      batch: room.batch || '',
      timeLimitMinutes: room.timeLimitMinutes || 0,
      isActive: Boolean(room.isActive),
      allowReview: Boolean(room.allowReview),
      expiresAt: room.expiresAt,
      totalQuestions: (room.questions || []).length,
      questions: (room.questions || []).map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        points: q.points || 1,
      })),
    };
  },
  async getQuizRoom(id) {
    if (!isDemo) return request(`/api/quiz-rooms/${id}`);
    const db = localDb();
    const room = (db.quizRooms || []).find((r) => r.id === id);
    if (!room) throw new Error('Quiz room not found.');
    return structuredClone(room);
  },
  async createQuizRoom(record) {
    if (!isDemo) return request('/api/quiz-rooms', { method: 'POST', body: JSON.stringify(record) });
    const db = localDb();
    if (!db.quizRooms) db.quizRooms = [];
    const saved = {
      ...record,
      id: record.id || id(),
      submissions: record.submissions || [],
      expiresAt: record.expiresAt || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    };
    db.quizRooms.unshift(saved);
    saveDb(db);
    return structuredClone(saved);
  },
  async updateQuizRoom(roomId, record) {
    if (!isDemo) return request(`/api/quiz-rooms/${roomId}`, { method: 'PUT', body: JSON.stringify(record) });
    const db = localDb();
    const index = (db.quizRooms || []).findIndex((r) => r.id === roomId);
    if (index < 0) throw new Error('Quiz room not found.');
    db.quizRooms[index] = { ...db.quizRooms[index], ...record, id: roomId };
    saveDb(db);
    return structuredClone(db.quizRooms[index]);
  },
  async deleteQuizRoom(roomId) {
    if (!isDemo) return request(`/api/quiz-rooms/${roomId}`, { method: 'DELETE' });
    const db = localDb();
    db.quizRooms = (db.quizRooms || []).filter((r) => r.id !== roomId);
    saveDb(db);
    return { success: true };
  },
  async submitQuizRoom(code, payload) {
    if (!isDemo) return request(`/api/quiz-rooms/code/${encodeURIComponent(code)}/submit`, { method: 'POST', body: JSON.stringify(payload) });
    const db = localDb();
    const room = (db.quizRooms || []).find((r) => String(r.roomCode).toUpperCase() === String(code).toUpperCase());
    if (!room) throw new Error(`Quiz room with code "${code}" not found.`);
    if (!room.isActive) throw new Error('This quiz room is currently closed for submissions.');

    let score = 0;
    const questions = room.questions || [];
    const answers = payload.answers || {};
    questions.forEach((q) => {
      if (answers[q.id] !== undefined && Number(answers[q.id]) === Number(q.answer)) {
        score++;
      }
    });
    const totalQuestions = questions.length;
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const sub = {
      id: id(),
      studentName: payload.studentName,
      studentEmail: payload.studentEmail || '',
      score,
      totalQuestions,
      percentage,
      answers,
      timeTakenSeconds: payload.timeTakenSeconds || 0,
      submittedAt: new Date().toISOString(),
    };
    if (!room.submissions) room.submissions = [];
    room.submissions.unshift(sub);
    saveDb(db);

    return {
      success: true,
      score,
      totalQuestions,
      percentage,
      isPassing: score >= Math.ceil(totalQuestions / 2),
      submission: sub,
      breakdown: questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
        selectedAnswer: answers[q.id] ?? null,
        correctAnswer: q.answer,
        isCorrect: answers[q.id] !== undefined && Number(answers[q.id]) === Number(q.answer),
        explanation: q.explanation || '',
      })),
    };
  },
  async deleteQuizSubmission(roomId, submissionId) {
    if (!isDemo) return request(`/api/quiz-rooms/${roomId}/submissions/${submissionId}`, { method: 'DELETE' });
    const db = localDb();
    const room = (db.quizRooms || []).find((r) => r.id === roomId);
    if (room && room.submissions) {
      room.submissions = room.submissions.filter((s) => s.id !== submissionId && s._id !== submissionId);
      saveDb(db);
    }
    return { success: true };
  },
  async clearQuizSubmissions(roomId) {
    if (!isDemo) return request(`/api/quiz-rooms/${roomId}/submissions`, { method: 'DELETE' });
    const db = localDb();
    const room = (db.quizRooms || []).find((r) => r.id === roomId);
    if (room) {
      room.submissions = [];
      saveDb(db);
    }
    return { success: true };
  },
};
