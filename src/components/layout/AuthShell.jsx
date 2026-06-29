/**
 * src/components/layout/AuthShell.jsx
 * ─────────────────────────────────────────────────────────────
 * Split-screen layout wrapper for auth pages (login, signup,
 * forgot-password, magic-link, verify-email, accept-invite).
 *
 *   ┌──────────────────────┬──────────────────────────┐
 *   │                      │                          │
 *   │   LEFT (form)        │   RIGHT (preview)        │
 *   │   - logo + tagline   │   - animated product     │
 *   │   - <Outlet/> form   │     mockup (Framer)      │
 *   │   - legal footer     │   - social proof         │
 *   │                      │                          │
 *   └──────────────────────┴──────────────────────────┘
 *
 * Responsive: stacks on mobile, side-by-side on >= lg.
 * ─────────────────────────────────────────────────────────────
 */

import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const APP_NAME = import.meta.env.VITE_APP_NAME || 'BizPilot AI';

const leftVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  },
};

const rightVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { delayChildren: 0.2, staggerChildren: 0.12 },
  },
};

const rightChildVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  },
};

// ─────────────────────────────────────────────────────────────
// Logo
// ─────────────────────────────────────────────────────────────
function Logo({ light = false }) {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5 group" aria-label={`${APP_NAME} home`}>
      <span
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-card"
        style={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)',
          boxShadow: '0 6px 16px -4px rgba(79, 70, 229, 0.45)',
        }}
      >
        <Rocket
          className="h-4.5 w-4.5 text-white transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          strokeWidth={2.5}
        />
      </span>
      <span
        className="text-lg font-bold tracking-tight"
        style={{ color: light ? '#FFFFFF' : '#0F172A' }}
      >
        {APP_NAME}
      </span>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// Right-side product preview (Framer Motion animated mockup)
