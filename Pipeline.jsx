/**
 * src/pages/Pipeline.jsx
 * ─────────────────────────────────────────────────────────────
 * Full CRM table for the leads pipeline.
 *
 * Columns:
 *   Company · Contact Name · Contact Email · Stage · Score ·
 *   Last Action · Next Follow-up · Created
 *
 * Toolbar:
 *   - Stage dropdown filter
 *   - Text search (matches company_name OR full_name OR email)
 *   - Row count summary
 *
 * Sorting:
 *   - Default: score DESC
 *
 * Pagination:
 *   - 20 rows per page, prev/next, jump-to-page
 *
 * Interactions:
 *   - Click any row → LeadDrawer opens
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  X,
  Inbox,
  Building2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { useLeads } from '@/hooks/useLeads';
import { StageBadge } from '@/components/ui/Badge';
import { LeadDrawer } from '@/components/leads/LeadDrawer';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const PAGE_SIZE = 20;

const STAGE_OPTIONS = [
  { value: '',                label: 'All stages' },
  { value: 'new',             label: 'New' },
  { value: 'contacted',       label: 'Contacted' },
  { value: 'engaged',         label: 'Engaged' },
  { value: 'replied',         label: 'Replied' },
  { value: 'interested',      label: 'Interested' },
  { value: 'meeting_booked',  label: 'Meeting booked' },
  { value: 'qualified',       label: 'Qualified' },
  { value: 'unqualified',     label: 'Unqualified' },
  { value: 'bounced',         label: 'Bounced' },
  { value: 'unsubscribed',    label: 'Unsubscribed' },
];

// ─────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────
function PageHeader({ total }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
        marginBottom: 24,
      }}
    >
      <div>
        <p
          style={{
            margin: 0,
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--color-text-muted)',
          }}
        >
          Pipeline
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
          All leads
        </h1>
        <p
          style={{
            margin: '8px 0 0',
            fontSize: '0.875rem',
            color: 'var(--color-text-muted)',
          }}
        >
          {total.toLocaleString()} {total === 1 ? 'lead' : 'leads'} in your workspace
        </p>
      </div>
    </motion.header>
  );
}

// ─────────────────────────────────────────────────────────────
// Toolbar
// ─────────────────────────────────────────────────────────────
function Toolbar({ stage, search, onStage, onSearch, onClear, total, shown }) {
  const hasFilters = Boolean(stage) || Boolean(search);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        padding: 12,
        background: 'var(--color-base)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        marginBottom: 16,
        flexWrap: 'wrap',
      }}
    >
      {/* Stage dropdown */}
      <label
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-input)',
          minWidth: 180,
          cursor: 'pointer',
        }}
      >
        <Filter size={14} style={{ color: 'var(--color-text-muted)' }} />
        <select
          value={stage || ''}
          onChange={(e) => onStage(e.target.value || null)}
          style={{
            appearance: 'none',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--color-text)',
            paddingRight: 16,
            flex: 1,
            cursor: 'pointer',
          }}
        >
          {STAGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={14} style={{ color: 'var(--color-text-muted)', position: 'absolute', right: 10, pointerEvents: 'none' }} />
      </label>

      {/* Search */}
      <div
        style={{
          flex: 1,
          minWidth: 220,
          position: 'relative',
        }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%',
            left: 12,
            transform: 'translateY(-50%)',
            color: 'var(--color-text-muted)',
            pointerEvents: 'none',
          }}
        >
          <Search size={14} />
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by company, contact, or email…"
          style={{
            width: '100%',
            padding: '8px 36px 8px 34px',
            fontSize: '0.8125rem',
            fontFamily: 'var(--font-sans)',
            color: 'var(--color-text)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-input)',
            outline: 'none',
            transition: 'all 160ms ease',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--color-accent)';
            e.target.style.background = 'var(--color-base)';
            e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.18)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--color-border)';
            e.target.style.background = 'var(--color-surface)';
            e.target.style.boxShadow = 'none';
          }}
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearch('')}
            aria-label="Clear search"
            style={{
              position: 'absolute',
              top: '50%',
              right: 8,
              transform: 'translateY(-50%)',
              width: 22,
              height: 22,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              borderRadius: 'var(--radius-input)',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Result count */}
      <span
        style={{
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
          fontWeight: 500,
        }}
      >
        Showing <strong style={{ color: 'var(--color-text)' }}>{shown}</strong> of {total}
      </span>

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 12px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--color-accent)',
            background: 'var(--color-accent-subtle)',
            border: '1px solid transparent',
            borderRadius: 'var(--radius-input)',
            cursor: 'pointer',
          }}
        >
          <X size={11} />
          Clear
        </button>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Table
