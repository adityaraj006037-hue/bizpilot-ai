/**
 * src/components/auth/OAuthButtons.jsx
 * ─────────────────────────────────────────────────────────────
 * OAuth provider buttons used on login / signup screens.
 * Currently ships with Google (configurable for future
 * Microsoft / LinkedIn providers).
 *
 * Each button:
 *   - Renders a brand-accurate icon (inline SVG, no extra deps)
 *   - Disables itself while the OAuth flow is in flight
 *   - Invokes `onProvider(provider)` callback for parent control
 * ─────────────────────────────────────────────────────────────
 */

import PropTypes from 'prop-types';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Spinner } from '@/components/ui/Spinner';

// ─────────────────────────────────────────────────────────────
// Provider brand icons (inline SVG, no external requests)
// ─────────────────────────────────────────────────────────────
function GoogleIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

function MicrosoftIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="11" height="11" fill="#F25022" />
      <rect x="13" width="11" height="11" fill="#7FBA00" />
      <rect y="13" width="11" height="11" fill="#00A4EF" />
      <rect x="13" y="13" width="11" height="11" fill="#FFB900" />
    </svg>
  );
}

function LinkedInIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#0A66C2"
        d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 11-.01-4.12 2.06 2.06 0 01.01 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"
      />
    </svg>
  );
}

const PROVIDER_META = {
  google:   { label: 'Google',   icon: GoogleIcon },
  microsoft: { label: 'Microsoft', icon: MicrosoftIcon },
  linkedin: { label: 'LinkedIn', icon: LinkedInIcon },
};

// ─────────────────────────────────────────────────────────────
// Single OAuth button
// ─────────────────────────────────────────────────────────────
function OAuthButton({ provider, onClick, loading, disabled }) {
  const meta = PROVIDER_META[provider];
  if (!meta) return null;
  const Icon = meta.icon;
  const isLoading = loading === provider;

  return (
    <motion.button
      type="button"
      onClick={() => onClick?.(provider)}
      disabled={disabled || isLoading}
      whileHover={!disabled && !isLoading ? { y: -1 } : {}}
      whileTap={!disabled && !isLoading ? { scale: 0.98 } : {}}
      transition={{ duration: 0.12, ease: [0.4, 0, 0.2, 1] }}
      className="btn btn-secondary w-full justify-center"
      style={{
        height: '2.75rem',
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        color: '#0F172A',
        fontWeight: 600,
        fontSize: '0.875rem',
        opacity: disabled ? 0.55 : 1,
      }}
      aria-label={`Continue with ${meta.label}`}
    >
      {isLoading ? (
        <>
          <Spinner size="sm" color="#0F172A" />
          <span>Connecting to {meta.label}…</span>
        </>
      ) : (
        <>
          <Icon size={18} />
          <span>Continue with {meta.label}</span>
        </>
      )}
    </motion.button>
  );
}

OAuthButton.propTypes = {
  provider: PropTypes.oneOf(['google', 'microsoft', 'linkedin']).isRequired,
  onClick: PropTypes.func,
  loading: PropTypes.string,
  disabled: PropTypes.bool,
};

// ─────────────────────────────────────────────────────────────
// OAuthButtons (group)
// ─────────────────────────────────────────────────────────────
export default function OAuthButtons({
  providers = ['google'],
  onProvider,
  disabled = false,
  dividerText = 'Or continue with email',
  className = '',
}) {
  const [activeProvider, setActiveProvider] = useState(null);

  const handleClick = async (provider) => {
    if (activeProvider || disabled) return;
    setActiveProvider(provider);
    try {
      await onProvider?.(provider);
    } finally {
      // Reset after a short delay so the spinner is visible during the
      // brief window before the OAuth redirect kicks in.
      setTimeout(() => setActiveProvider(null), 1200);
    }
  };

  return (
    <div className={className}>
      <div className="space-y-2.5">
        {providers.map((p) => (
          <OAuthButton
            key={p}
            provider={p}
            loading={activeProvider}
            onClick={handleClick}
            disabled={disabled}
          />
        ))}
      </div>

      {dividerText && (
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: '#E2E8F0' }} />
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#64748B' }}>
            {dividerText}
          </span>
          <div className="h-px flex-1" style={{ background: '#E2E8F0' }} />
        </div>
      )}
    </div>
  );
}

OAuthButtons.propTypes = {
  providers: PropTypes.arrayOf(PropTypes.oneOf(['google', 'microsoft', 'linkedin'])),
  onProvider: PropTypes.func,
  disabled: PropTypes.bool,
  dividerText: PropTypes.string,
  className: PropTypes.string,
};
