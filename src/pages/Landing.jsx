/**
 * src/pages/Landing.jsx
 * ─────────────────────────────────────────────────────────────
 * The full public marketing page.
 *
 * Sections (each wrapped in AnimatePresence):
 *   1. Hero       — animated gradient mesh + PipelineHero + headline + CTA
 *   2. How It Works — 3 steps with whileInView stagger
 *   3. Pricing    — Free · Pro ($49/mo, scale 1.02 + indigo border) · Enterprise
 *   4. Contact    — Formspree-powered form (VITE_FORMSPREE_CONTACT_ID)
 *   5. Footer     — minimal product / company / legal columns
 *
 * Design language: Linear-grade. White surface, generous
 * whitespace, sharp Inter type, restrained colour use.
 * Every colour comes from Part 1 tokens.
 * ─────────────────────────────────────────────────────────────
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Mail,
  MessageSquare,
  User,
  Building2,
  Sparkles,
  ShieldCheck,
  Zap,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';

import { MarketingNav } from '@/components/layout/MarketingNav';
import { PipelineHero } from '@/components/marketing/PipelineHero';

const FORMSPREE_ID = import.meta.env.VITE_FORMSPREE_CONTACT_ID || 'xpzgrvwy';
const APP_NAME = import.meta.env.VITE_APP_NAME || 'BizPilot AI';

// ─────────────────────────────────────────────────────────────
// Section transition wrapper
// ─────────────────────────────────────────────────────────────
function Section({ id, children, className = '', style, delay = 0 }) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], delay }}
      className={className}
      style={{ position: 'relative', ...style }}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// 1. HERO
// ─────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        paddingTop: 120,
        paddingBottom: 80,
        overflow: 'hidden',
        background: 'var(--color-base)',
      }}
    >
      <HeroBackground />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1120,
          margin: '0 auto',
          padding: '0 24px',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: 48,
          textAlign: 'center',
        }}
      >
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 'var(--radius-badge)',
              background: 'var(--color-accent-subtle)',
              color: 'var(--color-accent)',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.02em',
              border: '1px solid var(--color-accent-100, var(--color-border))',
            }}
          >
            <Sparkles size={12} />
            AI Revenue OS · Now in public beta
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05, ease: [0.4, 0, 0.2, 1] }}
          style={{
            margin: 0,
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1.04,
            color: 'var(--color-text)',
          }}
          className="text-balance"
        >
          {APP_NAME.split(' ')[0]}{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, var(--color-accent) 0%, #818CF8 60%, #6366F1 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {APP_NAME.split(' ').slice(1).join(' ') || 'AI'}
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease: [0.4, 0, 0.2, 1] }}
          style={{
            margin: 0,
            maxWidth: 640,
            marginLeft: 'auto',
            marginRight: 'auto',
            fontSize: 'clamp(1rem, 1.6vw, 1.25rem)',
            color: 'var(--color-text-muted)',
            lineHeight: 1.5,
          }}
          className="text-balance"
        >
          Autonomous outreach. Zero manual effort.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            to="/signup"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 24px',
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: 'var(--color-text-inverse)',
              background: 'var(--color-accent)',
              border: '1px solid var(--color-accent)',
              borderRadius: 'var(--radius-input)',
              textDecoration: 'none',
              boxShadow: '0 12px 28px -8px rgba(79, 70, 229, 0.45)',
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
            Start Automating
            <ArrowRight size={16} />
          </Link>
          <Link
            to="/features"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 24px',
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: 'var(--color-text)',
              background: 'var(--color-base)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-input)',
              textDecoration: 'none',
              transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-surface)';
              e.currentTarget.style.borderColor = 'var(--color-border-strong)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-base)';
              e.currentTarget.style.borderColor = 'var(--color-border)';
            }}
          >
            See how it works
          </Link>
        </motion.div>

        {/* Pipeline animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
          style={{ marginTop: 48 }}
        >
          <PipelineHero />
        </motion.div>

        {/* Trust line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          style={{
            margin: '32px 0 0',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          SOC 2 Type II · GDPR ready · Built on Supabase + OpenAI
        </motion.p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Hero animated background — 3 gradient blobs on 8s sine loop
// ─────────────────────────────────────────────────────────────
function HeroBackground() {
  const prefersReduced = useReducedMotion();

  // Three "blobs" at 0.06 opacity using Part 1 token hues.
  // (Indigo family — accent + lighter accent + darker accent —
  //  interpreted as indigo / cyan-ish / violet-ish within the
  //  same token system.)
  const blobs = [
    {
      size: 520,
      x: ['0%', '12%', '-8%', '0%'],
      y: ['0%', '-10%', '8%', '0%'],
      gradient:
        'radial-gradient(circle, rgba(79, 70, 229, 0.45) 0%, rgba(79, 70, 229, 0) 70%)',
      delay: 0,
    },
    {
      size: 460,
      x: ['0%', '-10%', '14%', '0%'],
      y: ['0%', '12%', '-6%', '0%'],
      gradient:
        'radial-gradient(circle, rgba(129, 140, 248, 0.45) 0%, rgba(129, 140, 248, 0) 70%)',
      delay: 2,
    },
    {
      size: 480,
      x: ['0%', '8%', '-12%', '0%'],
      y: ['0%', '-8%', '14%', '0%'],
      gradient:
        'radial-gradient(circle, rgba(99, 102, 241, 0.40) 0%, rgba(99, 102, 241, 0) 70%)',
      delay: 4,
    },
  ];

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Faint dot grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.5,
          backgroundImage:
            'radial-gradient(circle, var(--color-border) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage:
            'radial-gradient(ellipse at center, black 0%, transparent 70%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, black 0%, transparent 70%)',
        }}
      />

      {/* Animated blobs */}
      {blobs.map((b, i) => (
        <motion.div
          key={i}
          animate={
            prefersReduced
              ? undefined
              : {
                  x: b.x,
                  y: b.y,
                }
          }
          transition={{
            duration: 8,
            ease: 'easeInOut',
            repeat: Infinity,
            times: [0, 0.33, 0.66, 1],
            delay: b.delay,
          }}
          style={{
            position: 'absolute',
            top: '20%',
            left: `${20 + i * 20}%`,
            width: b.size,
            height: b.size,
            borderRadius: '50%',
            background: b.gradient,
            opacity: 0.06,
            filter: 'blur(40px)',
          }}
        />
      ))}

      {/* Bottom fade */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 200,
          background:
            'linear-gradient(to bottom, transparent, var(--color-base))',
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. HOW IT WORKS
// ─────────────────────────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    {
      Icon: User,
      title: 'Connect your stack',
      description:
        'Plug in your inbox, CRM, and lead source in 60 seconds. We handle OAuth scopes, warmup, and deliverability.',
      accent: 'var(--color-accent)',
    },
    {
      Icon: Sparkles,
      title: 'Compose with AI',
      description:
        'Brief BizPilot on your offer in plain English. We draft, personalize, and A/B-test sequences for every persona.',
      accent: 'var(--color-accent)',
    },
    {
      Icon: Zap,
      title: 'Book on autopilot',
      description:
        'Replies get classified, meetings auto-scheduled to your calendar, and CRM fields update themselves.',
      accent: 'var(--color-success)',
    },
  ];

  return (
    <Section
      id="how-it-works"
      style={{
        padding: '120px 24px',
        background: 'var(--color-base)',
      }}
    >
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <SectionHeader
          eyebrow="How it works"
          title="Three steps to pipeline on autopilot"
          subtitle="No manual list-building. No copy-paste. No tab-switching."
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12 } },
          }}
          style={{
            marginTop: 64,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 24,
          }}
        >
          {steps.map((step, i) => (
            <motion.article
              key={step.title}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] } },
              }}
              style={{
                position: 'relative',
                padding: 28,
                background: 'var(--color-base)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-card)',
                transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-accent)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 32px -8px rgba(79, 70, 229, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-input)',
                  background: 'var(--color-accent-subtle)',
                  color: step.accent,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <step.Icon size={20} strokeWidth={2.2} />
              </div>
              <span
                style={{
                  position: 'absolute',
                  top: 24,
                  right: 24,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--color-text-subtle)',
                }}
              >
                0{i + 1}
              </span>
              <h3
                style={{
                  margin: '0 0 8px',
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                  letterSpacing: '-0.01em',
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.9375rem',
                  color: 'var(--color-text-muted)',
                  lineHeight: 1.55,
                }}
              >
                {step.description}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. PRICING
