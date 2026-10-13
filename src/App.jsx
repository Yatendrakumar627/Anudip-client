import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Drawer } from '@mantine/core';
import { api } from './api';
import { getPageMeta } from './constants/navigation';
import { useWorkspaceData } from './hooks/useWorkspaceData';
import { showError } from './utils/notifications';

// Layout Components
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import Footer from './components/layout/Footer';

// Modals
import RecordModal from './components/modals/RecordModal';
import DeleteModal from './components/common/DeleteModal';

// Pages
import OverviewPage from './pages/overview';
import LmsPortalPage from './pages/lms-portal';
import QuizPage from './pages/quiz';
import BatchesPage from './pages/batches';
import StudentsPage from './pages/students';
import SessionsPage from './pages/sessions';
import AttendancePage from './pages/attendance';
import PlacementsPage from './pages/placements';
import SettingsPage from './pages/settings';
import BetaFeaturePage from './pages/beta/BetaFeaturePage';

// Security & Authentication
import { AuthProvider } from './context/AuthContext';
import AdminAuthModal from './components/auth/AdminAuthModal';
import AdminAccessGate from './components/auth/AdminAccessGate';
import {
  IconBriefcase,
  IconCalendarEvent,
  IconSettings,
  IconVideo,
} from '@tabler/icons-react';

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

