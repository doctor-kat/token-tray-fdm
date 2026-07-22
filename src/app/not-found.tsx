import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="text-lg font-semibold">This page doesn&apos;t exist</h1>
      </div>
      <Link
        href="/"
        className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Back to the tray
      </Link>
    </div>
  );
}
