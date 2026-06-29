/**
 * src/pages/auth/Login.jsx
 * ─────────────────────────────────────────────────────────────
 * Email + password sign-in plus Google OAuth.
 *
 * Layout (provided by AuthShell):
 *   - LEFT  : this form
 *   - RIGHT : animated product preview (rendered by AuthShell)
 *
 * Flow:
 *   1. Validate locally.
 *   2. Call useAuth().signIn({email, password}).
 *   3. On success, navigate to /app/dashboard (or ?next= if present).
 *   4. On failure, surface a friendly inline error.
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { OAuthButtons } from '@/components/auth/OAuthButtons';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function friendlyAuthError(message) {
  if (!message) return null;
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials') || m.includes('invalid credentials')) {
    return 'Wrong email or password. Please try again.';
  }
  if (m.includes('email not confirmed')) {
    return 'Please confirm your email before signing in. Check your inbox for the link.';
  }
  if (m.includes('too many requests') || m.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }
  if (m.includes('user not found')) {
    return 'No account found with that email.';
  }
  return message;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signInWithGoogle, isAuthenticated, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const nextPath = new URLSearchParams(location.search).get('next') || '/app/dashboard';

  // If already authenticated, bounce immediately.
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate(nextPath, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, nextPath]);

  // ── Validation ───────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!email) errs.email = 'Email is required.';
    else if (!EMAIL_RE.test(email)) errs.email = 'Enter a valid email address.';
    if (!password) errs.password = 'Password is required.';
    else if (password.length < 6) errs.password = 'Password is too short.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit email + password ──────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (!validate()) return;

    setSubmitting(true);
    const { error: signInError } = await signIn({ email: email.trim(), password });
    setSubmitting(false);

    if (signInError) {
      const friendly = friendlyAuthError(signInError.message);
      setError(friendly);
      toast.error(friendly);
      return;
    }

    toast.success('Welcome back!');
    navigate(nextPath, { replace: true });
  };

  // ── Google OAuth ─────────────────────────────────────────
  const handleOAuth = async (provider) => {
    if (provider !== 'google') return;
    setError(null);
    try {
      const { error: oauthError } = await signInWithGoogle({ redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}` });
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
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Sign in to your workspace and pick up where you left off.
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
          <p className="text-sm font-medium" style={{ color: '#991B1B' }}>
            {error}
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
          type="email"
          name="email"
          label="Email"
          placeholder="you@company.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="h-4 w-4" />}
          error={fieldErrors.email}
          required
          autoFocus
        />

        <Input
          type={showPassword ? 'text' : 'password'}
          name="password"
          label="Password"
          placeholder="Enter your password"
          autoComplete="current-password"
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

        <div className="flex items-center justify-between -mt-1">
          <label className="inline-flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              style={{ accentColor: '#4F46E5' }}
              defaultChecked
            />
            Remember me for 30 days
          </label>
          <Link
            to="/forgot-password"
            className="text-sm font-semibold transition-colors"
            style={{ color: '#4F46E5' }}
          >
            Forgot password?
          </Link>
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
          Sign in
        </Button>
      </form>

      {/* Footer link for sign-up */}
      <p className="mt-7 text-center text-sm text-ink-500 lg:hidden">
        Don't have an account?{' '}
        <Link to="/signup" className="font-semibold" style={{ color: '#4F46E5' }}>
          Sign up
        </Link>
      </p>
    </motion.div>
  );
}
