/**
 * src/components/leads/LeadDrawer.jsx
 * ─────────────────────────────────────────────────────────────
 * Slide-in detail drawer for a single lead.
 *
 * Animation:    Framer Motion x: 400 → 0 (right slide-in)
 * Backdrop:     Fade-in overlay, click to dismiss
 * Close:        X button, ESC key, backdrop click
 *
 * Sections shown:
 *   1. Header    — avatar, name, title @ company, stage badge
 *   2. Score     — circular progress indicator (0–100)
 *   3. Contact   — email, phone, LinkedIn, location
 *   4. Emails    — list of sent variants (subject + date)
 *   5. Follow-up — scheduled steps with checkboxes
 *   6. Agent notes — raw Scout research output (enrichment_data)
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Mail,
  Phone,
  Linkedin,
  MapPin,
  Briefcase,
  Building2,
  CheckCircle2,
  Circle,
  Sparkles,
  ExternalLink,
  Target,
  CalendarClock,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { supabase, normalizeError } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// ─────────────────────────────────────────────────────────────
// Circular score progress
// ─────────────────────────────────────────────────────────────
function CircularScore({ value = 0, size = 96, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const target = Math.max(0, Math.min(100, value));
  const offset = circumference - (target / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="bp-score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-accent)" />
            <stop offset="100%" stopColor="var(--color-success)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#bp-score-gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
        }}
      >
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          style={{
            fontSize: size * 0.28,
            fontWeight: 800,
            color: 'var(--color-text)',
            fontFamily: 'var(--font-display)',
            letterSpacing: '-0.02em',
          }}
        >
          {Math.round(target)}
        </motion.span>
        <span
          style={{
            fontSize: size * 0.10,
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            marginTop: 2,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          score
        </span>
      </div>
    </div>
  );
}

CircularScore.propTypes = { value: PropTypes.number, size: PropTypes.number, strokeWidth: PropTypes.number };

// ─────────────────────────────────────────────────────────────
// Section wrapper
// ─────────────────────────────────────────────────────────────
function DrawerSection({ title, Icon, count, children, delay = 0 }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.4, 0, 0.2, 1] }}
      style={{
        padding: '20px 0',
        borderTop: '1px solid var(--color-border)',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {Icon && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 26,
                height: 26,
                borderRadius: 'var(--radius-input)',
                background: 'var(--color-accent-subtle)',
                color: 'var(--color-accent)',
              }}
            >
              <Icon size={14} strokeWidth={2.25} />
            </span>
          )}
          <h4
            style={{
              margin: 0,
              fontSize: '0.8125rem',
              fontWeight: 700,
              color: 'var(--color-text)',
              letterSpacing: '-0.005em',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </h4>
        </div>
        {typeof count === 'number' && (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-badge)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-muted)',
              fontSize: '0.6875rem',
              fontWeight: 700,
            }}
          >
            {count}
          </span>
        )}
      </header>
      {children}
    </motion.section>
  );
}

DrawerSection.propTypes = {
  title: PropTypes.string.isRequired,
  Icon: PropTypes.elementType,
  count: PropTypes.number,
  children: PropTypes.node,
  delay: PropTypes.number,
};

// ─────────────────────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────────────────────
function Avatar({ name, photoUrl, size = 48 }) {
  const initials = (name || '?')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          border: '2px solid var(--color-base)',
          boxShadow: 'var(--shadow-sm)',
        }}
      />
    );
  }
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--color-accent), #818CF8)',
        color: 'var(--color-text-inverse)',
        fontWeight: 700,
        fontSize: size * 0.36,
        flexShrink: 0,
        border: '2px solid var(--color-base)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {initials || '?'}
    </div>
  );
}

Avatar.propTypes = { name: PropTypes.string, photoUrl: PropTypes.string, size: PropTypes.number };

// ─────────────────────────────────────────────────────────────
// LeadDrawer
// ─────────────────────────────────────────────────────────────
export function LeadDrawer({ lead, open, onClose }) {
  const { workspaceId } = useAuth();
  const [emails, setEmails] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [loadingExtras, setLoadingExtras] = useState(false);
  const [extrasError, setExtrasError] = useState(null);

  // ── Lock body scroll while open ──
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ── ESC to close ──
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // ── Fetch emails + followups when lead opens ──
  useEffect(() => {
    if (!open || !lead?.id || !workspaceId) return undefined;

    let cancelled = false;
    setLoadingExtras(true);
    setExtrasError(null);

    (async () => {
      try {
        const [emailsRes, followupsRes] = await Promise.all([
          supabase
            .from('emails')
            .select('id, subject, status, sent_at, opened_at, replied_at, direction, body_ai_generated')
            .eq('workspace_id', workspaceId)
            .eq('lead_id', lead.id)
            .order('sent_at', { ascending: false })
            .limit(20),
          supabase
            .from('followups')
            .select('id, step_number, step_type, step_name, scheduled_for, status, subject')
            .eq('workspace_id', workspaceId)
            .eq('lead_id', lead.id)
            .order('step_number', { ascending: true })
            .limit(30),
        ]);
        if (cancelled) return;
        if (emailsRes.error) throw emailsRes.error;
        if (followupsRes.error) throw followupsRes.error;
        setEmails(emailsRes.data || []);
        setFollowups(followupsRes.data || []);
      } catch (err) {
        if (!cancelled) setExtrasError(normalizeError(err));
      } finally {
        if (!cancelled) setLoadingExtras(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, lead?.id, workspaceId]);

  const agentNotes = useMemo(() => {
    if (!lead?.enrichment_data || typeof lead.enrichment_data !== 'object') return null;
    const e = lead.enrichment_data;
    return {
      summary: e.summary || e.notes || e.research_summary || null,
      painPoints: Array.isArray(e.pain_points) ? e.pain_points : e.painPoints || [],
      triggers: Array.isArray(e.triggers) ? e.triggers : [],
      raw: e,
    };
  }, [lead]);

  const sentEmails = emails.filter((e) => e.direction === 'outbound');

  return (
    <AnimatePresence>
      {open && lead && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 'var(--z-modal)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`Lead detail for ${lead.full_name || lead.email || 'lead'}`}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}
          />

          {/* Drawer panel */}
          <motion.aside
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            style={{
              position: 'relative',
              width: 'min(560px, 100%)',
              height: '100%',
              background: 'var(--color-base)',
              borderLeft: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Top bar */}
            <header
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-base)',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  Lead detail
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close drawer"
                style={{
                  width: 32,
                  height: 32,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-input)',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  transition: 'all 160ms ease',
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
                <X size={16} />
              </button>
            </header>

            {/* Body */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px 24px 40px',
              }}
            >
              {/* ── Header: name + score + stage ─────────── */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  display: 'flex',
                  gap: 18,
                  alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                <Avatar name={lead.full_name || lead.email} photoUrl={lead.photo_url} size={64} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: 'var(--color-text)',
                      letterSpacing: '-0.015em',
                      lineHeight: 1.2,
                    }}
                  >
                    {lead.full_name || 'Unnamed lead'}
                  </h2>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: '0.8125rem',
                      color: 'var(--color-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      flexWrap: 'wrap',
                    }}
                  >
                    {lead.title && (
                      <>
                        <Briefcase size={12} />
                        <span>{lead.title}</span>
                      </>
                    )}
                    {lead.title && lead.company_name && (
                      <span style={{ color: 'var(--color-text-subtle)' }}>·</span>
                    )}
                    {lead.company_name && (
                      <>
                        <Building2 size={12} />
                        <span>{lead.company_name}</span>
                      </>
                    )}
                  </p>
                  <div style={{ marginTop: 10 }}>
                    <Badge variant={lead.status} size="md" showDot />
                  </div>
                </div>
                <CircularScore value={lead.score || 0} />
              </motion.div>

              {/* ── Contact details grid ────────────────── */}
              <DrawerSection title="Contact" Icon={Mail} delay={0.05}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: 10,
                  }}
                >
                  {lead.email && (
                    <ContactRow Icon={Mail} label="Email" value={lead.email} href={`mailto:${lead.email}`} />
                  )}
                  {lead.phone && (
                    <ContactRow Icon={Phone} label="Phone" value={lead.phone} href={`tel:${lead.phone}`} />
                  )}
                  {lead.linkedin_url && (
                    <ContactRow Icon={Linkedin} label="LinkedIn" value={lead.linkedin_url} href={lead.linkedin_url} external />
                  )}
                  {(lead.company_city || lead.company_country) && (
                    <ContactRow
                      Icon={MapPin}
                      label="Location"
                      value={[lead.company_city, lead.company_country].filter(Boolean).join(', ')}
                    />
                  )}
                  {lead.enrichment_data?.pain_point && (
                    <ContactRow Icon={Target} label="Pain point" value={lead.enrichment_data.pain_point} />
                  )}
                </div>
              </DrawerSection>

              {/* ── Emails sent ────────────────────────── */}
              <DrawerSection
                title="Emails sent"
                Icon={Mail}
                count={sentEmails.length}
                delay={0.10}
              >
                {loadingExtras ? (
                  <SkeletonLines count={2} />
                ) : sentEmails.length === 0 ? (
                  <Empty mini label="No emails sent to this lead yet." />
                ) : (
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {sentEmails.map((m) => (
                      <motion.li
                        key={m.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 12px',
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-input)',
                        }}
                      >
                        <span
                          style={{
                            width: 28,
                            height: 28,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 'var(--radius-input)',
                            background: m.opened_at ? 'var(--color-success-subtle)' : 'var(--color-surface)',
                            color: m.opened_at ? 'var(--color-success)' : 'var(--color-text-muted)',
                            flexShrink: 0,
                          }}
                        >
                          {m.opened_at ? <CheckCircle2 size={14} /> : <Mail size={14} />}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
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
                            {m.subject || '(no subject)'}
                          </p>
                          <p
                            style={{
                              margin: '2px 0 0',
                              fontSize: '0.6875rem',
                              color: 'var(--color-text-muted)',
                              display: 'flex',
                              gap: 8,
                            }}
                          >
                            <span>{m.sent_at ? new Date(m.sent_at).toLocaleDateString() : 'queued'}</span>
                            {m.opened_at && <span style={{ color: 'var(--color-success)' }}>· opened</span>}
                            {m.replied_at && <span style={{ color: 'var(--color-success)' }}>· replied</span>}
                          </p>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </DrawerSection>

              {/* ── Follow-up timeline ─────────────────── */}
              <DrawerSection
                title="Follow-up timeline"
                Icon={CalendarClock}
                count={followups.length}
                delay={0.15}
              >
                {loadingExtras ? (
                  <SkeletonLines count={3} />
                ) : followups.length === 0 ? (
                  <Empty mini label="No follow-ups scheduled yet." />
                ) : (
                  <ol
                    style={{
                      listStyle: 'none',
                      margin: 0,
                      padding: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      position: 'relative',
                    }}
                  >
                    {followups.map((f, i) => {
                      const isDone = f.status === 'sent' || f.status === 'skipped';
                      const isPending = ['pending', 'queued', 'paused', 'in_progress'].includes(f.status);
                      return (
                        <motion.li
                          key={f.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25, delay: i * 0.04 }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 4px',
                          }}
                        >
                          <span style={{ flexShrink: 0 }}>
                            {isDone ? (
                              <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
                            ) : isPending ? (
                              <Circle size={18} style={{ color: 'var(--color-accent)' }} />
                            ) : (
                              <Circle size={18} style={{ color: 'var(--color-text-subtle)' }} />
                            )}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                margin: 0,
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                color: 'var(--color-text)',
                                textDecoration: isDone && f.status === 'skipped' ? 'line-through' : 'none',
                              }}
                            >
                              Step {f.step_number}: {f.step_name || f.step_type}
                            </p>
                            <p
                              style={{
                                margin: '2px 0 0',
                                fontSize: '0.6875rem',
                                color: 'var(--color-text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                fontWeight: 600,
                              }}
                            >
                              {f.scheduled_for
                                ? new Date(f.scheduled_for).toLocaleString()
                                : 'unscheduled'}
                              {' · '}
                              <span
                                style={{
                                  color: isDone
                                    ? 'var(--color-success)'
                                    : isPending
                                    ? 'var(--color-accent)'
                                    : 'var(--color-text-muted)',
                                }}
                              >
                                {f.status}
                              </span>
                            </p>
                          </div>
                        </motion.li>
                      );
                    })}
                  </ol>
                )}
              </DrawerSection>

              {/* ── Agent notes ────────────────────────── */}
              <DrawerSection title="Agent notes" Icon={Sparkles} delay={0.20}>
                {!agentNotes && !loadingExtras ? (
                  <Empty mini label="No enrichment data yet. Run Scout to generate notes." />
                ) : agentNotes ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {agentNotes.summary && (
                      <p
                        style={{
                          margin: 0,
                          padding: '12px 14px',
                          background: 'var(--color-accent-subtle)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 'var(--radius-input)',
                          fontSize: '0.8125rem',
                          color: 'var(--color-text)',
                          lineHeight: 1.55,
                        }}
                      >
                        {agentNotes.summary}
                      </p>
                    )}
                    {agentNotes.painPoints.length > 0 && (
                      <BulletList title="Pain points" items={agentNotes.painPoints} tone="danger" />
                    )}
                    {agentNotes.triggers.length > 0 && (
                      <BulletList title="Buying triggers" items={agentNotes.triggers} tone="success" />
                    )}
                    {!agentNotes.summary &&
                      agentNotes.painPoints.length === 0 &&
                      agentNotes.triggers.length === 0 && (
                        <pre
                          style={{
                            margin: 0,
                            padding: '12px 14px',
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 'var(--radius-input)',
                            fontSize: '0.75rem',
                            color: 'var(--color-text-muted)',
                            fontFamily: 'var(--font-mono)',
                            overflowX: 'auto',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {JSON.stringify(agentNotes.raw, null, 2)}
                        </pre>
                      )}
                  </div>
                ) : (
                  <SkeletonLines count={3} />
                )}
              </DrawerSection>

              {extrasError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    marginTop: 16,
                    padding: '10px 14px',
                    background: 'var(--color-danger-subtle)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: 'var(--radius-input)',
                    color: 'var(--color-danger)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  Failed to load related data: {extrasError.message}
                </motion.div>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

LeadDrawer.propTypes = {
  lead: PropTypes.object,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────
function ContactRow({ Icon, label, value, href, external }) {
  const Wrapper = href ? 'a' : 'div';
  const wrapperProps = href
    ? {
        href,
        target: external ? '_blank' : undefined,
        rel: external ? 'noopener noreferrer' : undefined,
        style: { textDecoration: 'none' },
      }
    : {};
  return (
    <Wrapper
      {...wrapperProps}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-input)',
        transition: 'background-color 160ms ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-base)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-surface)')}
    >
      <span
        aria-hidden
        style={{
          width: 28,
          height: 28,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius-input)',
          background: 'var(--color-base)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-accent)',
          flexShrink: 0,
        }}
      >
        <Icon size={13} />
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p
          style={{
            margin: 0,
            fontSize: '0.6875rem',
            fontWeight: 700,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {label}
        </p>
        <p
          style={{
            margin: '2px 0 0',
            fontSize: '0.8125rem',
            fontWeight: 500,
            color: href ? 'var(--color-accent)' : 'var(--color-text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</span>
          {external && <ExternalLink size={11} style={{ flexShrink: 0 }} />}
        </p>
      </div>
    </Wrapper>
  );
}

ContactRow.propTypes = {
  Icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  href: PropTypes.string,
  external: PropTypes.bool,
};

function SkeletonLines({ count = 2 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 44,
            borderRadius: 'var(--radius-input)',
            background:
              'linear-gradient(90deg, var(--color-surface) 0%, var(--surface-2) 50%, var(--color-surface) 100%)',
            backgroundSize: '200% 100%',
            animation: 'bp-shimmer 1.4s linear infinite',
          }}
        />
      ))}
    </div>
  );
}
SkeletonLines.propTypes = { count: PropTypes.number };

