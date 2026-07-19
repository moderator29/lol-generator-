"use client";

import { useEffect, useState } from "react";
import { realmFetch } from "@/lib/auth/api";
import { Icon } from "@/components/ui/icon";

interface ReportRow {
  id: string;
  subject_type: string;
  subject_id: string;
  reason: string;
  status: string;
  created_at: string;
  reporter: { handle: string | null; display_name: string | null } | null;
}

function reporterName(r: ReportRow["reporter"]): string {
  if (!r) return "Anonymous";
  return r.display_name?.trim() || (r.handle ? `@${r.handle}` : "Anonymous");
}

export default function AdminModerationPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "sealed" | "error">(
    "loading"
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void realmFetch<{ reports: ReportRow[] }>("/api/admin/reports").then(
      (res) => {
        if (cancelled) return;
        if (res.status === 401 || res.status === 403) {
          setStatus("sealed");
        } else if (res.ok && res.data?.reports) {
          setReports(res.data.reports);
          setStatus("ok");
        } else {
          setStatus("error");
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  async function act(id: string, action: "resolve" | "dismiss") {
    setBusyId(id);
    setNote(null);
    const res = await realmFetch<{ ok?: boolean }>("/api/admin/reports", {
      method: "POST",
      json: { report_id: id, action },
    });
    if (res.ok && res.data?.ok) {
      setReports((rows) => rows.filter((r) => r.id !== id));
    } else {
      setNote("The judgment did not land. Try again.");
    }
    setBusyId(null);
  }

  if (status === "sealed") {
    return (
      <div className="glass p-8 text-center">
        <Icon name="lock" className="mx-auto h-6 w-6 text-bone-faint" />
        <p className="gold-text font-display mt-3 text-xl font-semibold">
          The council chamber is sealed
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-bone sm:text-2xl">
        Moderation
      </h1>
      <p className="mt-1 text-xs uppercase tracking-[0.26em] text-bone-faint">
        Open reports before the council
      </p>

      {note && <p className="mt-3 text-xs text-ember">{note}</p>}

      <div className="glass mt-4 overflow-x-auto">
        {status === "loading" ? (
          <div className="h-40 animate-pulse" />
        ) : status === "error" ? (
          <p className="p-6 text-sm text-bone-mut">
            The docket could not be read. Try again shortly.
          </p>
        ) : reports.length === 0 ? (
          <div className="flex items-center gap-3 p-6">
            <Icon name="shield" className="h-5 w-5 text-bone-faint" />
            <p className="text-sm text-bone-mut">
              The realm rests. No open reports.
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead>
              <tr className="border-b border-steel-line text-[10px] uppercase tracking-[0.2em] text-bone-faint">
                <th className="px-4 py-3 font-medium">Reporter</th>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Filed</th>
                <th className="px-4 py-3 font-medium">Judgment</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-b border-steel-line last:border-b-0">
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-bone">
                    {reporterName(r.reporter)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-bone-mut">
                    <span className="capitalize">{r.subject_type}</span>
                    <span className="tnum ml-2 text-xs text-bone-faint">
                      {r.subject_id.slice(0, 8)}
                    </span>
                  </td>
                  <td className="max-w-[16rem] px-4 py-3 text-bone-mut">
                    {r.reason}
                  </td>
                  <td className="tnum whitespace-nowrap px-4 py-3 text-xs text-bone-faint">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn-gold px-3 py-1 text-xs"
                        disabled={busyId === r.id}
                        onClick={() => void act(r.id, "resolve")}
                      >
                        Resolve
                      </button>
                      <button
                        type="button"
                        className="btn-glass px-3 py-1 text-xs"
                        disabled={busyId === r.id}
                        onClick={() => void act(r.id, "dismiss")}
                      >
                        Dismiss
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
