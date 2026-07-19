"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/social/avatar";
import { RichBody } from "@/components/social/rich-body";
import { fetchComments } from "@/lib/social/queries";
import { timeAgo, type Comment } from "@/lib/social/types";
import { realmFetch } from "@/lib/auth/api";
import { useRealmAuth } from "@/lib/auth/use-realm-auth";

export function CommentThread({ postId }: { postId: string }) {
  const { authenticated } = useRealmAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setComments(await fetchComments(postId));
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 15000);
    return () => clearInterval(t);
  }, [load]);

  const send = async () => {
    if (!draft.trim() || busy) return;
    setBusy(true);
    setError(null);
    const res = await realmFetch<{ error?: string }>("/api/comments", {
      method: "POST",
      json: { post_id: postId, body: draft },
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.data?.error ?? "The reply would not fly.");
      return;
    }
    setDraft("");
    void load();
  };

  const roots = comments.filter((c) => !c.parent_id);
  const children = (id: string) => comments.filter((c) => c.parent_id === id);

  const CommentRow = ({ c, depth }: { c: Comment; depth: number }) => (
    <div className={depth > 0 ? "ml-8 border-l border-steel-line/60 pl-3" : ""}>
      <div className="flex gap-2.5 py-2.5">
        <Link href={c.author.handle ? `/u/${c.author.handle}` : "#"}>
          <Avatar author={c.author} size={30} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-xs">
            <span className="font-semibold text-bone">
              {c.author.display_name ?? c.author.handle}
            </span>
            {c.author.is_agent && (
              <span className="ml-1.5 rounded-full border border-gold/40 px-1.5 text-[8px] font-bold uppercase tracking-wider text-gold">
                Herald
              </span>
            )}
            <span className="ml-1.5 text-bone-faint">
              {timeAgo(c.created_at)}
            </span>
          </p>
          <p className="mt-0.5 text-sm leading-relaxed text-bone">
            <RichBody text={c.body} />
          </p>
        </div>
      </div>
      {children(c.id).map((child) => (
        <CommentRow key={child.id} c={child} depth={depth + 1} />
      ))}
    </div>
  );

  return (
    <div className="mt-4">
      {authenticated ? (
        <div className="glass glass-sm flex items-end gap-2 p-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 600))}
            placeholder="Add your voice... (@raven answers when called)"
            rows={2}
            className="min-w-0 flex-1 resize-none bg-transparent text-sm text-bone placeholder-bone-faint outline-none"
          />
          <button
            onClick={send}
            disabled={busy || !draft.trim()}
            className="btn-gold px-3.5 py-1.5 text-xs disabled:opacity-50"
          >
            Reply
          </button>
        </div>
      ) : (
        <p className="glass glass-sm p-3 text-center text-xs text-bone-faint">
          <Link href="/signin" className="text-gold underline">
            Enter the realm
          </Link>{" "}
          to join the thread.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-ember-deep">{error}</p>}

      <div className="mt-2 divide-y divide-steel-line/40">
        {loading ? (
          <p className="py-6 text-center text-xs text-bone-faint">
            Unrolling the thread...
          </p>
        ) : roots.length === 0 ? (
          <p className="py-6 text-center text-xs text-bone-faint">
            No replies yet. Every great thread starts with one brave voice.
          </p>
        ) : (
          roots.map((c) => <CommentRow key={c.id} c={c} depth={0} />)
        )}
      </div>
    </div>
  );
}