// ─────────────────────────────────────────────────────────────
function PricingSection() {
  const tiers = [
    {
      name: 'Free',
      price: '$0',
      cadence: 'forever',
      description: 'Everything you need to validate your first outbound motion.',
      cta: 'Start free',
      to: '/signup',
      highlighted: false,
      features: [
        '1 connected inbox',
        'Up to 500 contacts',
        'AI sequence writer (50 runs/mo)',
        'Basic open & click tracking',
        'Community support',
      ],
    },
    {
      name: 'Pro',
      price: '$49',
      cadence: 'per month',
      description: 'For founders & revenue teams running real outbound.',
      cta: 'Start 14-day trial',
      to: '/signup?plan=pro',
      highlighted: true,
      features: [
        'Up to 5 connected inboxes',
        'Unlimited contacts',
        'Unlimited AI personalization',
        'LinkedIn automation',
        'A/B testing & reply classifier',
        'Warmup + deliverability suite',
        'Priority email support',
      ],
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      cadence: 'tailored',
      description: 'For revenue orgs with custom workflows and SLAs.',
      cta: 'Talk to sales',
      to: '/contact?topic=enterprise',
      highlighted: false,
      features: [
        'Unlimited everything',
        'SSO + SCIM provisioning',
        'Dedicated success manager',
        'Custom integrations & API limits',
        '99.9% uptime SLA',
        'On-prem deployment options',
      ],
    },
  ];

  return (
    <Section
      id="pricing"
      style={{
        padding: '120px 24px',
        background: 'var(--color-surface)',
      }}
    >
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <SectionHeader
          eyebrow="Pricing"
          title="Simple plans that scale with you"
          subtitle="Start free. Upgrade when you're ready. Cancel anytime."
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
          style={{
            marginTop: 56,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 24,
            alignItems: 'stretch',
          }}
        >
          {tiers.map((tier) => (
            <motion.div
              key={tier.name}
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] } },
              }}
              whileHover={tier.highlighted ? { scale: 1.02 } : { y: -2 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                padding: 32,
                background: 'var(--color-base)',
                border: tier.highlighted
                  ? '2px solid var(--color-accent)'
                  : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-card)',
                boxShadow: tier.highlighted
                  ? '0 16px 40px -12px rgba(79, 70, 229, 0.25)'
                  : 'none',
                transition: 'border-color 200ms ease, box-shadow 200ms ease',
              }}
            >
              {tier.highlighted && (
                <span
                  style={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-badge)',
                    background: 'var(--color-accent)',
                    color: 'var(--color-text-inverse)',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Most popular
                </span>
              )}

              <h3
                style={{
                  margin: 0,
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                }}
              >
                {tier.name}
              </h3>
              <p
                style={{
                  margin: '6px 0 24px',
                  fontSize: '0.875rem',
                  color: 'var(--color-text-muted)',
                  minHeight: 42,
                }}
              >
                {tier.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span
                  style={{
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    color: 'var(--color-text)',
                    lineHeight: 1,
                  }}
                >
                  {tier.price}
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                  {tier.cadence}
                </span>
              </div>

              <Link
                to={tier.to}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  marginTop: 24,
                  padding: '11px 18px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: tier.highlighted ? 'var(--color-text-inverse)' : 'var(--color-text)',
                  background: tier.highlighted ? 'var(--color-accent)' : 'var(--color-base)',
                  border: tier.highlighted
                    ? '1px solid var(--color-accent)'
                    : '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-input)',
                  textDecoration: 'none',
                  transition: 'all 160ms ease',
                }}
                onMouseEnter={(e) => {
                  if (tier.highlighted) {
                    e.currentTarget.style.background = 'var(--color-accent-hover)';
                  } else {
                    e.currentTarget.style.background = 'var(--color-surface)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (tier.highlighted) {
                    e.currentTarget.style.background = 'var(--color-accent)';
                  } else {
                    e.currentTarget.style.background = 'var(--color-base)';
                  }
                }}
              >
                {tier.cta}
                <ArrowRight size={14} />
              </Link>

              <ul
                style={{
                  listStyle: 'none',
                  margin: '28px 0 0',
                  padding: '24px 0 0',
                  borderTop: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {tier.features.map((f) => (
                  <li
                    key={f}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      fontSize: '0.875rem',
                      color: 'var(--color-text)',
                      lineHeight: 1.4,
                    }}
                  >
                    <Check
                      size={16}
                      strokeWidth={2.5}
                      style={{
                        color: 'var(--color-success)',
                        marginTop: 2,
                        flexShrink: 0,
                      }}
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. CONTACT
// ─────────────────────────────────────────────────────────────
function ContactSection() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          ...form,
          _subject: `📩 New ${APP_NAME} contact — ${form.name}`,
          source: 'landing_contact_form',
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error || 'Submission failed');
      }

      setSent(true);
      toast.success("Got it! We'll be in touch within 24 hours.");
      setForm({ name: '', email: '', company: '', message: '' });
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Try again or email support@bizpilot.ai.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section
      id="contact"
      style={{
        padding: '120px 24px',
        background: 'var(--color-base)',
      }}
    >
      <div
        style={{
          maxWidth: 980,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: 48,
        }}
      >
        <SectionHeader
          eyebrow="Talk to us"
          title="Get in touch"
          subtitle="Questions, partnerships, or enterprise plans — drop us a line and we'll respond within one business day."
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 32,
            alignItems: 'start',
          }}
        >
          {/* Contact form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            style={{
              padding: 28,
              background: 'var(--color-base)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <Field
              label="Name"
              name="name"
              placeholder="Jane Founder"
              value={form.name}
              onChange={handleChange}
              required
              icon={<User size={15} />}
            />
            <Field
              label="Work email"
              name="email"
              type="email"
              placeholder="jane@company.com"
              value={form.email}
              onChange={handleChange}
              required
              icon={<Mail size={15} />}
            />
            <Field
              label="Company"
              name="company"
              placeholder="Acme Inc."
              value={form.company}
              onChange={handleChange}
              icon={<Building2 size={15} />}
            />
            <Field
              label="Message"
              name="message"
              placeholder="What can we help you with?"
              value={form.message}
              onChange={handleChange}
              required
              textarea
              icon={<MessageSquare size={15} />}
            />

            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
              style={{
                marginTop: 8,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 18px',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--color-text-inverse)',
                background: 'var(--color-accent)',
                border: '1px solid var(--color-accent)',
                borderRadius: 'var(--radius-input)',
                cursor: submitting ? 'wait' : 'pointer',
                opacity: submitting ? 0.7 : 1,
                transition: 'all 200ms cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              {submitting ? 'Sending…' : sent ? 'Sent ✓' : 'Send message'}
              {!submitting && <ArrowRight size={14} />}
            </motion.button>
          </motion.form>

          {/* Sidebar info */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
              paddingTop: 12,
            }}
          >
            <ContactPoint
              Icon={Mail}
              label="Email"
              value="hello@bizpilot.ai"
              href="mailto:hello@bizpilot.ai"
            />
            <ContactPoint
              Icon={Globe}
              label="Status"
              value="All systems operational"
              href="/status"
            />
            <ContactPoint
              Icon={ShieldCheck}
              label="Security"
              value="SOC 2 Type II · GDPR"
            />

            <div
              style={{
                padding: 20,
                background: 'var(--color-accent-subtle)',
                borderRadius: 'var(--radius-card)',
                border: '1px solid var(--color-border)',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: 'var(--color-accent)',
                  marginBottom: 6,
                }}
              >
                Prefer a live demo?
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.8125rem',
                  color: 'var(--color-text)',
                  lineHeight: 1.5,
                }}
              >
                Book a 20-min walkthrough and we'll show you how BizPilot books 30+ meetings a month for teams like yours.
              </p>
              <Link
                to="/contact?topic=demo"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 12,
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  color: 'var(--color-accent)',
                  textDecoration: 'none',
                }}
              >
                Book a demo
                <ArrowRight size={12} />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}

