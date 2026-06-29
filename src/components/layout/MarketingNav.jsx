/**
 * src/components/layout/MarketingNav.jsx
 * ─────────────────────────────────────────────────────────────
 * Top navigation for the public marketing site.
 *
 * Layout:  [B Mark + BizPilot AI]  ·  [Features Pricing Blog]  ·  [Login  Start Automating]
 *
 * Behaviour:
 *   - Becomes sticky (position: fixed) after the user scrolls
 *     past 60px, with a backdrop-blurred surface.
 *   - Compact translucent mode above the fold.
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Menu, X } from 'lucide-react';

const APP_NAME = import.meta.env.VITE_APP_NAME || 'BizPilot AI';

// ─────────────────────────────────────────────────────────────
// Logo (matches sidebar B-mark for consistency)
// ─────────────────────────────────────────────────────────────
function Logo({ light = false }) {
  const color = light ? 'var(--color-text-inverse)' : 'var(--color-text)';
  return (
    <Link
      to="/"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        textDecoration: 'none',
        color,
      }}
      aria-label={`${APP_NAME} home`}
    >
      <span
        style={{
          position: 'relative',
          width: 32,
          height: 32,
          borderRadius: 'var(--radius-md)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, var(--color-accent), #818CF8)',
          boxShadow: '0 6px 16px -4px rgba(79, 70, 229, 0.45)',
        }}
        aria-hidden
      >
        <span
          style={{
            color: 'var(--color-text-inverse)',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 18,
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}
        >
          B
        </span>
      </span>
      <span style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
        {APP_NAME}
      </span>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// Nav link
// ─────────────────────────────────────────────────────────────
function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      style={({ isActive }) => ({
        position: 'relative',
        padding: '8px 12px',
        fontSize: '0.875rem',
        fontWeight: 500,
        color: isActive ? 'var(--color-text)' : 'var(--color-text-muted)',
        textDecoration: 'none',
        transition: 'color 160ms ease',
        borderRadius: 'var(--radius-input)',
      })}
      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
      onMouseLeave={(e) => (e.currentTarget.style.color = '')}
    >
      {children}
    </NavLink>
  );
}

// ─────────────────────────────────────────────────────────────
// MarketingNav
// ─────────────────────────────────────────────────────────────
export function MarketingNav({ onOpenContact }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { scrollY } = useScroll();
  const shadowOpacity = useTransform(scrollY, [0, 60], [0, 1]);

  // Toggle "sticky mode" past 60px
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      <motion.header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 'var(--z-nav)',
          background: scrolled ? 'rgba(255, 255, 255, 0.78)' : 'transparent',
          backdropFilter: scrolled ? 'saturate(180%) blur(16px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'saturate(180%) blur(16px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--color-border)' : '1px solid transparent',
          transition:
            'background-color 200ms cubic-bezier(0.4,0,0.2,1), border-color 200ms cubic-bezier(0.4,0,0.2,1), backdrop-filter 200ms ease',
        }}
      >
        <motion.div style={{ boxShadow: useTransform(shadowOpacity, (o) => `0 1px 3px rgba(15,23,42,${o * 0.06})`) }}>
          <div
            style={{
              maxWidth: 'var(--container-extra-wide)',
              margin: '0 auto',
              padding: '14px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 24,
            }}
          >
            {/* Left: logo */}
            <Logo />

            {/* Centre: nav links (desktop only) */}
            <nav
              aria-label="Primary"
              className="hidden md:flex"
              style={{
                alignItems: 'center',
                gap: 4,
                padding: 4,
                borderRadius: 'var(--radius-badge)',
                background: scrolled ? 'var(--color-surface)' : 'transparent',
                border: scrolled ? '1px solid var(--color-border)' : '1px solid transparent',
                transition: 'all 200ms ease',
              }}
            >
              <NavItem to="/features">Features</NavItem>
              <NavItem to="/pricing">Pricing</NavItem>
              <NavItem to="/integrations">Integrations</NavItem>
              <NavItem to="/blog">Blog</NavItem>
            </nav>

            {/* Right: CTAs (desktop only) */}
            <div className="hidden md:flex" style={{ alignItems: 'center', gap: 8 }}>
              <Link
                to="/login"
                style={{
                  padding: '8px 14px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  background: 'transparent',
                  border: '1px solid transparent',
                  borderRadius: 'var(--radius-input)',
                  textDecoration: 'none',
                  transition: 'all 160ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-surface)';
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                Login
              </Link>
              <Link
                to="/signup"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-inverse)',
                  background: 'var(--color-accent)',
                  border: '1px solid var(--color-accent)',
                  borderRadius: 'var(--radius-input)',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px -2px rgba(79, 70, 229, 0.35)',
                  transition: 'all 160ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-accent-hover)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--color-accent)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Start Automating
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Mobile burger */}
            <button
              type="button"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-input)',
                background: 'transparent',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
                cursor: 'pointer',
              }}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </motion.div>
      </motion.header>

      {/* ── Mobile drawer ─────────────────────────────── */}
      <motion.div
        initial={false}
        animate={{
          height: mobileOpen ? 'auto' : 0,
          opacity: mobileOpen ? 1 : 0,
        }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className="md:hidden"
        style={{
          position: 'fixed',
          top: 64,
          left: 0,
          right: 0,
          background: 'var(--color-base)',
          borderBottom: '1px solid var(--color-border)',
          overflow: 'hidden',
          zIndex: 'calc(var(--z-nav) - 1)',
        }}
      >
        <div style={{ padding: '12px 24px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { to: '/features',     label: 'Features' },
            { to: '/pricing',      label: 'Pricing' },
            { to: '/integrations', label: 'Integrations' },
            { to: '/blog',         label: 'Blog' },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={{
                padding: '12px 14px',
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: 'var(--color-text)',
                textDecoration: 'none',
                borderRadius: 'var(--radius-input)',
              }}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              style={{
                flex: 1,
                padding: '10px 14px',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text)',
                background: 'var(--color-base)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-input)',
                textAlign: 'center',
                textDecoration: 'none',
              }}
            >
              Login
            </Link>
            <Link
              to="/signup"
              onClick={() => setMobileOpen(false)}
              style={{
                flex: 1,
                padding: '10px 14px',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text-inverse)',
                background: 'var(--color-accent)',
                border: '1px solid var(--color-accent)',
                borderRadius: 'var(--radius-input)',
                textAlign: 'center',
                textDecoration: 'none',
              }}
            >
              Start Automating
            </Link>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default MarketingNav;
