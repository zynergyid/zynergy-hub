import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowDownLeft, ArrowLeft, CalendarClock, FileText, ListChecks, Wallet } from "lucide-react";
import { canEditMoney, canEditTeam, canSeeMoney, getSessionUser } from "@/lib/session";
import { getLinkedEvents } from "@/lib/calendar";
import { EventsCard } from "@/components/hub/EventsCard";
import { canWriteUnit } from "@/lib/access";
import { getPayloadClient } from "@/lib/payload";
import { getClientOptions } from "@/lib/orders";
import { clientOfProject, deliverableProgress, getProjectPayments, getUserOptions, isOpenProject, nextPayment, ownerOfProject, projectUnitsOf } from "@/lib/projects";
import { daysLabel, formatDate, formatIDR } from "@/lib/format";
import { projectDocumentKinds, unitLabel } from "@/lib/options";
import { first, type Search } from "@/lib/search";
import { Card } from "@/components/hub/Card";
import { DocumentsCard } from "@/components/hub/DocumentsCard";
import { KpiCard } from "@/components/hub/KpiCard";
import { HealthPill, ProjectStagePill } from "@/components/hub/ProjectPills";
import { TxList } from "@/components/hub/TxList";
import { BriefCard } from "../BriefCard";
import { DeliverablesCard } from "../DeliverablesCard";
import { LogCard } from "../LogCard";
import { HealthCard, StageCard } from "../ProgressCards";
import { ProjectInfoCard } from "../ProjectInfoCard";
import { addProjectDocument, removeProjectDocument } from "../actions";

export const metadata: Metadata = { title: "Detail proyek" };
export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Search> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const projectId = Number(id);
  if (!projectId) notFound();
  const sp = await searchParams;

  const payload = await getPayloadClient();
  const project = await payload.findByID({ collection: "projects", id: projectId, depth: 1, disableErrors: true });
  if (!project || !user.units.includes(project.unit)) notFound();
  const money = canSeeMoney(user);
  const editable = canWriteUnit(user, project.unit, "editProjects");
  const [clients, owners, payments] = await Promise.all([
    getClientOptions(projectUnitsOf(user.units)),
    getUserOptions(),
    money ? getProjectPayments(projectId) : Promise.resolve({ rows: [], paid: 0, cost: 0 }),
  ]);
  const client = clientOfProject(project);
  const owner = ownerOfProject(project);
  const open = isOpenProject(project);
  const value = project.value ?? 0;
  const remaining = Math.max(value - payments.paid, 0);
  const due = nextPayment(project, payments.paid);
  const progress = deliverableProgress(project);
  const addPaymentHref = `/cash-flow?unit=${project.unit}&add=1&project=${project.id}`;
  const canPay = canEditMoney(user) && open && due !== null;
  const events = await getLinkedEvents({ project: project.id });
  const targetCard = (
    <KpiCard
      icon={CalendarClock}
      label="Target launch"
      value={project.targetDate ? formatDate(project.targetDate) : "-"}
      hint={project.targetDate ? (open ? daysLabel(project.targetDate) : "selesai") : "belum ditentukan"}
      tone={project.targetDate && open ? "primary" : "neutral"}
    />
  );
  const deliverableCard = <KpiCard icon={ListChecks} label="Deliverable" value={`${progress.done}/${progress.total}`} hint="selesai dari daftar scope" tone={progress.total && progress.done === progress.total ? "in" : "neutral"} />;

  return (
    <div className="space-y-5">
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary">
        <ArrowLeft className="size-4" />
        Semua proyek
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight">{project.name}</h1>
            <ProjectStagePill stage={project.stage} />
            <HealthPill health={project.health} />
          </div>
          <p className="text-sm text-muted">
            {client ? (
              <Link href={`/clients/${client.id}`} className="font-semibold hover:text-primary">{client.name}</Link>
            ) : (
              "klien terhapus"
            )}
            {" "}· {unitLabel.get(project.unit)}
            {owner ? ` · PJ ${owner.name}` : ""}
            {project.startDate ? ` · mulai ${formatDate(project.startDate)}` : ""}
          </p>
        </div>
        {canPay && (
          <Link href={addPaymentHref} className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold text-white hover:bg-secondary-dark">
            <ArrowDownLeft className="size-4" />
            Catat {due.label}
          </Link>
        )}
      </div>

      {/* Money figures only once there is a price; before that they are three zeros. */}
      {money && value > 0 ? (
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <KpiCard icon={FileText} label="Nilai proyek" value={formatIDR(value)} hint={`DP ${project.dpPercent ?? 0}%`} tone="primary" />
          <KpiCard icon={ArrowDownLeft} label="Sudah dibayar" value={formatIDR(payments.paid)} hint={payments.cost ? `biaya terkait ${formatIDR(payments.cost)}` : undefined} tone="in" />
          <KpiCard icon={Wallet} label="Sisa tagihan" value={formatIDR(remaining)} tone={remaining ? "out" : "neutral"} hint={due ? `berikutnya ${due.label} ${formatIDR(due.amount)}` : value ? "lunas" : undefined} />
          {deliverableCard}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {deliverableCard}
          {targetCard}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="min-w-0 space-y-5 lg:col-span-3">
          <StageCard project={project} editable={editable} error={first(sp.error)} />
          <HealthCard project={project} editable={editable} />
        </div>
        <div className="min-w-0 lg:col-span-2">
          <ProjectInfoCard project={project} open={open} units={projectUnitsOf(user.units)} clients={clients} owners={owners} currentUserId={user.id} editable={editable} showMoney={money} />
        </div>
      </div>

      {/* The brief is the longest text on the page, so it gets the full width. */}
      <BriefCard project={project} editable={editable} />

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="min-w-0 space-y-5 lg:col-span-3">
          <DeliverablesCard project={project} editable={editable} />
          <LogCard project={project} editable={editable} />
        </div>
        <div className="min-w-0 space-y-5 lg:col-span-2">
          <EventsCard events={events} newHref={canEditTeam(user) ? `/calendar/new?proyek=${project.id}` : undefined} />
          <DocumentsCard
            rows={project.documents ?? []}
            kinds={projectDocumentKinds}
            defaultKind="scope"
            editable={editable}
            error={first(sp.error)}
            ownerField="projectId"
            ownerId={project.id}
            addAction={addProjectDocument}
            removeAction={removeProjectDocument}
            empty="Belum ada dokumen. Unggah brief dan scope yang disetujui."
          />
          {money && (
            <Card title="Transaksi proyek ini" action={canPay ? { label: `Catat ${due.label}`, href: addPaymentHref } : undefined}>
              <TxList rows={payments.rows} editable={canEditMoney(user)} empty="Belum ada DP atau biaya yang ditautkan ke proyek ini." />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
