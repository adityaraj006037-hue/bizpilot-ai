/**
 * src/components/layout/Topbar.jsx
 * ─────────────────────────────────────────────────────────────
 * Sticky topbar (64px) for the authenticated app.
 *
 * Layout:  [breadcrumb] ·········· [status] [search] [bell] [user]
 *
 * - Breadcrumb auto-derived from the current pathname.
 * - Pulsing green dot + "System operational" status.
 * - Notifications bell with badge.
 * - User dropdown: Profile · Settings · Sign out.
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  ChevronDown,
  ChevronRight,
  LogOut,
  Search,
  User as UserIcon,
  Settings as SettingsIcon,
  Check,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// ─────────────────────────────────────────────────────────────
// Breadcrumb helper — converts pathname → friendly labels
// ─────────────────────────────────────────────────────────────
const LABELS = {
  app: 'App',
  dashboard: 'Dashboard',
  run: 'Run',
  pipeline: 'Pipeline',
  settings: 'Settings',
  campaigns: 'Campaigns',
  leads: 'Leads',
  inbox: 'Inbox',
  templates: 'Templates',
  accounts: 'Email accounts',
  warmup: 'Warmup',
  analytics: 'Analytics',
  billing: 'Billing',
  team: 'Team',
  integrations: 'Integrations',
  'api-keys': 'API keys',
  webhooks: 'Webhooks',
  notifications: 'Notifications',
  security: 'Security',
  workspace: 'Workspace',
  profile: 'Profile',
  onboarding: 'Onboarding',
};

function useBreadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split('/').filter(Boolean);

  const crumbs = parts.map((segment, i) => {
    const path = '/' + parts.slice(0, i + 1).join('/');
    const label = LABELS[segment] || (segment.charAt(0).toUpperCase() + segment.slice(1));
    return { label, path, isLast: i === parts.length - 1 };
  });

  return crumbs.length > 0 ? crumbs : [{ label: 'Dashboard', path: '/app/dashboard', isLast: true }];
}

// ─────────────────────────────────────────────────────────────
// Pulsing status dot
// ─────────────────────────────────────────────────────────────
function StatusDot() {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        borderRadius: 'var(--radius-badge)',
        background: 'var(--color-success-subtle)',
        border: '1px solid rgba(16, 185, 129, 0.20)',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: 'var(--color-success)',
      }}
      aria-label="System operational"
    >
      <span style={{ position: 'relative', display: 'inline-flex' }}>
        <motion.span
          animate={{ scale: [1, 2.4, 2.4], opacity: [0.6, 0, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'var(--color-success)',
          }}
        />
        <span
          style={{
            position: 'relative',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--color-success)',
            boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
          }}
        />
      </span>
      <span style={{ whiteSpace: 'nowrap' }}>System operational</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Notifications dropdown
// ─────────────────────────────────────────────────────────────
function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { id: 1, title: 'Reply from Sarah Chen', detail: '"Sounds great — let\'s hop on a call…"', time: '4m ago', read: false },
    { id: 2, title: 'Campaign milestone', detail: 'Q4 SaaS Founders hit 1,000 sends', time: '2h ago', read: false },
    { id: 3, title: 'New lead enriched', detail: 'Marco Reyes · VP Sales @ Northwind', time: 'Yesterday', read: true },
  ]);
  const ref = useRef(null);
  const unreadCount = items.filter((i) => !i.read).length;

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markAllRead = () => setItems((prev) => prev.map((i) => ({ ...i, read: true })));

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications, ${unreadCount} unread`}
        style={{
          position: 'relative',
          width: 38,
          height: 38,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: '1px solid transparent',
          borderRadius: 'var(--radius-input)',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          transition: 'all 160ms cubic-bezier(0.4,0,0.2,1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--color-surface)';
          e.currentTarget.style.color = 'var(--color-text)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--color-text-muted)';
        }}
      >
        <Bell size={18} strokeWidth={2} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              borderRadius: 'var(--radius-badge)',
              background: 'var(--color-accent)',
              color: 'var(--color-text-inverse)',
              fontSize: '0.625rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--color-base)',
              lineHeight: 1,
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 360,
              background: 'var(--color-base)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 'var(--z-dropdown)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text)' }}>
                Notifications
              </p>
              <button
                onClick={markAllRead}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-accent)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Check size={12} />
                Mark all read
              </button>
            </div>

            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {items.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                  You're all caught up ✨
                </div>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, read: true } : i)))}
                    style={{
                      display: 'flex',
                      gap: 12,
                      width: '100%',
                      padding: '12px 16px',
                      background: n.read ? 'transparent' : 'var(--color-accent-subtle)',
                      border: 'none',
                      borderBottom: '1px solid var(--color-border)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background-color 120ms ease',
                    }}
                    onMouseEnter={(e) => {
                      if (n.read) e.currentTarget.style.background = 'var(--color-surface)';
                    }}
                    onMouseLeave={(e) => {
                      if (n.read) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {!n.read && (
                      <span
                        aria-hidden
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: 'var(--color-accent)',
                          marginTop: 6,
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          color: 'var(--color-text)',
                          marginBottom: 2,
                        }}
                      >
                        {n.title}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.75rem',
                          color: 'var(--color-text-muted)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {n.detail}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: '0.6875rem', color: 'var(--color-text-subtle)' }}>
                        {n.time}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>

            <Link
              to="/app/notifications"
              onClick={() => setOpen(false)}
              style={{
                display: 'block',
                padding: '12px 16px',
                textAlign: 'center',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--color-accent)',
                background: 'var(--color-surface)',
                borderTop: '1px solid var(--color-border)',
                textDecoration: 'none',
              }}
            >
              View all notifications →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// User dropdown
// ─────────────────────────────────────────────────────────────
function UserMenu({ user, profile }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef(null);
  const { signOut } = useAuth();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const name =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Account';

  const email = user?.email || '';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  const initials = (name || email)
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 10px 4px 4px',
          background: 'transparent',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-badge)',
          cursor: 'pointer',
          transition: 'all 160ms cubic-bezier(0.4,0,0.2,1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--color-surface)';
          e.currentTarget.style.borderColor = 'var(--color-border-strong)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'var(--color-border)';
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--color-accent), #818CF8)',
              color: 'var(--color-text-inverse)',
              fontWeight: 700,
              fontSize: '0.6875rem',
            }}
          >
            {initials || 'B'}
          </span>
        )}
        <ChevronDown
          size={14}
          style={{
            color: 'var(--color-text-muted)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
            role="menu"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              width: 240,
              background: 'var(--color-base)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 'var(--z-dropdown)',
              overflow: 'hidden',
              padding: 8,
            }}
          >
            {/* Header */}
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)', marginBottom: 6 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.8125rem',
                  fontWeight: 700,
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

            {/* Items */}
            <MenuItem
              icon={<UserIcon size={15} />}
              label="Profile"
              onClick={() => {
                setOpen(false);
                navigate('/app/settings/profile');
              }}
            />
            <MenuItem
              icon={<SettingsIcon size={15} />}
              label="Settings"
              onClick={() => {
                setOpen(false);
                navigate('/app/settings');
              }}
            />
            <div style={{ height: 1, background: 'var(--color-border)', margin: '6px 4px' }} />
            <MenuItem
              icon={<LogOut size={15} />}
              label="Sign out"
              onClick={handleSignOut}
              danger
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '9px 10px',
        background: 'transparent',
        border: 'none',
        borderRadius: 'var(--radius-input)',
        color: danger ? 'var(--color-danger)' : 'var(--color-text)',
        fontSize: '0.8125rem',
        fontWeight: 500,
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'background-color 120ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger ? 'var(--color-danger-subtle)' : 'var(--color-surface)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <span style={{ color: danger ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Topbar
// ─────────────────────────────────────────────────────────────
export function Topbar({ user, profile }) {
  const crumbs = useBreadcrumbs();

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-nav)',
        height: 'var(--nav-height)',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'saturate(180%) blur(16px)',
        WebkitBackdropFilter: 'saturate(180%) blur(16px)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '0 24px',
      }}
    >
      {/* ── Breadcrumb ───────────────────────────── */}
      <nav
        aria-label="Breadcrumb"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        {crumbs.map((c, i) => (
          <span
            key={c.path}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              minWidth: 0,
            }}
          >
            {i > 0 && (
              <ChevronRight
                size={13}
                style={{ color: 'var(--color-text-subtle)', flexShrink: 0 }}
                aria-hidden
              />
            )}
            {c.isLast ? (
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {c.label}
              </span>
            ) : (
              <Link
                to={c.path}
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--color-text-muted)',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  transition: 'color 120ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
              >
                {c.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* ── Right cluster ─────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div className="hidden md:block">
          <StatusDot />
        </div>

        {/* Quick search */}
        <button
          type="button"
          aria-label="Search"
          style={{
            display: 'none',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-input)',
            color: 'var(--color-text-muted)',
            fontSize: '0.8125rem',
            cursor: 'pointer',
            transition: 'all 120ms ease',
            minWidth: 200,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-base)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-surface)')}
        >
          <Search size={14} />
          <span style={{ flex: 1, textAlign: 'left' }}>Search…</span>
          <span
            className="kbd"
            style={{
              fontSize: '0.625rem',
              padding: '1px 5px',
              background: 'var(--color-base)',
              borderColor: 'var(--color-border)',
            }}
          >
            ⌘K
          </span>
        </button>

        <NotificationsBell />
        <UserMenu user={user} profile={profile} />
      </div>
    </header>
  );
}

export default Topbar;

// Used by MobileBottomNav so it shares the same supabase session shape.
export { supabase };
