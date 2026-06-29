import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  Copy,
  Inbox,
  Loader2,
  Mail,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "../contexts/AuthContext";
import { useRunPipeline } from "../hooks/useRunPipeline";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

const AGENT_META = {
  Scout: { label: "Scout", color: "text-indigo-600", dot: "bg-indigo-500" },
  Craft: { label: "Craft", color: "text-cyan-600", dot: "bg-cyan-500" },
  Pulse: { label: "Pulse", color: "text-emerald-600", dot: "bg-emerald-500" },
};

const EMAIL_TABS = [
  { id: "Direct", label: "Direct" },
  { id: "Story", label: "Story" },
  { id: "Value-First", label: "Value-First" },
];

const STATUS_PILL = {
  idle: { label: "Ready", variant: "default" },
  submitting: { label: "Submitting", variant: "info" },
  running: { label: "Running", variant: "info" },
  streaming: { label: "Streaming", variant: "info" },
  complete: { label: "Complete", variant: "success" },
  error: { label: "Error", variant: "danger" },
};

export default function Run() {
  const { user } = useAuth();
  const { run, status, logs, result, error, reset } = useRunPipeline();

  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [activeTab, setActiveTab] = useState("Direct");
  const [copiedKey, setCopiedKey] = useState(null);

  const isLocked =
    status === "submitting" ||
    status === "running" ||
    status === "streaming";

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!company.trim() || !industry.trim()) {
        toast.error("Please enter both company and industry");
        return;
      }
      if (!user?.id) {
        toast.error("You must be signed in to run a pipeline");
        return;
      }
      try {
        await run({ company: company.trim(), industry: industry.trim(), userId: user.id });
        toast.success("Pipeline complete");
      } catch (err) {
        toast.error(err?.message || "Pipeline failed");
      }
    },
    [company, industry, user, run]
  );

  const handleCopy = useCallback((text, key) => {
    if (!navigator?.clipboard?.writeText) {
      toast.error("Clipboard not available in this browser");
      return;
    }
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedKey(key);
        toast.success("Copied to clipboard");
        setTimeout(() => {
          setCopiedKey((current) => (current === key ? null : current));
        }, 1500);
      },
      () => toast.error("Copy failed")
    );
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-text">Run Pipeline</h1>
        <p className="text-text-muted text-sm mt-1">
          Launch an autonomous outreach cycle. Our agents research, write, and schedule follow-ups in one go.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: form */}
        <section className="bg-white border border-border rounded-xl p-6 h-fit">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-accent" />
            <h2 className="text-base font-semibold text-text">New Run</h2>
          </div>
          <p className="text-sm text-text-muted mb-5">
            Target a single company. We&apos;ll surface the right contact, draft three email angles, and queue ten follow-ups.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Company Name"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Inc."
              disabled={isLocked}
              autoComplete="off"
              icon={Building2}
            />
            <Input
              label="Industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="B2B SaaS"
              disabled={isLocked}
              autoComplete="off"
            />
            <Button
              type="submit"
              disabled={isLocked}
              className="w-full"
              icon={isLocked ? Loader2 : Sparkles}
            >
              {isLocked ? "Running..." : "Run Pipeline"}
            </Button>
          </form>

          <div className="mt-5 pt-5 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-text-muted">Status</span>
              <StatusPill status={status} />
            </div>
          </div>
        </section>

        {/* RIGHT: states */}
        <section className="bg-white border border-border rounded-xl p-6 min-h-[520px]">
          <AnimatePresence mode="wait">
            {status === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <IdleState />
              </motion.div>
            )}

            {(status === "submitting" || status === "running" || status === "streaming") && (
              <motion.div
                key="running"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {(status === "submitting" || status === "running") && logs.length === 0 && (
                  <OrbitalLoading />
                )}
                {logs.length > 0 && <AgentLogPanel logs={logs} status={status} />}
              </motion.div>
            )}

            {status === "complete" && result && (
              <motion.div
                key="complete"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ResultsSection
                  result={result}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  handleCopy={handleCopy}
                  copiedKey={copiedKey}
                />
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ErrorState error={error} onReset={reset} />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const meta = STATUS_PILL[status] || STATUS_PILL.idle;
  return (
    <Badge variant={meta.variant} size="sm" dot>
      {meta.label}
    </Badge>
  );
}

function IdleState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-accent" />
      </div>
      <h3 className="text-base font-semibold text-text">Ready to launch</h3>
      <p className="text-sm text-text-muted mt-1 max-w-xs">
        Fill in the form on the left to start your first autonomous outreach run.
      </p>
    </div>
  );
}

function ErrorState({ error, onReset }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-16">
      <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-base font-semibold text-text">Pipeline failed</h3>
      <p className="text-sm text-text-muted mt-1 max-w-xs break-words">
        {error || "Unknown error"}
      </p>
      {onReset && (
        <Button size="sm" variant="outline" className="mt-4" onClick={onReset}>
          Try again
        </Button>
      )}
    </div>
  );
}

function OrbitalLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="relative w-44 h-44">
        {/* Center core */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-accent shadow-[0_0_24px_rgba(79,70,229,0.55)]" />

        {/* Orbit 1 — indigo */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.7)]" />
        </motion.div>

        {/* Orbit 2 — cyan, opposite direction */}
        <motion.div
          className="absolute inset-4"
          animate={{ rotate: -360 }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.7)]" />
        </motion.div>

        {/* Orbit 3 — emerald, slowest */}
        <motion.div
          className="absolute inset-8"
          animate={{ rotate: 360 }}
          transition={{ duration: 4.0, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]" />
        </motion.div>
      </div>
      <p className="text-sm text-text-muted mt-8">Spinning up agents&hellip;</p>
    </div>
  );
}

