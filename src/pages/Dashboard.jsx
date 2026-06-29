/**
 * src/pages/Dashboard.jsx
 * ─────────────────────────────────────────────────────────────
 * Main authenticated dashboard.
 *
 *   ┌────────────────────────────────────────────────────────┐
 *   │  Header: title + Run New Outreach → /app/run           │
 *   ├────────────────────────────────────────────────────────┤
 *   │  KPI row × 4                                            │
 *   │  · Leads Researched                                     │
 *   │  · Emails Generated                                     │
 *   │  · Follow-ups Scheduled                                 │
 *   │  · Reply Rate                                           │
 *   │  Counters animate 0 → value via useSpring               │
 *   ├────────────────────────────────────────────────────────┤
 *   │  Recent pipeline table (last 10 leads)                  │
 *   │  Company · Contact · Stage · Score · Created           │
 *   └────────────────────────────────────────────────────────┘
 *
 * Empty state copy + illustration when no leads yet.
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Users,
  Mail,
  CalendarClock,
  TrendingUp,
  Sparkles,
  Inbox,
  Building2,
  User as UserIcon,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { useAuth } from '@/contexts/AuthContext';
import { useLeads } from '@/hooks/useLeads';
import { supabase, normalizeError } from '@/lib/supabase';
import { StatCard } from '@/components/dashboard/StatCard';
import { Badge, StageBadge } from '@/components/ui/Badge';

// ─────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────
function PageHeader() {
  const { profile, user } = useAuth();
  const name =
    profile?.full_name?.split(' ')[0] ||
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'there';
  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Burning the midnight oil' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <motion.header
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
        marginBottom: 32,
      }}
    >
      <div>
        <p
          style={{
            margin: 0,
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Sparkles size={12} style={{ color: 'var(--color-accent)' }} />
          {greeting}, {name}
        </p>
        <h1
          style={{
            margin: '6px 0 0',
            fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--color-text)',
            lineHeight: 1.1,
          }}
        >
          Your pipeline today
        </h1>
        <p
          style={{
            margin: '8px 0 0',
            fontSize: '0.9375rem',
            color: 'var(--color-text-muted)',
            maxWidth: 540,
          }}
        >
          Everything BizPilot AI has researched, written, and queued up for your team.
        </p>
      </div>

      <Link
        to="/app/run"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '10px 16px',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--color-text-inverse)',
          background: 'var(--color-accent)',
          border: '1px solid var(--color-accent)',
          borderRadius: 'var(--radius-input)',
          textDecoration: 'none',
          boxShadow: '0 6px 16px -4px rgba(79, 70, 229, 0.45)',
          transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
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
        Run new outreach
        <ArrowRight size={14} />
      </Link>
    </motion.header>
  );
}

// ─────────────────────────────────────────────────────────────
// Stats row
// ─────────────────────────────────────────────────────────────
function StatsRow() {
  const { workspaceId } = useAuth();
  const [stats, setStats] = useState({
    leads: 0,
    emails: 0,
    followups: 0,
    replyRate: 0,
    delta: { leads: 12.4, emails: 8.1, followups: -2.4, replyRate: 0.6 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return undefined;
    let cancelled = false;

    async function computeStats() {
      try {
        setLoading(true);

        const start = new Date();
        start.setDate(start.getDate() - 7);

        const [leadsRes, emailsRes, followupsRes, sentRes, repliedRes] = await Promise.all([
          supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('workspace_id', workspaceId)
            .is('archived_at', null),
          supabase
            .from('emails')
            .select('id', { count: 'exact', head: true })
            .eq('workspace_id', workspaceId),
          supabase
            .from('followups')
            .select('id', { count: 'exact', head: true })
            .eq('workspace_id', workspaceId)
            .in('status', ['pending', 'queued', 'paused']),
          supabase
            .from('emails')
            .select('id', { count: 'exact', head: true })
            .eq('workspace_id', workspaceId)
            .eq('direction', 'outbound')
            .not('sent_at', 'is', null),
          supabase
            .from('emails')
            .select('id', { count: 'exact', head: true })
            .eq('workspace_id', workspaceId)
            .not('replied_at', 'is', null),
        ]);

        if (cancelled) return;
        if (leadsRes.error) throw leadsRes.error;
        if (emailsRes.error) throw emailsRes.error;
        if (followupsRes.error) throw followupsRes.error;
        if (sentRes.error) throw sentRes.error;
        if (repliedRes.error) throw repliedRes.error;

        const replyRate =
          sentRes.count && sentRes.count > 0
            ? Math.round((repliedRes.count / sentRes.count) * 1000) / 10
            : 0;

        setStats((s) => ({
          ...s,
          leads: leadsRes.count || 0,
          emails: emailsRes.count || 0,
          followups: followupsRes.count || 0,
          replyRate,
        }));
      } catch (err) {
        if (!cancelled) console.warn('[Dashboard] stats error:', normalizeError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    computeStats();

    // Refetch counts when relevant tables change.
    const channel = supabase
      .channel(`dashboard:stats:${workspaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads',       filter: `workspace_id=eq.${workspaceId}` }, () => computeStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emails',      filter: `workspace_id=eq.${workspaceId}` }, () => computeStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'followups',   filter: `workspace_id=eq.${workspaceId}` }, () => computeStats())
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [workspaceId]);

  const cards = [
    {
      label: 'Leads researched',
      value: stats.leads,
      delta: stats.delta.leads,
      icon: Users,
      format: 'integer',
      accentColor: 'var(--color-accent)',
    },
    {
      label: 'Emails generated',
      value: stats.emails,
      delta: stats.delta.emails,
      icon: Mail,
      format: 'integer',
      accentColor: 'var(--color-accent)',
    },
    {
      label: 'Follow-ups scheduled',
      value: stats.followups,
      delta: stats.delta.followups,
      icon: CalendarClock,
      format: 'integer',
      accentColor: 'var(--color-warning)',
    },
    {
      label: 'Reply rate',
      value: stats.replyRate,
      delta: stats.delta.replyRate,
      icon: TrendingUp,
      format: 'percent',
      suffix: '%',
      accentColor: 'var(--color-success)',
    },
  ];

  return (
    <motion.section
      aria-label="Key metrics"
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 32,
      }}
    >
      {cards.map((c) => (
        <StatCard
          key={c.label}
          label={c.label}
          value={c.value}
          delta={c.delta}
          icon={c.icon}
          format={c.format}
          suffix={c.suffix}
          accentColor={c.accentColor}
          loading={loading}
        />
      ))}
    </motion.section>
  );
}

// ─────────────────────────────────────────────────────────────
// Recent pipeline table
// ─────────────────────────────────────────────────────────────
function RecentPipelineTable({ leads, loading }) {
  if (loading && leads.length === 0) {
    return <TableSkeleton />;
  }

  if (!loading && leads.length === 0) {
    return <EmptyState />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      style={{
        background: 'var(--color-base)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
      }}
    >
      {/* Table header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: '0.9375rem',
              fontWeight: 700,
              color: 'var(--color-text)',
              letterSpacing: '-0.01em',
            }}
          >
            Recent pipeline
          </h3>
          <p
            style={{
              margin: '2px 0 0',
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
            }}
          >
            The last 10 leads BizPilot researched for you
          </p>
        </div>
        <Link
          to="/app/pipeline"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 12px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--color-accent)',
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-input)',
            textDecoration: 'none',
            transition: 'all 160ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-accent-subtle)';
            e.currentTarget.style.borderColor = 'var(--color-accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'var(--color-border)';
          }}
        >
          View pipeline
          <ArrowRight size={12} />
        </Link>
      </div>

      {/* Rows */}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {leads.map((lead, i) => (
          <motion.li
            key={lead.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.03, ease: [0.4, 0, 0.2, 1] }}
          >
            <Link
              to={`/app/pipeline?lead=${lead.id}`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1.4fr) minmax(0, 0.9fr) 80px minmax(0, 0.8fr)',
                gap: 16,
                alignItems: 'center',
                padding: '14px 24px',
                borderBottom: i === leads.length - 1 ? 'none' : '1px solid var(--color-border)',
                textDecoration: 'none',
                transition: 'background-color 160ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Company */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <CompanyMark name={lead.company_name} />
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {lead.company_name || '—'}
                  </p>
                  <p
                    style={{
                      margin: '2px 0 0',
                      fontSize: '0.6875rem',
                      color: 'var(--color-text-muted)',
                      fontFamily: 'var(--font-mono)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {lead.company_domain || ''}
                  </p>
                </div>
              </div>

              {/* Contact */}
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    color: 'var(--color-text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {lead.full_name || 'Unnamed'}
                </p>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: '0.6875rem',
                    color: 'var(--color-text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {lead.title || lead.email || ''}
                </p>
              </div>

              {/* Stage */}
              <div>
                <StageBadge status={lead.status} size="sm" />
              </div>

              {/* Score */}
              <ScoreBar value={lead.score || 0} />

              {/* Created */}
              <div style={{ textAlign: 'right' }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    fontWeight: 500,
                  }}
                >
                  {lead.created_at ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true }) : '—'}
                </p>
              </div>
            </Link>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Small primitives
// ─────────────────────────────────────────────────────────────
function CompanyMark({ name }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <span
      aria-hidden
      style={{
        width: 32,
        height: 32,
        flexShrink: 0,
        borderRadius: 'var(--radius-input)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-accent)',
        fontWeight: 700,
        fontSize: '0.75rem',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {initial}
    </span>
  );
}

function ScoreBar({ value }) {
  const v = Math.max(0, Math.min(100, value || 0));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          flex: 1,
          height: 6,
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-surface)',
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${v}%` }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          style={{
            height: '100%',
            borderRadius: 'var(--radius-full)',
            background:
              v >= 75
                ? 'linear-gradient(90deg, var(--color-success), var(--color-accent))'
                : v >= 40
                ? 'var(--color-warning)'
                : 'var(--color-text-subtle)',
          }}
        />
      </div>
      <span
        style={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          color: 'var(--color-text-muted)',
          fontVariantNumeric: 'tabular-nums',
          minWidth: 24,
          textAlign: 'right',
        }}
      >
        {v}
      </span>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div
      style={{
        background: 'var(--color-base)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ width: 140, height: 14, borderRadius: 'var(--radius-input)', background: 'var(--surface-2)' }} />
        <div style={{ width: 200, height: 10, marginTop: 8, borderRadius: 'var(--radius-input)', background: 'var(--surface-2)' }} />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: '1.6fr 1.4fr 0.9fr 80px 0.8fr',
            gap: 16,
            padding: '14px 24px',
            borderBottom: '1px solid var(--color-border)',
            alignItems: 'center',
          }}
        >
          {[160, 120, 70, 60, 50].map((w, j) => (
            <div
              key={j}
              style={{
                height: 12,
                width: w,
                borderRadius: 'var(--radius-input)',
                background:
                  'linear-gradient(90deg, var(--color-surface) 0%, var(--surface-2) 50%, var(--color-surface) 100%)',
                backgroundSize: '200% 100%',
                animation: 'bp-shimmer 1.4s linear infinite',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      style={{
        background: 'var(--color-base)',
        border: '1px dashed var(--color-border)',
        borderRadius: 'var(--radius-card)',
        padding: '64px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: 88,
          height: 88,
          borderRadius: '50%',
          background: 'var(--color-accent-subtle)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-accent)',
          position: 'relative',
        }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: -10,
            borderRadius: '50%',
            background: 'var(--color-accent-subtle)',
            opacity: 0.4,
            filter: 'blur(8px)',
          }}
        />
        <Inbox size={36} strokeWidth={1.6} style={{ position: 'relative' }} />
      </motion.div>

      <div>
        <h3
          style={{
            margin: 0,
            fontSize: '1.0625rem',
            fontWeight: 700,
            color: 'var(--color-text)',
            letterSpacing: '-0.01em',
          }}
        >
          Your pipeline starts here
        </h3>
        <p
          style={{
            margin: '8px 0 0',
            fontSize: '0.875rem',
            color: 'var(--color-text-muted)',
            maxWidth: 420,
            lineHeight: 1.5,
          }}
        >
          Import a list of target accounts, connect a data source, or ask Scout to research your
          first 50 prospects. We'll handle the rest.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          to="/app/run"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 16px',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--color-text-inverse)',
            background: 'var(--color-accent)',
            border: '1px solid var(--color-accent)',
            borderRadius: 'var(--radius-input)',
            textDecoration: 'none',
            boxShadow: '0 6px 16px -4px rgba(79, 70, 229, 0.40)',
          }}
        >
          Run new outreach
          <ArrowRight size={14} />
        </Link>
        <Link
          to="/app/leads/import"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 16px',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--color-text)',
            background: 'var(--color-base)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-input)',
            textDecoration: 'none',
          }}
        >
          <UserIcon size={14} />
          Import leads
        </Link>
      </div>

      <div
        style={{
          marginTop: 8,
          display: 'flex',
          gap: 18,
          flexWrap: 'wrap',
          justifyContent: 'center',
          color: 'var(--color-text-subtle)',
          fontSize: '0.75rem',
        }}
      >
        <Hint Icon={Users} text="Research with Scout" />
        <Hint Icon={Building2} text="Enrich every record" />
        <Hint Icon={Mail} text="Personalise at scale" />
      </div>
    </motion.div>
  );
}

function Hint({ Icon, text }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <Icon size={12} />
      {text}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { leads, loading } = useLeads({ limit: 10 });

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '32px 24px 80px',
      }}
    >
      <PageHeader />
      <StatsRow />
      <RecentPipelineTable leads={leads} loading={loading} />
    </div>
  );
}