// ─────────────────────────────────────────────────────────────
function PipelineTable({ rows, onOpenLead, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      style={{
        background: 'var(--color-base)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
      }}
    >
      {/* Column header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1.3fr) minmax(0, 1.4fr) 120px 90px minmax(0, 1fr) minmax(0, 1fr) 110px',
          gap: 12,
          padding: '12px 24px',
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          fontSize: '0.6875rem',
          fontWeight: 700,
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        <div>Company</div>
        <div>Contact name</div>
        <div>Contact email</div>
        <div>Stage</div>
        <div style={{ textAlign: 'right' }}>Score</div>
        <div>Last action</div>
        <div>Next follow-up</div>
        <div style={{ textAlign: 'right' }}>Created</div>
      </div>

      {/* Body */}
      {loading ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState />
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          <AnimatePresence initial={false}>
            {rows.map((lead, i) => (
              <motion.li
                key={lead.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.02 } }}
                exit={{ opacity: 0 }}
                style={{ borderBottom: '1px solid var(--color-border)' }}
              >
                <button
                  type="button"
                  onClick={() => onOpenLead(lead)}
                  style={{
                    display: 'grid',
                    width: '100%',
                    gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1.3fr) minmax(0, 1.4fr) 120px 90px minmax(0, 1fr) minmax(0, 1fr) 110px',
                    gap: 12,
                    padding: '14px 24px',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background-color 160ms ease',
                    fontFamily: 'inherit',
                    color: 'inherit',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Cell>
                    <CompanyMark name={lead.company_name} />
                    <CellText primary={lead.company_name || '—'} secondary={lead.company_domain} monoSecondary />
                  </Cell>
                  <Cell>
                    <CellText primary={lead.full_name || 'Unnamed'} secondary={lead.title} />
                  </Cell>
                  <Cell>
                    <CellText primary={lead.email || '—'} mono />
                  </Cell>
                  <Cell>
                    <StageBadge status={lead.status} size="sm" />
                  </Cell>
                  <Cell align="right">
                    <ScorePill value={lead.score || 0} />
                  </Cell>
                  <Cell>
                    <CellText
                      primary={
                        lead.last_contacted_at
                          ? formatDistanceToNow(new Date(lead.last_contacted_at), { addSuffix: true })
                          : 'No contact yet'
                      }
                      secondary={lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleDateString() : null}
                      muted={!lead.last_contacted_at}
                    />
                  </Cell>
                  <Cell>
                    <CellText primary={lead._nextFollowupLabel || '—'} muted={!lead._nextFollowupLabel} />
                  </Cell>
                  <Cell align="right">
                    <CellText
                      primary={
                        lead.created_at
                          ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })
                          : '—'
                      }
                      secondary={lead.created_at ? new Date(lead.created_at).toLocaleDateString() : null}
                      align="right"
                    />
                  </Cell>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Cell primitives
// ─────────────────────────────────────────────────────────────
function Cell({ children, align = 'left' }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        textAlign: align,
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        minWidth: 0,
      }}
    >
      {children}
    </div>
  );
}

