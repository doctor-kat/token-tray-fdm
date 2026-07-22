export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-muted-foreground">
      <div
        aria-hidden
        className="size-8 animate-spin rounded-full border-2 border-current border-t-transparent"
      />
      <p className="text-sm font-medium">Loading the tray workshop…</p>
    </div>
  );
}
