import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Compass, Search } from "lucide-react";

import AppShell from "../components/layout/AppShell";

const containerVariants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function NotFound() {
  return (
    <AppShell>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex min-h-[calc(100vh-160px)] items-center justify-center px-4"
      >
        <div className="w-full max-w-lg text-center">
          {/* Large 404 in light gray */}
          <motion.div
            variants={itemVariants}
            className="
              relative mx-auto select-none
              font-semibold tracking-tighter
              text-[140px] leading-none sm:text-[180px]
            "
            style={{ color: "var(--color-border)" }}
            aria-hidden="true"
          >
            <motion.span
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block"
            >
              404
            </motion.span>
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="
                absolute -right-2 -top-2 inline-flex
                h-12 w-12 items-center justify-center
                rounded-full bg-[var(--color-surface)]
                border border-[var(--color-border)]
              "
            >
              <Compass className="h-5 w-5 text-[var(--color-accent)]" />
            </motion.div>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={itemVariants}
            className="
              mt-2 text-2xl font-semibold tracking-tight
              text-[var(--color-text)] sm:text-3xl
            "
          >
            Page not found
          </motion.h1>

          {/* Body */}
          <motion.p
            variants={itemVariants}
            className="mx-auto mt-3 max-w-sm text-sm text-[var(--color-text)]/60"
          >
            We searched the pipeline, the inbox, and the agent logs — this URL
            doesn't exist. It may have been moved or never existed at all.
          </motion.p>

          {/* Actions */}
          <motion.div
            variants={itemVariants}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              to="/dashboard"
              className="
                inline-flex items-center justify-center gap-2
                rounded-lg bg-[var(--color-accent)] px-4 py-2.5
                text-sm font-medium text-white
                transition-opacity hover:opacity-90
              "
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>

            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") window.history.back();
              }}
              className="
                inline-flex items-center justify-center gap-2
                rounded-lg border border-[var(--color-border)]
                bg-white px-4 py-2.5
                text-sm font-medium text-[var(--color-text)]
                transition-colors hover:bg-[var(--color-surface)]
              "
            >
              <Search className="h-4 w-4 text-[var(--color-text)]/60" />
              Go back
            </button>
          </motion.div>

          {/* Footer hint */}
          <motion.div
            variants={itemVariants}
            className="mt-10 text-xs text-[var(--color-text)]/40"
          >
            Error 404 · BizPilot AI
          </motion.div>
        </div>
      </motion.div>
    </AppShell>
  );
}
