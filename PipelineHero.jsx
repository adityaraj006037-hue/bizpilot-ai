/**
 * src/components/marketing/PipelineHero.jsx
 * ─────────────────────────────────────────────────────────────
 * Reusable animated SVG pipeline used on the Landing hero and
 * the /run page.
 *
 * 3 nodes:  Scout → Craft → Pulse
 *
 * Animation choreography (sequenced):
 *   t=0.00s  ·  Scout node fades in
 *   t=0.10s  ·  path begins drawing (pathLength: 0 → 1, 1.5s)
 *   t=0.50s  ·  Craft node glows (path reached)
 *   t=1.00s  ·  Pulse node glows (path reached)
 *   t=1.60s  ·  full pipeline pulses gently (infinite loop)
 *
 * Tokens used (all from Part 1):
 *   --color-accent, --color-success, --color-text,
 *   --color-text-muted, --color-base, --color-border
 * ─────────────────────────────────────────────────────────────
 */

import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────
// Node definitions
// ─────────────────────────────────────────────────────────────
const NODES = [
  {
    key: 'scout',
    label: 'Scout',
    description: 'Discover',
    x: 100,
    y: 140,
    color: 'var(--color-accent)',
    glow: 'rgba(79, 70, 229, 0.45)',
    delay: 0,
  },
  {
    key: 'craft',
    label: 'Craft',
    description: 'Personalize',
    x: 320,
    y: 90,
    color: 'var(--color-accent)',
    glow: 'rgba(79, 70, 229, 0.45)',
    delay: 0.55,
  },
  {
    key: 'pulse',
    label: 'Pulse',
    description: 'Send & learn',
    x: 540,
    y: 140,
    color: 'var(--color-success)',
    glow: 'rgba(16, 185, 129, 0.45)',
    delay: 1.1,
  },
];

// Build the curved path between node centres
const PATH_D = (() => {
  const [a, b, c] = NODES;
  // M a → Q ctrl → b → T c   (smooth quadratic that bends through each node)
  const cx1 = (a.x + b.x) / 2;
  const cy1 = (a.y + b.y) / 2 - 60;
  const cx2 = (b.x + c.x) / 2;
  const cy2 = (b.y + c.y) / 2 + 60;
  return `M ${a.x} ${a.y} Q ${cx1} ${cy1}, ${b.x} ${b.y} T ${cx2} ${cy2}, ${c.x} ${c.y}`;
})();

// ─────────────────────────────────────────────────────────────
// Single node
// ─────────────────────────────────────────────────────────────
function PipelineNode({ node, isActive }) {
  const radius = 28;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: node.delay, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
    >
      {/* Pulsing halo when active */}
      {isActive && (
        <>
          <motion.circle
            cx={node.x}
            cy={node.y}
            r={radius}
            fill="none"
            stroke={node.color}
            strokeWidth={2}
            initial={{ opacity: 0.6, scale: 0.9 }}
            animate={{ opacity: 0, scale: 2.2 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
            style={{ transformOrigin: `${node.x}px ${node.y}px`, transformBox: 'fill-box' }}
          />
          <motion.circle
            cx={node.x}
            cy={node.y}
            r={radius + 4}
            fill={node.glow}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: [0, 0.8, 0], scale: [0.9, 1.4, 1.8] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
            style={{ transformOrigin: `${node.x}px ${node.y}px`, transformBox: 'fill-box' }}
          />
        </>
      )}

      {/* Base ring */}
      <circle
        cx={node.x}
        cy={node.y}
        r={radius}
        fill="var(--color-base)"
        stroke={node.color}
        strokeWidth={2.5}
      />

      {/* Inner glyph */}
      <motion.circle
        cx={node.x}
        cy={node.y}
        r={isActive ? 10 : 7}
        fill={node.color}
        animate={isActive ? { r: [7, 10, 7] } : { r: 7 }}
        transition={isActive ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
      />

      {/* Label */}
      <text
        x={node.x}
        y={node.y + radius + 22}
        textAnchor="middle"
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 14,
          fill: 'var(--color-text)',
          letterSpacing: '-0.01em',
        }}
      >
        {node.label}
      </text>
      <text
        x={node.x}
        y={node.y + radius + 38}
        textAnchor="middle"
        style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 500,
          fontSize: 11,
          fill: 'var(--color-text-muted)',
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
        }}
      >
        {node.description}
      </text>
    </motion.g>
  );
}

PipelineNode.propTypes = {
  node: PropTypes.object.isRequired,
  isActive: PropTypes.bool,
};

// ─────────────────────────────────────────────────────────────
// Travelling pulse (a small dot that rides along the path)
// ─────────────────────────────────────────────────────────────
function TravellingPulse({ delay = 0 }) {
  return (
    <motion.circle
      r={5}
      fill="var(--color-accent)"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{
        delay,
        duration: 3.6,
        repeat: Infinity,
        ease: 'easeInOut',
        times: [0, 0.1, 0.9, 1],
      }}
    >
      <animateMotion
        dur="3.6s"
        repeatCount="indefinite"
        begin={`${delay}s`}
        path={PATH_D}
        rotate="auto"
      />
    </motion.circle>
  );
}

TravellingPulse.propTypes = {
  delay: PropTypes.number,
};

// ─────────────────────────────────────────────────────────────
// PipelineHero
// ─────────────────────────────────────────────────────────────
export function PipelineHero({ height = 240, showLabels = true, loop = true, className = '', style }) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 640,
        margin: '0 auto',
        ...style,
      }}
    >
      <svg
        viewBox="0 0 640 220"
        width="100%"
        height={height}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Scout to Craft to Pulse automation pipeline"
      >
        <defs>
          {/* Path gradient */}
          <linearGradient id="bp-pipeline-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.5" />
            <stop offset="55%" stopColor="var(--color-accent)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--color-success)" stopOpacity="1" />
          </linearGradient>

          {/* Soft drop shadow */}
          <filter id="bp-pipeline-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dx="0" dy="2" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.18" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Faded track (background line) */}
        <motion.path
          d={PATH_D}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray="6 8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />

        {/* Animated drawing path */}
        <motion.path
          d={PATH_D}
          fill="none"
          stroke="url(#bp-pipeline-gradient)"
          strokeWidth={3}
          strokeLinecap="round"
          filter="url(#bp-pipeline-shadow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: loop ? [0, 1, 1, 0] : 1 }}
          transition={{
            duration: loop ? 4 : 1.5,
            ease: 'easeInOut',
            times: loop ? [0, 0.4, 0.85, 1] : undefined,
            repeat: loop ? Infinity : 0,
            repeatDelay: loop ? 0.4 : 0,
          }}
        />

        {/* Travelling pulse dot */}
        <TravellingPulse delay={0.3} />
        <TravellingPulse delay={1.6} />

        {/* Nodes */}
        {showLabels &&
          NODES.map((n) => (
            <PipelineNode key={n.key} node={n} isActive />
          ))}
      </svg>
    </div>
  );
}

PipelineHero.propTypes = {
  height: PropTypes.number,
  showLabels: PropTypes.bool,
  loop: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
};

export default PipelineHero;
