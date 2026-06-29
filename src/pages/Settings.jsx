import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Crown,
  CreditCard,
  KeyRound,
  Loader2,
  Mail,
  Save,
  ShieldCheck,
  Sparkles,
  User,
  Zap,
} from "lucide-react";

import AppShell from "../components/layout/AppShell";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const testKeysUrl = `${API_BASE}/api/test-keys`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const maskKey = (key) => {
  if (!key) return "";
  if (key.length <= 6) return "••••••••";
  const head = key.slice(0, 3);
  const tail = key.slice(-4);
  return `${head}••••••••${tail}`;
};

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

const containerVariants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

// ---------------------------------------------------------------------------
// Reusable bits
// ---------------------------------------------------------------------------
function SectionCard({ icon: Icon, title, description, badge, children }) {
  return (
    <motion.section
      variants={sectionVariants}
      className="
        rounded-xl border border-[var(--color-border)]
        bg-white p-6 sm:p-7
      "
    >
      <header className="mb-6 flex items-start gap-4">
        <div
          className="
            flex h-10 w-10 shrink-0 items-center justify-center
            rounded-lg border border-[var(--color-border)]
            bg-[var(--color-surface)]
          "
        >
          <Icon className="h-5 w-5 text-[var(--color-accent)]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight text-[var(--color-text)]">
              {title}
            </h2>
            {badge}
          </div>
          {description && (
            <p className="mt-0.5 text-sm text-[var(--color-text)]/60">{description}</p>
          )}
        </div>
      </header>
      {children}
    </motion.section>
  );
}

function SaveButton({ loading, disabled, onClick, label = "Save" }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled || loading}
      className="
        inline-flex items-center justify-center gap-1.5
        rounded-lg border border-[var(--color-border)]
        bg-[var(--color-surface)] px-3.5 py-2
        text-sm font-medium text-[var(--color-text)]
        transition-colors
        hover:bg-[var(--color-border)]/40
        disabled:cursor-not-allowed disabled:opacity-60
      "
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Save className="h-3.5 w-3.5" />
      )}
      {label}
    </motion.button>
  );
}

