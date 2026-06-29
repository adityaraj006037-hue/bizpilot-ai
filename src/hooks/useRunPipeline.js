import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

const FORMSPREE_BASE = "https://formspree.io/f";
const MAX_LOGS = 500;
const SUBSCRIBE_TIMEOUT_MS = 3000;

function newId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * useRunPipeline — full lifecycle manager for a BizPilot pipeline run.
 *
 * State machine: idle -> submitting -> running -> streaming -> complete | error
 *
 * Responsibilities:
 *   1. Generate a run_id and fire a best-effort backup log to Formspree.
 *   2. Subscribe to Supabase Realtime on agent_logs filtered by run_id BEFORE
 *      hitting the backend, so we don't miss early events.
 *   3. POST to VITE_API_BASE_URL/api/run and wait for the final response.
 *   4. Hydrate the result by reading the persisted lead, emails, and follow-ups.
 *   5. Surface logs, result, status, error, and a reset() helper to the UI.
 */
export function useRunPipeline() {
  const [status, setStatus] = useState("idle");
  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [runId, setRunId] = useState(null);

  const channelRef = useRef(null);
  const abortedRef = useRef(false);
  const currentRunIdRef = useRef(null);

  const cleanup = useCallback(() => {
    const channel = channelRef.current;
    if (channel) {
      try {
        supabase.removeChannel(channel);
      } catch (_) {
        // Channel may already be closed; safe to ignore.
      }
      channelRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    abortedRef.current = true;
    currentRunIdRef.current = null;
    cleanup();
    setStatus("idle");
    setLogs([]);
    setResult(null);
    setError(null);
    setRunId(null);
  }, [cleanup]);

  // Tear down the realtime channel on unmount.
  useEffect(() => () => cleanup(), [cleanup]);

  const subscribeToRun = useCallback(
    (targetRunId) =>
      new Promise((resolve) => {
        cleanup();

        const channel = supabase
          .channel(`run-${targetRunId}`, { config: { broadcast: { self: false } } })
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "agent_logs",
              filter: `run_id=eq.${targetRunId}`,
            },
            (payload) => {
              if (
                abortedRef.current ||
                currentRunIdRef.current !== targetRunId
              ) {
                return;
              }
              const row = payload?.new;
              if (!row || !row.id) return;

              setLogs((prev) => {
                if (prev.some((l) => l.id === row.id)) return prev;
                const next = [
                  ...prev,
                  {
                    id: row.id,
                    agent: row.agent,
                    message: row.message,
                    created_at: row.created_at,
                  },
                ];
                return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next;
              });
            }
          );

        let settled = false;
        const settle = () => {
          if (settled) return;
          settled = true;
          resolve(channel);
        };
        const safety = setTimeout(settle, SUBSCRIBE_TIMEOUT_MS);

        channel.subscribe((subStatus) => {
          if (subStatus === "SUBSCRIBED") {
            clearTimeout(safety);
            settle();
          } else if (
            subStatus === "CHANNEL_ERROR" ||
            subStatus === "TIMED_OUT" ||
            subStatus === "CLOSED"
          ) {
            // Don't block the pipeline if realtime isn't ready — the HTTP
            // response is the source of truth for the final result.
            clearTimeout(safety);
            settle();
          }
        });

        channelRef.current = channel;
      }),
    [cleanup]
  );

  const run = useCallback(
    async ({ company, industry, userId }) => {
      if (!company || !String(company).trim()) {
        throw new Error("Company is required");
      }
      if (!industry || !String(industry).trim()) {
        throw new Error("Industry is required");
      }
      if (!userId) {
        throw new Error("Authentication required");
      }

      // Reset state for a new run.
      cleanup();
      abortedRef.current = false;
      setLogs([]);
      setResult(null);
      setError(null);

      const newRunId = newId();
      currentRunIdRef.current = newRunId;
      setRunId(newRunId);
      setStatus("submitting");

      // 1) Backup log to Formspree (fire-and-forget).
      const formspreeId = import.meta.env.VITE_FORMSPREE_CONTACT_ID;
      if (formspreeId) {
        fetch(`${FORMSPREE_BASE}/${formspreeId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            _subject: `BizPilot run: ${company}`,
            source: "run-pipeline",
            company,
            industry,
            user_id: userId,
            run_id: newRunId,
          }),
        }).catch(() => {
          // Formspree is a backup; never let it fail the run.
        });
      }

      // 2) Subscribe to Supabase Realtime BEFORE the backend call so we
      //    don't miss the first "Scout starting" event.
      await subscribeToRun(newRunId);
      setStatus("running");

      // 3) Call the backend.
      const apiBase = import.meta.env.VITE_API_BASE_URL;
      if (!apiBase) {
        abortedRef.current = true;
        currentRunIdRef.current = null;
        const msg = "VITE_API_BASE_URL is not configured";
        setError(msg);
        setStatus("error");
        cleanup();
        throw new Error(msg);
      }

      try {
        const res = await fetch(`${apiBase.replace(/\/$/, "")}/api/run`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            company: String(company).trim(),
            industry: String(industry).trim(),
            user_id: userId,
            run_id: newRunId,
          }),
        });

        if (!res.ok) {
          let detail = "";
          try {
            const data = await res.json();
            detail = data?.detail || data?.message || JSON.stringify(data);
          } catch (_) {
            try {
              detail = await res.text();
            } catch (_) {
              detail = "";
            }
          }
          throw new Error(detail || `Backend returned ${res.status}`);
        }

        const data = await res.json();
        if (!data?.success || !data?.lead_id) {
          throw new Error("Backend reported pipeline failure");
        }

        setStatus("streaming");

        // 4) Hydrate from Supabase.
        const [leadRes, emailsRes, followupsRes] = await Promise.all([
          supabase
            .from("leads")
            .select("*")
            .eq("id", data.lead_id)
            .maybeSingle(),
          supabase
            .from("emails")
            .select("*")
            .eq("lead_id", data.lead_id)
            .order("variant", { ascending: true }),
          supabase
            .from("followups")
            .select("*")
            .eq("lead_id", data.lead_id)
            .order("day", { ascending: true }),
        ]);

        if (leadRes.error) {
          throw new Error(`Failed to load lead: ${leadRes.error.message}`);
        }
        if (!leadRes.data) {
          throw new Error("Lead not found after save");
        }

        setResult({
          ...leadRes.data,
          emails: emailsRes.data || [],
          followups: followupsRes.data || [],
        });
        setStatus("complete");

        // Keep the subscription open briefly to catch any tail-end logs.
        const myRunId = newRunId;
        setTimeout(() => {
          if (currentRunIdRef.current === myRunId) cleanup();
        }, 1500);

        return data;
      } catch (err) {
        if (currentRunIdRef.current === newRunId) {
          setError(err?.message || "Pipeline failed");
          setStatus("error");
          cleanup();
        }
        throw err;
      }
    },
    [cleanup, subscribeToRun]
  );

  return { run, status, logs, result, error, runId, reset };
}

export default useRunPipeline;
