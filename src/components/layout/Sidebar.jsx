/**
 * src/components/layout/Sidebar.jsx
 * ─────────────────────────────────────────────────────────────
 * Primary left navigation for the authenticated app.
 *
 * Items:  Dashboard · Run · Pipeline · Settings
 *
 * Active indicator:
 *   - Rendered as a single <motion.div layoutId="activeNav" />
 *   - Framer Motion morphs its position between active items
 *     with spring physics — no manual coordinates needed.
 *
 * Branding:
 *   - BizPilot logo top-left with a stylised indigo "B" mark.
 *   - User avatar + name pinned to the bottom.
 * ─────────────────────────────────────────────────────────────
 */

import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  PlayCircle,
  GitBranch,
  Settings as SettingsIcon,
  Sparkles,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'BizPilot AI';

// ─────────────────────────────────────────────────────────────
// Navigation config
// ─────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    to: '/app/dashboard',
    label: 'Dashboard',
    Icon: LayoutDashboard,
    description: 'Pipeline overview',
  },
  {
    to: '/app/run',
    label: 'Run',
    Icon: PlayCircle,
    description: 'Active campaigns',
  },
  {
    to: '/app/pipeline',
    label: 'Pipeline',
    Icon: GitBranch,
    description: 'Leads & deals',
  },
  {
    to: '/app/settings',
    label: 'Settings',
    Icon: SettingsIcon,
    description: 'Workspace prefs',
  },
];

// ─────────────────────────────────────────────────────────────
// B Mark (logo)
// ─────────────────────────────────────────────────────────────
function BMark({ size = 32 }) {
  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--radius-md)',
        background: 'linear-gradient(135deg, var(--color-accent) 0%, #818CF8 100%)',
        boxShadow: '0 4px 12px -2px rgba(79, 70, 229, 0.40)',
      }}
      aria-hidden="true"
    >
      <span
        style={{
          color: 'var(--color-text-inverse)',
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: size * 0.55,
          letterSpacing: '-0.04em',
          lineHeight: 1,
        }}
      >
        B
      </span>
      {/* Sparkle dot */}
      <span
        style={{
          position: 'absolute',
          top: -2,
          right: -2,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'var(--color-success)',
          border: '2px solid var(--color-base)',
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Active indicator (shared layoutId with MobileBottomNav if needed)
// ─────────────────────────────────────────────────────────────
function ActiveIndicator() {
  return (
    <motion.div
      layoutId="activeNav"
      transition={{
        type: 'spring',
        stiffness: 380,
        damping: 32,
      }}
      style={{
        position: 'absolute',
        left: 0,
        top: 8,
        bottom: 8,
        width: 3,
        borderRadius: '0 4px 4px 0',
        background: 'var(--color-accent)',
        boxShadow: '0 0 12px rgba(79, 70, 229, 0.45)',
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// Nav item
// ─────────────────────────────────────────────────────────────
function SidebarNavItem({ item, isActive }) {
  const Icon = item.Icon;

  return (
    <NavLink
      to={item.to}
      end={item.to === '/app/dashboard'}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        margin: '2px 0',
        borderRadius: 'var(--radius-input)',
        color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
        background: isActive ? 'var(--color-accent-subtle)' : 'transparent',
        fontWeight: isActive ? 600 : 500,
        fontSize: '0.875rem',
        textDecoration: 'none',
        transition:
          'background-color 160ms cubic-bezier(0.4,0,0.2,1), color 160ms cubic-bezier(0.4,0,0.2,1)',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'var(--color-surface)';
          e.currentTarget.style.color = 'var(--color-text)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--color-text-muted)';
        }
      }}
      aria-current={isActive ? 'page' : undefined}
    >
      {isActive && <ActiveIndicator />}
      <Icon
        size={18}
        strokeWidth={isActive ? 2.25 : 2}
        style={{ flexShrink: 0 }}
      />
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.label}
      </span>
      {item.badge && (
        <span
          style={{
            padding: '2px 8px',
            borderRadius: 'var(--radius-badge)',
            background: 'var(--color-accent)',
            color: 'var(--color-text-inverse)',
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.02em',
          }}
        >
          {item.badge}
        </span>
      )}
    </NavLink>
  );
}

// ─────────────────────────────────────────────────────────────
// User card (bottom)
// ─────────────────────────────────────────────────────────────
function UserCard() {
  const { user, profile } = useAuth();

  const name =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'You';

  const email = user?.email || '';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  const initials = (name || email)
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: 'var(--radius-card)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          aria-hidden
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--color-accent), #818CF8)',
            color: 'var(--color-text-inverse)',
            fontWeight: 700,
            fontSize: '0.75rem',
            flexShrink: 0,
          }}
        >
          {initials || 'B'}
        </div>
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <p
          style={{
            margin: 0,
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--color-text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: '0.6875rem',
            color: 'var(--color-text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {email}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────
export function Sidebar() {
  const location = useLocation();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '20px 16px',
        gap: 24,
      }}
    >
      {/* ── Logo ────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 6px',
        }}
      >
        <BMark size={32} />
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: '0.9375rem',
              fontWeight: 700,
              color: 'var(--color-text)',
              letterSpacing: '-0.01em',
              lineHeight: 1.1,
            }}
          >
            {APP_NAME}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: '0.6875rem',
              color: 'var(--color-text-muted)',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Sparkles size={10} style={{ color: 'var(--color-accent)' }} />
            AI Revenue OS
          </p>
        </div>
      </div>

      {/* ── Nav items ───────────────────────────────── */}
      <nav
        aria-label="Primary"
        style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive =
            location.pathname === item.to ||
            (item.to !== '/app/dashboard' && location.pathname.startsWith(item.to + '/')) ||
            (item.to === '/app/settings' && location.pathname.startsWith('/app/settings'));
          return <SidebarNavItem key={item.to} item={item} isActive={isActive} />;
        })}
      </nav>

      {/* ── Footer: workspace switcher / user ───────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <UserCard />
      </div>
    </div>
  );
}

export default Sidebar;