function TestButton({ loading, disabled, onClick, success }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled || loading}
      className="
        inline-flex items-center justify-center gap-1.5
        rounded-lg border border-[var(--color-border)]
        bg-white px-3.5 py-2
        text-sm font-medium text-[var(--color-text)]
        transition-colors
        hover:bg-[var(--color-surface)]
        disabled:cursor-not-allowed disabled:opacity-60
      "
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : success ? (
        <Check className="h-3.5 w-3.5 text-[var(--color-success)]" />
      ) : (
        <Zap className="h-3.5 w-3.5" />
      )}
      {success ? "Tested" : "Test"}
    </motion.button>
  );
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 shrink-0 items-center rounded-full
        transition-colors duration-200
        ${checked ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"}
        ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
      `}
    >
      <motion.span
        layout
        animate={{ x: checked ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 700, damping: 30 }}
        className="inline-block h-5 w-5 rounded-full bg-white shadow-md"
      />
    </button>
  );
}

function FieldLabel({ children, hint }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <label className="text-sm font-medium text-[var(--color-text)]">{children}</label>
      {hint && <span className="text-xs text-[var(--color-text)]/50">{hint}</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function Settings() {
  const { user } = useAuth();

  // ----------------------------- Profile ----------------------------------
  const [displayName, setDisplayName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  // ----------------------------- API Keys ---------------------------------
  const [groqInput, setGroqInput]   = useState("");
  const [serperInput, setSerperInput] = useState("");
  const [groqSaved, setGroqSaved]   = useState(false);
  const [serperSaved, setSerperSaved] = useState(false);
  const [groqSaving, setGroqSaving] = useState(false);
  const [serperSaving, setSerperSaving] = useState(false);
  const [groqTesting, setGroqTesting] = useState(false);
  const [serperTesting, setSerperTesting] = useState(false);
  const [groqTested, setGroqTested] = useState(false);
  const [serperTested, setSerperTested] = useState(false);

  // ----------------------------- Notifications ----------------------------
  const [notifPipeline, setNotifPipeline] = useState(true);
  const [notifDaily,    setNotifDaily]    = useState(false);
  const [notifReply,    setNotifReply]    = useState(true);
  const [notifSaving,   setNotifSaving]   = useState(false);

  // ----------------------------- Load on mount ----------------------------
  useEffect(() => {
    if (!user) return;
    setDisplayName(user.user_metadata?.full_name || user.user_metadata?.name || "");

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("user_settings")
        .select("groq_api_key_enc, serper_api_key_enc, notify_pipeline_complete, notify_daily_summary, notify_new_reply")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no row — we auto-created one via the trigger, but
        // maybeSingle() tolerates either case silently.
        toast.error("Could not load settings", { description: error.message });
        return;
      }
      if (data) {
        setGroqSaved(Boolean(data.groq_api_key_enc));
        setSerperSaved(Boolean(data.serper_api_key_enc));
        if (typeof data.notify_pipeline_complete === "boolean")
          setNotifPipeline(data.notify_pipeline_complete);
        if (typeof data.notify_daily_summary   === "boolean")
          setNotifDaily(data.notify_daily_summary);
        if (typeof data.notify_new_reply       === "boolean")
          setNotifReply(data.notify_new_reply);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  // =========================================================================
  // Handlers — Profile
  // =========================================================================
  const saveProfile = async () => {
    if (!user) return;
    const trimmed = displayName.trim();
    if (!trimmed) {
      toast.error("Display name cannot be empty");
      return;
    }
    setProfileSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: trimmed, name: trimmed },
    });
    setProfileSaving(false);

    if (error) {
      toast.error("Failed to update profile", { description: error.message });
      return;
    }
    toast.success("Profile updated");
  };

  // =========================================================================
  // Handlers — API Keys (save + test)
  // =========================================================================
  const upsertSetting = async (patch) => {
    if (!user) return { error: new Error("Not signed in") };
    const { error } = await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, ...patch }, { onConflict: "user_id" });
    return { error };
  };

  const saveGroq = async () => {
    const value = groqInput.trim();
    if (!value) {
      toast.error("Enter a Groq API key first");
      return;
    }
    setGroqSaving(true);
    const { error } = await upsertSetting({ groq_api_key_enc: value });
    setGroqSaving(false);
    if (error) {
      toast.error("Failed to save Groq key", { description: error.message });
      return;
    }
    setGroqSaved(true);
    setGroqInput("");
    setGroqTested(false);
    toast.success("Groq API key saved");
  };

  const saveSerper = async () => {
    const value = serperInput.trim();
    if (!value) {
      toast.error("Enter a Serper API key first");
      return;
    }
    setSerperSaving(true);
    const { error } = await upsertSetting({ serper_api_key_enc: value });
    setSerperSaving(false);
    if (error) {
      toast.error("Failed to save Serper key", { description: error.message });
      return;
    }
    setSerperSaved(true);
    setSerperInput("");
    setSerperTested(false);
    toast.success("Serper API key saved");
  };

  const testKey = async ({ value, saved, provider, setLoading, setTested }) => {
    const key = (value || "").trim() || (saved ? "<use-saved-key>" : "");
    if (!value.trim() && !saved) {
      toast.error(`Enter a ${provider} API key to test`);
      return;
    }
    if (!value.trim() && saved) {
      toast.message(`Saved ${provider} key is not re-testable from the client`, {
        description: "Type the key again to test connectivity.",
      });
      return;
    }
    setLoading(true);
    const t0 = performance.now();
    try {
      const res = await fetch(testKeysUrl, {
        method: "GET",
        headers: { Authorization: `Bearer ${value.trim()}` },
      });
      const data = await res.json().catch(() => ({}));
      const latency = data.latency_ms ?? Math.round(performance.now() - t0);

      if (data.valid) {
        toast.success(`${provider} key valid`, {
          description: `Latency ${latency} ms`,
        });
        setTested(true);
      } else {
        toast.error(`${provider} key rejected`, {
          description: data.error || "Unknown error",
        });
        setTested(false);
      }
    } catch (err) {
      toast.error(`Could not reach the test endpoint`, {
        description: err?.message || "Network error",
      });
      setTested(false);
    } finally {
      setLoading(false);
    }
  };

  const testGroq = () =>
    testKey({
      value: groqInput,
      saved: groqSaved,
      provider: "Groq",
      setLoading: setGroqTesting,
      setTested:  setGroqTested,
    });

  const testSerper = () =>
    testKey({
      value: serperInput,
      saved: serperSaved,
      provider: "Serper",
      setLoading: setSerperTesting,
      setTested:  setSerperTested,
    });

  // =========================================================================
  // Handlers — Notifications
  // =========================================================================
  const toggleNotification = async (field, value, setter) => {
    if (!user) return;
    setter(value); // optimistic
    const { error } = await upsertSetting({ [field]: value });
    if (error) {
      setter(!value); // revert
      toast.error("Could not save preference", { description: error.message });
      return;
    }
    toast.success("Preference saved");
  };

  const onTogglePipeline = (v) => {
    setNotifPipeline(v);
    toggleNotification("notify_pipeline_complete", v, setNotifPipeline);
  };
  const onToggleDaily = (v) => {
    setNotifDaily(v);
    toggleNotification("notify_daily_summary", v, setNotifDaily);
  };
  const onToggleReply = (v) => {
    setNotifReply(v);
    toggleNotification("notify_new_reply", v, setNotifReply);
  };

  // =========================================================================
  // Derived UI bits
  // =========================================================================
  const groqPlaceholder  = useMemo(() => (groqSaved  ? maskKey("sk-xxxxxxxxxxxxxxxx3f2a") : "gsk_…"), [groqSaved]);
  const serperPlaceholder = useMemo(() => (serperSaved ? maskKey("serper-xxxxxxxxxxxx3f2a") : "serper-…"), [serperSaved]);

  const freeLimits = [
    { label: "100 leads / month",  included: true  },
    { label: "50 emails / month",  included: true  },
    { label: "1 workspace",        included: true  },
    { label: "Daily digest email", included: false },
    { label: "Priority support",   included: false },
  ];

  // =========================================================================
  // Render
  // =========================================================================
  return (
    <AppShell>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-4xl space-y-6 pb-12"
      >
        {/* Page header */}
        <motion.div variants={sectionVariants}>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-text)]">
            Settings
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text)]/60">
            Manage your profile, API keys, notifications, and plan.
          </p>
        </motion.div>

        {/* --------------------------------------------------------------- */}
        {/* Section 1 — Profile                                              */}
        {/* --------------------------------------------------------------- */}
        <SectionCard
          icon={User}
          title="Profile"
          description="Account information tied to your sign-in."
        >
          <div className="grid gap-5">
            {/* Email — read-only */}
            <div>
              <FieldLabel hint="Read-only">Email</FieldLabel>
              <div
                className="
                  flex items-center gap-2 rounded-lg
                  border border-[var(--color-border)]
                  bg-[var(--color-surface)]
                  px-3.5 py-2.5 text-sm
                  text-[var(--color-text)]
                "
              >
                <Mail className="h-4 w-4 text-[var(--color-text)]/40" />
                <span className="truncate">{user?.email || "—"}</span>
              </div>
            </div>

            {/* Display name */}
            <div>
              <FieldLabel hint="Visible to your team">Display name</FieldLabel>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="
                    w-full rounded-lg border border-[var(--color-border)]
                    bg-white px-3.5 py-2.5 text-sm
                    text-[var(--color-text)] outline-none
                    transition-colors
                    focus:border-[var(--color-accent)]
                  "
                />
                <SaveButton
                  loading={profileSaving}
                  disabled={!displayName.trim() || displayName.trim() === (user?.user_metadata?.full_name || "")}
                  onClick={saveProfile}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* --------------------------------------------------------------- */}
        {/* Section 2 — API Keys                                             */}
        {/* --------------------------------------------------------------- */}
        <SectionCard
          icon={KeyRound}
          title="API Keys"
          description="Used by the Scout and Craft agents. Stored encrypted in your user_settings row."
          badge={
            groqSaved && serperSaved ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-success)]">
                <ShieldCheck className="h-3 w-3" />
                Encrypted
              </span>
            ) : null
          }
        >
          <div className="space-y-6">
            {/* Groq */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <FieldLabel hint="Powers the Scout + Craft agents">Groq API Key</FieldLabel>
                {groqSaved && (
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--color-success)]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Saved
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="password"
                  value={groqInput}
                  onChange={(e) => { setGroqInput(e.target.value); setGroqTested(false); }}
                  placeholder={groqPlaceholder}
                  autoComplete="off"
                  spellCheck={false}
                  className="
                    w-full rounded-lg border border-[var(--color-border)]
                    bg-white px-3.5 py-2.5 font-mono text-sm
                    text-[var(--color-text)] outline-none
                    transition-colors
                    focus:border-[var(--color-accent)]
                  "
                />
                <div className="flex gap-2">
                  <TestButton
                    loading={groqTesting}
                    disabled={!groqInput.trim()}
                    success={groqTested}
                    onClick={testGroq}
                  />
                  <SaveButton
                    loading={groqSaving}
                    disabled={!groqInput.trim()}
                    onClick={saveGroq}
                  />
                </div>
              </div>
            </div>

            {/* Serper */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <FieldLabel hint="Powers lead discovery search">Serper API Key</FieldLabel>
                {serperSaved && (
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--color-success)]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Saved
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="password"
                  value={serperInput}
                  onChange={(e) => { setSerperInput(e.target.value); setSerperTested(false); }}
                  placeholder={serperPlaceholder}
                  autoComplete="off"
                  spellCheck={false}
                  className="
                    w-full rounded-lg border border-[var(--color-border)]
                    bg-white px-3.5 py-2.5 font-mono text-sm
                    text-[var(--color-text)] outline-none
                    transition-colors
                    focus:border-[var(--color-accent)]
                  "
                />
                <div className="flex gap-2">
                  <TestButton
                    loading={serperTesting}
                    disabled={!serperInput.trim()}
                    success={serperTested}
                    onClick={testSerper}
                  />
                  <SaveButton
                    loading={serperSaving}
                    disabled={!serperInput.trim()}
                    onClick={saveSerper}
                  />
                </div>
              </div>
            </div>

            <p className="text-xs text-[var(--color-text)]/50">
              We never display saved keys after submission. Re-enter the value to update or test.
            </p>
          </div>
        </SectionCard>

        {/* --------------------------------------------------------------- */}
        {/* Section 3 — Notifications                                        */}
        {/* --------------------------------------------------------------- */}
        <SectionCard
          icon={Bell}
          title="Notifications"
          description="Choose which events trigger an email or in-app alert."
        >
          <div className="divide-y divide-[var(--color-border)]">
            <NotifRow
              label="Pipeline Complete"
              description="Notify when a Scout → Craft → Pulse run finishes."
              checked={notifPipeline}
              disabled={notifSaving}
              onChange={onTogglePipeline}
            />
            <NotifRow
              label="Daily Summary"
              description="A 9am digest of yesterday's activity."
              checked={notifDaily}
              disabled={notifSaving}
              onChange={onToggleDaily}
            />
            <NotifRow
              label="New Reply Detected"
              description="Ping when a prospect replies to an outreach email."
              checked={notifReply}
              disabled={notifSaving}
              onChange={onToggleReply}
            />
          </div>
        </SectionCard>

        {/* --------------------------------------------------------------- */}
        {/* Section 4 — Plan                                                 */}
        {/* --------------------------------------------------------------- */}
        <SectionCard
          icon={CreditCard}
          title="Plan"
          description="You're on the Free plan. Upgrade for higher limits and team features."
          badge={
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text)]/70">
              Current
            </span>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            {/* Free card */}
            <div
              className="
                rounded-xl border border-[var(--color-border)]
                bg-[var(--color-surface)] p-5
              "
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--color-text)]/60" />
                <span className="text-sm font-medium text-[var(--color-text)]">Free</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-semibold text-[var(--color-text)]">$0</span>
                <span className="text-sm text-[var(--color-text)]/60">/ month</span>
              </div>
              <ul className="mt-4 space-y-2">
                {freeLimits.map((row) => (
                  <li
                    key={row.label}
                    className={`
                      flex items-center gap-2 text-sm
                      ${row.included ? "text-[var(--color-text)]" : "text-[var(--color-text)]/40 line-through"}
                    `}
                  >
                    <Check
                      className={`h-4 w-4 ${
                        row.included ? "text-[var(--color-success)]" : "text-[var(--color-text)]/30"
                      }`}
                    />
                    {row.label}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro card */}
            <div
              className="
                relative rounded-xl border border-[var(--color-accent)]/30
                bg-[var(--color-accent)]/5 p-5
              "
            >
              <div className="absolute -top-2.5 right-4 inline-flex items-center gap-1 rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-[10px] font-medium text-white">
                <Crown className="h-3 w-3" />
                Recommended
              </div>
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-[var(--color-accent)]" />
                <span className="text-sm font-medium text-[var(--color-text)]">Pro</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-semibold text-[var(--color-text)]">$49</span>
                <span className="text-sm text-[var(--color-text)]/60">/ month</span>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-[var(--color-text)]">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[var(--color-success)]" />
                  Unlimited leads
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[var(--color-success)]" />
                  1,000 emails / month
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[var(--color-success)]" />
                  Unlimited workspaces
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[var(--color-success)]" />
                  Priority support
                </li>
              </ul>
              <Link
                to="/billing"
                className="
                  mt-5 inline-flex w-full items-center justify-center gap-1.5
                  rounded-lg bg-[var(--color-accent)] px-3.5 py-2.5
                  text-sm font-medium text-white
                  transition-opacity hover:opacity-90
                "
              >
                Upgrade to Pro
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between text-xs text-[var(--color-text)]/50">
            <span>Need a custom plan? Talk to us.</span>
            <Link
              to="/billing"
              className="inline-flex items-center gap-1 text-[var(--color-accent)] hover:underline"
            >
              View billing
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </SectionCard>
      </motion.div>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// Notification row (kept at module scope so motion is stable)
// ---------------------------------------------------------------------------
function NotifRow({ label, description, checked, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <div className="text-sm font-medium text-[var(--color-text)]">{label}</div>
        <div className="mt-0.5 text-xs text-[var(--color-text)]/60">{description}</div>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}