function CellText({ primary, secondary, mono, monoSecondary, muted, align = 'left' }) {
  return (
    <div style={{ minWidth: 0, textAlign: align }}>
      <p
        style={{
          margin: 0,
          fontSize: '0.8125rem',
          fontWeight: 500,
          color: muted ? 'var(--color-text-subtle)' : 'var(--color-text)',
          fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={primary || ''}
      >
        {primary || '—'}
      </p>
      {secondary && (
        <p
          style={{
            margin: '2px 0 0',
            fontSize: '0.6875rem',
            color: 'var(--color-text-muted)',
            fontFamily: monoSecondary ? 'var(--font-mono)' : 'var(--font-sans)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={secondary}
        >
          {secondary}
        </p>
      )}
    </div>
  );
}

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

function ScorePill({ value }) {
  const v = Math.max(0, Math.min(100, value));
  const tone =
    v >= 75
      ? { bg: 'var(--color-success-subtle)', color: 'var(--color-success)' }
      : v >= 40
      ? { bg: 'var(--color-warning-subtle)', color: 'var(--color-warning)' }
      : { bg: 'var(--color-surface)', color: 'var(--color-text-muted)' };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 10px',
        borderRadius: 'var(--radius-badge)',
        background: tone.bg,
        color: tone.color,
        fontSize: '0.75rem',
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        minWidth: 50,
        justifyContent: 'center',
      }}
    >
      {v}
      <span style={{ opacity: 0.5, fontWeight: 600 }}>/100</span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────
function Pagination({ page, pages, total, onChange }) {
  if (pages <= 1) return null;

  const windowed = useMemo(() => {
    const out = [];
    const max = 5;
    let start = Math.max(1, page - Math.floor(max / 2));
    let end = Math.min(pages, start + max - 1);
    start = Math.max(1, end - max + 1);
    for (let i = start; i <= end; i++) out.push(i);
    return out;
  }, [page, pages]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.15 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        padding: '12px 16px',
        marginTop: 12,
        background: 'var(--color-base)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
      }}
    >
      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
        Page {page} of {pages} · {total} leads
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <PageBtn disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
          <ChevronLeft size={14} />
        </PageBtn>
        {windowed.map((n) => (
          <PageBtn
            key={n}
            active={n === page}
            onClick={() => onChange(n)}
            aria-label={`Go to page ${n}`}
          >
            {n}
          </PageBtn>
        ))}
        <PageBtn disabled={page === pages} onClick={() => onChange(page + 1)} aria-label="Next page">
          <ChevronRight size={14} />
        </PageBtn>
      </div>
    </motion.div>
  );
}

function PageBtn({ children, active, disabled, onClick, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: 32,
        height: 32,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 8px',
        background: active ? 'var(--color-accent)' : 'transparent',
        color: active ? 'var(--color-text-inverse)' : disabled ? 'var(--color-text-subtle)' : 'var(--color-text)',
        border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-input)',
        fontSize: '0.75rem',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 160ms ease',
      }}
      onMouseEnter={(e) => {
        if (!active && !disabled) {
          e.currentTarget.style.background = 'var(--color-surface)';
          e.currentTarget.style.borderColor = 'var(--color-border-strong)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active && !disabled) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'var(--color-border)';
        }
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Empty + skeleton states
// ─────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        padding: '64px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-surface)',
          border: '1px dashed var(--color-border)',
          color: 'var(--color-text-muted)',
        }}
      >
        <Inbox size={28} strokeWidth={1.6} />
      </span>
      <div>
        <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text)' }}>
          No leads match your filters
        </p>
        <p
          style={{
            margin: '6px 0 0',
            fontSize: '0.8125rem',
            color: 'var(--color-text-muted)',
            maxWidth: 360,
          }}
        >
          Try clearing the search or switching the stage filter, or import more leads to fill the pipeline.
        </p>
      </div>
    </motion.div>
  );
}

