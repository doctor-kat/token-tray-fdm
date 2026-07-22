"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">The tray generator hit a snag</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Something went wrong while building the model. This can happen if the WASM geometry kernel
          failed to load. Try again, or reload the page.
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
