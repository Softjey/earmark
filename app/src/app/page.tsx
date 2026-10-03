import { ProgressBar } from "@/components/ProgressBar";
import { StatusBadge } from "@/components/StatusBadge";
import { VerifiedBadge } from "@/components/VerifiedBadge";

// Placeholder until T10 (fundraiser list) replaces it.
export default function Home() {
  return (
    <div className="flex max-w-md flex-col gap-4 rounded-card border border-line bg-surface p-6">
      <h1 className="text-3xl font-bold tracking-tight">Earmark</h1>
      <p className="text-muted">Scaffold is up. The fundraiser list lands in T10.</p>
      <StatusBadge status="active" detail="ends 10 Oct 2026" />
      <VerifiedBadge />
      <ProgressBar raised={600} target={1000} />
    </div>
  );
}
