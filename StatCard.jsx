/**
 * src/components/dashboard/StatCard.jsx
 * ─────────────────────────────────────────────────────────────
 * Reusable stat card with animated counter.
 *
 * The number animates from 0 → `value` using Framer Motion's
 * `useMotionValue` + `useSpring` with stiffness 80 / damping 20.
 * Format helpers handle: integer, decimal, percent, currency.
 *
 * Optional `delta` shows a green/red pill with an arrow icon.
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useId } from 'react';
import PropTypes from 'prop-types';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Format helpers
// ─────────────────────────────────────────────────────────────
function formatValue(latest, format, suffix, prefix) {
  const safe = Number.isFinite(latest) ? latest : 0;
  let out;
  switch (format) {
    case 'percent':
      out = `${Math.round(safe * 10) / 10}`;
      break;
    case 'decimal':
      out = safe.toFixed(1);
      break;
    case 'currency':
      out = `$${Math.round(safe).toLocaleString()}`;
      break;
    case 'compact':
      out = Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(safe);
      break;
    case 'integer':
    case 'number':
    default:
      out = Math.round(safe).toLocaleString();
  }
  return `${prefix || ''}${out}${suffix || ''}`;
}

// ─────────────────────────────────────────────────────────────
// StatCard
// ─────────────────────────────────────────────────────────────
export function StatCard({
  label,
  value = 0,
  delta,
  deltaDirection, // 'up' | 'down' (auto-detected from delta sign if omitted)
  deltaLabel = 'vs last week',
  icon: Icon,
  format = 'number',
  prefix,
  suffix,
  accentColor = 'var(--color-accent)',
  loading = false,
  className = '',
  style,
}) {
  const id = useId();
  const count = useMotionValue(0);
  const spring = useSpring(count, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (latest) => formatValue(latest, format, suffix, prefix));

  // Kick off the count-up whenever the target value changes.
  useEffect(() => {
    if (loading) {
      count.set(0);
      return undefined;
    }
    count.set(Number(value) || 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, loading]);

  // Delta computation
  const hasDelta = delta !== undefined && delta !== null;
  const direction =
    deltaDirection || (Number(delta) >= 0 ? 'up' : 'down');
  const deltaTone =
    direction === 'up'
      ? { color: 'var(--color-success)', bg: 'var(--color-success-subtle)', border: 'rgba(16,185,129,0.25)' }
      : { color: 'var(--color-danger)',  bg: 'var(--color-danger-subtle)',  border: 'rgba(239,68,68,0.25)' };
  const DeltaIcon = direction === 'up' ? ArrowUpRight : ArrowDownRight;

  return (
    <motion.article
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
      }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={`bp-stat-card ${className}`}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        padding: 24,
        background: 'var(--color-base)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-xs)',
        overflow: 'hidden',
        ...style,
      }}
      aria-busy={loading || undefined}
    >
      {/* Subtle accent glow */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)`,
          opacity: 0.10,
          pointerEvents: 'none',
        }}
      />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            letterSpacing: '-0.005em',
          }}
        >
          {label}
        </span>
        {Icon && (
          <span
            aria-hidden
            style={{
              width: 32,
              height: 32,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-input)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: accentColor,
            }}
          >
            <Icon size={16} strokeWidth={2.25} />
          </span>
        )}
      </div>

      {/* Animated value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minHeight: 44 }}>
        {loading ? (
          <span
            aria-hidden
            style={{
              width: '60%',
              height: 36,
              borderRadius: 'var(--radius-input)',
              background:
                'linear-gradient(90deg, var(--color-surface) 0%, var(--surface-2) 50%, var(--color-surface) 100%)',
              backgroundSize: '200% 100%',
              animation: 'bp-shimmer 1.4s linear infinite',
            }}
          />
        ) : (
          <motion.span
            id={`bp-stat-${id}`}
            style={{
              fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              color: 'var(--color-text)',
              fontFamily: 'var(--font-display)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {display}
          </motion.span>
        )}
      </div>

      {/* Delta */}
      {hasDelta && !loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              padding: '2px 8px',
              borderRadius: 'var(--radius-badge)',
              background: deltaTone.bg,
              border: `1px solid ${deltaTone.border}`,
              color: deltaTone.color,
              fontSize: '0.6875rem',
              fontWeight: 700,
            }}
          >
            <DeltaIcon size={11} strokeWidth={3} />
            {Math.abs(Number(delta)).toFixed(1)}%
          </span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            {deltaLabel}
          </span>
        </div>
      )}
    </motion.article>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number,
  delta: PropTypes.number,
  deltaDirection: PropTypes.oneOf(['up', 'down']),
  deltaLabel: PropTypes.string,
  icon: PropTypes.elementType,
  format: PropTypes.oneOf(['number', 'integer', 'decimal', 'percent', 'currency', 'compact']),
  prefix: PropTypes.string,
  suffix: PropTypes.string,
  accentColor: PropTypes.string,
  loading: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default StatCard;
