/**
 * src/components/layout/AppShell.jsx
 * ─────────────────────────────────────────────────────────────
 * Main authenticated app wrapper.
 *
 *  ┌──────────┬─────────────────────────────────────────────┐
 *  │          │  Topbar (sticky, 64px)                      │
 *  │ Sidebar  ├─────────────────────────────────────────────┤
 *  │  240px   │                                             │
 *  │  fixed   │   <Outlet />  (scrollable content)          │
 *  │          │                                             │
 *  └──────────┴─────────────────────────────────────────────┘
 *
 * Responsive:
 *   - Desktop (≥ lg): fixed left sidebar (240px) + topbar
 *   - Mobile  (< lg): bottom nav bar replaces sidebar
 *
 * The animated active nav indicator lives in Sidebar.jsx with
 * shared layoutId="activeNav" so it slides between items.
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useAuth } from '@/contexts/AuthContext';

// ─────────────────────────────────────────────────────────────
// Page-transition wrapper
// ─────────────────────────────────────────────────────────────
function PageTransition({ children, pathname }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        style={{ minHeight: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────
// AppShell
// ─────────────────────────────────────────────────────────────
export default function AppShell() {
  const location = useLocation();
  const { profile, user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Reset scroll on route change so new pages start at the top.
  useEffect(() => {
    const main = document.getElementById('app-shell-main');
    if (main) main.scrollTo({ top: 0, behavior: 'instant' });
    else window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  // Close mobile drawer on route change (mobile uses different UI anyway).
  useEffect(() => {
    setSidebarCollapsed(false);
  }, [location.pathname]);

  return (
    <div
      className="min-h-screen w-full flex"
      style={{
        background: 'var(--color-surface)',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* ─── Sidebar (desktop only, fixed) ─────────────── */}
      <aside
        className="hidden lg:flex flex-col flex-shrink-0"
        style={{
          width: 'var(--sidebar-width)',
          height: '100vh',
          position: 'sticky',
          top: 0,
          background: 'var(--color-base)',
          borderRight: '1px solid var(--color-border)',
          zIndex: 'var(--z-sticky)',
        }}
        aria-label="Primary navigation"
      >
        <Sidebar />
      </aside>

      {/* ─── Main column ──────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Topbar */}
        <Topbar user={user} profile={profile} />

        {/* Content area */}
        <main
          id="app-shell-main"
          className="flex-1 overflow-y-auto"
          style={{
            background: 'var(--color-surface)',
            paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))', // room for mobile bottom nav
          }}
        >
          <PageTransition pathname={location.pathname}>
            <Outlet />
          </PageTransition>
        </main>
      </div>

      {/* ─── Mobile bottom nav (< lg) ─────────────────── */}
      <MobileBottomNav />
    </div>
  );
}