function useAutoScroll(deps) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.scrollTop = ref.current.scrollHeight;
  }, deps);
  return ref;
}

function AgentLogPanel({ logs, status }) {
  const containerRef = useAutoScroll([logs.length]);
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-white">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Live activity
        </span>
        <div className="flex items-center gap-1.5">
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-emerald-500"
            animate={{ opacity: [1, 0.35, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="text-xs text-text-muted">
            {status === "streaming" ? "streaming" : "connecting"}
          </span>
        </div>
      </div>
      <div
        ref={containerRef}
        className="p-4 space-y-2 max-h-[400px] overflow-y-auto font-mono text-sm"
      >
        <AnimatePresence initial={false}>
          {logs.map((log) => {
            const meta = AGENT_META[log.agent] || AGENT_META.Scout;
            return (
              <motion.div
                key={log.id}
                initial={{ x: -8, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.08, ease: "easeOut" }}
                className="flex items-start gap-2 leading-relaxed"
              >
                <span className={`shrink-0 text-xs font-bold ${meta.color}`}>
                  {meta.label}
                </span>
                <span className="text-text-muted shrink-0">→</span>
                <span className="text-text flex-1 break-words">
                  {log.message}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {logs.length === 0 && (
          <div className="text-text-muted text-xs italic">Awaiting first event&hellip;</div>
        )}
      </div>
    </div>
  );
}

function ResultsSection({ result, activeTab, setActiveTab, handleCopy, copiedKey }) {
  const cardVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: (i) => ({
      y: 0,
      opacity: 1,
      transition: { delay: i * 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] },
    }),
  };

  return (
    <div className="space-y-4">
      {/* Card 1: Lead Profile */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="bg-white border border-border rounded-xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-text">Lead Profile</h3>
          </div>
          <Badge variant="success" size="sm" dot>
            Saved
          </Badge>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Company" value={result.company} />
          <Field label="Industry" value={result.industry} />
          <Field label="Contact" value={result.contact} />
          <Field label="Email" value={result.email} mono />
          <div className="col-span-2">
            <Field label="Pain point" value={result.pain_point} multiline />
          </div>
          {result.evidence && (
            <div className="col-span-2">
              <Field label="Evidence" value={result.evidence} multiline muted />
            </div>
          )}
        </dl>
      </motion.div>

      {/* Card 2: Email Variants */}
      <motion.div
        custom={1}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="bg-white border border-border rounded-xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-text">Email Variants</h3>
        </div>
        <div className="flex gap-1 mb-4 border-b border-border">
          {EMAIL_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-accent"
                  : "text-text-muted hover:text-text"
              }`}
              type="button"
            >
              {activeTab === tab.id && (
                <motion.span
                  layoutId="email-tab-underline"
                  className="absolute inset-x-0 -bottom-px h-0.5 bg-accent"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              {tab.label}
            </button>
          ))}
        </div>
        {(result.emails || [])
          .filter((e) => e.variant === activeTab)
          .map((email) => {
            const copyKey = `email-${email.variant}`;
            const wasCopied = copiedKey === copyKey;
            const payload = `Subject: ${email.subject || ""}\n\n${email.body || ""}`;
            return (
              <div key={email.id || email.variant} className="space-y-3">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">
                    Subject
                  </div>
                  <div className="text-sm font-medium text-text">
                    {email.subject || "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">
                    Body
                  </div>
                  <pre className="text-sm text-text whitespace-pre-wrap font-sans leading-relaxed">
                    {email.body || "—"}
                  </pre>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  icon={wasCopied ? Check : Copy}
                  onClick={() => handleCopy(payload, copyKey)}
                >
                  {wasCopied ? "Copied" : "Copy email"}
                </Button>
              </div>
            );
          })}
      </motion.div>

      {/* Card 3: Follow-up Timeline */}
      <motion.div
        custom={2}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="bg-white border border-border rounded-xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-accent" />
          <h3 className="text-sm font-semibold text-text">Follow-up Timeline</h3>
        </div>
        <ol className="relative ml-2 space-y-4">
          <span className="absolute left-[5px] top-2 bottom-2 w-px bg-border" />
          {(result.followups || []).map((fu) => (
            <li key={fu.id || fu.day} className="relative pl-6">
              <span className="absolute left-0 top-1 w-3 h-3 rounded-full bg-accent ring-4 ring-white" />
              <div className="mb-0.5">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-text-muted">
                  Day {fu.day}
                </span>
              </div>
              <div className="text-sm font-medium text-text">
                {fu.title || `Follow-up ${fu.day}`}
              </div>
              {fu.body && (
                <div className="text-sm text-text-muted mt-0.5 leading-relaxed">
                  {fu.body}
                </div>
              )}
            </li>
          ))}
        </ol>
      </motion.div>
    </div>
  );
}

function Field({ label, value, mono = false, multiline = false, muted = false }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-text-muted mb-1">
        {label}
      </dt>
      <dd
        className={`text-sm ${
          mono ? "font-mono" : ""
        } ${muted ? "text-text-muted" : "text-text"} ${
          multiline ? "leading-relaxed" : ""
        }`}
      >
        {value || "—"}
      </dd>
    </div>
  );
}