// ─────────────────────────────────────────────────────────────
function ProductPreview() {
  return (
    <motion.div
      className="relative w-full max-w-xl mx-auto"
      variants={rightVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Soft glow */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 blur-3xl opacity-60"
        style={{
          background:
            'radial-gradient(circle at 30% 20%, rgba(129,140,248,0.5) 0%, transparent 60%), radial-gradient(circle at 70% 80%, rgba(16,185,129,0.35) 0%, transparent 60%)',
        }}
      />

      {/* Floating KPI cards */}
      <motion.div
        variants={rightChildVariants}
        className="absolute -left-6 top-6 z-20 hidden md:block"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="card p-3.5 w-48 backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.92)' }}>
          <p className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider">Reply Rate</p>
          <p className="text-2xl font-bold text-ink-900 mt-1">12.4%</p>
          <p className="text-xs font-semibold mt-1" style={{ color: '#10B981' }}>
            ↑ 3.1% vs last week
          </p>
        </div>
      </motion.div>

      {/* Floating meetings card */}
      <motion.div
        variants={rightChildVariants}
        className="absolute -right-4 bottom-20 z-20 hidden md:block"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <div className="card p-3.5 w-56 backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.92)' }}>
          <p className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider">Meetings booked</p>
          <p className="text-2xl font-bold text-ink-900 mt-1">38</p>
          <div className="flex items-center gap-1 mt-2">
            <span className="h-1.5 flex-1 rounded-full" style={{ background: '#4F46E5' }} />
            <span className="h-1.5 flex-1 rounded-full" style={{ background: '#4F46E5' }} />
            <span className="h-1.5 flex-1 rounded-full" style={{ background: '#4F46E5' }} />
            <span className="h-1.5 flex-1 rounded-full" style={{ background: '#E2E8F0' }} />
          </div>
        </div>
      </motion.div>

      {/* Main product mockup */}
      <motion.div
        variants={rightChildVariants}
        className="relative card overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.97)' }}
      >
        {/* Mockup chrome */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b" style={{ borderColor: '#E2E8F0' }}>
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#EF4444' }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#F59E0B' }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#10B981' }} />
          <div className="ml-3 px-3 py-1 rounded-input text-[11px] font-mono text-ink-500"
               style={{ background: '#F8FAFC' }}>
            app.bizpilot.ai/campaigns
          </div>
        </div>

        {/* Mockup body */}
        <div className="p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider">Active campaign</p>
              <p className="text-base font-bold text-ink-900 mt-0.5">Q4 SaaS Founders — Sequence 03</p>
            </div>
            <span
              className="badge badge-success"
              style={{ background: '#ECFDF5', color: '#059669' }}
            >
              ● Live
            </span>
          </div>

          {/* Stat row */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: 'Sent', value: '2,847', accent: '#4F46E5' },
              { label: 'Opened', value: '1,412', accent: '#6366F1' },
              { label: 'Replied', value: '354', accent: '#10B981' },
            ].map((s) => (
              <div key={s.label} className="rounded-input p-3" style={{ background: '#F8FAFC' }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: s.accent }}>
                  {s.label}
                </p>
                <p className="text-lg font-bold text-ink-900 mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Mini email preview */}
          <div className="rounded-input p-3.5 space-y-2" style={{ background: '#F8FAFC' }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-ink-900">Step 3 of 5 · Personalized follow-up</p>
              <span className="text-[10px] font-mono text-ink-500">AI ✨</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: '#E2E8F0' }}>
              <motion.div
                className="h-2 rounded-full"
                style={{ background: 'linear-gradient(90deg, #4F46E5, #10B981)' }}
                initial={{ width: '0%' }}
                animate={{ width: '74%' }}
                transition={{ duration: 2.4, ease: 'easeOut', repeat: Infinity, repeatType: 'reverse' }}
              />
            </div>
            <div className="space-y-1.5">
              <div className="h-1.5 rounded-full" style={{ background: '#E2E8F0', width: '88%' }} />
              <div className="h-1.5 rounded-full" style={{ background: '#E2E8F0', width: '64%' }} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Trust line */}
      <motion.p
        variants={rightChildVariants}
        className="mt-6 text-center text-xs font-medium"
        style={{ color: 'rgba(15,23,42,0.6)' }}
      >
        Trusted by 800+ revenue teams shipping pipeline on autopilot.
      </motion.p>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// AuthShell
// ─────────────────────────────────────────────────────────────
export default function AuthShell() {
  const location = useLocation();
  const isInvite = location.pathname.startsWith('/invite/');

  return (
    <div
      className="min-h-screen w-full flex flex-col lg:flex-row"
      style={{ background: '#FFFFFF', color: '#0F172A' }}
    >
      {/* ─── LEFT — Form Column ─────────────────────────── */}
      <motion.aside
        className="relative flex w-full lg:w-1/2 xl:w-[44%] flex-col px-6 py-8 sm:px-10 lg:px-16"
        variants={leftVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Top: logo + (optional) context */}
        <header className="flex items-center justify-between">
          <Logo />
          <div className="text-sm text-ink-500">
            {isInvite ? (
              <span>You've been invited</span>
            ) : (
              <>
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="font-semibold transition-colors"
                  style={{ color: '#4F46E5' }}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </header>

        {/* Center: outlet form */}
        <main className="flex-1 flex items-center justify-center py-12 lg:py-0">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </main>

        {/* Bottom: legal */}
        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-500">
          <p>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
          <nav className="flex items-center gap-4">
            <Link to="/legal/privacy" className="hover:text-ink-700 transition-colors">
              Privacy
            </Link>
            <Link to="/legal/terms" className="hover:text-ink-700 transition-colors">
              Terms
            </Link>
            <Link to="/legal/cookies" className="hover:text-ink-700 transition-colors">
              Cookies
            </Link>
          </nav>
        </footer>
      </motion.aside>

      {/* ─── RIGHT — Product Preview Column ────────────── */}
      <aside
        className="relative hidden lg:flex w-full lg:w-1/2 xl:w-[56%] flex-col justify-center px-12 py-16 overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, #4F46E5 0%, #6366F1 45%, #818CF8 100%)',
        }}
      >
        {/* Subtle dot grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, #FFFFFF 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        {/* Soft mesh overlay */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 80% 10%, rgba(255,255,255,0.45) 0%, transparent 50%), radial-gradient(circle at 10% 90%, rgba(16,185,129,0.35) 0%, transparent 50%)',
          }}
        />

        <div className="relative z-10 max-w-xl mx-auto w-full">
          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <span
              className="badge"
              style={{
                background: 'rgba(255,255,255,0.18)',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.25)',
              }}
            >
              ✨ AI-Powered Outreach
            </span>
            <h2
              className="mt-5 text-4xl xl:text-5xl font-bold tracking-tighter"
              style={{ color: '#FFFFFF' }}
            >
              Book meetings on autopilot.
            </h2>
            <p
              className="mt-4 text-base xl:text-lg"
              style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}
            >
              AI-personalized sequences, unified inbox, lead enrichment, and warmup — all in one
              revenue workspace built for B2B teams.
            </p>
          </motion.div>

          {/* Animated product preview */}
          <div className="mt-10">
            <ProductPreview />
          </div>
        </div>
      </aside>
    </div>
  );
}