function TableSkeleton() {
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1.3fr) minmax(0, 1.4fr) 120px 90px minmax(0, 1fr) minmax(0, 1fr) 110px',
            gap: 12,
            padding: '14px 24px',
            borderBottom: '1px solid var(--color-border)',
            alignItems: 'center',
          }}
        >
          {[140, 110, 160, 70, 50, 100, 100, 70].map((w, j) => (
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
        </li>
      ))}
    </ul>
  );
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function Pipeline() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [stage, setStage] = useState(searchParams.get('stage') || null);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [page, setPage] = useState(1);
  const [openLead, setOpenLead] = useState(null);

  // Debounce search input (300ms).
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Sync filters to URL.
  useEffect(() => {
    const next = new URLSearchParams();
    if (stage) next.set('stage', stage);
    if (debouncedSearch) next.set('q', debouncedSearch);
    if (page > 1) next.set('page', String(page));
    setSearchParams(next, { replace: true });
  }, [stage, debouncedSearch, page, setSearchParams]);

  // Reset page when filters change.
  useEffect(() => {
    setPage(1);
  }, [stage, debouncedSearch]);

  const { leads, loading } = useLeads({
    stage,
    search: debouncedSearch,
    sortBy: 'score',
    sortDir: 'desc',
  });

  // Fetch next-followup labels (one query, processed client-side).
  const { workspaceId } = useAuth();
  const [nextFollowups, setNextFollowups] = useState({});

  useEffect(() => {
    if (!workspaceId || leads.length === 0) {
      setNextFollowups({});
      return undefined;
    }
    let cancelled = false;

    (async () => {
      try {
        const ids = leads.map((l) => l.id);
        const { data, error: qErr } = await supabase
          .from('followups')
          .select('lead_id, scheduled_for, status, step_number, step_type')
          .eq('workspace_id', workspaceId)
          .in('lead_id', ids)
          .in('status', ['pending', 'queued', 'paused', 'in_progress'])
          .order('scheduled_for', { ascending: true })
          .limit(500);
        if (qErr) throw qErr;
        if (cancelled) return;
        const map = {};
        for (const f of data || []) {
          if (map[f.lead_id]) continue; // first one wins (earliest)
          map[f.lead_id] = f;
        }
        setNextFollowups(map);
      } catch (err) {
        if (!cancelled) console.warn('[Pipeline] followups error', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, leads]);

  // Decorate rows with next-followup labels.
  const decoratedRows = useMemo(
    () =>
      leads.map((l) => {
        const f = nextFollowups[l.id];
        let label = null;
        if (f) {
          const when = f.scheduled_for ? new Date(f.scheduled_for) : null;
          label = when
            ? formatDistanceToNow(when, { addSuffix: true })
            : `Step ${f.step_number}`;
        }
        return { ...l, _nextFollowupLabel: label };
      }),
    [leads, nextFollowups],
  );

  // Pagination on the (already server-sorted) array.
  const pages = Math.max(1, Math.ceil(decoratedRows.length / PAGE_SIZE));
  const pageRows = decoratedRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Auto-open lead from query param (e.g. /app/pipeline?lead=<uuid>).
  useEffect(() => {
    const id = searchParams.get('lead');
    if (!id) return;
    const found = leads.find((l) => l.id === id);
    if (found) setOpenLead(found);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get('lead'), leads]);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px 80px' }}>
      <PageHeader total={decoratedRows.length} />

      <Toolbar
        stage={stage}
        search={search}
        onStage={setStage}
        onSearch={setSearch}
        onClear={() => {
          setStage(null);
          setSearch('');
        }}
        total={decoratedRows.length}
        shown={pageRows.length}
      />

      <PipelineTable rows={pageRows} onOpenLead={setOpenLead} loading={loading} />

      <Pagination page={page} pages={pages} total={decoratedRows.length} onChange={setPage} />

      <LeadDrawer lead={openLead} open={Boolean(openLead)} onClose={() => setOpenLead(null)} />
    </div>
  );
}
