import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ActionIcon,
  Badge,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import {
  IconCheck,
  IconCommand,
  IconKey,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconLock,
  IconLogout,
  IconSchool,
  IconSettings,
  IconShieldCheck,
  IconShieldLock,
  IconSparkles,
  IconUser,
  IconX,
} from '@tabler/icons-react';
import { navItems } from '../../constants/navigation';
import { useAdminAuth } from '../../context/AuthContext';

export default function Sidebar({
  closeMobile,
  orgName = 'Anudip Foundation',
  isCollapsed = false,
  isHovered = false,
  isPinned = false,
  onTogglePin,
  metrics = {},
}) {
  const { isAdmin, openLoginModal, logout, formattedRemaining } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const groups = ['WORKSPACE', 'OUTCOMES', 'MANAGE'];
  const brandName = orgName.trim().split(/\s+/)[0].toLowerCase();
  const adminName = localStorage.getItem('anudip-admin-name') || 'LMS Administrator';
  const adminRole = localStorage.getItem('anudip-admin-role') || `${orgName} Facilitator`;

  // Dismissible mission banner state
  const [showMissionCard, setShowMissionCard] = useState(() => {
    return localStorage.getItem('hide-sidebar-mission') !== 'true';
  });

  const handleDismissMission = (e) => {
    e.stopPropagation();
    setShowMissionCard(false);
    localStorage.setItem('hide-sidebar-mission', 'true');
  };

  // True if pinned open or currently hovered
  const isExpanded = !isCollapsed || isHovered;

  const handleNav = (path, item = null) => {
    if (item?.requiresAdmin && !isAdmin) {
      openLoginModal(path);
      closeMobile?.();
      return;
    }
    navigate(path);
    closeMobile?.();
  };

  // Dynamic badge resolver for nav items
  const getItemBadge = (item) => {
    if (item.isBeta) return 'BETA';
    if (!metrics) return null;
    switch (item.id) {
      case 'batches':
        return metrics.batches > 0 ? metrics.batches : null;
      case 'students':
        return metrics.students > 0 ? metrics.students : null;
      default:
        return null;
    }
  };

  return (
    <aside className={`sidebar-container ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* 1. FIXED TOP HEADER */}
      <div className="sidebar-header">
        <div className="brand-header-row">
          <div
            className="brand-lockup"
            style={{ cursor: 'pointer' }}
            onClick={() => handleNav('/dashboard')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleNav('/dashboard')}
          >
            <div className="brand-mark">
              <IconSparkles size={22} stroke={2.2} />
            </div>
            {isExpanded && (
              <div className="brand-copy">
                <div className="brand-name">
                  {brandName}
                  <span>.</span>
                </div>
                <div className="brand-subtitle">{orgName.toUpperCase()} WORKSPACE</div>
              </div>
            )}
          </div>

          {isExpanded && onTogglePin && (
            <Tooltip
              label={isPinned ? 'Collapse sidebar (Ctrl+B)' : 'Pin sidebar open (Ctrl+B)'}
              position="right"
              withArrow
            >
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                className="sidebar-pin-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin();
                }}
                aria-label={isPinned ? 'Collapse sidebar' : 'Pin sidebar open'}
              >
                {isPinned ? (
                  <IconLayoutSidebarLeftCollapse size={17} stroke={1.9} />
                ) : (
                  <IconLayoutSidebarLeftExpand size={17} stroke={1.9} />
                )}
              </ActionIcon>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="sidebar-divider" />

      {/* 2. SCROLLABLE MIDDLE NAVIGATION */}
      <div className="sidebar-nav-scroll">
        {groups.map((group) => {
          const groupItems = navItems.filter((item) => item.group === group);
          if (groupItems.length === 0) return null;

          return (
            <div className="nav-group" key={group}>
              {isExpanded ? (
                <div className="nav-group-label">{group}</div>
              ) : (
                <div className="nav-group-mini-divider" />
              )}
              {groupItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.path ||
                  (item.path === '/dashboard' &&
                    (location.pathname === '/' || location.pathname === ''));

                const isBeta = Boolean(item.isBeta);
                const requiresAdmin = Boolean(item.requiresAdmin);
                const isLocked = requiresAdmin && !isAdmin;

                const badge = getItemBadge(item);
                const isLive = badge === 'LIVE';

                const buttonContent = (
                  <UnstyledButton
                    key={item.id}
                    className={`nav-item ${isActive ? 'active' : ''} ${
                      isBeta ? 'nav-item-beta' : ''
                    } ${isLocked ? 'nav-item-locked' : ''} ${
                      isExpanded ? 'nav-item-expanded' : 'nav-item-collapsed'
                    }`}
                    onClick={() => handleNav(item.path, item)}
                    aria-label={item.label}
                  >
                    {isActive && <span className="nav-active-indicator" />}
                    <span className="nav-item-icon">
                      <Icon size={19} stroke={1.85} />
                      {item.id === 'attendance' && !isExpanded && !isBeta && (
                        <span className="nav-pulse-mini" />
                      )}
                      {isLocked && !isExpanded && (
                        <span className="nav-lock-mini-dot">🔒</span>
                      )}
                    </span>

                    {isExpanded && (
                      <>
                        <span className="nav-item-text">{item.label}</span>
                        {isBeta ? (
                          <Badge
                            size="xs"
                            variant="light"
                            color="orange"
                            className="nav-badge-beta"
                          >
                            BETA
                          </Badge>
                        ) : isLocked ? (
                          <Badge
                            size="xs"
                            variant="subtle"
                            color="gray"
                            leftSection={<IconLock size={10} />}
                          >
                            Admin
                          </Badge>
                        ) : isLive ? (
                          <span className="nav-live-pill">
                            <span className="nav-live-dot" />
                            Live
                          </span>
                        ) : badge ? (
                          <Badge
                            size="xs"
                            variant="filled"
                            className={`nav-badge ${isActive ? 'active' : ''}`}
                          >
                            {badge}
                          </Badge>
                        ) : null}
                      </>
                    )}
                  </UnstyledButton>
                );

                if (!isExpanded) {
                  return (
                    <Tooltip
                      key={item.id}
                      label={
                        isBeta
                          ? `${item.label} (Beta - Disabled)`
                          : isLocked
                          ? `${item.label} (Admin Password Required)`
                          : badge && !isLive
                          ? `${item.label} (${badge})`
                          : item.label
                      }
                      position="right"
                      withArrow
                      offset={14}
                      transitionProps={{ duration: 120, transition: 'fade' }}
                    >
                      {buttonContent}
                    </Tooltip>
                  );
                }

                return buttonContent;
              })}
            </div>
          );
        })}
      </div>

      {/* 3. FIXED BOTTOM DOCK (Footer) */}
      <div className="sidebar-footer">
        {/* Dismissible NGO Mission card - only when expanded and not dismissed */}
        {isExpanded && showMissionCard && (
          <div className="support-card">
            <button
              type="button"
              className="support-card-close"
              onClick={handleDismissMission}
              aria-label="Dismiss impact card"
            >
              <IconX size={13} />
            </button>
            <div className="support-header-row">
              <div className="support-icon">
                <IconShieldCheck size={16} />
              </div>
              <div className="support-title">Learn · Practice · Grow</div>
            </div>
            <div className="support-copy">
              Empowering youth with market-aligned digital skills.
            </div>
          </div>
        )}

        {/* LMS Administrator Access Control Dock */}
        {!isAdmin ? (
          /* LOCKED STATE: Clean, high-contrast, 1-click direct login button without any popup menu */
          isExpanded ? (
            <button
              type="button"
              className="admin-dock-btn locked"
              onClick={() => openLoginModal()}
              aria-label="Unlock Administrator Access"
            >
              <div className="admin-dock-icon locked">
                <IconLock size={17} stroke={2.4} />
              </div>
              <div className="admin-dock-info">
                <div className="admin-dock-title">Admin Access</div>
                <div className="admin-dock-subtitle">Locked · Click to login</div>
              </div>
              <span className="admin-dock-action-badge">
                <IconKey size={12} stroke={2.2} />
                <span>Login</span>
              </span>
            </button>
          ) : (
            <Tooltip
              label="Admin Login (Click to unlock)"
              position="right"
              withArrow
              offset={14}
            >
              <button
                type="button"
                className="admin-dock-btn-mini locked"
                onClick={() => openLoginModal()}
                aria-label="Unlock Administrator Access"
              >
                <IconLock size={18} stroke={2.2} />
              </button>
            </Tooltip>
          )
        ) : (
          /* ACTIVE ADMIN STATE: Clean live session card with countdown + direct 1-click lock button */
          isExpanded ? (
            <div className="admin-dock-btn active">
              <div className="admin-dock-icon active">
                <IconShieldCheck size={18} stroke={2.4} />
                <span className="admin-pulse-dot" />
              </div>
              <div className="admin-dock-info">
                <div className="admin-dock-title">
                  {adminName || 'LMS Administrator'}
                </div>
                <div className="admin-dock-subtitle active">
                  <span className="admin-status-indicator">● Active</span>
                  <span className="admin-timer">({formattedRemaining})</span>
                </div>
              </div>
              <Tooltip label="Lock Session (Sign Out)" position="top" withArrow>
                <button
                  type="button"
                  className="admin-dock-logout-btn"
                  onClick={logout}
                  aria-label="Lock Admin Session"
                >
                  <IconLogout size={15} stroke={2.2} />
                </button>
              </Tooltip>
            </div>
          ) : (
            <Tooltip
              label={`Admin Active (${formattedRemaining}) · Click to Lock`}
              position="right"
              withArrow
              offset={14}
            >
              <button
                type="button"
                className="admin-dock-btn-mini active"
                onClick={logout}
                aria-label="Lock Administrator Session"
              >
                <IconShieldCheck size={18} stroke={2.2} />
                <span className="admin-pulse-dot" />
              </button>
            </Tooltip>
          )
        )}
      </div>
    </aside>
  );
}