function Field({ label, name, type = 'text', placeholder, value, onChange, required, textarea, icon }) {
  const Tag = textarea ? 'textarea' : 'input';
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span
        style={{
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: 'var(--color-text)',
        }}
      >
        {label}
        {required && <span style={{ color: 'var(--color-danger)', marginLeft: 2 }}>*</span>}
      </span>
      <div style={{ position: 'relative' }}>
        {icon && (
          <span
            aria-hidden
            style={{
              position: 'absolute',
              top: textarea ? 14 : 0,
              bottom: textarea ? 'auto' : 0,
              left: 12,
              display: 'flex',
              alignItems: textarea ? 'flex-start' : 'center',
              color: 'var(--color-text-muted)',
              pointerEvents: 'none',
            }}
          >
            {icon}
          </span>
        )}
        <Tag
          name={name}
          type={textarea ? undefined : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          rows={textarea ? 4 : undefined}
          style={{
            width: '100%',
            padding: icon ? `${textarea ? '12px' : '10px'} 12px ${textarea ? '12px' : '10px'} 36px` : '10px 12px',
            fontSize: '0.875rem',
            fontFamily: 'var(--font-sans)',
            color: 'var(--color-text)',
            background: 'var(--color-base)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-input)',
            outline: 'none',
            transition: 'all 160ms cubic-bezier(0.4,0,0.2,1)',
            resize: textarea ? 'vertical' : 'none',
            minHeight: textarea ? 96 : 'auto',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--color-accent)';
            e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.18)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--color-border)';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>
    </label>
  );
}