// Isolated Desktop Sidebar Component:
// Encapsulates hover state and renders <aside> so hover expand/collapse
// NEVER triggers a re-render of AppContent or its heavy table children.
const DesktopSidebar = React.memo(function DesktopSidebar({
  orgName,
  sidebarPinned,
  onTogglePin,
  metrics,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = sidebarPinned || isHovered;

  return (
    <aside
      className={`desktop-sidebar ${sidebarPinned ? 'pinned' : 'collapsed'} ${
        isHovered ? 'is-hovered' : ''
      }`}
      onMouseEnter={() => !sidebarPinned && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Sidebar
        orgName={orgName}
        isCollapsed={!isExpanded}
        isHovered={isHovered}
        isPinned={sidebarPinned}
        onTogglePin={onTogglePin}
        metrics={metrics}
      />
    </aside>
  );
});

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const [orgName, setOrgName] = useState(
    () => localStorage.getItem('anudip-org-name') || 'Anudip Foundation'
  );
  const [attendanceThreshold, setAttendanceThreshold] = useState(
    () => localStorage.getItem('anudip-attendance-threshold') || '75'
  );

  const {
    students,
    sessions,
    attendance,
    placements,
    batches,
    loading,
    saveRecord,
    deleteRecord,
    deleteMultipleRecords,
    deleteBatchWithOptions,
    clearBatchTable,
    importAttendance,
    syncMeet,
  } = useWorkspaceData();

  const openCreate = (type) => setModal({ type, record: null });
  const openEdit = (type, record) => setModal({ type, record });

  const handleSave = async (type, payload, recordId) => {
    await saveRecord(type, payload, recordId);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRecord(deleteTarget.resource, deleteTarget.record.id);
      setDeleteTarget(null);
    } catch (error) {
      showError(error);
    } finally {
      setDeleting(false);
    }
  };

  const askDelete = (type, record) => {
    const resourceMap = {
      student: 'students',
      session: 'sessions',
      attendance: 'attendance',
      placement: 'placements',
      batch: 'batches',
    };
    setDeleteTarget({ resource: resourceMap[type], record });
  };

  const handleSyncMeet = async (session) => {
    try {
      await syncMeet(session.id);
    } catch (error) {
      showError(error);
    }
  };

  const handlePageNavigate = (target) => {
    if (target.startsWith('/')) {
      navigate(target);
    } else {
      const routeMap = {
        overview: '/dashboard',
        dashboard: '/dashboard',
        credentials: '/lms-credential',
        'lms-credentials': '/lms-credential',
        quiz: '/quiz',
        batches: '/batches',
        cohorts: '/batches',
        students: '/students',
        sessions: '/sessions',
        attendance: '/attendance',
        placements: '/placements',
        settings: '/settings',
      };
      navigate(routeMap[target] || `/${target}`);
    }
    setSearch('');
    setGlobalSearch('');
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setGlobalSearch(value);
  };

  // Sidebar state: collapsed by default, pinned via toggle button or Ctrl+B
  const [sidebarPinned, setSidebarPinned] = useState(false);

  const toggleSidebarPinned = useCallback(() => {
    setSidebarPinned((prev) => !prev);
  }, []);

  // Keyboard shortcut: Ctrl+B or Cmd+B to toggle sidebar pin
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        const tag = e.target?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && !e.target?.isContentEditable) {
          e.preventDefault();
          setSidebarPinned((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeMeta = getPageMeta(location.pathname);

  // Real-time workspace metrics for sidebar items (memoized to eliminate redundant renders)
  const navMetrics = useMemo(() => ({
    batches: batches?.length || 0,
    students: students?.length || 0,
    sessions: sessions?.length || 0,
    placements: placements?.filter((p) => p.status === 'Placed').length || placements?.length || 0,
    attendance: 'LIVE',
  }), [batches?.length, students?.length, sessions?.length, placements]);

  const mobileSidebarElement = (
    <Sidebar
      closeMobile={() => setMobileNav(false)}
      orgName={orgName}
      isCollapsed={false}
      isHovered={false}
      isPinned={true}
      metrics={navMetrics}
    />
  );

  return (
    <div className="app-root">
      {/* Desktop Sidebar: isolated component so hover expand/collapse never re-renders the App or child views */}
      <DesktopSidebar
        orgName={orgName}
        sidebarPinned={sidebarPinned}
        onTogglePin={toggleSidebarPinned}
        metrics={navMetrics}
      />

      {/* Mobile Drawer Navigation */}
      <Drawer
        opened={mobileNav}
        onClose={() => setMobileNav(false)}
        padding={0}
        size={280}
        withCloseButton={false}
        className="mobile-sidebar-drawer"
      >
        <div className="mobile-sidebar-content">{mobileSidebarElement}</div>
      </Drawer>

      {/* Main Workspace Viewport */}
      <main className={`main-area ${sidebarPinned ? 'sidebar-pinned' : 'sidebar-collapsed'}`}>
        <Topbar
          activeTitle={activeMeta.title}
          activePath={location.pathname}
          searchValue={globalSearch}
          onSearchChange={handleSearchChange}
          onOpenMobileNav={() => setMobileNav(true)}
          isSidebarPinned={sidebarPinned}
          onToggleSidebar={toggleSidebarPinned}
          batches={batches}
          students={students}
        />

        <div className="content-wrap">
          {loading ? (
            <div className="loading-skeleton">
              <div className="skeleton-title" />
              <div className="skeleton-subtitle" />
              <div className="skeleton-grid">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="skeleton-card" />
                ))}
              </div>
              <div className="skeleton-large" />
            </div>
          ) : (
            <Routes>
              {/* Root redirects to /lms-credential */}
              <Route path="/" element={<Navigate to="/lms-credential" replace />} />

              {/* Overview / Dashboard (ONLY ADMIN ACCESS) */}
              <Route
                path="/dashboard"
                element={
                  <AdminAccessGate
                    featureTitle="Workspace Overview"
                    featureDescription="Viewing overall learner metrics, outcomes, and program statistics requires administrative authorization."
                  >
                    <OverviewPage
                      students={students}
                      sessions={sessions}
                      attendance={attendance}
                      placements={placements}
                      onAddStudent={() => openCreate('student')}
                      onAddSession={() => openCreate('session')}
                      onNavigate={handlePageNavigate}
                      orgName={orgName}
                    />
                  </AdminAccessGate>
                }
              />

               {/* LMS Student Portal & Credentials */}
              <Route
                path="/lms-credential"
                element={
                  <LmsPortalPage
                    students={students}
                    batches={batches}
                    search={search}
                    setSearch={handleSearchChange}
                  />
                }
              />
              <Route path="/lms-credentials" element={<Navigate to="/lms-credential" replace />} />
              <Route path="/lms-portal" element={<Navigate to="/lms-credential" replace />} />

              {/* Quiz */}
              <Route path="/quiz" element={<QuizPage batches={batches} />} />


              {/* Batches / Cohorts Management (ONLY ADMIN ACCESS) */}
              <Route
                path="/batches"
                element={
                  <AdminAccessGate
                    featureTitle="Batches Management"
                    featureDescription="Managing training cohorts, creating spreadsheets, and student rosters requires administrative authorization."
                  >
                    <BatchesPage
                      students={students}
                      sessions={sessions}
                      attendance={attendance}
                      placements={placements}
                      batches={batches}
                      onAddBatch={() => openCreate('batch')}
                      onEditBatch={(batch) => openEdit('batch', batch)}
                      onDeleteBatch={(batch) => askDelete('batch', batch)}
                      onDeleteBatchWithOptions={deleteBatchWithOptions}
                      onClearBatchTable={clearBatchTable}
                      onUpdateBatch={(batch) => saveRecord('batch', batch, batch.id)}
                      onCreateBatch={(batch) => saveRecord('batch', batch)}
                      onAddStudentToBatch={(batch) => {
                        setModal({
                          type: 'student',
                          record: { batch: batch.name, field: batch.field },
                        });
                      }}
                      onEditStudent={(student) => openEdit('student', student)}
                    />
                  </AdminAccessGate>
                }
              />
              <Route path="/cohorts" element={<Navigate to="/batches" replace />} />
              <Route path="/student-batches" element={<Navigate to="/batches" replace />} />

              {/* Students Directory (ONLY ADMIN ACCESS) */}
              <Route
                path="/students"
                element={
                  <AdminAccessGate
                    featureTitle="Student Directory"
                    featureDescription="Access to enrolled student contacts, training fields, and sensitive credentials is restricted to authorized facilitators."
                  >
                    <StudentsPage
                      students={students}
                      batches={batches}
                      attendance={attendance}
                      search={search}
                      setSearch={handleSearchChange}
                      onAdd={() => openCreate('student')}
                      onEdit={(record) => openEdit('student', record)}
                      onDelete={(record) => askDelete('student', record)}
                      onDeleteMultiple={(ids) => deleteMultipleRecords('students', ids)}
                      attendanceThreshold={attendanceThreshold}
                      onNavigate={handlePageNavigate}
                    />
                  </AdminAccessGate>
                }
              />

              {/* Training Sessions (BETA VERSION - DISABLED) */}
              <Route
                path="/sessions"
                element={
                  <BetaFeaturePage
                    title="Training Sessions"
                    subtitle="Organizing daily class schedules and Google Meet classroom integration is part of the upcoming v2.0 Beta release."
                    icon={IconVideo}
                  />
                }
              />
              <Route path="/training-sessions" element={<Navigate to="/sessions" replace />} />

              {/* Attendance (BETA VERSION - DISABLED) */}
              <Route
                path="/attendance"
                element={
                  <BetaFeaturePage
                    title="Attendance Tracking"
                    subtitle="Reviewing join/leave timestamps, live Google Meet tracking and engagement rates is part of the upcoming v2.0 Beta release."
                    icon={IconCalendarEvent}
                  />
                }
              />

              {/* Career Outcomes & Placements (BETA VERSION - DISABLED) */}
              <Route
                path="/placements"
                element={
                  <BetaFeaturePage
                    title="Career Outcomes & Placements"
                    subtitle="Interview pipeline tracking, corporate partner placement records, and package analytics are scheduled for the next beta release."
                    icon={IconBriefcase}
                  />
                }
              />

              {/* Settings (BETA VERSION - DISABLED) */}
              <Route
                path="/settings"
                element={
                  <BetaFeaturePage
                    title="Workspace Settings"
                    subtitle="Global workspace configurations, trainer profiles, and integration readiness are part of the upcoming v2.0 Beta release."
                    icon={IconSettings}
                  />
                }
              />

              {/* Catch-all 404 Route */}
              <Route path="*" element={<Navigate to="/lms-credential" replace />} />
            </Routes>
          )}

          <Footer orgName={orgName} demoMode={api.demoMode} />
        </div>
      </main>

      {/* Modals */}
      <AdminAuthModal />

      <RecordModal
        opened={!!modal}
        onClose={() => setModal(null)}
        type={modal?.type || 'student'}
        record={modal?.record}
        students={students}
        sessions={sessions}
        batches={batches}
        onSave={handleSave}
      />

      <DeleteModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
