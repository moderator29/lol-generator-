"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";

/* Copies a value to the clipboard and flashes a confirmation. Stays quiet and
   honest if the clipboard API is unavailable rather than pretending it worked. */
export function CopyButton({
  value,
  label = "Copy",
  className = "btn-glass inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 text-xs",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable; do nothing loud */
    }
  };

  return (
    <button type="button" onClick={() => void copy()} className={className}>
      <Icon name={copied ? "medal" : "scroll"} className="h-3.5 w-3.5" />
      {copied ? "Copied" : label}
    </button>
  );
}
