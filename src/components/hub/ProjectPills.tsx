import { cn } from "@/lib/cn";
import { projectHealthLabel, projectStageLabel, type ProjectHealth, type ProjectStage } from "@/lib/options";

const stageTone: Record<ProjectStage, string> = {
  discovery: "bg-surface-soft text-muted",
  scope: "bg-primary-soft text-primary-dark",
  kickoff: "bg-primary-soft text-primary-dark",
  desain: "bg-fuchsia-50 text-fuchsia-700",
  build: "bg-sky-50 text-sky-700",
  review: "bg-amber-50 text-amber-700",
  launch: "bg-secondary-soft text-secondary-dark",
  selesai: "bg-secondary-soft text-secondary-dark",
  batal: "bg-surface-soft text-muted",
};

export function ProjectStagePill({ stage, className }: { stage: ProjectStage; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold", stageTone[stage], className)}>
      {projectStageLabel.get(stage)}
    </span>
  );
}

const healthDot: Record<ProjectHealth, string> = { lancar: "bg-secondary", berisiko: "bg-amber-500", terhambat: "bg-red-500" };
const healthTone: Record<ProjectHealth, string> = {
  lancar: "bg-secondary-soft text-secondary-dark",
  berisiko: "bg-amber-50 text-amber-700",
  terhambat: "bg-red-50 text-red-700",
};

/** The weekly red, amber, green flag: a dot with its word. */
export function HealthPill({ health, className }: { health: ProjectHealth; className?: string }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold", healthTone[health], className)}>
      <span className={cn("size-1.5 rounded-full", healthDot[health])} aria-hidden />
      {projectHealthLabel.get(health)}
    </span>
  );
}
