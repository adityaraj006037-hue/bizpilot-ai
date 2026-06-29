/**
 * src/components/layout/MobileBottomNav.jsx
 * ─────────────────────────────────────────────────────────────
 * Mobile-only (< lg) bottom navigation. Mirrors the sidebar
 * nav items + shares the same `layoutId="activeNav"` so the
 * indicator morphs between sidebar and bottom nav on resize.
 * ─────────────────────────────────────────────────────────────
 */

import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  PlayCircle,
  GitBranch,
  Settings as SettingsIcon,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/app/dashboard', label: 'Home',    Icon: LayoutDashboard },
  { to: '/app/run',       label: 'Run',     Icon: PlayCircle },
  { to: '/app/pipeline',  label: 'Pipeline',Icon: GitBranch },
  { to: '/app/settings',  label: 'Settings',Icon: SettingsIcon },
];

export function MobileBottomNav() {
  const location = useLocation();

  return (
    <nav
      aria-label="Primary"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '8px 12px calc(8px + env(safe-area-inset-bottom, 0px))',
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'saturate(180%) blur(16px)',
        WebkitBackdropFilter: 'saturate(180%) blur(16px)',
        borderTop: '1px solid var(--color-border)',
        zIndex: 'var(--z-nav)',
      }}
      className="lg:hidden"
    >
      {NAV_ITEMS.map((item) => {
        const Icon = item.Icon;
        const isActive =
          location.pathname === item.to ||
          (item.to === '/app/settings' && location.pathname.startsWith('/app/settings')) ||
          (item.to !== '/app/dashboard' && location.pathname.startsWith(item.to + '/'));

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/app/dashboard'}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              padding: '6px 12px',
              borderRadius: 'var(--radius-input)',
              color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
              fontSize: '0.6875rem',
              fontWeight: isActive ? 700 : 500,
              textDecoration: 'none',
              minWidth: 60,
            }}
          >
            {isActive && (
              <motion.div
                layoutId="activeNav"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                style={{
                  position: 'absolute',
                  top: -8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 24,
                  height: 3,
                  borderRadius: '0 0 4px 4px',
                  background: 'var(--color-accent)',
                  boxShadow: '0 4px 12px -2px rgba(79, 70, 229, 0.45)',
                }}
              />
            )}
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export default MobileBottomNav;