function Empty({ label, mini }) {
  return (
    <div
      style={{
        padding: mini ? '12px 14px' : '32px 20px',
        background: mini ? 'var(--color-surface)' : 'var(--color-surface)',
        border: '1px dashed var(--color-border)',
        borderRadius: 'var(--radius-input)',
        textAlign: mini ? 'left' : 'center',
        color: 'var(--color-text-muted)',
        fontSize: mini ? '0.75rem' : '0.875rem',
        fontWeight: 500,
      }}
    >
      {label}
    </div>
  );
}
Empty.propTypes = { label: PropTypes.string.isRequired, mini: PropTypes.bool };

function BulletList({ title, items, tone = 'accent' }) {
  const colorMap = {
    accent: 'var(--color-accent)',
    success: 'var(--color-success)',
    danger: 'var(--color-danger)',
  };
  const accent = colorMap[tone] || colorMap.accent;
  return (
    <div>
      <p
        style={{
          margin: '0 0 6px',
          fontSize: '0.6875rem',
          fontWeight: 700,
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {title}
      </p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((it, i) => (
          <li
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              fontSize: '0.8125rem',
              color: 'var(--color-text)',
              lineHeight: 1.45,
            }}
          >
            <span
              aria-hidden
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: accent,
                marginTop: 8,
                flexShrink: 0,
              }}
            />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
BulletList.propTypes = { title: PropTypes.string, items: PropTypes.array, tone: PropTypes.string };

// Re-export hook-friendly factory
export default LeadDrawer;