function ContactPoint({ Icon, label, value, href }) {
  const Wrapper = href ? Link : 'div';
  const wrapperProps = href ? { to: href } : {};
  return (
    <Wrapper
      {...wrapperProps}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        textDecoration: 'none',
      }}
    >
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-input)',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-accent)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={16} />
      </span>
      <div>
        <p
          style={{
            margin: 0,
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
          }}
        >
          {label}
        </p>
        <p
          style={{
            margin: '2px 0 0',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: href ? 'var(--color-accent)' : 'var(--color-text)',
          }}
        >
          {value}
        </p>
      </div>
    </Wrapper>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. FOOTER
// ─────────────────────────────────────────────────────────────
function FooterSection() {
  const cols = [
    {
      title: 'Product',
      links: [
        { label: 'Features',    to: '/features' },
        { label: 'Pricing',     to: '/pricing' },
        { label: 'Integrations',to: '/integrations' },
        { label: 'Changelog',   to: '/changelog' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Blog',        to: '/blog' },
        { label: 'Help center', to: '/support' },
        { label: 'Docs',        to: '/support/docs' },
        { label: 'Status',      to: '/support/status' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About',   to: '/about' },
        { label: 'Customers', to: '/customers' },
        { label: 'Careers', to: '/careers' },
        { label: 'Contact', to: '/contact' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy',           to: '/legal/privacy' },
        { label: 'Terms',             to: '/legal/terms' },
        { label: 'DPA',               to: '/legal/dpa' },
        { label: 'Acceptable use',    to: '/legal/acceptable-use' },
      ],
    },
  ];

  return (
    <footer
      style={{
        padding: '64px 24px 32px',
        background: 'var(--color-base)',
        borderTop: '1px solid var(--color-border)',
      }}
    >
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 32,
          }}
        >
          <div style={{ gridColumn: 'span 1' }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                textDecoration: 'none',
                color: 'var(--color-text)',
              }}
            >
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-md)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, var(--color-accent), #818CF8)',
                  boxShadow: '0 6px 16px -4px rgba(79, 70, 229, 0.45)',
                  color: 'var(--color-text-inverse)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 18,
                }}
              >
                B
              </span>
              <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{APP_NAME}</span>
            </Link>
            <p
              style={{
                margin: '16px 0 0',
                fontSize: '0.8125rem',
                color: 'var(--color-text-muted)',
                lineHeight: 1.5,
                maxWidth: 240,
              }}
            >
              The AI revenue OS for B2B teams. Book more meetings with less manual work.
            </p>
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                  marginBottom: 14,
                }}
              >
                {col.title}
              </p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--color-text)',
                        textDecoration: 'none',
                        transition: 'color 120ms ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 12,
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
          }}
        >
          <p style={{ margin: 0 }}>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
          <p style={{ margin: 0 }}>Built with ♥ in San Francisco · Made for revenue teams.</p>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────
// Section header (reused across sections)
// ─────────────────────────────────────────────────────────────
function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
      {eyebrow && (
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            marginBottom: 14,
            borderRadius: 'var(--radius-badge)',
            background: 'var(--color-accent-subtle)',
            color: 'var(--color-accent)',
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {eyebrow}
        </motion.span>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.05 }}
        style={{
          margin: 0,
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: 'var(--color-text)',
          lineHeight: 1.1,
        }}
        className="text-balance"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            margin: '14px auto 0',
            fontSize: '1.0625rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.55,
            maxWidth: 560,
          }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Page (composes all sections inside AnimatePresence)
// ─────────────────────────────────────────────────────────────
export default function Landing() {
  return (
    <div
      style={{
        background: 'var(--color-base)',
        color: 'var(--color-text)',
        minHeight: '100vh',
      }}
    >
      <MarketingNav />

      <main style={{ paddingTop: 0 }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key="landing-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <HeroSection />
            <HowItWorksSection />
            <PricingSection />
            <ContactSection />
          </motion.div>
        </AnimatePresence>
      </main>

      <FooterSection />
    </div>
  );
}
