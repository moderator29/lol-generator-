"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { PostCard } from "@/components/social/post-card";
import { CommentThread } from "@/components/social/comment-thread";
import { fetchPost } from "@/lib/social/queries";
import type { Post } from "@/lib/social/types";
import { Icon } from "@/components/ui/icon";

export default function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [post, setPost] = useState<Post | null | "loading">("loading");

  useEffect(() => {
    void fetchPost(id).then(setPost);
  }, [id]);

  return (
    <div className="mx-auto w-full max-w-2xl px-3 py-4 sm:px-4 sm:py-6">
      <Link
        href="/home"
        className="mb-4 inline-flex items-center gap-2 text-xs text-bone-faint hover:text-bone-mut"
      >
        <Icon name="arrow" className="h-4 w-4 rotate-180" />
        Back to the Ravenry
      </Link>
      {post === "loading" ? (
        <div className="glass glass-sm h-32 animate-pulse" />
      ) : post === null ? (
        <div className="glass p-8 text-center text-sm text-bone-mut">
          This raven flew beyond the realm, or never was.
        </div>
      ) : (
        <>
          <PostCard post={post} />
          <CommentThread postId={post.id} />
        </>
      )}
    </div>
  );
}
