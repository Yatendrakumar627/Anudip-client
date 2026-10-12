import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Divider,
  Group,
  Kbd,
  Menu,
  Modal,
  Popover,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import {
  IconArrowRight,
  IconBell,
  IconCheck,
  IconClock,
  IconExternalLink,
  IconFolder,
  IconKey,
  IconLayoutDashboard,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconLock,
  IconLogout,
  IconMenu2,
  IconSchool,
  IconSearch,
  IconShieldCheck,
  IconSparkles,
  IconUsers,
  IconX,
} from '@tabler/icons-react';
import { useAdminAuth } from '../../context/AuthContext';

export default function Topbar({
  activeTitle = 'Overview',
  activePath = '/dashboard',
  searchValue = '',
  onSearchChange,
  onOpenMobileNav,
  isSidebarPinned = false,
  onToggleSidebar,
  batches = [],
  students = [],
}) {
  const navigate = useNavigate();
  const { isAdmin, formattedRemaining, openLoginModal, logout } = useAdminAuth();

  // Search input & Spotlight Modal state
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [spotlightQuery, setSpotlightQuery] = useState('');
  const searchInputRef = useRef(null);

  // Notifications State
  const [notifPopoverOpen, setNotifPopoverOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [notificationsList, setNotificationsList] = useState([
    {
      id: 'lms-sync',
      icon: IconSchool,
      color: 'indigo',
      title: 'LMS Student Portal Synchronized',
      message: '4 batch cohorts are live with student credentials and Google Meet links.',
      time: 'Just now',
      read: false,
      link: '/lms-credential',
    },
    {
      id: 'admin-sec',
      icon: IconShieldCheck,
      color: 'teal',
      title: '15-Minute Session Protection Active',
      message: 'Encrypted admin cache protects batch rosters and student directories.',
      time: '5m ago',
      read: false,
    },
    {
      id: 'meet-track',
      icon: IconClock,
      color: 'blue',
      title: 'Google Meet Attendance Tracker',
      message: 'Automated real-time attendance tracking is listening for training sessions.',
      time: '20m ago',
      read: false,
    },
  ]);

  // Global Keyboard Shortcuts (Ctrl+K / Cmd+K for Spotlight, Ctrl+B for Sidebar)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K or Cmd+K: Open Spotlight Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        const tag = e.target?.tagName;
        if (tag !== 'TEXTAREA') {
          e.preventDefault();
          setSpotlightOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mark all notifications as read
  const handleMarkAllRead = () => {
    setNotificationsList((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  // Quick navigation helper
  const handleNavigate = (path, requiresAdmin = false) => {
    if (requiresAdmin && !isAdmin) {
      setSpotlightOpen(false);
      openLoginModal(path);
      return;
    }
    navigate(path);
    setSpotlightOpen(false);
    setNotifPopoverOpen(false);
  };

  // Navigable system pages for Spotlight search
  const SYSTEM_PAGES = useMemo(
    () => [
      {
        id: 'overview',
        title: 'Overview Dashboard',
        subtitle: 'Key training metrics, cohort stats, and placement outcomes',
        path: '/dashboard',
        icon: IconLayoutDashboard,
        badge: 'Public',
        badgeColor: 'teal',
      },
      {
        id: 'lms-credential',
        title: 'LMS Student Portal',
        subtitle: 'Learner login credentials, batch cohorts, and Google Meet',
        path: '/lms-credential',
        icon: IconSchool,
        badge: 'Public',
        badgeColor: 'teal',
      },
      {
        id: 'batches',
        title: 'Batches & Cohort Management',
        subtitle: 'Manage training programs, trainers, dates, and schedules',
        path: '/batches',
        icon: IconFolder,
        badge: 'Admin Only',
        badgeColor: 'indigo',
        requiresAdmin: true,
      },
      {
        id: 'students',
        title: 'Student Directory',
        subtitle: 'Enrolled students, contact info, attendance, and placements',
        path: '/students',
        icon: IconUsers,
        badge: 'Admin Only',
        badgeColor: 'indigo',
        requiresAdmin: true,
      },
    ],
    []
  );

  // Spotlight search filtering across Pages, Batches, and Students
  const spotlightResults = useMemo(() => {
    const q = spotlightQuery.toLowerCase().trim();
    if (!q) {
      return {
        pages: SYSTEM_PAGES,
        batches: batches.slice(0, 4),
        students: students.slice(0, 4),
      };
    }

    const matchedPages = SYSTEM_PAGES.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.path.toLowerCase().includes(q)
    );

    const matchedBatches = batches
      .filter((b) =>
        [b.name, b.code, b.trainer, b.field].some((val) =>
          String(val || '').toLowerCase().includes(q)
        )
      )
      .slice(0, 6);

    const matchedStudents = students
      .filter((s) =>
        [s.name, s.email, s.phone, s.batch].some((val) =>
          String(val || '').toLowerCase().includes(q)
        )
      )
      .slice(0, 6);

    return {
      pages: matchedPages,
      batches: matchedBatches,
      students: matchedStudents,
    };
  }, [spotlightQuery, SYSTEM_PAGES, batches, students]);

  // Determine current page status badge
  const pageBadge = useMemo(() => {
    if (activePath === '/batches' || activePath === '/students') {
      return {
        label: isAdmin ? 'Admin Access' : 'Admin Locked',
        color: isAdmin ? 'green' : 'indigo',
        icon: isAdmin ? IconShieldCheck : IconLock,
      };
    }
    if (activePath === '/lms-credential') {
      return { label: 'Student Portal', color: 'teal', icon: IconSchool };
    }
    if (['/sessions', '/attendance', '/placements', '/settings'].some((p) => activePath.startsWith(p))) {
      return { label: 'Beta Module', color: 'orange', icon: IconSparkles };
    }
    return null;
  }, [activePath, isAdmin]);

  const PageBadgeIcon = pageBadge?.icon;

  return (
    <>
      <header className="topbar">
        {/* Left Section: Sidebar Toggle & Interactive Breadcrumbs */}
        <div className="topbar-left">
          {onToggleSidebar && (
            <Tooltip
              label={isSidebarPinned ? 'Collapse sidebar (Ctrl+B)' : 'Pin sidebar open (Ctrl+B)'}
              withArrow
              position="bottom"
            >
              <ActionIcon
                variant="subtle"
                color="gray"
                size="lg"
                className="desktop-sidebar-toggle"
                onClick={onToggleSidebar}
                aria-label={isSidebarPinned ? 'Collapse sidebar' : 'Pin sidebar open'}
              >
                {isSidebarPinned ? (
                  <IconLayoutSidebarLeftCollapse size={20} />
                ) : (
                  <IconLayoutSidebarLeftExpand size={20} />
                )}
              </ActionIcon>
            </Tooltip>
          )}

          <ActionIcon
            variant="subtle"
            color="gray"
            className="mobile-menu-button"
            onClick={onOpenMobileNav}
            aria-label="Open navigation menu"
          >
            <IconMenu2 size={21} />
          </ActionIcon>

          {/* Interactive Breadcrumb Navigation */}
          <div className="breadcrumb">
            <UnstyledButton
              className="breadcrumb-root-link"
              onClick={() => navigate('/dashboard')}
              aria-label="Go to Workspace Overview"
            >
              Workspace
            </UnstyledButton>
            <span className="breadcrumb-arrow">
              <IconArrowRight size={12} color="#94a3b8" />
            </span>
            <strong className="breadcrumb-current">{activeTitle}</strong>

            {pageBadge && (
              <Badge
                size="xs"
                variant="light"
                color={pageBadge.color}
                leftSection={PageBadgeIcon ? <PageBadgeIcon size={10} /> : null}
                className="breadcrumb-status-badge"
              >
                {pageBadge.label}
              </Badge>
            )}
          </div>
        </div>

        {/* Right Section: Global Search, Admin Status, Notifications, & Profile Menu */}
        <div className="topbar-right">
          {/* Spotlight / Global Search Bar */}
          <div
            className="header-search-wrap"
            onClick={() => {
              searchInputRef.current?.focus();
            }}
          >
            <IconSearch size={16} color="#64748b" />
            <input
              ref={searchInputRef}
              aria-label="Search current section or press Ctrl+K"
              placeholder="Search anything..."
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setSpotlightQuery(searchValue);
                  setSpotlightOpen(true);
                }
              }}
            />
            {searchValue ? (
              <ActionIcon
                size="xs"
                variant="subtle"
                color="gray"
                onClick={(e) => {
                  e.stopPropagation();
                  onSearchChange?.('');
                }}
                aria-label="Clear search"
              >
                <IconX size={12} />
              </ActionIcon>
            ) : null}
            <Tooltip label="Open Spotlight Command Palette" position="bottom" withArrow>
              <kbd
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSpotlightQuery(searchValue);
                  setSpotlightOpen(true);
                }}
              >
                Ctrl+K
              </kbd>
            </Tooltip>
          </div>

          {/* Quick Admin Session Mode Pill in Navbar */}
          {isAdmin ? (
            <Tooltip label={`15-Minute Admin Session (${formattedRemaining} remaining) · Click to lock`} withArrow>
              <UnstyledButton
                onClick={logout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 10px',
                  borderRadius: 999,
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#047857',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.25)',
                  }}
                />
                <span>Admin</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#065f46' }}>
                  {formattedRemaining}
                </span>
              </UnstyledButton>
            </Tooltip>
          ) : (
            <Tooltip label="Admin Login (Unlock Batches & Students)" withArrow>
              <Button
                variant="subtle"
                color="indigo"
                size="xs"
                radius="md"
                leftSection={<IconLock size={13} />}
                onClick={() => openLoginModal()}
                style={{ fontSize: 11.5, fontWeight: 700 }}
              >
                Admin Login
              </Button>
            </Tooltip>
          )}

          {/* Notifications Center Popover */}
          <Popover
            opened={notifPopoverOpen}
            onChange={setNotifPopoverOpen}
            position="bottom-end"
            withArrow
            shadow="xl"
            width={340}
          >
            <Popover.Target>
              <Tooltip label="Notifications" withArrow>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="lg"
                  aria-label="Notifications"
                  onClick={() => setNotifPopoverOpen((o) => !o)}
                  style={{ position: 'relative' }}
                >
                  <IconBell size={19} />
                  {unreadCount > 0 && <span className="bell-dot" />}
                </ActionIcon>
              </Tooltip>
            </Popover.Target>

            <Popover.Dropdown style={{ padding: '14px 16px', borderRadius: 14 }}>
              <Group justify="space-between" mb="xs">
                <Group gap="xs">
                  <Text size="sm" fw={800} c="dark.7">
                    Notifications
                  </Text>
                  {unreadCount > 0 && (
                    <Badge size="xs" color="indigo" variant="filled">
                      {unreadCount} new
                    </Badge>
                  )}
                </Group>
                {unreadCount > 0 && (
                  <Button
                    variant="subtle"
                    size="compact-xs"
                    color="gray"
                    onClick={handleMarkAllRead}
                    style={{ fontSize: 10.5 }}
                  >
                    Mark all read
                  </Button>
                )}
              </Group>

              <Divider mb="xs" />

              <Stack gap="xs">
                {notificationsList.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (item.link) handleNavigate(item.link);
                      }}
                      style={{
                        display: 'flex',
                        gap: 11,
                        padding: '9px 10px',
                        borderRadius: 10,
                        background: item.read ? 'transparent' : '#f8fafc',
                        border: '1px solid',
                        borderColor: item.read ? 'transparent' : '#e2e8f0',
                        cursor: item.link ? 'pointer' : 'default',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <ThemeIcon size={30} radius="md" color={item.color} variant="light" style={{ flexShrink: 0 }}>
                        <ItemIcon size={16} />
                      </ThemeIcon>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text size="xs" fw={700} c="dark.7" lineClamp={1}>
                            {item.title}
                          </Text>
                          <Text size="10px" c="dimmed">
                            {item.time}
                          </Text>
                        </div>
                        <Text size="11px" c="dimmed" mt={2} lineClamp={2} style={{ lineHeight: 1.4 }}>
                          {item.message}
                        </Text>
                      </div>
                    </div>
                  );
                })}
              </Stack>

              <Divider mt="xs" mb="xs" />

              <Button
                fullWidth
                size="xs"
                variant="light"
                color="indigo"
                radius="md"
                onClick={() => handleNavigate('/lms-credential')}
                leftSection={<IconSchool size={14} />}
              >
                Go to LMS Student Portal
              </Button>
            </Popover.Dropdown>
          </Popover>

          {/* User Profile / Administrator Menu */}
          <Menu position="bottom-end" withArrow shadow="xl" width={240}>
            <Menu.Target>
              <Tooltip label={isAdmin ? 'Administrator Session' : 'Workspace User'} withArrow>
                <div style={{ cursor: 'pointer', position: 'relative' }}>
                  <Avatar
                    color={isAdmin ? 'indigo' : 'gray'}
                    radius="xl"
                    size={36}
                    style={{
                      border: isAdmin ? '2px solid #818cf8' : '1px solid #cbd5e1',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    {isAdmin ? 'LA' : 'GW'}
                  </Avatar>
                  {isAdmin && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: '#10b981',
                        border: '2px solid white',
                      }}
                    />
                  )}
                </div>
              </Tooltip>
            </Menu.Target>

            <Menu.Dropdown style={{ padding: 6, borderRadius: 12 }}>
              <div style={{ padding: '8px 10px 10px' }}>
                <Text size="xs" fw={800} c="dark.7">
                  {isAdmin ? 'LMS Administrator' : 'Guest / Student User'}
                </Text>
                <Text size="10.5px" c="dimmed" mt={1}>
                  {isAdmin ? 'admin@anudip.org' : 'Public Workspace'}
                </Text>
                {isAdmin ? (
                  <Badge size="xs" color="teal" variant="light" mt={6}>
                    ● Active Session ({formattedRemaining})
                  </Badge>
                ) : (
                  <Badge size="xs" color="gray" variant="light" mt={6}>
                    Read-Only Mode
                  </Badge>
                )}
              </div>

              <Menu.Divider />

              <Menu.Label>Navigation</Menu.Label>
              <Menu.Item
                leftSection={<IconLayoutDashboard size={15} />}
                onClick={() => handleNavigate('/dashboard')}
              >
                Overview Dashboard
              </Menu.Item>
              <Menu.Item
                leftSection={<IconSchool size={15} color="#4f46e5" />}
                onClick={() => handleNavigate('/lms-credential')}
              >
                LMS Student Portal
              </Menu.Item>
              <Menu.Item
                leftSection={<IconFolder size={15} />}
                rightSection={!isAdmin ? <IconLock size={12} color="#94a3b8" /> : null}
                onClick={() => handleNavigate('/batches', true)}
              >
                Manage Batches
              </Menu.Item>
              <Menu.Item
                leftSection={<IconUsers size={15} />}
                rightSection={!isAdmin ? <IconLock size={12} color="#94a3b8" /> : null}
                onClick={() => handleNavigate('/students', true)}
              >
                Student Directory
              </Menu.Item>

              <Menu.Divider />

              <Menu.Label>Security & Session</Menu.Label>
              {isAdmin ? (
                <Menu.Item
                  leftSection={<IconLogout size={15} color="#ef4444" />}
                  color="red"
                  onClick={logout}
                >
                  Lock Session (Sign Out)
                </Menu.Item>
              ) : (
                <Menu.Item
                  leftSection={<IconKey size={15} color="#4f46e5" />}
                  onClick={() => openLoginModal()}
                >
                  Admin Login
                </Menu.Item>
              )}

              <Menu.Divider />

              <div style={{ padding: '4px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text size="9.5px" c="dimmed">
                  Anudip Hub v2.0
                </Text>
                <Kbd size="xs">Ctrl+K</Kbd>
              </div>
            </Menu.Dropdown>
          </Menu>
        </div>
      </header>

      {/* Spotlight Command Palette Modal (Ctrl+K) */}
      <Modal
        opened={spotlightOpen}
        onClose={() => setSpotlightOpen(false)}
        withCloseButton={false}
        padding="md"
        radius="lg"
        size="lg"
        centered
        overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 6px 12px', borderBottom: '1px solid #f1f5f9' }}>
          <IconSearch size={18} color="#6366f1" />
          <input
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: 14,
              fontWeight: 600,
              color: '#0f172a',
            }}
            placeholder="Type a page, batch code, or student name..."
            value={spotlightQuery}
            onChange={(e) => setSpotlightQuery(e.target.value)}
            autoFocus
          />
          {spotlightQuery && (
            <ActionIcon size="sm" variant="subtle" color="gray" onClick={() => setSpotlightQuery('')}>
              <IconX size={14} />
            </ActionIcon>
          )}
          <Kbd size="xs">ESC</Kbd>
        </div>

        <ScrollArea style={{ maxHeight: 380, marginTop: 10 }} scrollbars="y">
          {/* Section: Pages */}
          {spotlightResults.pages.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <Text size="10px" fw={800} c="dimmed" tt="uppercase" ls={0.8} px={8} mb={4}>
                Modules & Pages
              </Text>
              <Stack gap={3}>
                {spotlightResults.pages.map((p) => {
                  const PageIcon = p.icon;
                  return (
                    <UnstyledButton
                      key={p.id}
                      onClick={() => handleNavigate(p.path, p.requiresAdmin)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: 8,
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <Group gap="sm">
                        <ThemeIcon size={28} radius="md" color="indigo" variant="light">
                          <PageIcon size={16} />
                        </ThemeIcon>
                        <div>
                          <Text size="xs" fw={700} c="dark.7">
                            {p.title}
                          </Text>
                          <Text size="10.5px" c="dimmed">
                            {p.subtitle}
                          </Text>
                        </div>
                      </Group>
                      <Badge size="xs" color={p.badgeColor} variant="light">
                        {p.badge}
                      </Badge>
                    </UnstyledButton>
                  );
                })}
              </Stack>
            </div>
          )}

          {/* Section: Matching Batches */}
          {spotlightResults.batches.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <Text size="10px" fw={800} c="dimmed" tt="uppercase" ls={0.8} px={8} mb={4}>
                Training Batches
              </Text>
              <Stack gap={3}>
                {spotlightResults.batches.map((b) => (
                  <UnstyledButton
                    key={b.id}
                    onClick={() => handleNavigate('/lms-credential')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 8,
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Group gap="sm">
                      <ThemeIcon size={28} radius="md" color="teal" variant="light">
                        <IconFolder size={16} />
                      </ThemeIcon>
                      <div>
                        <Text size="xs" fw={700} c="dark.7">
                          {b.name} ({b.code})
                        </Text>
                        <Text size="10.5px" c="dimmed">
                          Trainer: {b.trainer || 'Facilitator'} · {b.field || 'Tech'}
                        </Text>
                      </div>
                    </Group>
                    <Badge size="xs" color="teal" variant="outline">
                      View LMS
                    </Badge>
                  </UnstyledButton>
                ))}
              </Stack>
            </div>
          )}

          {/* Section: Matching Students */}
          {spotlightResults.students.length > 0 && (
            <div>
              <Text size="10px" fw={800} c="dimmed" tt="uppercase" ls={0.8} px={8} mb={4}>
                Students & Credentials
              </Text>
              <Stack gap={3}>
                {spotlightResults.students.map((s) => (
                  <UnstyledButton
                    key={s.id}
                    onClick={() => {
                      if (onSearchChange) onSearchChange(s.name);
                      handleNavigate('/lms-credential');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 8,
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Group gap="sm">
                      <ThemeIcon size={28} radius="md" color="blue" variant="light">
                        <IconUsers size={16} />
                      </ThemeIcon>
                      <div>
                        <Text size="xs" fw={700} c="dark.7">
                          {s.name}
                        </Text>
                        <Text size="10.5px" c="dimmed">
                          Batch: {s.batch} · Phone: {s.phone || 'N/A'}
                        </Text>
                      </div>
                    </Group>
                    <Badge size="xs" color="indigo" variant="light">
                      LMS Credentials
                    </Badge>
                  </UnstyledButton>
                ))}
              </Stack>
            </div>
          )}

          {spotlightResults.pages.length === 0 &&
            spotlightResults.batches.length === 0 &&
            spotlightResults.students.length === 0 && (
              <div style={{ padding: '30px 10px', textAlign: 'center' }}>
                <Text size="sm" fw={700} c="dark.6">
                  No matching results found
                </Text>
                <Text size="xs" c="dimmed" mt={4}>
                  Try searching with a different batch code or student name.
                </Text>
              </div>
            )}
        </ScrollArea>
      </Modal>
    </>
  );
}
