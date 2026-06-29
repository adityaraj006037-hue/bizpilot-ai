/**
 * src/pages/auth/Signup.jsx
 * ─────────────────────────────────────────────────────────────
 * Email + password registration with Google OAuth.
 *
 * Lead-capture order (per spec):
 *   1. Submit the form to Formspree FIRST using
 *      VITE_FORMSPREE_CONTACT_ID. This captures the lead
 *      regardless of whether they ever finish signup, so we
 *      never lose intent.
 *   2. If Formspree succeeds, call Supabase signUp with the
 *      same email + password + metadata (full_name).
 *   3. If Supabase signup also succeeds, route the user to
 *      /onboarding. If it fails, we still have the waitlist
 *      capture and show a friendly error.
 *
 * Layout (provided by AuthShell):
 *   - LEFT  : this form
 *   - RIGHT : animated product preview
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OAuthButtons } from '@/components/auth/OAuthButtons';

// ─────────────────────────────────────────────────────────────
// Config & helpers
// ─────────────────────────────────────────────────────────────
const FORMSPREE_ID = import.meta.env.VITE_FORMSPREE_CONTACT_ID || 'xpzgrvwy';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const APP_NAME = import.meta.env.VITE_APP_NAME || 'BizPilot AI';

function passwordStrength(pwd) {
  if (!pwd) return { score: 0, label: 'Too short', tone: '#94A3B8' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const meta = [
    { label: 'Too short', tone: '#94A3B8' },
    { label: 'Weak',      tone: '#EF4444' },
    { label: 'Fair',      tone: '#F59E0B' },
    { label: 'Good',      tone: '#3B82F6' },
    { label: 'Strong',    tone: '#10B981' },
    { label: 'Excellent', tone: '#10B981' },
  ];
  return { score, label: meta[score].label, tone: meta[score].tone };
}

function friendlyAuthError(message) {
  if (!message) return null;
  const m = message.toLowerCase();
  if (m.includes('already registered') || m.includes('already been registered') || m.includes('user already')) {
    return 'That email is already registered. Try signing in instead.';
  }
  if (m.includes('password should be')) {
    return 'Password is too weak. Use 8+ characters with a mix of letters, numbers, and symbols.';
  }
  if (m.includes('rate limit') || m.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  return message;
}

// ─────────────────────────────────────────────────────────────
// Formspree capture (runs before Supabase auth)
// ─────────────────────────────────────────────────────────────
async function captureToFormspree({ email, fullName, source }) {
  if (!FORMSPREE_ID) {
    // eslint-disable-next-line no-console
    console.warn('[Signup] VITE_FORMSPREE_CONTACT_ID not set — skipping waitlist capture.');
    return { ok: true, skipped: true };
  }

  try {
    const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email,
        full_name: fullName,
        source, // 'signup_attempt'
        product: APP_NAME,
        timestamp: new Date().toISOString(),
        _subject: `🚀 New ${APP_NAME} signup attempt — ${email}`,
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.warn('[Signup] Formspree capture non-OK response:', res.status, json);
      return { ok: false, error: json?.error || 'Waitlist capture failed' };
    }
    return { ok: true, data: json };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[Signup] Formspree capture error:', err);
    // Non-fatal: we still want the user to be able to sign up even
    // if Formspree is down. Surface a soft warning later.
    return { ok: false, error: err?.message || 'Network error during waitlist capture' };
  }
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function Signup() {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle, isAuthenticated, loading: authLoading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [waitlistCaptured, setWaitlistCaptured] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // If already authenticated, bounce to onboarding.
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/onboarding', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const strength = passwordStrength(password);

  // ── Validation ───────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!fullName.trim()) errs.fullName = 'Please tell us your name.';
    if (!email) errs.email = 'Email is required.';
    else if (!EMAIL_RE.test(email)) errs.email = 'Enter a valid email address.';
    if (!password) errs.password = 'Password is required.';
    else if (password.length < 8) errs.password = 'Use at least 8 characters.';
    if (!acceptTerms) errs.terms = 'You must accept the terms to continue.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit: Formspree FIRST, then Supabase ────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (!validate()) return;

    setSubmitting(true);

    // STEP 1 — capture to Formspree waitlist BEFORE Supabase auth
    const capture = await captureToFormspree({
      email: email.trim(),
      fullName: fullName.trim(),
      source: 'signup_attempt',
    });

    if (capture.ok) {
      setWaitlistCaptured(true);
    } else {
      // Soft fail — log but don't block signup. Formspree being down
      // shouldn't stop a paying user from signing up.
      // eslint-disable-next-line no-console
      console.warn('[Signup] Waitlist capture failed (continuing):', capture.error);
    }

    // STEP 2 — Supabase signup
    const { data, error: signUpError } = await signUp({
      email: email.trim(),
      password,
      metadata: {
        full_name: fullName.trim(),
        waitlist_captured_at: new Date().toISOString(),
      },
    });

    setSubmitting(false);

    if (signUpError) {
      const friendly = friendlyAuthError(signUpError.message);
      setError(friendly);
      toast.error(friendly);
      return;
    }

    // If Supabase returned a session, user is signed in immediately.
    // Otherwise email confirmation is required — route them to verify-email.
    if (data?.session) {
      toast.success('Account created! Let’s set up your workspace.');
      navigate('/onboarding', { replace: true });
    } else {
      toast.success('Account created! Check your email to confirm.');
      navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`, { replace: true });
    }
  };

  // ── Google OAuth ─────────────────────────────────────────
  const handleOAuth = async (provider) => {
    if (provider !== 'google') return;
    setError(null);

    // Also fire a Formspree capture so we have intent even if
    // the OAuth round-trip fails to complete.
    captureToFormspree({
      email: email.trim() || `oauth-${Date.now()}@pending.bizpilot.ai`,
      fullName: fullName.trim() || 'Pending Google OAuth',
      source: 'signup_oauth_attempt',
    }).catch(() => {});

    try {
      const { error: oauthError } = await signInWithGoogle({
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/onboarding')}`,
      });
      if (oauthError) {
        const friendly = friendlyAuthError(oauthError.message);
        setError(friendly);
        toast.error(friendly);
      }
    } catch (err) {
      const friendly = friendlyAuthError(err?.message);
      setError(friendly);
      toast.error(friendly);
    }
  };

  // ─────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tighter text-ink-900">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Start your 14-day free trial. No credit card required.
        </p>
      </div>

      {/* Global error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex items-start gap-2.5 rounded-card p-3.5"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
          role="alert"
        >
          <AlertCircle className="h-4.5 w-4.5 mt-0.5 flex-shrink-0" style={{ color: '#DC2626' }} />
          <p className="text-sm font-medium" style={{ color: '#991B1B' }}>{error}</p>
        </motion.div>
      )}

      {/* Waitlist captured confirmation */}
      {waitlistCaptured && !error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex items-start gap-2.5 rounded-card p-3.5"
          style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}
          role="status"
        >
          <CheckCircle2 className="h-4.5 w-4.5 mt-0.5 flex-shrink-0" style={{ color: '#059669' }} />
          <p className="text-sm font-medium" style={{ color: '#065F46' }}>
            You're on the early-access list. Finishing signup now…
          </p>
        </motion.div>
      )}

      {/* OAuth */}
      <OAuthButtons
        providers={['google']}
        onProvider={handleOAuth}
        disabled={submitting}
      />

      {/* Email + password form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          type="text"
          name="full_name"
          label="Full name"
          placeholder="Jane Founder"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          leftIcon={<User className="h-4 w-4" />}
          error={fieldErrors.fullName}
          required
          autoFocus
        />

        <Input
          type="email"
          name="email"
          label="Work email"
          placeholder="you@company.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="h-4 w-4" />}
          error={fieldErrors.email}
          required
        />

        <div>
          <Input
            type={showPassword ? 'text' : 'password'}
            name="password"
            label="Password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="h-4 w-4" />}
            error={fieldErrors.password}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: '#64748B' }}
                tabIndex={-1}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            }
            required
          />

          {/* Password strength meter */}
          {password && (
            <div className="mt-2.5">
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-colors duration-200"
                    style={{
                      background: i < strength.score ? strength.tone : '#E2E8F0',
                    }}
                  />
                ))}
              </div>
              <p className="mt-1.5 text-xs font-medium" style={{ color: strength.tone }}>
                {strength.label}
              </p>
            </div>
          )}
        </div>

        {/* Terms checkbox */}
        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="h-4 w-4 mt-0.5 rounded border-border"
              style={{ accentColor: '#4F46E5' }}
            />
            <span className="text-sm text-ink-700 leading-snug">
              I agree to the{' '}
              <Link to="/legal/terms" target="_blank" rel="noopener" className="font-semibold" style={{ color: '#4F46E5' }}>
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/legal/privacy" target="_blank" rel="noopener" className="font-semibold" style={{ color: '#4F46E5' }}>
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {fieldErrors.terms && (
            <p className="mt-1.5 text-xs font-medium" style={{ color: '#DC2626' }}>
              {fieldErrors.terms}
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={submitting}
          disabled={submitting}
          className="w-full mt-2"
          iconRight={<ArrowRight className="h-4 w-4" />}
        >
          Create account
        </Button>
      </form>

      {/* Footer link for login */}
      <p className="mt-7 text-center text-sm text-ink-500 lg:hidden">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold" style={{ color: '#4F46E5' }}>
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
