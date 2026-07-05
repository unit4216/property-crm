"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Collapse from "@mui/material/Collapse";

// Reads a one-off success message off the URL (set by a server action right
// before it redirects here) and shows it as a dismissable inline banner —
// not a Snackbar, since it should stay put until the user closes it rather
// than auto-hiding like a toast.
export function SuccessBanner({ param = "success" }: { param?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const message = searchParams.get(param);
  const [dismissed, setDismissed] = useState(false);

  if (!message || dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
    const next = new URLSearchParams(searchParams.toString());
    next.delete(param);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <Collapse in>
      <Alert severity="success" onClose={handleDismiss} sx={{ mb: 3 }}>
        {message}
      </Alert>
    </Collapse>
  );
}
